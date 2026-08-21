/**
 * sync.ts — Engine department: the client-side sync engine for Phase 1
 * (anonymous id + cross-device sync). account-infrastructure-design.md §4.5/§4.3.
 *
 *  - Offline-first, NEVER a gate: sync is a background merge. Local writes always
 *    land first; sync only pushes what changed since the last sync.
 *  - SSR stays anonymous: every entry point guards with isClient(); sync is
 *    client-side only, never in SSR (§3 line 51).
 *  - No DATABASE_URL configured → the server fns throw; we catch, log once, and
 *    no-op. The app stays fully functional offline / without a DB.
 *  - Blobs → per-key last-write-wins with a {payload, updated_at, device_id}
 *    envelope on the server; payloads keep their exact shapes (byte-identical
 *    Latin data). Diagnostics → row-per-event, exactly-once append.
 *
 * The route calls initAccountSync() (client-side) once; this module owns the
 * identity-claim (first-sync claim, §4.5) and all listeners.
 */
import { useEffect } from "react";
import { pushState, pullState, type SyncStateResult } from "~/server/sync";
import type { Language } from "~/data/languages";
import {
  isClient,
  languageKey,
  loadJSON,
  saveJSON,
  loadDiagnostics,
  saveDiagnostics,
  ensureUserIdentity,
  markIdentityClaimed,
  STORAGE_KEYS,
} from "~/engine/storage";
import { loadProgress } from "~/engine/progress";

/** Per-browser bookkeeping for change-detection + per-key LWW timestamps. */
const SYNC_CLOCK_KEY = "verbum-sync-clock";
/** Max event ts already pushed (so we only push new diagnostics). */
const SYNC_EVENT_MAX_KEY = "verbum-sync-events-max";

/** Background heartbeat cadence while the page is visible. */
const SYNC_INTERVAL_MS = 30_000;

const ALL_LANGS: Language[] = ["latin", "english", "greek", "hebrew"];

/** Language-scoped blob keys (absent payloads are skipped). */
const BLOB_BASE_KEYS = [
  STORAGE_KEYS.PLACEMENT_RESULT,
  STORAGE_KEYS.PRON_MODE,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.ACCURACY,
  STORAGE_KEYS.FEEDBACK,
  STORAGE_KEYS.IMPROVEMENT_STREAK,
  STORAGE_KEYS.SLEEP_AUDIO,
  STORAGE_KEYS.UNIT_REVIEW,
  STORAGE_KEYS.RECITATION,
];

type ClockMap = Record<string, { ts: string; fp: string }>;

function readClock(): ClockMap {
  if (!isClient()) return {};
  try {
    const raw = window.localStorage.getItem(SYNC_CLOCK_KEY);
    return raw ? (JSON.parse(raw) as ClockMap) : {};
  } catch {
    return {};
  }
}

function writeClockEntry(key: string, ts: string, fp: string): void {
  if (!isClient()) return;
  try {
    const c = readClock();
    c[key] = { ts, fp };
    window.localStorage.setItem(SYNC_CLOCK_KEY, JSON.stringify(c));
  } catch {
    /* unavailable */
  }
}

function readLastEventMax(): string | null {
  if (!isClient()) return null;
  try {
    return window.localStorage.getItem(SYNC_EVENT_MAX_KEY);
  } catch {
    return null;
  }
}

function writeLastEventMax(ts: string): void {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(SYNC_EVENT_MAX_KEY, ts);
  } catch {
    /* unavailable */
  }
}

/** Stable-enough change fingerprint of a JSON-serializable payload. */
function fpOf(v: unknown): string {
  try {
    return JSON.stringify(v) ?? "null";
  } catch {
    return String(v);
  }
}

interface PackedBlob {
  key: string;
  payload: unknown;
  updated_at: string;
  fp: string;
  changed: boolean;
}

/** Strip a trailing `-<language>` suffix, if any. */
function stripLang(key: string): { base: string; lang: Language | null } {
  for (const l of ALL_LANGS) {
    const suffix = "-" + l;
    if (key.endsWith(suffix)) return { base: key.slice(0, -suffix.length), lang: l };
  }
  return { base: key, lang: null };
}

/** Write one pulled blob into localStorage under its proper key. */
function applyBlob(key: string, payload: unknown): void {
  const { base, lang } = stripLang(key);
  if (lang) {
    if (base === STORAGE_KEYS.PROGRESS) {
      saveJSON(STORAGE_KEYS.PROGRESS, payload, lang);
    } else if (base === STORAGE_KEYS.PROGRESS_TOTALS) {
      saveJSON(STORAGE_KEYS.PROGRESS_TOTALS, payload, lang);
    } else if ((BLOB_BASE_KEYS as string[]).includes(base)) {
      saveJSON(base as never, payload, lang);
    }
    // unknown scoped key → ignore
  } else if (base === STORAGE_KEYS.CROSS_PROGRESS) {
    saveJSON(STORAGE_KEYS.CROSS_PROGRESS, payload, undefined);
  }
}

/** Current local value for a sync key, or null if absent. */
function localValue(key: string): unknown {
  const { base, lang } = stripLang(key);
  if (lang) {
    if (base === STORAGE_KEYS.PROGRESS) {
      const v = loadProgress(lang);
      return v.length > 0 ? v : null;
    }
    if (base === STORAGE_KEYS.PROGRESS_TOTALS) {
      return loadJSON(STORAGE_KEYS.PROGRESS_TOTALS, null, lang);
    }
    if ((BLOB_BASE_KEYS as string[]).includes(base)) {
      return loadJSON(base as never, null, lang);
    }
    return null;
  }
  if (base === STORAGE_KEYS.CROSS_PROGRESS) return loadJSON(STORAGE_KEYS.CROSS_PROGRESS, null, undefined);
  return null;
}

function packBlob(base: string, lang: Language | undefined, payload: unknown, now: string, clock: ClockMap): PackedBlob | null {
  if (payload == null) return null;
  const key = lang ? languageKey(base as never, lang) : (base as string);
  const fp = fpOf(payload);
  const prev = clock[key];
  const changed = !prev || prev.fp !== fp;
  return { key, payload, updated_at: changed ? now : prev.ts, fp, changed };
}

/** Pack all local blobs (all languages + legacy unscoped Latin + cross-progress). */
function packBlobs(now: string, clock: ClockMap): { blobs: PackedBlob[]; anyChanged: boolean } {
  const blobs: PackedBlob[] = [];
  let anyChanged = false;
  for (const lang of ALL_LANGS) {
    for (const base of BLOB_BASE_KEYS) {
      const v = loadJSON(base, null, lang);
      if (v == null) continue;
      const b = packBlob(base, lang, v, now, clock);
      if (b) {
        blobs.push(b);
        if (b.changed) anyChanged = true;
      }
    }
    const prog = loadProgress(lang);
    const pb = packBlob(STORAGE_KEYS.PROGRESS, lang, prog, now, clock);
    if (pb) {
      blobs.push(pb);
      if (pb.changed) anyChanged = true;
    }
    const totals = loadJSON(STORAGE_KEYS.PROGRESS_TOTALS, null, lang);
    if (totals != null) {
      const tb = packBlob(STORAGE_KEYS.PROGRESS_TOTALS, lang, totals, now, clock);
      if (tb) {
        blobs.push(tb);
        if (tb.changed) anyChanged = true;
      }
    }
  }
  const cross = loadJSON(STORAGE_KEYS.CROSS_PROGRESS, null, undefined);
  if (cross != null) {
    const cb = packBlob(STORAGE_KEYS.CROSS_PROGRESS, undefined, cross, now, clock);
    if (cb) {
      blobs.push(cb);
      if (cb.changed) anyChanged = true;
    }
  }
  return { blobs, anyChanged };
}

/** New diagnostics events since the last push (idempotent append, unioned by id). */
function packEvents(): { events: { id: string; lang: string; ts: string; event: unknown }[]; maxTs: string | null } {
  const lastMax = readLastEventMax();
  const out: { id: string; lang: string; ts: string; event: unknown }[] = [];
  let maxTs = lastMax;
  for (const lang of ALL_LANGS) {
    for (const e of loadDiagnostics(lang)) {
      if (!lastMax || e.ts > lastMax) {
        out.push({ id: e.id, lang, ts: e.ts, event: e });
        if (!maxTs || e.ts > maxTs) maxTs = e.ts;
      }
    }
  }
  return { events: out, maxTs };
}

/** Merge pulled events into the local per-language log (id-dedup + prune). */
function applyEvents(rows: { id: string; lang: string; ts: string; event: string }[]): void {
  const byLang = new Map<Language, Map<string, object>>();
  for (const row of rows) {
    const lang = (ALL_LANGS as string[]).includes(row.lang) ? (row.lang as Language) : "latin";
    let m = byLang.get(lang);
    if (!m) {
      m = new Map();
      byLang.set(lang, m);
    }
    try {
      const ev = JSON.parse(row.event) as object;
      m.set(row.id, ev);
    } catch {
      /* skip malformed */
    }
  }
  for (const [lang, m] of byLang) {
    const existing = loadDiagnostics(lang);
    const byId = new Map<string, object>();
    for (const e of existing) byId.set(e.id, e as unknown as object);
    let added = false;
    for (const [id, ev] of m) {
      if (!byId.has(id)) {
        byId.set(id, ev);
        added = true;
      }
    }
    if (added) {
      saveDiagnostics(
        [...byId.values()] as never,
        lang,
      );
    }
  }
}

/** Apply a server state result to localStorage (LWW per key, events unioned). */
function applyState(result: SyncStateResult): void {
  const clock = readClock();
  for (const blob of result.blobs) {
    let payload: unknown = null;
    try {
      payload = JSON.parse(blob.payload);
    } catch {
      continue;
    }
    const key = blob.key;
    const local = localValue(key);
    const localFp = local != null ? fpOf(local) : null;
    const lc = clock[key];
    const serverFp = fpOf(payload);
    if (local == null && !lc) {
      // fresh device with server data → adopt it
      applyBlob(key, payload);
      writeClockEntry(key, blob.updated_at, serverFp);
    } else if (lc) {
      if (lc.fp === localFp) {
        // local unchanged since last sync → server is canonical if newer
        if (blob.updated_at >= lc.ts) {
          applyBlob(key, payload);
          writeClockEntry(key, blob.updated_at, serverFp);
        }
      } else {
        // local changed since last sync → keep local; it will be pushed next
      }
    } else {
      // local present but never synced → keep local (claim will push it)
    }
  }
  if (result.events) applyEvents(result.events);
}

let running = false;
let noDbLogged = false;

/** One full sync cycle: push changed local → reconcile with canonical server state. */
export async function syncNow(): Promise<void> {
  if (!isClient() || running) return;
  running = true;
  try {
    const identity = ensureUserIdentity();
    const now = new Date().toISOString();
    const clock = readClock();
    const { blobs, anyChanged } = packBlobs(now, clock);
    const { events, maxTs } = packEvents();
    const firstSync = identity.claimedAt === null;
    const shouldPush = firstSync || anyChanged || events.length > 0;
    let result: SyncStateResult;
    if (shouldPush) {
      result = await pushState({
        data: {
          userId: identity.id,
          deviceId: identity.deviceId,
          blobs: blobs.map((b) => ({ key: b.key, payload: b.payload, updated_at: b.updated_at })),
          events,
        },
      });
      for (const b of blobs) writeClockEntry(b.key, b.updated_at, b.fp);
      if (maxTs) writeLastEventMax(maxTs);
      if (firstSync) markIdentityClaimed();
    } else {
      result = await pullState({ data: { userId: identity.id } });
    }
    applyState(result);
  } catch (e) {
    // DATABASE_URL absent / network error → graceful no-op (log once).
    if (!noDbLogged) {
      noDbLogged = true;
      console.warn("[eloqui sync] unavailable (no DATABASE_URL or network); continuing offline.", e);
    }
  } finally {
    running = false;
  }
}

let started = false;

/** Start the background sync engine (idempotent; call once from a route). */
export function initAccountSync(): void {
  if (!isClient() || started) return;
  started = true;
  void syncNow();
  const onTick = () => {
    if (document.visibilityState === "visible") void syncNow();
  };
  const onFlush = () => {
    void syncNow();
  };
  window.setInterval(onTick, SYNC_INTERVAL_MS);
  window.addEventListener("pagehide", onFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") onFlush();
  });
}

/** React hook for routes: boots the sync engine once on mount. */
export function useAccountSync(): void {
  useEffect(() => {
    initAccountSync();
  }, []);
}
