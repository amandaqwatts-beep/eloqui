/**
 * speech.ts — Engine department: the only TTS primitive.
 *
 * Urgent fix 2026-08-19 (owner: "a vocab speaker somewhere still uses Italian
 * rather than IPA." — voice-tts-improvement-plan.md G1 critical + G9):
 * speakLatin NO LONGER feeds bare IPA (`latinToIPA`) to the it-IT voice.
 * It speaks the mode-matched grapheme string from `latinToSpeechText` through
 * the mode's voice ladder (`voicePicker.ts`), with `utterance.lang` set to the
 * chosen voice's lang (no more hardcoded it-IT/en-US).
 *
 * Also lands the speech-recitation foundation (spec §3.1): `isTTSAvailable()`
 * and `speakOnce(text, {language, mode, rate, onEnd})` with the utterance's
 * onend + a 15s fallback timer. `speakLatin`/`speakEnglish`/`stopSpeech`
 * keep their exact signatures so every existing call site still compiles.
 */

import type { LatinMode } from "~/engine/ipaConverter";
import { latinToSpeechText } from "~/engine/speechText";
import { pickSpeechVoice, type SpeechLanguage } from "~/engine/voicePicker";
import { SPEECH_DEFAULT_RATE, SPEECH_CLASSICAL_RATE } from "~/data/settings";

let voices: SpeechSynthesisVoice[] | null = null;
let listening = false;
function available(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  if (voices === null) {
    voices = window.speechSynthesis.getVoices();
    if (!listening) {
      window.speechSynthesis.addEventListener("voiceschanged", () => { voices = window.speechSynthesis.getVoices(); });
      listening = true;
    }
  }
  return voices;
}

/** True when the Web Speech API is usable in this browser (recitation gate). */
export function isTTSAvailable(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

export interface SpeakOnceOptions {
  language?: SpeechLanguage;
  mode?: LatinMode;
  rate?: number;
  /** Fired on utterance end, error, or the 15s fallback timer (once). */
  onEnd?: () => void;
}

/** Fallback: some engines never fire onend; the timer still releases onEnd. */
const SPEAK_ONCE_FALLBACK_MS = 15_000;

/**
 * Speak `text` once via the (language, mode) voice ladder. `text` is the
 * FINAL spoken string — Latin callers pass latinToSpeechText output (or rely
 * on speakLatin, which builds it). onend/onerror and a 15 s fallback timer
 * all converge on a single onEnd invocation (recitation foundation).
 */
export function speakOnce(text: string, opts: SpeakOnceOptions = {}): void {
  if (!isTTSAvailable()) { opts.onEnd?.(); return; }
  const { language = "latin", mode = "ecclesiastical", rate, onEnd } = opts;
  const voice = pickSpeechVoice(available(), language, mode);
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
  else utterance.lang = language === "latin" ? (mode === "classical" ? "en-US" : "it-IT") : "en-US";
  utterance.rate = rate ?? (language === "latin" && mode === "classical" ? SPEECH_CLASSICAL_RATE : SPEECH_DEFAULT_RATE);
  let done = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    if (done) return;
    done = true;
    if (timer !== undefined) clearTimeout(timer);
    onEnd?.();
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  timer = setTimeout(finish, SPEAK_ONCE_FALLBACK_MS);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * Speak Latin via the mode's ladder. `mode` selects BOTH the spoken string
 * (ecclesiastical = macron-stripped Latin; classical = v→w/c→k grapheme
 * transcription) and the voice ladder (it/la family vs en family). Signature
 * unchanged (text, mode = "ecclesiastical", rate?) — all existing call sites
 * (VocabularyTable default, audioPlayer, ReadingPassage, SleepAudio) compile
 * untouched.
 */
export function speakLatin(text: string, mode: LatinMode = "ecclesiastical", rate?: number): void {
  speakOnce(latinToSpeechText(text, mode), { language: "latin", mode, rate });
}

/**
 * Speak several chunks back-to-back as ONE read-aloud (voice-tts P3/G6): each
 * chunk goes through `speakOnce` (so the voice ladder + mode text-transform +
 * rate all compose unchanged), chained on onEnd so they flow sequentially.
 * The caller's `onEnd` fires once after the LAST chunk.
 *
 * Cancellation is generation-guarded: `speakSequentially` and `stopSpeech`
 * both bump `SPEECH_GEN`, so a superseded chain (a second 🔊 click, or a
 * `stopSpeech()` mid-read) aborts at its next chunk boundary instead of
 * fast-forwarding through the remainder. (Browser cancel() fires the current
 * utterance's onerror, which would otherwise advance a plain onEnd chain.)
 */
let SPEECH_GEN = 0;
export function speakSequentially(texts: string[], opts: SpeakOnceOptions = {}): void {
  if (texts.length === 0) { opts.onEnd?.(); return; }
  const gen = ++SPEECH_GEN;
  const speakAll = (i: number) => {
    if (i >= texts.length) { opts.onEnd?.(); return; }
    if (gen !== SPEECH_GEN) return; // superseded (newer read-aloud or stopSpeech) — abort chain
    speakOnce(texts[i], { ...opts, onEnd: () => speakAll(i + 1) });
  };
  speakAll(0);
}

/** English: raw text via the English ladder. Signature unchanged. */
export function speakEnglish(text: string, rate?: number): void { speakOnce(text, { language: "english", rate }); }

export function stopSpeech(): void {
  SPEECH_GEN++; // abort any in-flight sequential read-aloud chain
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}