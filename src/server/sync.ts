import { createServerFn } from "@tanstack/react-start";
import { sql, ensureAccountTables } from "~/db";
import {
  DIAGNOSTICS_WINDOW_DAYS,
  MAX_DIAGNOSTICS_EVENTS,
} from "~/data/settings";

/**
 * Server seam for account sync — Phase 1 (anonymous id + cross-device sync).
 * Built on the existing createServerFn / sql() pattern (feedback.ts is the
 * model: validator + ensureAccountTables() + sql()).
 *
 * Sync model (§4.3 of account-infrastructure-design.md):
 *  - Blobs (progress, settings, placement-result, etc.) → per-key last-write-
 *    wins. Rows store { payload, updated_at, device_id }; payloads keep their
 *    exact shapes so Latin data is byte-identical.
 *  - Diagnostics → row-per-event, INSERT … ON CONFLICT DO NOTHING (exactly-
 *    once append), then server-side window/cap pruning.
 *
 * Phase 1 trusts client-supplied ids (documented tradeoff; Phase 2 binds
 * auth_sub). Clock skew is clamped server-side: min(client_ts, server_now+5m).
 */

/** One sync blob as sent by the client. payload is the exact localStorage value. */
export interface SyncBlobInput {
  key: string;
  payload: unknown;
  updated_at: string; // ISO 8601, client-stamped
}

/** One diagnostic event as sent by the client. event is the raw DiagnosticEvent. */
export interface SyncEventInput {
  id: string;
  lang: string; // routing field (event ids are only unique per browser)
  ts: string; // ISO 8601
  event: unknown;
}

export interface PushStateInput {
  userId: string;
  deviceId: string; // this device's stable id (conflict attribution)
  blobs: SyncBlobInput[];
  events: SyncEventInput[];
}

export interface PullStateInput {
  userId: string;
}

/** One stored blob row returned to the client. Dates coerced to ISO strings. */
export interface ServerBlobRow {
  key: string;
  payload: string; // JSON string — client parses
  updated_at: string;
  device_id: string;
}

/** One stored diagnostic event returned to the client. */
export interface ServerEventRow {
  id: string;
  lang: string;
  ts: string;
  event: string; // JSON string
}

export interface SyncStateResult {
  blobs: ServerBlobRow[];
  events: ServerEventRow[];
  serverNow: string;
}

const CLOCK_SKEW_ALLOWANCE_MS = 5 * 60 * 1000;

/** Coerce a DB column to a JSON string for return to the client. */
function toJsonString(v: unknown): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return "null";
  }
}

function parseTs(v: unknown): number {
  const t = new Date(String(v ?? "")).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export const pullState = createServerFn()
  .validator((data: unknown): PullStateInput => {
    const d = data as Record<string, unknown>;
    if (typeof d.userId !== "string" || !d.userId.startsWith("user_")) {
      throw new Error("Invalid userId");
    }
    return { userId: d.userId };
  })
  .handler(async ({ data }): Promise<SyncStateResult> => {
    await ensureAccountTables();
    const db = sql();
    const [user] = await db`SELECT id FROM users WHERE id = ${data.userId}`;
    if (!user) {
      // Unknown user → nothing exists yet; client will claim on first push.
      return { blobs: [], events: [], serverNow: new Date().toISOString() };
    }
    const blobRows = await db`
      SELECT key, payload, updated_at, device_id
      FROM user_state WHERE user_id = ${data.userId}
    `;
    const eventRows = await db`
      SELECT event_id, event, ts, event->>'lang' AS lang
      FROM diagnostics_events WHERE user_id = ${data.userId}
    `;
    return {
      blobs: blobRows.map((b) => ({
        key: String(b.key),
        payload: toJsonString(b.payload),
        updated_at: new Date(parseTs(b.updated_at)).toISOString(),
        device_id: String(b.device_id),
      })),
      events: eventRows.map((e) => ({
        id: String(e.event_id),
        lang: String(e.lang ?? "latin"),
        ts: new Date(parseTs(e.ts)).toISOString(),
        event: toJsonString(e.event),
      })),
      serverNow: new Date().toISOString(),
    };
  });

export const pushState = createServerFn()
  .validator((data: unknown): PushStateInput => {
    const d = data as Record<string, unknown>;
    if (typeof d.userId !== "string" || !d.userId.startsWith("user_")) {
      throw new Error("Invalid userId");
    }
    if (typeof d.deviceId !== "string" || !d.deviceId.startsWith("dev_")) {
      throw new Error("Invalid deviceId");
    }
    const blobs = Array.isArray(d.blobs)
      ? (d.blobs as SyncBlobInput[]).filter(
          (b) => b && typeof b.key === "string" && b.updated_at != null,
        )
      : [];
    const events = Array.isArray(d.events)
      ? (d.events as SyncEventInput[]).filter(
          (e) => e && typeof e.id === "string" && typeof e.lang === "string",
        )
      : [];
    return { userId: d.userId, deviceId: d.deviceId, blobs, events };
  })
  .handler(async ({ data }): Promise<SyncStateResult> => {
    await ensureAccountTables();
    const db = sql();
    const serverNow = new Date();
    // Ensure the user row exists (first claim).
    await db`
      INSERT INTO users (id) VALUES (${data.userId})
      ON CONFLICT (id) DO NOTHING
    `;
    // Upsert blobs with per-key last-write-wins; tie → lexicographic device_id
    // for determinism. updated_at is clamped to server_now + 5min (clock skew).
    const clampMax = serverNow.getTime() + CLOCK_SKEW_ALLOWANCE_MS;
    for (const blob of data.blobs) {
      const clamped = new Date(
        Math.min(new Date(blob.updated_at).getTime(), clampMax),
      ).toISOString();
      await db`
        INSERT INTO user_state (user_id, key, payload, updated_at, device_id)
        VALUES (
          ${data.userId}, ${blob.key},
          ${JSON.stringify(blob.payload ?? null)},
          ${clamped}, ${data.deviceId}
        )
        ON CONFLICT (user_id, key) DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = EXCLUDED.updated_at,
          device_id = EXCLUDED.device_id
        WHERE EXCLUDED.updated_at > user_state.updated_at
           OR (EXCLUDED.updated_at = user_state.updated_at
               AND EXCLUDED.device_id > user_state.device_id)
      `;
    }
    // Events: exactly-once append.
    for (const ev of data.events) {
      const ts = new Date(ev.ts).toISOString();
      const stored = { ...(ev.event as Record<string, unknown>), lang: ev.lang };
      await db`
        INSERT INTO diagnostics_events (user_id, event_id, event, ts)
        VALUES (${data.userId}, ${ev.id}, ${JSON.stringify(stored)}, ${ts})
        ON CONFLICT (user_id, event_id) DO NOTHING
      `;
    }
    // Server-side window/cap pruning (mirrors storage.ts pruneEvents).
    const dayMs = 86_400_000;
    const windowStart = new Date(
      serverNow.getTime() - DIAGNOSTICS_WINDOW_DAYS * dayMs,
    ).toISOString();
    await db`
      DELETE FROM diagnostics_events
      WHERE user_id = ${data.userId} AND ts < ${windowStart}
    `;
    await db`
      WITH ranked AS (
        SELECT event_id,
               row_number() OVER (ORDER BY ts DESC, event_id DESC) AS rn
        FROM diagnostics_events WHERE user_id = ${data.userId}
      )
      DELETE FROM diagnostics_events
      WHERE user_id = ${data.userId}
        AND event_id IN (SELECT event_id FROM ranked WHERE rn > ${MAX_DIAGNOSTICS_EVENTS})
    `;
    await db`UPDATE users SET last_seen_at = NOW() WHERE id = ${data.userId}`;
    // Return the canonical merged state so the client can reconcile in one
    // round-trip without a separate pull.
    const blobRows = await db`
      SELECT key, payload, updated_at, device_id
      FROM user_state WHERE user_id = ${data.userId}
    `;
    const eventRows = await db`
      SELECT event_id, event, ts, event->>'lang' AS lang
      FROM diagnostics_events WHERE user_id = ${data.userId}
    `;
    return {
      blobs: blobRows.map((b) => ({
        key: String(b.key),
        payload: toJsonString(b.payload),
        updated_at: new Date(parseTs(b.updated_at)).toISOString(),
        device_id: String(b.device_id),
      })),
      events: eventRows.map((e) => ({
        id: String(e.event_id),
        lang: String(e.lang ?? "latin"),
        ts: new Date(parseTs(e.ts)).toISOString(),
        event: toJsonString(e.event),
      })),
      serverNow: new Date().toISOString(),
    };
  });
