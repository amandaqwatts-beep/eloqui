/**
 * answers.ts — Engine department: exercise answer scoring utilities.
 *
 * Pure, framework-free string/number comparison helpers consumed by the
 * Screens team's exercise components (fill-in-blank and multiple-choice
 * scoring). `normalizeAnswer` handles macrons and accents (ā → a) so
 * students typing plain ASCII against macron-marked Latin answers still
 * match — e.g. "terra" matches the answer "terrā".
 */

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
