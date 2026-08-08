/**
 * ipaConverter.ts — Engine department: Latin → IPA phonetic converter.
 *
 * Pure TypeScript, zero JSX, zero rendering. Converts Latin text to a broad
 * IPA transcription for either Ecclesiastical (Italianate/Church) or Classical
 * (Restored) pronunciation. Designed to feed a speech-synthesis pipeline:
 * the returned string is bare IPA (no surrounding slashes) so it can be
 * handed directly to a SpeechSynthesisUtterance with an Italian or English
 * voice.
 *
 * Algorithm:
 *   1. Normalize — lowercase, strip macrons (recording vowel length).
 *   2. Special cases — "Jesus"/"Iesus" and other irregulars.
 *   3. Character scan with lookahead — multi-character rules (ae, oe, au,
 *      gn, sc, ti+vowel, qu, ph, th, ch) are matched before single letters.
 *   4. Syllabify the phoneme stream (maximal-onset principle).
 *   5. Stress — primary ˈ on the first of 2 syllables, otherwise penult if
 *      heavy (long vowel / diphthong / closed syllable), else antepenult.
 */

export type LatinMode = "ecclesiastical" | "classical";

/** A single emitted phoneme (or phoneme cluster treated as one unit). */
interface Token {
  /** The IPA spelling of this phoneme, e.g. "tʃ", "aː", "au̯". */
  ipa: string;
  kind: "vowel" | "cons";
  /** True for macron vowels and diphthongs — affects syllable weight. */
  long: boolean;
}

interface Syllable {
  onset: Token[];
  vowel: Token;
  coda: Token[];
}

/** Macron → base letter (macron marks length, not quality). */
const MACRONS: Record<string, string> = {
  "ā": "a", "ē": "e", "ī": "i", "ō": "o", "ū": "u", "ȳ": "y",
};

/** Short-vowel IPA values (shared by both modes). */
const SHORT_VOWEL: Record<string, string> = {
  a: "a", e: "ɛ", i: "i", o: "ɔ", u: "u", y: "i", // y only in Greek borrowings
};

/** Long-vowel IPA values (macron → length mark). */
const LONG_VOWEL: Record<string, string> = {
  a: "aː", e: "eː", i: "iː", o: "oː", u: "uː", y: "iː",
};

/** Whole-word irregulars (matched after macron stripping, case-insensitive). */
const SPECIAL_WORDS: Record<string, string> = {
  jesus: "ˈjɛ.zus",
  iesus: "ˈjɛ.zus",
};

/** Muta cum liquida: stop + l/r forms a valid Latin onset. */
const STOP_LIQUID = new Set(["p", "b", "t", "d", "k", "g", "f"]);

function isVowelChar(ch: string | undefined): boolean {
  return ch !== undefined && "aeiouy".includes(ch);
}

/** Is the letter at i a palatal trigger (e/i, or start of ae/oe) for c/g/sc? */
function isPalatal(letters: string[], i: number): boolean {
  const ch = letters[i];
  if (ch === "e" || ch === "i") return true;
  if (ch === "a" && letters[i + 1] === "e") return true; // ae
  if (ch === "o" && letters[i + 1] === "e") return true; // oe
  return false;
}

function vowelTok(ipa: string, long: boolean): Token {
  return { ipa, kind: "vowel", long };
}
function consTok(ipa: string): Token {
  return { ipa, kind: "cons", long: false };
}

/** Step 1: lowercase and strip macrons, keeping a parallel length array. */
function normalize(raw: string): { letters: string[]; long: boolean[] } {
  const letters: string[] = [];
  const long: boolean[] = [];
  for (const ch0 of raw.toLowerCase()) {
    const base = MACRONS[ch0];
    if (base !== undefined) {
      letters.push(base);
      long.push(true);
    } else if (/[a-z]/.test(ch0)) {
      letters.push(ch0);
      long.push(false);
    }
    // Any other character (punctuation, spaces) is dropped.
  }
  return { letters, long };
}

/** Step 3: scan the letter stream with lookahead, emitting phoneme tokens. */
function tokenize(letters: string[], long: boolean[], mode: LatinMode): Token[] {
  const tokens: Token[] = [];
  const n = letters.length;
  let i = 0;
  while (i < n) {
    const ch = letters[i];
    const next = i + 1 < n ? letters[i + 1] : "";
    const prev = i > 0 ? letters[i - 1] : "";

    // --- Diphthongs (checked before single vowels) ---
    if (ch === "a" && next === "e") { tokens.push(vowelTok(mode === "classical" ? "aɪ̯" : "ɛ", true)); i += 2; continue; }
    if (ch === "o" && next === "e") { tokens.push(vowelTok(mode === "classical" ? "ɔɪ̯" : "ɛ", true)); i += 2; continue; }
    if (ch === "a" && next === "u") { tokens.push(vowelTok("au̯", true)); i += 2; continue; }

    // --- qu ---
    if (ch === "q" && next === "u") { tokens.push(consTok(mode === "classical" ? "kʷ" : "kw")); i += 2; continue; }

    // --- gn (before the single-g rule) ---
    if (ch === "g" && next === "n") { tokens.push(consTok(mode === "classical" ? "gn" : "ɲ")); i += 2; continue; }

    // --- sc before e/i/ae/oe → ʃ (ecclesiastical only) ---
    if (ch === "s" && next === "c") {
      if (mode === "ecclesiastical" && isPalatal(letters, i + 2)) {
        tokens.push(consTok("ʃ"));
        i += 2;
        continue;
      }
      // Otherwise fall through: s is emitted plain and c is handled next.
    }

    // --- Aspirates (classical) / silent-h clusters (ecclesiastical) ---
    if (ch === "c" && next === "h") { tokens.push(consTok(mode === "classical" ? "kʰ" : "k")); i += 2; continue; }
    if (ch === "p" && next === "h") { tokens.push(consTok(mode === "classical" ? "pʰ" : "p")); i += 2; continue; }
    if (ch === "t" && next === "h") { tokens.push(consTok(mode === "classical" ? "tʰ" : "t")); i += 2; continue; }

    // --- ti before a vowel (not after s/t/x) → ts (ecclesiastical) ---
    if (
      mode === "ecclesiastical" &&
      ch === "t" && next === "i" &&
      isVowelChar(letters[i + 2]) &&
      prev !== "s" && prev !== "t" && prev !== "x"
    ) {
      tokens.push(consTok("ts"));
      i += 1; // leave the i to be emitted as a vowel next iteration
      continue;
    }

    // --- c / g with palatal lookahead (ecclesiastical) ---
    if (ch === "c") {
      tokens.push(consTok(mode === "ecclesiastical" && isPalatal(letters, i + 1) ? "tʃ" : "k"));
      i += 1; continue;
    }
    if (ch === "g") {
      tokens.push(consTok(mode === "ecclesiastical" && isPalatal(letters, i + 1) ? "dʒ" : "g"));
      i += 1; continue;
    }

    // --- h: silent in ecclesiastical, /h/ in classical ---
    if (ch === "h") { if (mode === "classical") tokens.push(consTok("h")); i += 1; continue; }

    // --- v / j / x / r ---
    if (ch === "v") { tokens.push(consTok(mode === "classical" ? "w" : "v")); i += 1; continue; }
    if (ch === "j") { tokens.push(consTok("j")); i += 1; continue; }
    if (ch === "x") { tokens.push(consTok("k"), consTok("s")); i += 1; continue; }
    if (ch === "r") { tokens.push(consTok("r")); i += 1; continue; }

    // --- Vowels ---
    if (isVowelChar(ch)) {
      const isLong = long[i];
      tokens.push(vowelTok(isLong ? LONG_VOWEL[ch] : SHORT_VOWEL[ch], isLong));
      i += 1; continue;
    }

    // --- All other consonants map directly (b d f l m n p s t k z) ---
    tokens.push(consTok(ch));
    i += 1;
  }
  return tokens;
}

/** Is `list` (0–2 tokens) a legal syllable onset? */
function isValidOnset(list: Token[]): boolean {
  if (list.length === 0) return true;
  if (list.length === 1) return true;
  if (list.length === 2) {
    return validOnsetPair(list[0].ipa, list[1].ipa);
  }
  return false;
}

/**
 * Two-consonant onset validity: muta cum liquida only. Intervocalic s+stop
 * is NOT a valid onset (Latin closes the previous syllable: quaes-ti-o,
 * Chris-tus); s-clusters are handled by the word-initial rule instead.
 */
function validOnsetPair(a: string, b: string): boolean {
  return STOP_LIQUID.has(a) && (b === "l" || b === "r");
}

/** Step 4: split the token stream into syllables (maximal onset). */
function syllabify(tokens: Token[]): Syllable[] {
  // Runs of consonants between vowels: gaps[k] precedes vowels[k] (gap[0] is
  // word-initial, gap[vowels.length] is word-final).
  const vowels: Token[] = [];
  const gaps: Token[][] = [];
  let pending: Token[] = [];
  for (const t of tokens) {
    if (t.kind === "vowel") {
      vowels.push(t);
      gaps.push(pending);
      pending = [];
    } else {
      pending.push(t);
    }
  }
  gaps.push(pending);

  const sylls: Syllable[] = vowels.map((vowel) => ({ onset: [], vowel, coda: [] }));
  if (sylls.length === 0) return sylls;

  // Word-initial consonants are all onset of the first syllable.
  sylls[0].onset = gaps[0];

  // For each gap between two vowels, take the LONGEST valid onset suffix for
  // the following syllable; the prefix closes the previous syllable.
  for (let k = 1; k < vowels.length; k++) {
    const gap = gaps[k];
    let split = gap.length; // index where the onset begins
    for (let s = 0; s <= gap.length; s++) {
      if (isValidOnset(gap.slice(s))) {
        split = s;
        break;
      }
    }
    sylls[k - 1].coda = gap.slice(0, split);
    sylls[k].onset = gap.slice(split);
  }

  // Word-final consonants close the last syllable.
  sylls[sylls.length - 1].coda = gaps[gaps.length - 1];
  return sylls;
}

/** Step 5: pick the stressed syllable index (Latin stress rules). */
function stressIndex(sylls: Syllable[]): number {
  const count = sylls.length;
  if (count <= 2) return 0; // 2 syllables: always first
  const penult = sylls[count - 2];
  const penultHeavy = penult.vowel.long || penult.coda.length > 0;
  return penultHeavy ? count - 2 : count - 3;
}

function syllableToIpa(s: Syllable): string {
  return (
    s.onset.map((t) => t.ipa).join("") +
    s.vowel.ipa +
    s.coda.map((t) => t.ipa).join("")
  );
}

/** Convert a single word (no whitespace) to bare IPA. */
function convertWord(word: string, mode: LatinMode): string {
  const { letters, long } = normalize(word);
  if (letters.length === 0) return "";

  // Step 2: special cases (after normalization so macrons are ignored).
  const key = letters.join("");
  const special = SPECIAL_WORDS[key];
  if (special !== undefined) return special;

  const tokens = tokenize(letters, long, mode);
  const sylls = syllabify(tokens);
  if (sylls.length === 0) return tokens.map((t) => t.ipa).join("");
  const idx = stressIndex(sylls);
  return sylls
    .map((s, k) => (k === idx ? "ˈ" : "") + syllableToIpa(s))
    .join(".");
}

/**
 * Convert Latin text to bare IPA (no surrounding slashes) for the given
 * pronunciation mode. Multi-word input is converted word by word.
 *
 * @example
 *   latinToIPA("terra", "ecclesiastical") // → "ˈtɛr.ra"
 *   latinToIPA("caelum", "classical")     // → "ˈkaɪ̯.lum"
 */
export function latinToIPA(text: string, mode: LatinMode): string {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => convertWord(w, mode))
    .filter((w) => w.length > 0)
    .join(" ");
}
