/**
 * recommendation.test.ts — engine verification for the free-zone "do the
 * recommended" composer (owner directive 2026-09-10: free zones carry a
 * prominent "do the recommended" button; the engine decides what comes next).
 *
 * Covers the ONE priority ladder end-to-end:
 *   fresh-device → frontier Lesson 1; placement-seeded frontier (id 26 at
 *   unlocked 26); a diagnostic event log → remediation (real
 *   getDailyWorstLesson integration); a due unit review OUTRANKS an active
 *   diagnostic; bonusClaimable → the bonus drill (and NOT while remediation
 *   applies); all-complete → null; rotation-source daily picks are NOT
 *   remediation; reviewLessonIds labeling (isReviewLesson on 158–166 and the
 *   mastery reviews, false on regular lessons).
 *
 * Self-contained (no bun:test import) so the project's `tsc --noEmit` stays
 * at its 7-error baseline. Run with:
 *   bun src/engine/recommendation.test.ts
 */
import latinLessons, { type Lesson } from "~/data/latinLessons";
import type { DiagnosticEvent } from "~/engine/types";
import {
  getRecommendation,
  DEFAULT_REVIEW_LESSON_IDS,
  type Recommendation,
} from "~/engine/recommendation";

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string): void {
  if (cond) {
    pass++;
    console.log(`(pass) ${label}`);
  } else {
    fail++;
    console.log(`(FAIL) ${label}`);
  }
}

/** Minimal lesson stub — enough of Lesson for the composer's needs. */
function lesson(id: number, title = `L${id}`): Lesson {
  return { id, title, concept: "", exercises: [] } as unknown as Lesson;
}

/** DiagnosticEvent fixture — in-window, kind "concept", targeting lesson id. */
function ev(id: string, conceptId: string, okFlag: boolean, minutesAgo: number): DiagnosticEvent {
  return {
    id,
    ts: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    conceptId,
    tags: [`lesson:${conceptId.split(":")[1] ?? "1"}`],
    kind: "concept",
    ok: okFlag,
    source: "lesson",
    mistake: okFlag ? undefined : "rule",
  };
}

const FIXTURE_LESSONS = [lesson(1, "First Declension"), lesson(2, "Second Declension"), lesson(3, "Sum")];

// ── 1. Fresh device → frontier Lesson 1 ──────────────────────────
{
  const rec: Recommendation | null = getRecommendation({
    lessons: FIXTURE_LESSONS,
    unlockedLessons: 1,
    completedLessonIds: [],
    unitReviewUnlocked: [],
    unitReviewsCompleted: [],
    bonusClaimable: false,
    dailyLesson: null,
  });
  ok(rec !== null, "fresh device: a recommendation exists");
  ok(rec?.kind === "lesson" && rec.id === 1 && rec.idx === 0, "fresh device: frontier Lesson 1 (idx 0)");
  ok(rec?.source === "frontier" && !rec?.isReviewLesson, "fresh device: source frontier, not a review lesson");
  ok((rec?.reason ?? "").includes("Lesson 1"), "fresh device: reason names Lesson 1");
}

// ── 2. Placement-seeded frontier (Latin: unlocked 26 → lesson id 26) ──
{
  const rec = getRecommendation({
    lessons: latinLessons,
    unlockedLessons: 26,
    completedLessonIds: latinLessons.slice(0, 25).map((l) => l.id),
    unitReviewUnlocked: [],
    unitReviewsCompleted: [],
    bonusClaimable: false,
    dailyLesson: null,
  });
  ok(rec?.kind === "lesson" && rec.id === 26 && rec.idx === 25, "placement-seeded: frontier is lesson id 26 at idx 25");
  ok(!rec?.isReviewLesson, "placement-seeded: lesson 26 is not a review lesson");
}

// ── 3. Diagnostic event → remediation (real getDailyWorstLesson) ──
{
  // 3 attempts on concept:12 (lesson id 12), 1 ok / 2 wrong → worst area.
  const events: DiagnosticEvent[] = [
    ev("e1", "concept:12", true, 60),
    ev("e2", "concept:12", false, 50),
    ev("e3", "concept:12", false, 40),
  ];
  const rec = getRecommendation({
    lessons: latinLessons,
    unlockedLessons: 20,
    completedLessonIds: [1, 2, 3],
    unitReviewUnlocked: [],
    unitReviewsCompleted: [],
    bonusClaimable: false,
    events,
  });
  ok(rec?.kind === "lesson" && rec.id === 12, "diagnostic events → remediation targets lesson 12");
  ok(rec?.source === "remediation", "diagnostic events → source remediation");
  ok(rec?.idx === latinLessons.findIndex((l) => l.id === 12), "remediation idx is the lesson's ARRAY index");
}

// ── 4. Due unit review OUTRANKS an active diagnostic ─────────────
{
  const daily = {
    lessonId: 12,
    lessonTitle: "L12",
    conceptId: "concept:12",
    conceptLabel: "L12",
    reason: "L12 is your weakest concept.",
    rank: 1,
    candidateCount: 1,
    source: "diagnostic" as const,
  };
  const rec = getRecommendation({
    lessons: latinLessons,
    unlockedLessons: 30,
    completedLessonIds: [1, 2, 3],
    unitReviewUnlocked: [1, 2],
    unitReviewsCompleted: [1],
    bonusClaimable: false,
    dailyLesson: daily,
  });
  ok(rec?.kind === "unit-review" && rec.id === 2, "due unit review outranks remediation (first due = unit 2)");
  ok(rec?.label === "Unit 2 Review" && rec.idx === -1, "unit-review rec carries unit number + idx -1");
  // And the same state with NO due review falls back to the diagnostic pick.
  const rec2 = getRecommendation({
    lessons: latinLessons,
    unlockedLessons: 30,
    completedLessonIds: [1, 2, 3],
    unitReviewUnlocked: [1, 2],
    unitReviewsCompleted: [1, 2],
    bonusClaimable: false,
    dailyLesson: daily,
  });
  ok(rec2?.source === "remediation" && rec2?.id === 12, "remediation resumes once reviews are caught up");
}

// ── 5. Rotation-source daily picks are NOT remediation ───────────
{
  const rotation = {
    lessonId: 5,
    lessonTitle: "L5",
    conceptId: "lesson:5",
    conceptLabel: "L5",
    reason: "Full review: Lesson 5.",
    rank: 1,
    candidateCount: 3,
    source: "rotation" as const,
  };
  const rec = getRecommendation({
    lessons: FIXTURE_LESSONS,
    unlockedLessons: 2,
    completedLessonIds: [1],
    unitReviewUnlocked: [],
    unitReviewsCompleted: [],
    bonusClaimable: true,
    dailyLesson: rotation,
  });
  ok(rec?.source === "bonus" && rec?.kind === "drill", "rotation daily pick does not mask the bonus rung");
}

// ── 6. streak.claimable → bonus drill ────────────────────────────
{
  const rec = getRecommendation({
    lessons: FIXTURE_LESSONS,
    unlockedLessons: 3,
    completedLessonIds: [1, 2],
    unitReviewUnlocked: [],
    unitReviewsCompleted: [],
    bonusClaimable: true,
    streakDays: 4,
    dailyLesson: null,
  });
  ok(rec?.kind === "drill" && rec.id === 0 && rec.idx === -1, "bonusClaimable → bonus drill (no lesson target)");
  ok((rec?.reason ?? "").includes("4-day"), "bonus copy names the streak");
  ok(rec?.source === "bonus", "bonus source label");
}

// ── 7. All-complete → null ───────────────────────────────────────
{
  const rec = getRecommendation({
    lessons: FIXTURE_LESSONS,
    unlockedLessons: 3,
    completedLessonIds: [1, 2, 3],
    unitReviewUnlocked: [],
    unitReviewsCompleted: [],
    bonusClaimable: false,
    dailyLesson: null,
  });
  ok(rec === null, "all lessons completed → null (never fabricate)");
  const empty = getRecommendation({
    lessons: [],
    unlockedLessons: 0,
    completedLessonIds: [],
    unitReviewUnlocked: [],
    unitReviewsCompleted: [],
    bonusClaimable: false,
    dailyLesson: null,
  });
  ok(empty === null, "empty course → null");
}

// ── 8. reviewLessonIds labeling (158–166 + mastery reviews) ──────
{
  ok(
    [158, 159, 160, 161, 162, 163, 164, 165, 166].every((id) => DEFAULT_REVIEW_LESSON_IDS.includes(id)),
    "default reviewLessonIds includes the Unit-3 General Review 158–166",
  );
  ok(DEFAULT_REVIEW_LESSON_IDS.includes(25) && DEFAULT_REVIEW_LESSON_IDS.includes(33), "default includes mastery reviews 25/33");
  // Frontier lands on a general-review lesson → isReviewLesson true.
  const rec = getRecommendation({
    lessons: latinLessons,
    unlockedLessons: 166,
    completedLessonIds: latinLessons.slice(0, 165).map((l) => l.id),
    unitReviewUnlocked: [],
    unitReviewsCompleted: [],
    bonusClaimable: false,
    dailyLesson: null,
  });
  ok(rec?.kind === "lesson" && rec.id === 166 && rec.isReviewLesson, "frontier on lesson 166 → isReviewLesson true");
  ok(rec?.label === latinLessons[165]?.title && !rec.label.startsWith("Lesson "), "review-lesson label is the review title, not 'Lesson N:'");
}

console.log(`\nrecommendation.test.ts: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
