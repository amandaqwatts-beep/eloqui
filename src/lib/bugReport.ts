/**
 * bugReport.ts — client delivery for the beta bug-report flow (owner
 * directive 2026-08-23). The Screens department calls `submitBugReport` from
 * the report dialog; this module queues locally FIRST (a report is never
 * lost to a network failure), then fire-and-forget POSTs to the server seam
 * (src/server/bugReport.ts) — the same offline-graceful pattern as the
 * account P1 sync (engine/sync.ts). Delivery status lives on the queued
 * record so the export shows what reached the server.
 *
 * `captureBugContext` centralizes the auto-capture (route + screen +
 * lesson/phase/exercise) so Settings and the LessonMenu affordance produce
 * byte-identical context objects.
 */
import type { BugContext, BugReport } from "~/engine/types";
import {
  loadBugReports,
  markBugReportFailed,
  markBugReportSent,
  saveBugReport,
} from "~/engine/storage";

/** Same-millisecond disambiguator for report ids (pattern: storage.ts). */
let bugSeq = 0;
function nextBugId(): string {
  bugSeq = (bugSeq + 1) % 1_000_000;
  return `bug-${Date.now()}-${bugSeq}`;
}

/** Normalize the auto-captured context: unknown fields become null so the
 *  payload shape is stable (route is captured separately in submit — it is
 *  app-level, not lesson-level, context). */
export function captureBugContext(ctx: BugContext): Required<BugContext> {
  return {
    screen: ctx.screen ?? null,
    lessonId: ctx.lessonId ?? null,
    lessonNumber: ctx.lessonNumber ?? null,
    phase: ctx.phase ?? null,
    exerciseId: ctx.exerciseId ?? null,
  };
}

/**
 * Queue a report locally, then fire-and-forget POST to the server seam.
 * ALWAYS returns the queued report immediately — the dialog shows its quiet
 * confirmation without waiting on the network. Server failure → status
 * "failed", attempts++, report stays queued for the next flush/retry.
 */
export function submitBugReport(
  ctx: BugContext,
  description: string,
  language: BugReport["language"],
): BugReport {
  const report: BugReport = {
    ...captureBugContext(ctx),
    id: nextBugId(),
    language,
    route: captureRouteSafe(),
    description: description.trim() ? description.trim().slice(0, 500) : null,
    createdAt: new Date().toISOString(),
    status: "queued",
    attempts: 0,
  };
  // 1) Local queue first — never lose a report (owner directive).
  saveBugReport(report);
  // 2) Fire-and-forget upload (P1-sync pattern: graceful offline no-op).
  void deliver(report);
  return report;
}

function captureRouteSafe(): string {
  try {
    return window.location.pathname.slice(0, 500);
  } catch {
    return "/";
  }
}

/** One delivery attempt for one report. Marks sent/failed on the queue. */
async function deliver(report: BugReport): Promise<void> {
  try {
    const { submitBugReport: serverSubmit } = await import("~/server/bugReport");
    await serverSubmit({ data: { ...report } });
    markBugReportSent(report.id);
  } catch {
    // No DATABASE_URL / offline / validation failure — keep queued.
    markBugReportFailed(report.id);
  }
}

/**
 * Weekly-batch backstop: retry every queued/failed report (e.g. on route
 * mount). Cheap when the queue is empty; on the server this is exactly-once
 * (ON CONFLICT (id) DO NOTHING). Deliberately NOT wired to an interval —
 * the dialog's submit is the primary path and a page load retry covers the
 * "filed offline, back online later" case.
 */
export function flushBugReports(): void {
  const pending = loadBugReports().filter((r) => r.status !== "sent");
  for (const r of pending) void deliver(r);
}
