import { DEFAULT_PRONUNCIATION_MODE, PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE } from "~/data/settings";
import {
  DIAGNOSTICS_WINDOW_DAYS,
  MAX_DIAGNOSTICS_EVENTS,
  RECITATION_SESSION_HISTORY_CAP,
  SLEEP_AUDIO_DEFAULT_DURATION_MIN,
  SLEEP_AUDIO_DEFAULT_INCLUDE_ENGLISH,
  SLEEP_AUDIO_DEFAULT_PAUSE_MS,
  SLEEP_AUDIO_DEFAULT_REPEAT,
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
import type { RecitationSource } from "~/engine/recitation";

export const STORAGE_KEYS = {
  PLACEMENT_RESULT: "verbum-placement-result",
  PRON_MODE: "verbum-pronunciation-mode",
  SETTINGS: "verbum-settings",
  ACCURACY: "verbum-accuracy",
  FEEDBACK: "verbum-feedback",
  DIAGNOSTICS: "verbum-diagnostics",
  IMPROVEMENT_STREAK: "verbum-streak",
  SLEEP_AUDIO: "verbum-sleep-audio",
  UNIT_REVIEW: "verbum-unit-review",
  RECITATION: "verbum-recitation",
  // Owned by progress.ts, which writes them directly (bypassing this module);
  // listed here so clearAllData wipes them too, incl. legacy unscoped Latin.
  PROGRESS: "verbum-progress",
  PROGRESS_TOTALS: "verbum-progress-totals",
  // Cross-language lesson progress (LESSONS 1007/1008). Never language-
  // namespaced — one global key shared by latin + english. Listed here so
  // clearAllData's scoped sweep covers it; the unscoped key itself is removed
  // by the dedicated unconditional line in clearAllData (see below).
  CROSS_PROGRESS: "verbum-cross-progress",
  // Account identity (Phase 1: anonymous id + cross-device sync). One global
  // key per browser, never per-language, so it survives per-language
  // Clear All Data. clearAllData explicitly SKIPS it (see below).
  USER: "verbum-user",
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
  // Wipe every app-owned key for the language EXCEPT the account identity
  // (STORAGE_KEYS.USER): the user id / device id are global per-browser, not
  // per-language, and should survive clearing (account-infrastructure §7 d6 —
  // "Sign out / remove account data" is a distinct Phase 2 action).
  const wipe = Object.values(STORAGE_KEYS).filter((k) => k !== STORAGE_KEYS.USER);
  try { wipe.forEach((key) => window.localStorage.removeItem(languageKey(key, language))); if (language === "latin") wipe.forEach((key) => window.localStorage.removeItem(key)); window.localStorage.removeItem(STORAGE_KEYS.CROSS_PROGRESS); window.location.reload(); } catch { /* unavailable */ }
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

// ── Sleep-audio storage (owner direction 2026-08-11) ────────────
// One namespaced key holding prefs + passive session counters
// (research/sleep-audio-design.md §5). Listening NEVER writes DiagnosticEvents
// — the counters here answer "has the student been listening?" without
// corrupting mastery evidence. loadJSON's legacy latin-unscoped fallback
// applies automatically (no legacy key exists — harmless, consistent with
// diagnostics). Adding SLEEP_AUDIO to STORAGE_KEYS means clearAllData wipes it.

export const SLEEP_AUDIO_SCHEMA_VERSION = 1;

export interface SleepAudioPrefs {
  durationMin: number;
  repeatEach: number;
  pauseMs: number;
  includeEnglish: boolean;
}

export interface SleepAudioSessionStats {
  lastSessionAt: string | null; // ISO UTC
  lastSessionDurationMin: number; // elapsed minutes, rounded
  lastSessionItems: number; // items played (currentItemIndex + 1)
  totalListenSeconds: number;
  totalSessions: number;
}

export interface SleepAudioPayload {
  v: number;
  prefs: SleepAudioPrefs;
  stats: SleepAudioSessionStats;
}

export const SLEEP_AUDIO_PREFS_DEFAULTS: SleepAudioPrefs = {
  durationMin: SLEEP_AUDIO_DEFAULT_DURATION_MIN /* 20 */,
  repeatEach: SLEEP_AUDIO_DEFAULT_REPEAT /* 2 */,
  pauseMs: SLEEP_AUDIO_DEFAULT_PAUSE_MS /* 1500 */,
  includeEnglish: SLEEP_AUDIO_DEFAULT_INCLUDE_ENGLISH /* true */,
};

function numOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Deep-merge defaults; corrupt/absent payload → defaults. Never throws. */
export function loadSleepAudio(language: Language = "latin"): SleepAudioPayload {
  const raw = loadJSON<unknown>(STORAGE_KEYS.SLEEP_AUDIO, null, language);
  if (!raw || typeof raw !== "object") {
    return {
      v: SLEEP_AUDIO_SCHEMA_VERSION,
      prefs: { ...SLEEP_AUDIO_PREFS_DEFAULTS },
      stats: { lastSessionAt: null, lastSessionDurationMin: 0, lastSessionItems: 0, totalListenSeconds: 0, totalSessions: 0 },
    };
  }
  const p = raw as Partial<SleepAudioPayload>;
  const prefs = (p.prefs ?? {}) as Partial<SleepAudioPrefs>;
  const stats = (p.stats ?? {}) as Partial<SleepAudioSessionStats>;
  return {
    v: SLEEP_AUDIO_SCHEMA_VERSION,
    prefs: {
      durationMin: numOr(prefs.durationMin, SLEEP_AUDIO_PREFS_DEFAULTS.durationMin),
      repeatEach: numOr(prefs.repeatEach, SLEEP_AUDIO_PREFS_DEFAULTS.repeatEach),
      pauseMs: numOr(prefs.pauseMs, SLEEP_AUDIO_PREFS_DEFAULTS.pauseMs),
      includeEnglish: typeof prefs.includeEnglish === "boolean" ? prefs.includeEnglish : SLEEP_AUDIO_PREFS_DEFAULTS.includeEnglish,
    },
    stats: {
      lastSessionAt: typeof stats.lastSessionAt === "string" ? stats.lastSessionAt : null,
      lastSessionDurationMin: numOr(stats.lastSessionDurationMin, 0),
      lastSessionItems: numOr(stats.lastSessionItems, 0),
      totalListenSeconds: numOr(stats.totalListenSeconds, 0),
      totalSessions: numOr(stats.totalSessions, 0),
    },
  };
}

export function saveSleepAudio(payload: SleepAudioPayload, language: Language = "latin"): void {
  saveJSON(STORAGE_KEYS.SLEEP_AUDIO, payload, language);
}

/** Load → bump counters → save. One call per ended session (spec §5). */
export function recordSleepSession(partial: { durationSec: number; items: number }, language: Language = "latin"): void {
  if (!isClient()) return;
  const payload = loadSleepAudio(language);
  payload.stats.lastSessionAt = new Date().toISOString();
  payload.stats.lastSessionDurationMin = Math.round(partial.durationSec / 60);
  payload.stats.lastSessionItems = partial.items;
  payload.stats.totalListenSeconds += partial.durationSec;
  payload.stats.totalSessions += 1;
  saveSleepAudio(payload, language);
}

// ── Unit-review storage (owner direction 2026-08-12) ─────────────
// Per-unit review completion under verbum-unit-review-<lang>. Key separation:
// review progress NEVER enters verbum-progress, so getDashboardStats.
// lessonsCompleted and the book bookmarks stay untouched (design §2.4).
// clearAllData wipes it via the STORAGE_KEYS iteration (storage.ts:158-161).

export const UNIT_REVIEW_SCHEMA_VERSION = 1;

export interface UnitReviewCompletedEntry {
  completedAt: string; // ISO UTC
  score: number; // fraction correct 0..1
  timesCompleted: number;
}

/** Persisted payload: version inside, key stable across versions. */
export interface UnitReviewPayload {
  v: number;
  /** key = String(unitNumber). */
  completed: Record<string, UnitReviewCompletedEntry>;
}

/** Corrupt/absent payload → empty map, never throws (loadStreakHistory pattern). */
export function loadUnitReviews(language: Language = "latin"): UnitReviewPayload {
  const raw = loadJSON<unknown>(STORAGE_KEYS.UNIT_REVIEW, null, language);
  if (!raw || typeof raw !== "object") return { v: UNIT_REVIEW_SCHEMA_VERSION, completed: {} };
  const p = raw as Partial<UnitReviewPayload>;
  const completed: Record<string, UnitReviewCompletedEntry> = {};
  if (p.completed && typeof p.completed === "object") {
    for (const [k, v] of Object.entries(p.completed)) {
      const e = v as Partial<UnitReviewCompletedEntry> | undefined;
      if (e && typeof e.completedAt === "string" && typeof e.score === "number" && typeof e.timesCompleted === "number") {
        completed[k] = { completedAt: e.completedAt, score: e.score, timesCompleted: e.timesCompleted };
      }
    }
  }
  return { v: UNIT_REVIEW_SCHEMA_VERSION, completed };
}

export function saveUnitReviews(payload: UnitReviewPayload, language: Language = "latin"): void {
  saveJSON(STORAGE_KEYS.UNIT_REVIEW, payload, language);
}

/**
 * Idempotent upsert by unitNumber (StrictMode double-invoke safe, risk 2).
 * Fired from the completion EVENT HANDLER (never render-body side effects —
 * risk 2), so a double invoke converges on one entry. Never calls saveProgress.
 */
export function recordUnitReviewCompletion(unitNumber: number, score: number, language: Language = "latin"): void {
  if (!isClient()) return;
  const payload = loadUnitReviews(language);
  const key = String(unitNumber);
  const prev = payload.completed[key];
  payload.completed[key] = {
    completedAt: new Date().toISOString(),
    score: Math.max(0, Math.min(1, score)),
    timesCompleted: (prev?.timesCompleted ?? 0) + 1,
  };
  saveUnitReviews(payload, language);
}

// ── Recitation storage (owner direction 2026-08-11) ───────────────
// Speech recitation (listen-and-repeat) is a FREE core-curriculum feature.
// Self-ratings NEVER write DiagnosticEvents (spec §3.2): a "solid" rating as
// ok:true would fabricate mastery and a "again" as ok:false would manufacture
// weak spots in the shared comprehension log, which has no source filter on
// its accuracy/worst-area/series queries. Instead, one dedicated namespaced
// key holds per-session summaries — "is the student reciting, and does
// 'try again' trend down over sessions?" — without corrupting any mastery
// evidence. Adding RECITATION to STORAGE_KEYS means clearAllData wipes it.

export const RECITATION_SCHEMA_VERSION = 1;

/** One finished (or abandoned mid-way) recitation session. Written once on
 *  the Done view or on back-navigation — partial summaries are fine, the
 *  honest signal is repetitions attempted (spec §6.2). */
export interface RecitationSessionSummary {
  /** UTC ISO timestamp of the session end. */
  date: string;
  lessonId: number;
  source: RecitationSource;
  lineCount: number;
  solid: number;
  close: number;
  again: number;
}

/** Persisted payload: version inside, key stable across versions. */
export interface RecitationPayload {
  v: number;
  stats: { totalSessions: number; totalLines: number; lastSessionAt: string | null };
  /** Newest first, capped at RECITATION_SESSION_HISTORY_CAP. */
  sessions: RecitationSessionSummary[];
}

const RECITATION_STATS_DEFAULTS = { totalSessions: 0, totalLines: 0, lastSessionAt: null };

/** Corrupt/absent payload → defaults, never throws (loadSleepAudio pattern). */
export function loadRecitation(language: Language = "latin"): RecitationPayload {
  const raw = loadJSON<unknown>(STORAGE_KEYS.RECITATION, null, language);
  if (!raw || typeof raw !== "object") {
    return { v: RECITATION_SCHEMA_VERSION, stats: { ...RECITATION_STATS_DEFAULTS }, sessions: [] };
  }
  const p = raw as Partial<RecitationPayload>;
  const stats = (p.stats ?? {}) as Partial<RecitationPayload["stats"]>;
  const sessions = Array.isArray(p.sessions)
    ? (p.sessions as RecitationSessionSummary[]).filter(
        (s) =>
          s &&
          typeof s.date === "string" &&
          typeof s.lessonId === "number" &&
          (s.source === "vocab" || s.source === "sentence" || s.source === "passage") &&
          typeof s.lineCount === "number" &&
          typeof s.solid === "number" &&
          typeof s.close === "number" &&
          typeof s.again === "number",
      )
    : [];
  return {
    v: RECITATION_SCHEMA_VERSION,
    stats: {
      totalSessions: typeof stats.totalSessions === "number" ? stats.totalSessions : sessions.length,
      totalLines: typeof stats.totalLines === "number" ? stats.totalLines : 0,
      lastSessionAt: typeof stats.lastSessionAt === "string" ? stats.lastSessionAt : null,
    },
    sessions: sessions.slice(0, RECITATION_SESSION_HISTORY_CAP),
  };
}

export function saveRecitation(payload: RecitationPayload, language: Language = "latin"): void {
  saveJSON(STORAGE_KEYS.RECITATION, payload, language);
}

/** Load → prepend summary (newest first) → cap → save. One call per ended
 *  session (Done view or back-navigation). Idempotence is the caller's
 *  concern (Phase 2 screen fires it from an event handler once). */
export function recordRecitationSession(summary: RecitationSessionSummary, language: Language = "latin"): void {
  if (!isClient()) return;
  const payload = loadRecitation(language);
  payload.sessions = [summary, ...payload.sessions].slice(0, RECITATION_SESSION_HISTORY_CAP);
  payload.stats.totalSessions += 1;
  payload.stats.totalLines += summary.lineCount;
  payload.stats.lastSessionAt = summary.date;
  saveRecitation(payload, language);
}

// ── Account identity (account-infrastructure Phase 1) ─────────
// Anonymous id + per-browser device id under the global (unscoped, per-browser)
// key STORAGE_KEYS.USER = "verbum-user". Payload per spec §4.2. The client
// generates it silently on first use; nothing uploads until the sync engine
// runs its first claim (§4.5). Survives per-language Clear All Data.

export interface UserIdentity {
  v: 1;
  id: string; // "user_" + 16 hex
  deviceId: string; // "dev_" + 16 hex
  anonymous: boolean;
  createdAt: string; // ISO
  claimedAt: string | null; // set by the first successful sync claim
  auth: null; // Phase 2 populates { provider, sub }
}

/** Deterministic-ish id generator using crypto when available. */
function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  let s = "";
  for (let i = 0; i < bytes; i++) s += arr[i].toString(16).padStart(2, "0");
  return s;
}

export function loadUserIdentity(): UserIdentity | null {
  if (!isClient()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<UserIdentity>;
    if (typeof p.id !== "string" || !p.id.startsWith("user_")) return null;
    if (typeof p.deviceId !== "string" || !p.deviceId.startsWith("dev_")) return null;
    return {
      v: 1,
      id: p.id,
      deviceId: p.deviceId,
      anonymous: p.anonymous !== false,
      createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(),
      claimedAt: typeof p.claimedAt === "string" ? p.claimedAt : null,
      auth: null,
    };
  } catch { return null; }
}

/** Create the identity if absent; return it. Safe to call repeatedly. */
export function ensureUserIdentity(): UserIdentity {
  const existing = loadUserIdentity();
  if (existing) return existing;
  const identity: UserIdentity = {
    v: 1,
    id: "user_" + randomHex(8),
    deviceId: "dev_" + randomHex(8),
    anonymous: true,
    createdAt: new Date().toISOString(),
    claimedAt: null,
    auth: null,
  };
  if (isClient()) {
    try { window.localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(identity)); } catch { /* unavailable */ }
  }
  return identity;
}

export function getUserId(): string | null {
  return loadUserIdentity()?.id ?? null;
}

export function getDeviceId(): string | null {
  return loadUserIdentity()?.deviceId ?? null;
}

/** Mark the first-sync claim (§4.5): after the first successful push that
 *  uploaded pre-existing data. No-op if already claimed. */
export function markIdentityClaimed(): void {
  if (!isClient()) return;
  const id = loadUserIdentity();
  if (!id || id.claimedAt) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify({ ...id, claimedAt: new Date().toISOString() }),
    );
  } catch { /* unavailable */ }
}
