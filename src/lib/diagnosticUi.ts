/**
 * diagnosticUi.ts — Screens-owned presentation helpers for Diagnostics.
 *
 * Pure formatting + deck composition. NO business logic: thresholds/evidence
 * come from src/engine/diagnostics.ts and src/data/settings.ts, never from
 * here. The route assembles a `DiagnosticsSummary` (this file's type) from
 * the engine's query functions and passes it down; the leaf components are
 * shape-agnostic props.
 *
 * Deck builders: the engine's assumed `buildWordDrillCards` /
 * `buildPairDrillCards` did not ship — per UI-spec decision 4.2, word/pair
 * practice reuses the FREE drill engine (`buildDrillCards` path). These
 * compose existing DrillKinds (vocab-latin / vocab-english) so DrillView
 * renders them with zero kind-map changes; the discrimination comes from
 * deck composition + DrillView's persistent reference banner.
 */
import type { Lesson } from "~/data/latinLessons";
import type { PronMode } from "~/data/settings";
import { normalizeAnswer } from "~/engine/answers";
import { findLessonForConcept } from "~/engine/diagnostics";
import { buildDrillCards, shuffle, type DrillCard } from "~/engine/drill";
import type { ConfusionPair, MainMistake, MistakeType, WeakSpot } from "~/engine/types";

/** Route-assembled summary (adaptation of the spec's assumed DiagnosticsSummary). */
export interface DiagnosticsSummary {
  windowDays: number;
  /** Total in-window answer events (for new-student copy). */
  answerCount: number;
  /** Route decides from engine thresholds — never hardcoded here. */
  enoughData: boolean;
  weakSpots: WeakSpot[];
  confusionPairs: ConfusionPair[];
}

export function severityClass(pct: number): string {
  return pct < 40 ? "bg-red-500" : pct < 60 ? "bg-amber-400" : "bg-green-500";
}

export function severityTextClass(pct: number): string {
  return pct < 40 ? "text-red-600" : pct < 60 ? "text-amber-600" : "text-green-600";
}

export function lessonTitles(lessons: Lesson[]): Map<number, string> {
  return new Map(lessons.map((l) => [l.id, l.title]));
}

/** English gloss for a `vocab:<lemma>` conceptId; undefined for other kinds. */
export function conceptGloss(conceptId: string, lessons: Lesson[]): string | undefined {
  if (!conceptId.startsWith("vocab:")) return undefined;
  const lemma = conceptId.slice("vocab:".length);
  for (const lesson of lessons) {
    for (const item of lesson.vocabulary ?? []) {
      if (normalizeAnswer(item.latin) === lemma) return item.english;
    }
  }
  return undefined;
}

/** Canonical display label for an arbitrary conceptId (unknown → raw id). */
export function conceptLabel(conceptId: string, lessons: Lesson[]): string {
  if (conceptId.startsWith("vocab:")) {
    const lemma = conceptId.slice("vocab:".length);
    const lesson = findLessonForConcept(conceptId, lessons);
    const item = lesson?.vocabulary?.find((v) => normalizeAnswer(v.latin) === lemma);
    return item?.latin ?? lemma;
  }
  const m = /^(?:concept|lesson):(\d+)$/.exec(conceptId);
  if (m) {
    const lesson = lessons.find((l) => l.id === Number(m[1]));
    if (lesson) return m[1][0] === "l" ? lesson.title : lesson.concept;
  }
  const colon = conceptId.indexOf(":");
  return colon > 0 ? conceptId.slice(colon + 1) : conceptId;
}

// ── Main-mistake copy (UI spec §8) ──────────────────────────────
// Engine MainMistake carries type/count/totalWrong/share (+ partner for
// confused-with); it does NOT carry the raw given/expected strings the spec
// assumed, so non-pair copy uses the taxonomy phrase + count. Flagged in the
// screens report; error-analysis (future) will add the richer strings.

const MISTAKE_PHRASE: Record<MistakeType, string> = {
  "wrong-meaning": "you picked the wrong meaning",
  "wrong-form": "you used the wrong form",
  "wrong-case": "you chose the wrong case",
  "wrong-number": "you mixed up singular and plural",
  "wrong-person": "you chose the wrong person",
  "wrong-gender": "you chose the wrong gender",
  "confused-with": "you chose a different word",
  spelling: "you misspelled it",
  rule: "you picked the wrong rule",
  unknown: "you got it wrong",
};

/** One-line row copy (§8a) — null when there is no main mistake yet. */
export function mainMistakeLine(spot: Pick<WeakSpot, "label" | "mainMistake">): string | null {
  const mm = spot.mainMistake;
  if (!mm) return null;
  if (mm.type === "confused-with" && mm.partner) {
    return `⚠️ You keep confusing ${spot.label} with ${mm.partner.label}.`;
  }
  return `❌ Most common error: ${MISTAKE_PHRASE[mm.type]} (${mm.count}×).`;
}

/** Detail copy (§8b) for WeakSpotDetail's main-mistake card. */
export function mainMistakeDetail(spot: WeakSpot): string | null {
  const mm = spot.mainMistake;
  if (!mm) return null;
  if (mm.type === "confused-with" && mm.partner) {
    return `You chose "${mm.partner.label}" instead of "${spot.label}" ${mm.partner.count}× this fortnight.`;
  }
  return `${MISTAKE_PHRASE[mm.type]} — ${mm.count} of ${mm.totalWrong} wrong answers this fortnight (${mm.share}% of your errors).`;
}

export const PAIR_GENERIC_REASON = "Similar spelling or endings — easy to swap.";

/** "terra = earth, land · porta = gate" — persistent reference for pair drills. */
export function pairCheatLine(pair: ConfusionPair, lessons: Lesson[]): string {
  const glossA = conceptGloss(pair.a, lessons);
  const glossB = conceptGloss(pair.b, lessons);
  const parts: string[] = [];
  parts.push(glossA ? `${pair.labelA} = ${glossA}` : pair.labelA);
  parts.push(glossB ? `${pair.labelB} = ${glossB}` : pair.labelB);
  return parts.join(" · ");
}

// ── Deck composition (free drill-engine path, spec §4.2 / §6) ──

function rekey(cards: DrillCard[], prefix: string): DrillCard[] {
  return cards.map((c, i) => ({ ...c, id: `${prefix}-${c.id}-${i}` }));
}

/** Cards for one vocab concept (L→E + E→L when both exist), from its home lesson. */
function cardsForWord(conceptId: string, lessons: Lesson[], pronMode: PronMode): DrillCard[] {
  const lesson = findLessonForConcept(conceptId, lessons);
  if (!lesson) return [];
  const lessonPool = buildDrillCards([lesson], 1, "mixed", pronMode);
  const lemma = conceptId.startsWith("vocab:") ? conceptId.slice("vocab:".length) : "";
  if (!lemma) return [];
  return lessonPool.filter(
    (c) => normalizeAnswer(c.prompt) === lemma || normalizeAnswer(c.answer) === lemma,
  );
}

/**
 * Word drill: the word's own cards, plus (when the spot's main mistake is
 * confused-with) the partner word's cards — the pair is deliberately pitted
 * so the drill directly targets the confusion. Free tier, offline.
 */
export function buildWordDrillCards(opts: {
  conceptId: string;
  partnerConceptId?: string;
  lessons: Lesson[];
  pronMode: PronMode;
}): DrillCard[] {
  const ids = [opts.conceptId, ...(opts.partnerConceptId ? [opts.partnerConceptId] : [])];
  const cards = ids.flatMap((cid) => cardsForWord(cid, opts.lessons, opts.pronMode));
  return rekey(shuffle(cards), "word");
}

/** Pair-pitting deck: both words' L→E + E→L cards, shuffled, re-keyed. */
export function buildPairDrillCards(opts: {
  pair: ConfusionPair;
  lessons: Lesson[];
  pronMode: PronMode;
}): DrillCard[] {
  const { pair, lessons, pronMode } = opts;
  const cards = [
    ...cardsForWord(pair.a, lessons, pronMode),
    ...cardsForWord(pair.b, lessons, pronMode),
  ];
  return rekey(shuffle(cards), "pair");
}

export type { MainMistake };
