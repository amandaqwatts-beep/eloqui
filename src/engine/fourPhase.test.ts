/**
 * fourPhase.test.ts — Engine verification for four-phase lesson structure,
 * STEP 2: the state machine (research/four-phase-lesson-design.md §1/§3).
 * Covers:
 *   - rolling accuracy window (push/cap/accuracy/consecutive-fails)
 *   - the OWNER-CONFIRMED return-to-previous-phase AND-threshold
 *     (2 fails & >70% → NO bounce; 2 fails & <70% → bounce; 1 fail & <70% → NO)
 *   - phase state transitions through the reducer (taught→memorized→quizzed→
 *     incorporated→complete) and the return-to-previous-phase rule
 *   - re-teach-first ordering (bounce to taught lands on the teaching screen
 *     BEFORE re-entering the drill loop)
 *   - persistence round-trip (PhaseState → storage → load)
 *   - the generator seam (phaseGenerationOptions / generateForPhase) including
 *     the incorporated CompoundFrame (prior+current grammarIndex concepts)
 *   - incorporatedConcepts accumulation + pickReTeachStep
 *
 * Self-contained (no bun:test import) so `tsc --noEmit` stays at its 7-error
 * baseline. Run with:
 *   bun src/engine/fourPhase.test.ts
 */

import latinLessons, { type Lesson, type TeachingStep } from "~/data/latinLessons";
import { buildLearnedUniverse } from "~/engine/learnedUniverse";
import type {
  AccuracyAttempt,
  FourPhaseRun,
  LessonEngineState,
  PhaseState,
} from "~/engine/types";
import { lessonReducer, createInitialState } from "~/engine/lesson";
import {
  applyPhaseAttempt,
  accuracyOverLastN,
  completeTaughtPhase,
  consecutiveFails,
  emptyPhaseState,
  generateForPhase,
  phaseGenerationOptions,
  phasePassed,
  PHASE_HISTORY_LENGTH,
  pickReTeachStep,
  pushPhaseAttempt,
  shouldReturnToPreviousPhase,
  windowAccuracy,
} from "~/engine/fourPhase";
import {
  loadPhaseStateFor,
  savePhaseState,
} from "~/engine/storage";

// ── Tiny harness (mirrors the other engine tests) ────────────────────────
let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`(pass) ${name}`);
  } catch (e) {
    failed++;
    console.error(`(fail) ${name}`);
    console.error(e);
  }
}
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
function eq<T>(actual: T, expected: T, msg?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg ?? "assertion"}: expected ${b}, got ${a}`);
}

const lessons: Lesson[] = latinLessons;
const order = new Map(lessons.map((l, i) => [l.id, i]));
const lessonOf = (id: number): Lesson => {
  const l = lessons.find((x) => x.id === id);
  if (!l) throw new Error(`lesson ${id} missing`);
  return l;
};
function completedThrough(id: number): number[] {
  const idx = order.get(id)!;
  return lessons.filter((l) => order.get(l.id)! <= idx).map((l) => l.id);
}

/** Shorthand: build an accuracy window from a list of 0/1 correctness (newest last). */
const w = (arr: number[]): AccuracyAttempt[] =>
  arr.map((c) => ({ correct: c, attempts: 1 }));

/** Fold PHASE_ATTEMPT actions through the reducer. */
function runAttempts(state: LessonEngineState, results: boolean[]): LessonEngineState {
  let s = state;
  for (const c of results) s = lessonReducer(s, { type: "PHASE_ATTEMPT", correct: c });
  return s;
}

function startRun(lessonId = 1, idx = 0): LessonEngineState {
  return lessonReducer(createInitialState(), {
    type: "PHASE_START",
    idx,
    lessonId,
  });
}

// ── 1. Rolling accuracy window ────────────────────────────────────────────
test("window: push caps history at PHASE_HISTORY_LENGTH, newest retained", () => {
  let win: AccuracyAttempt[] = [];
  for (const c of [true, true, true, true, true, true, true, true, true, true, true]) {
    win = pushPhaseAttempt(win, c);
  }
  ok(win.length === PHASE_HISTORY_LENGTH, `history capped at ${PHASE_HISTORY_LENGTH}`);
  eq(windowAccuracy(win), 1, "all-correct window is 100%");
  eq(consecutiveFails(win), 0, "all-correct → no consecutive fails");
  // Oldest entries drop: after these, the oldest (a wrong) is gone.
  let w2: AccuracyAttempt[] = [];
  for (const c of [false, true, true, true, true, true, true, true, true, true, true]) {
    w2 = pushPhaseAttempt(w2, c);
  }
  eq(windowAccuracy(w2), 1, "a dropped early wrong no longer counts");
});

test("window: accuracyOverLastN reads the last 5 by default", () => {
  const win = w([1, 1, 1, 1, 0, 0]); // 6 entries, newest last
  eq(consecutiveFails(win), 2, "longest 0-run is 2");
  eq(accuracyOverLastN(win), 3 / 5, "last 5 = 3 correct / 5");
});

// ── 2. OWNER-CONFIRMED AND-threshold ─────────────────────────────────────
test("return rule: 2 fails & >70% over last 5 → does NOT bounce (AND)", () => {
  // Max run of 2 wrongs, but last 5 = 100%.
  ok(!shouldReturnToPreviousPhase(w([0, 0, 1, 1, 1, 1, 1, 1])), "no bounce");
});

test("return rule: 2 fails & <70% over last 5 → DOES bounce (AND)", () => {
  ok(shouldReturnToPreviousPhase(w([0, 0, 1, 1, 1])), "bounces");
});

test("return rule: 1 fail & <70% over last 5 → does NOT bounce (consecutive arm false)", () => {
  // Wrongs are isolated (run of 1) even though last 5 is under 70%.
  ok(!shouldReturnToPreviousPhase(w([0, 1, 0, 1, 0, 1])), "no bounce");
});

test("return rule: pure helpers agree", () => {
  ok(consecutiveFails(w([0, 0, 1, 1, 1])) === 2, "run of 2");
  ok(consecutiveFails(w([0, 1, 0, 1, 0, 1])) === 1, "run of 1");
});

// ── 3. Phase state transitions ────────────────────────────────────────────
test("transitions: taught→memorized→quizzed→incorporated→complete (happy path)", () => {
  let s = startRun(1);
  eq(s.screen, "teaching", "PHASE_START opens on teaching");
  eq(s.fourPhase!.phase, "taught", "initial phase is taught");

  s = lessonReducer(s, { type: "PHASE_TEACH_COMPLETE" });
  eq(s.screen, "memorized");
  eq(s.fourPhase!.phase, "memorized");

  // 5 correct → memorized passes (full last-5 at 100%) → advance to quizzed.
  s = runAttempts(s, [true, true, true, true, true]);
  eq(s.screen, "quizzed");
  eq(s.fourPhase!.phase, "quizzed");
  ok(s.fourPhase!.phaseState.phases.memorized!.passed, "memorized marked passed");

  s = runAttempts(s, [true, true, true, true, true]);
  eq(s.screen, "incorporated");
  eq(s.fourPhase!.phase, "incorporated");
  ok(s.fourPhase!.phaseState.phases.quizzed!.passed, "quizzed marked passed");

  // incorporated passes on ≥1 correct → whole lesson completes.
  s = runAttempts(s, [true]);
  eq(s.screen, "complete", "lesson completes only when incorporated passes");
  ok(
    s.fourPhase!.phaseState.phases.incorporated!.passed,
    "incorporated marked passed",
  );
});

test("transitions: PHASE_ATTEMPT is ignored while in taught", () => {
  const before = startRun(1);
  const after = lessonReducer(before, { type: "PHASE_ATTEMPT", correct: true });
  eq(after, before, "taught has no generative drills — attempt is a no-op");
});

test("transitions: PHASE_RESET returns to the menu and clears the run", () => {
  const s = runAttempts(lessonReducer(startRun(1), { type: "PHASE_TEACH_COMPLETE" }), [true]);
  const r = lessonReducer(s, { type: "PHASE_RESET" });
  eq(r.screen, "menu");
  eq(r.fourPhase, null);
});

// ── 4. Return-to-previous-phase + re-teach-first ordering ────────────────
test("bounce: memorized→taught re-teaches FIRST, then re-enters the drill", () => {
  let s = lessonReducer(startRun(1), { type: "PHASE_TEACH_COMPLETE" }); // memorized
  // 2 wrongs → AND-threshold → bounce back to taught.
  s = runAttempts(s, [false, false]);
  eq(s.screen, "teaching", "lands on the teaching screen (re-teach) BEFORE drill");
  eq(s.fourPhase!.phase, "taught");
  ok(s.fourPhase!.reviewMode, "reviewMode is set while re-teaching");

  // Re-teach + comprehension check pass → re-enter the memorized drill loop.
  s = lessonReducer(s, { type: "PHASE_TEACH_COMPLETE" });
  eq(s.screen, "memorized", "re-enters the drill loop");
  eq(s.fourPhase!.phase, "memorized");
  ok(!s.fourPhase!.reviewMode, "reviewMode cleared after re-entering drill");
});

test("bounce: quizzed→memorized is a re-drill, not a re-teach", () => {
  let s = startRun(1);
  s = lessonReducer(s, { type: "PHASE_TEACH_COMPLETE" }); // memorized
  s = runAttempts(s, [true, true, true, true, true]); // → quizzed
  s = runAttempts(s, [false, false]); // → bounce to memorized
  eq(s.screen, "memorized");
  eq(s.fourPhase!.phase, "memorized");
  ok(!s.fourPhase!.reviewMode, "previous-phase re-drill is not a re-teach");
});

test("bounce: does NOT fire while the student is succeeding (no false positives)", () => {
  // 3 correct then 1 wrong: run of 1, last 5 = 75% → never bounces.
  const win = w([1, 1, 1, 0]);
  ok(!shouldReturnToPreviousPhase(win), "steady progress → no bounce");
});

// ── 5. Re-teach step selection (design §1) ───────────────────────────────
test("re-teach: picks the teaching step whose concept scored worst", () => {
  const steps: TeachingStep[] = lessonOf(1).teachingSteps ?? [];
  ok(steps.length >= 3, "lesson 1 has teaching steps");
  eq(pickReTeachStep(undefined, undefined), 0, "no steps → 0");
  eq(pickReTeachStep([], [1, 2]), 0, "no steps with wrong counts → 0");
  eq(pickReTeachStep(steps, [0, 0, 4, 1]), 2, "argmax wrong count wins");
  eq(pickReTeachStep(steps, [1]), 0, "single evidence → index 0");
});

// ── 6. Incorporated concepts (design §3) ─────────────────────────────────
test("incorporated: correct compound passage marks its required topics", () => {
  let run: FourPhaseRun = {
    lessonId: 53,
    phase: "incorporated",
    reviewMode: false,
    reTeachStepIndex: null,
    phaseState: emptyPhaseState(),
    seed: "s",
  };
  const res = applyPhaseAttempt(run, true, {
    passingConcepts: ["first-declension", "cases-overview"],
  });
  eq(res.outcome, "complete", "a correct incorporated passage completes the lesson");
  ok(
    res.run.phaseState.incorporatedConcepts.includes("first-declension") &&
      res.run.phaseState.incorporatedConcepts.includes("cases-overview"),
    "required topics are marked incorporated",
  );
});

// ── 7. Generator seam (wires phases onto step-1 engine) ──────────────────
test("seam: memorized maps to the template fallback mode, seeded", () => {
  let s = lessonReducer(startRun(1), { type: "PHASE_TEACH_COMPLETE" });
  const opts = phaseGenerationOptions(s.fourPhase!, lessonOf(1), { count: 4 });
  ok(opts !== null, "memorized produces generator options");
  eq(opts!.phase, "memorized");
  eq(opts!.mode, "mixed");
  eq(opts!.seed, s.fourPhase!.seed, "seed passes through for reproducible re-drill");
  const items = generateForPhase(s.fourPhase!, lessonOf(1), { count: 4 });
  ok(items.length > 0, "memorized emits template items");
});

test("seam: incorporated uses CompoundFrame passages when a universe is given", () => {
  const u = buildLearnedUniverse({
    lessons,
    completedLessonIds: completedThrough(53),
    currentLessonId: 53,
  });
  let s = startRun(53);
  s = lessonReducer(s, { type: "PHASE_TEACH_COMPLETE" });
  s = runAttempts(s, [true, true, true, true, true]); // → quizzed
  s = runAttempts(s, [true, true, true, true, true]); // → incorporated
  const opts = phaseGenerationOptions(s.fourPhase!, lessonOf(53), {
    count: 3,
    universe: u,
  });
  eq(opts!.phase, "incorporated");
  const items = generateForPhase(s.fourPhase!, lessonOf(53), {
    count: 3,
    universe: u,
  });
  ok(items.length > 0, "incorporated emits compound passages");
  for (const it of items) {
    ok(
      it.prompt.startsWith("Translate this passage"),
      "compound passage flagged for passage translation",
    );
  }
});

// ── 8. Persistence round-trip ─────────────────────────────────────────────
function installMemoryStorage(): Map<string, string> {
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  };
  return store;
}
function uninstallMemoryStorage(): void {
  delete (globalThis as { window?: unknown }).window;
}

test("persistence: PhaseState round-trips through storage keyed by lesson id", () => {
  const ps: PhaseState = {
    phases: {
      taught: { passed: true, attempts: 1, correct: 1 },
      memorized: { passed: true, attempts: 5, correct: 4 },
    },
    accuracyWindow: w([1, 1, 1, 1, 0]),
    incorporatedConcepts: ["first-declension"],
  };
  installMemoryStorage();
  try {
    savePhaseState(42, ps, "latin");
    const loaded = loadPhaseStateFor(42, "latin");
    eq(loaded, ps, "round-trip preserves the full PhaseState");
    // A different lesson id is untouched / absent.
    eq(loadPhaseStateFor(7, "latin"), emptyPhaseState(), "absent id → empty state");
    // Corrupt window entries are filtered defensively on read.
    (globalThis as { window?: unknown }).window!.localStorage.setItem(
      "verbum-phase-state-latin",
      JSON.stringify({
        v: 1,
        lessons: {
          9: {
            phases: {},
            accuracyWindow: [{ correct: 1, attempts: 1 }, { correct: 7, attempts: 1 }],
            incorporatedConcepts: "nope",
          },
        },
      }),
    );
    const sanitized = loadPhaseStateFor(9, "latin");
    ok(
      Array.isArray(sanitized.accuracyWindow) &&
        sanitized.accuracyWindow.length === 1 &&
        Array.isArray(sanitized.incorporatedConcepts) &&
        sanitized.incorporatedConcepts.length === 0,
      "corrupt window rows dropped; non-array concepts default to []",
    );
  } finally {
    uninstallMemoryStorage();
  }
});

// ── 9. completeTaughtPhase helper ────────────────────────────────────────
test("completeTaughtPhase marks taught passed and enters memorized", () => {
  const run: FourPhaseRun = {
    lessonId: 1,
    phase: "taught",
    reviewMode: true,
    reTeachStepIndex: 2,
    phaseState: emptyPhaseState(),
    seed: "s",
  };
  const next = completeTaughtPhase(run);
  eq(next.phase, "memorized");
  ok(!next.reviewMode, "re-teach mode cleared");
  ok(next.phaseState.phases.taught!.passed, "taught marked passed");
  eq(next.phaseState.accuracyWindow.length, 0, "fresh window for the new phase");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
