/**
 * latin2SectionFourPhase.ts — Engine department: the Book-2 four-phase batch
 * builder (PR-B of the four-phase wrap).
 *
 * OWNER DIRECTIVE (2026-11-21): the four-phase system — taught → memorized →
 * quizzed → incorporated — over live-generated instances; captured spine items
 * are SPECS ONLY. This module turns a spine section's specs (PR-A adapter) and
 * its vocab universe into the drill batch the four-phase loop screen renders:
 *
 *   memorized    — the section's VOCAB UNIVERSE (its printed vocab plus the
 *                  prior spine sections' — the bounded, never-demand-untaught
 *                  pool). Each batch slot is a synthetic vocab-recall spec
 *                  scoped to ONE pool word; the registry generator (engine/
 *                  generators.ts) re-draws direction, foils and MC-vs-fill
 *                  per seed.
 *   quizzed      — the section's recognition specs: translate-l2e /
 *                  translate-e2l / parse.
 *   incorporated — the section's production specs: imitate /
 *                  constructions-recall / form-drill.
 *
 * Selection is a deterministic ROTATION (batch window stepped by count), so
 * consecutive batches cover disjoint spec slices and the whole spec set cycles
 * over time — no net-new randomness beyond the registry's own seeded streams.
 * When a window under-fills (specs whose scope emits [] — e.g. the ~162
 * flashcard specs awaiting parsed forms), the EXISTING template builders
 * (fallbackGenerator.generateFallbackExercises, mode "mc" over the section's
 * real vocab universe) pad the batch: no student ever sees nothing, and the
 * fallback never fabricates scope the section doesn't own.
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage. Same
 * (sectionId, phase, date, batch) → byte-identical batch.
 */

import type { ExerciseSpec, SpecKind } from "~/engine/exerciseSpec";
import type { GeneratedExercise } from "~/engine/fallbackGenerator";
import { generateFallbackExercises } from "~/engine/fallbackGenerator";
import type { PhaseName } from "~/engine/types";
import type { Lesson, VocabularyItem } from "~/data/latinLessons";
import {
  latin2SectionGenerationContext,
  latin2SectionSpecs,
  latin2SpineVocabThrough,
} from "~/engine/latin2SectionSpecs";
import { generateForSpec } from "~/engine/generators";
import { normalizeAnswer } from "~/engine/answers";
import { utcDateStr } from "~/engine/dailyLesson";
import { buildLatin2SectionLesson } from "~/lib/latin2Sections";

/** The registry's normalizers are module-private; mirror them here so the
 *  batch builder's word identity matches the generators' pools exactly. */

/** Superscript footnote digits the printed headwords/glosses carry. */
function stripFootnotes(s: string): string {
  return s.replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]/g, "");
}

/** Batch size the loop screen drills (PhaseDrillScreen BATCH_SIZE). */
export const LATIN2_PHASE_BATCH_SIZE = 8;

/** The spec kinds each drill phase draws from (see header). */
const PHASE_SPEC_KINDS: Record<Exclude<PhaseName, "taught">, SpecKind[]> = {
  memorized: ["vocab-recall"],
  quizzed: ["translate-l2e", "translate-e2l", "parse"],
  incorporated: ["imitate", "constructions-recall", "form-drill"],
};

/** Registry-generated instance identity — dedupes two specs that happened to
 *  draw the same surface (same type, prompt and answer) within one batch. */
function instanceKey(ex: GeneratedExercise): string {
  const answer =
    ex.type === "multiple-choice"
      ? (ex.options?.[ex.correctIndex ?? 0] ?? "")
      : (ex.answer ?? "");
  return `${ex.type}|${ex.prompt}|${answer}`;
}

/** The section's bounded vocab universe, deduped by the shared word identity
 *  (mirrors the registry's poolDeduped) so rotation slots never repeat a word. */
function sectionVocabUniverse(sectionId: string): VocabularyItem[] {
  const { sectionVocab, priorVocab } = latin2SpineVocabThrough(sectionId);
  const seen = new Set<string>();
  const out: VocabularyItem[] = [];
  for (const v of [...sectionVocab, ...priorVocab]) {
    const key = normalizeAnswer(stripFootnotes(v.latin));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** A synthetic memorized slot: one vocab-recall spec pinned to ONE pool word. */
function memorizedSlotSpec(
  sectionId: string,
  entry: VocabularyItem,
  slot: number,
  folio?: number,
): ExerciseSpec {
  return {
    id: `${sectionId}-memorized:${slot}`,
    kind: "vocab-recall",
    vocabScope: { sectionIds: [sectionId], lemmas: [entry.latin] },
    provenance: { book: "latin2", folio },
  };
}

/** The printed gloss cleaned for template prompts: braces and superscript
 *  footnote digits stripped, trimmed (the registry does the same via
 *  cleanGloss; its copy is module-private). */
function cleanGloss(english: string): string {
  return english
    .replace(/[{}]/g, "")
    .replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]/g, "")
    .trim();
}

/** A composed section lesson ENRICHED with the section's real vocab universe
 *  (presentation-cleaned) — the shape the existing template builders expect
 *  (they read lesson vocabulary; the bare composition carries none). Real
 *  data only, never a fabricated scope. */
function templateFallbackLesson(sectionId: string): Lesson | null {
  const base = buildLatin2SectionLesson(sectionId);
  if (!base) return null;
  const { sectionVocab, priorVocab } = latin2SpineVocabThrough(sectionId);
  return {
    ...base,
    vocabulary: [...sectionVocab, ...priorVocab].map((v) => ({
      ...v,
      latin: stripFootnotes(v.latin),
      english: cleanGloss(v.english),
    })),
  };
}

/**
 * One drill batch for a spine section phase — the loop's generative fuel.
 *
 * Deterministic in (sectionId, phase, date, batch): the registry seed chain
 * `phase|sectionId|UTC-date|batch:n|spec:<id>` (PR-A) drives every instance;
 * the spec-window rotation is stepped by `batch * count` so successive batches
 * cover disjoint slices of the section's spec set.
 */
export function latin2SectionPhaseBatch(
  sectionId: string,
  phase: Exclude<PhaseName, "taught">,
  opts?: { batch?: number; count?: number; date?: string },
): GeneratedExercise[] {
  const batch = Math.max(0, Math.floor(opts?.batch ?? 0));
  const count = Math.max(1, Math.floor(opts?.count ?? LATIN2_PHASE_BATCH_SIZE));
  const date = opts?.date ?? utcDateStr();
  const ctx = latin2SectionGenerationContext(sectionId, { phase, date, batch });
  const folio = latin2SectionSpecs(sectionId)[0]?.provenance.folio;

  const out: GeneratedExercise[] = [];
  const seen = new Set<string>();
  const push = (items: GeneratedExercise[]) => {
    for (const ex of items) {
      const key = instanceKey(ex);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(ex);
      if (out.length >= count) return true;
    }
    return false;
  };

  if (phase === "memorized") {
    // The section's vocab universe, one synthetic spec per slot — the registry
    // generator re-draws direction/foils/format per seed.
    const pool = sectionVocabUniverse(sectionId);
    if (pool.length > 0) {
      const start = (batch * count) % pool.length;
      for (let i = 0; i < count && out.length < count; i++) {
        const entry = pool[(start + i) % pool.length];
        push(
          generateForSpec(
            memorizedSlotSpec(sectionId, entry, i, folio),
            ctx,
          ),
        );
      }
    }
  } else {
    // quizzed / incorporated: rotate the section's eligible specs.
    const kinds = PHASE_SPEC_KINDS[phase];
    const eligible = latin2SectionSpecs(sectionId).filter(
      (spec) => kinds.includes(spec.kind),
    );
    if (eligible.length > 0) {
      const start = (batch * count) % eligible.length;
      for (
        let k = 0;
        k < eligible.length && out.length < count;
        k++
      ) {
        push(generateForSpec(eligible[(start + k) % eligible.length], ctx));
      }
    }
  }

  // Template-builder fallback: pad an under-filled window from the EXISTING
  // builders over the section's real vocab universe (never a fabricated
  // scope, never an empty batch). A pad item that dedupes against the
  // registry's instances re-rolls under a fresh sub-seed, so the batch always
  // reaches its full count.
  if (out.length < count) {
    const fallbackLesson = templateFallbackLesson(sectionId);
    if (fallbackLesson) {
      for (let round = 0; out.length < count && round < 4; round++) {
        const pad = generateFallbackExercises(
          fallbackLesson,
          count - out.length,
          "mc",
          "latin",
          undefined,
          `${ctx.seedBase}|fallback:${round}`,
        );
        push(pad);
      }
    }
  }

  return out.slice(0, count);
}

/**
 * The PhaseDrillScreen batch-override adapter: maps the loop screen's
 * (run, batchSeed, count) call — batchSeed = `${run.seed}|batch:n` — onto the
 * registry chain. "taught" never reaches the drill screen; defensively [].
 */
export function latin2BatchForDrill(
  sectionId: string,
  run: { phase: PhaseName },
  batchSeed: string,
  count?: number,
): GeneratedExercise[] {
  if (run.phase === "taught") return [];
  const batch = Number(/batch:(\d+)$/.exec(batchSeed)?.[1] ?? 0);
  return latin2SectionPhaseBatch(sectionId, run.phase, {
    batch: Number.isFinite(batch) ? batch : 0,
    count,
  });
}
