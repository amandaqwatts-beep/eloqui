import { loadJSON, saveJSON, STORAGE_KEYS } from "~/engine/storage";
import type { LessonProgress } from "~/engine/progress";

// ── Cross-language lesson progress (lessons 1007/1008) ───────────────
// Latin↔English side lessons track completion under ONE global key
// (verbum-cross-progress), never a per-language key. Rationale (research/
// cross-language-1007-1008-build-plan.md §2a): injecting lessonId 1007/1008
// into verbum-progress-<lang> would corrupt dashboard totals, daily-worst-area
// lesson cards, and shelf bookmark tabs; recordLessonAttempt/recordAttempt
// would pollute the per-language diagnostics. So this module exposes ONLY
// saveCrossProgress/loadCrossProgress (plus hasCompletedThrough for unlock
// gates) and imports only storage.ts + the LessonProgress type.
//
// Completion is recorded by the SCREENS layer from an exercise completion
// HANDLER (never render-time — render effects double-fire under StrictMode)
// via loadCrossProgress → upsert → saveCrossProgress.

/**
 * Load cross-language lesson progress. Corrupt/absent payload → empty list.
 * Unscoped: one global key shared by latin + english (no language param).
 */
export function loadCrossProgress(): LessonProgress[] {
  return loadJSON<LessonProgress[]>(STORAGE_KEYS.CROSS_PROGRESS, [], undefined);
}

/**
 * Persist the full cross-language progress list under CROSS_PROGRESS.
 * Unscoped: no language param, never writes verbum-progress-<lang>.
 */
export function saveCrossProgress(progress: LessonProgress[]): void {
  saveJSON(STORAGE_KEYS.CROSS_PROGRESS, progress);
}

/**
 * Unlock gate for cross-language lessons: true when any completed entry has
 * lessonId >= `lessonId` (the fence lesson reached/beaten — e.g. latin 10 for
 * both 1007 and 1008). Absent progress → false.
 */
export function hasCompletedThrough(lessonId: number): boolean {
  return loadCrossProgress().some((p) => p.lessonId >= lessonId && p.completed);
}