import { neon } from "@neondatabase/serverless";

/**
 * Server-only handle to the team's database (Neon serverless Postgres over HTTP).
 * The connection string comes from `DATABASE_URL`, which the owner connects via
 * the database card and which is injected into the sandbox and passed to the live
 * host on publish. Resolved lazily (per call, not at module load) so the site
 * still builds and serves before a database is connected — the error only
 * surfaces if a query actually runs without `DATABASE_URL`.
 *
 * Use it only inside a `createServerFn()` handler or an `src/routes/api/*` route
 * (never client code):
 *
 *   const getPosts = createServerFn().handler(async () => {
 *     const rows = await sql()`select id, title, created_at from posts`;
 *     // Coerce non-primitive columns (timestamps are JS Dates) to strings before
 *     // returning to the client, or React will refuse to render them:
 *     return rows.map((r) => ({ ...r, created_at: String(r.created_at) }));
 *   });
 */
export const sql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — connect a database (via the database card) before running queries.",
    );
  }
  return neon(url);
};

/**
 * Ensure the feedback table exists in the database.
 * Safe to call on every submit — uses IF NOT EXISTS.
 */
export async function ensureFeedbackTable() {
  await sql()`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      lesson_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

/**
 * Ensure the account infrastructure tables exist (account-infrastructure-design
 * §4.1): users, user_state (per-key last-write-wins sync blobs), and
 * diagnostics_events (row-per-event, exactly-once append). Safe to call on
 * every sync with IF NOT EXISTS, mirroring ensureFeedbackTable().
 *
 * Phase 1 trusts client-supplied user ids (a documented tradeoff — an
 * anonymous id is a bearer token; Phase 2 binds `auth_sub`); `entitlements`
 * is Phase 3 and intentionally not created here.
 */
export async function ensureAccountTables() {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,            -- "user_" + 16 hex, client-generated (Phase 1)
      auth_sub    TEXT UNIQUE,                 -- Phase 2: provider subject
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS user_state (   -- one row per (user, key)
      user_id     TEXT NOT NULL REFERENCES users(id),
      key         TEXT NOT NULL,               -- e.g. "verbum-progress-latin"
      payload     JSONB NOT NULL,              -- exact existing localStorage payload
      updated_at  TIMESTAMPTZ NOT NULL,        -- client-stamped, clamped to server time
      device_id   TEXT NOT NULL,               -- last writer (tie-break for LWW)
      PRIMARY KEY (user_id, key)
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS diagnostics_events (
      user_id  TEXT NOT NULL REFERENCES users(id),
      event_id TEXT NOT NULL,                  -- existing Date.now()-seq ids
      event    JSONB NOT NULL,                 -- DiagnosticEvent (plus lang routing field)
      ts       TIMESTAMPTZ NOT NULL,           -- parsed event.ts for window pruning
      PRIMARY KEY (user_id, event_id)
    )
  `;
  await db`
    CREATE INDEX IF NOT EXISTS diag_ts ON diagnostics_events(user_id, ts)
  `;
}
