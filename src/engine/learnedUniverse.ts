/**
 * learnedUniverse.ts — Engine department: the "learned universe".
 *
 * Owner direction 2026-08-12: generated translations may use ANY learned word
 * and ANY learned grammatical idea, bounded only by what the student has met
 * (research/review-system-rework-design.md §1.1). This module defines
 * "learned" exactly once, consistent with existing identity conventions:
 *
 *   - Word identity = normalizeAnswer(latin) (NFD-strip macrons + lowercase,
 *     answers.ts) — the same convention as diagnostics `vocab:<lemma>` and
 *     sleep-audio's encountered set.
 *   - Lesson ordering = ARRAY INDEX in latinLessons.ts (unlock order — never
 *     lesson id; the file's ids are NOT id-ordered: 51/52 physically precede
 *     46–50). Every "before/after" comparison uses order(id).
 *   - Grammar: a GRAMMAR_INDEX topic is learned when every related lesson is
 *     behind the student's frontier. Mastery-review ids (25/33/70/134) resolve
 *     to their unit's last regular lesson (unitReviews.mappedLessonIndex) so
 *     a review never withholds a topic past its unit's teaching.
 *   - The current in-flight lesson counts as met (same rule as sleepAudio.ts:
 *     its words have been met even though saveProgress hasn't fired).
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage.
 */

import type { Lesson, VocabularyItem } from "~/data/latinLessons";
import { normalizeAnswer } from "~/engine/answers";
import { GRAMMAR_INDEX, type GrammarTopic } from "~/data/grammarIndex";
import { mappedLessonIndex, topicIntroducingLesson } from "~/data/unitReviews";

export interface LearnedUniverse {
  /** Course array (order = unlock order). */
  lessons: Lesson[];
  /** Lesson id → array index. */
  order: Map<number, number>;
  /** Completed ids PLUS the current in-flight lesson, sorted by array index. */
  completedLessonIds: number[];
  currentLessonId?: number;
  /** Deduped by normalizeAnswer(latin); canonical form from the first-introducing lesson. */
  words: VocabularyItem[];
  wordByLemma: Map<string, VocabularyItem>;
  /** Lemma → first-introducing lesson id. */
  wordIntroLesson: Map<string, number>;
  /** Lesson id → topics introduced AT that lesson. */
  grammarByLesson: Map<number, GrammarTopic[]>;
}

/** The subset a lesson may use: words/grammar introduced at array index ≤ order(L). */
export interface LessonBound {
  words: VocabularyItem[];
  topics: GrammarTopic[];
  orderOf: (id: number) => number;
}

export function buildLearnedUniverse(opts: {
  lessons: Lesson[];
  /** loadProgress(language).filter(p => p.completed).map(p => p.lessonId). */
  completedLessonIds: number[];
  currentLessonId?: number;
  /** Default GRAMMAR_INDEX — injectable for tests. */
  grammarIndex?: GrammarTopic[];
}): LearnedUniverse {
  const lessons = opts.lessons;
  const grammarIndex = opts.grammarIndex ?? GRAMMAR_INDEX;
  const order = new Map<number, number>();
  lessons.forEach((l, i) => order.set(l.id, i));

  const met = new Set(opts.completedLessonIds);
  if (opts.currentLessonId !== undefined) met.add(opts.currentLessonId);

  // Words: dedupe by normalizeAnswer(latin); first-introducing lesson's
  // canonical form wins (matches buildVocabularyIndex identity).
  const seen = new Set<string>();
  const words: VocabularyItem[] = [];
  const wordByLemma = new Map<string, VocabularyItem>();
  const wordIntroLesson = new Map<string, number>();
  for (const lesson of lessons) {
    if (!met.has(lesson.id)) continue;
    for (const item of lesson.vocabulary ?? []) {
      const key = normalizeAnswer(item.latin);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      words.push(item);
      wordByLemma.set(key, item);
      wordIntroLesson.set(key, lesson.id);
    }
  }

  // Grammar: topics introduced AT each lesson (introducing lesson =
  // min-mapped-index related lesson, per unitReviews.topicIntroducingLesson).
  const grammarByLesson = new Map<number, GrammarTopic[]>();
  for (const topic of grammarIndex) {
    const intro = topicIntroducingLesson(topic);
    const arr = grammarByLesson.get(intro) ?? [];
    arr.push(topic);
    grammarByLesson.set(intro, arr);
  }

  const completedLessonIds = [...met].sort(
    (a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0),
  );

  return {
    lessons,
    order,
    completedLessonIds,
    currentLessonId: opts.currentLessonId,
    words,
    wordByLemma,
    wordIntroLesson,
    grammarByLesson,
  };
}

/**
 * The subset lesson L may use: words whose introducing-lesson index ≤ order(L)
 * and grammar topics whose EVERY related lesson (mastery-mapped) has index
 * ≤ order(L). This is the single enforcement point behind "never demand
 * untaught material" — structural, not prompt-adjacent.
 */
export function boundUniverseForLesson(u: LearnedUniverse, lesson: Lesson): LessonBound {
  const boundIdx = u.order.get(lesson.id) ?? -1;
  const words = u.words.filter((w) => {
    const intro = u.wordIntroLesson.get(normalizeAnswer(w.latin));
    return intro !== undefined && (u.order.get(intro) ?? -1) <= boundIdx;
  });

  const topics: GrammarTopic[] = [];
  const seenTopic = new Set<string>();
  for (const [introLesson, topicList] of u.grammarByLesson) {
    const introIdx = u.order.get(introLesson) ?? -1;
    if (introIdx > boundIdx) continue;
    for (const topic of topicList) {
      if (seenTopic.has(topic.id)) continue;
      const maxRelated = Math.max(-1, ...topic.relatedLessonIds.map(mappedLessonIndex));
      if (maxRelated <= boundIdx) {
        seenTopic.add(topic.id);
        topics.push(topic);
      }
    }
  }

  return { words, topics, orderOf: (id: number) => u.order.get(id) ?? -1 };
}
