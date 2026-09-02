/**
 * types.ts — Engine department: shared state shapes.
 *
 * Pure TypeScript types consumed by the Screens team (route components) and
 * by the Engine's own modules. Zero JSX, zero rendering.
 *
 * The Screen union mirrors the one previously hardcoded in
 * src/routes/lessons/latin.tsx; PlacementResult and FeedbackEntry are the
 * persisted localStorage payloads owned by this department.
 */
import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";

/** The top-level screen a user can be on. */
export type Screen =
  | "menu"
  | "intro"
  | "teaching"
  | "exercise"
  | "complete"
  | "drill"
  | "placement"
  | "ai-practice"
  // Four-phase lesson loop (design §1/§3): the three generative drill phases,
  // sat between the existing "teaching" (taught) and "complete" screens. The
  // loop is taught → memorized → quizzed → incorporated → complete, gating on
  // mastery (see engine/fourPhase.ts) instead of a single pass. Shape is
  // ADDITIVE — the legacy single-pass flow (menu/teaching/intro/exercise/
  // complete) still works untouched; step 3 wraps the screens onto these.
  | "memorized"
  | "quizzed"
  | "incorporated";

/** Payload persisted under STORAGE_KEYS.PLACEMENT_RESULT. */
export interface PlacementResult {
  /** Per-level pass flags (one entry per placement level answered). */
  passed: boolean[];
  /** 1-based index of the first lesson a student may open. */
  startLevel: number;
  /** ISO timestamp of when the result was last written. */
  completedAt: string;
}

/** A single student feedback entry, persisted under STORAGE_KEYS.FEEDBACK. */
export interface FeedbackEntry {
  lessonId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

/** Delivery status of a locally-queued bug report (beta bug-report flow). */
export type BugReportStatus = "queued" | "sent" | "failed";
/** Context captured automatically with every bug report (beta bug-report
 *  flow, owner directive 2026-08-23). All fields optional — the dialog fills
 *  what it knows (lesson/phase/exercise inside a lesson, bare route outside). */
export interface BugContext {
  /** LessonEngine screen id the report was filed from (e.g. "quizzed"). */
  screen?: string | null;
  /** Real lesson id (the persistence/unlock key, per engine/lesson.ts). */
  lessonId?: number | null;
  /** Display-only lesson number (= array index + 1). */
  lessonNumber?: number | null;
  /** Active four-phase loop phase, when inside the loop. */
  phase?: PhaseName | null;
  /** id of the exercise on screen, when one is visible. */
  exerciseId?: string | null;
}
/** One student bug report. Persisted under STORAGE_KEYS.BUG_REPORT (one
 *  GLOBAL key — reports are app-level feedback, not per-language learning
 *  data, so the weekly dump reads a single queue; the `language` field rides
 *  in the payload for the owner's review). */
export interface BugReport extends BugContext {
  /** `${Date.now()}-${seq}` — dedupe key locally and on the server. */
  id: string;
  /** Track the report was filed from ("latin", "english", …). */
  language: Language;
  /** window.location.pathname at submit time. */
  route: string;
  /** Optional free-text description from the student (not required). */
  description: string | null;
  /** ISO timestamp captured at submit time. */
  createdAt: string;
  /** Delivery state: queued → sent (server ack) | failed (kept for retry). */
  status: BugReportStatus;
  /** Send attempts so far (failed attempts increment; sent freezes). */
  attempts: number;
}
/** User-configurable application settings. */
export interface VerbumSettings {
  pronMode: "ecclesiastical" | "classical";
  aiEnabled: boolean;
  devMode: boolean;
}

/** Per-concept accuracy persisted for adaptive practice. */
export interface AccuracyEntry {
  conceptId: string;
  correct: number;
  total: number;
}

// ── Diagnostics (owner direction 2026-08-11) ────────────────────
// Raw event-log model (D1/D2) + closed MistakeType taxonomy (D4).
// conceptId conventions (D3): `vocab:<normalized lemma>`, `concept:<lessonId>`,
// `lesson:<lessonId>`, `char:<id>`, `drill:<kind>`; lesson-level always tagged.

/** The kind of concept a DiagnosticEvent's primary conceptId refers to. */
export type ConceptKind = "vocab" | "concept" | "lesson" | "character" | "drill";

/**
 * Closed 10-type mistake taxonomy, consumed verbatim by future rule-based
 * error analysis (D4) — explanation templates key on these, never re-classify.
 */
export type MistakeType =
  | "wrong-meaning" // target known, a different meaning/identification chosen
  | "wrong-form" // right word, wrong inflection (case/number/person/tense/ending)
  | "wrong-case" // declension-flavored: wrong case chosen
  | "wrong-number" // singular ↔ plural
  | "wrong-person" // conjugation: wrong person chosen
  | "wrong-gender" // gender attribution error
  | "confused-with" // wrong answer = another specific known word (feeds confusion pairs)
  | "spelling" // orthographic near-miss of the correct answer (edit distance ≤ 2 after normalizeAnswer)
  | "rule" // grammar-concept error: wrong rule/statement chosen
  | "unknown"; // evidence insufficient to classify (e.g. self-rated drills)

/** Where a diagnostic event originated. */
export type DiagnosticSource = "lesson" | "drill" | "ai-practice" | "review" | "quizzer";

/**
 * One attempt, persisted in the raw event log (D1). Primary conceptId plus
 * tags[] (D2) — an exercise can evidence both a vocab word and a grammar
 * concept; tags always include `lesson:<id>`.
 */
export interface DiagnosticEvent {
  /** Unique; `${Date.now()}-${seq}` or crypto.randomUUID(). */
  id: string;
  /** ISO 8601 UTC — same pattern as PlacementResult.completedAt. */
  ts: string;
  /** Primary concept, e.g. "vocab:porta" | "concept:12" | "lesson:12" | "char:alpha". */
  conceptId: string;
  /** Additional concepts this attempt evidences (always includes `lesson:<id>`). */
  tags?: string[];
  kind: ConceptKind;
  ok: boolean;
  source: DiagnosticSource;
  /** Exercise id ("l1-q1") or drill card id — provenance for error analysis. */
  context?: string;
  /** Set when !ok. */
  mistake?: MistakeType;
  /** Student's answer as given (option text or typed input) — confusion pairs + error analysis. */
  wrong?: string;
  /** Canonical answer text — error analysis copy. */
  expected?: string;
  /** One UUID per lesson run / drill run — groups events ("in your last run…"). */
  session?: string;
}

/** What recordAttempt accepts; id is generated and ts defaults to now. */
export interface AttemptRecord extends Omit<DiagnosticEvent, "id" | "ts"> {
  ts?: string;
}

/** What a screen passes up when an exercise is completed (replaces bare boolean). */
export interface ExerciseResultDetail {
  correct: boolean;
  wrong?: string;
  expected?: string;
}

/** Rolled-up stats for one concept over the window (getConceptStats). */
export interface ConceptStats {
  conceptId: string;
  correct: number;
  total: number;
  /** 0-100 rounded. */
  accuracy: number;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  /** ISO timestamp of now − windowDays (derived window start). */
  windowStart: string;
  mistakes: Partial<Record<MistakeType, number>>;
  /** Wrongs with no mistake field recorded (e.g. pre-forwarding events). */
  unknownWrong: number;
}

/** The student's single most frequent mistake for a concept (getMainMistake). */
export interface MainMistake {
  conceptId: string;
  type: MistakeType;
  count: number;
  totalWrong: number;
  /** 0-100 rounded share of wrongs this type accounts for. */
  share: number;
  /** Present when type === "confused-with" — the lemma most often chosen instead. */
  partner?: { conceptId: string; label: string; count: number };
}

/** A detected vocab confusion pair (A answers B when A was asked and/or vice versa). */
export interface ConfusionPair {
  a: string;
  b: string;
  labelA: string;
  labelB: string;
  aToB: number;
  bToA: number;
  total: number;
  attempts: number;
  /** pairCount / attempts (fraction). */
  rate: number;
}

/** A concept under the weak threshold (getWeakSpots; replaces ReviewScreen's inline filter). */
export interface WeakSpot {
  conceptId: string;
  kind: ConceptKind;
  label: string;
  lessonId?: number;
  correct: number;
  total: number;
  accuracy: number;
  mainMistake?: MainMistake;
}

/** A weak spot ranked for remediation (getWorstAreas; sleep audio / daily lesson). */
export interface WorstArea extends WeakSpot {
  wrongCount: number;
  /** 0..1, higher = more recent activity in the window. */
  recencyWeight: number;
}

/** One day's aggregated performance (UTC YYYY-MM-DD) in getImprovementSeries. */
export interface ImprovementDay {
  date: string;
  correct: number;
  total: number;
  /** 0-100 rounded; null when total === 0 (never emitted — total ≥ 1 by construction). */
  accuracy: number | null;
}

export type ImprovementSeries = ImprovementDay[];

// ── Error analysis (owner direction 2026-08-11) ─────────────────
// Rule-based (no AI) explanations — research/error-analysis-engine-design.md.
// Phase A ships per-answer explanations for MC + fill (lesson exercises and
// AI practice); matching/flashcard/reading-passage return null in MVP (D9).

/** One bullet in an explanation; `highlight` substrings the UI MAY emphasize. */
export interface ExplanationPoint {
  text: string;
  highlight?: string[];
}

/** Structured explanation produced by src/engine/errorAnalysis.ts. */
export interface ExplanationResult {
  /** Short headline, e.g. "Case mix-up: accusative vs nominative". */
  title: string;
  /** 1–3 sentences: what / why / correct / why-correct. */
  body: string;
  /** Rule statements + pattern line; empty array allowed. */
  points: ExplanationPoint[];
  /** The concept behind the rule (vocab mistakes point at their lesson). */
  relatedConcept?: { conceptId: string; label: string; lessonId?: number };
  /** e.g. "vocab:porta" to re-drill, or "concept:<lessonId>" for the lesson. */
  drillSuggestion?: { conceptId: string; label: string; kind: ConceptKind };
  /** Set when events show this mistake ≥ MIN_MISTAKE_EVIDENCE (Phase B layer). */
  pattern?: { count: number };
  /** "fallback" = generic unknown-type copy, still better than nothing. */
  source: "rule-generated" | "fallback";
}

/** What getExplanation needs from any exercise (Exercise and GeneratedExercise both satisfy it). */
export interface ExplanationExerciseSource {
  type: string; // "multiple-choice" | "fill-in-blank" | "matching" | …
  prompt: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
  acceptableAnswers?: string[];
  before?: string;
  after?: string;
  pairs?: { left: string; right: string }[];
  explanation?: string;
}

export interface ExplanationRequest {
  detail: ExerciseResultDetail;
  exercise: ExplanationExerciseSource;
  lesson: Lesson;
  /** Optional; enables pattern + pair copy (Phase B) — never gates classification. */
  events?: DiagnosticEvent[];
  language?: Language;
  /**
   * All lessons for a global vocab index (cross-lesson wrong-word resolution,
   * spec §10 "wrong is a real Latin word from another lesson"). Defaults to
   * [lesson] — additive beyond the spec's request shape.
   */
  allLessons?: Lesson[];
}

/** Internal assembled context for template builds (exported for tests, spec §5). */
export interface ExplanationContext {
  mistake: MistakeType;
  wrong: string;
  expected: string;
  wrongN: string;
  expectedN: string;
  exerciseType: string;
  prompt: string;
  conceptId: string;
  kind: ConceptKind;
  label: string;
  gloss?: string;
  wrongLemma?: string;
  wrongLemmaGloss?: string;
  /** Which field of the vocab item the wrong answer matched ("latin" vs "english"). */
  wrongMatched?: "latin" | "english";
  stem?: string;
  wrongEnding?: string;
  expectedEnding?: string;
  wrongCase?: string;
  expectedCase?: string;
  wrongNum?: "singular" | "plural";
  expectedNum?: "singular" | "plural";
  wrongPerson?: string;
  expectedPerson?: string;
  wrongGender?: string;
  expectedGender?: string;
  ruleText?: string;
  endingRule?: string;
  difference?: string;
  pairCount?: number;
  lessonId: number;
  lessonTitle: string;
  canned?: string;
  /** The lesson itself — lets templates derive table lines at build time (additive). */
  lesson?: Lesson;
}

/** One template per closed MistakeType (D1) — error analysis maps, never re-classifies. */
export interface ExplanationTemplate {
  type: MistakeType;
  build: (c: ExplanationContext) => ExplanationResult;
}

/** Case/number/person labels for a form, derived from lesson tables (describeForm). */
export interface FormLabel {
  case?: string;
  number?: "singular" | "plural";
  person?: string;
  gender?: string;
}

// ── Four-phase lesson loop (research/four-phase-lesson-design.md §1/§3) ──
// Owner-greenlit 2026-08-23. Each lesson becomes a mastery loop, not a single
// pass: taught → memorized → quizzed → incorporated → complete. The pure state
// machine lives in engine/fourPhase.ts; these are the shared shapes. The
// return-to-previous-phase rule uses the OWNER-CONFIRMED AND-threshold:
// bounce ONLY when (2 consecutive wrong) AND (<70% over last 5) — see
// fourPhase.ts shouldReturnToPreviousPhase.

/** One phase of the four-phase loop. "taught" is the teaching/comprehension
 *  step (no generative drills); the other three are generative drill phases
 *  that map 1:1 onto fallbackGenerator's LessonPhase. */
export type PhaseName = "taught" | "memorized" | "quizzed" | "incorporated";

/** Persisted per-phase pass record (also doubles as a lifetime attempt tally). */
export interface PhasePass {
  passed: boolean;
  passedAt?: string; // ISO UTC — when the phase's mastery criterion was met
  attempts: number; // lifetime attempts in this phase
  correct: number; // lifetime correct in this phase
}

/** One slot of the rolling accuracy window. Per design §3 the shape is
 *  {correct, attempts}; attempts is always 1 (one attempt per slot) so the
 *  "consecutive fails / last 5 accuracy" rule can be computed directly. */
export interface AccuracyAttempt {
  correct: number; // 0 | 1
  attempts: number; // always 1
}

/** Per-lesson persistent four-phase state, keyed by lesson id (storage.ts). */
export interface PhaseState {
  /** Per-phase pass + lifetime tally (a phase may not have been entered yet). */
  phases: Partial<Record<PhaseName, PhasePass>>;
  /** Rolling window of the CURRENT phase's most-recent attempts, newest last,
   *  capped at PHASE_ACCURACY_WINDOW. Reset when the active phase changes. */
  accuracyWindow: AccuracyAttempt[];
  /** grammarIndex topic ids proven "incorporated" via passed compound passages. */
  incorporatedConcepts: string[];
}

/** Live in-flight four-phase run held on LessonEngineState.fourPhase. */
export interface FourPhaseRun {
  lessonId: number;
  /** Current active phase. "taught" twice while a run is open (initial teach,
   *  and again on a memorized→taught bounce). */
  phase: PhaseName;
  /** True when the loop is re-teaching after a bounce (not the initial teach);
   *  the screen re-presents only the mismatched teaching step (design §1). */
  reviewMode: boolean;
  /** teachingSteps[] index to re-present when reviewMode — set on bounce.
   *  null means step 3 has not provided a worst-step pick (defaults to 0). */
  reTeachStepIndex: number | null;
  /** Persistable state (window, passes, incorporated concepts). */
  phaseState: PhaseState;
  /** Deterministic drill seed so the same run/phase re-drills reproducible
   *  items (seeded re-drill — design §2). */
  seed: string;
}

/** Internal state of the lesson flow state machine (see engine/lesson.ts). */
export interface LessonEngineState {
  screen: Screen;
  currentLessonIdx: number;
  /** Number of unlocked lessons — lessons [0, unlockedLessons) are selectable. */
  unlockedLessons: number;
  exerciseIdx: number;
  /** Per-exercise correctness in the current run, in completion order. */
  results: boolean[];
  /** Lesson id last requested via goToAIPractice (navigation preview). */
  aiLessonId: number | null;
  /** Active four-phase run, or null when the legacy single-pass flow (or no
   *  lesson) is active. Additive — legacy flow leaves this null. */
  fourPhase: FourPhaseRun | null;
}

/**
 * Actions understood by the pure lessonReducer.
 * COMPLETE_EXERCISE carries exerciseCount and NEXT_LESSON carries
 * totalLessons so the reducer stays a pure function of (state, action)
 * with no external data captured.
 */
export type LessonEngineAction =
  | { type: "SELECT_LESSON"; idx: number }
  | { type: "TEACHING_COMPLETE" }
  | { type: "SKIP_TEACHING" }
  | { type: "START_LESSON" }
  | { type: "COMPLETE_EXERCISE"; correct: boolean; exerciseCount: number }
  | { type: "NEXT_LESSON"; totalLessons: number }
  | { type: "RESTART_LESSON" }
  | { type: "BACK_TO_MENU" }
  | { type: "GO_TO_DRILL" }
  | { type: "GO_TO_PLACEMENT" }
  | { type: "GO_TO_AI_PRACTICE"; lessonId: number }
  // ── Four-phase loop actions (design §3) ──
  // PHASE_START begins a four-phase run for a lesson: screen → teaching,
  // phase = taught. `persisted` carries the per-lesson PhaseState the hook
  // loaded so the reducer stays a pure function of (state, action).
  | { type: "PHASE_START"; idx: number; lessonId: number; persisted?: PhaseState; seed?: string }
  // PHASE_TEACH_COMPLETE advances taught → memorized (initial teach OR a
  // re-teach after a memorized→taught bounce re-enters the drill loop).
  | { type: "PHASE_TEACH_COMPLETE" }
  // PHASE_ATTEMPT records one drill-phase answer against the rolling window
  // and applies the mastery + return-to-previous-phase rule (pure — done in
  // the reducer via applyPhaseAttempt). passingConcepts are grammarIndex
  // topic ids the current (incorporated) passage required — merged into
  // incorporatedConcepts when the attempt is correct.
  | { type: "PHASE_ATTEMPT"; correct: boolean; passingConcepts?: string[]; reTeachStepIndex?: number | null }
  // PHASE_RESET abandons the run and returns to the menu.
  | { type: "PHASE_RESET" };
