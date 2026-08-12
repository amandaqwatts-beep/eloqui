/**
 * improvementStreak.ts — Engine department: improvement-based streak + bonus
 * drill deck.
 *
 * Owner direction 2026-08-11: "after noted improvement for three days in a
 * row, the student earns one bonus lesson per day. It gets relatively
 * harder/more taxing after a 10-day streak, then after 20, 50, and 100."
 * Free tier, deterministic, no AI.
 *
 * Design: research/improvement-streak-design.md. The metric is daily overall
 * accuracy on lesson-exercise attempts, UTC-day-bucketed, with two floors
 * (spec §1): a day needs ≥ IMPROVEMENT_MIN_DAILY_ATTEMPTS (10) attempts and a
 * ≥ IMPROVEMENT_MIN_POINTS (3-point) accuracy gain over the previous
 * qualifying day to count as an improvement day. Missed/below-floor days
 * PAUSE the streak; a qualifying day that fails to improve BREAKS it.
 *
 * Relationship to diagnostics.ts: this module CONSUMES getImprovementSeries
 * (day-bucketing) — the 14-day event log cannot reconstruct a 100-day streak,
 * so the streak persists its own accumulated history under verbum-streak-<lang>
 * (§4/§5). detectImprovementStreak's `days` counts the run INCLUDING the
 * baseline day (= streakDays + 1 when streakDays ≥ 1); this module keeps the
 * improvement-day count so copy reads "You've improved 3 days in a row."
 *
 * The bonus is a generated review drill deck targeting the daily worst-area
 * lesson's vocabulary, composed from the existing drill engine — no new drill
 * kinds (spec §2). Escalation = deck composition knobs only:
 *   tier 0 (3–9):   10 L→E recognition cards, reference banner ON
 *   tier 1 (10–19): + E→L production cards, reference banner ON, 10 cards
 *   tier 2 (20–49): mixed kinds (conjugation/declension), reference OFF, 15
 *   tier 3 (50–99): + confusion-partner pitting, instruction override, 15
 *   tier 4 (100+):  two-lesson deck (worst + second-worst), pitted, 15
 *
 * Pure TypeScript — zero JSX, zero rendering. Read paths never write storage.
 */
import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { DiagnosticEvent, WorstArea } from "~/engine/types";
import {
  BONUS_DRILL_DEFAULT_COUNT,
  BONUS_DRILL_ESCALATED_COUNT,
  DIAGNOSTICS_WINDOW_DAYS,
  IMPROVEMENT_ACTIVE_DAYS,
  IMPROVEMENT_ESCALATION_MILESTONES,
  IMPROVEMENT_HISTORY_CAP,
  IMPROVEMENT_MIN_DAILY_ATTEMPTS,
  IMPROVEMENT_MIN_POINTS,
} from "~/data/settings";
import type { PronMode } from "~/data/settings";
import { loadDiagnostics, loadStreakHistory, saveStreakHistory } from "~/engine/storage";
import { getImprovementSeries, getWorstAreas, findLessonForConcept } from "~/engine/diagnostics";
import { buildDrillCards, type DrillCard, type DrillKind } from "~/engine/drill";
import { normalizeAnswer } from "~/engine/answers";
import { seededShuffle } from "~/engine/seededRandom";
import { utcDateStr } from "~/engine/dailyLesson";

export type StreakState = "none" | "building" | "active" | "escalated";

/** One recorded qualifying day (attempts ≥ IMPROVEMENT_MIN_DAILY_ATTEMPTS). */
export interface StreakDay {
  /** YYYY-MM-DD UTC. */
  date: string;
  attempts: number;
  correct: number;
  /** 0–100 rounded — the daily metric. */
  accuracy: number;
  /** attempts ≥ floor && accuracy − prevQualifyingDay.accuracy ≥ MIN_POINTS. */
  improved: boolean;
}

/** Read-path result — everything screens need for the bonus card + badge. */
export interface ImprovementStreakResult {
  /** Consecutive improvement days ending at the most recent qualifying day. */
  streakDays: number;
  /** none (<1) | building (1–2) | active (3–9) | escalated (≥10). */
  state: StreakState;
  /** 0..4 from IMPROVEMENT_ESCALATION_MILESTONES. */
  tier: number;
  /** Next of [3,10,20,50,100] > streakDays; null at ≥100. */
  nextMilestone: number | null;
  /** Today's bucket exists, is qualifying, and improved over the previous qualifying day. */
  improvedToday: boolean;
  /** Ascending history, capped at IMPROVEMENT_HISTORY_CAP, today's bucket merged from events. */
  history: StreakDay[];
  /** One claim per day — true when bonusClaimedDate === today UTC. */
  bonusClaimedToday: boolean;
}

/** The generated bonus deck — DrillView-consumable (reference/instructionOverride match its props). */
export interface BonusDrillDeck {
  /** Escalation tier the deck was composed for (0..4). */
  tier: number;
  /** Deterministic per-day deck; re-keyed, unique ids. Empty when nothing weak is resolvable. */
  cards: DrillCard[];
  /** DrillView.reference banner line — present on tiers 0–1 only. */
  reference?: string;
  /** DrillView.instructionOverride — production-kinds hint-drop on tiers 3–4. */
  instructionOverride?: Partial<Record<DrillKind, string>>;
  /** Whether the deck pits a confusion partner and/or a second lesson against the target. */
  pitted: boolean;
  /** The worst concept driving the deck. */
  targetConceptId?: string;
  /** The home lesson of the worst concept. */
  targetLessonId?: number;
}

// ── Pure state/tier mapping (exported for tests and screens) ────

export function stateForStreak(streakDays: number): StreakState {
  if (streakDays <= 0) return "none";
  if (streakDays < IMPROVEMENT_ACTIVE_DAYS) return "building";
  if (streakDays < IMPROVEMENT_ESCALATION_MILESTONES[0]) return "active";
  return "escalated";
}

export function tierForStreak(streakDays: number): number {
  let tier = 0;
  for (const m of IMPROVEMENT_ESCALATION_MILESTONES) {
    if (streakDays >= m) tier++;
  }
  return tier;
}

export function nextMilestoneForStreak(streakDays: number): number | null {
  for (const m of [IMPROVEMENT_ACTIVE_DAYS, ...IMPROVEMENT_ESCALATION_MILESTONES]) {
    if (streakDays < m) return m;
  }
  return null;
}

/**
 * Pure fold over an ascending StreakDay[] (spec §4): walk newest→oldest
 * counting consecutive improved===true. The first non-improved day breaks —
 * a failed qualifying day resets the run, while gap days (absent from the
 * list) pause it; the run's baseline day has improved=false and merely
 * terminates the walk. improvedToday = whether the MOST RECENT day in the
 * list improved (getImprovementStreak computes today semantics separately).
 */
export function computeStreakFromDays(days: StreakDay[]): { streakDays: number; improvedToday: boolean } {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let streakDays = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (!sorted[i].improved) break;
    streakDays++;
  }
  const last = sorted[sorted.length - 1];
  return { streakDays, improvedToday: !!last && last.improved };
}

/** Improved = accuracy − previous qualifying day's accuracy ≥ MIN_POINTS. */
function improvedAgainstPrevious(
  history: StreakDay[],
  day: { date: string; accuracy: number | null },
): boolean {
  const dayAccuracy = day.accuracy ?? 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].date < day.date) {
      return dayAccuracy - history[i].accuracy >= IMPROVEMENT_MIN_POINTS;
    }
  }
  return false; // first qualifying day — baseline, never an improvement day
}

/** Merge today's event-derived bucket into history (replace by date key). Below-floor → unchanged. */
function mergeToday(history: StreakDay[], todayBucket: { date: string; correct: number; total: number; accuracy: number | null } | undefined): StreakDay[] {
  if (!todayBucket || todayBucket.total < IMPROVEMENT_MIN_DAILY_ATTEMPTS) return history;
  const entry: StreakDay = {
    date: todayBucket.date,
    attempts: todayBucket.total,
    correct: todayBucket.correct,
    accuracy: todayBucket.accuracy ?? 0,
    improved: improvedAgainstPrevious(history, todayBucket),
  };
  const rest = history.filter((d) => d.date !== todayBucket.date);
  return [...rest, entry].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Read path — NO writes. History comes from storage (or is injected for
 * tests); today's bucket is derived fresh from events and merged by date so
 * the result always reflects the latest lesson-complete without needing
 * recordStreakDay to have run.
 */
export function getImprovementStreak(
  events: DiagnosticEvent[],
  opts?: {
    windowDays?: number;
    now?: Date;
    language?: Language;
    /** Tests inject; default loadStreakHistory(language).history. */
    history?: StreakDay[];
  },
): ImprovementStreakResult {
  const windowDays = opts?.windowDays ?? DIAGNOSTICS_WINDOW_DAYS;
  const now = opts?.now ?? new Date();
  const language = opts?.language ?? "latin";
  const stored = loadStreakHistory(language);
  const history = opts?.history ?? stored.history;
  const today = utcDateStr(now);
  const series = getImprovementSeries(events, { windowDays, now });
  const todayBucket = series.find((d) => d.date === today);
  const merged = mergeToday(history, todayBucket);
  const { streakDays } = computeStreakFromDays(merged);
  const improvedToday =
    !!todayBucket &&
    todayBucket.total >= IMPROVEMENT_MIN_DAILY_ATTEMPTS &&
    improvedAgainstPrevious(history, todayBucket);
  return {
    streakDays,
    state: stateForStreak(streakDays),
    tier: tierForStreak(streakDays),
    nextMilestone: nextMilestoneForStreak(streakDays),
    improvedToday,
    history: merged,
    bonusClaimedToday: stored.bonusClaimedDate === today,
  };
}

/**
 * Write path — called from the route's lesson-complete case (Phase 2).
 * Recomputes today's bucket from the full event log on every call, so
 * repeated lesson-completes converge; idempotent by date key (StrictMode
 * double-invoke safe). Below-floor days are never recorded (pause).
 */
export function recordStreakDay(language: Language = "latin"): void {
  const now = new Date();
  const today = utcDateStr(now);
  const series = getImprovementSeries(loadDiagnostics(language), {
    windowDays: DIAGNOSTICS_WINDOW_DAYS,
    now,
  });
  const todayBucket = series.find((d) => d.date === today);
  if (!todayBucket || todayBucket.total < IMPROVEMENT_MIN_DAILY_ATTEMPTS) return;
  const payload = loadStreakHistory(language);
  const merged = mergeToday(payload.history, todayBucket);
  const history = merged.length > IMPROVEMENT_HISTORY_CAP ? merged.slice(-IMPROVEMENT_HISTORY_CAP) : merged;
  saveStreakHistory({ v: payload.v, history, bonusClaimedDate: payload.bonusClaimedDate }, language);
}

/** One bonus claim per day — the daily entitlement (spec §2). Gated on an active streak. */
export function claimBonusDrill(language: Language = "latin"): boolean {
  const result = getImprovementStreak(loadDiagnostics(language), { language, now: new Date() });
  if (result.streakDays < IMPROVEMENT_ACTIVE_DAYS || result.bonusClaimedToday) return false;
  const payload = loadStreakHistory(language);
  saveStreakHistory({ ...payload, bonusClaimedDate: utcDateStr() }, language);
  return true;
}

export function isBonusClaimedToday(language: Language = "latin", now: Date = new Date()): boolean {
  return loadStreakHistory(language).bonusClaimedDate === utcDateStr(now);
}

// ── Bonus deck composition (existing drill machinery only) ─────

/** Production-kinds hint-drop copy for tiers 3–4 (DrillView.instructionOverride). */
const PRODUCTION_OVERRIDE: Partial<Record<DrillKind, string>> = {
  "vocab-english": "Give the Latin from memory — no hints.",
  conjugation: "Conjugate from memory — no hints.",
  declension: "Decline from memory — no hints.",
};

/** "porta = gate" reference line for a vocab concept; undefined otherwise. */
function referenceLineForConcept(conceptId: string, lessons: Lesson[]): string | undefined {
  if (!conceptId.startsWith("vocab:")) return undefined;
  const lemma = conceptId.slice("vocab:".length);
  for (const lesson of lessons) {
    for (const item of lesson.vocabulary ?? []) {
      if (normalizeAnswer(item.latin) === lemma) return `${item.latin} = ${item.english}`;
    }
  }
  return undefined;
}

/** All drill cards (both directions where they exist) for one vocab concept. */
function cardsForConcept(conceptId: string, lessons: Lesson[], pronMode: PronMode): DrillCard[] {
  const lesson = findLessonForConcept(conceptId, lessons);
  if (!lesson) return [];
  const lemma = conceptId.startsWith("vocab:") ? conceptId.slice("vocab:".length) : "";
  if (!lemma) return [];
  return buildDrillCards([lesson], 1, "mixed", pronMode).filter(
    (c) => normalizeAnswer(c.prompt) === lemma || normalizeAnswer(c.answer) === lemma,
  );
}

function rekey(cards: DrillCard[], prefix: string): DrillCard[] {
  return cards.map((c, i) => ({ ...c, id: `${prefix}-${c.id}-${i}` }));
}

/**
 * The generated bonus drill deck — deterministic per (day, tier, diagnostics):
 * same seed → same deck. Composes existing DrillKinds via buildDrillCards;
 * no new drill modes. When no worst area resolves (nothing weak in-window),
 * returns an empty deck — screens should still honor the claim (the bonus is
 * an entitlement) but can show "nothing weak to review right now".
 */
export function buildBonusDrillDeck(opts: {
  /** 0..4 — take from getImprovementStreak().tier. */
  tier: number;
  /** loadDiagnostics(language) — worst-area resolution (not needed when worstAreas injected). */
  events: DiagnosticEvent[];
  lessons: Lesson[];
  pronMode?: PronMode;
  /** Default `bonus|${YYYY-MM-DD UTC}` — same day → same deck. Tests freeze a seed. */
  seed?: string;
  /** Tests inject for determinism; default getWorstAreas(events, lessons, { kinds:["vocab","concept"], limit: 2 }). */
  worstAreas?: WorstArea[];
}): BonusDrillDeck {
  const { tier, events, lessons, pronMode = "ecclesiastical" } = opts;
  const seed = opts.seed ?? `bonus|${utcDateStr()}`;
  const worstAreas =
    opts.worstAreas ??
    getWorstAreas(events, lessons, { kinds: ["vocab", "concept"], limit: 2 });
  const count = tier >= 2 ? BONUS_DRILL_ESCALATED_COUNT : BONUS_DRILL_DEFAULT_COUNT;

  const worst = worstAreas[0];
  let pool: DrillCard[] = [];
  let targetConceptId: string | undefined;
  let targetLessonId: number | undefined;
  let reference: string | undefined;
  let pitted = false;
  let instructionOverride: Partial<Record<DrillKind, string>> | undefined;

  if (worst && worst.lessonId !== undefined) {
    targetConceptId = worst.conceptId;
    targetLessonId = worst.lessonId;
    const worstLesson = lessons.find((l) => l.id === worst.lessonId);
    if (worstLesson) {
      const lessonCards = buildDrillCards([worstLesson], 1, "mixed", pronMode);
      // Tier 0 = recognition only (L→E); "kind vocab-latin" in the spec is read
      // as "recognition L→E cards" — strict kind filtering would degenerate to
      // type-less items only (nouns carry type → declension-kind cards).
      pool = tier === 0 ? lessonCards.filter((c) => c.kind !== "vocab-english") : lessonCards;
      reference = referenceLineForConcept(worst.conceptId, lessons);
    }
    if (tier >= 2) reference = undefined; // reference banner OFF from tier 2
    if (tier >= 3) {
      const mm = worst.mainMistake;
      const partner = mm?.type === "confused-with" ? mm.partner : undefined;
      if (partner) {
        pool = [...pool, ...cardsForConcept(partner.conceptId, lessons, pronMode)];
        pitted = true;
      }
    }
    if (tier >= 4 && worstAreas[1]?.lessonId !== undefined) {
      const second = lessons.find((l) => l.id === worstAreas[1].lessonId);
      if (second) {
        pool = [...pool, ...buildDrillCards([second], 1, "mixed", pronMode)];
        pitted = true;
      }
    }
    if (tier >= 3) instructionOverride = PRODUCTION_OVERRIDE;
  }

  const cards = rekey(seededShuffle(pool, seed).slice(0, count), "bonus");
  return { tier, cards, reference, instructionOverride, pitted, targetConceptId, targetLessonId };
}
