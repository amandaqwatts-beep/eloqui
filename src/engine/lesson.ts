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
  FourPhaseRun,
  LessonEngineAction,
  LessonEngineState,
  PhaseName,
  PlacementResult,
  Screen,
} from "~/engine/types";
import {
  loadJSON,
  saveJSON,
  STORAGE_KEYS,
  loadPhaseStateFor,
  savePhaseState,
} from "~/engine/storage";
import {
  applyPhaseAttempt,
  completeTaughtPhase,
  emptyPhaseState,
  phaseScreen,
  resumePhaseFor,
} from "~/engine/fourPhase";
import { saveProgress } from "~/engine/progress";

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
    // ── Four-phase lesson loop (design §3) ──────────────────────────────
    // Pure reducer cases; all persistence (phase state, saveProgress, unlock)
    // lives in the hook's action wrappers (below) so this stays a pure function
    // of (state, action) — testable without storage or React.
    case "PHASE_START": {
      // Begin a four-phase run. The hook passes the persisted PhaseState it
      // loaded (or undefined for fresh). STEP 4: a returning student RESUMES
      // from the first not-yet-passed phase (resumePhaseFor) instead of always
      // restarting at taught — so a reload mid-memorized keeps the taught pass
      // AND the in-flight accuracy window (early drill attempts are preserved).
      const persisted = action.persisted ?? emptyPhaseState();
      const resumePhase = resumePhaseFor(persisted);
      return {
        ...state,
        screen: phaseScreen(resumePhase),
        currentLessonIdx: action.idx,
        exerciseIdx: 0,
        results: [],
        fourPhase: {
          lessonId: action.lessonId,
          phase: resumePhase,
          reviewMode: false,
          reTeachStepIndex: null,
          phaseState: persisted,
          seed:
            action.seed ??
            `phase|${action.lessonId}|${new Date().toISOString().slice(0, 10)}`,
        },
      };
    }
    case "PHASE_TEACH_COMPLETE": {
      // Advance taught → memorized. Covers the initial teach AND the re-teach
      // after a memorized→taught bounce (which re-enters the drill loop).
      if (!state.fourPhase || state.fourPhase.phase !== "taught") return state;
      const run = completeTaughtPhase(state.fourPhase);
      return { ...state, screen: "memorized", fourPhase: run };
    }
    case "PHASE_ATTEMPT": {
      if (!state.fourPhase || state.fourPhase.phase === "taught") return state;
      const { run, outcome } = applyPhaseAttempt(state.fourPhase, action.correct, {
        passingConcepts: action.passingConcepts,
        reTeachStepIndex: action.reTeachStepIndex,
      });
      switch (outcome) {
        case "continue":
          return { ...state, fourPhase: run, screen: phaseScreen(run.phase) };
        case "advance":
          return { ...state, fourPhase: run, screen: phaseScreen(run.phase) };
        case "bounce":
          // Re-teach-first ordering: bouncing TO "taught" lands on the teaching
          // screen (reviewMode=true) BEFORE re-entering the drill loop.
          return {
            ...state,
            fourPhase: run,
            screen: run.phase === "taught" ? "teaching" : phaseScreen(run.phase),
          };
        case "complete":
          // incorporated passed → whole lesson completes (hook then
          // saveProgress's + unlocks the next lesson).
          return { ...state, fourPhase: run, screen: "complete" };
      }
    }
    case "PHASE_RESET":
      return { ...state, screen: "menu", fourPhase: null };
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
    fourPhase: null,
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

  // ── Four-phase lesson loop (design §3; additive to the legacy flow) ──
  // Active four-phase run, or null when the legacy single-pass flow is active.
  fourPhase: FourPhaseRun | null;
  // Start a four-phase run for a lesson (loads its persisted PhaseState).
  startPhaseLesson: (idx: number, lessonId: number) => void;
  // taught → memorized (initial teach OR re-teach after a bounce).
  completePhaseTeaching: () => void;
  // Record one drill-phase answer; applies the mastery + AND return-to-phase
  // rule. On a correct incorporated attempt, passingConcepts (grammarIndex
  // topic ids the passage required) are marked incorporated. Persists the
  // resulting phase state; on overall completion also saveProgress's + unlocks.
  // reTeachStepIndex (optional) is the screen's pickReTeachStep choice — the
  // step to re-present when a memorized→taught bounce fires (defaults null).
  recordPhaseAttempt: (
    correct: boolean,
    passingConcepts?: string[],
    reTeachStepIndex?: number | null,
  ) => void;
  // Abandon the four-phase run and return to the menu.
  resetPhase: () => void;
}

/** Persist an overall four-phase lesson completion: write verbum-progress via
 *  saveProgress (timesCompleted/bestScore semantics unchanged) using the
 *  lifetime tallies across the three drill phases. The caller then unlocks the
 *  next lesson exactly as nextLesson does. */
function recordPhaseProgress(run: FourPhaseRun, language: Language): void {
  let correct = 0;
  let attempts = 0;
  const drill: readonly PhaseName[] = ["memorized", "quizzed", "incorporated"];
  for (const p of drill) {
    const rec = run.phaseState.phases[p];
    if (rec) {
      correct += rec.correct;
      attempts += rec.attempts;
    }
  }
  if (attempts > 0) saveProgress(run.lessonId, correct, attempts, language);
}

/** Unlock the lesson after the current one via the placement payload (same as
 *  nextLesson). No-op on the last lesson. */
function unlockNextLesson(
  currentIdx: number,
  unlockedLessons: number,
  totalLessons: number,
  language: Language,
): void {
  const nextIdx = currentIdx + 1;
  if (nextIdx >= totalLessons) return;
  const nextUnlocked = Math.max(unlockedLessons, nextIdx + 1);
  const existing = loadJSON<PlacementResult | null>(
    STORAGE_KEYS.PLACEMENT_RESULT,
    null,
    language,
  );
  saveJSON(
    STORAGE_KEYS.PLACEMENT_RESULT,
    {
      passed: existing?.passed ?? [],
      startLevel: nextUnlocked,
      completedAt: new Date().toISOString(),
    },
    language,
  );
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

  // ── Four-phase lesson loop actions ────────────────────────────────────
  const startPhaseLesson = useCallback(
    (idx: number, lessonId: number) => {
      // Resume any prior per-lesson phase state (a returning student continues
      // from the phase they reached, not a fresh single pass).
      const persisted = loadPhaseStateFor(lessonId, language);
      dispatch({ type: "PHASE_START", idx, lessonId, persisted });
    },
    [language],
  );
  const completePhaseTeaching = useCallback(
    () => {
      // STEP 4 persistence follow-up (screens flag): PHASE_TEACH_COMPLETE
      // marks taught passed and moves the run into memorized — persist that
      // transition immediately (same pattern as recordPhaseAttempt) so a
      // reload mid-memorized resumes in memorized (resumePhaseFor) with the
      // taught pass intact, instead of re-teaching from the top and losing
      // the fresh window's early drill attempts.
      const action: LessonEngineAction = { type: "PHASE_TEACH_COMPLETE" };
      const next = lessonReducer(state, action);
      if (next.fourPhase) {
        savePhaseState(next.fourPhase.lessonId, next.fourPhase.phaseState, language);
      }
      dispatch(action);
    },
    [state, language],
  );
  const recordPhaseAttempt = useCallback(
    (
      correct: boolean,
      passingConcepts?: string[],
      reTeachStepIndex?: number | null,
    ) => {
      const action: LessonEngineAction = {
        type: "PHASE_ATTEMPT",
        correct,
        passingConcepts,
        reTeachStepIndex,
      };
      // The reducer is deterministic — compute the next state here so this
      // wrapper can persist (phase state + completion) before React applies it.
      const next = lessonReducer(state, action);
      if (next.fourPhase) {
        savePhaseState(next.fourPhase.lessonId, next.fourPhase.phaseState, language);
      }
      // The lesson completes ONLY when the incorporated phase passes (design
      // §3): write progress and unlock the next lesson.
      if (next.screen === "complete" && next.fourPhase) {
        recordPhaseProgress(next.fourPhase, language);
        unlockNextLesson(
          state.currentLessonIdx,
          state.unlockedLessons,
          totalLessons,
          language,
        );
      }
      dispatch(action);
    },
    [state, totalLessons, language],
  );
  const resetPhase = useCallback(() => dispatch({ type: "PHASE_RESET" }), []);

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
    fourPhase: state.fourPhase,
    startPhaseLesson,
    completePhaseTeaching,
    recordPhaseAttempt,
    resetPhase,
  };
}
