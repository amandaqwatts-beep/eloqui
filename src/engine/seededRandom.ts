/**
 * seededRandom.ts — Engine department: deterministic PRNG from a string seed.
 *
 * Shared by the daily worst-area lesson (seeded rotation over the top-N weak
 * areas, research/daily-worst-area-lesson-design.md §2 D2) and the
 * improvement-streak bonus drill deck (deterministic per-day deck
 * composition, research/improvement-streak-design.md §2). Future consumers
 * include sleepAudio.ts (same seeded-rotation pattern, sleep-audio-design.md
 * §3.3).
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage. Same
 * (seed, input) always yields the same result, so features are deterministic
 * per (language, UTC day) and byte-identical across re-renders.
 */
export function hashString(s: string): number {
  // FNV-1a 32-bit — fast, stable across platforms, good avalanche for short
  // seeds like "latin|2026-08-12".
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — deterministic uniform [0,1) generator from a 32-bit seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic Fisher–Yates shuffle. Same seed → same order; the input
 * array is never mutated.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const arr = [...items];
  const rng = mulberry32(hashString(seed));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
