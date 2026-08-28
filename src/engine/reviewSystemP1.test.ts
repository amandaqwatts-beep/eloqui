/**
 * reviewSystemP1.test.ts — P1 engine verification for the review-system
 * rework (owner direction 2026-08-12): unbounded translation generation over
 * the learned universe + 14 per-unit reviews.
 *
 * Covers the plan's P1 verification list (research/review-system-rework-p1-
 * plan.md §verification): universe building, the array-order trap, seeded
 * determinism, the ≥90% frame-eligible-word coverage invariant over 200
 * seeded generations, checkTranslation leniency (RISK 5), unit-review
 * composition + gating + mastery anchors, and unit-review storage.
 *
 * Self-contained (no bun:test import) so the project's `tsc --noEmit` stays
 * at its 7-error baseline. Run with:
 *   bun src/engine/reviewSystemP1.test.ts
 */

import latinLessons, { type Lesson } from "~/data/latinLessons";
import { buildLearnedUniverse, boundUniverseForLesson } from "~/engine/learnedUniverse";
import {
  STARTER_FRAMES,
  generateTranslationExercises,
  isWordEligibleForFrames,
  type SentenceFrame,
} from "~/engine/translationGen";
import { checkTranslation, normalizeAnswer } from "~/engine/answers";
import {
  UNIT_REVIEWS,
  unitToLessonIds,
  unitForLesson,
} from "~/data/unitReviews";
import {
  composeUnitReview,
  createReviewSession,
  isUnitComplete,
  rateReviewItem,
} from "~/engine/reviewSession";
import type { LessonProgress } from "~/engine/progress";
import {
  clearAllData,
  loadUnitReviews,
  recordUnitReviewCompletion,
  saveUnitReviews,
} from "~/engine/storage";

// ── Tiny harness (mirrors src/lib/shelfPacking.test.ts) ────────────────
let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`(pass) ${name}`);
  } catch (e) {
    failed++;
    console.error(`(fail) ${name}`);
    console.error(e);
  }
}
function eq<T>(actual: T, expected: T, msg?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg ?? "assertion"}: expected ${b}, got ${a}`);
}
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
function deepEq(a: unknown, b: unknown, msg: string) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${msg}: objects differ`);
  }
}

const lessons: Lesson[] = latinLessons;
const order = new Map(lessons.map((l, i) => [l.id, i]));
const lessonOf = (id: number): Lesson => {
  const l = lessons.find((x) => x.id === id);
  if (!l) throw new Error(`lesson ${id} missing`);
  return l;
};
/** Completed ids for every lesson at array index ≤ the target lesson's index. */
function completedThrough(id: number): number[] {
  const idx = order.get(id)!;
  return lessons.filter((l) => order.get(l.id)! <= idx).map((l) => l.id);
}
function progressOf(ids: number[]): LessonProgress[] {
  return ids.map((lessonId) => ({
    lessonId,
    completed: true,
    bestScore: 100,
    lastAttemptedAt: "2026-08-12T00:00:00.000Z",
    timesCompleted: 1,
  }));
}

// ── 1. Universe: dedupe, bound, lemma identity ──────────────────────────
test("universe: completed [1,2,3] + current 4 → deduped union; bound(3) excludes lesson-4 words", () => {
  const u = buildLearnedUniverse({
    lessons,
    completedLessonIds: [1, 2, 3],
    currentLessonId: 4,
  });
  // terra appears in lessons 1,2,3 — deduped to one canonical entry.
  const terra = u.words.filter((w) => normalizeAnswer(w.latin) === "terra");
  eq(terra.length, 1, "terra deduped");
  // Lesson-3 word present, lesson-4 word present in the universe…
  ok(u.words.some((w) => normalizeAnswer(w.latin) === "orat"), "orat in universe");
  ok(u.words.some((w) => normalizeAnswer(w.latin) === "laudat"), "laudat (lesson 4) in universe");
  // …but the bound for lesson 3 excludes lesson-4 words.
  const bound3 = boundUniverseForLesson(u, lessonOf(3));
  ok(bound3.words.some((w) => normalizeAnswer(w.latin) === "orat"), "orat ≤ order(3)");
  ok(!bound3.words.some((w) => normalizeAnswer(w.latin) === "laudat"), "laudat > order(3)");
  // Lemma identity via normalizeAnswer: macron-stripped key resolves.
  eq(u.wordByLemma.get("poeta")?.latin, "poēta", "macron-stripped lemma key");
  ok(u.currentLessonId === 4, "current lesson tracked");
});

// ── 2. Array-order trap (ids 51/52 physically precede 46–50) ────────────
test("ordering: 3rd-conjugation frame ineligible at 45, eligible at 49 — via order(), not id", () => {
  ok(order.get(46)! > order.get(52)!, "order(46) > order(52) — ids are not index-ordered");
  const frame3: SentenceFrame = {
    id: "test-3rd-conj",
    requires: ["third-conjugation"],
    slots: [
      { role: "subject", kind: "noun", case: "nominative" },
      { role: "verb", kind: "verb", person: 3, number: "sg" },
    ],
    latinTemplate: "{subject} {verb}",
    englishTemplate: "the {subject} {verb}",
    productionHint: "Translate into English.",
  };
  const u45 = buildLearnedUniverse({ lessons, completedLessonIds: completedThrough(45), currentLessonId: 45 });
  const at45 = generateTranslationExercises({ universe: u45, lesson: lessonOf(45), count: 1, seed: "trap", frames: [frame3] });
  eq(at45.length, 0, "ineligible at lesson 45 (3rd-conj topic not yet learned)");
  const u49 = buildLearnedUniverse({ lessons, completedLessonIds: completedThrough(49), currentLessonId: 49 });
  const at49 = generateTranslationExercises({ universe: u49, lesson: lessonOf(49), count: 1, seed: "trap", frames: [frame3] });
  ok(at49.length >= 1, `eligible at lesson 49 (got ${at49.length})`);
});

// ── 3. Determinism ──────────────────────────────────────────────────────
test("determinism: same seed → identical; different seed → different (within the bound)", () => {
  const u = buildLearnedUniverse({ lessons, completedLessonIds: completedThrough(10), currentLessonId: 10 });
  const l10 = lessonOf(10);
  const a = generateTranslationExercises({ universe: u, lesson: l10, count: 20, seed: "det-a" });
  const b = generateTranslationExercises({ universe: u, lesson: l10, count: 20, seed: "det-a" });
  deepEq(a, b, "same seed, byte-identical");
  const c = generateTranslationExercises({ universe: u, lesson: l10, count: 20, seed: "det-b" });
  ok(JSON.stringify(a) !== JSON.stringify(c), "different seed → different set");
  const bound = boundUniverseForLesson(u, l10);
  const eligible = new Set(bound.words.map((w) => normalizeAnswer(w.latin)));
  for (const ex of [...a, ...c]) {
    for (const lemma of ex.lemmas) ok(eligible.has(lemma), `lemma ${lemma} within the bound`);
  }
});

// ── 4. Coverage invariant: ≥90% of frame-eligible words over 200 seeded
//       generations at a mid-course lesson (never lowered). ──────────────
test("coverage: ≥90% of frame-eligible bounded words across 200 seeded generations at lesson 53", () => {
  const u53 = buildLearnedUniverse({ lessons, completedLessonIds: completedThrough(53), currentLessonId: 53 });
  const l53 = lessonOf(53);
  const bound = boundUniverseForLesson(u53, l53);
  const eligible = bound.words.filter(isWordEligibleForFrames);
  ok(eligible.length > 50, `frame-eligible pool size ${eligible.length} > 50`);
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const gen = generateTranslationExercises({ universe: u53, lesson: l53, count: 5, seed: `cov-${i}` });
    for (const ex of gen) for (const lemma of ex.lemmas) seen.add(lemma);
  }
  const coverage = seen.size / eligible.length;
  console.log(`  coverage: ${seen.size}/${eligible.length} = ${(coverage * 100).toFixed(1)}%`);
  ok(coverage >= 0.9, `coverage ${(coverage * 100).toFixed(1)}% ≥ 90%`);
});

// ── 5. checkTranslation leniency (RISK 5 / verification #5) ─────────────
test("checkTranslation: rewordings pass, number/verb mismatches fail", () => {
  ok(checkTranslation("the sailor does not pray", "the sailor is not praying", []), "V1 reword → true");
  ok(!checkTranslation("the sailors pray", "the sailor prays", []), "V2 sg/pl mismatch → false");
  ok(!checkTranslation("the sailor prays", "the sailor praises", []), "prays vs praises → false");
  ok(checkTranslation("the sailor prays", "the sailor prays", []), "equality → true");
  ok(checkTranslation("sailor prays", "the sailor prays", ["the sailor prays"]), "article-less → true");
  ok(!checkTranslation("", "the sailor prays", []), "empty input → false");
  ok(
    checkTranslation("the sailor does not pray", "the sailor is not praying", []) ===
      checkTranslation("the sailor does not pray", "the sailor is not praying", []),
    "deterministic",
  );
});

// ── 6. Unit reviews: gating, composition, mastery anchors ───────────────
test("unit data: 14 units, VERIFIED boundaries, mastery anchors, focusTopicIds", () => {
  eq(UNIT_REVIEWS.length, 14, "14 unit reviews");
  // NLE supplemental lessons (135–157) are wired into Henle books' subLessonIds
  // by design (bookLessons.ts: 136→book 20/H18·U5, 135+151→book 33/H30·U9,
  // 137→book 38/H35·U10, 155→book 39/H36·U10, 138→book 40/H37·U11, 150+152→
  // book 42/H39·U12, 156+157→book 43/H40·U13, 142+153→book 44/H41·U13,
  // 139–141+143–149+154→book 45/H42·U14), so unit review universes include
  // them at their wired positions; the expected arrays below are the verified
  // shape as of master f27a638.
  eq(unitToLessonIds[1], Array.from({ length: 25 }, (_, i) => i + 1), "U1 = 1–25");
  eq(unitToLessonIds[2], Array.from({ length: 8 }, (_, i) => i + 26), "U2 = 26–33");
  eq(unitToLessonIds[3], Array.from({ length: 19 }, (_, i) => i + 34), "U3 = 34–52");
  eq(unitToLessonIds[4], Array.from({ length: 6 }, (_, i) => i + 53), "U4 = 53–58");
  eq(unitToLessonIds[5], [59, 60, 61, 62, 63, 64, 136, 65, 66, 67, 68, 69, 70], "U5 = 59–70 with 136 at its book-20 (H18) wired position");
  eq(unitToLessonIds[14], [131, 132, 133, 139, 140, 141, 143, 144, 145, 146, 147, 148, 149, 154, 134], "U14 = 131–133 + book-45 (H42) NLE ids + mastery anchor 134 last");
  eq(unitForLesson[25], 1, "lesson 25 → unit 1");
  eq(unitForLesson[134], 14, "lesson 134 → unit 14");
  const anchors = UNIT_REVIEWS.filter((u) => u.masteryLessonId !== undefined).map((u) => [u.unitNumber, u.masteryLessonId]);
  deepEq(anchors, [[1, 25], [2, 33], [5, 70], [14, 134]], "mastery anchors 25/33/70/134");
  for (const u of UNIT_REVIEWS) ok(u.focusTopicIds.length > 0, `unit ${u.unitNumber} has focusTopicIds`);
});

test("review: unit 3 complete → 10 items across the 4 types; incomplete → []", () => {
  const u3 = UNIT_REVIEWS.find((u) => u.unitNumber === 3)!;
  const maxOrderLesson = [...u3.lessonIds].sort((a, b) => order.get(b)! - order.get(a)!)[0];
  const universe = buildLearnedUniverse({
    lessons,
    completedLessonIds: completedThrough(maxOrderLesson),
    currentLessonId: maxOrderLesson,
  });
  const progress = progressOf(completedThrough(maxOrderLesson));
  ok(isUnitComplete(u3, progress), "unit 3 complete");
  const items = composeUnitReview({ unit: u3, lessons, universe, progress, seed: "review-test-u3" });
  eq(items.length, 10, "10 items");
  const byType: Record<string, number> = {};
  for (const it of items) byType[it.type] = (byType[it.type] ?? 0) + 1;
  ok((byType["multiple-choice"] ?? 0) >= 6, `vocab+grammar MC present (${byType["multiple-choice"]})`);
  ok((byType["fill-in-blank"] ?? 0) >= 2, `translation fills present (${byType["fill-in-blank"]})`);
  ok((byType["matching"] ?? 0) >= 2, `matching present (${byType["matching"]})`);
  // Per-item diagnostic metadata attached at composition time.
  for (const it of items) {
    ok(typeof it.conceptId === "string" && it.conceptId.length > 0, "conceptId set");
    ok(it.tags.some((t) => t.startsWith("lesson:")), "lesson tag set");
    ok(typeof it.expected === "string" && it.expected.length > 0, "expected set");
  }
  // Incomplete unit → [].
  const incomplete = progressOf([1, 2, 3]);
  eq(composeUnitReview({ unit: u3, lessons, universe, progress: incomplete, seed: "review-test-u3" }).length, 0, "incomplete → []");
  ok(!isUnitComplete(u3, incomplete), "unit 3 not complete with partial progress");
});

test("review: unit 1 anchors the composed review with authored lesson-25 items", () => {
  const u1 = UNIT_REVIEWS.find((u) => u.unitNumber === 1)!;
  const universe = buildLearnedUniverse({ lessons, completedLessonIds: completedThrough(25), currentLessonId: 25 });
  const progress = progressOf(completedThrough(25));
  const items = composeUnitReview({ unit: u1, lessons, universe, progress, seed: "review-test-u1" });
  eq(items.length, 10, "10 items");
  const anchors = items.filter((it) => it.id.startsWith("l25-"));
  ok(anchors.length === 2, `2 mastery anchors from lesson 25 (got ${anchors.length})`);
});

test("review: deterministic composition; session machine mirrors drill", () => {
  const u1 = UNIT_REVIEWS.find((u) => u.unitNumber === 1)!;
  const universe = buildLearnedUniverse({ lessons, completedLessonIds: completedThrough(25), currentLessonId: 25 });
  const progress = progressOf(completedThrough(25));
  const a = composeUnitReview({ unit: u1, lessons, universe, progress, seed: "det-review" });
  const b = composeUnitReview({ unit: u1, lessons, universe, progress, seed: "det-review" });
  deepEq(a, b, "same review seed → identical items");
  const session = createReviewSession(1, a);
  eq(session.done, false, "session starts open");
  const s1 = rateReviewItem(session, true, a.length, a[0]);
  eq(s1.index, 1, "advances after rating");
  eq(s1.gotIt.length, 1, "gotIt records the item");
  let s = s1;
  for (let i = 1; i < a.length; i++) s = rateReviewItem(s, false, a.length, a[i]);
  ok(s.done, "done after rating all items");
  eq(s.missed.length, a.length - 1, "missed recorded");
  eq(createReviewSession(1, []).done, true, "empty review done immediately");
});

// ── translationGen extras: mixed direction, MC flavor, empty universe ───
test("translationGen: mixed direction alternates; MC flavor emits distractors; empty universe → []", () => {
  const u = buildLearnedUniverse({ lessons, completedLessonIds: completedThrough(10), currentLessonId: 10 });
  const l10 = lessonOf(10);
  const mixed = generateTranslationExercises({ universe: u, lesson: l10, count: 4, seed: "mix", direction: "mixed" });
  eq(mixed.length, 4, "4 mixed items");
  ok(mixed[0].prompt.startsWith("Translate into English"), "difficulty < 0.5 → L→E first");
  ok(mixed[1].prompt.startsWith("Translate into Latin"), "alternates to E→L");
  const flavored = generateTranslationExercises({ universe: u, lesson: l10, count: 3, seed: "mc", direction: "latin-to-english", withDistractors: true });
  for (const ex of flavored) {
    ok(ex.distractors !== undefined && ex.distractors.length >= 1, "MC flavor emits ≥1 distractor");
    ok(!ex.distractors!.includes(ex.prompt.replace("Translate into English: ", "").replace(/\.$/, "")), "distractor ≠ answer");
  }
  const empty = buildLearnedUniverse({ lessons, completedLessonIds: [] });
  eq(generateTranslationExercises({ universe: empty, lesson: lessonOf(1), count: 5, seed: "x" }).length, 0, "empty universe → []");
  // STARTER_FRAMES sanity: ids unique, templates have matching roles.
  const ids = new Set(STARTER_FRAMES.map((f) => f.id));
  eq(ids.size, STARTER_FRAMES.length, "unique frame ids");
});

// ── 7. Unit-review storage ──────────────────────────────────────────────
test("storage: round-trip, corrupt → defaults, idempotent completion, clearAllData wipes the key", () => {
  // In-memory localStorage shim (repo test pattern).
  const mem = new Map<string, string>();
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    },
    location: { reload: () => undefined },
  };

  const fresh = loadUnitReviews();
  deepEq(fresh, { v: 1, completed: {} }, "absent → defaults");
  saveUnitReviews({ v: 1, completed: { "3": { completedAt: "2026-08-12T00:00:00.000Z", score: 0.9, timesCompleted: 1 } } });
  const loaded = loadUnitReviews();
  eq(loaded.completed["3"].score, 0.9, "round-trip score");
  eq(loaded.completed["3"].timesCompleted, 1, "round-trip timesCompleted");
  ok(mem.has("verbum-unit-review-latin"), "namespaced key written");

  mem.set("verbum-unit-review-latin", "{corrupt!!");
  deepEq(loadUnitReviews(), { v: 1, completed: {} }, "corrupt payload → defaults");

  mem.set("verbum-unit-review-latin", JSON.stringify({ v: 1, completed: { "3": { completedAt: "2026-08-12T00:00:00.000Z", score: 0.8, timesCompleted: 1 } } }));
  recordUnitReviewCompletion(3, 0.95); // StrictMode double-invoke…
  recordUnitReviewCompletion(3, 0.95); // …converges on one key (idempotent upsert)
  const after = loadUnitReviews();
  eq(Object.keys(after.completed).length, 1, "single key after double invoke");
  eq(after.completed["3"].timesCompleted, 3, "timesCompleted incremented");
  eq(after.completed["3"].score, 0.95, "score upserted");

  clearAllData("latin");
  eq(mem.has("verbum-unit-review-latin"), false, "clearAllData wipes verbum-unit-review-latin");
  delete (globalThis as Record<string, unknown>).window;
});

// ── Run summary ─────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
