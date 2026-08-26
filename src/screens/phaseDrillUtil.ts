/**
 * phaseDrillUtil.ts — Screens department: pure helpers for the four-phase
 * taught→memorized drill loop (research/four-phase-lesson-design.md §1).
 *
 * Pure TypeScript (no React/JSX) so it is directly unit-testable. The loop
 * screen (PhaseDrillScreen) uses these to
 *   - map a generated drill exercise back to the teaching step it best
 *     exercises (the step-level "concept" that gets re-taught on a
 *     memorized→taught bounce — design §1's "re-present the mismatched step"),
 *   - derive a per-batch sub-seed so successive generated batches in the loop
 *     vary while staying deterministic per (run.seed, batch index), and
 *   - sum a run's drill-phase lifetime tallies for the completion screen
 *     (the state machine's results[] stays empty during a phase run).
 */

import type { FourPhaseRun } from "~/engine/types";
import type { TeachingStep } from "~/data/latinLessons";
import type { GeneratedExercise } from "~/engine/fallbackGenerator";

/** The three generative drill phases (design §3) — sum targets. */
const DRILL_PHASES = ["memorized", "quizzed", "incorporated"] as const;

/** Per-phase lifetime tally (correct/attempts) summed across the drill phases.
 *  Used by the completion screen when a phase run finishes (incorporated
 *  passed) — the legacy state.results[] is empty in a phase run. */
export function sumPhaseTallies(run: FourPhaseRun): {
  correct: number;
  attempts: number;
} {
  let correct = 0;
  let attempts = 0;
  for (const p of DRILL_PHASES) {
    const rec = run.phaseState.phases[p];
    if (rec) {
      correct += rec.correct;
      attempts += rec.attempts;
    }
  }
  return { correct, attempts };
}

/** Lowercased, macron-insensitive alphanumeric tokens of a string. */
function tokens(s: string): string[] {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Which teachingSteps[] index an exercise most plausibly exercises, via token
 * overlap of the exercise's prompt/options/answer against each step's
 * title/explanation/example strings. The step-1 generator does NOT tag
 * GeneratedExercise with a concept id, so this is a heuristic: it is used only
 * to pick the re-taught step after a memorized→taught bounce, and weak matches
 * simply fall back to index 0 (the engine's own default when no evidence).
 */
export function mapExerciseToStep(
  ex: GeneratedExercise,
  steps: TeachingStep[] | undefined,
): number {
  const s = steps ?? [];
  if (s.length === 0) return 0;
  if (s.length === 1) return 0;
  const needle = tokens(
    [
      ex.prompt,
      ex.answer ?? "",
      ex.correctIndex !== undefined && ex.options
        ? ex.options[ex.correctIndex] ?? ""
        : "",
      ...(ex.options ?? []),
      ...(ex.pairs ?? []).map((p) => `${p.left} ${p.right}`),
    ].join(" "),
  );
  const needleSet = new Set(needle);
  let best = 0;
  let bestScore = 0;
  for (let i = 0; i < s.length; i++) {
    const hay = new Set(
      tokens(
        [
          s[i].title,
          s[i].explanation,
          s[i].exampleLatin,
          s[i].exampleEnglish,
          s[i].tip ?? "",
        ].join(" "),
      ),
    );
    let overlap = 0;
    for (const t of needleSet) if (hay.has(t)) overlap++;
    if (overlap > bestScore) {
      bestScore = overlap;
      best = i;
    }
  }
  return best;
}

/**
 * A per-batch sub-seed so successive generated batches in a phase loop vary
 * (batch 0, 1, 2, …) while remaining deterministic per (run.seed, batch index)
 * — reproducible re-drill of a weak concept, design §2. The loop screen builds
 * a derived run `{ ...run, seed: batchSeedFor(run, n) }` and passes it to
 * generateForPhase (a pure function of its run argument).
 */
export function batchSeedFor(run: FourPhaseRun, batchIndex: number): string {
  return `${run.seed}|batch:${batchIndex}`;
}

/** Stable display title for a drill phase (memorized reads like a drill). */
export function phaseDisplayTitle(
  phase: "memorized" | "quizzed" | "incorporated",
): string {
  switch (phase) {
    case "memorized":
      return "Memorization Drill";
    case "quizzed":
      return "Integration Drill";
    case "incorporated":
      return "Incorporation Passage";
  }
}