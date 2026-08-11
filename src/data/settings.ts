import type { Language } from "~/data/languages";
export const APP_NAME = "Eloqui";
export const SETTINGS_DEFAULTS = { aiEnabled: true, devMode: false } as const;
export const LESSONS_PER_UNIT = 122;
export const LESSONS_PER_UNIT_BY_LANGUAGE: Record<Language, number> = { latin: 122, greek: 0, hebrew: 0, english: 10 };
export const EXERCISES_PER_LESSON = 7;
export const DRILL_KINDS = ["vocab-latin", "vocab-english", "conjugation", "declension", "mixed"] as const;
export const DRILL_COUNTS = [10, 20, "all"] as const;
export const DRILL_DEFAULT_COUNT = 10;
export const PLACEMENT_QUESTIONS_PER_LEVEL = 2;
export const PLACEMENT_TOTAL_LEVELS = 122;
export const PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE: Record<Language, number> = { latin: 122, greek: 0, hebrew: 0, english: 10 };
export const PRONUNCIATION_MODES = ["ecclesiastical", "classical"] as const;
export type PronMode = (typeof PRONUNCIATION_MODES)[number];
export const DEFAULT_PRONUNCIATION_MODE = "ecclesiastical";
export const AI_MODEL = "gpt-4o-mini";
export const AI_MAX_TOKENS = 2048;
export const AI_TEMPERATURE = 0.8;
export const AI_MIN_EXERCISES = 3;
export const AI_MAX_EXERCISES = 10;
export const AI_DEFAULT_EXERCISES = 5;
export const AI_DEFAULT_LESSON_ID = 1;
export const STORAGE_KEYS = { placementResult: "verbum-placement-result", pronunciationMode: "verbum-pronunciation-mode" } as const;
export const LATIN_LESSONS = 122;
// ── Diagnostics (owner direction 2026-08-11) ────────────────────
// Rolling 2-week per-concept tracking: window, event-log cap, and the
// mistake/confusion thresholds consumed by src/engine/diagnostics.ts.
// Tunable without code changes.
export const DIAGNOSTICS_WINDOW_DAYS = 14;
export const MAX_DIAGNOSTICS_EVENTS = 8000;
export const MIN_MISTAKE_EVIDENCE = 2;
export const MIN_CONFUSION_EVIDENCE = 3;
export const CONFUSION_RATE_THRESHOLD = 0.25;
export const MIN_TOTAL_ATTEMPTS_FOR_RATE = 10;
export const WEAK_SPOT_THRESHOLD = 0.6;
export const WEAK_SPOT_MIN_ATTEMPTS = 1;
export const WORST_AREA_MIN_ATTEMPTS = 3;
