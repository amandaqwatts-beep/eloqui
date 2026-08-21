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
import { latinToSpeechText, latinWordSpeechText, stripMacrons, toClassicalSpeechText } from "~/engine/speechText";

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

// ── latinWordSpeechText: the P0 UNIFIED respelling (display == audio, G3) ─
// Prefer the display respelling verbatim when provided, else fall back to the
// mode's macron-stripped / transcribed text.
eq(
  latinWordSpeechText("puella", "poo-EL-lah", "ecclesiastical"),
  "poo-EL-lah",
  "word: authored respelling spoken verbatim (eccl)",
);
eq(
  latinWordSpeechText("puella", "puh-EL-luh", "classical"),
  "puh-EL-luh",
  "word: authored respelling spoken verbatim (classical)",
);
eq(
  latinWordSpeechText("puella", undefined, "ecclesiastical"),
  "puella",
  "word: no respelling → macron-stripped fallback",
);
eq(
  latinWordSpeechText("caelum", undefined, "classical"),
  "kailum",
  "word: no respelling → classical transcription fallback",
);
eq(
  latinWordSpeechText("amāvērunt", "  ah-MAH-weh-roont  ", "classical"),
  "ah-MAH-weh-roont",
  "word: respelling whitespace trimmed; Latin fallback ignored when respelling present",
);
eq(
  latinWordSpeechText("amāvērunt", "", "ecclesiastical"),
  "amaverunt",
  "word: empty respelling string → Latin fallback",
);

// Verbatim contract (display == audio, byte-for-byte): whenever a respelling
// is present, latinWordSpeechText returns it UNCHANGED — even when it contains
// the bare y/v/c letters that latinToSpeechText would re-rewrite (y→i, v→w,
// c→k) in classical mode. That is WHY the caller speaks the output via
// `speakOnce` (verbatim) rather than through `speakLatin` (which re-transcribes).
// Fixtures are real getPronunciation outputs verified live (classical caelum →
// "KEYE-luhm", ecclesiastical via → "VEE-ah", amāvērunt classical →
// "uh-mah-WAY-ruhnt") so a future regression that routes respellings back
// through latinToSpeechText is caught here.
{
  const fixtures: Array<[string, string, "ecclesiastical" | "classical"]> = [
    ["puella", "poo-EHL-lah", "ecclesiastical"],
    ["via", "VEE-ah", "ecclesiastical"], // bare V — ecclesiastical keeps it
    ["amāvērunt", "uh-mah-WAY-ruhnt", "classical"], // bare Y — classical keeps it
    ["caelum", "KEYE-luhm", "classical"], // bare Y — classical keeps it
    ["terrae", "TEHR-reye", "classical"], // bare Y — classical keeps it
    ["hoc", "OHTCH", "ecclesiastical"], // no c/v/y — plain
    ["topographia", "taw-paw-GRUH-phih-uh", "classical"], // bare Y at end
  ];
  let bad = 0;
  for (const [latin, resp, mode] of fixtures) {
    const unified = latinWordSpeechText(latin, resp, mode);
    if (unified !== resp) {
      bad++;
      console.log(`(FAIL) verbatim expected "${resp}" got "${unified}" in ${mode}`);
    }
  }
  if (bad === 0) {
    pass++;
    console.log(`  unified respellings returned verbatim (display==audio) for ${fixtures.length} fixtures incl. bare y/v in both modes`);
  } else {
    fail++;
  }
  // Sanity: the reason we speak verbatim — latinToSpeechText WOULD mangle these.
  if (latinToSpeechText("VEE-ah", "classical") !== "VEE-ah") {
    pass++;
    console.log("  confirmed: latinToSpeechText is NOT identity on respellings → verbatim speakOnce is required");
  } else {
    fail++;
    console.log("(FAIL) expected latinToSpeechText to rewrite a respelling (proving why verbatim is needed)");
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);