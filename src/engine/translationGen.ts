/**
 * translationGen.ts — Engine department: seeded translation generation over
 * the learned universe (owner direction 2026-08-12).
 *
 * The free-tier "any word / any idea" generator: composes Latin/English
 * sentences from authored SentenceFrames filled from the lesson-bounded
 * learned universe. Deterministic per (universe, lesson, seed) — ONE
 * mulberry32(hashString(seed)) stream per generation, never Math.random()
 * (drill.ts's shuffle is NOT used) — and never demands material the student
 * hasn't met (boundUniverseForLesson is the single enforcement point).
 *
 * P1 ships a starter frame catalog (~20 frames: SOV with 1st/2nd-decl nouns,
 * 3rd-person sg/pl verbs, negation non, conjunction et, predicate-nominative
 * est). The frame catalog is the free tier's honesty boundary: sentences are
 * combinatorially wide (frames × slots × learned vocabulary) but templated —
 * novel constructions beyond the catalog come from the paid AI seam (P2),
 * still bounded to the learned universe.
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage.
 */

import type { Language } from "~/data/languages";
import type { Lesson, VocabularyItem } from "~/data/latinLessons";
import { normalizeAnswer } from "~/engine/answers";
import { hashString, mulberry32 } from "~/engine/seededRandom";
import { TRANSLATION_DIRECTION_SWITCH } from "~/data/settings";
import { utcDateStr } from "~/engine/dailyLesson";
import { GRAMMAR_INDEX } from "~/data/grammarIndex";
import { mappedLessonIndex } from "~/data/unitReviews";
import { boundUniverseForLesson, type LearnedUniverse, type LessonBound } from "~/engine/learnedUniverse";

export type TranslationDirection = "latin-to-english" | "english-to-latin" | "mixed";

export interface FrameSlot {
  role: string; // "subject" | "object" | "verb" …
  kind: "noun" | "verb" | "adverb" | "adjective" | "preposition-phrase";
  case?: "nominative" | "accusative" | "genitive" | "dative" | "ablative";
  person?: 1 | 2 | 3;
  number?: "sg" | "pl";
  /** Matches VocabularyItem.type values ("verb", "1st decl.", "2nd decl.", …). */
  type?: string;
  /** P1 additive: restrict verb slots to present-tense 3sg forms (negation
   *  frames need a base form: "does not pray", not "does not prays"). */
  presentOnly?: boolean;
}

export interface SentenceFrame {
  id: string; // "sv-1st-decl", …
  /** GRAMMAR_INDEX topic ids needed ([] = none beyond the lesson's own words). */
  requires: string[];
  slots: FrameSlot[];
  /** "{role}" tokens, macrons preserved (no trailing period — added by the builder). */
  latinTemplate: string;
  /** "{role}" gloss tokens for L→E answers. */
  englishTemplate: string;
  productionHint: string; // "Translate into English." copy
}

export interface GeneratedTranslation {
  type: "fill-in-blank"; // reuses FillInBlank rendering + checkFillInBlank/checkTranslation
  prompt: string; // Latin sentence (L→E) or English gloss (E→L)
  answer: string; // canonical (gloss or Latin sentence, no trailing period)
  acceptableAnswers: string[]; // variants: article-less, macron-stripped
  explanation: string; // "X means Y" built from the fillers
  frameId: string; // provenance
  source: "universe";
  /** P1 additive: normalized lemmas of the slot fillers — diagnostics `vocab:<lemma>`. */
  lemmas: string[];
  /** P1 additive: the bound lesson id — diagnostics `lesson:<id>`. */
  lessonId: number;
  /** P1 additive (MC flavor): 3 distractor sentences from the same eligible universe. */
  distractors?: string[];
}

// ── Filler classification (VocabularyItem → slot eligibility) ────────────
// RISK 6: paradigm/phrase items ("magnus, magna, magnum", "et…et", "-ne")
// are invalid as frame slots — filtered by single-word/type/gloss checks.

const ADVERB_LEMMAS = new Set([
  "iam", "nunc", "semper", "saepe", "numquam", "tamen", "ibi",
  "subito", "primum", "omnino", "rursus", "praeterea",
]);

function isSingleWord(s: string): boolean {
  return s.length > 0 && !/[\s,;()]/.test(s) && !s.startsWith("-");
}

/** Clean verb/adverb gloss: pronoun prefix stripped, no parenthetical junk. */
function glossBase(english: string): string | null {
  const g = english
    .replace(/^he\/she\/it\s+/i, "")
    .replace(/^he\/she\s+/i, "")
    .replace(/^(he|she|it|they)\s+/i, "")
    .trim();
  if (!g || /[(),;]/.test(g)) return null;
  return g;
}

interface VerbClass {
  person: 3;
  number: "sg" | "pl";
  glossBase: string;
}

/** A 3rd-person verb form: single-word latin whose gloss names he/she/it/they/is/are.
 *  Passive forms ("is heard", "are sent") are excluded — P1 starter frames are
 *  active-voice only; a passive verb in an SOV frame would produce nonsense. */
function classifyVerb(item: VocabularyItem): VerbClass | null {
  if (!isSingleWord(item.latin)) return null;
  if (/^(he|she|it|is)\b/i.test(item.english)) {
    const g = glossBase(item.english);
    if (!g || /^(is|are)\s|\s(is|are)\s/.test(g)) return null; // passives
    return { person: 3, number: "sg", glossBase: g };
  }
  if (/^(they|are)\b/i.test(item.english)) {
    const g = glossBase(item.english);
    if (!g || /^(is|are)\s|\s(is|are)\s/.test(g)) return null;
    return { person: 3, number: "pl", glossBase: g };
  }
  return null;
}

/** A declension noun: single-word latin with a real declension type ("1st decl." …). */
function classifyNoun(item: VocabularyItem): string | null {
  if (!isSingleWord(item.latin)) return null;
  const t = item.type ?? "";
  if (!/^\d+(st|nd|rd|th)\s+decl\./.test(t)) return null;
  return t;
}

/** A whitelisted adverb with a clean gloss. */
function classifyAdverb(item: VocabularyItem): string | null {
  if (!isSingleWord(item.latin)) return null;
  if (!ADVERB_LEMMAS.has(normalizeAnswer(item.latin))) return null;
  return glossBase(item.english);
}

/** Present-tense 3sg verb (English gloss ends in -s) — negation frames only. */
function classifyPresentSgVerb(item: VocabularyItem): VerbClass | null {
  const v = classifyVerb(item);
  if (!v || v.number !== "sg") return null;
  if (v.glossBase === "is" || v.glossBase === "are" || v.glossBase === "was") return null;
  if (!/s$/.test(v.glossBase)) return null; // present 3sg English ends in -s ("prays", "sees")
  return v;
}

/** Intransitive/copular verbs — never fill a frame with an accusative object
 *  ("the sword came the grain" would be nonsense). P1 starter guard. */
const INTRANSITIVE_VERB_GLOSSES = new Set([
  "is", "are", "was", "were", "prays", "pray", "came", "come", "goes", "go",
  "stays", "stay", "remains", "remain", "stands", "stand", "sits", "sit",
  "lives", "live", "dwells", "dwell", "exists", "exist", "falls", "fall",
]);

/** True when the word can fill at least one frame slot — the frame-eligible
 *  set (the coverage-test universe: every word the generator can honestly emit). */
export function isWordEligibleForFrames(item: VocabularyItem): boolean {
  return classifyNoun(item) !== null || classifyVerb(item) !== null || classifyAdverb(item) !== null;
}

// ── Starter frame catalog (~20 frames, P1) ───────────────────────────────

function slot(role: string, kind: FrameSlot["kind"], extra: Partial<FrameSlot> = {}): FrameSlot {
  return { role, kind, ...extra };
}

export const STARTER_FRAMES: SentenceFrame[] = [
  // Subject (per declension) + 3rd-person singular verb — SV.
  { id: "sv-1st-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative", type: "1st decl." }), slot("verb", "verb", { person: 3, number: "sg" })], latinTemplate: "{subject} {verb}", englishTemplate: "the {subject} {verb}", productionHint: "Translate into English." },
  { id: "sv-2nd-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative", type: "2nd decl." }), slot("verb", "verb", { person: 3, number: "sg" })], latinTemplate: "{subject} {verb}", englishTemplate: "the {subject} {verb}", productionHint: "Translate into English." },
  { id: "sv-3rd-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative", type: "3rd decl." }), slot("verb", "verb", { person: 3, number: "sg" })], latinTemplate: "{subject} {verb}", englishTemplate: "the {subject} {verb}", productionHint: "Translate into English." },
  { id: "sv-4th-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative", type: "4th decl." }), slot("verb", "verb", { person: 3, number: "sg" })], latinTemplate: "{subject} {verb}", englishTemplate: "the {subject} {verb}", productionHint: "Translate into English." },
  { id: "sv-5th-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative", type: "5th decl." }), slot("verb", "verb", { person: 3, number: "sg" })], latinTemplate: "{subject} {verb}", englishTemplate: "the {subject} {verb}", productionHint: "Translate into English." },
  { id: "sv-any-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative" }), slot("verb", "verb", { person: 3, number: "sg" })], latinTemplate: "{subject} {verb}", englishTemplate: "the {subject} {verb}", productionHint: "Translate into English." },
  // Negative SV — non + present-tense 3sg (base form for "does not …").
  { id: "sv-neg-1st-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative", type: "1st decl." }), slot("verb", "verb", { person: 3, number: "sg", presentOnly: true })], latinTemplate: "{subject} non {verb}", englishTemplate: "the {subject} does not {verb}", productionHint: "Translate into English." },
  { id: "sv-neg-any-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative" }), slot("verb", "verb", { person: 3, number: "sg", presentOnly: true })], latinTemplate: "{subject} non {verb}", englishTemplate: "the {subject} does not {verb}", productionHint: "Translate into English." },
  // Conjoined subjects + 3rd-person plural verb — "X et Y orant".
  { id: "et-3pl-any-decl", requires: [], slots: [slot("subject1", "noun", { case: "nominative" }), slot("subject2", "noun", { case: "nominative" }), slot("verb", "verb", { person: 3, number: "pl" })], latinTemplate: "{subject1} et {subject2} {verb}", englishTemplate: "the {subject1} and the {subject2} {verb}", productionHint: "Translate into English." },
  { id: "et-sunt-any-decl", requires: [], slots: [slot("subject1", "noun", { case: "nominative" }), slot("subject2", "noun", { case: "nominative" })], latinTemplate: "{subject1} et {subject2} sunt", englishTemplate: "the {subject1} and the {subject2} are", productionHint: "Translate into English." },
  // SOV with a neuter noun as direct object (nominative = accusative).
  { id: "sov-neuter-object", requires: [], slots: [slot("subject", "noun", { case: "nominative" }), slot("object", "noun", { case: "accusative" }), slot("verb", "verb", { person: 3, number: "sg" })], latinTemplate: "{subject} {object} {verb}", englishTemplate: "the {subject} {verb} the {object}", productionHint: "Translate into English." },
  { id: "sov-neuter-object-neg", requires: [], slots: [slot("subject", "noun", { case: "nominative" }), slot("object", "noun", { case: "accusative" }), slot("verb", "verb", { person: 3, number: "sg", presentOnly: true })], latinTemplate: "{subject} {object} non {verb}", englishTemplate: "the {subject} does not {verb} the {object}", productionHint: "Translate into English." },
  // Predicate nominative — "X Y est" (both nominative).
  { id: "pred-nom-any-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative" }), slot("predicate", "noun", { case: "nominative" })], latinTemplate: "{subject} {predicate} est", englishTemplate: "the {subject} is the {predicate}", productionHint: "Translate into English." },
  { id: "pred-nom-1st-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative", type: "1st decl." }), slot("predicate", "noun", { case: "nominative", type: "1st decl." })], latinTemplate: "{subject} {predicate} est", englishTemplate: "the {subject} is the {predicate}", productionHint: "Translate into English." },
  { id: "pred-nom-neg", requires: [], slots: [slot("subject", "noun", { case: "nominative" }), slot("predicate", "noun", { case: "nominative" })], latinTemplate: "{subject} {predicate} non est", englishTemplate: "the {subject} is not the {predicate}", productionHint: "Translate into English." },
  // Adverb frames — "{subject} {adverb} {verb}".
  { id: "sv-adv-any-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative" }), slot("verb", "verb", { person: 3, number: "sg" }), slot("adverb", "adverb")], latinTemplate: "{subject} {adverb} {verb}", englishTemplate: "the {subject} {adverb} {verb}", productionHint: "Translate into English." },
  { id: "sv-adv-1st-decl", requires: [], slots: [slot("subject", "noun", { case: "nominative", type: "1st decl." }), slot("verb", "verb", { person: 3, number: "sg" }), slot("adverb", "adverb")], latinTemplate: "{subject} {adverb} {verb}", englishTemplate: "the {subject} {adverb} {verb}", productionHint: "Translate into English." },
  // Ordering-trap frame: requires the third-conjugation topic (lessons 46–49).
  { id: "sv-3rd-conj", requires: ["third-conjugation"], slots: [slot("subject", "noun", { case: "nominative" }), slot("verb", "verb", { person: 3, number: "sg" })], latinTemplate: "{subject} {verb}", englishTemplate: "the {subject} {verb}", productionHint: "Translate into English." },
  // Conjoined first-declension subjects with sunt (agreement-friendly variant).
  { id: "et-sunt-1st-decl", requires: [], slots: [slot("subject1", "noun", { case: "nominative", type: "1st decl." }), slot("subject2", "noun", { case: "nominative", type: "1st decl." })], latinTemplate: "{subject1} et {subject2} sunt", englishTemplate: "the {subject1} and the {subject2} are", productionHint: "Translate into English." },
];

// ── Slot filling ─────────────────────────────────────────────────────────

function fillersForSlot(slotDef: FrameSlot, bound: LessonBound, transitiveOnly: boolean): VocabularyItem[] {
  const words = bound.words;
  switch (slotDef.kind) {
    case "noun": {
      return words.filter((w) => {
        const decl = classifyNoun(w);
        if (!decl) return false;
        if (slotDef.type && decl !== slotDef.type) return false;
        if (slotDef.case === "accusative") {
          // P1 direct objects: neuter nouns only (nominative = accusative —
          // the vocabulary stores dictionary/nominative forms).
          if (w.gender !== "n.") return false;
        }
        return true;
      });
    }
    case "verb": {
      return words.filter((w) => {
        const v = slotDef.presentOnly ? classifyPresentSgVerb(w) : classifyVerb(w);
        if (!v) return false;
        if (slotDef.person !== undefined && v.person !== slotDef.person) return false;
        if (slotDef.number !== undefined && v.number !== slotDef.number) return false;
        if (transitiveOnly && INTRANSITIVE_VERB_GLOSSES.has(v.glossBase)) return false;
        return true;
      });
    }
    case "adverb":
      return words.filter((w) => classifyAdverb(w) !== null);
    default:
      return [];
  }
}

function slotGloss(slotDef: FrameSlot, item: VocabularyItem): string {
  if (slotDef.kind === "verb") {
    const v = classifyVerb(item);
    const base = v ? v.glossBase : item.english;
    // Always use the pronoun-stripped gloss ("prays", not "he/she prays") so
    // L→E answers and E→L prompts read naturally; negation frames need the
    // bare base form ("does not pray", not "does not prays").
    return slotDef.presentOnly ? base.replace(/s$/, "") : base;
  }
  return item.english;
}

/** Fill every slot from the bound (seeded picks); null when a slot is empty
 *  (caller skips the frame and re-picks — the generator never emits an
 *  unanswerable item). */
function fillFrame(
  frame: SentenceFrame,
  bound: LessonBound,
  rng: () => number,
): { latins: Record<string, string>; glosses: Record<string, string>; fillers: VocabularyItem[] } | null {
  const latins: Record<string, string> = {};
  const glosses: Record<string, string> = {};
  const fillers: VocabularyItem[] = [];
  const usedLemmas = new Set<string>();
  // Frames with an accusative slot need transitive verbs ("the sword came the
  // grain" is nonsense — P1 starter guard).
  const transitiveOnly = frame.slots.some(
    (s) => s.kind === "noun" && s.case === "accusative",
  );
  for (const slotDef of frame.slots) {
    const pool = fillersForSlot(slotDef, bound, transitiveOnly).filter((w) => {
      const k = normalizeAnswer(w.latin);
      return !usedLemmas.has(k);
    });
    if (pool.length === 0) return null;
    const item = pool[Math.floor(rng() * pool.length)];
    usedLemmas.add(normalizeAnswer(item.latin));
    latins[slotDef.role] = item.latin;
    glosses[slotDef.role] = slotGloss(slotDef, item);
    fillers.push(item);
  }
  return { latins, glosses, fillers };
}

// ── Answers & variants ───────────────────────────────────────────────────

/** Remove macrons/combining marks (ā → a) — same normalization students get. */
function stripMacrons(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Acceptable-answer variants for a translation answer (copy of the
 *  answerVariants idea in fallbackGenerator.ts — module-private, do NOT
 *  import it, risk 9): the answer itself, plus article-less (English) or
 *  macron-stripped / period-less (Latin) forms. */
function translationAcceptableAnswers(
  answer: string,
  direction: "latin-to-english" | "english-to-latin",
): string[] {
  const variants: string[] = [answer];
  const add = (v: string) => {
    if (!variants.includes(v)) variants.push(v);
  };
  if (direction === "english-to-latin") {
    add(stripMacrons(answer));
    add(answer.replace(/\.$/, ""));
    add(stripMacrons(answer.replace(/\.$/, "")));
  } else {
    add(answer.replace(/\bthe\s+/g, ""));
  }
  return variants;
}

// ── Direction & difficulty ───────────────────────────────────────────────

/** Difficulty axis of a frame: the max introducing-lesson index of its
 *  required topics (0 for requires: [] — word-level bounds only). */
function frameDifficulty(frame: SentenceFrame): number {
  if (frame.requires.length === 0) return 0;
  return Math.max(
    -1,
    ...frame.requires.map((t) => {
      const topic = GRAMMAR_INDEX.find((g) => g.id === t);
      return topic ? Math.max(-1, ...topic.relatedLessonIds.map(mappedLessonIndex)) : -1;
    }),
  );
}

function directionFor(
  direction: TranslationDirection,
  index: number,
  difficulty: number,
): "latin-to-english" | "english-to-latin" {
  if (direction !== "mixed") return direction;
  // mixed alternates; the FIRST item follows the difficulty flip at
  // TRANSLATION_DIRECTION_SWITCH (production = E→L when difficulty ≥ 0.5).
  const first: "latin-to-english" | "english-to-latin" =
    difficulty < TRANSLATION_DIRECTION_SWITCH ? "latin-to-english" : "english-to-latin";
  return index % 2 === 0 ? first : first === "latin-to-english" ? "english-to-latin" : "latin-to-english";
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Generate `count` translation exercises for a lesson, bounded to its learned
 * universe. Empty bound → [] (never fabricate). Seeded deterministic:
 * same (universe, lesson, seed) → byte-identical output.
 */
export function generateTranslationExercises(opts: {
  universe: LearnedUniverse;
  /** Bound = boundUniverseForLesson(universe, lesson). */
  lesson: Lesson;
  count: number;
  language?: Language; // default "latin"
  direction?: TranslationDirection; // default "mixed" (alternates)
  difficulty?: number; // 0..1 — default order(lesson)/lessons.length
  seed?: string; // default `trans|${language}|${YYYY-MM-DD UTC}|${lesson.id}`; tests freeze
  frames?: SentenceFrame[]; // tests may inject; default STARTER_FRAMES
  withDistractors?: boolean; // MC flavor: 3 distractor sentences (L→E items)
}): GeneratedTranslation[] {
  const { universe, lesson } = opts;
  const language = opts.language ?? "latin";
  const direction = opts.direction ?? "mixed";
  const seed = opts.seed ?? `trans|${language}|${utcDateStr()}|${lesson.id}`;
  const frames = opts.frames ?? STARTER_FRAMES;
  const count = Math.max(0, Math.floor(opts.count));
  if (count === 0) return [];

  const bound = boundUniverseForLesson(universe, lesson);
  if (bound.words.length === 0) return []; // empty universe — never fabricate

  const lessonsTotal = Math.max(1, universe.lessons.length);
  const difficulty =
    opts.difficulty ?? (universe.order.get(lesson.id) ?? 0) / lessonsTotal;

  // Eligible frames: requires ⊆ bound.topics, sorted by difficulty asc.
  const eligible = frames
    .filter((f) => f.requires.every((t) => bound.topics.some((b) => b.id === t)))
    .sort((a, b) => frameDifficulty(a) - frameDifficulty(b));
  if (eligible.length === 0) return [];

  // ONE seeded stream for the whole generation.
  const rng = mulberry32(hashString(seed));
  const out: GeneratedTranslation[] = [];
  const emitted = new Set<string>();
  const working = [...eligible];
  const maxAttempts = count * 40 + 100;
  let attempts = 0;

  while (out.length < count && working.length > 0 && attempts < maxAttempts) {
    attempts++;
    const fi = Math.floor(rng() * working.length);
    const frame = working[fi];
    const filled = fillFrame(frame, bound, rng);
    if (!filled) {
      working.splice(fi, 1); // empty filler → skip the frame and re-pick
      continue;
    }
    const latin = frame.latinTemplate.replace(/\{(\w+)\}/g, (_, role: string) => filled.latins[role] ?? "");
    const gloss = frame.englishTemplate.replace(/\{(\w+)\}/g, (_, role: string) => filled.glosses[role] ?? "");
    const key = normalizeAnswer(latin);
    if (emitted.has(key)) continue; // no duplicate sentences in one generation
    emitted.add(key);

    const itemDirection = directionFor(direction, out.length, difficulty);
    const lemmas = filled.fillers.map((f) => normalizeAnswer(f.latin));
    const answer = itemDirection === "latin-to-english" ? gloss : latin;
    const prompt =
      itemDirection === "latin-to-english"
        ? `Translate into English: ${latin}.`
        : `Translate into Latin: ${gloss}`;
    const explanation =
      itemDirection === "latin-to-english"
        ? `"${latin}" means "${gloss}".`
        : `"${gloss}" is "${latin}" in Latin.`;

    const item: GeneratedTranslation = {
      type: "fill-in-blank",
      prompt,
      answer,
      acceptableAnswers: translationAcceptableAnswers(answer, itemDirection),
      explanation,
      frameId: frame.id,
      source: "universe",
      lemmas,
      lessonId: lesson.id,
    };

    if (opts.withDistractors && itemDirection === "latin-to-english") {
      const distractors = generateDistractors(bound, latin, frame, working, rng);
      if (distractors.length > 0) item.distractors = distractors;
    }
    out.push(item);
  }
  return out;
}

/** MC flavor: up to 3 distractor Latin sentences from the same eligible
 *  universe (so options are always known material), distinct from the answer
 *  and from each other. Consumes the same rng stream (deterministic). */
function generateDistractors(
  bound: LessonBound,
  answerLatin: string,
  frame: SentenceFrame,
  working: SentenceFrame[],
  rng: () => number,
): string[] {
  const distractors: string[] = [];
  const seen = new Set<string>([normalizeAnswer(answerLatin)]);
  const pool = working.length > 0 ? working : [frame];
  let attempts = 0;
  while (distractors.length < 3 && attempts < 60) {
    attempts++;
    const f = pool[Math.floor(rng() * pool.length)];
    const filled = fillFrame(f, bound, rng);
    if (!filled) continue;
    const latin = f.latinTemplate.replace(/\{(\w+)\}/g, (_, role: string) => filled.latins[role] ?? "");
    const key = normalizeAnswer(latin);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(latin);
  }
  return distractors;
}
