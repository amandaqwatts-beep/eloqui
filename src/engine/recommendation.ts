/**
 * recommendation.ts — Engine department: the free-zone "do the recommended"
 * composer (owner directive 2026-09-10: during a lesson the flow is targeted;
 * user selection lives in the free zones — drill, AI practice, explore — and
 * every free zone carries a prominent "do the recommended" button that jumps
 * to the engine's next suggestion).
 *
 * ONE priority ladder, shared by all three free zones (lead-confirmed):
 *   1. unit-review-spine-due — the first (lowest) unit whose spine is unlocked
 *      (isUnitComplete-derived set, passed in) but whose review has not been
 *      completed. Reviews lock in finished units before new teaching.
 *   2. remediation — the daily worst-area lesson, FILTERED to its diagnostic /
 *      weak-spot sources (a "rotation" pick is maintenance, not remediation —
 *      it must never mask the bonus or frontier rungs below it).
 *   3. bonus — an unclaimed improvement-streak bonus drill (claimable today).
 *   4. frontier — the student's next new lesson (the highest unlocked one).
 *   Nothing applies → null (all-complete / empty course): never fabricate a
 *   target — same doctrine as getDailyWorstLesson's fresh-user null.
 *
 * Purity (mirrors dailyLesson.ts): NO storage reads or writes — every input
 * is passed in by the route, which already loads progress / diagnostics /
 * unit-review state for its other derivations. The daily worst-area pick can
 * be passed precomputed (the route renders DailyLessonCard from it anyway);
 * otherwise it is computed from the passed event log.
 *
 * Pure TypeScript — zero JSX, zero rendering.
 */
import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { DiagnosticEvent } from "~/engine/types";
import { getDailyWorstLesson, type DailyWorstLesson } from "~/engine/dailyLesson";
import { MASTERY_REVIEW_LESSON_IDS } from "~/data/unitReviews";

/** Which rung of the ladder produced the recommendation. */
export type RecommendationSource = "unit-review" | "remediation" | "bonus" | "frontier";

/** What the free-zone button DOES with the recommendation (route dispatch). */
export type RecommendationKind = "lesson" | "unit-review" | "drill";

/** Screen-ready recommendation — the free-zone button's single input. */
export interface Recommendation {
  kind: RecommendationKind;
  /**
   * lesson id (kind "lesson"), unit number (kind "unit-review"), or 0
   * (kind "drill" — the bonus drill has no lesson target; the route's
   * startBonusDrill composes the deck itself).
   */
  id: number;
  /** latinLessons ARRAY index (kind "lesson"); -1 otherwise. */
  idx: number;
  /** True when a "lesson" id is a mastery-review / general-review sub-lesson. */
  isReviewLesson: boolean;
  /** Short screen-ready name, e.g. "Unit 3 Review" / "Lesson 5: Title". */
  label: string;
  /** One-line screen-ready WHY (English, in-module). */
  reason: string;
  source: RecommendationSource;
}

export interface RecommendationInputs {
  lessons: Lesson[];
  unlockedLessons: number;
  /** loadProgress(language).filter(p => p.completed).map(p => p.lessonId). */
  completedLessonIds: number[];
  /** Ascending unit numbers whose spine is complete (route: unitReviewUnlocked). */
  unitReviewUnlocked: number[];
  /** Unit numbers whose review has been completed (storage `completed` keys). */
  unitReviewsCompleted: number[];
  /** streak.streakDays >= IMPROVEMENT_ACTIVE_DAYS && !streak.bonusClaimedToday. */
  bonusClaimable: boolean;
  /** For the bonus copy only (optional; default 0). */
  streakDays?: number;
  /** Precomputed daily worst-area pick (route already has it); preferred. */
  dailyLesson?: DailyWorstLesson | null;
  /** Fallback event log when dailyLesson is not passed (default []). */
  events?: DiagnosticEvent[];
  language?: Language;
  /** Test seed passthrough for the internal getDailyWorstLesson call. */
  seed?: string;
  /**
   * Lesson ids that count as review lessons for isReviewLesson. Defaults to
   * MASTERY_REVIEW_LESSON_IDS extended with the Unit-3 General Review
   * sub-lessons 158–166 (book 57 — already mastery-review kind, extended
   * defensively so the surfacing survives a data-file re-derivation).
   */
  reviewLessonIds?: number[];
}

/** 158–166 — the Unit-3 General Review sub-lessons (book 57, PR #87). */
const GENERAL_REVIEW_LESSON_IDS: number[] = [158, 159, 160, 161, 162, 163, 164, 165, 166];

export const DEFAULT_REVIEW_LESSON_IDS: number[] = [
  ...new Set([...MASTERY_REVIEW_LESSON_IDS, ...GENERAL_REVIEW_LESSON_IDS]),
];

/**
 * The free-zone recommendation — one call, one ladder, no storage.
 * Returns null when there is genuinely nothing to suggest (all lessons
 * completed, or an empty course).
 */
export function getRecommendation(inputs: RecommendationInputs): Recommendation | null {
  const {
    lessons,
    unlockedLessons,
    completedLessonIds,
    unitReviewUnlocked,
    unitReviewsCompleted,
    bonusClaimable,
  } = inputs;
  const reviewLessonIds = inputs.reviewLessonIds ?? DEFAULT_REVIEW_LESSON_IDS;

  // 1. Unit-review spine due: first unlocked-but-uncompleted unit (both lists
  //    sorted defensively — the route passes an isUnitComplete-derived set).
  const doneUnits = new Set(unitReviewsCompleted);
  const dueUnit = [...unitReviewUnlocked]
    .sort((a, b) => a - b)
    .find((u) => !doneUnits.has(u));
  if (dueUnit !== undefined) {
    return {
      kind: "unit-review",
      id: dueUnit,
      idx: -1,
      isReviewLesson: false,
      label: `Unit ${dueUnit} Review`,
      reason: `You finished every lesson in Unit ${dueUnit} — take its review to lock the material in.`,
      source: "unit-review",
    };
  }

  // 2. Remediation: the daily worst-area lesson — ONLY when it is a genuine
  //    diagnostic / weak-spot pick (rotation picks are maintenance, not
  //    remediation, and must not mask the rungs below).
  const daily =
    inputs.dailyLesson !== undefined
      ? inputs.dailyLesson
      : getDailyWorstLesson({
          events: inputs.events ?? [],
          lessons,
          completedLessonIds,
          unlockedLessons,
          language: inputs.language ?? "latin",
          ...(inputs.seed !== undefined ? { seed: inputs.seed } : {}),
        });
  if (daily && (daily.source === "diagnostic" || daily.source === "weak-spot")) {
    const idx = lessons.findIndex((l) => l.id === daily.lessonId);
    const lesson = lessons[idx];
    if (lesson) {
      return {
        kind: "lesson",
        id: daily.lessonId,
        idx,
        isReviewLesson: reviewLessonIds.includes(lesson.id),
        label: `Lesson ${idx + 1}: ${lesson.title}`,
        reason: daily.reason,
        source: "remediation",
      };
    }
  }

  // 3. Bonus drill: today's unclaimed improvement-streak entitlement.
  if (bonusClaimable) {
    const days = inputs.streakDays ?? 0;
    return {
      kind: "drill",
      id: 0,
      idx: -1,
      isReviewLesson: false,
      label: "Bonus Drill",
      reason:
        days > 0
          ? `Your ${days}-day improvement streak earned a bonus drill — claim it before UTC midnight.`
          : "Your improvement streak earned a bonus drill — claim it before UTC midnight.",
      source: "bonus",
    };
  }

  // 4. Frontier: the next new lesson (highest unlocked). All-complete → null.
  const completedSet = new Set(completedLessonIds);
  if (lessons.length > 0 && lessons.every((l) => completedSet.has(l.id))) return null;
  const idx = Math.min(unlockedLessons, lessons.length) - 1;
  const lesson = idx >= 0 ? lessons[idx] : undefined;
  if (lesson) {
    const isReview = reviewLessonIds.includes(lesson.id);
    return {
      kind: "lesson",
      id: lesson.id,
      idx,
      isReviewLesson: isReview,
      label: isReview ? lesson.title : `Lesson ${idx + 1}: ${lesson.title}`,
      reason: isReview
        ? `${lesson.title} is ready at your frontier — reviews come up as soon as you unlock them.`
        : `Your next new lesson — Lesson ${idx + 1}: ${lesson.title}.`,
      source: "frontier",
    };
  }

  // Empty course / degenerate state — never fabricate a target.
  return null;
}
