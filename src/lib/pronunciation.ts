export type PronMode = "ecclesiastical" | "classical";

// ── Character classification ──────────────────────────────────

const VOWEL_SET = new Set("aeiouyāēīōūȳ".split(""));
const LONG_VOWEL_SET = new Set("āēīōūȳ".split(""));
const DIPHTHONG_PAIRS = ["ae", "oe", "au", "eu", "ui"];

function isVowel(c: string): boolean {
  return VOWEL_SET.has(c.toLowerCase());
}
/** Like isVowel but accounts for 'u' after 'q' not being a true vowel. */
function isSyllabicVowel(c: string, prevChar: string): boolean {
  const lower = c.toLowerCase();
  if (lower === "u" && prevChar.toLowerCase() === "q") return false;
  return VOWEL_SET.has(lower);
}
function isLongVowel(c: string): boolean {
  return LONG_VOWEL_SET.has(c.toLowerCase());
}
function isDiphthong(s: string): boolean {
  return DIPHTHONG_PAIRS.includes(s.toLowerCase());
}

// Valid Latin word-initial consonant clusters
const VALID_ONSETS = new Set(
  "b c d f g h l m n p q r s t v x z bl br cl cr dr fl fr gl gr pl pr sc scr sp spl st str tr th ph ch qu gu gn".split(" "),
);
function canBeginWord(cluster: string): boolean {
  return VALID_ONSETS.has(cluster.toLowerCase());
}

// ── Syllabify ─────────────────────────────────────────────────

function syllabify(word: string): string[] {
  const lower = word.toLowerCase();

  // Find all vowel/diphthong positions
  type VPos = { idx: number; len: number };
  const vowels: VPos[] = [];
  let i = 0;
  while (i < lower.length) {
    // Check diphthong — but skip if u is after q (consonantal u)
    if (
      i + 1 < lower.length &&
      isDiphthong(lower.substring(i, i + 2)) &&
      !(lower[i] === "u" && i > 0 && lower[i - 1] === "q")
    ) {
      vowels.push({ idx: i, len: 2 });
      i += 2;
    } else if (isSyllabicVowel(lower[i], i > 0 ? lower[i - 1] : "")) {
      vowels.push({ idx: i, len: 1 });
      i++;
    } else {
      i++;
    }
  }

  if (vowels.length === 0) return [word];

  const syllables: string[] = [];
  let start = 0;

  for (let v = 0; v < vowels.length; v++) {
    const vPos = vowels[v];
    const nextV = vowels[v + 1];
    let end: number;

    if (!nextV) {
      end = word.length;
    } else {
      const between = word.substring(vPos.idx + vPos.len, nextV.idx);
      if (between.length <= 1) {
        end = vPos.idx + vPos.len;
      } else {
        // As many consonants as possible go to the next syllable
        let onsetLen = between.length;
        while (onsetLen > 0 && !canBeginWord(between.substring(between.length - onsetLen))) {
          onsetLen--;
        }
        if (onsetLen === 0) onsetLen = 1;
        end = nextV.idx - onsetLen;
      }
    }

    syllables.push(word.substring(start, end));
    start = end;
  }

  return syllables;
}

// ── Stress ────────────────────────────────────────────────────

function isSyllableLong(
  syllable: string,
  nextSyllable: string | undefined,
): boolean {
  const s = syllable.toLowerCase();

  // Long by nature: contains long vowel or diphthong
  for (const c of s) {
    if (isLongVowel(c)) return true;
  }
  for (const d of DIPHTHONG_PAIRS) {
    if (s.includes(d)) return true;
  }

  // Long by position: vowel followed by 2+ consonants
  // Find last vowel position within this syllable
  let vEnd = -1;
  for (let i = 0; i < s.length; i++) {
    if (isVowel(s[i])) vEnd = i;
    if (
      i + 1 < s.length &&
      isDiphthong(s.substring(i, i + 2))
    ) {
      vEnd = i + 1;
    }
  }

  if (vEnd < 0) return false;

  const coda = s.substring(vEnd + 1);
  const codaLen = coda.length;

  if (codaLen >= 2) return true;

  if (
    codaLen >= 1 &&
    nextSyllable &&
    nextSyllable.length > 0 &&
    !isVowel(nextSyllable[0]) &&
    !(
      nextSyllable.length >= 2 &&
      isDiphthong(nextSyllable.substring(0, 2))
    )
  ) {
    // Mute + liquid exception: treat as short
    const muteChars = "bpcgdtf";
    const liquidChars = "lr";
    const lastCoda = coda[coda.length - 1].toLowerCase();
    const firstOnset = nextSyllable[0].toLowerCase();
    if (muteChars.includes(lastCoda) && liquidChars.includes(firstOnset)) {
      return false;
    }
    return true;
  }

  return false;
}

function findStressIndex(syllables: string[]): number {
  if (syllables.length <= 2) return 0; // stress first of 1 or 2 syllables
  const penult = syllables.length - 2;
  if (isSyllableLong(syllables[penult], syllables[penult + 1])) {
    return penult;
  }
  return Math.max(0, syllables.length - 3); // antepenultimate
}

// ── Vowel sounds ──────────────────────────────────────────────

function vowelSound(char: string, mode: PronMode): string {
  const c = char.toLowerCase();
  const long = isLongVowel(char);

  if (mode === "classical") {
    if (long) {
      switch (c) {
        case "ā": return "ah";
        case "ē": return "ay";
        case "ī": return "ee";
        case "ō": return "oh";
        case "ū": return "oo";
        case "ȳ": return "oo";
        default:  return "ah";
      }
    } else {
      switch (c) {
        case "a": return "uh";
        case "e": return "eh";
        case "i": return "ih";
        case "o": return "aw";
        case "u": return "uh";
        case "y": return "uh";
        default:  return "uh";
      }
    }
  }

  // Ecclesiastical (Italianate)
  if (long) {
    switch (c) {
      case "ā": return "ah";
      case "ē": return "ay";
      case "ī": return "ee";
      case "ō": return "oh";
      case "ū": return "oo";
      case "ȳ": return "ee";
      default:  return "ah";
    }
  } else {
    switch (c) {
      case "a": return "ah";
      case "e": return "eh";
      case "i": return "ee";
      case "o": return "oh";
      case "u": return "oo";
      case "y": return "ee";
      default:  return "ah";
    }
  }
}

function diphthongSound(diph: string, mode: PronMode): string {
  const d = diph.toLowerCase();
  if (mode === "classical") {
    if (d === "ae") return "eye";
    if (d === "oe") return "oy";
    if (d === "au") return "ow";
    if (d === "eu") return "eh-oo";
    if (d === "ui") return "oo-ee";
    return d;
  }
  // Ecclesiastical
  if (d === "ae") return "ay";
  if (d === "oe") return "ay";
  if (d === "au") return "ow";
  if (d === "eu") return "eh-oo";
  if (d === "ui") return "oo-ee";
  return d;
}

// ── Consonant transliteration ─────────────────────────────────

function consonantSound(
  ch: string,
  mode: PronMode,
  nextChar: string,
  prevChar: string,
): string {
  const c = ch.toLowerCase();

  // 'qu' digraph: 'q' is always "k", 'u' after 'q' is "w"
  if (c === "q") return "k";
  if (c === "u" && prevChar.toLowerCase() === "q") return "w";

  if (mode === "ecclesiastical") {
    if (c === "v") return "v";
    if (c === "h") return ""; // silent
    if (c === "c") {
      // soft before e/i/ae/oe
      if ("eiy".includes(nextChar) || nextChar === "æ" || nextChar === "œ") {
        return "ch";
      }
      return "k";
    }
    if (c === "g") {
      if ("eiy".includes(nextChar) || nextChar === "æ" || nextChar === "œ") {
        return "j";
      }
      return "g";
    }
    // Special sequences handled at word level (gn, ti+vowel)
    return c;
  }

  // Classical
  if (c === "v") return "w";
  if (c === "c") return "k";
  if (c === "g") return "g";
  if (c === "h") return "h";

  return c;
}

// ── Main transliteration ──────────────────────────────────────

function transliterateSyllable(
  syl: string,
  mode: PronMode,
  isLastSyl: boolean,
  nextSylFirstVowel: string,
): string {
  const lower = syl.toLowerCase();
  let result = "";

  // Check for diphthong nucleus — skip u after q
  let nucleusText = "";
  let nucleusIdx = -1;
  for (const d of DIPHTHONG_PAIRS) {
    const idx = lower.indexOf(d);
    if (idx !== -1 && !(lower[idx] === "u" && idx > 0 && lower[idx - 1] === "q")) {
      nucleusIdx = idx;
      nucleusText = d;
      break;
    }
  }

  if (nucleusIdx === -1) {
    // Single vowel nucleus — find it (skip u after q)
    for (let i = 0; i < lower.length; i++) {
      if (isSyllabicVowel(lower[i], i > 0 ? lower[i - 1] : "")) {
        nucleusIdx = i;
        nucleusText = lower[i];
        break;
      }
    }
  }

  if (nucleusIdx === -1) return lower; // no vowel, just return as-is

  const onset = lower.substring(0, nucleusIdx);
  const coda = lower.substring(nucleusIdx + nucleusText.length);

  // Onset transliteration
  for (let i = 0; i < onset.length; i++) {
    const ch = onset[i];
    const next = i + 1 < onset.length ? onset[i + 1] : nucleusText[0];
    const prev = i > 0 ? onset[i - 1] : "";
    result += consonantSound(ch, mode, next, prev);
  }

  // Nucleus
  if (nucleusText.length === 2) {
    result += diphthongSound(nucleusText, mode);
  } else {
    result += vowelSound(syl[nucleusIdx], mode);
  }

  // Coda transliteration
  for (let i = 0; i < coda.length; i++) {
    const ch = coda[i];
    const next = i + 1 < coda.length ? coda[i + 1] : nextSylFirstVowel;
    const prev = i > 0 ? coda[i - 1] : nucleusText[nucleusText.length - 1];

    // Handle final -m nasalization
    if (isLastSyl && i === coda.length - 1 && ch === "m") {
      result += "m";
      continue;
    }

    result += consonantSound(ch, mode, next, prev);
  }

  return result;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Generate a phonetic respelling for a Latin word.
 *
 * @param word  The Latin word, optionally with macrons (ā, ē, ī, ō, ū, ȳ).
 * @param mode  "ecclesiastical" (Italianate) or "classical" (restored).
 * @returns     Hyphenated phonetic respelling with the stressed syllable capitalized.
 *
 * @example
 *   getPronunciation("puella", "ecclesiastical")  // "poo-EL-lah"
 *   getPronunciation("puella", "classical")       // "puh-EL-luh"
 *   getPronunciation("amāmus", "ecclesiastical")  // "ah-MAH-moos"
 *   getPronunciation("via", "classical")          // "WIH-uh"
 */
export function getPronunciation(
  word: string,
  mode: PronMode = "ecclesiastical",
): string {
  if (!word) return "";

  const syllables = syllabify(word);
  if (syllables.length === 0) return word;

  const stressIdx = findStressIndex(syllables);

  // Process whole word for cross-syllable rules (gn, ti+vowel, double cons)
  // Pre-process: identify special sequences
  const lower = word.toLowerCase();

  // "gn" → depends on mode
  // "ti" + vowel → "tsee" (eccl.) or "tee" (classical), unless after s/t/x

  // We'll do a two-pass approach:
  // 1. Transliterate each syllable individually
  // 2. Handle cross-syllable special cases

  // Build phonetic syllables
  const phonetic: string[] = [];
  for (let i = 0; i < syllables.length; i++) {
    const nextSylFirstVowel = i + 1 < syllables.length
      ? syllables[i + 1].match(/[aeiouyāēīōūȳ]/i)?.[0] ?? ""
      : "";

    let ph = transliterateSyllable(
      syllables[i],
      mode,
      i === syllables.length - 1,
      nextSylFirstVowel,
    );

    phonetic.push(ph);
  }

  // ── Cross-syllable corrections ──────────────────────────────

  // "gn" → "ny" (eccl.) or "ng-n" (classical)
  for (let i = 0; i < phonetic.length - 1; i++) {
    const current = phonetic[i];
    const next = phonetic[i + 1];

    // Check if current syllable ends with "g" and next starts with "n"
    if (current.endsWith("g") && next.startsWith("n")) {
      if (mode === "ecclesiastical") {
        phonetic[i] = current.slice(0, -1) + "ny";
        // Remove the 'n' from next syllable's onset
        phonetic[i + 1] = next.substring(1);
        // If next syllable is now empty, give it "ee" placeholder... 
        // Actually, this shouldn't happen since gn always has a vowel after
        if (!phonetic[i + 1]) phonetic[i + 1] = "";
      } else {
        phonetic[i] = current.slice(0, -1) + "ng";
        // Next syllable keeps 'n': "ng-n..."
        // That's already correct: e.g. "mag" + "nus" → "mang" + "nus" 
        // → "MAHNG-noos" — hmm, that's not quite right
        // In classical, gn = "ng-n", so "magnus" = "MANG-noos"
        // Currently: current ends with "g", next starts with "n"
        // We want: current = "...ng", next keeps its "n"
        // So: phonetic[i] = current + "n"? No...
        // "mag" → "mang", and "nus" stays "nus"
        // Let me handle: current ends in "g", next starts with "n"
        // Change current's ending from "g" to "ng"
        // Keep next as is (it already starts with "n")
        phonetic[i] = current.slice(0, -1) + "ng";
        // Next syllable already has "n" at the start, so "ng-n" is achieved
      }
    }
  }

  // "ti" + vowel → "tsee" (eccl.) or keep "tee" (classical)
  // Only if not preceded by s, t, or x
  for (let i = 0; i < phonetic.length - 1; i++) {
    const current = phonetic[i];
    const next = phonetic[i + 1];

    // Check if current ends with "t" and next starts with "ee" or "ih" or similar vowel
    if (
      current.endsWith("t") &&
      next.length > 0 &&
      isVowel(next[0]) &&
      // Check original syllables to ensure it's "ti" sequence, not just any "t"+vowel
      syllables[i].toLowerCase().endsWith("ti") &&
      syllables[i + 1].length > 0 &&
      isVowel(syllables[i + 1][0])
    ) {
      // Check not preceded by s/t/x in original
      const tiPos = syllables[i].toLowerCase().lastIndexOf("ti");
      const before = tiPos > 0 ? syllables[i][tiPos - 1].toLowerCase() : "";
      if (!"stx".includes(before) && i > 0) {
        // Check if previous syllable ended in s/t/x
        const prevLastChar = syllables[i - 1]
          .toLowerCase()
          .replace(/[^a-z]/g, "")
          .slice(-1);
        if ("stx".includes(prevLastChar)) continue;
      }
      if ("stx".includes(before)) continue;

      if (mode === "ecclesiastical") {
        // Replace "t"+"ee/ih" with "tsee"
        phonetic[i] = current.slice(0, -1) + "tsee";
        // Remove first vowel sound from next syllable
        // Next syllable starts with vowel sound — we need to find where the vowel ends
        // Simple approach: if next is like "ee", remove it entirely; 
        // if next is like "ee-n...", remove the "ee"
        // Actually the next syllable in phonetic form is like the diphthong or vowel sound
        // Let's handle this more carefully
        const nextVowelMatch = next.match(/^[a-z]+/);
        if (nextVowelMatch) {
          const vowelPart = nextVowelMatch[0];
          phonetic[i + 1] = next.substring(vowelPart.length);
        }
      }
      // Classical: keep as "tee" (already the default)
    }
  }

  // ── Capitalize stressed syllable ────────────────────────────
  if (stressIdx >= 0 && stressIdx < phonetic.length) {
    phonetic[stressIdx] = phonetic[stressIdx].toUpperCase();
  }

  // ── Clean up empty syllables ────────────────────────────────
  const filtered = phonetic.filter((s) => s.length > 0);

  return filtered.join("-");
}

// getStoredMode / setStoredMode moved to src/engine/storage.ts (Engine dept).
// Re-exported here so existing importers (routes/lessons/latin.tsx,
// components/PronunciationToggle.tsx) keep working unchanged.
export { getStoredMode, setStoredMode } from "~/engine/storage";
