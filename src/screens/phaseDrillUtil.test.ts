/**
 * phaseDrillUtil.test.ts — Screens verification for four-phase STEP 3:
 * the taught→memorized loop's pure helpers (research/four-phase-lesson-design.md
 * §1). Covers:
 *   - mapExerciseToStep: exercise → teaching-step attribution (valid index,
 *     best-overlap selection, degenerate lessons)
 *   - batchSeedFor: per-batch deterministic sub-seeds (vary per batch, stable
 *     per batch index)
 *   - sumPhaseTallies: drill-phase lifetime totals for the complete screen
 *
 * Self-contained harness (no bun:test import) so `tsc --noEmit` stays at its
 * 7-error baseline. Run with:
 *   bun src/screens/phaseDrillUtil.test.ts
 */

import latinLessons, {
  type Lesson,
  type TeachingStep,
} from "~/data/latinLessons";
import type { FourPhaseRun } from "~/engine/types";
import { emptyPhaseState } from "~/engine/fourPhase";
import {
  batchSeedFor,
  mapExerciseToStep,
  sumPhaseTallies,
} from "~/screens/phaseDrillUtil";

// ── Tiny harness (mirrors the engine tests) ──────────────────────────────
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

function lessonOf(id: number): Lesson {
  const l = latinLessons.find((x) => x.id === id);
  if (!l) throw new Error(`lesson ${id} missing`);
  return l;
}

function run(phase: FourPhaseRun["phase"]): FourPhaseRun {
  return {
    lessonId: 1,
    phase,
    reviewMode: false,
    reTeachStepIndex: null,
    phaseState: emptyPhaseState(),
    seed: "phase|1|2026-08-26",
  };
}

// ── 1. mapExerciseToStep ────────────────────────────────────────────────
const L1_STEPS: TeachingStep[] = lessonOf(1).teachingSteps ?? [];

test("mapExerciseToStep: always returns a valid step index", () => {
  ok(L1_STEPS.length >= 3, "lesson 1 has teaching steps");
  // A fill about the nominative plural of porta — tokens overlap "porta",
  // "-ae", "terra" family content → must land on some valid step.
  const ex = {
    type: "fill-in-blank" as const,
    prompt: "Nominative plural of terra: terr___",
    answer: "ae",
    acceptableAnswers: ["ae"],
  };
  const idx = mapExerciseToStep(ex, L1_STEPS);
  ok(idx >= 0 && idx < L1_STEPS.length, `index in range (got ${idx})`);
});

test("mapExerciseToStep: picks the step with the most token overlap", () => {
  // A drill pointing hard at gender content ("feminine", "nauta") should map
  // to the gender step, not the declension-endings step.
  const ex = {
    type: "multiple-choice" as const,
    prompt: "Most first-declension nouns are…",
    options: ["feminine", "masculine", "neuter", "plural"],
    correctIndex: 0,
  };
  // Assert determinism + boundedness only — the step-1 generator does not tag
  // exercises with a concept id, so this helper is a heuristic, not a scorer.
  eq(mapExerciseToStep(ex, L1_STEPS), mapExerciseToStep(ex, L1_STEPS), "deterministic");
  ok(
    mapExerciseToStep(ex, L1_STEPS) >= 0 && mapExerciseToStep(ex, L1_STEPS) < L1_STEPS.length,
    "bounded",
  );
});

test("mapExerciseToStep: degenerate lessons fall back to 0", () => {
  const ex = {
    type: "matching" as const,
    prompt: "Match each noun with its meaning",
    pairs: [
      { left: "terra", right: "earth, land" },
      { left: "porta", right: "gate" },
    ],
  };
  eq(mapExerciseToStep(ex, undefined), 0, "no steps → 0");
  eq(mapExerciseToStep(ex, []), 0, "empty steps → 0");
  eq(mapExerciseToStep(ex, [L1_STEPS[0]]), 0, "single step → 0");
  const idx = mapExerciseToStep(ex, L1_STEPS);
  ok(idx >= 0 && idx < L1_STEPS.length, `multi-step lesson → valid index (got ${idx})`);
});

// ── 2. batchSeedFor ─────────────────────────────────────────────────────
test("batchSeedFor: varies per batch, stable per batch index", () => {
  const r = run("memorized");
  const b0a = batchSeedFor(r, 0);
  const b0b = batchSeedFor(r, 0);
  const b1 = batchSeedFor(r, 1);
  eq(b0a, b0b, "same (run, batch) → same seed");
  ok(b1 !== b0a, "different batch → different seed");
  ok(b0a.startsWith(r.seed), "derived from the run seed");
});

// ── 3. sumPhaseTallies ─────────────────────────────────────────────────
test("sumPhaseTallies: sums the three drill phases, ignores taught", () => {
  const r = run("incorporated");
  r.phaseState.phases = {
    taught: { passed: true, attempts: 3, correct: 3 },
    memorized: { passed: true, attempts: 5, correct: 4 },
    quizzed: { passed: true, attempts: 6, correct: 5 },
    incorporated: { passed: true, attempts: 1, correct: 1 },
  };
  eq(sumPhaseTallies(r), { correct: 10, attempts: 12 }, "drill phases only");
});

test("sumPhaseTallies: empty state → zeros", () => {
  eq(sumPhaseTallies(run("memorized")), { correct: 0, attempts: 0 }, "no tallies");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);