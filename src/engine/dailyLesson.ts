/**
 * dailyLesson.ts — Engine department: the daily worst-area lesson picker.
 *
 * Owner direction 2026-08-11: "a feature offering one daily lesson targeting
 * the student's current worst area (per diagnostics)." Free tier, rule-based,
 * deterministic, no AI, no storage writes on the read path.
 *
 * Design: research/daily-worst-area-lesson-design.md. Pipeline (spec §3):
 *   1. getWorstAreas({kinds:["vocab","concept"], minAttempts: 3, limit: 5})
 *      → the worst CONCEPT mapped back to its home lesson (D1);
 *   2. else getWeakSpots fallback (1–2 attempts, below 0.6 comfort zone);
 *   3. else seeded rotation over completed lessons (or the current lesson
 *      when the student is mid-course but has completed nothing);
 *   4. pick = seeded uniform pick across the candidate pool, deterministic
 *      per (language, UTC day) via mulberry32(hashString(seed)) (D2);
 *      a locked pick is dropped and re-picked from the remainder.
 * The offer is an OFFER, not an entitlement — D3: no storage at all.
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage writes.
 */
import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { DiagnosticEvent, MistakeType, WorstArea } from "~/engine/types";
import { getWeakSpots, getWorstAreas } from "~/engine/diagnostics";
import { hashString, mulberry32 } from "~/engine/seededRandom";
import { DAILY_LESSON_CANDIDATES, WORST_AREA_MIN_ATTEMPTS } from "~/data/settings";

export type DailyLessonSource = "diagnostic" | "weak-spot" | "rotation";

/** The daily offer — screen-ready, engine-computed. */
export interface DailyWorstLesson {
  lessonId: number;
  lessonTitle: string;
  /** The worst concept driving the pick (vocab:<lemma> or concept:<id>). */
  conceptId: string;
  conceptLabel: string;
  /** Screen-ready copy (English, in-module). */
  reason: string;
  /** 1-based rank within the candidate pool (1 = worst). */
  rank: number;
  candidateCount: number;
  source: DailyLessonSource;
}

/** UTC YYYY-MM-DD — consistent with getImprovementSeries day-bucketing. */
export function utcDateStr(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// ── Main-mistake clause copy (mirrors lib/diagnosticUi.ts phrasing) ──

const MISTAKE_CLAUSE: Partial<Record<MistakeType, string>> = {
  "wrong-meaning": "you pick the wrong meaning",
  "wrong-form": "you use the wrong form",
  "wrong-case": "you choose the wrong case",
  "wrong-number": "you mix up singular and plural",
  "wrong-person": "you choose the wrong person",
  "wrong-gender": "you choose the wrong gender",
  spelling: "you misspell it",
  rule: "you pick the wrong rule",
  unknown: "you get it wrong",
};

function mainMistakeClause(c: WorstArea): string {
  const mm = c.mainMistake;
  if (!mm) return "";
  if (mm.type === "confused-with" && mm.partner) {
    return `, and you keep confusing it with ${mm.partner.label}`;
  }
  return `, and ${MISTAKE_CLAUSE[mm.type] ?? "you get it wrong"}`;
}

function diagnosticReason(c: WorstArea, lesson: Lesson, rank: number, candidateCount: number): string {
  const kindWord = c.kind === "vocab" ? "word" : "concept";
  let reason = `${c.label} is your weakest ${kindWord} — ${c.accuracy}% this fortnight`;
  reason += mainMistakeClause(c);
  reason += `. Review Lesson ${lesson.id}: ${lesson.title}.`;
  if (candidateCount > 1) reason += ` (#${rank} of your ${candidateCount} weakest)`;
  return reason;
}

function weakSpotReason(label: string, accuracy: number, lesson: Lesson): string {
  return `${label} is below your comfort zone (${accuracy}%). Review Lesson ${lesson.id}.`;
}

function rotationReason(lesson: Lesson): string {
  return `Full review: Lesson ${lesson.id} — ${lesson.title}.`;
}

/**
 * Deterministic seeded pick with a selectability guard: iterate the same rng
 * stream, dropping locked candidates, until an eligible one is found.
 * `rank` is the candidate's original 1-based position in the ranked pool.
 */
function pickEligible<T>(
  items: readonly T[],
  seed: string,
  isEligible: (t: T) => boolean,
): { item: T; rank: number } | null {
  if (items.length === 0) return null;
  const rng = mulberry32(hashString(seed));
  const working = items.map((item, i) => ({ item, rank: i + 1 }));
  while (working.length > 0) {
    const idx = Math.floor(rng() * working.length);
    const cand = working[idx];
    if (isEligible(cand.item)) return { item: cand.item, rank: cand.rank };
    working.splice(idx, 1);
  }
  return null;
}

/**
 * The daily worst-area lesson for (language, UTC day). Pure: everything is
 * derived from the passed events/progress/lessons — no storage reads or
 * writes. Returns null when there is genuinely nothing to offer (fresh user:
 * no events, no completed lessons, nothing unlocked).
 */
export function getDailyWorstLesson(opts: {
  /** loadDiagnostics(language) — the raw event log (pruned on read). */
  events: DiagnosticEvent[];
  /** All lessons (Latin today; language-agnostic for the English route later). */
  lessons: Lesson[];
  /** loadProgress(language).filter(p => p.completed).map(p => p.lessonId). */
  completedLessonIds: number[];
  /** Guard: the picked lesson's index must be < unlockedLessons. */
  unlockedLessons: number;
  language: Language;
  /** Defaults to `${language}|${YYYY-MM-DD UTC}` — tests freeze a seed. */
  seed?: string;
  /** Tests override; defaults to new Date(). */
  now?: Date;
}): DailyWorstLesson | null {
  const { events, lessons, completedLessonIds, unlockedLessons, language } = opts;
  const seed = opts.seed ?? `${language}|${utcDateStr(opts.now)}`;
  const selectable = (lessonId: number): boolean => {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    return idx !== -1 && idx < unlockedLessons;
  };

  // 1. Primary: worst concepts (vocab + grammar) with ≥ 3 in-window attempts.
  const worst = getWorstAreas(events, lessons, {
    kinds: ["vocab", "concept"],
    minAttempts: WORST_AREA_MIN_ATTEMPTS,
    limit: DAILY_LESSON_CANDIDATES,
  }).filter((c) => c.lessonId !== undefined);
  if (worst.length > 0) {
    const picked = pickEligible(worst, seed, (c) => selectable(c.lessonId as number));
    if (picked) {
      const c = picked.item;
      const lesson = lessons.find((l) => l.id === c.lessonId);
      if (lesson) {
        return {
          lessonId: c.lessonId as number,
          lessonTitle: lesson.title,
          conceptId: c.conceptId,
          conceptLabel: c.label,
          reason: diagnosticReason(c, lesson, picked.rank, worst.length),
          rank: picked.rank,
          candidateCount: worst.length,
          source: "diagnostic",
        };
      }
    }
    // All candidates locked (dev-mode unlock weirdness) → fall through.
  }

  // 2. Fallback: weak spots (1–2 attempts below the comfort threshold).
  const spots = getWeakSpots(events, lessons, { limit: DAILY_LESSON_CANDIDATES }).filter(
    (s) => (s.kind === "vocab" || s.kind === "concept") && s.lessonId !== undefined,
  );
  if (spots.length > 0) {
    const picked = pickEligible(spots, seed, (s) => selectable(s.lessonId as number));
    if (picked) {
      const s = picked.item;
      const lesson = lessons.find((l) => l.id === s.lessonId);
      if (lesson) {
        return {
          lessonId: s.lessonId as number,
          lessonTitle: lesson.title,
          conceptId: s.conceptId,
          conceptLabel: s.label,
          reason: weakSpotReason(s.label, s.accuracy, lesson),
          rank: picked.rank,
          candidateCount: spots.length,
          source: "weak-spot",
        };
      }
    }
  }

  // 3. Rotation: completed lessons as a review pool; mid-course fallback to
  //    the furthest-unlocked lesson when nothing has been completed.
  const completed = lessons.filter(
    (l) => completedLessonIds.includes(l.id) && selectable(l.id),
  );
  if (completed.length > 0) {
    const picked = pickEligible(completed, seed, () => true);
    if (picked) {
      return {
        lessonId: picked.item.id,
        lessonTitle: picked.item.title,
        conceptId: `lesson:${picked.item.id}`,
        conceptLabel: picked.item.title,
        reason: rotationReason(picked.item),
        rank: picked.rank,
        candidateCount: completed.length,
        source: "rotation",
      };
    }
  }
  if (unlockedLessons > 0 && unlockedLessons <= lessons.length) {
    const current = lessons[unlockedLessons - 1];
    return {
      lessonId: current.id,
      lessonTitle: current.title,
      conceptId: `lesson:${current.id}`,
      conceptLabel: current.title,
      reason: rotationReason(current),
      rank: 1,
      candidateCount: 1,
      source: "rotation",
    };
  }

  // Fresh user: nothing to offer — never fabricate a target.
  return null;
}
