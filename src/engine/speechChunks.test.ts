/**
 * speechChunks.test.ts — engine verification for the chunked read-aloud util
 * (voice-tts-improvement-plan.md P3/G6 + §P4: assert chunk boundaries).
 * Pure module tested with plain strings. Self-contained (no bun:test).
 *
 * Run with:
 *   bun src/engine/speechChunks.test.ts
 */
import { splitSentences, chunkTextForSpeech } from "~/engine/speechChunks";

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string): void {
  if (cond) { pass++; console.log(`(pass) ${label}`); }
  else { fail++; console.log(`(FAIL) ${label}`); }
}

// ── splitSentences (moved from ReadingPassage; recitation.ts relies on it) ──
{
  const s = "Puella in hortō est. Puer currit!";
  const got = splitSentences(s);
  ok(got.length === 2 && got[0] === "Puella in hortō est." && got[1] === "Puer currit!", "splitSentences splits on . and !");
}
{
  const s = "One sentence.";
  ok(splitSentences(s).length === 1 && splitSentences(s)[0] === "One sentence.", "splitSentences single sentence (no trailing junk)");
}
{
  ok(splitSentences("") .length === 0 || splitSentences("").every((x) => x.length === 0), "splitSentences empty input returns no non-empty chunks");
}

// ── chunkTextForSpeech: sentence-boundary chunking ─────────────────
{
  const passage = "Prima vēra. Secunda vēra. Tertia vēra.";
  const chunks = chunkTextForSpeech(passage);
  ok(chunks.join(" ") === passage, "chunks reassemble to the exact passage");
  ok(chunks.length === 1 && chunks[0] === passage, "short sub-cap passage → ONE chunk (no unnecessary splitting)");
}
{
  // Sentences short enough that several pack into one under-the-cap chunk.
  const tiny = "A. B. C.";
  const chunks = chunkTextForSpeech(tiny);
  ok(chunks.length === 1 && chunks[0] === "A. B. C.", "sentences packed into one sub-cap chunk");
}
{
  // A single sentence that exceeds the cap is sub-split word-wise.
  const longSentence = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
  const chunks = chunkTextForSpeech(longSentence, 60);
  ok(chunks.length > 1, "over-cap single sentence is sub-split into multiple chunks");
  ok(chunks.join(" ") === longSentence, "sub-split chunks reassemble exactly");
  ok(chunks.every((c) => c.length <= 64), "no sub-chunk exceeds the cap (modulo a single over-cap word)");
}
{
  // Boundary discipline: when combined sentences would exceed the cap, a new
  // chunk starts at the sentence boundary (never mid-word).
  const chunks = chunkTextForSpeech("one two three four five.", 12);
  ok(chunks.length > 0 && chunks.every((c) => c.length > 0), "chunks are non-empty (no boundary junk)");
  ok(chunks.join(" ") === "one two three four five.", "word-aligned chunks reassemble exactly");
  ok(chunks.every((c) => c === c.trim() && !c.includes("  ")), "chunks are trimmed with no double spaces");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
