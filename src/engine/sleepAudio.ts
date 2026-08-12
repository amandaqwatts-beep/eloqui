/**
 * sleepAudio.ts — Engine department: diagnostic-driven sleep playlist.
 *
 * Design: research/sleep-audio-design.md §3 (playlist construction). Pure —
 * zero JSX, zero rendering, zero storage access. The route passes in progress
 * (completed lesson ids + the in-flight lesson) and diagnostics; the builder
 * returns a deterministic per-(language, UTC day) playlist. Cadence
 * (repeat/pause/rate/pronMode) is deliberately NOT here — it belongs to
 * createAudioLoop, keeping order (diagnostics) cleanly separated from cadence
 * (prefs), per spec §3.5.
 */
import type { AudioLoopItem } from "~/engine/audioPlayer";
import { normalizeAnswer } from "~/engine/answers";
import { getConfusionPairs, getWorstAreas } from "~/engine/diagnostics";
import { hashString, mulberry32 } from "~/engine/seededRandom";
import type { DiagnosticEvent } from "~/engine/types";
import type { Lesson, VocabularyItem } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import {
  SLEEP_AUDIO_DEFAULT_INCLUDE_ENGLISH,
  SLEEP_AUDIO_MAX_WEIGHT,
  SLEEP_AUDIO_MISTAKE_BOOST,
  SLEEP_AUDIO_PAIR_LIMIT,
  SLEEP_AUDIO_WEAK_BOOST,
  SLEEP_AUDIO_WORST_LIMIT,
  WEAK_SPOT_MIN_ATTEMPTS,
} from "~/data/settings";

/** Exactly spec §3.5 — the screen maps `items` straight into createAudioLoop. */
export interface SleepPlaylist {
  /** `[{latin},{english}]` or `[{latin}]` per word, one copy each; repeat handled by the loop. */
  items: AudioLoopItem[];
  /** Unique encountered words. */
  baseCount: number;
  /** Entries after weight copies. */
  poolCount: number;
  /** Confusion pairs placed adjacent. */
  pairCount: number;
  source: "diagnostic" | "rotation";
  /** For "Tonight focuses on…" copy — the weakest word actually in the playlist. */
  weakestLabel?: string;
}

interface PoolEntry {
  item: VocabularyItem;
  weight: number;
  conceptId: string;
}

function wordItems(word: VocabularyItem, includeEnglish: boolean): AudioLoopItem[] {
  const latin: AudioLoopItem = { text: word.latin, language: "latin" };
  return includeEnglish ? [latin, { text: word.english, language: "english" }] : [latin];
}

/**
 * §3.4 adjacency: move pool entry `b` to sit immediately after the FIRST
 * entry of `a`, yielding a consecutive [A, B] block (direction matches the
 * pair's a→b; spec invariant). `|ia−ib| === 1` in the wrong direction
 * ([B, A]) is swapped to [A, B] so the invariant holds strictly. Returns
 * false only when either concept is absent from the pool (guard, §11 — cannot
 * happen when both are in the universe, but kept).
 */
function makeAdjacent(pool: PoolEntry[], a: string, b: string): boolean {
  const ia = pool.findIndex((e) => e.conceptId === a);
  if (ia === -1) return false;
  const ib = pool.findIndex((e) => e.conceptId === b);
  if (ib === -1) return false;
  if (ib === ia + 1) return true; // already [A, B]
  const [bEntry] = pool.splice(ib, 1);
  if (ib > ia) {
    // Removing after a doesn't shift a: insert right after a.
    pool.splice(ia + 1, 0, bEntry);
  } else {
    // Removing before a shifts a down by one: insert at the shifted position.
    pool.splice(ia, 0, bEntry);
  }
  return true;
}

export function buildSleepPlaylist(opts: {
  lessons: Lesson[];
  completedLessonIds: number[];
  currentLessonId?: number;
  events: DiagnosticEvent[];
  includeEnglish?: boolean; // default SLEEP_AUDIO_DEFAULT_INCLUDE_ENGLISH (true)
  language?: Language; // for the default seed
  seed?: string; // default `${language}|${YYYY-MM-DD UTC}`; tests override
}): SleepPlaylist {
  const includeEnglish = opts.includeEnglish ?? SLEEP_AUDIO_DEFAULT_INCLUDE_ENGLISH;
  const language = opts.language ?? "latin";
  const seed = opts.seed ?? `${language}|${new Date().toISOString().slice(0, 10)}`;

  // ── §3.1 Encountered universe ─────────────────────────────────
  // Lessons completed OR the current in-flight lesson (its words have been
  // met even though saveProgress hasn't fired). Dedupe by normalizeAnswer(latin)
  // — the lemma is the vocabulary identity (D3); first lesson's canonical form
  // wins, macrons intact (latinToIPA strips them for speech).
  const met = new Set(opts.completedLessonIds);
  if (opts.currentLessonId !== undefined) met.add(opts.currentLessonId);
  const seen = new Set<string>();
  const baseWords: VocabularyItem[] = [];
  for (const lesson of opts.lessons) {
    if (!met.has(lesson.id)) continue;
    for (const item of lesson.vocabulary ?? []) {
      const key = normalizeAnswer(item.latin);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      baseWords.push(item);
    }
  }
  const baseCount = baseWords.length;
  if (baseCount === 0) {
    return { items: [], baseCount: 0, poolCount: 0, pairCount: 0, source: "rotation" };
  }

  // ── §3.2 Weighting inputs ─────────────────────────────────────
  // getWorstAreas: accuracy asc, minAttempts 1 (more sensitive than the
  // dashboard's 3), vocab-only, top SLEEP_AUDIO_WORST_LIMIT.
  // getConfusionPairs: ranked total/rate desc, top SLEEP_AUDIO_PAIR_LIMIT.
  const weakAreas = getWorstAreas(opts.events, opts.lessons, {
    kinds: ["vocab"],
    minAttempts: WEAK_SPOT_MIN_ATTEMPTS,
    limit: SLEEP_AUDIO_WORST_LIMIT,
  });
  const pairs = getConfusionPairs(opts.events, opts.lessons, { limit: SLEEP_AUDIO_PAIR_LIMIT });

  // ── Rotation fallback (§3.4): no diagnostics ⇒ no weights, NO shuffle —
  // pure lesson-order rotation. Fully deterministic, trivially testable.
  // (Spec §11: lesson-level-only events ⇒ weakness 0 everywhere ⇒ same path.)
  if (weakAreas.length === 0 && pairs.length === 0) {
    const items = baseWords.flatMap((w) => wordItems(w, includeEnglish));
    return { items, baseCount, poolCount: baseCount, pairCount: 0, source: "rotation" };
  }

  const weakByConcept = new Map(weakAreas.map((w) => [w.conceptId, w]));

  // ── §3.2 Weighting math (exact) ───────────────────────────────
  // weakness = (100 − accuracy)/100; weight = min(5, 1 + 3·weakness + 1·mistake)
  // copies = max(1, round(weight)) — floor of 1 guarantees "hitting everything".
  const pool: PoolEntry[] = [];
  for (const w of baseWords) {
    const conceptId = `vocab:${normalizeAnswer(w.latin)}`;
    const weak = weakByConcept.get(conceptId);
    const weakness = weak ? (100 - weak.accuracy) / 100 : 0;
    const hasMistake = weak !== undefined && weak.mainMistake !== undefined;
    const weight = Math.min(
      SLEEP_AUDIO_MAX_WEIGHT,
      1 + SLEEP_AUDIO_WEAK_BOOST * weakness + (hasMistake ? SLEEP_AUDIO_MISTAKE_BOOST : 0),
    );
    const copies = Math.max(1, Math.round(weight));
    for (let i = 0; i < copies; i++) pool.push({ item: w, weight, conceptId });
  }

  // ── §3.3 Weak-first, deterministic per (language, day) ────────
  // 1. Sort by weight desc — stable sort ⇒ lesson order within equal weight.
  // 2. Seeded shuffle within each equal-weight band using ONE mulberry32
  //    stream (mulberry32(hashString(seed)) — do NOT reuse drill.ts's
  //    Math.random()-based shuffle, which would break determinism).
  pool.sort((a, b) => b.weight - a.weight);
  const rng = mulberry32(hashString(seed));
  let i = 0;
  while (i < pool.length) {
    let j = i;
    while (j < pool.length && pool[j].weight === pool[i].weight) j++;
    for (let k = j - 1; k > i; k--) {
      const r = i + Math.floor(rng() * (k - i + 1));
      const tmp = pool[k];
      pool[k] = pool[r];
      pool[r] = tmp;
    }
    i = j;
  }

  // ── §3.4 Adjacency post-pass (confusion pairs) ────────────────
  // For each pair in rank order, move B's first copy directly after A's first
  // copy (A-then-B). Then a validation sweep repairs pairs that a later move
  // may have split; a failed repair is left (best-effort, ~≤1% with the
  // default limits — documented, not a bug). All moves are a fixed function
  // of the seeded pool ⇒ deterministic given (seed, events, progress).
  for (const p of pairs) makeAdjacent(pool, p.a, p.b);
  for (const p of pairs) {
    const ia = pool.findIndex((e) => e.conceptId === p.a);
    if (ia === -1) continue;
    const ib = pool.findIndex((e) => e.conceptId === p.b);
    if (ib !== ia + 1) makeAdjacent(pool, p.a, p.b); // best-effort repair
  }
  const pairCount = pairs.filter((p) => {
    const ia = pool.findIndex((e) => e.conceptId === p.a);
    return ia !== -1 && pool[ia + 1]?.conceptId === p.b;
  }).length;

  // ── weakestLabel ──────────────────────────────────────────────
  // The weakest word that is actually in tonight's playlist (weakAreas is
  // accuracy-asc; a weak area from an uncompleted lesson is not in the pool).
  const poolConceptIds = new Set(pool.map((e) => e.conceptId));
  const weakest = weakAreas.find((w) => poolConceptIds.has(w.conceptId));

  const items = pool.flatMap((e) => wordItems(e.item, includeEnglish));
  return {
    items,
    baseCount,
    poolCount: pool.length,
    pairCount,
    source: "diagnostic",
    weakestLabel: weakest?.label,
  };
}
