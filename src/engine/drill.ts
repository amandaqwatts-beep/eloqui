/**
 * drill.ts — Engine department: drill card generation + session logic.
 *
 * All logic previously inlined in src/lib/drillUtils.ts (which is now a
 * re-export shim). Consumed by the Screens team via buildDrillCards /
 * createDrillSession / rateCard; the DrillSetup/DrillView screens build
 * the setup state and presentation on top.
 *
 * Card generation is content-driven: any Lesson[] works (Latin today,
 * Hebrew/Greek later). Pronunciation is resolved per-card from the
 * item's own pronunciation or the rule engine (lib/pronunciation).
 */

import type { Lesson, VocabularyItem } from "~/data/latinLessons";
import { getPronunciation } from "~/lib/pronunciation";
import type { PronMode } from "~/data/settings";

export type DrillKind =
  | "vocab-latin"
  | "vocab-english"
  | "conjugation"
  | "declension";

export type DrillCard = {
  id: string;
  kind: DrillKind;
  prompt: string;
  answer: string;
  label: string;
  /** Engine-generated pronunciation for Latin prompts (client-computed at display time) */
  pronunciation?: string;
  /** Bonus derivable info shown below the answer: paradigms, gender, declension, etc. */
  bonusInfo?: string;
};

// ── Bonus info derivation ──────────────────────────────────────

/** First declension ending patterns (longest first to match correctly). */
const FIRST_DECL_ENDINGS: { end: string; len: number }[] = [
  { end: "ārum", len: 4 },
  { end: "īs", len: 2 },
  { end: "ae", len: 2 },
  { end: "am", len: 2 },
  { end: "ās", len: 2 },
  { end: "ā", len: 1 },
  { end: "a", len: 1 },
];

/** First conjugation ending patterns (longest first). */
const FIRST_CONJ_ENDINGS: { end: string; len: number }[] = [
  { end: "āmus", len: 4 },
  { end: "ātis", len: 4 },
  { end: "ant", len: 3 },
  { end: "ās", len: 2 },
  { end: "at", len: 2 },
  { end: "ō", len: 1 },
];

function stripEnding(form: string, endings: { end: string; len: number }[]): string {
  for (const { end, len } of endings) {
    if (form.endsWith(end)) return form.slice(0, -len);
  }
  return form; // fallback — return the form as the "stem"
}

function firstDeclensionParadigm(stem: string): string {
  return [
    stem + "a",
    stem + "ae",
    stem + "ae",
    stem + "am",
    stem + "ā",
  ].join(", ") +
    " / " +
    [stem + "ae", stem + "ārum", stem + "īs", stem + "ās", stem + "īs"].join(", ");
}

function firstConjugationParadigm(stem: string): string {
  return [
    stem + "ō",
    stem + "ās",
    stem + "at",
    stem + "āmus",
    stem + "ātis",
    stem + "ant",
  ].join(", ");
}

function genderLabel(g: string | undefined): string {
  switch (g) {
    case "f.": return "feminine";
    case "m.": return "masculine";
    case "n.": return "neuter";
    default: return "";
  }
}

/** Returns true when the type field indicates a verb form (e.g. "verb", "1st sg.", "3rd pl."). */
function isVerbForm(t: string | undefined): boolean {
  if (!t) return false;
  if (t === "verb") return true;
  return /^\d(st|nd|rd|th)\s+(sg|pl)\.?$/i.test(t);
}

/**
 * Bonus info shown under an answer. QA-P4-2 rule: every string here must be
 * REAL data from the item (a paradigm the engine can actually decline for the
 * word's own class, or the captured gender) — never a borrowed class label
 * (the old "1st declension" on est/sunt) or a paradigm fabricated for a class
 * the strip tables don't model (the old 1st-declension endings invented for
 * 2nd/3rd-declension nouns). When nothing truthful can be derived: undefined.
 */
function computeBonusInfo(item: VocabularyItem, kind: DrillKind): string | undefined {
  const { latin, gender, type } = item;

  // ── Grammar cards: a paradigm only when the item's own class matches the
  //    strip tables (1st-declension nouns, 1st-conjugation verbs) ──
  if (kind === "conjugation") {
    const verbTyped = type === "verb" || isVerbForm(type);
    if (
      verbTyped &&
      FIRST_CONJ_ENDINGS.some(({ end }) => latin.endsWith(end))
    ) {
      const stem = stripEnding(latin, FIRST_CONJ_ENDINGS);
      return firstConjugationParadigm(stem) + " · 1st conjugation";
    }
    return undefined;
  }

  if (kind === "declension") {
    if (
      /^1st decl\./.test(type ?? "") &&
      FIRST_DECL_ENDINGS.some(({ end }) => latin.endsWith(end))
    ) {
      const stem = stripEnding(latin, FIRST_DECL_ENDINGS);
      const paradigm = firstDeclensionParadigm(stem);
      const g = genderLabel(gender);
      return g ? paradigm + " · " + g : paradigm + " · 1st declension";
    }
    return undefined;
  }

  // ── Vocabulary cards (L→E or E→L): real lexical metadata only ──
  return genderLabel(gender) || undefined;
}

function cardsFor(
  item: VocabularyItem,
  lessonId: number,
  index: number,
  pronMode: PronMode,
): DrillCard[] {
  // QA-P4-1: EVERY vocabulary item drills as Vocabulary (L→E and E→L). The
  // item's type only ADDS a grammar-kind card; it no longer replaces the
  // vocabulary cards (the old mapping gave typed items no vocabulary cards at
  // all, so a single-kind vocab drill collapsed to the few untyped items —
  // e.g. a fresh Lesson-1 run was 2 cards regardless of the count selection).
  const grammarKind: "conjugation" | "declension" | null =
    item.type === "verb"
      ? "conjugation"
      : item.type
        ? "declension"
        : null;
  const latin = item.latin;
  const english = item.english;
  const pron =
    item.pronunciation ?? getPronunciation(latin, pronMode);
  const vocabBonus = computeBonusInfo(item, "vocab-latin");

  const latinCard: DrillCard = {
    id: `${lessonId}-${index}-latin`,
    kind: "vocab-latin",
    prompt: latin,
    answer: english,
    label: "Vocabulary",
    pronunciation: pron,
    bonusInfo: vocabBonus,
  };
  const englishCard: DrillCard = {
    id: `${lessonId}-${index}-english`,
    kind: "vocab-english",
    prompt: english,
    answer: latin,
    label: "Vocabulary",
    bonusInfo: vocabBonus,
  };
  const grammarCard: DrillCard | null = grammarKind
    ? {
        id: `${lessonId}-${index}-grammar`,
        kind: grammarKind,
        prompt: latin,
        answer: english,
        label: grammarKind === "conjugation" ? "Conjugation" : "Declension",
        pronunciation: pron,
        bonusInfo: computeBonusInfo(item, grammarKind),
      }
    : null;

  return [latinCard, englishCard, ...(grammarCard ? [grammarCard] : [])];
}

/** Build cards only from lessons the learner has unlocked. */
export function buildDrillCards(
  lessons: Lesson[],
  unlockedLesson: number,
  mode: DrillKind | "mixed",
  pronMode: PronMode = "ecclesiastical",
): DrillCard[] {
  const cards = lessons
    .slice(0, unlockedLesson)
    .flatMap((lesson) =>
      (lesson.vocabulary ?? []).flatMap((item, index) =>
        cardsFor(item, lesson.id, index, pronMode),
      ),
    );
  return mode === "mixed"
    ? cards
    : cards.filter((card) => card.kind === mode);
}

/**
 * Return a shuffled copy of `items` (Fisher–Yates). The previous
 * sort(() => Math.random() - 0.5) was biased; this is uniform.
 * Original array is never mutated.
 */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// ── Session logic ──────────────────────────────────────────────

/** Progress state of a drill run (one per card deck). */
export interface DrillSession {
  /** Index of the card currently on screen (0-based). */
  index: number;
  /** Whether the current card's answer has been revealed. */
  revealed: boolean;
  /** Cards rated "Got It", in completion order. */
  gotIt: DrillCard[];
  /** Cards rated "Still Learning", in completion order. */
  missed: DrillCard[];
  /** Consecutive correct ratings. */
  streak: number;
  /** True once every card has been rated. */
  done: boolean;
}

/** Initial session for a card deck (done immediately for an empty deck). */
export function createDrillSession(cards: DrillCard[]): DrillSession {
  return {
    index: 0,
    revealed: false,
    gotIt: [],
    missed: [],
    streak: 0,
    done: cards.length === 0,
  };
}

/**
 * Advance a drill session after the user rates the current card.
 * Pure: returns a new session and never mutates the input.
 *
 * - `correct` bumps `streak`, otherwise resets it to 0.
 * - When not on the last card: index advances and the card is hidden again.
 * - When the last card is rated: `done` becomes true (index stays put).
 * - Optionally pass the rated `card` (4th arg) to record it in `gotIt` /
 *   `missed` automatically — the recommended usage. Without it, the caller
 *   extends those arrays itself and rateCard only advances the position.
 *
 * @example
 *   setSession((s) => rateCard(s, correct, cards.length, cards[s.index]));
 */
export function rateCard(
  session: DrillSession,
  correct: boolean,
  totalCards: number,
  card?: DrillCard,
): DrillSession {
  if (session.done || totalCards <= 0) return session;
  const gotIt =
    card && correct ? [...session.gotIt, card] : session.gotIt;
  const missed =
    card && !correct ? [...session.missed, card] : session.missed;
  const nextIndex = session.index + 1;
  const done = nextIndex >= totalCards;
  return {
    ...session,
    gotIt,
    missed,
    index: done ? session.index : nextIndex,
    revealed: done ? session.revealed : false,
    streak: correct ? session.streak + 1 : 0,
    done,
  };
}
