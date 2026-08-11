/**
 * diagnostics.ts — Engine department: diagnostics queries + recording.
 *
 * Owner direction 2026-08-11: rolling 2-week per-word/per-concept performance
 * tracking, the student's main mistake, and confusion pairs. Data foundation
 * for error analysis, diagnostic sleep audio, the daily worst-area lesson and
 * the improvement-based streak.
 *
 * Design: research/diagnostics-engine-design.md. Raw event log (D1), one event
 * per attempt with primary conceptId + tags[] (D2), conceptId conventions
 * vocab:/concept:/lesson:/char:/drill: (D3), closed MistakeType taxonomy (D4),
 * additive to the legacy verbum-accuracy counters (D5, recordAccuracy
 * untouched), ExerciseResultDetail contract for screens (D6), confusion pairs
 * ship in phase 1 (D7).
 *
 * Pure TypeScript — zero JSX, zero rendering. All queries default to the
 * 14-day window (DIAGNOSTICS_WINDOW_DAYS); the window is derived at query
 * time and pruning happens at write time (pruneEvents lives in storage.ts and
 * is re-exported here per the spec's public surface).
 */
import type { Exercise, Lesson, VocabularyItem } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import {
  normalizeAnswer,
  checkFillInBlank,
  checkMultipleChoice,
} from "~/engine/answers";
import { recordAccuracy, recordAttempt } from "~/engine/storage";
import {
  CONFUSION_RATE_THRESHOLD,
  DIAGNOSTICS_WINDOW_DAYS,
  MIN_CONFUSION_EVIDENCE,
  MIN_MISTAKE_EVIDENCE,
  MIN_TOTAL_ATTEMPTS_FOR_RATE,
  WEAK_SPOT_MIN_ATTEMPTS,
  WEAK_SPOT_THRESHOLD,
  WORST_AREA_MIN_ATTEMPTS,
} from "~/data/settings";
import type {
  ConceptKind,
  ConceptStats,
  ConfusionPair,
  DiagnosticEvent,
  ExerciseResultDetail,
  ImprovementDay,
  ImprovementSeries,
  MainMistake,
  MistakeType,
  WeakSpot,
  WorstArea,
} from "~/engine/types";

export { pruneEvents } from "~/engine/storage";

// ── Indices (content-driven; no data change required) ───────────
// VocabularyItem has no id — the normalized lemma IS the identity (D3).

export interface VocabIndexEntry {
  /** Canonical VocabularyItem.latin. */
  lemma: string;
  /** `vocab:<normalized lemma>` — the diagnostic conceptId. */
  conceptId: string;
  /** English gloss (canonical, un-normalized). */
  gloss: string;
  /** First lesson that introduces the word. */
  lessonId: number;
}

/** Map keyed by normalized lemma AND normalized gloss → entry. */
export type VocabIndex = Map<string, VocabIndexEntry>;

export function buildVocabularyIndex(lessons: Lesson[]): VocabIndex {
  const index: VocabIndex = new Map();
  for (const lesson of lessons) {
    for (const item of lesson.vocabulary ?? []) {
      const lemmaKey = normalizeAnswer(item.latin);
      const glossKey = normalizeAnswer(item.english);
      const entry: VocabIndexEntry = {
        lemma: item.latin,
        conceptId: `vocab:${lemmaKey}`,
        gloss: item.english,
        lessonId: lesson.id,
      };
      if (lemmaKey && !index.has(lemmaKey)) index.set(lemmaKey, entry);
      // Gloss collisions resolve to the first match (known minor ambiguity).
      if (glossKey && !index.has(glossKey)) index.set(glossKey, entry);
    }
  }
  return index;
}

export function buildConceptIndex(
  lessons: Lesson[],
): Map<string, { label: string; lessonId: number }> {
  const index = new Map<string, { label: string; lessonId: number }>();
  for (const lesson of lessons) {
    index.set(`concept:${lesson.id}`, { label: lesson.concept, lessonId: lesson.id });
    index.set(`lesson:${lesson.id}`, { label: lesson.title, lessonId: lesson.id });
  }
  return index;
}

// ── Concept derivation (D3) ─────────────────────────────────────
// 1. exercise.concepts (future optional data field) if present
// 2. MC/fill: correct option/answer matches a lesson lemma or gloss → vocab:<lemma>;
//    endings ("-ae"/"ae") or concept prompts → concept:<lessonId>
// 3. flashcard: front/back match → vocab or concept:<lessonId>
// 4. matching / reading-passage wrap-up → concept:<lessonId> (per-pair evidence = phase 2)
// 5. tags always include lesson:<lessonId>

function conceptKindOf(conceptId: string): ConceptKind {
  const colon = conceptId.indexOf(":");
  switch (colon > 0 ? conceptId.slice(0, colon) : "") {
    case "vocab": return "vocab";
    case "concept": return "concept";
    case "lesson": return "lesson";
    case "char": return "character";
    case "drill": return "drill";
    default: return "lesson";
  }
}

function matchVocabItem(text: string, vocab: VocabularyItem[]): VocabularyItem | undefined {
  const key = normalizeAnswer(text);
  if (!key) return undefined;
  return vocab.find(
    (v) => normalizeAnswer(v.latin) === key || normalizeAnswer(v.english) === key,
  );
}

function vocabConceptId(latin: string): string {
  return `vocab:${normalizeAnswer(latin)}`;
}

export function deriveConceptIds(
  lesson: Lesson,
  exercise: Exercise,
): { primary: string; tags: string[]; kind: ConceptKind } {
  const tags = [`lesson:${lesson.id}`];
  // 1. Explicit content tags (additive, optional — content may add later).
  const explicit = (exercise as Exercise & { concepts?: string[] }).concepts;
  if (explicit && explicit.length > 0) {
    return { primary: explicit[0], tags: [...tags, ...explicit.slice(1)], kind: conceptKindOf(explicit[0]) };
  }
  const vocab = lesson.vocabulary ?? [];
  // 2. MC / fill-in-blank: the canonical answer identifies the concept.
  if (exercise.type === "multiple-choice" || exercise.type === "fill-in-blank") {
    const expected =
      exercise.type === "multiple-choice"
        ? exercise.options[exercise.correctIndex]
        : exercise.answer;
    const hit = matchVocabItem(expected, vocab);
    if (hit) return { primary: vocabConceptId(hit.latin), tags, kind: "vocab" };
    // Ending-type prompts ("Accusative singular of porta: port___") or concept prompts.
    return { primary: `concept:${lesson.id}`, tags, kind: "concept" };
  }
  // 3. Flashcard: front or back identifies the concept.
  if (exercise.type === "flashcard") {
    const hit =
      matchVocabItem(exercise.front, vocab) ?? matchVocabItem(exercise.back, vocab);
    if (hit) return { primary: vocabConceptId(hit.latin), tags, kind: "vocab" };
    return { primary: `concept:${lesson.id}`, tags, kind: "concept" };
  }
  // 4. Matching / reading-passage wrap-up: lesson-level for now.
  return { primary: `concept:${lesson.id}`, tags, kind: "concept" };
}

// ── Mistake classification (D4) ─────────────────────────────────

/**
 * Pure rule-based classification (owner: "rule-based, no AI needed if well
 * coded"). First match wins. Returns null when `wrong` is actually correct.
 * Reuses answers.ts (normalizeAnswer / checkFillInBlank / checkMultipleChoice);
 * spelling = edit distance ≤ 2 after normalizeAnswer.
 */
export function classifyMistake(opts: {
  conceptId: string;
  exercise: Exercise;
  wrong: string;
  expected: string;
  vocabIndex: VocabIndex;
}): MistakeType | null {
  const { conceptId, exercise, wrong, expected, vocabIndex } = opts;
  const nWrong = normalizeAnswer(wrong);
  const nExpected = normalizeAnswer(expected);

  // 1. Not a mistake: normalized equality, acceptable answer, or correct MC option.
  if (nWrong === nExpected) return null;
  if (exercise.type === "fill-in-blank" && checkFillInBlank(wrong, expected, exercise.acceptableAnswers ?? [])) return null;
  if (exercise.type === "multiple-choice") {
    const wrongIdx = exercise.options.indexOf(wrong);
    if (wrongIdx !== -1 && checkMultipleChoice(wrongIdx, exercise.correctIndex)) return null;
  }

  // 2. Resolve wrong and expected to vocab items (lemma or gloss, normalized).
  const wEntry = vocabIndex.get(nWrong);
  const eEntry = vocabIndex.get(nExpected);

  // 3. Same lemma → wrong-form (right word, wrong ending/form).
  if (wEntry && eEntry && wEntry.conceptId === eEntry.conceptId) return "wrong-form";
  // 4. Different lemmas, both resolve → confused-with (feeds confusion pairs).
  if (wEntry && eEntry && wEntry.conceptId !== eEntry.conceptId) return "confused-with";
  // 5. Wrong resolves to a known word but expected does not (ending-type prompt,
  //    e.g. "…port___" expected "am" but student typed a word), or the wrong
  //    answer IS the target concept's own lemma → wrong-form (inflection error).
  if (wEntry && (!eEntry || wEntry.conceptId === conceptId)) return "wrong-form";

  // 6. Orthographic near-miss of the correct answer → spelling.
  if (levenshtein(nWrong, nExpected) <= 2) return "spelling";

  // 7. Prompt-intent heuristics. (Reading-passage exercises carry no `prompt` — title used.)
  const prompt = `${(exercise as { prompt?: string }).prompt ?? ""}`.toLowerCase();
  if (/ending|case|person|number|declen|conjug/.test(prompt)) {
    if (/\bperson\b/.test(prompt)) return "wrong-person";
    if (/\bnumber\b/.test(prompt)) return "wrong-number";
    if (/\bgender\b/.test(prompt)) return "wrong-gender";
    if (/\bcase\b|\bdeclen/.test(prompt)) return "wrong-case";
    return "wrong-form";
  }
  if (/means|translate|what does/i.test(prompt)) return "wrong-meaning";
  if (/rule|is used|is translated|expresses|denotes|is formed|is the case/.test(prompt)) return "rule";

  // 8. Honest fallback — never fabricate.
  return "unknown";
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (Math.abs(a.length - b.length) > 2) return Math.abs(a.length - b.length);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let cur = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
    cur = new Array<number>(b.length + 1);
  }
  return prev[b.length];
}

// ── Windows / filtering ─────────────────────────────────────────

function dayMs(days: number): number {
  return days * 86_400_000;
}

/** True when the event is within the window (incl. +1 day clock-skew allowance). */
function withinWindow(e: DiagnosticEvent, now: Date, windowDays: number): boolean {
  const t = new Date(e.ts).getTime();
  if (Number.isNaN(t)) return false;
  return t >= now.getTime() - dayMs(windowDays) && t <= now.getTime() + dayMs(1);
}

/** All events whose primary concept or any tag matches. */
export function forConcept(events: DiagnosticEvent[], conceptId: string): DiagnosticEvent[] {
  return events.filter(
    (e) => e.conceptId === conceptId || (e.tags?.includes(conceptId) ?? false),
  );
}

/** Every conceptId (primary or tag) with at least one in-window event. */
function collectConceptIds(events: DiagnosticEvent[], windowDays: number, now: Date): Set<string> {
  const ids = new Set<string>();
  for (const e of events) {
    if (!withinWindow(e, now, windowDays)) continue;
    ids.add(e.conceptId);
    for (const t of e.tags ?? []) ids.add(t);
  }
  return ids;
}

function kindOfConcept(conceptId: string): ConceptKind {
  return conceptKindOf(conceptId);
}

function labelForConcept(
  conceptId: string,
  vocabIndex: VocabIndex,
  conceptIndex: Map<string, { label: string; lessonId: number }>,
): string {
  if (conceptId.startsWith("vocab:")) {
    const lemma = conceptId.slice("vocab:".length);
    const entry = vocabIndex.get(lemma);
    return entry ? entry.lemma : lemma;
  }
  const conceptEntry = conceptIndex.get(conceptId);
  if (conceptEntry) return conceptEntry.label;
  const colon = conceptId.indexOf(":");
  return colon > 0 ? conceptId.slice(colon + 1) : conceptId;
}

function lessonIdForConcept(conceptId: string, vocabIndex: VocabIndex): number | undefined {
  if (conceptId.startsWith("vocab:")) {
    return vocabIndex.get(conceptId.slice("vocab:".length))?.lessonId;
  }
  const m = /^(?:concept|lesson):(\d+)$/.exec(conceptId);
  return m ? Number(m[1]) : undefined;
}

// ── Stats / queries ─────────────────────────────────────────────

export function getConceptStats(
  events: DiagnosticEvent[],
  conceptId: string,
  opts?: { windowDays?: number; now?: Date },
): ConceptStats {
  const windowDays = opts?.windowDays ?? DIAGNOSTICS_WINDOW_DAYS;
  const now = opts?.now ?? new Date();
  const evts = forConcept(events, conceptId).filter((e) => withinWindow(e, now, windowDays));
  let correct = 0;
  let unknownWrong = 0;
  const mistakes: Partial<Record<MistakeType, number>> = {};
  let firstAttemptAt: string | null = null;
  let lastAttemptAt: string | null = null;
  for (const e of evts) {
    if (e.ok) correct++;
    else if (e.mistake) mistakes[e.mistake] = (mistakes[e.mistake] ?? 0) + 1;
    else unknownWrong++;
    if (firstAttemptAt === null || e.ts < firstAttemptAt) firstAttemptAt = e.ts;
    if (lastAttemptAt === null || e.ts > lastAttemptAt) lastAttemptAt = e.ts;
  }
  return {
    conceptId,
    correct,
    total: evts.length,
    accuracy: evts.length ? Math.round((correct / evts.length) * 100) : 0,
    firstAttemptAt,
    lastAttemptAt,
    windowStart: new Date(now.getTime() - dayMs(windowDays)).toISOString(),
    mistakes,
    unknownWrong,
  };
}

/**
 * Concepts below the accuracy threshold (default 0.6, same as ReviewScreen's
 * inline filter — now windowed and per-word with main mistake attached).
 */
export function getWeakSpots(
  events: DiagnosticEvent[],
  lessons: Lesson[],
  opts?: { threshold?: number; minAttempts?: number; windowDays?: number; limit?: number },
): WeakSpot[] {
  const threshold = opts?.threshold ?? WEAK_SPOT_THRESHOLD;
  const minAttempts = opts?.minAttempts ?? WEAK_SPOT_MIN_ATTEMPTS;
  const windowDays = opts?.windowDays ?? DIAGNOSTICS_WINDOW_DAYS;
  const limit = opts?.limit;
  const now = new Date();
  const vocabIndex = buildVocabularyIndex(lessons);
  const conceptIndex = buildConceptIndex(lessons);
  const spots: WeakSpot[] = [];
  for (const conceptId of collectConceptIds(events, windowDays, now)) {
    const stats = getConceptStats(events, conceptId, { windowDays, now });
    if (stats.total < minAttempts || stats.accuracy >= threshold * 100) continue;
    spots.push({
      conceptId,
      kind: kindOfConcept(conceptId),
      label: labelForConcept(conceptId, vocabIndex, conceptIndex),
      lessonId: lessonIdForConcept(conceptId, vocabIndex),
      correct: stats.correct,
      total: stats.total,
      accuracy: stats.accuracy,
      mainMistake: getMainMistake(events, conceptId, { windowDays, now, lessons }) ?? undefined,
    });
  }
  // Worst first, then most attempted, then deterministic.
  spots.sort(
    (x, y) =>
      x.accuracy - y.accuracy ||
      y.total - x.total ||
      x.conceptId.localeCompare(y.conceptId),
  );
  return limit !== undefined ? spots.slice(0, limit) : spots;
}

/**
 * The student's main mistake for a concept — mode over the window; tie-break
 * by most recently seen type. Null under MIN_MISTAKE_EVIDENCE wrongs
 * ("keep practicing — not enough data yet").
 */
export function getMainMistake(
  events: DiagnosticEvent[],
  conceptId: string,
  opts?: { windowDays?: number; now?: Date; lessons?: Lesson[] },
): MainMistake | null {
  const windowDays = opts?.windowDays ?? DIAGNOSTICS_WINDOW_DAYS;
  const now = opts?.now ?? new Date();
  const wrongs = forConcept(events, conceptId).filter(
    (e) => withinWindow(e, now, windowDays) && !e.ok && e.mistake !== undefined,
  );
  if (wrongs.length < MIN_MISTAKE_EVIDENCE) return null;
  const counts = new Map<MistakeType, number>();
  const lastSeen = new Map<MistakeType, string>();
  for (const e of wrongs) {
    const m = e.mistake as MistakeType;
    counts.set(m, (counts.get(m) ?? 0) + 1);
    const seen = lastSeen.get(m);
    if (seen === undefined || e.ts > seen) lastSeen.set(m, e.ts);
  }
  let main: MistakeType = "unknown";
  let maxCount = -1;
  let mainSeen = "";
  for (const [m, count] of counts) {
    const seen = lastSeen.get(m) ?? "";
    if (count > maxCount || (count === maxCount && seen > mainSeen)) {
      main = m;
      maxCount = count;
      mainSeen = seen;
    }
  }
  const totalWrong = wrongs.length;
  const result: MainMistake = {
    conceptId,
    type: main,
    count: maxCount,
    totalWrong,
    share: Math.round((maxCount / totalWrong) * 100),
  };
  if (main === "confused-with") {
    const vocabIndex = opts?.lessons && opts.lessons.length > 0 ? buildVocabularyIndex(opts.lessons) : undefined;
    const partners = new Map<string, { count: number; label: string }>();
    for (const e of wrongs) {
      if (e.mistake !== "confused-with" || !e.wrong) continue;
      const key = normalizeAnswer(e.wrong);
      if (!key) continue;
      let label = e.wrong;
      if (vocabIndex) {
        const entry = vocabIndex.get(key);
        if (entry) label = entry.lemma;
      }
      const cur = partners.get(key) ?? { count: 0, label };
      cur.count++;
      partners.set(key, cur);
    }
    let bestKey = "";
    let bestCount = 0;
    let bestLabel = "";
    for (const [key, { count, label }] of partners) {
      if (count > bestCount) {
        bestKey = key;
        bestCount = count;
        bestLabel = label;
      }
    }
    if (bestKey) {
      const partnerEntry = vocabIndex?.get(bestKey);
      result.partner = {
        // Canonical lemma concept (vocab:porta), not the gloss-keyed vocab:gate.
        conceptId: partnerEntry ? partnerEntry.conceptId : `vocab:${bestKey}`,
        label: bestLabel,
        count: bestCount,
      };
    }
  }
  return result;
}

/**
 * Confusion pairs (D7) — two vocab concepts the student answers for each
 * other. Evidence: wrong events with a resolvable `wrong` mapping to a
 * different lemma, source ∈ lesson/ai-practice/review (self-rated drills and
 * flashcard exercises contribute nothing — documented limitation).
 * Qualifies iff pairCount >= MIN_CONFUSION_EVIDENCE (3) AND
 * (attempts < MIN_TOTAL_ATTEMPTS_FOR_RATE (10) OR pairCount/attempts >= 0.25).
 */
export function getConfusionPairs(
  events: DiagnosticEvent[],
  lessons: Lesson[],
  opts?: {
    minEvidence?: number;
    rateThreshold?: number;
    minAttemptsForRate?: number;
    windowDays?: number;
    limit?: number;
  },
): ConfusionPair[] {
  const minEvidence = opts?.minEvidence ?? MIN_CONFUSION_EVIDENCE;
  const rateThreshold = opts?.rateThreshold ?? CONFUSION_RATE_THRESHOLD;
  const minAttemptsForRate = opts?.minAttemptsForRate ?? MIN_TOTAL_ATTEMPTS_FOR_RATE;
  const windowDays = opts?.windowDays ?? DIAGNOSTICS_WINDOW_DAYS;
  const limit = opts?.limit ?? 10;
  const now = new Date();
  const vocabIndex = buildVocabularyIndex(lessons);
  const conceptIndex = buildConceptIndex(lessons);
  const directed = new Map<string, Map<string, number>>(); // A → Map<B, count>
  const attempts = new Map<string, number>(); // conceptId → in-window attempt count
  const labels = new Map<string, string>();

  for (const e of events) {
    if (!withinWindow(e, now, windowDays)) continue;
    const a = e.conceptId;
    attempts.set(a, (attempts.get(a) ?? 0) + 1);
    if (!labels.has(a)) labels.set(a, labelForConcept(a, vocabIndex, conceptIndex));
    if (e.ok) continue;
    if (e.source === "drill" || e.source === "quizzer") continue; // self-rated: no wrong answer
    if (!e.wrong) continue;
    const wrongKey = normalizeAnswer(e.wrong);
    if (!wrongKey) continue;
    const wEntry = vocabIndex.get(wrongKey);
    if (!wEntry) continue;
    const b = wEntry.conceptId;
    if (b === a) continue; // wrong answer is the target concept itself — not a pair
    labels.set(b, wEntry.lemma);
    let dir = directed.get(a);
    if (!dir) {
      dir = new Map<string, number>();
      directed.set(a, dir);
    }
    dir.set(b, (dir.get(b) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const pairs: ConfusionPair[] = [];
  for (const [a, dir] of directed) {
    for (const [b, aToB] of dir) {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const bToA = directed.get(b)?.get(a) ?? 0;
      const total = aToB + bToA;
      if (total < minEvidence) continue;
      const attemptsAB = (attempts.get(a) ?? 0) + (attempts.get(b) ?? 0);
      const rate = attemptsAB > 0 ? Math.round((total / attemptsAB) * 1000) / 1000 : 0;
      // Sparsity carve-out: few attempts ⇒ low rate still counts as a real pattern.
      if (attemptsAB >= minAttemptsForRate && rate < rateThreshold) continue;
      pairs.push({
        a,
        b,
        labelA: labels.get(a) ?? a,
        labelB: labels.get(b) ?? b,
        aToB,
        bToA,
        total,
        attempts: attemptsAB,
        rate,
      });
    }
  }
  pairs.sort(
    (p1, p2) =>
      p2.total - p1.total ||
      p2.rate - p1.rate ||
      p1.a.localeCompare(p2.a) ||
      p1.b.localeCompare(p2.b),
  );
  return pairs.slice(0, limit);
}

/**
 * Weak spots ranked for remediation: accuracy asc, wrongCount desc,
 * recencyWeight desc. Recency weight = mean fractional position of the
 * concept's in-window attempts (0 = window start, 1 = now).
 */
export function getWorstAreas(
  events: DiagnosticEvent[],
  lessons: Lesson[],
  opts?: { minAttempts?: number; kinds?: ConceptKind[]; limit?: number; windowDays?: number },
): WorstArea[] {
  const minAttempts = opts?.minAttempts ?? WORST_AREA_MIN_ATTEMPTS;
  const kinds = opts?.kinds;
  const limit = opts?.limit;
  const windowDays = opts?.windowDays ?? DIAGNOSTICS_WINDOW_DAYS;
  const now = new Date();
  const windowStartMs = now.getTime() - dayMs(windowDays);
  const span = Math.max(1, now.getTime() - windowStartMs);
  const vocabIndex = buildVocabularyIndex(lessons);
  const conceptIndex = buildConceptIndex(lessons);
  const out: WorstArea[] = [];
  for (const conceptId of collectConceptIds(events, windowDays, now)) {
    const kind = kindOfConcept(conceptId);
    if (kinds && !kinds.includes(kind)) continue;
    const evts = forConcept(events, conceptId).filter((e) => withinWindow(e, now, windowDays));
    if (evts.length < minAttempts) continue;
    const correct = evts.filter((e) => e.ok).length;
    const wrongCount = evts.length - correct;
    if (wrongCount === 0) continue; // not a "worst area" — nothing wrong
    let recencySum = 0;
    let weighted = 0;
    for (const e of evts) {
      const t = new Date(e.ts).getTime();
      if (Number.isNaN(t)) continue;
      recencySum += Math.min(1, Math.max(0, (t - windowStartMs) / span));
      weighted++;
    }
    const recencyWeight = weighted > 0 ? recencySum / weighted : 0;
    out.push({
      conceptId,
      kind,
      label: labelForConcept(conceptId, vocabIndex, conceptIndex),
      lessonId: lessonIdForConcept(conceptId, vocabIndex),
      correct,
      total: evts.length,
      accuracy: Math.round((correct / evts.length) * 100),
      mainMistake: getMainMistake(events, conceptId, { windowDays, now, lessons }) ?? undefined,
      wrongCount,
      recencyWeight,
    });
  }
  out.sort(
    (x, y) =>
      x.accuracy - y.accuracy ||
      y.wrongCount - x.wrongCount ||
      y.recencyWeight - x.recencyWeight ||
      x.conceptId.localeCompare(y.conceptId),
  );
  return limit !== undefined ? out.slice(0, limit) : out;
}

/** Per-day (UTC YYYY-MM-DD) aggregated performance over the window. */
export function getImprovementSeries(
  events: DiagnosticEvent[],
  opts?: { conceptId?: string; windowDays?: number; now?: Date },
): ImprovementSeries {
  const windowDays = opts?.windowDays ?? DIAGNOSTICS_WINDOW_DAYS;
  const now = opts?.now ?? new Date();
  const source = opts?.conceptId ? forConcept(events, opts.conceptId) : events;
  const byDay = new Map<string, { correct: number; total: number }>();
  for (const e of source) {
    if (!withinWindow(e, now, windowDays)) continue;
    const date = e.ts.slice(0, 10); // ISO UTC → YYYY-MM-DD
    const cur = byDay.get(date) ?? { correct: 0, total: 0 };
    cur.total++;
    if (e.ok) cur.correct++;
    byDay.set(date, cur);
  }
  const days: ImprovementDay[] = [...byDay.entries()]
    .map(([date, { correct, total }]) => ({
      date,
      correct,
      total,
      accuracy: Math.round((correct / total) * 100),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

/**
 * Improvement-based streak: `days` = length of the run of consecutive
 * attempted days (ending at the most recent attempted day) where accuracy
 * strictly increased day-over-day. `active` = days ≥ consecutiveDays.
 */
export function detectImprovementStreak(
  series: ImprovementSeries,
  opts?: { consecutiveDays?: number },
): { active: boolean; days: number; improvedToday: boolean } {
  const consecutiveDays = opts?.consecutiveDays ?? 3;
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  let days = 0;
  if (sorted.length > 0 && sorted[sorted.length - 1].total > 0) {
    days = 1;
    for (let i = sorted.length - 1; i >= 1; i--) {
      const cur = sorted[i];
      const prev = sorted[i - 1];
      if (cur.total === 0 || prev.total === 0) break;
      if (cur.accuracy === null || prev.accuracy === null) break;
      if (cur.accuracy > prev.accuracy) days++;
      else break;
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const improvedToday =
    !!last &&
    last.date === today &&
    last.total > 0 &&
    !!prev &&
    prev.total > 0 &&
    last.accuracy !== null &&
    prev.accuracy !== null &&
    last.accuracy > prev.accuracy;
  return { active: days >= consecutiveDays, days, improvedToday };
}

/** The lesson a concept belongs to, via vocab index lessonId / concept:<id> / lesson:<id>. */
export function findLessonForConcept(conceptId: string, lessons: Lesson[]): Lesson | undefined {
  if (conceptId.startsWith("vocab:")) {
    const lemma = conceptId.slice("vocab:".length);
    for (const lesson of lessons) {
      for (const item of lesson.vocabulary ?? []) {
        if (normalizeAnswer(item.latin) === lemma) return lesson;
      }
    }
    return undefined;
  }
  const m = /^(?:concept|lesson):(\d+)$/.exec(conceptId);
  return m ? lessons.find((l) => l.id === Number(m[1])) : undefined;
}

// ── Recording (storage side effect) ─────────────────────────────

/**
 * Record one lesson-exercise attempt: deriveConceptIds → classifyMistake →
 * recordAttempt (append + prune + save). Also keeps the legacy per-lesson
 * accuracy counter in sync (D5) so nothing regresses if the route later
 * drops its own recordAccuracy call.
 *
 * detail.wrong/expected are OPTIONAL today (D6): when absent, the event is
 * recorded with mistake "unknown" — evidence is still captured for accuracy,
 * and confusion/main-mistake queries simply have less to work with.
 */
export function recordLessonAttempt(opts: {
  lesson: Lesson;
  exerciseIdx: number;
  detail: ExerciseResultDetail;
  language?: Language;
  session?: string;
  /** All lessons for a fuller vocab index (better classification); defaults to [lesson]. */
  allLessons?: Lesson[];
}): void {
  const { lesson, exerciseIdx, detail, language, session, allLessons } = opts;
  const exercise = lesson.exercises[exerciseIdx];
  if (!exercise) return;
  const { primary, tags, kind } = deriveConceptIds(lesson, exercise);
  let mistake: MistakeType | undefined;
  if (!detail.correct) {
    if (detail.wrong !== undefined && detail.wrong !== "" && detail.expected !== undefined && detail.expected !== "") {
      const vocabIndex = buildVocabularyIndex(allLessons && allLessons.length > 0 ? allLessons : [lesson]);
      mistake = classifyMistake({
        conceptId: primary,
        exercise,
        wrong: detail.wrong,
        expected: detail.expected,
        vocabIndex,
      }) ?? "unknown";
    } else {
      mistake = "unknown";
    }
  }
  recordAttempt(
    {
      conceptId: primary,
      tags,
      kind,
      ok: detail.correct,
      source: "lesson",
      context: exercise.id,
      mistake,
      wrong: detail.wrong,
      expected: detail.expected,
      session,
    },
    language,
  );
  recordAccuracy(`lesson:${lesson.id}`, detail.correct, language);
}
