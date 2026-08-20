import type { Language } from "~/data/languages";
export const APP_NAME = "Eloqui";
export const SETTINGS_DEFAULTS = { aiEnabled: true, devMode: false } as const;
export const LESSONS_PER_UNIT = 149;
export const LESSONS_PER_UNIT_BY_LANGUAGE: Record<Language, number> = { latin: 149, greek: 0, hebrew: 0, english: 10 };
export const EXERCISES_PER_LESSON = 7;
export const DRILL_KINDS = ["vocab-latin", "vocab-english", "conjugation", "declension", "mixed"] as const;
export const DRILL_COUNTS = [10, 20, "all"] as const;
export const DRILL_DEFAULT_COUNT = 10;
export const PLACEMENT_QUESTIONS_PER_LEVEL = 2;
export const PLACEMENT_TOTAL_LEVELS = 134;
export const PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE: Record<Language, number> = { latin: 134, greek: 0, hebrew: 0, english: 10 };
export const PRONUNCIATION_MODES = ["ecclesiastical", "classical"] as const;
export type PronMode = (typeof PRONUNCIATION_MODES)[number];
export const DEFAULT_PRONUNCIATION_MODE = "ecclesiastical";
// ── Speech / TTS (engine/speech.ts; voice-tts-improvement-plan.md P3) ─────
// One default rate plus a slightly slower classical default (an English voice
// reading the v→w/c→k transcription). speech.ts consumes both; surfaces may
// override per-utterance via explicit rate args.
export const SPEECH_DEFAULT_RATE = 0.85;
export const SPEECH_CLASSICAL_RATE = 0.8;
// ── Speech recitation (owner direction 2026-08-11; research/speech-recitation-design.md §6.1) ──
// Free core-curriculum listen-and-repeat. Fixed TTS rate for the model line,
// Safari onend fallback guard, history cap, and the future English ASR
// confidence thresholds (spec §5 — seam only in v1, no asr.ts yet).
export const RECITATION_DEFAULT_RATE = 0.85; // matches what the student hears elsewhere (Q6)
export const RECITATION_ONEND_FALLBACK_MS = 15_000; // Safari onend reliability guard
export const RECITATION_SESSION_HISTORY_CAP = 50; // sessions retained in the payload
export const ASR_SOLID_CONFIDENCE = 0.85; // English ASR future (spec §5)
export const ASR_CLOSE_CONFIDENCE = 0.6;
export const AI_MODEL = "gpt-4o-mini";
export const AI_MAX_TOKENS = 2048;
export const AI_TEMPERATURE = 0.8;
export const AI_MIN_EXERCISES = 3;
export const AI_MAX_EXERCISES = 10;
export const AI_DEFAULT_EXERCISES = 5;
export const AI_DEFAULT_LESSON_ID = 1;
export const LATIN_LESSONS = 149;
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
// ── Proficiency trackers (owner direction 2026-08-11) ───────────
// Daily worst-area lesson (research/daily-worst-area-lesson-design.md §5):
// the top-N worst areas the daily pick rotates among (seeded, per UTC day).
export const DAILY_LESSON_CANDIDATES = 5;
// Improvement-based streak (research/improvement-streak-design.md §6):
// floor = 10 attempts + 3-point delta; 3 improvement days activate the bonus;
// escalation tiers at 10/20/50/100; history cap covers a 100-day streak.
export const IMPROVEMENT_MIN_DAILY_ATTEMPTS = 10;
export const IMPROVEMENT_MIN_POINTS = 3;
export const IMPROVEMENT_ACTIVE_DAYS = 3;
export const IMPROVEMENT_ESCALATION_MILESTONES = [10, 20, 50, 100] as const;
export const IMPROVEMENT_HISTORY_CAP = 120;
export const BONUS_DRILL_DEFAULT_COUNT = 10;
export const BONUS_DRILL_ESCALATED_COUNT = 15;
// ── Sleep audio (owner direction 2026-08-11) ─────────────────────
// Passive listening playlist + timer (research/sleep-audio-design.md §8).
// Duration presets/defaults (5–120 min range), cadence defaults, and the
// playlist weighting constants consumed by src/engine/sleepAudio.ts and the
// sleep-audio payload in src/engine/storage.ts. Tunable without code changes.
export const SLEEP_AUDIO_DEFAULT_DURATION_MIN = 20;
export const SLEEP_AUDIO_PRESETS_MIN = [15, 20, 30, 45, 60] as const;
export const SLEEP_AUDIO_MIN_MIN = 5;
export const SLEEP_AUDIO_MAX_MIN = 120;
export const SLEEP_AUDIO_DEFAULT_REPEAT = 2;
export const SLEEP_AUDIO_DEFAULT_PAUSE_MS = 1500;
export const SLEEP_AUDIO_DEFAULT_INCLUDE_ENGLISH = true;
export const SLEEP_AUDIO_WEAK_BOOST = 3;
export const SLEEP_AUDIO_MISTAKE_BOOST = 1;
export const SLEEP_AUDIO_MAX_WEIGHT = 5;
export const SLEEP_AUDIO_WORST_LIMIT = 20; // getWorstAreas limit
export const SLEEP_AUDIO_PAIR_LIMIT = 10; // getConfusionPairs limit
// ── Review-system rework (owner direction 2026-08-12) ───────────
// Unbounded translation generation over the learned universe + 14 per-unit
// reviews (research/review-system-rework-design.md §1–§2). Tunable without
// code changes.
export const UNIT_REVIEW_ITEM_COUNT = 10; // items per unit review
export const UNIT_REVIEW_PASS_THRESHOLD = 0.8; // fraction correct to pass
export const TRANSLATION_TOKEN_OVERLAP = 0.6; // checkTranslation token-set threshold
export const AI_CONTEXT_WORD_CAP = 300; // universe word list cap for the AI seam (P2)
export const UNIT_REVIEW_CANDIDATE_POOL = 12; // MC distractor candidate pool cap
export const TRANSLATION_DIRECTION_SWITCH = 0.5; // difficulty at which production direction starts
