/**
 * voicePicker.test.ts — engine verification for the voice priority ladder
 * (voice-tts-improvement-plan.md P1: closes G2 wrong-classical-voice, G4
 * first-match/no-quality/no-dedupe). Pure module tested with a mocked voice
 * list.
 *
 * Ladders under test:
 * - Latin ecclesiastical: la-* quality → it-IT quality → any it → any la →
 *   en-GB → en-US (→ any en).
 * - Latin classical: en-GB quality → en-US quality → en-GB → en-US → any en
 *   (an English voice reads the v→w/c→k transcription; Italian never picked).
 * - English: same English ladder.
 * Quality = name matches /google|natural|premium|neural|enhanced/i; prefer
 * localService === false within a rung; dedupe by name+lang.
 *
 * Self-contained (no bun:test import). Run with:
 *   bun src/engine/voicePicker.test.ts
 */
import { dedupeVoices, pickSpeechVoice, type SpeechVoiceLike } from "~/engine/voicePicker";

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string): void {
  if (cond) { pass++; console.log(`(pass) ${label}`); }
  else { fail++; console.log(`(FAIL) ${label}`); }
}
function nameOf(v: SpeechVoiceLike | null): string | null { return v ? v.name : null; }

const V = (name: string, lang: string, localService = true): SpeechVoiceLike => ({ name, lang, localService });

// ── ecclesiastical ladder ────────────────────────────────────────
{
  const voices = [
    V("la default", "la-RO", true),
    V("Google Italiano", "it-IT", false),
    V("Google US English", "en-US", false),
  ];
  ok(
    nameOf(pickSpeechVoice(voices, "latin", "ecclesiastical")) === "Google Italiano",
    "eccl: it-IT quality beats la-default and en-US",
  );
}
{
  const voices = [
    V("Natural Latin", "la-RO", false),
    V("Google Italiano", "it-IT", false),
    V("Google UK English Male", "en-GB", false),
  ];
  ok(
    nameOf(pickSpeechVoice(voices, "latin", "ecclesiastical")) === "Natural Latin",
    "eccl: la-* quality outranks it-IT quality",
  );
}
{
  const voices = [V("it plain", "it-CH", true), V("English (UK)", "en-GB", true)];
  ok(nameOf(pickSpeechVoice(voices, "latin", "ecclesiastical")) === "it plain", "eccl: any it (it-CH) beats en-GB");
}
{
  const voices = [V("English (UK)", "en-GB", true), V("English (US)", "en-US", true)];
  ok(nameOf(pickSpeechVoice(voices, "latin", "ecclesiastical")) === "English (UK)", "eccl: en-GB beats en-US at the bottom of the ladder");
}
{
  const voices = [V("Google Italiano", "it-IT", true), V("Google Italiano", "it-IT", true)];
  ok(
    nameOf(pickSpeechVoice(voices, "latin", "ecclesiastical")) === "Google Italiano" && dedupeVoices(voices).length === 1,
    "dedupe by name+lang (Chrome duplicate voices)",
  );
}
{
  const voices = [
    V("Natural Latin", "la-RO", true), // localService true — same rung as the remote below
    V("Google Latin", "la-IT", false),
  ];
  ok(
    nameOf(pickSpeechVoice(voices, "latin", "ecclesiastical")) === "Google Latin",
    "eccl: remote (localService=false) preferred within the same rung",
  );
}

// ── classical: English voice family only ─────────────────────────
{
  const voices = [
    V("Google Italiano", "it-IT", false),
    V("Google UK English Male", "en-GB", false),
    V("Google US English", "en-US", false),
  ];
  ok(
    nameOf(pickSpeechVoice(voices, "latin", "classical")) === "Google UK English Male",
    "classical: the Italian voice is never picked; en-GB quality wins",
  );
}
{
  const voices = [V("Google US English", "en-US", false)];
  ok(nameOf(pickSpeechVoice(voices, "latin", "classical")) === "Google US English", "classical: en-US quality when no en-GB");
}
{
  const voices = [V("English UK low", "en-GB", true), V("English US low", "en-US", true)];
  ok(nameOf(pickSpeechVoice(voices, "latin", "classical")) === "English UK low", "classical: non-quality en-GB beats non-quality en-US");
}
{
  const voices = [V("Edgen low", "en-US", true)];
  ok(nameOf(pickSpeechVoice(voices, "latin", "classical")) === "Edgen low", "classical: any en fallback still resolves");
}

// ── english ladder ───────────────────────────────────────────────
{
  const voices = [V("Google US English", "en-US", false), V("Google UK English Female", "en-GB", false)];
  ok(nameOf(pickSpeechVoice(voices, "english")) === "Google UK English Female", "english: en-GB quality outranks en-US quality");
}
{
  const voices = [V("Google US English", "en-US", false), V("Google Deutsch", "de-DE", false)];
  ok(nameOf(pickSpeechVoice(voices, "english")) === "Google US English", "english: non-English languages never considered");
}

// ── empty / edge ─────────────────────────────────────────────────
ok(pickSpeechVoice([], "latin", "ecclesiastical") === null, "empty voice list → null");
ok(pickSpeechVoice([], "latin", "classical") === null, "empty voice list (classical) → null");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);