import { speakLatin, speakEnglish, stopSpeech } from "~/engine/speech";
import type { LatinMode } from "~/engine/ipaConverter";

export interface AudioLoopItem { text: string; language: "latin" | "english" }

/**
 * Cleanup contract: the loop does NOT self-clean. Consumers MUST call
 * `stop()` on unmount (see AudioPlayerScreen's effect pattern) — navigation
 * away ⇒ unmount ⇒ stop() ⇒ audio stops and timers clear. `stop()` is
 * idempotent, and `start()` calls `stop()` first, so StrictMode double-mount
 * is safe (existing behavior, sleep-audio-design.md §11).
 */
export interface AudioLoopConfig {
  items: (string | AudioLoopItem)[];
  includeEnglish?: boolean;
  repeatEach?: number;
  pauseBetweenMs?: number;
  loopForever?: boolean;
  lang?: string;
  rate?: number;
  /** NEW (sleep audio §4): deadline measured from `start()`; 0/absent = no auto-stop. */
  autoStopAfterMs?: number;
  /** NEW: fires once when the DEADLINE stops the loop — never on manual `stop()`. */
  onComplete?: () => void;
  /** NEW: threaded to `speakLatin` (default "ecclesiastical"); fixes the Listen gap too. */
  pronMode?: LatinMode;
}

export interface AudioLoopState {
  playing: boolean;
  currentItemIndex: number;
  currentRepeat: number;
  language?: "latin" | "english";
  /** NEW: wall-clock deadline set in `start()` when `autoStopAfterMs` present. */
  endsAt?: number;
  /** NEW: computed on read — `max(0, endsAt − now)`; undefined when no timer. */
  remainingMs?: number;
}

export function createAudioLoop(config: AudioLoopConfig) {
  const repeat = Math.max(1, config.repeatEach ?? 3), pause = Math.max(0, config.pauseBetweenMs ?? 800);
  const items = config.items.map(i => typeof i === "string" ? ({ text: i, language: "latin" as const }) : i);
  let state: AudioLoopState = { playing: false, currentItemIndex: 0, currentRepeat: 0 };
  let timer: number | undefined;
  const listeners = new Set<(s: AudioLoopState) => void>();
  // remainingMs is derived on every read (spec §4) so the countdown is live
  // without a new emit cadence — the screen re-reads getState() on its own.
  const withRemaining = (s: AudioLoopState): AudioLoopState => (
    s.endsAt === undefined
      ? { ...s, remainingMs: undefined }
      : { ...s, remainingMs: Math.max(0, s.endsAt - Date.now()) }
  );
  const emit = () => listeners.forEach(cb => cb(withRemaining(state)));
  const stop = () => {
    stopSpeech();
    if (timer) window.clearTimeout(timer);
    timer = undefined;
    // endsAt cleared (spec §4): a stopped loop reports no remaining time.
    state = { ...state, playing: false, currentRepeat: 0, language: undefined, endsAt: undefined };
    emit();
  };
  const speak = () => {
    if (!state.playing || !items.length) return;
    const item = items[state.currentItemIndex];
    state.currentRepeat++;
    state.language = item.language;
    emit();
    if (item.language === "english") speakEnglish(item.text, config.rate);
    else speakLatin(item.text, config.pronMode ?? "ecclesiastical", config.rate);
    const done = () => {
      if (!state.playing) return;
      // Boundary stop, not fade (§4): poll only calls done() once the current
      // utterance has finished (speechSynthesis.speaking === false), so a word
      // is never cut mid-utterance — overshoot ≤ one utterance (~2–4 s).
      // No fadeOutMs in v1: cancel() is inherently abrupt and per-utterance
      // volume ramping via onboundary is flaky across WebKit/Blink (documented
      // as future polish). The deadline stop is the "auto-stop" the owner asked for.
      if (state.endsAt !== undefined && Date.now() >= state.endsAt) {
        state.playing = false;
        state.currentRepeat = 0;
        emit();
        config.onComplete?.();
        return;
      }
      if (state.currentRepeat < repeat) { timer = window.setTimeout(speak, pause); return; }
      if (state.currentItemIndex + 1 < items.length) {
        state.currentItemIndex++;
        state.currentRepeat = 0;
        timer = window.setTimeout(speak, pause);
      } else if (config.loopForever) {
        state.currentItemIndex = 0;
        state.currentRepeat = 0;
        timer = window.setTimeout(speak, pause);
      } else {
        state.playing = false;
        state.currentRepeat = 0;
        emit();
      }
    };
    const poll = () => {
      if (!state.playing) return;
      if (!window.speechSynthesis.speaking) done();
      else timer = window.setTimeout(poll, 80);
    };
    timer = window.setTimeout(poll, 100);
  };
  return {
    start: () => {
      if (typeof window === "undefined" || !items.length) return;
      stop();
      state = {
        playing: true,
        currentItemIndex: 0,
        currentRepeat: 0,
        endsAt: config.autoStopAfterMs ? Date.now() + config.autoStopAfterMs : undefined,
      };
      emit();
      speak();
    },
    stop,
    getState: () => withRemaining(state),
    onStateChange: (cb: (s: AudioLoopState) => void) => { listeners.add(cb); return () => listeners.delete(cb); },
  };
}
