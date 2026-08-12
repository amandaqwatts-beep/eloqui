import { DEFAULT_PRONUNCIATION_MODE, PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE } from "~/data/settings";
import {
  DIAGNOSTICS_WINDOW_DAYS,
  MAX_DIAGNOSTICS_EVENTS,
} from "~/data/settings";
import type { PronMode } from "~/data/settings";
import type {
  AccuracyEntry,
  AttemptRecord,
  DiagnosticEvent,
  FeedbackEntry,
  VerbumSettings,
} from "~/engine/types";
import type { StreakDay } from "~/engine/improvementStreak";
import { SETTINGS_DEFAULTS } from "~/data/settings";
import type { Language } from "~/data/languages";

export const STORAGE_KEYS = {
  PLACEMENT_RESULT: "verbum-placement-result",
  PRON_MODE: "verbum-pronunciation-mode",
  SETTINGS: "verbum-settings",
  ACCURACY: "verbum-accuracy",
  FEEDBACK: "verbum-feedback",
  DIAGNOSTICS: "verbum-diagnostics",
  IMPROVEMENT_STREAK: "verbum-streak",
  // Owned by progress.ts, which writes them directly (bypassing this module);
  // listed here so clearAllData wipes them too, incl. legacy unscoped Latin.
  PROGRESS: "verbum-progress",
  PROGRESS_TOTALS: "verbum-progress-totals",
} as const;

export const DIAGNOSTICS_SCHEMA_VERSION = 1;

/** Persisted payload shape: version inside the payload, key stable across versions. */
export interface DiagnosticsPayload {
  v: number;
  events: DiagnosticEvent[];
}

/** v1: identity. Future versions transform events; unknown future version drops (fail safe). */
export function migrateDiagnostics(payload: DiagnosticsPayload): DiagnosticEvent[] {
  if (payload.v === DIAGNOSTICS_SCHEMA_VERSION) return payload.events ?? [];
  return [];
}

/**
 * Prune an event log to the rolling window and hard cap (spec §3/§4):
 * 1. drop events older than now − windowDays, plus future events (clock skew > 1 day);
 * 2. keep only the newest MAX_DIAGNOSTICS_EVENTS.
 * Pure; used on every diagnostics write and defensively on read.
 */
export function pruneEvents(events: DiagnosticEvent[], now?: Date): DiagnosticEvent[] {
  const n = now ?? new Date();
  const dayMs = 86_400_000;
  const windowStart = n.getTime() - DIAGNOSTICS_WINDOW_DAYS * dayMs;
  const maxFuture = n.getTime() + dayMs;
  let kept = events.filter((e) => {
    const t = new Date(e.ts).getTime();
    return !Number.isNaN(t) && t >= windowStart && t <= maxFuture;
  });
  if (kept.length > MAX_DIAGNOSTICS_EVENTS) {
    // ISO UTC strings sort lexicographically = chronologically; keep newest.
    kept = [...kept].sort((a, b) => a.ts.localeCompare(b.ts)).slice(-MAX_DIAGNOSTICS_EVENTS);
  }
  return kept;
}

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

// ── Diagnostics storage (owner direction 2026-08-11) ────────────
// Raw event log under verbum-diagnostics-<lang> (schema { v: 1, events });
// namespaced per language with the same legacy latin-unscoped fallback as
// the other keys (no legacy diagnostics key exists — fallback is harmless).
// Adding DIAGNOSTICS to STORAGE_KEYS means clearAllData already wipes it.

export function loadDiagnostics(language: Language = "latin"): DiagnosticEvent[] {
  const payload = loadJSON<unknown>(STORAGE_KEYS.DIAGNOSTICS, null, language);
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Partial<DiagnosticsPayload>;
  if (!Array.isArray(p.events)) return [];
  const events = migrateDiagnostics({ v: typeof p.v === "number" ? p.v : DIAGNOSTICS_SCHEMA_VERSION, events: p.events });
  // Defensive pruning on read covers crashed/aborted writes (spec §7).
  return pruneEvents(events);
}

export function saveDiagnostics(events: DiagnosticEvent[], language: Language = "latin"): void {
  saveJSON(STORAGE_KEYS.DIAGNOSTICS, { v: DIAGNOSTICS_SCHEMA_VERSION, events }, language);
}

let diagSeq = 0;
/** `${Date.now()}-${seq}` ids; seq disambiguates same-millisecond attempts. */
function nextEventId(): string {
  diagSeq = (diagSeq + 1) % 1_000_000;
  return `${Date.now()}-${diagSeq}`;
}

/** Load → append → prune → save; dedupes on id (StrictMode double-invoke guard). */
export function recordAttempt(record: AttemptRecord, language: Language = "latin"): void {
  if (!isClient()) return;
  const id = nextEventId();
  const events = loadDiagnostics(language);
  if (events.some((e) => e.id === id)) return;
  const event: DiagnosticEvent = { ...record, id, ts: record.ts ?? new Date().toISOString() };
  saveDiagnostics(pruneEvents([...events, event]), language);
}
// Wipes every app-owned key for the language — all of STORAGE_KEYS (incl.
// verbum-progress / verbum-progress-totals, which progress.ts persists raw)
// plus the legacy unscoped Latin forms, so no app data survives "Clear All".
export function clearAllData(language: Language = "latin"): void {
  if (!isClient()) return;
  try { Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(languageKey(key, language))); if (language === "latin") Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key)); window.location.reload(); } catch { /* unavailable */ }
}
export function enableDevMode(language: Language = "latin"): void {
  saveSettings({ ...loadSettings(language), devMode: true }, language);
  const total = PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE[language];
  saveJSON(STORAGE_KEYS.PLACEMENT_RESULT, { passed: Array(total).fill(true), startLevel: total, completedAt: new Date().toISOString() }, language);
}
export function saveFeedback(lessonId: number, rating: number, comment?: string, language: Language = "latin"): void {
  const entries = loadJSON<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACK, [], language);
  entries.push({ lessonId, rating, comment, createdAt: new Date().toISOString() }); saveJSON(STORAGE_KEYS.FEEDBACK, entries, language);
}

// ── Improvement-streak storage (owner direction 2026-08-11) ─────
// One key, atomic payload: the accumulated per-day history (the 14-day event
// log cannot reconstruct a 100-day streak, so the streak persists its own
// history — improvement-streak-design.md §1) plus the one-claim-per-day bonus
// flag. Namespaced per language like every other key; clearAllData wipes it
// via the STORAGE_KEYS iteration. ~45 B/day × 120 entries ≈ 5.4 KB.

export const IMPROVEMENT_STREAK_SCHEMA_VERSION = 1;

/** Persisted payload: version inside, key stable across versions. */
export interface StreakPayload {
  v: number;
  /** Ascending by date, capped at IMPROVEMENT_HISTORY_CAP. */
  history: StreakDay[];
  /** UTC YYYY-MM-DD of the last bonus-drill claim — one claim per day. */
  bonusClaimedDate: string | null;
}

/** Corrupt/absent payload → empty history, never throws. */
export function loadStreakHistory(language: Language = "latin"): StreakPayload {
  const raw = loadJSON<unknown>(STORAGE_KEYS.IMPROVEMENT_STREAK, null, language);
  if (!raw || typeof raw !== "object") return { v: IMPROVEMENT_STREAK_SCHEMA_VERSION, history: [], bonusClaimedDate: null };
  const p = raw as Partial<StreakPayload>;
  const history = Array.isArray(p.history)
    ? (p.history as StreakDay[]).filter((d) => typeof d?.date === "string" && typeof d?.attempts === "number")
    : [];
  const bonusClaimedDate = typeof p.bonusClaimedDate === "string" ? p.bonusClaimedDate : null;
  return { v: IMPROVEMENT_STREAK_SCHEMA_VERSION, history, bonusClaimedDate };
}

export function saveStreakHistory(payload: StreakPayload, language: Language = "latin"): void {
  saveJSON(STORAGE_KEYS.IMPROVEMENT_STREAK, payload, language);
}
