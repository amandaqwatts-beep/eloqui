/**
 * placementProgress.test.ts — engine verification for the urgent fix
 * (2026-08-19, owner: "placement test does not update the vocab list"):
 * placement persistence now seeds verbum-progress-<lang> so the placed-out
 * material counts as learned (unit reviews / learned universe / "met words"
 * pools derive from loadProgress, which placement never wrote).
 *
 * Covers: the pure seedProgressFromPlacement merge (array-INDEX order, id
 * order trap, landing lesson not pre-completed, clamp, idempotency, existing
 * stats preserved), the full-course "placed into Unit 5" shape (via
 * computePlacementStart + unitToFirstLessonCount, the exact persistence
 * pipeline), and the out-of-order-id fixture proving id order is never used.
 *
 * Self-contained (no bun:test import) so the project's `tsc --noEmit` stays
 * at its 7-error baseline. Run with:
 *   bun src/engine/placementProgress.test.ts
 */
import latinLessons, { type Lesson } from "~/data/latinLessons";
import {
  computePlacementStart,
  seedProgressFromPlacement,
} from "~/engine/placement";
import {
  unitToFirstLessonCount,
  unitToLessonIds,
} from "~/data/unitReviews";
import type { LessonProgress } from "~/engine/progress";

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string): void {
  if (cond) { pass++; console.log(`(pass) ${label}`); }
  else { fail++; console.log(`(FAIL) ${label}`); }
}

/** Minimal lesson stub — enough of Lesson for the helper's needs. */
function lesson(id: number): Lesson {
  return { id, title: `L${id}`, concept: "", exercises: [] } as unknown as Lesson;
}

// ── 1. Array-INDEX order, never lesson id order ─────────────────
{
  // ids deliberately NOT in order (51/52 physically precede 46–50 in the real
  // file, mirroring the latinLessons.ts trap).
  const lessons = [lesson(51), lesson(52), lesson(5), lesson(46)];
  const seeded = seedProgressFromPlacement(lessons, 3, []);
  const seededIds = seeded.map((p) => p.lessonId);
  ok(
    JSON.stringify(seededIds.sort((a, b) => a - b)) === JSON.stringify([51, 52]),
    "array order used, id order ignored: seed(3) over [51,52,5,46] ⇒ {51,52} (index 2 = landing lesson excluded)",
  );
  ok(
    seeded.every((p) => p.completed),
    "all seeded entries completed:true",
  );
}

// ── 2. Landing lesson is NOT pre-completed (index < count − 1) ──
{
  const seeded = seedProgressFromPlacement(
    [lesson(1), lesson(2), lesson(3), lesson(4)],
    3, // lands ON the 3rd lesson (index 2) — only indices 0..1 are placed-out
    [],
  );
  ok(seeded.length === 2, "placement at count 3 over 4 lessons seeds exactly 2 (indices 0,1)");
  ok(!seeded.some((p) => p.lessonId === 3), "landing lesson (index 2) not pre-completed");
  ok(!seeded.some((p) => p.lessonId === 4), "lessons beyond the frontier never seeded");
}

// ── 3. Clamp: counts below 1 / above length ────────────────────
{
  ok(seedProgressFromPlacement([lesson(1), lesson(2)], 0, []).length === 0, "count 0 → no seeding");
  ok(seedProgressFromPlacement([lesson(1), lesson(2)], -5, []).length === 0, "negative count → no seeding");
  ok(seedProgressFromPlacement([lesson(1), lesson(2), lesson(3)], 999, []).length === 2, "count past end clamps to all but the landing lesson");
}

// ── 4. Idempotent merge; existing stats preserved, never cleared ─
{
  const lessons = [lesson(10), lesson(11), lesson(12), lesson(13)];
  const existing: LessonProgress[] = [
    { lessonId: 11, completed: false, bestScore: 40, lastAttemptedAt: "2026-01-01", timesCompleted: 1 }, // inside seeded range → flipped to completed
    { lessonId: 13, completed: true, bestScore: 70, lastAttemptedAt: "2026-01-02", timesCompleted: 2 }, // outside range
  ];
  const first = seedProgressFromPlacement(lessons, 3, existing);
  ok(first.length === 3, "merge count: 2 existing + 1 new (landing lesson 12 untouched)");
  const l10 = first.find((p) => p.lessonId === 10)!;
  ok(l10?.completed === true && l10?.timesCompleted === 0, "newly seeded entry completed with zero times");
  const l11 = first.find((p) => p.lessonId === 11)!;
  ok(l11?.completed && l11?.bestScore === 40 && l11?.timesCompleted === 1 && l11?.lastAttemptedAt === "2026-01-01", "existing in-range entry: stats kept, completed flipped true");
  const l12 = first.find((p) => p.lessonId === 12);
  ok(l12 === undefined, "landing lesson (index 2) never added by seeding");
  const l13 = first.find((p) => p.lessonId === 13)!;
  ok(l13?.completed && l13?.bestScore === 70 && l13?.timesCompleted === 2, "existing stats outside range preserved verbatim");
  const again = seedProgressFromPlacement(lessons, 3, first);
  ok(again.length === first.length && again.every((p, i) => p.lessonId === first[i].lessonId && p.bestScore === first[i].bestScore && p.timesCompleted === first[i].timesCompleted), "re-run is idempotent (same length + stats)");
}

// ── 5. Full pipeline: "placed into Unit 5" over the real course ──
{
  const totalUnits = Object.keys(unitToLessonIds).length; // 14
  const answers: boolean[] = [];
  for (let u = 1; u <= totalUnits; u++) {
    // Unit 5 fails both questions; every other unit passes its first question.
    answers.push(u === 5 ? false : true, u === 5 ? false : false);
  }
  const scored = computePlacementStart(answers, totalUnits);
  if (scored.startLevel !== 5) { fail++; console.log(`(FAIL) expected placement startLevel 5, got ${scored.startLevel}`); }
  const placedLessonCount = unitToFirstLessonCount[scored.startLevel];
  const seeded = seedProgressFromPlacement(latinLessons, placedLessonCount, []);
  const seededIds = new Set(seeded.map((p) => p.lessonId));
  let unitsFullyCompleted = true;
  for (let u = 1; u <= 4; u++) {
    for (const id of unitToLessonIds[u]) {
      if (!seededIds.has(id)) { unitsFullyCompleted = false; console.log(`   unit ${u} missing lesson ${id}`); }
    }
  }
  ok(scored.startLevel === 5, "scored placement into unit 5");
  ok(
    unitToFirstLessonCount[5] === 59,
    `placed lesson count for unit 5 = ${placedLessonCount} (expected 59)`,
  );
  ok(seeded.length === 58, `seed shape after Unit-5 placement: ${seeded.length} completed entries (indices 0..57)`);
  ok(unitsFullyCompleted, "units 1–4 fully completed → their reviews open");
  const unit5Seeded = unitToLessonIds[5].filter((id) => seededIds.has(id));
  ok(unit5Seeded.length === 0, `unit 5 lessons NOT seeded (${unit5Seeded.length}) — student starts unit 5 fresh`);
}

// ── 6. Real-course array-order guard ───────────────────────────
{
  // Prove the seeding follows latinLessons array order even where lesson ids
  // are out of order. latinLessons.ts is not id-ordered: ids 51/52 physically
  // precede 46–50 (learnedUniverse.ts §1.1 documents the trap). A unit-4
  // placement (count 53 → seeds indices 0..51) must therefore include the
  // array's 52nd lesson (whatever its id) and must EXCLUDE every later array
  // entry — even one whose id happens to be < 53.
  const seeded = seedProgressFromPlacement(latinLessons, 53, []);
  ok(seeded.length === 52, "unit-4 placement seeds 52 lessons (indices 0..51)");
  const lastSeeded = latinLessons[51];
  ok(
    seeded.some((p) => p.lessonId === lastSeeded.id),
    `index 51 (id ${lastSeeded.id}) seeded by array position`,
  );
  const later = latinLessons.slice(52);
  const laterIds = new Set(seeded.map((p) => p.lessonId));
  const wronglyIncluded = later.filter((l) => l.id < 53 && laterIds.has(l.id));
  ok(
    wronglyIncluded.length === 0,
    `no later-array lesson with id < 53 wrongly seeded (id-order trap) — ${later.length} later lessons checked`,
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);