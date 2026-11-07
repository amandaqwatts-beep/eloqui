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

// ── Email fallback (FIX-4, owner directive 2026-11-07: "can't users mail
// you bugs?" — YES). The report pipeline is outage-tolerant (local queue →
// retry), but while the database host is unreachable nothing leaves the
// device. The team inbox below is live and swept by the lead every cycle,
// so every surface that files a report also offers a DB-independent email
// path. Copy discipline: plain and quiet, no urgency language.

export const BUG_REPORT_EMAIL = "eloqui-fd4501fc@ctomail.io";

/** Client mailto URL limit guard (browser caps vary; keep well under). */
const MAILTO_MAX_CHARS = 1800;

/**
 * Build a mailto: URL carrying the report — subject `[Eloqui bug] <screen>`,
 * body with the description (truncated gracefully if needed) plus the full
 * captured context (route, screen, lesson, phase, exercise, filed-at).
 * Pure; the dialog, Settings, and tests share it.
 */
export function buildBugMailto(
  report: Pick<
    BugReport,
    "screen" | "lessonId" | "lessonNumber" | "phase" | "exerciseId" | "route" | "description" | "createdAt"
  > & { appVersion?: string | null },
): string {
  const subject = `[Eloqui bug] ${report.screen ?? report.route ?? "report"}`;
  const contextLines = [
    `Route: ${report.route ?? "?"}`,
    `Screen: ${report.screen ?? "?"}`,
    report.lessonNumber != null ? `Lesson: ${report.lessonNumber}` : null,
    report.lessonId != null ? `Lesson id: ${report.lessonId}` : null,
    report.phase ? `Phase: ${report.phase}` : null,
    report.exerciseId ? `Exercise: ${report.exerciseId}` : null,
    report.createdAt ? `Filed: ${report.createdAt}` : null,
    report.appVersion ? `App version: ${report.appVersion}` : null,
  ].filter((l): l is string => l !== null);
  const fixedBody = contextLines.join("\n");

  let description = (report.description ?? "").trim();
  const assemble = (desc: string): string => {
    const body = (desc ? `Description: ${desc}\n\n` : "") + fixedBody;
    return `mailto:${BUG_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  let url = assemble(description);
  // Shrink the description until the whole mailto fits (context lines last).
  while (url.length > MAILTO_MAX_CHARS && description.length > 0) {
    description = description.slice(0, Math.max(0, Math.ceil(description.length * 0.8) - 1));
    if (description.length > 0) url = assemble(description);
    else url = assemble("");
  }
  if (url.length > MAILTO_MAX_CHARS) url = assemble("");
  return url;
}
