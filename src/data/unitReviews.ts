// Verbum — Unit reviews (unitReviews.ts)
// Data-only file. 14 per-unit reviews (owner direction 2026-08-12: "smaller
// reviews after each unit" — research/review-system-rework-design.md §2).
// Unit membership is DERIVED from bookLessons.ts (46 books, unitNumber 1–14,
// subLessonIds) — the same derivation pattern as subLessonToBook — so
// latinLessons.ts array order is untouched (order sacred: never reorder).
// Unit boundaries VERIFIED: U1 1–25, U2 26–33, U3 34–52, U4 53–58, U5 59–70,
// U6 71–81, U7 82–88, U8 89–96, U9 97–103, U10 104–109, U11 110–118,
// U12 119–122, U13 123–130, U14 131–134 (matches Bookshelf UNIT_MAP).
// masteryLessonId: 25 (U1), 33 (U2), 70 (U5), 134 (U14) — the four authored
// mastery reviews anchor their unit's composed review.
// Latin-only in P1; English (2001–2010) is a P3 data follow-up (same
// structure, no engine change). No rendering, no logic — pure data.

import { bookLessons } from "~/data/bookLessons";
import { GRAMMAR_INDEX, type GrammarTopic } from "~/data/grammarIndex";
import latinLessons from "~/data/latinLessons";

export interface UnitReview {
  unitNumber: number; // 1..14
  title: string; // "Unit 1 Review"
  lessonIds: number[]; // derived from bookLessons (all sub-lessons of the unit)
  focusTopicIds: string[]; // GRAMMAR_INDEX topic ids introduced in this unit (P1-derived; curated P3)
  masteryLessonId?: number; // 25/33/70/134 — anchors the review in authored content
}

// ── Derivation: lesson id → array index (latinLessons array order = unlock
//    order — NEVER lesson id; the file's ids are not id-ordered). ─────────
const ORDER = new Map<number, number>();
latinLessons.forEach((l, i) => ORDER.set(l.id, i));

// Mastery-review lessons (books 7/10/24/46 → sub-lessons 25/33/70/134).
export const MASTERY_REVIEW_LESSON_IDS: number[] = bookLessons
  .filter((b) => b.kind === "mastery-review")
  .flatMap((b) => b.subLessonIds);

/** mastery-review lesson id → its unit number. */
export const masteryReviewUnitOf: Record<number, number> = {};
for (const b of bookLessons) {
  if (b.kind !== "mastery-review") continue;
  for (const id of b.subLessonIds) masteryReviewUnitOf[id] = b.unitNumber;
}

/** Unit number → all sub-lesson ids of the unit (union over its books). */
export const unitToLessonIds: Record<number, number[]> = {};
/** Lesson id → unit number (drives "unit complete?" gating). */
export const unitForLesson: Record<number, number> = {};
// Dedupe per unit: P3a unit-review books (ids 47–56) re-cover their unit's
// lesson ids, so a plain union would list every id twice for units 3/4/6–13.
// The map stays the unit's unique lesson set (order preserved); review
// composition and gating are unaffected by the dedupe.
for (const b of bookLessons) {
  const arr = (unitToLessonIds[b.unitNumber] ??= []);
  for (const id of b.subLessonIds) {
    if (!arr.includes(id)) arr.push(id);
    unitForLesson[id] = b.unitNumber;
  }
}

// For each unit, the LESSON COUNT to persist for a student placed into that
// unit: (minimum latinLessons array index among the unit's lesson ids) + 1.
// engine/lesson.ts's createInitialState reads the stored placement startLevel
// as a lesson count in 1..134, so the placement engine's raw unit number
// (1–14) must be mapped to this count before saving — the Latin route passes
// this map as usePlacementEngine's mapStartLevel. Matches the unit-boundary
// comment above: U1 → 1, U2 → 26, … U14 → 131.
export const unitToFirstLessonCount: Record<number, number> = {};
for (const [unit, ids] of Object.entries(unitToLessonIds)) {
  const u = Number(unit);
  const indexes = ids
    .map((id) => ORDER.get(id))
    .filter((i): i is number => i !== undefined);
  unitToFirstLessonCount[u] = indexes.length > 0 ? Math.min(...indexes) + 1 : 1;
}

// For each unit, the max array index among its NON-mastery lessons — the
// teaching frontier a mastery-review id resolves to (a review must not
// withhold a topic past its unit's regular teaching).
const unitRegularMaxIndex: Record<number, number> = {};
for (const [unit, ids] of Object.entries(unitToLessonIds)) {
  const u = Number(unit);
  unitRegularMaxIndex[u] = Math.max(
    -1,
    ...ids.filter((id) => masteryReviewUnitOf[id] === undefined).map((id) => ORDER.get(id) ?? -1),
  );
}

/**
 * The array index that gates "learned" for a related lesson id: a
 * mastery-review id resolves to its unit's last regular lesson, so a topic
 * whose relatedLessonIds include a review (e.g. first-declension
 * [1,2,4,5,25]) is learned when the unit's teaching is done — never held
 * hostage to review completion beyond its unit.
 */
export function mappedLessonIndex(id: number): number {
  const unit = masteryReviewUnitOf[id];
  if (unit !== undefined) return unitRegularMaxIndex[unit] ?? -1;
  return ORDER.get(id) ?? -1;
}

/**
 * The introducing lesson of a topic = the related lesson with the smallest
 * mapped index (prefer a non-mastery lesson on ties). Used by
 * learnedUniverse.grammarByLesson and the per-unit focusTopicIds derivation.
 */
export function topicIntroducingLesson(topic: GrammarTopic): number {
  let bestId = topic.relatedLessonIds[0];
  let bestIdx = mappedLessonIndex(bestId);
  for (const id of topic.relatedLessonIds) {
    const idx = mappedLessonIndex(id);
    const isMastery = masteryReviewUnitOf[id] !== undefined;
    const bestIsMastery = masteryReviewUnitOf[bestId] !== undefined;
    if (idx < bestIdx || (idx === bestIdx && !isMastery && bestIsMastery)) {
      bestId = id;
      bestIdx = idx;
    }
  }
  return bestId;
}

export const UNIT_REVIEWS: UnitReview[] = Object.keys(unitToLessonIds)
  .map(Number)
  .sort((a, b) => a - b)
  .map((unitNumber) => {
    const lessonIds = unitToLessonIds[unitNumber];
    const focusTopicIds = GRAMMAR_INDEX.filter((t) =>
      lessonIds.includes(topicIntroducingLesson(t)),
    ).map((t) => t.id);
    const mastery = MASTERY_REVIEW_LESSON_IDS.find(
      (id) => unitForLesson[id] === unitNumber,
    );
    return {
      unitNumber,
      title: `Unit ${unitNumber} Review`,
      lessonIds,
      focusTopicIds,
      ...(mastery !== undefined ? { masteryLessonId: mastery } : {}),
    };
  });
