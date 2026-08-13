/**
 * SleepAudioScreen.tsx — Screens department: Sleep Audio Mode (setup + session).
 *
 * Design: research/sleep-audio-design.md §2 (user flow), §4 (timer), §5
 * (session stats), §6 (cadence + shared pronMode), §7 (iOS / TTS limits),
 * §8 (prefs live in the sleep-audio payload, NOT VerbumSettings).
 *
 * Consumes the Phase 1 engine only:
 *   - buildSleepPlaylist (src/engine/sleepAudio.ts) — diagnostic-driven order
 *   - createAudioLoop's autoStopAfterMs / onComplete / pronMode (audioPlayer.ts)
 *   - loadSleepAudio / saveSleepAudio / recordSleepSession (storage.ts)
 *
 * Data-integrity rule (§5): listening NEVER writes DiagnosticEvents —
 * recordSleepSession is the only persistence.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { DiagnosticEvent } from "~/engine/types";
import type { LatinMode } from "~/engine/ipaConverter";
import { buildSleepPlaylist } from "~/engine/sleepAudio";
import { createAudioLoop, type AudioLoopState } from "~/engine/audioPlayer";
import {
  loadSleepAudio,
  saveSleepAudio,
  recordSleepSession,
  type SleepAudioPrefs,
} from "~/engine/storage";
import {
  SLEEP_AUDIO_PRESETS_MIN,
  SLEEP_AUDIO_MIN_MIN,
  SLEEP_AUDIO_MAX_MIN,
} from "~/data/settings";

interface Props {
  lessons: Lesson[];
  completedLessonIds: number[];
  currentLessonId?: number;
  events: DiagnosticEvent[];
  /** Shared pronunciation toggle (spec §6 — no separate sleep mode). */
  pronMode: LatinMode;
  language?: Language;
  onBack: () => void;
}

interface SessionSummary {
  completed: boolean;
  durationMin: number;
  items: number;
  totalSessions: number;
}

const MIN = SLEEP_AUDIO_MIN_MIN;
const MAX = SLEEP_AUDIO_MAX_MIN;

function clampDuration(v: number): number {
  if (!Number.isFinite(v)) return MIN;
  return Math.min(MAX, Math.max(MIN, Math.round(v)));
}

function ttsAvailableNow(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    return window.speechSynthesis.getVoices().length > 0;
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, "0")}`;
}

export default function SleepAudioScreen({
  lessons,
  completedLessonIds,
  currentLessonId,
  events,
  pronMode,
  language = "latin",
}: Props) {
  // ── Prefs + session stats (one namespaced payload, spec §5/§8) ──
  const [prefs, setPrefs] = useState<SleepAudioPrefs>(() => loadSleepAudio(language).prefs);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [customMin, setCustomMin] = useState<string>(() => String(loadSleepAudio(language).prefs.durationMin));

  const updatePrefs = useCallback(
    (patch: Partial<SleepAudioPrefs>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        const payload = loadSleepAudio(language);
        saveSleepAudio({ ...payload, prefs: next }, language);
        return next;
      });
    },
    [language],
  );

  const commitDraft = useCallback(() => {
    const v = Number(customMin);
    const clamped = Number.isFinite(v) ? clampDuration(v) : prefs.durationMin;
    updatePrefs({ durationMin: clamped });
    setCustomMin(String(clamped));
  }, [customMin, prefs.durationMin, updatePrefs]);

  // ── TTS availability + iOS (spec §7) ────────────────────────────
  // Voices can load asynchronously (voiceschanged) — the check self-heals.
  const [speechOk, setSpeechOk] = useState<boolean>(() => ttsAvailableNow());
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const refresh = () => setSpeechOk(ttsAvailableNow());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", refresh);
  }, []);
  const ios = useMemo(isIOS, []);

  // ── Playlist (pure engine read; deterministic per language/UTC day) ──
  const playlist = useMemo(
    () =>
      buildSleepPlaylist({
        lessons,
        completedLessonIds,
        currentLessonId,
        events,
        includeEnglish: prefs.includeEnglish,
        language,
      }),
    [lessons, completedLessonIds, currentLessonId, events, prefs.includeEnglish, language],
  );

  const focusLine = useMemo(() => {
    if (playlist.items.length === 0) return "";
    if (playlist.source === "diagnostic") {
      const lead = playlist.weakestLabel
        ? `Tonight focuses on your weak spots — ${playlist.weakestLabel}`
        : "Tonight focuses on your weak spots";
      const pairs =
        playlist.pairCount > 0
          ? `, plus ${playlist.pairCount} similar-sounding pair${playlist.pairCount === 1 ? "" : "s"}`
          : "";
      return `${lead}${pairs}.`;
    }
    return "A full review of everything you've learned.";
  }, [playlist]);

  // ── Session state machine ───────────────────────────────────────
  const [phase, setPhase] = useState<"setup" | "session">("setup");
  const [paused, setPaused] = useState(false);
  const [sessionKey, setSessionKey] = useState(0); // bump = start / resume
  const [loopState, setLoopState] = useState<AudioLoopState>({
    playing: false,
    currentItemIndex: 0,
    currentRepeat: 0,
  });
  const [resumeFrom, setResumeFrom] = useState(0); // absolute item index (0 = start)
  const [resumeRemainingMs, setResumeRemainingMs] = useState<number | undefined>(undefined);
  const [planMs, setPlanMs] = useState(0); // planned duration, drives autoStopAfterMs
  const [now, setNow] = useState(() => Date.now()); // 1 s tick during the session

  // Refs (safe from event handlers and unmount cleanup).
  const playerRef = useRef<ReturnType<typeof createAudioLoop> | null>(null);
  const startedRef = useRef(false);
  const recordedRef = useRef(false);
  const planMsRef = useRef(0);
  const segmentStartRef = useRef(0); // wall clock at last start/resume
  const accumulatedMsRef = useRef(0); // listening ms before the current segment
  const baseIndexRef = useRef(0); // absolute offset of the sliced player's item 0
  const pausedRemainingRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // ── Wake lock (spec §7.2): guarded, never throws; iOS rejects silently. ──
  const requestWakeLock = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      /* unsupported / denied / iOS — fail silently, no fake promises */
    }
  }, []);
  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release();
    } catch {
      /* already released */
    }
    wakeLockRef.current = null;
  }, []);

  // ── Finalize: persist the passive session (§4/§5), return to setup. ──
  // Exactly one record per session (timer complete, Stop, or unmount).
  const finalize = useCallback(
    (completed: boolean) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      const st = playerRef.current?.getState() ?? { currentItemIndex: 0 };
      const items = Math.max(1, baseIndexRef.current + st.currentItemIndex + 1);
      const durationSec = completed
        ? Math.round(planMsRef.current / 1000)
        : Math.max(1, Math.round((accumulatedMsRef.current + (Date.now() - segmentStartRef.current)) / 1000));
      recordSleepSession({ durationSec, items }, language);
      const payload = loadSleepAudio(language);
      setSummary({
        completed,
        durationMin: Math.round(durationSec / 60),
        items,
        totalSessions: payload.stats.totalSessions,
      });
      setPhase("setup");
      setPaused(false);
      void releaseWakeLock();
    },
    [language, releaseWakeLock],
  );

  const handleTimerComplete = useCallback(() => finalize(true), [finalize]);

  // ── Player: recreated only on start/resume inputs. onComplete is a stable
  // callback (via finalize), so the identity changes only when the inputs do.
  const sessionItems = useMemo(
    () => (resumeFrom > 0 ? playlist.items.slice(resumeFrom) : playlist.items),
    [playlist.items, resumeFrom],
  );
  const player = useMemo(
    () =>
      createAudioLoop({
        items: sessionItems,
        repeatEach: prefs.repeatEach,
        pauseBetweenMs: prefs.pauseMs,
        autoStopAfterMs: resumeRemainingMs ?? planMs,
        pronMode,
        onComplete: handleTimerComplete,
      }),
    [sessionItems, prefs.repeatEach, prefs.pauseMs, resumeRemainingMs, planMs, pronMode, handleTimerComplete],
  );
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Subscription + unmount cleanup contract (audioPlayer.ts): consumers MUST
  // call stop() on unmount — navigation away ⇒ audio stops, timers clear.
  useEffect(() => {
    const off = player.onStateChange(setLoopState);
    return () => {
      off();
      player.stop();
    };
  }, [player]);

  // Auto-start the (re)created player when a session or resume begins.
  useEffect(() => {
    if (sessionKey > 0) player.start();
  }, [sessionKey, player]);

  // Live countdown: re-read the deadline on a 1 s interval (spec §4).
  useEffect(() => {
    if (phase !== "session" || paused) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase, paused]);

  // Real-unmount record: back navigation mid-session persists what was heard
  // (spec §2 "navigation away … persists the session summary") and releases
  // the wake lock. Never records twice (recordedRef).
  useEffect(
    () => () => {
      if (startedRef.current && !recordedRef.current) {
        recordedRef.current = true;
        const st = playerRef.current?.getState() ?? { currentItemIndex: 0 };
        const items = Math.max(1, baseIndexRef.current + st.currentItemIndex + 1);
        const durationSec = Math.max(
          1,
          Math.round((accumulatedMsRef.current + (Date.now() - segmentStartRef.current)) / 1000),
        );
        recordSleepSession({ durationSec, items }, language);
      }
      void releaseWakeLock();
    },
    [language, releaseWakeLock],
  );

  // ── Handlers ────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (!speechOk || playlist.items.length === 0) return;
    const raw = Number(customMin);
    const dur = clampDuration(Number.isFinite(raw) ? raw : prefs.durationMin);
    updatePrefs({ durationMin: dur });
    setCustomMin(String(dur));
    planMsRef.current = dur * 60_000;
    setPlanMs(dur * 60_000);
    accumulatedMsRef.current = 0;
    baseIndexRef.current = 0;
    setResumeFrom(0);
    setResumeRemainingMs(undefined);
    recordedRef.current = false;
    startedRef.current = true;
    segmentStartRef.current = Date.now();
    setSummary(null);
    setPaused(false);
    setPhase("session");
    void requestWakeLock();
    setSessionKey((k) => k + 1);
  }, [speechOk, playlist.items.length, customMin, prefs.durationMin, updatePrefs, requestWakeLock]);

  const handlePause = useCallback(() => {
    const st = playerRef.current?.getState();
    pausedRemainingRef.current = st?.remainingMs ?? 0;
    accumulatedMsRef.current += Date.now() - segmentStartRef.current;
    segmentStartRef.current = Date.now(); // paused segment contributes ~0 later
    playerRef.current?.stop();
    void releaseWakeLock();
    setPaused(true);
  }, [releaseWakeLock]);

  const handleResume = useCallback(() => {
    if (pausedRemainingRef.current < 1000) {
      finalize(true); // the deadline effectively arrived while paused
      return;
    }
    const st = playerRef.current?.getState() ?? { currentItemIndex: 0 };
    const abs = baseIndexRef.current + st.currentItemIndex;
    baseIndexRef.current = abs;
    setResumeFrom(abs);
    setResumeRemainingMs(pausedRemainingRef.current);
    segmentStartRef.current = Date.now();
    setPaused(false);
    void requestWakeLock();
    setSessionKey((k) => k + 1);
  }, [finalize, requestWakeLock]);

  const handleStop = useCallback(() => {
    playerRef.current?.stop();
    finalize(false);
  }, [finalize]);

  // ── Render ──────────────────────────────────────────────────────
  if (phase === "session") {
    const itemIndex = Math.min(Math.max(loopState.currentItemIndex, 0), sessionItems.length - 1);
    const current = sessionItems[itemIndex];
    const remainingMs = paused
      ? pausedRemainingRef.current
      : loopState.endsAt !== undefined
        ? Math.max(0, loopState.endsAt - now)
        : planMsRef.current;
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-burgundy-950 px-6 text-cream-100">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-cream-500">🌙 Sleep Audio</p>
        <div className="mt-10 text-center">
          <div className="text-6xl font-black leading-tight text-cream-50 sm:text-7xl">
            {current?.text ?? "…"}
          </div>
          {current?.language === "english" && (
            <p className="mt-4 text-xl font-semibold text-cream-300">English</p>
          )}
        </div>
        <p className="mt-8 text-sm text-cream-400">
          Item {baseIndexRef.current + itemIndex + 1} of {playlist.items.length} · repeat{" "}
          {Math.max(1, loopState.currentRepeat)} of {prefs.repeatEach}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-gold-300">
          {formatCountdown(remainingMs)} left
        </p>
        <div className="mt-10 flex gap-4">
          {paused ? (
            <button
              onClick={handleResume}
              className="rounded-xl bg-gold-400 px-8 py-4 text-lg font-black text-burgundy-950 shadow-lg transition hover:bg-gold-300"
            >
              ▶ Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="rounded-xl bg-gold-400 px-8 py-4 text-lg font-black text-burgundy-950 shadow-lg transition hover:bg-gold-300"
            >
              ⏸ Pause
            </button>
          )}
          <button
            onClick={handleStop}
            className="rounded-xl border-2 border-cream-700 px-8 py-4 text-lg font-black text-cream-200 transition hover:border-cream-500"
          >
            ■ Stop
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-cream-50 px-4 py-8 text-burgundy-900 sm:py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black">🌙 Sleep Audio</h1>
        <p className="mt-1 text-sm text-gray-600">
          A passive review playlist built from the words you've met — weak spots first — that stops by itself.
        </p>

        {summary && (
          <div className="mt-5 rounded-2xl border-2 border-gold-300 bg-gold-50 px-4 py-3 text-center text-sm font-bold text-burgundy-900">
            {summary.completed ? "✓ Completed" : "■ Stopped"} — {summary.durationMin} min · {summary.items} word
            {summary.items === 1 ? "" : "s"} · 🌙 {summary.totalSessions} sessions total
          </div>
        )}

        {ios && (
          <div className="mt-5 rounded-2xl border-2 border-gold-200 bg-gold-50 p-4 text-xs leading-relaxed text-gold-900">
            🌙 On iPhone/iPad, spoken audio pauses when the screen locks or you leave the app. Keep the app open and the
            screen awake — a 15-minute session is a good night's choice.
          </div>
        )}

        <div className="mt-6 space-y-5 rounded-2xl bg-white p-5 shadow">
          {/* Duration: presets + custom 5–120 (spec §2) */}
          <div>
            <p className="font-bold">Duration</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLEEP_AUDIO_PRESETS_MIN.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    updatePrefs({ durationMin: m });
                    setCustomMin(String(m));
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                    prefs.durationMin === m ? "bg-gold-400 text-burgundy-950" : "bg-gray-100 text-burgundy-800 hover:bg-gray-200"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  const v = clampDuration(prefs.durationMin - 5);
                  updatePrefs({ durationMin: v });
                  setCustomMin(String(v));
                }}
                className="rounded-lg border border-burgundy-200 px-3 py-1.5 font-bold text-burgundy-700 hover:bg-cream-100"
                aria-label="Decrease duration"
              >
                −
              </button>
              <input
                type="number"
                min={MIN}
                max={MAX}
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                onBlur={commitDraft}
                className="w-20 rounded-lg border border-burgundy-200 px-3 py-1.5 text-center font-bold text-burgundy-900"
                aria-label="Custom duration in minutes"
              />
              <button
                onClick={() => {
                  const v = clampDuration(prefs.durationMin + 5);
                  updatePrefs({ durationMin: v });
                  setCustomMin(String(v));
                }}
                className="rounded-lg border border-burgundy-200 px-3 py-1.5 font-bold text-burgundy-700 hover:bg-cream-100"
                aria-label="Increase duration"
              >
                +
              </button>
              <span className="text-xs text-gray-500">
                min ({MIN}–{MAX})
              </span>
            </div>
          </div>

          {/* Cadence: fixed in v1 (spec §2/§6) */}
          <div className="rounded-xl bg-cream-100 p-3 text-sm">
            <p className="font-bold">Cadence</p>
            <p className="mt-1 text-xs text-gray-600">
              Each word plays twice — Latin, then English — at a restful pace.
            </p>
          </div>

          {/* English gloss toggle (default ON, spec §6) */}
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={prefs.includeEnglish}
              onChange={(e) => updatePrefs({ includeEnglish: e.target.checked })}
            />
            Include English gloss
          </label>

          {/* Tonight's focus (spec §2) / empty universe (§2.1) */}
          {playlist.items.length > 0 ? (
            <p className="text-sm font-semibold text-burgundy-700">{focusLine}</p>
          ) : (
            <div className="rounded-xl border-2 border-burgundy-200 bg-cream-50 p-4 text-center text-sm font-semibold text-burgundy-800">
              Complete a lesson first — your sleep playlist is built from words you've actually met.
            </div>
          )}

          {/* TTS-unavailable error state (spec §7.4) — no silent race */}
          {!speechOk && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-800">
              Speech isn't available in this browser. Sleep audio needs your browser's built-in text-to-speech — try
              Safari, Chrome, or Edge.
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!speechOk || playlist.items.length === 0}
            className="w-full rounded-xl bg-burgundy-800 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-burgundy-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            🌙 Start Sleep Audio
          </button>
        </div>
      </div>
    </main>
  );
}
