/**
 * voicePicker.ts — Engine department: per-language/mode voice priority ladder
 * (voice-tts-improvement-plan.md P1 — closes audit gaps G2/G4/G5 side: no more
 * first-match `it` voice, no more hardcoded utterance.lang, dedupe by
 * name+lang, quality heuristic).
 *
 * Pure module (no window access) so the ladder is unit-testable with a mocked
 * voice list. The caller (engine/speech.ts) re-resolves on every speak.
 *
 * Ladders (audit §3 P1):
 * - Latin ecclesiastical: la-* quality → it-IT quality (Google/Natural/
 *   Premium/Neural) → any it → any la → en-GB → en-US
 *   (Italian-family voices read macron-stripped Latin as ecclesiastical).
 * - Latin classical: en-GB quality → en-US quality → any en
 *   (an English voice reads the v→w / c→k grapheme transcription).
 * - English: en-GB quality → en-US quality → any en.
 *
 * Quality heuristic: name matches /google|natural|premium|neural|enhanced/i
 * (task brief; the audit's P1 adds quality|high — quality/high names are
 * rare, Google/Natural cover the real voices). Within a rung, prefer
 * localService === false (remote voices are the high-quality ones).
 */

import type { LatinMode } from "~/engine/ipaConverter";

/** Minimal structural view of a SpeechSynthesisVoice (keeps the module pure). */
export interface SpeechVoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
}

/** Language we speak: latin (needs a mode) or english. */
export type SpeechLanguage = "latin" | "english";

export const SPEECH_QUALITY_RE = /google|natural|premium|neural|enhanced/i;

function langStarts(v: SpeechVoiceLike, prefix: string): boolean {
  return v.lang.toLowerCase().startsWith(prefix.toLowerCase());
}

function isQuality(v: SpeechVoiceLike): boolean {
  return SPEECH_QUALITY_RE.test(v.name);
}

/** Dedupe by name+lang (Chrome lists duplicate voices across changes). */
export function dedupeVoices<T extends SpeechVoiceLike>(voices: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of voices) {
    const key = `${v.name}|${v.lang}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/**
 * Best voice for (language, mode) per the priority ladder, or null when the
 * provided list is empty. Each rung: filter → prefer remote (localService
 * === false) → first match.
 */
export function pickSpeechVoice<T extends SpeechVoiceLike>(
  voices: T[],
  language: SpeechLanguage,
  mode: LatinMode = "ecclesiastical",
): T | null {
  const list = dedupeVoices(voices);
  if (list.length === 0) return null;

  const rungs: Array<(v: T) => boolean> =
    language === "latin" && mode === "classical"
      ? [
          (v) => langStarts(v, "en-GB") && isQuality(v),
          (v) => langStarts(v, "en-US") && isQuality(v),
          (v) => langStarts(v, "en-GB"),
          (v) => langStarts(v, "en-US"),
          (v) => langStarts(v, "en"),
        ]
      : language === "latin" // ecclesiastical
        ? [
            (v) => langStarts(v, "la") && isQuality(v),
            (v) => langStarts(v, "it-IT") && isQuality(v),
            (v) => langStarts(v, "it"),
            (v) => langStarts(v, "la"),
            (v) => langStarts(v, "en-GB"),
            (v) => langStarts(v, "en-US"),
            (v) => langStarts(v, "en"),
          ]
        : [ // english
            (v) => langStarts(v, "en-GB") && isQuality(v),
            (v) => langStarts(v, "en-US") && isQuality(v),
            (v) => langStarts(v, "en-GB"),
            (v) => langStarts(v, "en-US"),
            (v) => langStarts(v, "en"),
          ];

  for (const rung of rungs) {
    const candidates = list.filter(rung);
    if (candidates.length === 0) continue;
    const remote = candidates.filter((v) => v.localService === false);
    return (remote.length > 0 ? remote : candidates)[0];
  }
  return null;
}