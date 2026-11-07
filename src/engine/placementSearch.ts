/**
 * Adaptive placement search (FIX-2, owner directive 2026-11-07):
 * "make it smart, ask relatively hard questions, so we can in less questions
 * than units (we can do log_2 units) determine key point to review."
 *
 * BINARY SEARCH over units with relatively hard per-unit probes:
 *   lo = 1, hi = units; probe the MID unit; correct → the student is at or
 *   above the probe (lo = probe + 1); wrong → below (hi = probe − 1).
 *   Converges in ⌈log₂ units⌉ questions (14 units → 4). At most ONE extra
 *   confirmation probe at the final boundary when the boundary unit itself
 *   was never asked (the last probe was a CORRECT answer at the top of the
 *   range) — noted deviation, keeps the total at ≤ 5 for 14 units.
 *
 * Result = the boundary unit = the KEY POINT TO REVIEW ("start your review
 * at Unit N"); a result above the unit count means every unit passed.
 *
 * ENGINE GENERIC: pure functions plus one hook, zero JSX. Unit count comes
 * from the probe bank (data), never hardcoded — every track (Latin units,
 * English levels, future shelves) inherits the search by supplying its own
 * probe list. Persistence is byte-compatible with the linear placement:
 * PLACEMENT_RESULT keeps { passed, startLevel, completedAt } where startLevel
 * is the same "first not-yet-mastered unit" the old scorer produced
 * (computePlacementStart) and mapStartLevel converts it for storage exactly
 * as before.
 */
import { useCallback, useState } from "react";
import type { MultipleChoiceExercise } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { Lesson } from "~/data/latinLessons";
import { saveJSON, STORAGE_KEYS } from "~/engine/storage";
import { persistPlacementProgressSeeding } from "~/engine/placement";

export interface PlacementProbe {
  /** 1-based unit (or level) the probe discriminates. */
  unit: number;
  /** The unit's harder question — grammar/forms over vocab. */
  question: MultipleChoiceExercise;
}

export interface SearchState {
  lo: number;
  hi: number;
  units: number;
  asked: { unit: number; correct: boolean }[];
  confirmed: boolean;
}

/** Fresh search over `units` units (1..units). */
export function startUnitSearch(units: number): SearchState {
  return { lo: 1, hi: Math.max(1, units), units: Math.max(1, units), asked: [], confirmed: false };
}

/** Unit to probe next (the mid of the remaining range), or null when done. */
export function nextProbeUnit(s: SearchState): number | null {
  if (s.lo > s.hi) return null;
  return Math.floor((s.lo + s.hi) / 2);
}

/** Pure transition: record the answer to the CURRENT probe. */
export function applyUnitAnswer(s: SearchState, correct: boolean): SearchState {
  const probe = nextProbeUnit(s);
  if (probe === null) return s;
  return {
    ...s,
    lo: correct ? probe + 1 : s.lo,
    hi: correct ? s.hi : probe - 1,
    asked: [...s.asked, { unit: probe, correct }],
  };
}

/**
 * Boundary unit = first unit not proven known (hi + 1). A result above the
 * unit count means every unit was mastered.
 */
export function resultUnit(s: SearchState): number {
  return s.hi + 1;
}

/**
 * ONE optional confirmation (5 max for 14 units): only when the search
 * converged because the LAST probe — at the top of the range — was CORRECT,
 * leaving the boundary unit itself unasked. A converged-by-wrong search has
 * direct evidence at the boundary and needs nothing.
 */
export function needsBoundaryConfirmation(s: SearchState): boolean {
  if (s.confirmed || s.lo <= s.hi) return false;
  const r = resultUnit(s);
  if (r > s.units) return false;
  const last = s.asked[s.asked.length - 1];
  return !!last && last.correct && last.unit === s.hi;
}

/**
 * The single confirmation probe at the boundary unit. Wrong → boundary
 * confirmed (direct evidence). Correct → the student is above the boundary
 * too; accept boundary + 1 WITHOUT further questions (bounded, noted
 * deviation in the PR).
 */
export function applyConfirmation(s: SearchState, correct: boolean): SearchState {
  if (s.confirmed) return s;
  const r = resultUnit(s);
  return {
    ...s,
    hi: correct ? r : s.hi,
    asked: [...s.asked, { unit: r, correct }],
    confirmed: true,
  };
}

/** Hard question-count bound for a track: ⌈log₂ units⌉ (+1 confirmation). */
export function maxSearchQuestions(units: number): number {
  if (units <= 1) return 1;
  return Math.ceil(Math.log2(units)) + 1;
}

/** Per-unit pass flags for the result rows: unit < boundary → passed. */
export function passedByUnit(s: SearchState): boolean[] {
  const r = resultUnit(s);
  return Array.from({ length: s.units }, (_, i) => i + 1 < r);
}

export interface PlacementSearchEngine {
  phase: "idle" | "running" | "confirm" | "done";
  /** The probe currently on screen (running), or the confirmation probe. */
  probe: PlacementProbe | null;
  questionNumber: number;
  maxQuestions: number;
  totalUnits: number;
  /** Boundary unit (1..units), or null while not done. */
  resultUnit: number | null;
  /** True when the search converged past the last unit (all mastered). */
  allMastered: boolean;
  passed: boolean[];
  asked: { unit: number; correct: boolean }[];
  start: () => void;
  answer: (correct: boolean) => void;
  confirm: (correct: boolean) => void;
  chooseStart: (unit: number) => void;
  retake: () => void;
  quit: () => void;
}

/**
 * Hook for the adaptive placement flow. Persistence mirrors the linear
 * engine exactly (same key, same shape, same mapStartLevel/seeding seams).
 */
export function usePlacementSearch(
  /** One probe question per unit, in unit order (index i = unit i+1). */
  probeQuestions: MultipleChoiceExercise[],
  language: Language = "latin",
  mapStartLevel?: (unit: number) => number,
  placedLessons?: Lesson[],
): PlacementSearchEngine {
  const probes: PlacementProbe[] = probeQuestions.map((question, i) => ({ unit: i + 1, question }));
  const totalUnits = probes.length;
  const [state, setState] = useState<SearchState | null>(null);
  const [phase, setPhase] = useState<"idle" | "running" | "confirm" | "done">("idle");
  const [result, setResult] = useState<number | null>(null);

  const persist = useCallback(
    (s: SearchState) => {
      const r = resultUnit(s);
      const unit = Math.min(r, s.units);
      const passed = passedByUnit(s);
      const mapped = mapStartLevel ? mapStartLevel(unit) : unit;
      saveJSON(STORAGE_KEYS.PLACEMENT_RESULT, {
        passed,
        startLevel: mapped,
        completedAt: new Date().toISOString(),
      }, language);
      if (placedLessons) persistPlacementProgressSeeding(placedLessons, mapped, language);
    },
    [language, mapStartLevel, placedLessons],
  );

  const start = useCallback(() => {
    setState(startUnitSearch(totalUnits));
    setPhase("running");
    setResult(null);
  }, [totalUnits]);

  const answer = useCallback(
    (correct: boolean) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = applyUnitAnswer(prev, correct);
        if (nextProbeUnit(next) === null) {
          if (needsBoundaryConfirmation(next)) {
            setPhase("confirm");
          } else {
            setPhase("done");
            setResult(resultUnit(next));
            persist(next);
          }
        }
        return next;
      });
    },
    [persist],
  );

  const confirm = useCallback(
    (correct: boolean) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = applyConfirmation(prev, correct);
        setPhase("done");
        setResult(resultUnit(next));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const chooseStart = useCallback(
    (unit: number) => {
      const clamped = Math.max(1, Math.min(totalUnits, unit));
      const mapped = mapStartLevel ? mapStartLevel(clamped) : clamped;
      saveJSON(STORAGE_KEYS.PLACEMENT_RESULT, {
        passed: [],
        startLevel: mapped,
        completedAt: new Date().toISOString(),
      }, language);
      if (placedLessons) persistPlacementProgressSeeding(placedLessons, mapped, language);
    },
    [language, mapStartLevel, placedLessons, totalUnits],
  );

  const retake = useCallback(() => {
    setState(null);
    setResult(null);
    setPhase("idle");
  }, []);

  const quit = useCallback(() => {
    setState(null);
    setResult(null);
    setPhase("idle");
  }, []);

  const probeUnit =
    phase === "confirm" && state
      ? resultUnit(state)
      : state
        ? nextProbeUnit(state)
        : null;
  const probe =
    probeUnit !== null ? (probes[probeUnit - 1] ?? null) : null;

  return {
    phase,
    probe,
    questionNumber: state ? state.asked.length + (phase === "confirm" ? 1 : 0) : 0,
    maxQuestions: maxSearchQuestions(totalUnits),
    totalUnits,
    resultUnit: result,
    allMastered: result !== null && result > totalUnits,
    passed: state ? passedByUnit(state) : [],
    asked: state ? state.asked : [],
    start,
    answer,
    confirm,
    chooseStart,
    retake,
    quit,
  };
}
