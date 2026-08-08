/**
 * lesson.ts — Engine department: lesson flow state machine.
 *
 * Replaces the seven handler callbacks previously inlined in
 * src/routes/lessons/latin.tsx (select → start → complete → next →
 * restart → back → navigate). Consumed by the Screens team via
 * useLessonEngine(lessons).
 *
 * The reducer (`lessonReducer`) is a pure function of (state, action) —
 * no storage, no React — so it is directly unit-testable. Side effects
 * (persisting unlocks) live in the hook's action wrappers.
 * Works with any Lesson[] array; nothing Latin-specific.
 */

import { useCallback, useMemo, useReducer } from "react";
import type { Lesson } from "~/data/latinLessons";
import { PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE } from "~/data/settings";
import type { Language } from "~/data/languages";
import type {
  LessonEngineAction,
  LessonEngineState,
  PlacementResult,
  Screen,
} from "~/engine/types";
import { loadJSON, saveJSON, STORAGE_KEYS } from "~/engine/storage";

/**
 * Pure lesson flow reducer. Internal rules:
 * - SELECT_LESSON: no-op unless 0 <= idx < unlockedLessons; resets the run.
 * - START_LESSON: no unlock guard (already gated by SELECT_LESSON).
 * - COMPLETE_EXERCISE: appends to results; completes once every exercise
 *   has been answered, otherwise advances exerciseIdx.
 * - NEXT_LESSON: no-op on the last lesson; unlocks the next lesson.
 * - RESTART_LESSON / BACK_TO_MENU: resets the run / returns to the menu.
 * - GO_TO_*: preview navigation to drill / placement / AI practice.
 */
export function lessonReducer(
  state: LessonEngineState,
  action: LessonEngineAction,
): LessonEngineState {
  switch (action.type) {
    case "SELECT_LESSON": {
      if (action.idx < 0 || action.idx >= state.unlockedLessons) return state;
      return {
        ...state,
        screen: "teaching",
        currentLessonIdx: action.idx,
        exerciseIdx: 0,
        results: [],
      };
    }
    case "TEACHING_COMPLETE":
    case "SKIP_TEACHING":
      return { ...state, screen: "intro" };
    case "START_LESSON":
      return { ...state, screen: "exercise", exerciseIdx: 0, results: [] };
    case "COMPLETE_EXERCISE": {
      const results = [...state.results, action.correct];
      if (results.length >= action.exerciseCount) {
        return { ...state, results, screen: "complete" };
      }
      return { ...state, results, exerciseIdx: state.exerciseIdx + 1 };
    }
    case "NEXT_LESSON": {
      const nextIdx = state.currentLessonIdx + 1;
      if (nextIdx >= action.totalLessons) return state;
      return {
        ...state,
        currentLessonIdx: nextIdx,
        unlockedLessons: Math.max(state.unlockedLessons, nextIdx + 1),
        exerciseIdx: 0,
        results: [],
        screen: "teaching",
      };
    }
    case "RESTART_LESSON":
      return { ...state, screen: "intro", exerciseIdx: 0, results: [] };
    case "BACK_TO_MENU":
      return { ...state, screen: "menu" };
    case "GO_TO_DRILL":
      return { ...state, screen: "drill" };
    case "GO_TO_PLACEMENT":
      return { ...state, screen: "placement" };
    case "GO_TO_AI_PRACTICE":
      return { ...state, screen: "ai-practice", aiLessonId: action.lessonId };
    default:
      return state;
  }
}

/**
 * Initial state for useReducer. Hydrates unlockedLessons from the stored
 * placement result (default 1), clamped to PLACEMENT_TOTAL_LEVELS so a
 * stale or out-of-range startLevel can never unlock more lessons than
 * exist. Pure function of storage — safe on the server.
 */
export function createInitialState(language: Language = "latin"): LessonEngineState {
  const saved = loadJSON<PlacementResult | null>(
    STORAGE_KEYS.PLACEMENT_RESULT,
    null,
    language,
  );
  const seeded = saved?.startLevel
    ? Math.min(PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE[language], Math.max(1, saved.startLevel))
    : 1;
  return {
    screen: "menu",
    currentLessonIdx: 0,
    unlockedLessons: seeded,
    exerciseIdx: 0,
    results: [],
    aiLessonId: null,
  };
}

/** The full surface exposed to the Screens team by useLessonEngine. */
export interface LessonEngine {
  // State (read-only)
  screen: Screen;
  currentLessonIdx: number;
  unlockedLessons: number;
  exerciseIdx: number;
  results: boolean[];

  // Derived
  currentLesson: Lesson;
  totalLessons: number;
  correctCount: number;
  totalAnswered: number;
  isLastLesson: boolean;

  // Actions
  selectLesson: (idx: number) => void;
  completeTeaching: () => void;
  skipTeaching: () => void;
  startLesson: () => void;
  completeExercise: (correct: boolean) => void;
  nextLesson: () => void;
  restartLesson: () => void;
  backToMenu: () => void;

  // Navigation (preview — screens will call these)
  goToDrill: () => void;
  goToPlacement: () => void;
  goToAIPractice: (lessonId: number) => void;
}

/**
 * Hook factory for the lesson flow state machine. Works with any Lesson[]
 * array (Latin, Hebrew, Greek, …). Hydration of unlocked lessons happens
 * lazily on mount via the useReducer initializer.
 */
export function useLessonEngine(lessons: Lesson[], language: Language = "latin"): LessonEngine {
  const [state, dispatch] = useReducer(
    lessonReducer,
    undefined,
    () => createInitialState(language),
  );

  // Derived values
  const currentLesson = useMemo(
    () => lessons[state.currentLessonIdx] ?? lessons[0],
    [lessons, state.currentLessonIdx],
  );
  const totalLessons = lessons.length;
  const correctCount = useMemo(
    () => state.results.filter(Boolean).length,
    [state.results],
  );
  const totalAnswered = state.results.length;
  const isLastLesson = state.currentLessonIdx >= totalLessons - 1;

  // Actions
  const selectLesson = useCallback(
    (idx: number) => dispatch({ type: "SELECT_LESSON", idx }),
    [],
  );
  const completeTeaching = useCallback(
    () => dispatch({ type: "TEACHING_COMPLETE" }),
    [],
  );
  const skipTeaching = useCallback(
    () => dispatch({ type: "SKIP_TEACHING" }),
    [],
  );
  const startLesson = useCallback(
    () => dispatch({ type: "START_LESSON" }),
    [],
  );
  const completeExercise = useCallback(
    (correct: boolean) =>
      dispatch({
        type: "COMPLETE_EXERCISE",
        correct,
        exerciseCount: currentLesson?.exercises.length ?? 0,
      }),
    [currentLesson],
  );
  const nextLesson = useCallback(() => {
    const nextIdx = state.currentLessonIdx + 1;
    if (nextIdx >= totalLessons) return;
    // Persist unlocks so a returning student resumes where they left off.
    const nextUnlocked = Math.max(state.unlockedLessons, nextIdx + 1);
    const existing = loadJSON<PlacementResult | null>(
      STORAGE_KEYS.PLACEMENT_RESULT,
      null,
      language,
    );
    saveJSON(STORAGE_KEYS.PLACEMENT_RESULT, {
      passed: existing?.passed ?? [],
      startLevel: nextUnlocked,
      completedAt: new Date().toISOString(),
    }, language);
    dispatch({ type: "NEXT_LESSON", totalLessons });
  }, [state.currentLessonIdx, state.unlockedLessons, totalLessons]);
  const restartLesson = useCallback(
    () => dispatch({ type: "RESTART_LESSON" }),
    [],
  );
  const backToMenu = useCallback(
    () => dispatch({ type: "BACK_TO_MENU" }),
    [],
  );
  const goToDrill = useCallback(() => dispatch({ type: "GO_TO_DRILL" }), []);
  const goToPlacement = useCallback(
    () => dispatch({ type: "GO_TO_PLACEMENT" }),
    [],
  );
  const goToAIPractice = useCallback(
    (lessonId: number) => dispatch({ type: "GO_TO_AI_PRACTICE", lessonId }),
    [],
  );

  return {
    screen: state.screen,
    currentLessonIdx: state.currentLessonIdx,
    unlockedLessons: state.unlockedLessons,
    exerciseIdx: state.exerciseIdx,
    results: state.results,
    currentLesson,
    totalLessons,
    correctCount,
    totalAnswered,
    isLastLesson,
    selectLesson,
    completeTeaching,
    skipTeaching,
    startLesson,
    completeExercise,
    nextLesson,
    restartLesson,
    backToMenu,
    goToDrill,
    goToPlacement,
    goToAIPractice,
  };
}
