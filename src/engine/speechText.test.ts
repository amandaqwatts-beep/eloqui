/**
 * speechText.test.ts — engine verification for the urgent voice fix
 * (2026-08-19): speakLatin no longer feeds bare IPA to the Italian voice; it
 * speaks `latinToSpeechText(text, mode)` (voice-tts-improvement-plan.md P0).
 *
 * Fixtures mirror the audit's P4 list (puella, caelum, via, gnarus, Iesus,
 * terrae, Quintus, amāvērunt, hoc) plus case variants, punctuation/prosody,
 * and the mode-blindness surface. Pure function — no window needed.
 *
 * Self-contained (no bun:test import) so `tsc --noEmit` stays at its
 * 7-error baseline. Run with:
 *   bun src/engine/speechText.test.ts
 */
import { latinToSpeechText, stripMacrons, toClassicalSpeechText } from "~/engine/speechText";

let pass = 0;
let fail = 0;
function eq(actual: string, expected: string, label: string): void {
  if (actual === expected) { pass++; console.log(`(pass) ${label} → "${actual}"`); }
  else { fail++; console.log(`(FAIL) ${label}\n   expected "${expected}"\n   actual   "${actual}"`); }
}

// ── stripMacrons ──────────────────────────────────────────────────
eq(stripMacrons("amāvērunt"), "amaverunt", "stripMacrons: amāvērunt → amaverunt");
eq(stripMacrons("Ā Ē Ī Ō Ū Ȳ"), "A E I O U Y", "stripMacrons: uppercase macrons");
eq(stripMacrons("terra, māter!"), "terra, mater!", "stripMacrons keeps punctuation");

// ── ecclesiastical: macron-stripped Latin, punctuation kept ────
eq(latinToSpeechText("puella", "ecclesiastical"), "puella", "eccl: puella unchanged (no macrons)");
eq(latinToSpeechText("amāvērunt", "ecclesiastical"), "amaverunt", "eccl: amāvērunt → amaverunt");
eq(latinToSpeechText("caelum", "ecclesiastical"), "caelum", "eccl: caelum unchanged (ae kept for the it/la voice)");
eq(latinToSpeechText("Terra, māter!", "ecclesiastical"), "Terra, mater!", "eccl: punctuation kept for prosody");

// ── classical: grapheme transcription (v→w, c→k, ae→ai, …) ──────
const classical = (w: string): string => latinToSpeechText(w, "classical");
eq(classical("puella"), "puella", "class: puella unchanged");
eq(classical("caelum"), "kailum", "class: caelum → kailum (c→k, ae→ai)");
eq(classical("Caelum"), "Kailum", "class: Caelum → Kailum (case kept)");
eq(classical("via"), "wia", "class: via → wia (v→w)");
eq(classical("gnarus"), "ng-narus", "class: gnarus → ng-narus (gn→ng-n)");
eq(classical("Gnarus"), "Ng-narus", "class: Gnarus → Ng-narus (case kept)");
eq(classical("Iesus"), "Iesus", "class: Iesus unchanged");
eq(classical("terrae"), "terrai", "class: terrae → terrai (ae→ai)");
eq(classical("Quintus"), "Kwintus", "class: Quintus → Kwintus (qu→kw)");
eq(classical("amāvērunt"), "amawerunt", "class: amāvērunt → amawerunt (macrons stripped, v→w)");
eq(classical("hoc"), "hok", "class: hoc → hok (c→k, h kept)");
eq(classical("cibus"), "kibus", "class: cibus → kibus (c→k always, classical)");
eq(classical("maximus"), "maximus", "class: x untouched (audit rule list has no x→ks; English voices read /ks/ anyway)");
eq(classical("servus"), "serwus", "class: servus → serwus (v→w)");
eq(classical("aequus"), "aikwus", "class: aequus → aikwus (ae→ai, qu→kw)");
eq(classical("Terra, māter!"), "Terra, mater!", "class: punctuation kept");

// ── consistency: nothing IPA-shaped can reach the synthesizer ────
{
  const ipaChars = ["ˈ", "ː", "ɛ", "ɔ", "ɪ", "ʷ", "ɲ", "ʃ", "tʃ", "dʒ", "ts"];
  let leaked = 0;
  for (const word of ["puella", "caelum", "via", "gnarus", "Iesus", "terrae", "Quintus", "amāvērunt", "hoc", "cibus", "servus"]) {
    for (const mode of ["ecclesiastical", "classical"] as const) {
      const out = latinToSpeechText(word, mode);
      if (ipaChars.some((c) => out.includes(c))) leaked++;
    }
  }
  if (leaked === 0) { pass++; console.log("  no IPA characters leak into speech text (22 mode-word combos)"); }
  else { fail++; console.log(`(FAIL) ${leaked} combos contain IPA characters`); }
}

// ── toClassicalSpeechText: exact-transcription sanity (importable) ─
eq(toClassicalSpeechText("CAELUM"), "KAILUM", "classical: CAELUM → KAILUM (all caps)");
eq(toClassicalSpeechText("Aeolus"), "Aiolus", "classical: Aeolus → Aiolus (mixed case)");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);