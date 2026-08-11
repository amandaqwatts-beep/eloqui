/**
 * fallbackGenerator.ts — Engine department: client-side fallback exercise
 * generator for AI Practice Mode.
 *
 * Generates novel Latin exercises purely from lesson data (vocabulary,
 * reference tables/declension charts, grammar concept) — zero AI, zero
 * network, deterministic and instant. Used by the AI Practice screen as the
 * free-tier fallback when AI is disabled or API credits run out.
 *
 * Pure TypeScript — no React, no JSX, no side effects. Content-driven, so it
 * works for any Lesson[] (Latin today, Hebrew/Greek later) as long as the
 * lesson carries vocabulary and/or a reference table.
 */

import latinLessons, {
  type Lesson,
  type VocabularyItem,
} from "~/data/latinLessons";
import { shuffle } from "~/engine/drill";

/** Exercise kinds the fallback generator can produce. */
export type FallbackExerciseType = "multiple-choice" | "fill-in-blank" | "matching";

/**
 * A generated practice exercise. Exactly one field group is populated,
 * matching `type`:
 * - "multiple-choice": options + correctIndex
 * - "fill-in-blank":   answer + acceptableAnswers
 * - "matching":        pairs
 * `explanation` is optional and may appear on any type.
 */
export interface GeneratedExercise {
  type: FallbackExerciseType;
  prompt: string;
  /** MC: the answer options in display order. */
  options?: string[];
  /** MC: 0-based index of the correct option. */
  correctIndex?: number;
  /** Fill: canonical answer. */
  answer?: string;
  /** Fill: alternate spellings (e.g. macron-stripped variants) that also count. */
  acceptableAnswers?: string[];
  /** Matching: left = Latin, right = English (right column may be scrambled by the UI). */
  pairs?: { left: string; right: string }[];
  /** Optional teaching hint shown after answering. */
  explanation?: string;
}

/** Which exercise kind(s) to generate. */
export type FallbackMode = "mc" | "fill" | "conjugation" | "mixed";

// ── Small utilities ────────────────────────────────────────────

/** Strip HTML tags from concept/teaching text. */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

/** Pick a random element (uniform). */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Remove macrons/combining marks (ā → a) — same normalization students get. */
function stripMacrons(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Unique acceptable-answer variants for a fill-in-blank answer:
 * the original, the macron-stripped form, and (for ending cells like "-ās")
 * a hyphen-less form.
 */
function answerVariants(answer: string): string[] {
  const variants: string[] = [answer];
  const noMacrons = stripMacrons(answer);
  if (noMacrons !== answer && !variants.includes(noMacrons)) variants.push(noMacrons);
  if (answer.startsWith("-")) {
    const bare = answer.slice(1);
    if (!variants.includes(bare)) variants.push(bare);
    const bareNoMacrons = stripMacrons(bare);
    if (!variants.includes(bareNoMacrons)) variants.push(bareNoMacrons);
  }
  return variants;
}

// ── Strategy builders (each returns null when the lesson lacks the data) ──

/**
 * Vocabulary multiple choice: "What does '{latin}' mean?" (L→E) or
 * "Which Latin word means '{english}'?" (E→L). Options are the correct item
 * plus up to 3 distractor entries drawn from the same lesson's vocabulary.
 * Returns null when the lesson has fewer than 4 vocab items (not enough for
 * a full option set).
 */
function buildVocabMultipleChoice(
  lesson: Lesson,
  language: "latin" | "english" = "latin",
): GeneratedExercise | null {
  const vocab = lesson.vocabulary ?? [];
  if (vocab.length < 4) return null;

  const target = pick(vocab);
  const latinToEnglish = Math.random() < 0.5;

  const correct = latinToEnglish ? target.english : target.latin;
  const pool = shuffle(
    vocab
      .map((v) => (latinToEnglish ? v.english : v.latin))
      .filter((v) => v !== correct),
  );
  // Dedupe (e.g. two items sharing an English gloss), then take 3 distractors.
  const distractors = Array.from(new Set(pool)).slice(0, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([correct, ...distractors]);
  return {
    type: "multiple-choice",
    prompt: latinToEnglish
      ? `What does "${target.latin}" mean?`
      : language === "latin"
        ? `Which Latin word means "${target.english}"?`
        : `Which formal word means "${target.english}"?`,
    options,
    correctIndex: options.indexOf(correct),
    explanation: latinToEnglish
      ? `"${target.latin}" means "${target.english}".`
      : language === "latin"
        ? `"${target.latin}" is the Latin word for "${target.english}".`
        : `"${target.latin}" is the formal word for "${target.english}".`,
  };
}

/** A random declension/chart fill-in-blank. */
function buildFillInBlank(lesson: Lesson): GeneratedExercise | null {
  const table = lesson.referenceTable;
  if (!table) return null;

  // Locate the case / singular / plural columns by header name. Only tables
  // that look like declension charts qualify (e.g. ["Case","Singular","Plural"]).
  const caseIdx = table.headers.findIndex((h) => /case/i.test(h));
  const singIdx = table.headers.findIndex((h) => /singular/i.test(h));
  const plurIdx = table.headers.findIndex((h) => /plural/i.test(h));
  if (singIdx < 0 && plurIdx < 0 && caseIdx < 0) return null;
  if (table.rows.length === 0) return null;

  const row = pick(table.rows);
  const caseName = row[caseIdx >= 0 ? caseIdx : 0]?.trim() ?? "";
  const singular = singIdx >= 0 ? row[singIdx]?.trim() ?? "" : "";
  const plural = plurIdx >= 0 ? row[plurIdx]?.trim() ?? "" : "";

  // Prefer a full word form; fall back to the other number.
  let answer = "";
  let number = "";
  if (singular && plural) {
    if (Math.random() < 0.5) {
      answer = singular;
      number = "singular";
    } else {
      answer = plural;
      number = "plural";
    }
  } else if (singular) {
    answer = singular;
    number = "singular";
  } else if (plural) {
    answer = plural;
    number = "plural";
  } else {
    return null;
  }
  if (!caseName || !answer) return null;

  // Model noun: prefer one named in the table title ("The Declension of terra"),
  // else the lesson's first vocab word.
  const titleNoun = table.title.match(/of\s+([a-zāēīōūĀĒĪŌŪ]+)/i)?.[1];
  const noun =
    (titleNoun &&
      (lesson.vocabulary ?? []).some((v) => v.latin === titleNoun) &&
      titleNoun) ||
    lesson.vocabulary?.[0]?.latin ||
    "";

  const isEnding = answer.startsWith("-");
  const prompt = isEnding
    ? `The ${caseName} ${number} ending is: ___`
    : `The ${caseName} ${number} of "${noun}" is: ___`;

  return {
    type: "fill-in-blank",
    prompt,
    answer,
    acceptableAnswers: answerVariants(answer),
    explanation: isEnding
      ? `The ${caseName} ${number} ending is "${answer}".`
      : `"${answer}" is the ${caseName} ${number} form of "${noun}".`,
  };
}

/**
 * Matching: 4–5 Latin↔English vocab pairs. Left = Latin, right = English;
 * pair order is scrambled (the UI additionally scrambles the right column).
 * Returns null when the lesson has fewer than 4 vocab items.
 */
function buildMatching(
  lesson: Lesson,
  language: "latin" | "english" = "latin",
): GeneratedExercise | null {
  const vocab = lesson.vocabulary ?? [];
  if (vocab.length < 4) return null;

  const count = Math.min(5, vocab.length);
  const chosen = shuffle(vocab).slice(0, count);
  return {
    type: "matching",
    prompt:
      language === "latin"
        ? "Match each Latin word with its meaning"
        : "Match each word with its meaning",
    pairs: shuffle(
      chosen.map((v) => ({ left: v.latin, right: v.english })),
    ),
  };
}

function buildConjugation(lesson: Lesson): GeneratedExercise | null {
  const table = lesson.conjugationTable;
  if (!table || !table.rows.length) return null;
  const row = pick(table.rows);
  const singular = Math.random() < 0.5;
  const answer = singular ? row.singular : row.plural;
  const number = singular ? "singular" : "plural";
  if (Math.random() < 0.5) return { type: "fill-in-blank", prompt: `The ${row.person} person ${number} of '${table.title.split(':')[1]?.trim() ?? table.title}' is: ___`, answer, acceptableAnswers: answerVariants(answer), explanation: `${answer} is the ${row.person} person ${number}.` };
  return { type: "fill-in-blank", prompt: `${answer} is the ___ person ___`, answer: `${row.person} ${number}`, acceptableAnswers: [`${row.person} ${number}`], explanation: `${answer} is the ${row.person} person ${number}.` };
}

// ── Concept fallback (no vocab / no reference table) ───────────

/** Common English words that can appear in concept prose — never used as answers. */
const ENGLISH_STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "which", "what",
  "most", "first", "second", "fourth", "means", "meaning", "marks", "mark",
  "show", "shows", "showing", "their", "them", "they", "she", "his", "her",
  "are", "was", "were", "not", "but", "its", "into", "more", "than", "also",
  "word", "words", "case", "cases", "form", "forms", "ending", "endings",
  "noun", "nouns", "verb", "verbs", "plural", "singular", "have", "has",
  "one", "two", "three", "can", "may", "like", "very", "when", "where",
  "who", "whom", "whose", "will", "would", "should", "could", "does",
]);

/**
 * Distractor words drawn from other lessons (the caller's curriculum), used
 * only as concept-fallback distractors. Latin draws from the Latin
 * curriculum; English draws from the distractor pool passed by the caller
 * (the English route passes `englishLessons`).
 */
function extraDistractors(
  exclude: string,
  count: number,
  language: "latin" | "english" = "latin",
  distractorLessons?: Lesson[],
): string[] {
  if (count <= 0) return [];
  const source =
    language === "english" ? (distractorLessons ?? []) : latinLessons;
  const words = source
    .flatMap((l) => l.vocabulary ?? [])
    .map((v: VocabularyItem) => v.latin)
    .filter((w) => w !== exclude);
  return shuffle(Array.from(new Set(words))).slice(0, count);
}

/**
 * Basic word-order multiple choice built from the lesson's concept text.
 * When the concept contains an italicized Latin phrase (e.g. "<em>nauta non
 * orat</em>"), the question asks which word order is correct. Otherwise it
 * falls back to a recognition question over a Latin word that actually
 * appears in the concept (distractors come from other lessons, so exactly
 * one option is correct).
 */
function buildConceptFallback(
  lesson: Lesson,
  language: "latin" | "english" = "latin",
  distractorLessons?: Lesson[],
): GeneratedExercise {
  // 1) Word-order MC from the first italicized Latin phrase in the concept.
  const phrase = lesson.concept.match(/<em>\s*([a-zāēīōūĀĒĪŌŪ][a-zāēīōūĀĒĪŌŪ\s.,]*?)<\/em>/i)?.[1];
  const words = phrase?.trim().split(/\s+/).filter(Boolean);
  if (words && words.length >= 3) {
    const correctOrder = words.join(" ");
    const permutations = new Set<string>([correctOrder]);
    let guard = 0;
    while (permutations.size < 4 && guard < 60) {
      guard++;
      permutations.add(shuffle(words).join(" "));
    }
    const options = shuffle([...permutations]);
    return {
      type: "multiple-choice",
      prompt:
        language === "latin"
          ? "Which shows the correct Latin word order?"
          : "Which shows the correct word order?",
      options,
      correctIndex: options.indexOf(correctOrder),
      explanation: `The correct word order is "${correctOrder}".`,
    };
  }

  // 2) Recognition MC: pick a Latin word from this lesson's concept.
  const ownLatinWords = Array.from(
    new Set(
      (stripHtml(lesson.concept).match(/[a-zāēīōūĀĒĪŌŪ]+/gi) ?? []).filter(
        (w) => w.length >= 3 && !ENGLISH_STOPWORDS.has(w.toLowerCase()),
      ),
    ),
  );
  if (ownLatinWords.length === 0) {
    // Last resort: comprehension of the lesson's own title/subtitle.
    return {
      type: "multiple-choice",
      prompt: "Which of these best describes this lesson?",
      options:
        language === "latin"
          ? [
              lesson.subtitle ?? lesson.title,
              "Ancient Roman cuisine",
              "Greek mythology",
              "Latin pronunciation",
            ]
          : [
              lesson.subtitle ?? lesson.title,
              "Formal writing conventions",
              "Greek mythology",
              "English pronunciation",
            ],
      correctIndex: 0,
      explanation: `This lesson is about ${lesson.title}.`,
    };
  }
  const correct = pick(ownLatinWords);
  const options = shuffle([
    correct,
    ...extraDistractors(correct, 3, language, distractorLessons),
  ]);
  return {
    type: "multiple-choice",
    prompt:
      language === "latin"
        ? "Which Latin word appears in this lesson's concept?"
        : "Which word from this lesson appears in its concept?",
    options,
    correctIndex: options.indexOf(correct),
    explanation: `"${correct}" is introduced in this lesson's concept.`,
  };
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Generate `count` novel practice exercises from a lesson's own data.
 *
 * @param lesson the Lesson to generate from (vocab + reference table used)
 * @param count  how many exercises to produce
 * @param mode   "mc" → vocabulary multiple choice only;
 *               "fill" → declension/chart fill-in-blank only;
 *               "mixed" (default) → rotate MC / fill / matching
 * @param language "latin" (default) keeps today's exact prompts/distractors;
 *               "english" uses formal-register wording and the caller's
 *               curriculum for distractors
 * @param distractorLessons curriculum array used for concept-fallback
 *               distractors (English passes `englishLessons`; Latin omits it)
 *
 * Every returned exercise has a valid `type` and the required fields for
 * that type. If the lesson lacks vocabulary and a reference table, exercises
 * fall back to concept-based multiple choice (see buildConceptFallback).
 */
export function generateFallbackExercises(
  lesson: Lesson,
  count: number,
  mode: FallbackMode = "mixed",
  language: "latin" | "english" = "latin",
  distractorLessons?: Lesson[],
): GeneratedExercise[] {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return [];

  const builders: Record<FallbackMode, (() => GeneratedExercise | null)[]> = {
    mc: [() => buildVocabMultipleChoice(lesson, language)],
    fill: [() => buildFillInBlank(lesson)],
    conjugation: [() => buildConjugation(lesson)],
    mixed: [
      () => buildVocabMultipleChoice(lesson, language),
      () => buildFillInBlank(lesson),
      () => buildMatching(lesson, language),
      () => buildConjugation(lesson),
    ],
  };
  const rotate = builders[mode];

  // Rotate through the mode's builders; any builder that lacks data for the
  // lesson falls back to a concept-based question, so every slot is filled.
  const out: GeneratedExercise[] = [];
  for (let i = 0; i < n; i++) {
    const build = rotate[i % rotate.length];
    out.push(
      build() ?? buildConceptFallback(lesson, language, distractorLessons),
    );
  }
  return out;
}
