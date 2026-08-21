/**
 * speechText.ts — Engine department: the actual STRING spoken by TTS per
 * pronunciation mode (voice-tts-improvement-plan.md P0 — closes audit gaps
 * G1/G2/G3: stop feeding bare IPA to the synthesizer; browser voices don't
 * parse IPA, so Latin 🔊 garbled into Italian-sounding speech).
 *
 * Pure function, unit-testable. `latinToIPA` (ipaConverter.ts) is KEPT for
 * display / QA / reading-aid only — it is never fed to speech anymore.
 *
 * Strategy per mode (audit P0):
 * - ecclesiastical: macron-stripped Latin text. Italian phonology on an it/la
 *   voice yields correct ecclesiastical Latin (vowel set, c/g palatal, qu=kw,
 *   h silent, gn=ɲ, ti+vowel=ts) — more accurate than IPA-through-Italian.
 *   Punctuation is KEPT so the voice has sentence-prosody cues.
 * - classical: a mode-adjusted GRAPHEME transcription read by an English
 *   voice (v→w, c→k, g hard (kept), h kept, ae→ai, oe→oi, au→au, y→i, qu→kw,
 *   gn→ng-n). English phonology then approximates reconstructed classical
 *   pronunciation (k before all vowels, /w/ for consonantal v, diphthongs).
 */

import type { LatinMode } from "~/engine/ipaConverter";

/** Long-vowel → plain letter (macrons only; everything else untouched). */
const MACRON_MAP: Record<string, string> = {
  ā: "a", ē: "e", ī: "i", ō: "o", ū: "u", ȳ: "y",
  Ā: "A", Ē: "E", Ī: "I", Ō: "O", Ū: "U", Ȳ: "Y",
};

/** Pure: strip macrons from Latin text; punctuation kept (prosody). */
export function stripMacrons(text: string): string {
  let out = "";
  for (const ch of text) out += MACRON_MAP[ch] ?? ch;
  return out;
}

/** Case-aware helper: first char's case sets the case of the emitted pair. */
function cased2(source: string, lower: string, upper: string): string {
  if (source === source.toUpperCase()) return upper;
  if (source[0] === source[0].toUpperCase() && source[1] === source[1].toLowerCase()) {
    return upper[0] + lower.slice(1);
  }
  return lower;
}

/**
 * Classical-mode grapheme transcription (audit P0 classical rules):
 * v→w, c→k, g→g (kept), h kept, ae→ai, oe→oi, au→au, y→i, qu→kw, gn→ng-n.
 * Digraphs are consumed BEFORE the single-letter rewrites so qu/gn never
 * become "kuw"/"kn" and ch degrades to "kh" (aspirate) rather than "k" + … .
 * Case is preserved per pair/letter.
 */
export function toClassicalSpeechText(text: string): string {
  const chars = [...text];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1] ?? "";
    const pair = ch + next;
    const lower = pair.toLowerCase();
    let hit: string | null = null;
    if (lower === "ae") hit = cased2(pair, "ai", "AI");
    else if (lower === "oe") hit = cased2(pair, "oi", "OI");
    else if (lower === "qu") hit = cased2(pair, "kw", "KW");
    else if (lower === "gn") hit = cased2(pair, "ng-n", "NG-N");
    if (hit !== null) { out += hit; i++; continue; }
    if (ch === "v" || ch === "V") { out += ch === "v" ? "w" : "W"; continue; }
    if (ch === "y" || ch === "Y") { out += ch === "y" ? "i" : "I"; continue; }
    if (ch === "c" || ch === "C") { out += ch === "c" ? "k" : "K"; continue; }
    out += ch; // g, h, au (already letters), punctuation, digits — untouched
  }
  return out;
}

/**
 * The string handed to the synthesizer for a given Latin text + mode.
 * Both modes are plain graphemes/punctuation — no IPA, ever.
 */
export function latinToSpeechText(text: string, mode: LatinMode): string {
  const stripped = stripMacrons(text);
  return mode === "classical" ? toClassicalSpeechText(stripped) : stripped;
}

/**
 * The spoken string for ONE vocabulary word, UNIFIED with the display
 * respelling (voice-tts-improvement-plan.md P0 best-of-both — closes audit
 * gap G3: the student reads "poo-EL-lah" in the Pronunciation column and the
 * 🔊 speaks EXACTLY that, not a differently-shaped macron-stripped string).
 *
 * When a respelling (`respelling` — the authored `item.pronunciation`, or a
 * `getPronunciation`-derived one, i.e. whatever the display column shows) is
 * provided it is returned VERBATIM; otherwise it falls back to the mode's
 * macron-stripped / grapheme-transcribed `latinToSpeechText` form.
 *
 * IMPORTANT — respellings are handed to `speakOnce` WITHOUT running
 * `latinToSpeechText` on them. Real respellings already encode the target
 * phonology (e.g. classical `caelum` → "KEYE-luhm", ecclesiastical `via` →
 * "VEE-ah") and contain bare `y`/`v` letters that `latinToSpeechText` would
 * re-rewrite (y→i, v→w, c→k), so re-transcribing them would mangle the very
 * string the student sees. The caller speaks `latinWordSpeechText` output
 * verbatim via `speakOnce`; QA can assert the exact utterance text via this
 * pure function.
 */
export function latinWordSpeechText(
  latin: string,
  respelling: string | undefined,
  mode: LatinMode,
): string {
  if (respelling && respelling.trim().length > 0) return respelling.trim();
  return latinToSpeechText(latin, mode);
}