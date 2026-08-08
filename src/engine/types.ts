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

/** The top-level screen a user can be on. */
export type Screen =
  | "menu"
  | "intro"
  | "teaching"
  | "exercise"
  | "complete"
  | "drill"
  | "placement"
  | "ai-practice";

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
  | { type: "GO_TO_AI_PRACTICE"; lessonId: number };
