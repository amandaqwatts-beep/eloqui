import { createServerFn } from "@tanstack/react-start";
import { sql, ensureBugReportsTable } from "~/db";
/**
 * Server seam for the beta bug-report flow (owner directive 2026-08-23) —
 * built on the existing feedback.ts pattern: createServerFn + validator +
 * ensure-table + sql(). Two functions:
 *
 *  - submitBugReport — fire-and-forget POST target for the client queue
 *    (engine/bugReport.ts). Client-supplied id (Date.now()-seq) makes the
 *    insert exactly-once via ON CONFLICT DO NOTHING, so retries after a
 *    network failure never duplicate a report.
 *  - exportBugReports — the owner's weekly dump: all reports, oldest first,
 *    plain JSON array. No auth, no triage UI (none exists); the owner reads
 *    this by opening the URL in a browser (returns text/plain JSON).
 *
 * Deliberately NOT synced through user_state/diagnostics_events — bug reports
 * are app-level feedback (like the `feedback` table), not per-user learning
 * data, and the weekly review reads them all at once.
 */
/** One bug report as sent by the client (shape mirrors engine BugReport). */
export interface BugReportInput {
  id: string;
  language: string;
  route: string;
  screen: string | null;
  lessonId: number | null;
  lessonNumber: number | null;
  phase: string | null;
  exerciseId: string | null;
  description: string | null;
  createdAt: string;
  attempts: number;
}
/** Row shape returned by exportBugReports (dates coerced to ISO strings). */
export interface BugReportRow {
  id: string;
  language: string;
  route: string;
  screen: string | null;
  lessonId: number | null;
  lessonNumber: number | null;
  phase: string | null;
  exerciseId: string | null;
  description: string | null;
  createdAt: string;
  receivedAt: string;
  attempts: number;
}
const optionalStr = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null;
const optionalNum = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};
export const submitBugReport = createServerFn()
  .validator((data: unknown): BugReportInput => {
    const d = data as Record<string, unknown>;
    if (typeof d.id !== "string" || !d.id) throw new Error("Invalid id");
    const language = typeof d.language === "string" ? d.language : "latin";
    const route = typeof d.route === "string" ? d.route.slice(0, 500) : "/";
    if (typeof d.createdAt !== "string") throw new Error("Invalid createdAt");
    const attempts = optionalNum(d.attempts) ?? 0;
    return {
      id: d.id.slice(0, 100),
      language: language.slice(0, 30),
      route,
      screen: optionalStr(d.screen),
      lessonId: optionalNum(d.lessonId),
      lessonNumber: optionalNum(d.lessonNumber),
      phase: optionalStr(d.phase),
      exerciseId: optionalStr(d.exerciseId),
      description: optionalStr(d.description),
      createdAt: d.createdAt,
      attempts: Math.max(0, attempts),
    };
  })
  .handler(async ({ data }) => {
    await ensureBugReportsTable();
    await sql()`
      INSERT INTO bug_reports (
        id, language, route, screen, lesson_id, lesson_number, phase,
        exercise_id, description, created_at, attempts
      ) VALUES (
        ${data.id}, ${data.language}, ${data.route}, ${data.screen},
        ${data.lessonId}, ${data.lessonNumber}, ${data.phase},
        ${data.exerciseId}, ${data.description},
        ${data.createdAt}::timestamptz, ${data.attempts}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    return { success: true };
  });
/** The owner's weekly dump: every report, oldest first. */
export const exportBugReports = createServerFn({ method: "GET" }).handler(
  async (): Promise<BugReportRow[]> => {
    await ensureBugReportsTable();
    const rows = await sql()`
      SELECT id, language, route, screen, lesson_id, lesson_number, phase,
             exercise_id, description, created_at, received_at, attempts
      FROM bug_reports
      ORDER BY created_at ASC, id ASC
      LIMIT 2000
    `;
    return rows.map((r) => ({
      id: String(r.id),
      language: String(r.language),
      route: String(r.route),
      screen: r.screen == null ? null : String(r.screen),
      lessonId: r.lesson_id == null ? null : Number(r.lesson_id),
      lessonNumber: r.lesson_number == null ? null : Number(r.lesson_number),
      phase: r.phase == null ? null : String(r.phase),
      exerciseId: r.exercise_id == null ? null : String(r.exercise_id),
      description: r.description == null ? null : String(r.description),
      createdAt: new Date(r.created_at).toISOString(),
      receivedAt: new Date(r.received_at).toISOString(),
      attempts: Number(r.attempts ?? 0),
    }));
  },
);
