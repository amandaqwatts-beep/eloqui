/**
 * fourPhase.ts — Engine department: the four-phase lesson state machine.
 *
 * Owner-greenlit 2026-08-23 (research/four-phase-lesson-design.md §1/§3).
 * A lesson becomes a mastery LOOP — taught → memorized → quizzed →
 * incorporated → complete — that gates on mastery instead of running through
 * a fixed exercise list once. Each phase's drills come from the step-1
 * generative engine (fallbackGenerator.generatePhaseExercises /
 * translationGen's CompoundFrame), and a phase advances only when its rolling
 * accuracy window clears its pass criterion. On repeated failure the loop
 * RETURNS to the previous phase and (for memorized→taught) always re-teaches
 * the mismatched step before re-entering the drill loop.
 *
 * IMPORTANT — the return-to-previous-phase threshold is OWNER-CONFIRMED and is
 * an AND, not an OR (earlier research drafts said "or"):
 *   bounce ⟺ (2 consecutive wrong) AND (<70% correct over the last 5).
 * This is encoded exactly in shouldReturnToPreviousPhase. The task's test
 * matrix follows from it:
 *   2 fails & >70%  → does NOT bounce   (accuracy arm false)
 *   2 fails & <70%  → DOES bounce       (both arms true)
 *   1 fail  & <70%  → does NOT bounce   (consecutive arm false)
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage. All functions here
 * are deterministic pure functions of their arguments; persistence lives in
 * storage.ts and the side-effecting action wrappers in lesson.ts.
 */

import type {
  AccuracyAttempt,
  FourPhaseRun,
  PhaseName,
  PhasePass,
  PhaseState,
  Screen,
} from "~/engine/types";
import type { Lesson, TeachingStep } from "~/data/latinLessons";
import {
  generatePhaseExercises,
  type GeneratedExercise,
  type LessonPhase,
  type PhaseGenerationOptions,
} from "~/engine/fallbackGenerator";

// ── Tunables (research design §1/§4 defaults + owner-confirmed return rule) ─
/** Rolling accuracy-window HISTORY cap (how many recent attempts we retain). */
export const PHASE_HISTORY_LENGTH = 10;
/** The "last N" the rules read: owner says "<70% over the last 5", and pass is
 *  judged over the last 5 too. */
export const PHASE_ACCURACY_LAST_N = 5;
/** Return-to-previous-phase: minimum consecutive wrongs in the window (AND). */
export const PHASE_RETURN_CONSECUTIVE_FAILS = 2;
/** Return-to-previous-phase: must ALSO be under this accuracy over last 5 (AND). */
export const PHASE_RETURN_ACCURACY = 0.7;
/** Pass criterion for memorized/quizzed (≥80% over the last 5, design §4). */
export const PHASE_PASS_ACCURACY = 0.8;
/** Pass criterion for incorporated: success on ≥1 passage (design §3). */
export const PHASE_INCORPORATED_ACCURACY = 1.0;

/** Phase order in the loop. Only these orderings are valid transitions. */
export const PHASE_SEQUENCE: readonly PhaseName[] = [
  "taught",
  "memorized",
  "quizzed",
  "incorporated",
];

export function nextPhaseName(p: PhaseName): PhaseName | null {
  const i = PHASE_SEQUENCE.indexOf(p);
  return i < 0 || i >= PHASE_SEQUENCE.length - 1 ? null : PHASE_SEQUENCE[i + 1];
}

export function prevPhaseName(p: PhaseName): PhaseName | null {
  const i = PHASE_SEQUENCE.indexOf(p);
  return i <= 0 ? null : PHASE_SEQUENCE[i - 1];
}

/** Map a phase to the Screen that renders it. "taught" is the teaching screen. */
export function phaseScreen(p: PhaseName): Screen {
  switch (p) {
    case "taught":
      return "teaching";
    case "memorized":
      return "memorized";
    case "quizzed":
      return "quizzed";
    case "incorporated":
      return "incorporated";
  }
}

export function emptyPhaseState(): PhaseState {
  return { phases: {}, accuracyWindow: [], incorporatedConcepts: [] };
}

// ── Rolling accuracy window ────────────────────────────────────────────────
/** Append one attempt (newest last), keeping only the newest PHASE_HISTORY_LENGTH. */
export function pushPhaseAttempt(
  window: AccuracyAttempt[],
  correct: boolean,
): AccuracyAttempt[] {
  const next = [...window, { correct: correct ? 1 : 0, attempts: 1 }];
  return next.length > PHASE_HISTORY_LENGTH
    ? next.slice(next.length - PHASE_HISTORY_LENGTH)
    : next;
}

/** Accuracy (0..1) over the last `n` attempts (whole window if shorter). */
export function accuracyOverLastN(
  window: AccuracyAttempt[],
  n: number = PHASE_ACCURACY_LAST_N,
): number {
  const slice = window.length > n ? window.slice(window.length - n) : window;
  if (slice.length === 0) return 0;
  const correct = slice.reduce((s, a) => s + a.correct, 0);
  const attempts = slice.reduce((s, a) => s + a.attempts, 0);
  return attempts === 0 ? 0 : correct / attempts;
}

/** Accuracy (0..1) over the whole retained history; 0 when empty. */
export function windowAccuracy(window: AccuracyAttempt[]): number {
  return accuracyOverLastN(window, window.length);
}

/** Longest run of consecutive wrong answers anywhere in the history. This is
 *  the "2 consecutive wrong answers" arm of the owner rule — read as any
 *  two-in-a-row in the recent history (not only the trailing two), so it can be
 *  judged independently of the separate "last 5" accuracy arm. */
export function consecutiveFails(window: AccuracyAttempt[]): number {
  let max = 0;
  let cur = 0;
  for (const a of window) {
    cur = a.correct > 0 ? 0 : cur + 1;
    if (cur > max) max = cur;
  }
  return max;
}

/**
 * OWNER-CONFIRMED return-to-previous-phase rule (AND, not OR):
 *   bounce ⟺ (≥2 consecutive wrong answers) AND (<70% correct over the last 5).
 * Because the two arms are judged independently, all three required cases are
 * distinguishable:
 *   [w,w,c,c,c,c,c,c]  → 2-in-a-row but last-5 = 100% ≥ 70%  → NO bounce
 *   [w,w,c,c,c]        → 2-in-a-row AND last-5 = 60%  < 70%  → bounce
 *   [w,c,w,c,w,c]      → run of 1 (<2) even though last-5 <70%→ NO bounce
 */
export function shouldReturnToPreviousPhase(window: AccuracyAttempt[]): boolean {
  return (
    consecutiveFails(window) >= PHASE_RETURN_CONSECUTIVE_FAILS &&
    accuracyOverLastN(window) < PHASE_RETURN_ACCURACY
  );
}

/** Whether the current phase's mastery criterion is met. Memorized/quizzed
 *  need a full last-5 window at ≥80%; incorporated needs ≥1 correct passage
 *  (a "successful incorporated passage" — design §3). */
export function phasePassed(window: AccuracyAttempt[], phase: PhaseName): boolean {
  const goal =
    phase === "incorporated" ? PHASE_INCORPORATED_ACCURACY : PHASE_PASS_ACCURACY;
  const minAttempts =
    phase === "incorporated" ? 1 : PHASE_ACCURACY_LAST_N;
  return window.length >= minAttempts && accuracyOverLastN(window) >= goal;
}

// ── Attempt application (the heart of the state machine) ──────────────────
export type PhaseAttemptOutcome = "continue" | "advance" | "bounce" | "complete";

export interface PhaseAttemptResult {
  run: FourPhaseRun;
  outcome: PhaseAttemptOutcome;
}

/** Fresh (empty) window — a new phase's accuracy is judged on its own attempts. */
function withFreshWindow(ps: PhaseState): PhaseState {
  return { ...ps, accuracyWindow: [] };
}

function markPhasePassed(ps: PhaseState, phase: PhaseName): PhaseState {
  const existing = ps.phases[phase];
  const pass: PhasePass = {
    passed: true,
    passedAt: new Date().toISOString(),
    attempts: existing?.attempts ?? 0,
    correct: existing?.correct ?? 0,
  };
  return {
    ...ps,
    phases: { ...ps.phases, [phase]: pass },
  };
}

export function unionIncorporatedConcepts(
  ps: PhaseState,
  topics: string[],
): PhaseState {
  const set = new Set(ps.incorporatedConcepts);
  for (const t of topics) if (t) set.add(t);
  return { ...ps, incorporatedConcepts: [...set] };
}

/**
 * Record one drill-phase answer and decide the next state. The rules, exactly:
 *  - PASS: phase's rolling accuracy clears phasePassed → advance to the next
 *    phase (memorized→quizzed→incorporated), or "complete" when incorporated
 *    passes (the WHOLE LESSON completes only here — design §3; the hook then
 *    saveProgress's and unlocks the next lesson).
 *  - FAIL-BOUNCE: shouldReturnToPreviousPhase fires → return to the previous
 *    phase. Bouncing to "taught" sets reviewMode (re-teach-first ordering:
 *    the screen re-presents the mismatched teaching step + its comprehension
 *    check BEFORE re-entering the drill loop — design §1).
 *  - Otherwise: keep drilling (the loop runs generatively until mastery).
 *
 * `passingConcepts` (optional) are grammarIndex topic ids the current
 * incorporated passage required; on a CORRECT incorporated attempt they are
 * merged into incorporatedConcepts (design §3 — a concept is "incorporated"
 * once the compound passages requiring it pass).
 */
export function applyPhaseAttempt(
  run: FourPhaseRun,
  correct: boolean,
  opts?: { passingConcepts?: string[]; reTeachStepIndex?: number | null },
): PhaseAttemptResult {
  // "taught" has no generative drills — it advances via PHASE_TEACH_COMPLETE.
  if (run.phase === "taught") return { run, outcome: "continue" };

  const phase = run.phase;
  let ps: PhaseState = {
    ...run.phaseState,
    accuracyWindow: pushPhaseAttempt(run.phaseState.accuracyWindow, correct),
  };

  // Lifetime tally for the phase's pass record.
  const tally = ps.phases[phase] ?? { passed: false, attempts: 0, correct: 0 };
  ps = {
    ...ps,
    phases: {
      ...ps.phases,
      [phase]: {
        ...tally,
        attempts: tally.attempts + 1,
        correct: tally.correct + (correct ? 1 : 0),
      },
    },
  };

  // Incorrect-answer concepts PARTIALLY accumulate even before pass — but the
  // design says a topic is only incorporated once the passages REQUIRING it
  // pass, and we only know which a passage required when it was attempted.
  // For a correct attempt we trust `passingConcepts` (the passage's `requires`).
  if (correct && phase === "incorporated" && opts?.passingConcepts?.length) {
    ps = unionIncorporatedConcepts(ps, opts.passingConcepts);
  }

  if (phasePassed(ps.accuracyWindow, phase)) {
    ps = markPhasePassed(ps, phase);
    if (phase === "incorporated") {
      return { run: { ...run, phase, phaseState: ps }, outcome: "complete" };
    }
    const next = nextPhaseName(phase)!; // incorporated handled above → non-null
    return {
      run: { ...run, phase: next, reviewMode: false, reTeachStepIndex: null, phaseState: withFreshWindow(ps) },
      outcome: "advance",
    };
  }

  if (shouldReturnToPreviousPhase(ps.accuracyWindow)) {
    const prev = prevPhaseName(phase)!; // taught handled above → non-null
    return {
      run: {
        ...run,
        phase: prev,
        reviewMode: prev === "taught",
        reTeachStepIndex: prev === "taught" ? (opts?.reTeachStepIndex ?? null) : null,
        phaseState: withFreshWindow(ps),
      },
      outcome: "bounce",
    };
  }

  return { run: { ...run, phase, phaseState: ps }, outcome: "continue" };
}

/** Mark "taught" passed and enter the memorized drill phase. Used by the
 *  reducer's PHASE_TEACH_COMPLETE for both the initial teach and a re-teach
 *  after a memorized→taught bounce (re-enter the drill loop). */
export function completeTaughtPhase(run: FourPhaseRun): FourPhaseRun {
  const ps = markPhasePassed(run.phaseState, "taught");
  return {
    ...run,
    phase: "memorized",
    reviewMode: false,
    reTeachStepIndex: null,
    phaseState: withFreshWindow(ps),
  };
}

// ── Generator seam (wires phases onto the step-1 generative engine) ──────
/**
 * Build the generatePhaseExercises opts for the run's current DRILL phase.
 * taught maps to nothing (not a generator phase); memorized → template mode;
 * quizzed → translation (when a universe is supplied); incorporated →
 * CompoundFrame passages spanning current + prior grammarIndex topics (when a
 * universe is supplied). Seeded via run.seed for reproducible re-drill.
 * `count` defaults to PHASE passed by the caller; if none, an 8-item batch.
 */
export function phaseGenerationOptions(
  run: FourPhaseRun,
  lesson: Lesson,
  opts?: {
    count?: number;
    universe?: PhaseGenerationOptions["universe"];
    direction?: PhaseGenerationOptions["direction"];
    distractorLessons?: Lesson[];
  },
): PhaseGenerationOptions | null {
  if (run.phase === "taught") return null;
  const phase = run.phase as LessonPhase; // memorized|quizzed|incorporated
  return {
    phase,
    lesson,
    count: opts?.count ?? 8,
    seed: run.seed,
    mode: phase === "memorized" ? "mixed" : undefined,
    universe: opts?.universe,
    direction: opts?.direction,
    distractorLessons: opts?.distractorLessons,
  };
}

/**
 * Convenience wrapper: actually run the generator for the run's current drill
 * phase. Returns an empty array when there is no drill to emit (taught, or the
 * generator found nothing to synthesize). Deterministic for a fixed run.seed.
 */
export function generateForPhase(
  run: FourPhaseRun,
  lesson: Lesson,
  opts?: {
    count?: number;
    universe?: PhaseGenerationOptions["universe"];
    direction?: PhaseGenerationOptions["direction"];
    distractorLessons?: Lesson[];
  },
): GeneratedExercise[] {
  const genOpts = phaseGenerationOptions(run, lesson, opts);
  if (!genOpts) return [];
  return generatePhaseExercises(genOpts);
}

// ── Re-teach step selection (design §1: re-teach the mismatched step) ─────
/**
 * Pick the teachingSteps[] index to re-present when returning memorized→taught.
 * The screen feeds per-step wrong counts observed while drilling (negative
 * evidence per concept); the step whose concept scored worst is chosen. When
 * no evidence is available (or a lesson has no steps), fall back to index 0.
 */
export function pickReTeachStep(
  teachingSteps: TeachingStep[] | undefined,
  wrongCounts?: number[],
): number {
  if (!teachingSteps || teachingSteps.length === 0) return 0;
  if (!wrongCounts || wrongCounts.length === 0) return 0;
  let best = 0;
  for (let i = 1; i < wrongCounts.length; i++) {
    if (wrongCounts[i] > wrongCounts[best]) best = i;
  }
  return Math.max(0, Math.min(best, teachingSteps.length - 1));
}
