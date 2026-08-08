/**
 * placement.ts — Engine department: placement test scoring + state machine.
 *
 * Replaces the placement logic previously inlined in
 * src/routes/lessons/latin.tsx (finishPlacement / handlePlacementAnswer /
 * openPlacement). The old code hardcoded 6 levels; this module is
 * parameterized by `totalLevels` and works for any placement length
 * (33 levels today, Hebrew/Greek later).
 *
 * Scoring rules (2 questions per level):
 * - A level passes if EITHER of its two questions is answered correctly.
 * - The first failed level determines the start level (level index + 1).
 * - If every level passes, the student may start at `totalLevels`.
 *
 * `placementReducer` is a pure function of (state, action) — storage
 * side effects live in the `usePlacementEngine` action wrappers.
 */

import { useCallback, useReducer } from "react";
import type { MultipleChoiceExercise } from "~/data/latinLessons";
import { PLACEMENT_QUESTIONS_PER_LEVEL } from "~/data/settings";
import type { PlacementResult } from "~/engine/types";
import type { Language } from "~/data/languages";
import { loadJSON, saveJSON, STORAGE_KEYS } from "~/engine/storage";

/** Result of scoring a finished placement run. */
export interface PlacementStart {
  /** One boolean per level: true = level passed (either question correct). */
  passed: boolean[];
  /** 1-based first lesson the student may open (level index of first failure + 1). */
  startLevel: number;
}

/**
 * Pure scoring: reduce per-question answers to per-level pass flags and a
 * start level. `answers[i*2]` and `answers[i*2+1]` belong to level i.
 * Missing answers (answers shorter than totalLevels * 2) count as wrong;
 * extra answers are ignored. Works for any positive `totalLevels`.
 */
export function computePlacementStart(
  answers: boolean[],
  totalLevels: number,
): PlacementStart {
  const passed: boolean[] = [];
  for (let i = 0; i < totalLevels; i++) {
    const first = answers[i * PLACEMENT_QUESTIONS_PER_LEVEL];
    const second = answers[i * PLACEMENT_QUESTIONS_PER_LEVEL + 1];
    passed.push(Boolean(first) || Boolean(second));
  }
  const firstFailed = passed.findIndex((p) => !p);
  return {
    passed,
    startLevel: firstFailed === -1 ? totalLevels : firstFailed + 1,
  };
}

/** Internal state of the placement flow (see placementReducer). */
export interface PlacementEngineState {
  /** Current question index; -1 means the intro screen (not started). */
  idx: number;
  /** Per-question correctness, in answer order. */
  results: boolean[];
  /** True once the test is finished (scored or start level chosen). */
  complete: boolean;
  /** 1-based start level from scoring, or the level the student chose. */
  startLevel: number | null;
  /** Per-level pass flags once scored ([] before that). */
  passed: boolean[];
}

/** Actions understood by the pure placementReducer. */
export type PlacementEngineAction =
  | { type: "START" }
  | {
      type: "ANSWER";
      correct: boolean;
      totalQuestions: number;
      totalLevels: number;
    }
  | { type: "CHOOSE_START"; level: number }
  | { type: "RETAKE" }
  | { type: "QUIT" };

/**
 * Pure placement reducer. Rules:
 * - START: begin a fresh run at question 0.
 * - ANSWER: append the result; once every question is answered, score via
 *   computePlacementStart and mark complete (idx stays on the last question).
 * - CHOOSE_START: mark complete with a student-chosen start level.
 * - RETAKE / QUIT: back to the intro screen, discarding in-progress answers.
 */
export function placementReducer(
  state: PlacementEngineState,
  action: PlacementEngineAction,
): PlacementEngineState {
  switch (action.type) {
    case "START":
      return { idx: 0, results: [], complete: false, startLevel: null, passed: [] };
    case "ANSWER": {
      if (state.complete) return state;
      const results = [...state.results, action.correct];
      if (results.length >= action.totalQuestions) {
        const scored = computePlacementStart(results, action.totalLevels);
        return {
          idx: state.idx,
          results,
          complete: true,
          startLevel: scored.startLevel,
          passed: scored.passed,
        };
      }
      return { ...state, results, idx: state.idx + 1 };
    }
    case "CHOOSE_START":
      return { ...state, complete: true, startLevel: action.level };
    case "RETAKE":
    case "QUIT":
      return { idx: -1, results: [], complete: false, startLevel: null, passed: [] };
    default:
      return state;
  }
}

/**
 * Initial state for useReducer. Hydrates a previously stored placement
 * result (shows the results screen on return visits). Pure function of
 * storage — safe on the server.
 */
export function createInitialPlacementState(language: Language = "latin"): PlacementEngineState {
  const saved = loadJSON<PlacementResult | null>(
    STORAGE_KEYS.PLACEMENT_RESULT,
    null,
    language,
  );
  if (saved && typeof saved.startLevel === "number") {
    return {
      idx: -1,
      results: [],
      complete: true,
      startLevel: saved.startLevel,
      passed: saved.passed ?? [],
    };
  }
  return { idx: -1, results: [], complete: false, startLevel: null, passed: [] };
}

/** The full surface exposed to the Screens team by usePlacementEngine. */
export interface PlacementEngine {
  // State (read-only)
  state: PlacementEngineState;

  // Actions
  /** Begin the test (from the intro screen). */
  start: () => void;
  /** Record the current question's result; advances or finishes the test. */
  answer: (correct: boolean) => void;
  /** Return to the intro screen and offer the test again. */
  retake: () => void;
  /** Persist a student-chosen start level (e.g. "Start from Lesson 1"). */
  chooseStart: (level: number) => void;
  /** Leave the test without persisting anything (back to lessons). */
  quit: () => void;
}

/**
 * Hook factory for the placement flow. Accepts any MultipleChoiceExercise[]
 * (placementQuestions are structurally compatible) and a total level count.
 * Scoring runs through computePlacementStart and is persisted under
 * STORAGE_KEYS.PLACEMENT_RESULT as { passed, startLevel, completedAt }.
 * Prior results are hydrated on mount.
 */
export function usePlacementEngine(
  questions: MultipleChoiceExercise[],
  totalLevels: number,
  language: Language = "latin",
): PlacementEngine {
  const [state, dispatch] = useReducer(
    placementReducer,
    undefined,
    () => createInitialPlacementState(language),
  );
  const totalQuestions = questions.length;

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const retake = useCallback(() => dispatch({ type: "RETAKE" }), []);
  const quit = useCallback(() => dispatch({ type: "QUIT" }), []);

  const chooseStart = useCallback((level: number) => {
    dispatch({ type: "CHOOSE_START", level });
    saveJSON(STORAGE_KEYS.PLACEMENT_RESULT, {
      passed: [],
      startLevel: level,
      completedAt: new Date().toISOString(),
    }, language);
  }, [language]);

  const answer = useCallback(
    (correct: boolean) => {
      const nextResults = [...state.results, correct];
      dispatch({
        type: "ANSWER",
        correct,
        totalQuestions,
        totalLevels,
      });
      // Persist once the run is complete (side effect lives in the hook,
      // keeping placementReducer pure).
      if (nextResults.length >= totalQuestions) {
        const scored = computePlacementStart(nextResults, totalLevels);
        saveJSON(STORAGE_KEYS.PLACEMENT_RESULT, {
          passed: scored.passed,
          startLevel: scored.startLevel,
          completedAt: new Date().toISOString(),
        }, language);
      }
    },
    [state.results, totalQuestions, totalLevels, language],
  );

  return { state, start, answer, retake, chooseStart, quit };
}
