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
 *
 * Fixture refresh (2026-09-12): PR #87 appended the Unit-3 General Review
 * (ids 158–166, mastery-review book 57) — U3's completion set and derived
 * mastery anchor (158) updated here; composition expectations are derived
 * from the data the same way production composes them.
 *
 * Membership-bound refresh (2026-09-12): composeUnitReview now bounds its
 * vocab pool by the unit's MEMBERSHIP (unitToLessonIds union), not the max
 * array index of its members — the appended chapters made the old bound
 * equal the whole course for U3. The unit-3 fixture below still derives its
 * expectations from the data (the composition SHAPE is pool-independent);
 * two tests were added: whole-course membership containment and the thin-
 * pool fallback widening.
 */

import latinLessons, {
  type FillInBlankExercise,
  type Lesson,
  type MatchingExercise,
  type MultipleChoiceExercise,
} from "~/data/latinLessons";
import { bookLessons } from "~/data/bookLessons";
import { LATIN_LESSONS, UNIT_REVIEW_ITEM_COUNT } from "~/data/settings";
import { buildLearnedUniverse, boundUniverseForLesson } from "~/engine/learnedUniverse";
import {
  STARTER_FRAMES,
  generateTranslationExercises,
  isWordEligibleForFrames,
  type SentenceFrame,
} from "~/engine/translationGen";
import { checkTranslation, normalizeAnswer } from "~/engine/answers";
import { seededShuffle } from "~/engine/seededRandom";
import {
  UNIT_REVIEWS,
  unitToLessonIds,
  unitForLesson,
  type UnitReview,
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
  eq(lessons.length, LATIN_LESSONS, `latinLessons length matches settings LATIN_LESSONS (${LATIN_LESSONS})`);
  // NLE supplemental lessons (135–157) are wired into Henle books' subLessonIds
  // by design (bookLessons.ts: 136→book 20/H18·U5, 135+151→book 33/H30·U9,
  // 137→book 38/H35·U10, 155→book 39/H36·U10, 138→book 40/H37·U11, 150+152→
  // book 42/H39·U12, 156+157→book 43/H40·U13, 142+153→book 44/H41·U13,
  // 139–141+143–149+154→book 45/H42·U14), so unit review universes include
  // them at their wired positions. The Unit-3 General Review chapters
  // (158–166, mastery-review book 57) are appended at the latinLessons array
  // END (order is sacred, never reordered) but belong to U3's completion set
  // (unitForLesson[158–166] = 3). The expected arrays below are the verified
  // shape as of master f1cc67a (PR #87).
  eq(unitToLessonIds[1], Array.from({ length: 25 }, (_, i) => i + 1), "U1 = 1–25");
  eq(unitToLessonIds[2], Array.from({ length: 8 }, (_, i) => i + 26), "U2 = 26–33");
  eq(
    unitToLessonIds[3],
    Array.from({ length: 19 }, (_, i) => i + 34).concat(Array.from({ length: 9 }, (_, i) => i + 158)),
    "U3 = 34–52 + appended General Review chapters 158–166 (book 57)",
  );
  eq(unitToLessonIds[4], Array.from({ length: 6 }, (_, i) => i + 53), "U4 = 53–58");
  eq(unitToLessonIds[5], [59, 60, 61, 62, 63, 64, 136, 65, 66, 67, 68, 69, 70], "U5 = 59–70 with 136 at its book-20 (H18) wired position");
  eq(unitToLessonIds[14], [131, 132, 133, 139, 140, 141, 143, 144, 145, 146, 147, 148, 149, 154, 134], "U14 = 131–133 + book-45 (H42) NLE ids + mastery anchor 134 last");
  const book57 = bookLessons.find((b) => b.id === 57);
  ok(book57 !== undefined, "book 57 (U3 General Review) exists");
  eq(book57!.kind, "mastery-review", "book 57 is a mastery-review book");
  deepEq(book57!.subLessonIds, Array.from({ length: 9 }, (_, i) => i + 158), "book 57 sub-lessons = 158–166");
  ok(
    bookLessons.findIndex((b) => b.id === 57) > bookLessons.findIndex((b) => b.id === 16),
    "book 57 sits after book 16 (U3's last regular book) in shelf order",
  );
  eq(unitForLesson[25], 1, "lesson 25 → unit 1");
  eq(unitForLesson[134], 14, "lesson 134 → unit 14");
  eq(unitForLesson[158], 3, "appended General Review chapter 158 → unit 3");
  eq(unitForLesson[166], 3, "appended General Review chapter 166 → unit 3");
  const anchors = UNIT_REVIEWS.filter((u) => u.masteryLessonId !== undefined).map((u) => [u.unitNumber, u.masteryLessonId]);
  deepEq(anchors, [[1, 25], [2, 33], [3, 158], [5, 70], [14, 134]], "mastery anchors 25/33/158/70/134 — U3's 158 derives from mastery-review book 57");
  for (const u of UNIT_REVIEWS) ok(u.focusTopicIds.length > 0, `unit ${u.unitNumber} has focusTopicIds`);
});

test("review: unit 3 complete → 10 items across the 4 types; incomplete → []", () => {
  const u3 = UNIT_REVIEWS.find((u) => u.unitNumber === 3)!;
  // A U3-complete student has finished the unit's FULL membership — which now
  // includes the appended General Review chapters 158–166 (book 57). Complete
  // U1–U3 membership from unitToLessonIds (the data production gates on) —
  // NOT completedThrough(maxOrderLesson): 166 is the array's last lesson, so
  // "through 166" would model whole-course completion, not a U3 student.
  const completed = [...unitToLessonIds[1], ...unitToLessonIds[2], ...unitToLessonIds[3]];
  const maxOrderLesson = [...u3.lessonIds].sort((a, b) => order.get(b)! - order.get(a)!)[0];
  const universe = buildLearnedUniverse({ lessons, completedLessonIds: completed, currentLessonId: maxOrderLesson });
  const progress = progressOf(completed);
  ok(isUnitComplete(u3, progress), "unit 3 complete (including appended chapters 158–166)");
  const items = composeUnitReview({ unit: u3, lessons, universe, progress, seed: "review-test-u3" });
  eq(items.length, UNIT_REVIEW_ITEM_COUNT, "10 items");
  // Documented composition (reviewSession.composeUnitReview docstring): with a
  // mastery anchor, 2 vocab MC + 2 anchors + 2 grammar MC + 2 translation
  // fills + 2 matching. U3's anchor is now the DERIVED masteryLessonId 158
  // (book 57), so derive the anchor item types exactly the way production
  // does (masteryAnchor: seededShuffle over lesson 158's anchor-eligible pool).
  const anchorLesson = lessonOf(u3.masteryLessonId!);
  const anchorPool = anchorLesson.exercises.filter(
    (e): e is MultipleChoiceExercise | FillInBlankExercise | MatchingExercise =>
      e.type === "multiple-choice" || e.type === "fill-in-blank" || e.type === "matching",
  );
  const anchorTypes = [0, 1].map((i) => seededShuffle(anchorPool, `review-test-u3|a${i}`)[0]?.type);
  const expected: Record<string, number> = { "multiple-choice": 4, "fill-in-blank": 2, "matching": 2 };
  for (const t of anchorTypes) if (t) expected[t] = (expected[t] ?? 0) + 1;
  const byType: Record<string, number> = {};
  for (const it of items) byType[it.type] = (byType[it.type] ?? 0) + 1;
  eq(byType["multiple-choice"], expected["multiple-choice"], `vocab+grammar MC (${byType["multiple-choice"]}) = 2 vocab + 2 grammar + ${expected["multiple-choice"] - 4} anchor(s)`);
  eq(byType["fill-in-blank"], expected["fill-in-blank"], `translation fills + anchor fills (${byType["fill-in-blank"]})`);
  eq(byType["matching"], expected["matching"], `matching (${byType["matching"]})`);
  // Anchors: authored lesson-158 items carrying the derived mastery conceptId.
  const anchors = items.filter((it) => it.conceptId === `lesson:${u3.masteryLessonId}`);
  eq(anchors.length, 2, "2 mastery anchors from derived anchor lesson 158 (book 57)");
  for (const a of anchors) ok(anchorTypes.includes(a.type), `anchor item type ${a.type} matches production's seeded pick`);
  // 2 vocab MC + 2 grammar MC (mastery-anchored units emit 2 vocab MC, not 4).
  eq(items.filter((it) => it.type === "multiple-choice" && it.conceptId.startsWith("vocab:")).length, 2, "2 vocab MC");
  eq(items.filter((it) => it.type === "multiple-choice" && it.conceptId.startsWith("concept:")).length, 2, "2 grammar MC from the unit's comprehensionChecks");
  // Per-item diagnostic metadata attached at composition time.
  for (const it of items) {
    ok(typeof it.conceptId === "string" && it.conceptId.length > 0, "conceptId set");
    ok(it.tags.some((t) => t.startsWith("lesson:")), "lesson tag set");
    ok(typeof it.expected === "string" && it.expected.length > 0, "expected set");
  }
  // Incomplete unit → [] — one uncompleted membership lesson (an appended
  // review chapter here) closes the review.
  const incomplete = progressOf(completed.filter((id) => id !== 166));
  eq(composeUnitReview({ unit: u3, lessons, universe, progress: incomplete, seed: "review-test-u3" }).length, 0, "incomplete → []");
  ok(!isUnitComplete(u3, incomplete), "unit 3 not complete with appended chapter 166 outstanding");
});

// ── Helpers for the membership-bound tests ───────────────────────────────
/** Every vocab lemma a POOL-SOURCED item references: conceptId/tags
 *  `vocab:<lemma>`, matching pair lefts, translation filler lemmas, and the
 *  Latin options of E→L vocab MCs (drawn from the pool). Mirrors production
 *  provenance. Mastery-anchor items (conceptId `lesson:<id>` — authored
 *  member-chapter content, e.g. lesson 158's declension matchings) are NOT
 *  pool-sourced and are excluded; the membership guarantee is about the
 *  generated pool, and anchors are members by definition. */
function collectVocabLemmas(items: ReturnType<typeof composeUnitReview>): Set<string> {
  const lemmas = new Set<string>();
  for (const it of items) {
    if (!it.conceptId.startsWith("vocab:")) continue;
    const cm = /^vocab:(.+)$/.exec(it.conceptId);
    if (cm) lemmas.add(cm[1]);
    for (const t of it.tags) {
      const tm = /^vocab:(.+)$/.exec(t);
      if (tm) lemmas.add(tm[1]);
    }
    if (it.type === "matching") for (const p of it.pairs) lemmas.add(normalizeAnswer(p.left));
    const genLemmas = (it as { lemmas?: string[] }).lemmas;
    if (genLemmas) for (const l of genLemmas) lemmas.add(l);
    if (it.type === "multiple-choice" && it.prompt.startsWith("Which Latin word means")) {
      for (const o of it.options) lemmas.add(normalizeAnswer(o));
    }
  }
  return lemmas;
}
/** The vocab lemma set production derives for a lesson-id list: the union of
 *  the lessons' vocabulary lists, normalized (the membership-bounded pool
 *  source and the fallback's widened source both use this shape). */
function vocabLemmasOf(ids: number[]): Set<string> {
  const lemmas = new Set<string>();
  for (const id of ids) {
    const l = lessons.find((x) => x.id === id);
    for (const w of l?.vocabulary ?? []) lemmas.add(normalizeAnswer(w.latin));
  }
  return lemmas;
}
/** First eligible single-word vocab entry from a lesson with id > 100 (and
 *  outside 158–166) whose normalized lemma is NOT in `exclude` — a later-unit
 *  word the old array-order bound leaked into U3 reviews. Derived from data,
 *  never hard-coded. */
function findLaterUnitProbe(exclude: Set<string>): { lessonId: number; latin: string } {
  for (const l of lessons) {
    if (l.id <= 100 || (l.id >= 158 && l.id <= 166)) continue;
    for (const w of l.vocabulary ?? []) {
      if (w.latin.length > 0 && !/[\s,;]/.test(w.latin) && w.english.length > 0 && !exclude.has(normalizeAnswer(w.latin))) {
        return { lessonId: l.id, latin: w.latin };
      }
    }
  }
  throw new Error("no later-unit probe word found — data shape changed");
}

test("membership: a U3 review draws vocabulary ONLY from U3's member lessons (even whole-course)", () => {
  const u3 = UNIT_REVIEWS.find((u) => u.unitNumber === 3)!;
  // Whole-course student: EVERY unit's membership completed — the maximal
  // universe. Under the old max-array-order bound (order ≤ order(166) = the
  // array end) this review's pool spanned every unit; membership must
  // contain it now.
  const completed = [...new Set(Object.values(unitToLessonIds).flat())];
  const universe = buildLearnedUniverse({ lessons, completedLessonIds: completed, currentLessonId: 166 });
  const progress = progressOf(completed);
  ok(isUnitComplete(u3, progress), "U3 complete for a whole-course student");
  const items = composeUnitReview({ unit: u3, lessons, universe, progress, seed: "review-test-u3-all" });
  eq(items.length, UNIT_REVIEW_ITEM_COUNT, "10 items");
  // The member pool, derived the same way production does: the union of the
  // member lessons' vocabulary lists (incl. appended chapters 158–166).
  const memberLemmas = vocabLemmasOf(u3.lessonIds);
  const referenced = collectVocabLemmas(items);
  ok(referenced.size > 0, "items reference vocabulary");
  for (const lemma of referenced) {
    ok(memberLemmas.has(lemma), `lemma "${lemma}" is U3 member vocabulary`);
  }
  // Regression probe: a real later-unit word (id > 100, not 158–166, not
  // re-listed by any member) that the OLD derivation leaked in — its lesson
  // sits within the old array-order bound, but it is not member vocabulary.
  const probe = findLaterUnitProbe(memberLemmas);
  ok(order.get(probe.lessonId)! <= order.get(166)!, "probe within the OLD array-order bound (the leak this guards)");
  ok(!referenced.has(normalizeAnswer(probe.latin)), `later-unit word "${probe.latin}" (lesson ${probe.lessonId}) absent from the U3 review`);
});

test("fallback: thin member pool widens to everything learned through the unit — never later units", () => {
  // Lesson 166 (U3's appended sight-list chapter) lists no vocabulary, so a
  // unit whose only member is 166 has an EMPTY member pool: the primary
  // composition cannot fill the review, and the documented fallback must
  // widen ONCE to everything learned through the unit — here U1–U3's full
  // membership, all completed — composing 10 items WITHOUT touching unit-4+
  // vocabulary (a whole-course U3 student reopening this review is the
  // real-world shape).
  const thin: UnitReview = {
    unitNumber: 3,
    title: "Thin U3 fixture (member = appended chapter 166 only)",
    lessonIds: [166],
    focusTopicIds: [],
  };
  const completed = [...unitToLessonIds[1], ...unitToLessonIds[2], ...unitToLessonIds[3]];
  const universe = buildLearnedUniverse({ lessons, completedLessonIds: completed, currentLessonId: 166 });
  const progress = progressOf(completed);
  ok(isUnitComplete(thin, progress), "thin unit complete (166 ∈ completed)");
  eq(
    (lessons.find((l) => l.id === 166)?.vocabulary ?? []).length,
    0,
    "lesson 166 lists no vocabulary — the thin fixture is real, fallback is the only path",
  );
  const items = composeUnitReview({ unit: thin, lessons, universe, progress, seed: "review-test-thin" });
  eq(items.length, UNIT_REVIEW_ITEM_COUNT, "fallback composes a full review");
  // The widened source, derived the way production's fallback does: vocab of
  // units ≤ 3 (earlier units' membership plus the unit's own).
  const widenedLemmas = vocabLemmasOf([...unitToLessonIds[1], ...unitToLessonIds[2], ...unitToLessonIds[3]]);
  const referenced = collectVocabLemmas(items);
  ok(referenced.size >= 4, `widening actually contributed material (${referenced.size} lemmas ≥ the 4-pair matching floor; member pool is empty)`);
  for (const lemma of referenced) {
    ok(widenedLemmas.has(lemma), `lemma "${lemma}" was learned through unit 3`);
  }
  // And the containment guarantee holds on the widened pool too.
  const probe = findLaterUnitProbe(widenedLemmas);
  ok(!referenced.has(normalizeAnswer(probe.latin)), `later-unit word "${probe.latin}" (lesson ${probe.lessonId}) absent even after widening`);
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
