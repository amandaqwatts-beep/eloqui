import { DEFAULT_PRONUNCIATION_MODE, PLACEMENT_TOTAL_LEVELS } from "~/data/settings";
import type { PronMode } from "~/data/settings";
import type { AccuracyEntry, FeedbackEntry, VerbumSettings } from "~/engine/types";
import { SETTINGS_DEFAULTS } from "~/data/settings";
import type { Language } from "~/data/languages";

export const STORAGE_KEYS = {
  PLACEMENT_RESULT: "verbum-placement-result",
  PRON_MODE: "verbum-pronunciation-mode",
  SETTINGS: "verbum-settings",
  ACCURACY: "verbum-accuracy",
  FEEDBACK: "verbum-feedback",
} as const;

export function isClient(): boolean { return typeof window !== "undefined"; }

/** Resolve a namespaced key. Unscoped reads retain the original key for compatibility. */
export function languageKey(key: string, language?: Language): string {
  return language ? `${key}-${language}` : key;
}

export function loadJSON<T>(key: string, fallback: T, language?: Language): T {
  if (!isClient()) return fallback;
  try {
    let raw = window.localStorage.getItem(languageKey(key, language));
    // Existing Latin accounts used unscoped keys; migrate lazily on read.
    if (raw === null && language === "latin") raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

export function saveJSON(key: string, value: unknown, language?: Language): void {
  if (!isClient()) return;
  try { window.localStorage.setItem(languageKey(key, language), JSON.stringify(value)); } catch { /* unavailable */ }
}

export function getStoredMode(language: Language = "latin"): PronMode {
  const stored = loadJSON<PronMode | null>(STORAGE_KEYS.PRON_MODE, null, language);
  return stored === "classical" || stored === "ecclesiastical" ? stored : DEFAULT_PRONUNCIATION_MODE;
}
export function setStoredMode(mode: PronMode, language: Language = "latin"): void { saveJSON(STORAGE_KEYS.PRON_MODE, mode, language); }

export function loadSettings(language: Language = "latin"): VerbumSettings {
  const stored = loadJSON<Partial<VerbumSettings> | null>(STORAGE_KEYS.SETTINGS, null, language);
  const pronMode = stored?.pronMode === "classical" || stored?.pronMode === "ecclesiastical" ? stored.pronMode : getStoredMode(language);
  return { pronMode, aiEnabled: typeof stored?.aiEnabled === "boolean" ? stored.aiEnabled : SETTINGS_DEFAULTS.aiEnabled, devMode: typeof stored?.devMode === "boolean" ? stored.devMode : SETTINGS_DEFAULTS.devMode };
}
export function saveSettings(settings: VerbumSettings, language: Language = "latin"): void {
  saveJSON(STORAGE_KEYS.SETTINGS, settings, language);
  saveJSON(STORAGE_KEYS.PRON_MODE, settings.pronMode, language);
}
export function loadAccuracy(language: Language = "latin"): AccuracyEntry[] { return loadJSON(STORAGE_KEYS.ACCURACY, [], language); }
export function saveAccuracy(entries: AccuracyEntry[], language: Language = "latin"): void { saveJSON(STORAGE_KEYS.ACCURACY, entries, language); }
export function recordAccuracy(conceptId: string, correct: boolean, language: Language = "latin"): void {
  const entries = loadAccuracy(language); const entry = entries.find((x) => x.conceptId === conceptId);
  if (entry) { entry.total++; if (correct) entry.correct++; } else entries.push({ conceptId, correct: correct ? 1 : 0, total: 1 });
  saveAccuracy(entries, language);
}
export function clearAllData(language: Language = "latin"): void {
  if (!isClient()) return;
  try { Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(languageKey(key, language))); if (language === "latin") Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key)); window.location.reload(); } catch { /* unavailable */ }
}
export function enableDevMode(language: Language = "latin"): void {
  saveSettings({ ...loadSettings(language), devMode: true }, language);
  const total = language === "latin" ? PLACEMENT_TOTAL_LEVELS : 1;
  saveJSON(STORAGE_KEYS.PLACEMENT_RESULT, { passed: Array(total).fill(true), startLevel: total, completedAt: new Date().toISOString() }, language);
}
export function saveFeedback(lessonId: number, rating: number, comment?: string, language: Language = "latin"): void {
  const entries = loadJSON<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACK, [], language);
  entries.push({ lessonId, rating, comment, createdAt: new Date().toISOString() }); saveJSON(STORAGE_KEYS.FEEDBACK, entries, language);
}
