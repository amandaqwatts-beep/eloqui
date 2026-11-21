/**
 * exerciseSpec.ts — Engine department: the ExerciseSpec schema (PR-A of the
 * Book-2 four-phase wrap).
 *
 * OWNER DIRECTIVE (rev 81, ratified 2026-11-15; generation directive
 * 2026-11-21): captured textbook exercises are SPECS ONLY — the app
 * live-generates fresh instances over them for infinite replayability, and no
 * student drills the textbook's own answer key. A spec records the SKILL
 * trained, the vocabulary and forms in scope, and the source provenance —
 * never the captured prompt or answer text.
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage, zero logic beyond
 * the shape. The adapter (engine/latin2SectionSpecs.ts) builds specs from the
 * captured spine; the registry (engine/generators.ts) turns one spec + one
 * generation context into a fresh exercise.
 */

/** The skill a captured exercise trains — the spec's generator kind. */
export type SpecKind =
  | "vocab-recall"
  | "form-drill"
  | "translate-l2e"
  | "translate-e2l"
  | "parse"
  | "imitate"
  | "constructions-recall";

/** Every kind the GENERATORS registry must cover (exactly one generator each). */
export const SPEC_KINDS: readonly SpecKind[] = [
  "vocab-recall",
  "form-drill",
  "translate-l2e",
  "translate-e2l",
  "parse",
  "imitate",
  "constructions-recall",
];

/**
 * One parsed form/derivation in a spec's scope — ground truth the generator
 * builds a FRESH prompt around (a randomly-chosen case/number, a derived
 * adverb), never the captured prompt text itself.
 */
export interface SpecForm {
  /** paradigm = an inflected case/number form; formation = a derived form
   *  (adjective → adverb). */
  kind: "paradigm" | "formation";
  /** paradigm: the lemma (headword) the form belongs to — the parse
   *  generator and the section-level form inventories carry it per form. */
  lemma?: string;
  /** paradigm: case of the form ("genitive" …). */
  case?: string;
  /** paradigm: number of the form. */
  number?: "singular" | "plural";
  /** formation: the base word the form derives from. */
  from?: string;
  /** The inflected/derived form verbatim (macrons preserved) — the answer. */
  form: string;
  /** Covering-rule note carried from the capture (e.g. "-or, ERROR §48"). */
  note?: string;
}

export interface ExerciseSpecVocabScope {
  /** Lemma headwords the spec narrows to (identity = normalizeAnswer over
   *  VocabularyItem.latin). Absent/empty, or no member resolvable in the
   *  supplied pool → the generator draws from the whole pool. */
  lemmas?: string[];
  /** Book-2 spine section ids the vocabulary rides on — string ids, so no
   *  collision with the 2000-range synthetic-lesson-id namespace (English). */
  sectionIds?: string[];
  /** Book-1 lesson ids, when the scope rides the Latin-1 course array. */
  lessonIds?: number[];
}

export interface ExerciseSpecParams {
  /** Translation direction the captured item drilled. */
  direction?: "l2e" | "e2l";
  /** Fill answers accept macron-stripped input (Latin targets). */
  allowMacronless?: boolean;
  /** Sentence/passage frame id the instance was built from (provenance). */
  frameId?: string;
  /** MC foil count the generator should draw (default 3). */
  distractorCount?: number;
  /** Parsed paradigm/formation forms — the form-drill family's scope. */
  forms?: SpecForm[];
}

export interface ExerciseSpecProvenance {
  book: "latin1" | "latin2";
  /** Printed folio the source exercise sits on. */
  folio?: number;
  /** The book's own exercise label (e.g. "Ex. 42.A.1"). */
  bookExerciseNo?: string;
}

export interface ExerciseSpec {
  /** Preserved capture id ("sy-e7-q3") or a derived section-spec id — never
   *  a numeric lesson id (avoids the 2000-range overlap with English). */
  id: string;
  kind: SpecKind;
  /** 1980-Grammar § string when the spec pins one construction. */
  grammarRef?: string;
  /** GRAMMAR_INDEX topic ids the spec trains (drives passingConcepts in the
   *  four-phase loop). */
  topicIds?: string[];
  vocabScope?: ExerciseSpecVocabScope;
  params?: ExerciseSpecParams;
  provenance: ExerciseSpecProvenance;
}
