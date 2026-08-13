/**
 * answers.ts — Engine department: exercise answer scoring utilities.
 *
 * Pure, framework-free string/number comparison helpers consumed by the
 * Screens team's exercise components (fill-in-blank and multiple-choice
 * scoring). `normalizeAnswer` handles macrons and accents (ā → a) so
 * students typing plain ASCII against macron-marked Latin answers still
 * match — e.g. "terra" matches the answer "terrā".
 */

import { TRANSLATION_TOKEN_OVERLAP } from "~/data/settings";

/**
 * Normalize a student answer for comparison:
 * 1. trim surrounding whitespace
 * 2. lowercase
 * 3. decompose to NFD and strip combining marks (macrons, accents)
 */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * True when the input matches the canonical answer or any acceptable
 * alternative, after normalization on both sides. Empty acceptableAnswers
 * is fine — only `answer` is then considered.
 */
export function checkFillInBlank(
  input: string,
  answer: string,
  acceptableAnswers: string[],
): boolean {
  const normalized = normalizeAnswer(input);
  return (
    normalizeAnswer(answer) === normalized ||
    acceptableAnswers.some((a) => normalizeAnswer(a) === normalized)
  );
}

/** True when the selected option index is the correct one. */
export function checkMultipleChoice(
  selected: number,
  correctIndex: number,
): boolean {
  return selected === correctIndex;
}

// ── Translation scoring (review-system rework, owner direction 2026-08-12) ─
// Lenient sentence check for the universe generator (research/
// review-system-rework-design.md §1.3). Deterministic: the same input always
// scores the same way. Risk 5: a naive 0.6 token overlap false-accepts "the
// sailors pray" against "the sailor prays" (2/3 = 0.67) — so we also require
// a main-verb lemma match: a verb present in the answer must be present in
// the input under the same lemma ("prays" never matches "praises").

const TRANSLATION_STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "for", "with", "by", "in", "on", "at",
  "from", "and", "or", "not", "but", "as", "than",
]);

const TRANSLATION_VERB_IRREGULARS = new Set([
  "is", "are", "was", "were", "am", "be", "been", "being",
  "has", "have", "had", "do", "does", "did", "done",
  "can", "could", "will", "would", "shall", "should", "may", "might", "must",
]);

/** Small English verb lemmatizer for the main-verb gate. */
function englishVerbLemma(tok: string): string {
  const w = tok.toLowerCase();
  if (w === "is" || w === "are" || w === "was" || w === "were" || w === "am" || w === "be" || w === "been" || w === "being") return "be";
  if (w === "has" || w === "have" || w === "had") return "have";
  if (w === "do" || w === "does" || w === "did" || w === "done") return "do";
  if (w.endsWith("ing")) return w.slice(0, -3);
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("ed")) return w.slice(0, -2);
  if (w.endsWith("es")) return w.slice(0, -2);
  if (w.endsWith("s") && w.length > 2) return w.slice(0, -1);
  return w;
}

function isVerbToken(w: string): boolean {
  return (
    TRANSLATION_VERB_IRREGULARS.has(w) ||
    (/(?:ing|ed|ies|es|s)$/.test(w) && !TRANSLATION_STOPWORDS.has(w))
  );
}

/** Normalized, punctuation-stripped tokens of a sentence. */
function sentenceTokens(s: string): string[] {
  return normalizeAnswer(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Lenient translation check: normalized equality OR acceptable-variant match
 * OR token-set overlap ≥ TRANSLATION_TOKEN_OVERLAP (handles valid rewordings
 * the template didn't foresee) AND a main-verb lemma match (risk 5).
 */
export function checkTranslation(
  input: string,
  answer: string,
  acceptableAnswers: string[],
): boolean {
  const normalized = normalizeAnswer(input);
  if (normalizeAnswer(answer) === normalized) return true;
  if (acceptableAnswers.some((a) => normalizeAnswer(a) === normalized)) return true;

  const inTokens = sentenceTokens(input);
  const outTokens = sentenceTokens(answer);
  if (inTokens.length === 0 || outTokens.length === 0) return false;

  const inSet = new Set(inTokens);
  const common = outTokens.filter((t) => inSet.has(t)).length;
  if (common / outTokens.length < TRANSLATION_TOKEN_OVERLAP) return false;

  // Main-verb lemma gate: every verb token in the answer must have its lemma
  // present in the input's lemmas. "the sailor prays" vs "the sailor praises":
  // overlap 2/3 ≥ 0.6, but pray ∉ {…, praise} → false.
  const outLemmas = outTokens.map(englishVerbLemma);
  const inLemmas = new Set(inTokens.map(englishVerbLemma));
  const answerVerbLemmas = outLemmas.filter((_, i) => isVerbToken(outTokens[i]));
  if (answerVerbLemmas.length > 0 && !answerVerbLemmas.some((l) => inLemmas.has(l))) {
    return false;
  }
  return true;
}
