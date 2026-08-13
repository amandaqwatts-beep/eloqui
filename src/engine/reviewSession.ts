/**
 * reviewSession.ts — Engine department: per-unit review composition + session
 * machine (owner direction 2026-08-12: "smaller reviews after each unit").
 *
 * Mirrors DrillSession/createDrillSession/rateCard (drill.ts:214-278) and is
 * the ONLY consumer screens may use — the session machine is the
 * audit-blessed pattern (design §2.4); a synthetic-lesson path was rejected
 * (a 9001+ id would leak into progress counts).
 *
 * Key properties:
 *   - In-memory only: a review started but not finished is discarded (nothing
 *     persisted mid-run) — same semantics as drill sessions (edge #9).
 *   - Unlock gating uses loadProgress-derived LessonProgress[], NEVER
 *     unlockedLessons — placement-seeded frontiers and dev-mode unlock must
 *     not unlock reviews for uncompleted units (edges #4/#12).
 *   - Review progress lives in verbum-unit-review-<lang> (storage.ts), never
 *     in verbum-progress (key separation, edge #10).
 *   - Items carry per-item diagnostic metadata (conceptId/tags/expected) at
 *     composition time so the completion handler can emit
 *     recordAttempt(source:"review") per item with vocab:<lemma> /
 *     concept:<lessonId> / lesson:<id> (deriveConceptIds only works for
 *     authored Exercise objects — design §2.4 recommendation).
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage writes.
 */

import type {
  ComprehensionQuestion,
  FillInBlankExercise,
  Lesson,
  MatchingExercise,
  MultipleChoiceExercise,
  VocabularyItem,
} from "~/data/latinLessons";
import type { LessonProgress } from "~/engine/progress";
import type { Language } from "~/data/languages";
import type { PronMode } from "~/data/settings";
import { UNIT_REVIEW_CANDIDATE_POOL, UNIT_REVIEW_ITEM_COUNT } from "~/data/settings";
import { hashString, seededShuffle } from "~/engine/seededRandom";
import { utcDateStr } from "~/engine/dailyLesson";
import { normalizeAnswer } from "~/engine/answers";
import { boundUniverseForLesson, type LearnedUniverse } from "~/engine/learnedUniverse";
import { generateTranslationExercises } from "~/engine/translationGen";
import type { UnitReview } from "~/data/unitReviews";

/** Per-item diagnostic metadata attached at composition time (design §2.4). */
export interface ReviewItemMeta {
  /** Primary conceptId: "vocab:<lemma>" | "concept:<lessonId>" | "lesson:<id>". */
  conceptId: string;
  /** Additional concepts this item evidences (always includes `lesson:<id>`). */
  tags: string[];
  /** Canonical answer text — error-analysis copy. */
  expected: string;
}

export type ReviewItem = (MultipleChoiceExercise | FillInBlankExercise | MatchingExercise) & ReviewItemMeta;

/** Progress state of a review run (one per unit review). */
export interface ReviewSession {
  unitNumber: number;
  /** Index of the item currently on screen (0-based). */
  index: number;
  /** Whether the current item's answer has been revealed. */
  revealed: boolean;
  /** Items answered correctly, in completion order. */
  gotIt: ReviewItem[];
  /** Items answered incorrectly, in completion order. */
  missed: ReviewItem[];
  /** True once every item has been rated. */
  done: boolean;
}

/** Initial session for a review's items (done immediately for an empty set). */
export function createReviewSession(unitNumber: number, items: ReviewItem[]): ReviewSession {
  return { unitNumber, index: 0, revealed: false, gotIt: [], missed: [], done: items.length === 0 };
}

/**
 * Advance a review session after the user rates the current item. Pure:
 * returns a new session and never mutates the input. Mirrors rateCard
 * (drill.ts:256-278) — no streak (reviews are milestone checks, not runs).
 */
export function rateReviewItem(
  session: ReviewSession,
  correct: boolean,
  totalItems: number,
  item?: ReviewItem,
): ReviewSession {
  if (session.done || totalItems <= 0) return session;
  const gotIt = item && correct ? [...session.gotIt, item] : session.gotIt;
  const missed = item && !correct ? [...session.missed, item] : session.missed;
  const nextIndex = session.index + 1;
  const done = nextIndex >= totalItems;
  return {
    ...session,
    gotIt,
    missed,
    index: done ? session.index : nextIndex,
    revealed: done ? session.revealed : false,
    done,
  };
}

/**
 * True when every lesson id of the unit (including its mastery review, e.g.
 * 25 for unit 1) has a completed entry in the passed progress. Gate uses
 * loadProgress-derived data, NEVER unlockedLessons.
 */
export function isUnitComplete(unit: UnitReview, progress: LessonProgress[]): boolean {
  const done = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  return unit.lessonIds.every((id) => done.has(id));
}

// ── Item builders (seeded, deterministic per (language, unit, seed)) ─────

/** A usable MC target: single-word latin + non-empty gloss (paradigms like
 *  "magnus, magna, magnum" and phrases like "et…et" are excluded). */
function mcEligible(w: VocabularyItem): boolean {
  return w.latin.length > 0 && !/[\s,;]/.test(w.latin) && w.english.length > 0;
}

function introLessonId(universe: LearnedUniverse, lemma: string): number | undefined {
  return universe.wordIntroLesson.get(lemma);
}

function vocabMc(
  unit: UnitReview,
  pool: VocabularyItem[],
  universe: LearnedUniverse,
  seed: string,
  idx: number,
): ReviewItem | null {
  if (pool.length === 0) return null;
  const candidates = seededShuffle(pool, `${seed}|v${idx}`);
  let target: VocabularyItem | null = null;
  let distractors: string[] = [];
  let latinToEnglish = true;
  for (const cand of candidates) {
    latinToEnglish = hashString(`${seed}|dir${idx}`) % 2 === 0;
    const correct = latinToEnglish ? cand.english : cand.latin;
    const poolVals = pool
      .map((w) => (latinToEnglish ? w.english : w.latin))
      .filter((v) => normalizeAnswer(v) !== normalizeAnswer(correct));
    const uniq = Array.from(new Set(poolVals));
    const picks = seededShuffle(uniq, `${seed}|d${idx}`).slice(0, UNIT_REVIEW_CANDIDATE_POOL).slice(0, 3);
    if (picks.length >= 3) {
      target = cand;
      distractors = picks;
      break;
    }
  }
  const lemma = normalizeAnswer(target?.latin ?? candidates[0].latin);
  const fallbackTarget = candidates[0];
  const intro = introLessonId(universe, lemma);
  const tags = intro !== undefined ? [`lesson:${intro}`] : [];

  if (!target) {
    // < 3 distractors in the whole pool — emit a fill-in-blank instead of MC
    // (never an empty option set, plan §2.3).
    return {
      type: "fill-in-blank",
      id: `review-u${unit.unitNumber}-v${idx}`,
      prompt: `What does "${fallbackTarget.latin}" mean?`,
      answer: fallbackTarget.english,
      acceptableAnswers: [fallbackTarget.english],
      explanation: `"${fallbackTarget.latin}" means "${fallbackTarget.english}".`,
      conceptId: `vocab:${lemma}`,
      tags,
      expected: fallbackTarget.english,
    };
  }
  const correct = latinToEnglish ? target.english : target.latin;
  const options = seededShuffle([correct, ...distractors], `${seed}|o${idx}`);
  return {
    type: "multiple-choice",
    id: `review-u${unit.unitNumber}-v${idx}`,
    prompt: latinToEnglish
      ? `What does "${target.latin}" mean?`
      : `Which Latin word means "${target.english}"?`,
    options,
    correctIndex: options.indexOf(correct),
    explanation: latinToEnglish
      ? `"${target.latin}" means "${target.english}".`
      : `"${target.latin}" is the Latin word for "${target.english}".`,
    conceptId: `vocab:${lemma}`,
    tags,
    expected: correct,
  };
}

function grammarMc(
  unit: UnitReview,
  ccLessons: Lesson[],
  seed: string,
  idx: number,
): ReviewItem | null {
  for (const lesson of seededShuffle(ccLessons, `${seed}|g${idx}`)) {
    const qs = lesson.comprehensionCheck ?? [];
    if (qs.length === 0) continue;
    const q = seededShuffle<ComprehensionQuestion>(qs, `${seed}|q${idx}`)[0];
    return {
      type: "multiple-choice",
      id: `review-u${unit.unitNumber}-g${idx}`,
      prompt: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      conceptId: `concept:${lesson.id}`,
      tags: [`lesson:${lesson.id}`],
      expected: q.options[q.correctIndex] ?? "",
    };
  }
  return null;
}

function masteryAnchor(
  masteryLesson: Lesson,
  exercises: (MultipleChoiceExercise | FillInBlankExercise | MatchingExercise)[],
  seed: string,
  idx: number,
): ReviewItem | null {
  const ex = seededShuffle(exercises, `${seed}|a${idx}`)[0];
  if (!ex) return null;
  const expected =
    ex.type === "multiple-choice"
      ? (ex.options[ex.correctIndex] ?? "")
      : ex.type === "fill-in-blank"
        ? ex.answer
        : ex.pairs.map((p) => `${p.left}=${p.right}`).join("; ");
  return {
    ...(ex as MultipleChoiceExercise | FillInBlankExercise | MatchingExercise),
    conceptId: `lesson:${masteryLesson.id}`,
    tags: [`lesson:${masteryLesson.id}`],
    expected,
  };
}

function matching(
  unit: UnitReview,
  pool: VocabularyItem[],
  universe: LearnedUniverse,
  seed: string,
  idx: number,
): ReviewItem | null {
  const words = seededShuffle(pool, `${seed}|m${idx}`).slice(0, 4);
  if (words.length < 4) return null;
  const pairs = words.map((w) => ({ left: w.latin, right: w.english }));
  const lemmas = words.map((w) => normalizeAnswer(w.latin));
  const firstIntro = introLessonId(universe, lemmas[0]);
  return {
    type: "matching",
    id: `review-u${unit.unitNumber}-m${idx}`,
    prompt: "Match each Latin word with its meaning",
    pairs,
    conceptId: `vocab:${lemmas[0]}`,
    tags: [
      ...(firstIntro !== undefined ? [`lesson:${firstIntro}`] : []),
      ...lemmas.slice(1).map((l) => `vocab:${l}`),
    ],
    expected: pairs.map((p) => `${p.left}=${p.right}`).join("; "),
  };
}

// ── Composition ──────────────────────────────────────────────────────────

/**
 * Compose the 10-item review for a unit (design §2.3):
 *   4 vocab MC (or 2 vocab MC + 2 mastery anchors for units 1/2/5/14),
 *   2 grammar MC (authored comprehensionCheck of the unit's lessons),
 *   2 translation fills (L→E, generated from the unit-bound universe),
 *   2 matching (4 pairs from the unit's vocab).
 * Returns [] when the unit is incomplete or has no items — never fabricates.
 * Seeded deterministic per (language, unit, UTC day); tests freeze seeds.
 */
export function composeUnitReview(opts: {
  unit: UnitReview;
  lessons: Lesson[]; // latinLessons
  universe: LearnedUniverse; // built with currentLessonId = the unit's last lesson
  progress: LessonProgress[];
  pronMode?: PronMode; // reserved — pronunciation is resolved at render (P2)
  language?: Language; // default "latin"
  seed?: string; // default `review|${language}|${YYYY-MM-DD UTC}|${unitNumber}`
}): ReviewItem[] {
  const { unit, lessons, universe, progress } = opts;
  const language = opts.language ?? "latin";
  if (!isUnitComplete(unit, progress)) return [];
  const seed = opts.seed ?? `review|${language}|${utcDateStr()}|${unit.unitNumber}`;

  // Bound = the unit's max-order lesson (units are contiguous index ranges,
  // so this covers the whole unit's learned words/topics).
  const boundLesson = unit.lessonIds
    .map((id) => lessons.find((l) => l.id === id))
    .filter((l): l is Lesson => l !== undefined)
    .sort((a, b) => (universe.order.get(a.id) ?? 0) - (universe.order.get(b.id) ?? 0))
    .pop();
  if (!boundLesson) return [];
  const bound = boundUniverseForLesson(universe, boundLesson);
  const mcPool = bound.words.filter(mcEligible);
  const items: ReviewItem[] = [];

  // ── 4 vocab MC, or 2 vocab MC + 2 mastery anchors ──────────────
  const masteryLesson =
    unit.masteryLessonId !== undefined ? lessons.find((l) => l.id === unit.masteryLessonId) : undefined;
  const anchorExercises: (MultipleChoiceExercise | FillInBlankExercise | MatchingExercise)[] =
    masteryLesson?.exercises.filter(
      (e): e is MultipleChoiceExercise | FillInBlankExercise | MatchingExercise =>
        e.type === "multiple-choice" || e.type === "fill-in-blank" || e.type === "matching",
    ) ?? [];
  const vocabMcCount = masteryLesson ? 2 : 4;
  for (let i = 0; i < vocabMcCount; i++) {
    const item = vocabMc(unit, mcPool, universe, seed, i);
    if (item) items.push(item);
  }
  if (masteryLesson) {
    for (let i = 0; i < 2; i++) {
      const item = masteryAnchor(masteryLesson, anchorExercises, seed, i);
      if (item) items.push(item);
    }
  }

  // ── 2 grammar MC from the unit's comprehensionChecks ───────────
  const ccLessons = unit.lessonIds
    .map((id) => lessons.find((l) => l.id === id))
    .filter((l): l is Lesson => l !== undefined && (l.comprehensionCheck?.length ?? 0) > 0);
  for (let i = 0; i < 2; i++) {
    const item = grammarMc(unit, ccLessons, seed, i);
    if (item) items.push(item);
  }

  // ── 2 translation fills (L→E, bounded to the unit) ─────────────
  const translations = generateTranslationExercises({
    universe,
    lesson: boundLesson,
    count: 2,
    direction: "latin-to-english",
    language,
    seed: `${seed}|trans`,
  });
  translations.forEach((t, i) => {
    items.push({
      ...t,
      id: `review-u${unit.unitNumber}-t${i}`,
      conceptId: `vocab:${t.lemmas[0] ?? ""}`,
      tags: [`lesson:${t.lessonId}`, ...t.lemmas.slice(1).map((l) => `vocab:${l}`)],
      expected: t.answer,
    });
  });

  // ── 2 matching (4 pairs from the unit's vocab) ─────────────────
  for (let i = 0; i < 2; i++) {
    const item = matching(unit, mcPool, universe, seed, i);
    if (item) items.push(item);
  }

  // Top-up: if any source came up short (never for real units), extend with
  // extra vocab MCs up to UNIT_REVIEW_ITEM_COUNT or the pool's exhaustion.
  let guard = 0;
  while (items.length < UNIT_REVIEW_ITEM_COUNT && guard < 20) {
    guard++;
    const item = vocabMc(unit, mcPool, universe, seed, items.length);
    if (!item) break;
    items.push(item);
  }
  return items;
}
