/**
 * latin2SectionSpecs.ts — Engine department: the Book-2 section adapter
 * (PR-A of the four-phase wrap). Builds ExerciseSpecs for the 16 captured
 * Part IV spine sections from LATIN2_SECTION_EXERCISES +
 * LATIN2_SECTION_GRAMMAR_REFS + LATIN2_SECTION_VOCAB (src/data/latin2.ts).
 *
 * Option A (survey §4): the captured Exercise objects stay VERBATIM in the
 * data file; specs ride alongside. A spec records skill + scope + provenance —
 * captured prompt/answer text is never copied into it, and the generators
 * (engine/generators.ts) never serve the textbook's own items.
 *
 * Spec ids: the preserved capture ids ("sy-e7-q3") plus derived section specs
 * ("…-constructions/-parse/-imitate"). All string ids — no numeric lesson ids,
 * so no collision with English's 2000-range lesson namespace.
 *
 * Where the captured material yields machine-usable scope:
 *   • flashcards → parsed paradigm/formation forms (form-drill; feeds parse)
 *   • "Give one English meaning" → vocab-recall
 *   • translate direction lines → translate-l2e / translate-e2l (direction kept)
 *   • "Complete the Latin…/Change Sentence…" → imitate
 *   • "Pick out the reflexive…" → parse
 * plus derived per-section specs where the data supports them:
 *   • constructions-recall — always (the section's GRAMMAR_REFS program)
 *   • parse — when the section's flashcards yield parsed paradigm forms
 *   • imitate — when the section's printed vocab yields case-government entries
 * Captured shapes with no machine-usable scope (e.g. the hic/is/ille supply
 * items) are recorded 1:1 but generate [] — the four-phase session falls back
 * to the template builders for those. Never fabricate.
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage.
 */

import {
  LATIN2_EXERCISES_SPINE,
  LATIN2_SECTION_EXERCISES,
  LATIN2_SECTION_GRAMMAR_REFS,
  LATIN2_SECTION_VOCAB,
  LATIN2_STRUCTURE,
} from "~/data/latin2";
import type { Exercise, VocabularyItem } from "~/data/latinLessons";
import { GRAMMAR_INDEX, type GrammarTopic } from "~/data/grammarIndex";
import type { ExerciseSpec, SpecForm, SpecKind } from "~/engine/exerciseSpec";
import type { GeneratorContext } from "~/engine/generators";
import { constructionEntries } from "~/engine/generators";
import { utcDateStr } from "~/engine/dailyLesson";

// ── Section lookup ────────────────────────────────────────────────────────

function spineSectionById(sectionId: string):
  | { title: string; folio: number | null }
  | null {
  for (const part of LATIN2_STRUCTURE) {
    const section = part.sections.find((s) => s.id === sectionId);
    if (section) return section;
  }
  return null;
}

/** The 16 captured spine sections in book order. */
export function latin2SpineSectionIds(): string[] {
  return [...LATIN2_EXERCISES_SPINE.sectionIds];
}

/**
 * The section's printed vocab and the PRIOR captured sections' vocab, in
 * spine order — the Book-2 analog of boundUniverseForLesson's
 * never-demand-untaught gate: a section's generators may draw on its own
 * vocab plus everything BEFORE it in the spine, never after.
 */
export function latin2SpineVocabThrough(sectionId: string): {
  sectionVocab: VocabularyItem[];
  priorVocab: VocabularyItem[];
} {
  const ids = LATIN2_EXERCISES_SPINE.sectionIds;
  const idx = ids.indexOf(sectionId);
  const sectionVocab = idx >= 0 ? (LATIN2_SECTION_VOCAB[sectionId] ?? []) : [];
  const priorVocab: VocabularyItem[] = [];
  for (let i = 0; i < idx; i++) {
    priorVocab.push(...(LATIN2_SECTION_VOCAB[ids[i]] ?? []));
  }
  return { sectionVocab, priorVocab };
}

/** A section's GRAMMAR_REFS resolved to GRAMMAR_INDEX topics (order kept;
 *  unknown ids skipped — the seam never invents topics). */
export function latin2SectionTopics(sectionId: string): GrammarTopic[] {
  const ids = LATIN2_SECTION_GRAMMAR_REFS[sectionId] ?? [];
  const out: GrammarTopic[] = [];
  for (const id of ids) {
    const topic = GRAMMAR_INDEX.find((t) => t.id === id);
    if (topic) out.push(topic);
  }
  return out;
}

/** Every distinct Book-2 spine topic — the constructions-recall foil universe. */
export function latin2AllSpineTopics(): GrammarTopic[] {
  const seen = new Set<string>();
  const out: GrammarTopic[] = [];
  for (const ids of Object.values(LATIN2_SECTION_GRAMMAR_REFS)) {
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const topic = GRAMMAR_INDEX.find((t) => t.id === id);
      if (topic) out.push(topic);
    }
  }
  return out;
}

/**
 * The generation context for a spine section: printed vocab + prior spine
 * vocab (bounded), the section's topics + the wider spine topic universe for
 * foils, and the four-phase seed chain prefix
 * `phase|sectionId|UTC-date|batch:n` (frozen date/batch injectable for tests).
 */
export function latin2SectionGenerationContext(
  sectionId: string,
  opts?: { phase?: string; date?: string; batch?: number },
): GeneratorContext {
  const { sectionVocab, priorVocab } = latin2SpineVocabThrough(sectionId);
  const topics = latin2SectionTopics(sectionId);
  const own = new Set(topics.map((t) => t.id));
  const distractorTopics = latin2AllSpineTopics().filter((t) => !own.has(t.id));
  const phase = opts?.phase ?? "quizzed";
  const date = opts?.date ?? utcDateStr();
  const batch = opts?.batch ?? 0;
  return {
    sectionVocab,
    priorVocab,
    topics,
    distractorTopics,
    seedBase: `${phase}|${sectionId}|${date}|batch:${batch}`,
  };
}

// ── Captured-item classification ──────────────────────────────────────────

/** The book's own exercise label from "(SY Ex. 42.A.1)" / "(SY f.318, q. 3)". */
function bookExerciseNo(prompt: string): string | undefined {
  const m = /\(SY ([^)]+)\)/.exec(prompt);
  return m ? m[1] : undefined;
}

/**
 * Spec kind (and translation direction) for a captured fill-in-blank, read
 * off the book's own direction line. null = unrecognized shape (excluded and
 * counted by the tests — never guessed).
 */
function classifyFill(
  prompt: string,
): { kind: SpecKind; direction?: "l2e" | "e2l" } | null {
  if (/^Translate into Latin/i.test(prompt)) return { kind: "translate-e2l", direction: "e2l" };
  if (/^Respondē Latīnē/i.test(prompt)) return { kind: "translate-e2l", direction: "e2l" };
  if (/^Translate and answer in Latin/i.test(prompt)) return { kind: "translate-e2l", direction: "e2l" };
  if (/^Respondē Anglicē/i.test(prompt)) return { kind: "translate-l2e", direction: "l2e" };
  if (/^Give one English meaning/i.test(prompt)) return { kind: "vocab-recall" };
  if (/^Pick out the reflexive pronoun/i.test(prompt)) return { kind: "parse" };
  if (/^Complete the Latin and translate/i.test(prompt)) return { kind: "imitate" };
  if (/^Change Sentence \d+ of Exercise/i.test(prompt)) return { kind: "imitate" };
  if (/^Supply the correct form/i.test(prompt)) return { kind: "form-drill" };
  if (/^Translate/i.test(prompt)) return { kind: "translate-l2e", direction: "l2e" };
  return null;
}

// ── Flashcard form parsing ────────────────────────────────────────────────

const CASE_LABELS: Record<string, string> = {
  gen: "genitive",
  acc: "accusative",
  abl: "ablative",
  nom: "nominative",
  dat: "dative",
};

/** Henle's paradigm order for the ordered "sg: … · pl: …" back format. */
const HENLE_CASE_ORDER = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "ablative",
];

const LATIN_WORD = /^[a-zA-ZāēīōūĀĒĪŌŪæÆ]+$/;

function tidyForm(raw: string): { form: string; note?: string } | null {
  const s = raw.trim();
  if (!s) return null;
  const m = /^(\S+)\s*(?:\(([^)]+)\))?$/.exec(s);
  if (!m) return null;
  const form = m[1].replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]$/u, "");
  if (!LATIN_WORD.test(form)) return null;
  return { form, note: m[2] };
}

/**
 * Parse a captured flashcard's back into structured forms. Handles the
 * capture's printed formats:
 *   1. labeled — "gen. sg. clāmōris — m. (…) — acc. sg. clāmōrem — …"
 *   2. ordered lists — "sg: f1..f5 · pl: f1..f5" (Henle case order), including
 *      the "pl. only (…):" variant
 *   3. formation — "breviter — briefly" (adjective front, plain gloss)
 * Unparseable backs (comparative tables, principal parts, example sentences)
 * yield [] — never guessed.
 */
function parseFlashcardForms(front: string, back: string): SpecForm[] {
  const forms: SpecForm[] = [];
  // (1) labeled format
  for (const m of back.matchAll(
    /(gen|acc|abl|nom|dat)\.\s*(sg|pl)\.\s*([^—–]+?)(?=\s*[—–]|$)/g,
  )) {
    const tidy = tidyForm(m[3]);
    if (!tidy) continue;
    forms.push({
      kind: "paradigm",
      case: CASE_LABELS[m[1]],
      number: m[2] === "sg" ? "singular" : "plural",
      form: tidy.form,
      note: tidy.note,
    });
  }
  if (forms.length > 0) return forms;
  // (2) ordered sg/pl lists
  let matched = false;
  for (const seg of back.split("·")) {
    const m = /^\s*(sg|pl)\.?( only[^:]*)?:\s*(.+)$/i.exec(seg.trim());
    if (!m) continue;
    const number = m[1].toLowerCase() === "sg" ? "singular" : "plural";
    const parts = m[3]
      .replace(/\([^)]*\)/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length !== HENLE_CASE_ORDER.length) continue; // never guess
    matched = true;
    parts.forEach((form, i) => {
      forms.push({ kind: "paradigm", case: HENLE_CASE_ORDER[i], number, form });
    });
  }
  if (matched) return forms;
  // (3) formation cards: single-word derived form — plain gloss, no
  // comparison markers or multiple segments.
  if (
    LATIN_WORD.test(front) &&
    /^[a-zA-ZāēīōūĀĒĪŌŪ]+\s*[—–]\s*[^;·]+$/.test(back)
  ) {
    const form = back.split(/[—–]/)[0].trim();
    if (form) forms.push({ kind: "formation", from: front, form });
  }
  return forms;
}

/** The section's aggregated parsed forms (lemma attached per paradigm form). */
function latin2SectionForms(sectionId: string): SpecForm[] {
  const out: SpecForm[] = [];
  for (const ex of LATIN2_SECTION_EXERCISES[sectionId] ?? []) {
    if (ex.type !== "flashcard") continue;
    for (const f of parseFlashcardForms(ex.front, ex.back)) {
      out.push(f.kind === "paradigm" ? { ...f, lemma: ex.front } : f);
    }
  }
  return out;
}

// ── Spec builders ─────────────────────────────────────────────────────────

/**
 * Specs for ONE captured section: one per captured item (id preserved) plus
 * the derived section specs its data supports. [] for unknown/uncaptured ids.
 */
export function latin2SectionSpecs(sectionId: string): ExerciseSpec[] {
  const section = spineSectionById(sectionId);
  const items = LATIN2_SECTION_EXERCISES[sectionId];
  if (!section || !items || items.length === 0) return [];
  const folio = section.folio ?? undefined;
  const topicIds = [...(LATIN2_SECTION_GRAMMAR_REFS[sectionId] ?? [])];
  const sectionIds = [sectionId];

  const specs: ExerciseSpec[] = [];
  for (const ex of items as Exercise[]) {
    const id = (ex as { id?: unknown }).id;
    if (typeof id !== "string" || id.length === 0) continue;
    if (ex.type === "flashcard") {
      const forms = parseFlashcardForms(ex.front, ex.back);
      specs.push({
        id,
        kind: "form-drill",
        topicIds,
        vocabScope: { sectionIds, lemmas: [ex.front] },
        params: forms.length > 0 ? { forms } : undefined,
        provenance: {
          book: "latin2",
          folio,
          bookExerciseNo: bookExerciseNo(ex.prompt),
        },
      });
      continue;
    }
    if (ex.type === "fill-in-blank") {
      const classified = classifyFill(ex.prompt);
      if (!classified) continue; // unrecognized shape — never guessed
      specs.push({
        id,
        kind: classified.kind,
        topicIds,
        vocabScope: { sectionIds },
        params: classified.direction
          ? { direction: classified.direction }
          : undefined,
        provenance: {
          book: "latin2",
          folio,
          bookExerciseNo: bookExerciseNo(ex.prompt),
        },
      });
    }
  }

  // Derived section specs — only where the data yields usable scope.
  specs.push({
    id: `${sectionId}-constructions`,
    kind: "constructions-recall",
    topicIds,
    vocabScope: { sectionIds },
    provenance: { book: "latin2", folio },
  });

  const forms = latin2SectionForms(sectionId);
  if (forms.some((f) => f.kind === "paradigm" && f.case && f.number && f.lemma)) {
    specs.push({
      id: `${sectionId}-parse`,
      kind: "parse",
      topicIds,
      vocabScope: { sectionIds },
      params: { forms },
      provenance: { book: "latin2", folio },
    });
  }

  const { sectionVocab, priorVocab } = latin2SpineVocabThrough(sectionId);
  if (constructionEntries([...sectionVocab, ...priorVocab]).length > 0) {
    specs.push({
      id: `${sectionId}-imitate`,
      kind: "imitate",
      topicIds,
      vocabScope: { sectionIds },
      provenance: { book: "latin2", folio },
    });
  }

  return specs;
}

/** All 16 spine sections' specs, in book order. */
export function latin2SpineSpecs(): { sectionId: string; specs: ExerciseSpec[] }[] {
  return latin2SpineSectionIds().map((sectionId) => ({
    sectionId,
    specs: latin2SectionSpecs(sectionId),
  }));
}
