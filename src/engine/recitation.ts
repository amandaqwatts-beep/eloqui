/**
 * recitation.ts — Engine department: speech recitation (listen-and-repeat).
 *
 * Pure, zero JSX, zero storage reads from the read path. Doc-tests the
 * blueprint in research/speech-recitation-design.md §3:
 *
 *   - The screen plays a Latin line, the student speaks aloud and self-rates
 *     ("Good match / Almost / Try again"). The repetition loop is the value,
 *     NOT a score — there are deliberately NO streak / points / entitlement
 *     fields anywhere in this module.
 *   - Self-ratings NEVER write DiagnosticEvents. Session history lives in a
 *     dedicated `verbum-recitation-<lang>` payload (storage.ts) so the shared
 *     comprehension diagnostics log stays uncorrupted (spec §3.2 — the sleep
 *     audio precedent).
 *   - Deterministic: no Math.random() anywhere in this file. Recite-all in
 *     authored order (spec §3, decision Q3).
 *   - passageLines take precedence over splitSentences(passage), mirroring
 *     ReadingPassage.tsx's line-extraction (helper is exported + reused).
 *
 * Session machine mirrors drill.ts conventions (createDrillSession / rateCard):
 * replaced-by-index ratings (replacement semantics), done once every line is
 * rated, `createRecitationSession([])` → done: true immediately.
 */

import type { Lesson } from "~/data/latinLessons";
import { latinToIPA, type LatinMode } from "~/engine/ipaConverter";
import { splitSentences } from "~/components/ReadingPassage";

/** Where a recitation line comes from within a lesson. */
export type RecitationSource = "vocab" | "sentence" | "passage";

/** Honest, action-oriented self-rating (spec §4.5 — never grade-like). */
export type SelfRating = "solid" | "close" | "again";

/** One line to recite. `translation` is undefined for passage lines in v1
 *  (per-line alignment is a content task — spec §7 Q5). */
export interface RecitationItem {
  /** `${lessonId}-${source}-${index}` */
  id: string;
  /** Latin, macrons preserved for display; latinToIPA strips them for speech. */
  text: string;
  /** English gloss (vocab) / exampleEnglish (sentence) — absent for passage. */
  translation?: string;
  /** latinToIPA(text, mode) — reading aid, computed in the builder. */
  ipa?: string;
  source: RecitationSource;
  lessonId: number;
}

/** Progress state of a recitation run (one per line set). */
export interface RecitationSession {
  /** Current line, 0-based. */
  index: number;
  /** Whether the current line has been rated (drives Next/Advance UI). */
  rated: boolean;
  /** One rating per item, in order; null until rated (index-assigned =
   *  replacement-safe — a re-rate overwrites, never grows). */
  results: (SelfRating | null)[];
  /** True once every line has been rated (or the set was empty). */
  done: boolean;
}

/**
 * Build the ordered set of lines to recite for a lesson + source + pronMode.
 * Pure and deterministic — always the same input produces byte-identical items.
 */
export function buildRecitationItems(opts: {
  lesson: Lesson;
  source: RecitationSource;
  mode: LatinMode; // "ecclesiastical" | "classical" — drives the IPA reading aid
  /** Optional override for the passage split only (used when the lesson's
   *  reading-passage exercise is absent). Resolved from the lesson by default
   *  via passageLines ?? splitSentences(passage). */
  passageText?: string;
}): RecitationItem[] {
  const { lesson, source, mode, passageText } = opts;

  if (source === "vocab") {
    return (lesson.vocabulary ?? []).map((v, i) => ({
      id: `${lesson.id}-vocab-${i}`,
      text: v.latin,
      translation: v.english,
      ipa: latinToIPA(v.latin, mode),
      source: "vocab",
      lessonId: lesson.id,
    }));
  }

  if (source === "sentence") {
    return (lesson.teachingSteps ?? []).map((t, i) => ({
      id: `${lesson.id}-sentence-${i}`,
      text: t.exampleLatin,
      translation: t.exampleEnglish,
      ipa: latinToIPA(t.exampleLatin, mode),
      source: "sentence",
      lessonId: lesson.id,
    }));
  }

  // passage
  const ex = lesson.exercises.find((e) => e.type === "reading-passage");
  const sourceText = ex ? ex.passage : passageText ?? "";
  const lines = ex?.passageLines && ex.passageLines.length > 0
    ? ex.passageLines
    : splitSentences(sourceText);
  return lines.map((line, i) => ({
    id: `${lesson.id}-passage-${i}`,
    text: line,
    ipa: latinToIPA(line, mode),
    source: "passage",
    lessonId: lesson.id,
  }));
}

/** Initial session for a line set (done immediately for an empty set). */
export function createRecitationSession(items: RecitationItem[]): RecitationSession {
  return {
    index: 0,
    rated: false,
    results: items.map(() => null),
    done: items.length === 0,
  };
}

/**
 * Advance a recitation session after the student rates the current line.
 * Pure: returns a new session and never mutates the input.
 *
 * - `results[index] = rating` — index-assignment, so a re-rate REPLACES the
 *   previous rating for that line (spec §2.3) instead of appending.
 * - When not on the last line: index advances and rated resets (mirrors
 *   rateCard's revealed=false).
 * - When the last line is rated: done becomes true (index stays put).
 */
export function rateRecitation(
  session: RecitationSession,
  rating: SelfRating,
  totalItems: number,
): RecitationSession {
  if (session.done || totalItems <= 0) return session;
  const results = [...session.results];
  results[session.index] = rating;
  const nextIndex = session.index + 1;
  const done = nextIndex >= totalItems;
  return {
    ...session,
    results,
    index: done ? session.index : nextIndex,
    rated: false,
    done,
  };
}

/**
 * Screen-side evaluator seam (spec §5). v1 (Latin) ships the seam only:
 * `undefined` → pure self-rating. An English ASR implementation (real browser
 * SpeechRecognition) can be injected later — zero rearchitecture, the engine
 * session/items/flow are identical regardless of the rating input source.
 * Returns null when ASR is unavailable/failed → fall back to manual self-rating.
 */
export type RecitationEvaluator = (item: RecitationItem) => Promise<SelfRating | null>;
