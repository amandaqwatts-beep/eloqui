/**
 * speechChunks.ts — Engine department: chunk long prose into sequential TTS
 * utterances (voice-tts-improvement-plan.md P2/P3 — closes audit gap G6:
 * ReadingPassage spoke the WHOLE passage in ONE utterance, which browser TTS
 * can truncate for very long text; no sentence-boundary prosody).
 *
 * Pure, unit-testable (per plan §P4: assert chunk boundaries + rate threading).
 * The read-aloud surfaces break speech into sentence-bounded chunks (≤ a hard
 * per-utterance char cap), then `speakSequentially` (engine/speech.ts) queues
 * them end-to-end so they flow as ONE read-aloud — still through the shipped
 * `speakOnce` / voice ladder / mode text-transform.
 */

/**
 * Split prose into sentence-per-entry on `. ! ?`, trimming trailing spaces.
 * (Moved here from components/ReadingPassage.tsx — the display's existing
 * segmentation — so speech and the visual per-line view agree. Re-exported by
 * that component for backward compatibility with recitation.ts.)
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "." || ch === "!" || ch === "?") {
      let end = i + 1;
      while (end < text.length && text[end] === " ") end++;
      out.push(text.slice(start, end).trim());
      start = end;
      i = end - 1;
    }
  }
  if (start < text.length) out.push(text.slice(start).trim());
  return out.filter(Boolean);
}

/**
 * Break `text` into speech chunks bounded by sentence boundaries where
 * possible and a hard per-utterance char cap (default 200 — long single
 * utterances risk truncation on several engines). Over-long sentences are
 * sub-split word-wise so no single utterance exceeds the cap. Returns
 * trimmed, non-empty chunks that join to the full passage in order.
 */
export function chunkTextForSpeech(text: string, maxLength = 200): string[] {
  const sentences = splitSentences(text);
  const chunks: string[] = [];
  let current = "";
  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  // Word-wise sub-split for a sentence that alone exceeds the cap.
  const pushWordChunk = (words: string[]) => {
    let cur = "";
    for (const w of words) {
      if (cur && cur.length + w.length + 1 > maxLength) { chunks.push(cur); cur = w; }
      else cur = cur ? `${cur} ${w}` : w;
    }
    if (cur) chunks.push(cur);
  };
  for (const s of sentences) {
    if (s.length > maxLength) {
      flush();
      pushWordChunk(s.split(" "));
    } else {
      if (current && current.length + s.length + 1 > maxLength) flush();
      current = current ? `${current} ${s}` : s;
    }
  }
  flush();
  return chunks;
}
