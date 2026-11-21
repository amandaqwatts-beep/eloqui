/**
 * generators.ts — Engine department: the deterministic spec→exercise registry
 * (PR-A of the Book-2 four-phase wrap).
 *
 * OWNER DIRECTIVE (2026-11-21): exercise generation follows the four-phase
 * system — taught → memorized → quizzed → incorporated — over live-generated
 * instances. Captured spine items are SPECS ONLY: the generators below derive
 * a FRESH instance per call from the spec's scope (vocab pool, parsed forms,
 * grammar topics) and never copy the captured prompt text verbatim.
 *
 * Determinism: NO net-new randomness beyond the existing machinery — every
 * generator draws through ONE mulberry32(hashString(seed)) stream built from
 * the Book-1 seed chain, `phase|sectionId|UTC-date|batch:n|spec:<id>` (the ctx
 * carries the prefix; the registry appends the spec id). Same (spec, ctx) →
 * byte-identical output; a different batch/date → a fresh instance.
 *
 * No LLM calls, no I/O, no JSX — pure TypeScript. `generateForSpec` returns []
 * whenever the scope lacks the material an instance needs (never fabricate):
 * the caller falls back to the existing template builders, exactly as Book 1
 * does today.
 */

import type { ExerciseSpec, SpecForm, SpecKind } from "~/engine/exerciseSpec";
import type { GeneratedExercise } from "~/engine/fallbackGenerator";
import type { GrammarTopic } from "~/data/grammarIndex";
import type { VocabularyItem } from "~/data/latinLessons";
import { normalizeAnswer } from "~/engine/answers";
import { hashString, mulberry32 } from "~/engine/seededRandom";

/** Everything a generator may draw from — built ONCE per (section, phase,
 *  batch) by the session layer and handed to every spec of the batch. */
export interface GeneratorContext {
  /** The section's own printed vocabulary (the taught/memorized universe). */
  sectionVocab: VocabularyItem[];
  /** Vocabulary of PRIOR captured sections — widens the pool, already bounded
   *  by the never-demand-untaught gate (prior sections only). */
  priorVocab?: VocabularyItem[];
  /** The bounded learned-universe pool (Book-1 course), when supplied. */
  boundWords?: VocabularyItem[];
  /** GRAMMAR_INDEX topics this section trains (GRAMMAR_REFS, resolved). */
  topics?: GrammarTopic[];
  /** Topics beyond this section for constructions-recall foils — known
   *  material only (the spine's own topic universe). */
  distractorTopics?: GrammarTopic[];
  /** Seed-chain prefix: `phase|sectionId|UTC-date|batch:n`. */
  seedBase: string;
}

export type SpecGenerator = (
  spec: ExerciseSpec,
  ctx: GeneratorContext,
) => GeneratedExercise[];

/** The seed for one spec's stream: `phase|sectionId|UTC-date|batch:n|spec:<id>`
 *  — mirrors Book 1's run-seed + batch chain, one stream per spec. */
export function specSeed(spec: ExerciseSpec, ctx: GeneratorContext): string {
  return `${ctx.seedBase}|spec:${spec.id}`;
}

// ── Small seeded utilities (no Math.random anywhere) ──────────────────────

/** Deterministic seeded stream for one spec call. */
function rngFor(spec: ExerciseSpec, ctx: GeneratorContext): () => number {
  return mulberry32(hashString(specSeed(spec, ctx)));
}

/** Uniform seeded pick (caller guarantees a non-empty array). */
function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Seeded sample of n distinct elements (fewer when the pool runs dry). */
function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/** Seeded rotation — puts the correct option away from index 0. */
function rotated<T>(arr: T[], rng: () => number): T[] {
  const rot = Math.floor(rng() * arr.length);
  return [...arr.slice(rot), ...arr.slice(0, rot)];
}

/** Remove macrons/combining marks (ā → a) — the standard accepted variant. */
function stripMacrons(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Superscript footnote digits the printed headwords/glosses carry. */
function stripFootnotes(s: string): string {
  return s.replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]/g, "");
}

/** The printed gloss cleaned for an answer/foil: braces stripped, trimmed. */
function cleanGloss(english: string): string {
  return english.replace(/[{}]/g, "").trim();
}

/** Alternate glosses: the printed alternates split on " / " also count. */
function glossAlternates(gloss: string): string[] {
  const out = [gloss];
  for (const part of gloss.split(/\s*\/\s*/)) {
    const p = part.trim();
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

// ── Pools ─────────────────────────────────────────────────────────────────

/** The raw vocab pool a ctx offers: section, then prior, then Book-1 bound. */
function poolOf(ctx: GeneratorContext): VocabularyItem[] {
  return [...ctx.sectionVocab, ...(ctx.priorVocab ?? []), ...(ctx.boundWords ?? [])];
}

/** poolOf deduped by the shared word identity (normalizeAnswer over latin). */
function poolDeduped(ctx: GeneratorContext): VocabularyItem[] {
  const seen = new Set<string>();
  const out: VocabularyItem[] = [];
  for (const v of poolOf(ctx)) {
    const key = normalizeAnswer(stripFootnotes(v.latin));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** The spec-narrowed slice of a pool (empty → the whole pool). */
function scopeOf(
  spec: ExerciseSpec,
  pool: VocabularyItem[],
): VocabularyItem[] {
  const lemmas = (spec.vocabScope?.lemmas ?? []).map((l) =>
    normalizeAnswer(stripFootnotes(l)),
  );
  if (lemmas.length === 0) return pool;
  const narrowed = pool.filter((v) => lemmas.includes(normalizeAnswer(stripFootnotes(v.latin))));
  return narrowed.length > 0 ? narrowed : pool;
}

// ── vocab-recall ──────────────────────────────────────────────────────────
/**
 * A fresh vocabulary recall over the section's scope: seeded L→E or E→L
 * multiple choice (or a fill when the pool is too small for foils). The
 * captured "Give one English meaning" items train exactly this skill; the
 * word drilled, the direction and the foils are re-drawn per seed.
 */
const genVocabRecall: SpecGenerator = (spec, ctx) => {
  const pool = poolDeduped(ctx);
  if (pool.length === 0) return [];
  const rng = rngFor(spec, ctx);
  const entry = pick(scopeOf(spec, pool), rng);
  const toEnglish =
    (spec.params?.direction ?? (rng() < 0.5 ? "l2e" : "e2l")) === "l2e";
  const gloss = cleanGloss(entry.english);
  const latin = stripFootnotes(entry.latin);
  if (!gloss || !latin) return [];

  const foilValues = pool
    .filter((v) => v !== entry)
    .map((v) => (toEnglish ? cleanGloss(v.english) : stripFootnotes(v.latin)))
    .filter((v) => {
      if (!v) return false;
      const answer = toEnglish ? gloss : latin;
      return normalizeAnswer(v) !== normalizeAnswer(answer);
    });
  const foils = pickN([...new Set(foilValues)], 3, rng);
  if (foils.length >= 3) {
    const correct = toEnglish ? gloss : latin;
    const options = rotated([correct, ...foils], rng);
    return [{
      type: "multiple-choice",
      prompt: toEnglish
        ? `What does "${latin}" mean?`
        : `Which Latin word means "${gloss}"?`,
      options,
      correctIndex: options.indexOf(correct),
      explanation: `"${latin}" — ${entry.english}.`,
    }];
  }
  return [{
    type: "fill-in-blank",
    prompt: toEnglish
      ? `Give one English meaning of "${latin}": ___`
      : `Give the Latin word for "${gloss}": ___`,
    answer: toEnglish ? gloss : latin,
    acceptableAnswers: toEnglish ? glossAlternates(gloss) : [latin, stripMacrons(latin)],
    explanation: `"${latin}" — ${entry.english}.`,
  }];
};

// ── form-drill ────────────────────────────────────────────────────────────
/**
 * A fresh form drill from the spec's parsed forms: a seeded case/number of
 * the lemma (one random demand per instance instead of the book's full
 * recitation), or a seeded derivation (adjective → adverb). Never copies the
 * captured recipe prompt.
 */
const genFormDrill: SpecGenerator = (spec, ctx) => {
  const forms: SpecForm[] = spec.params?.forms ?? [];
  if (forms.length === 0) return [];
  const rng = rngFor(spec, ctx);
  const f = pick(forms, rng);
  if (!f.form) return [];
  const acceptable = [f.form, stripMacrons(f.form)].filter(
    (v, i, a) => v && a.indexOf(v) === i,
  );
  if (f.kind === "formation") {
    if (!f.from) return [];
    return [{
      type: "fill-in-blank",
      prompt: `Give the adverb formed from the adjective "${stripFootnotes(f.from)}": ___`,
      answer: f.form,
      acceptableAnswers: acceptable,
      explanation: `"${f.form}" is the adverb from "${stripFootnotes(f.from)}"${
        f.note ? ` (${f.note})` : ""
      }.`,
    }];
  }
  const lemma = spec.vocabScope?.lemmas?.[0] ?? f.lemma ?? "";
  if (!f.case || !f.number || !lemma) return [];
  return [{
    type: "fill-in-blank",
    prompt: `Give the ${f.case} ${f.number} of "${stripFootnotes(lemma)}": ___`,
    answer: f.form,
    acceptableAnswers: acceptable,
    explanation: `"${f.form}" is the ${f.case} ${f.number} of "${stripFootnotes(lemma)}"${
      f.note ? ` (${f.note})` : ""
    }.`,
  }];
};

// ── translate-l2e / translate-e2l ─────────────────────────────────────────
/**
 * A fresh translation drill at word/phrase level over the section's scope.
 * The captured sentence translations train sentence-level skill; without a
 * morphological engine the honest fresh instance drills the section's OWN
 * vocabulary in the captured direction — which entry is drilled is re-drawn
 * per seed. Sentence-level fresh instances arrive with the paradigm engine;
 * this registry slot is the seam.
 */
const genTranslateL2E: SpecGenerator = (spec, ctx) =>
  translateInstance(spec, ctx, "l2e");

const genTranslateE2L: SpecGenerator = (spec, ctx) =>
  translateInstance(spec, ctx, "e2l");

function translateInstance(
  spec: ExerciseSpec,
  ctx: GeneratorContext,
  kindDirection: "l2e" | "e2l",
): GeneratedExercise[] {
  const pool = poolDeduped(ctx);
  if (pool.length === 0) return [];
  const rng = rngFor(spec, ctx);
  const entry = pick(scopeOf(spec, pool), rng);
  const gloss = cleanGloss(entry.english);
  const latin = stripFootnotes(entry.latin);
  if (!gloss || !latin) return [];
  const direction = spec.params?.direction ?? kindDirection;
  if (direction === "l2e") {
    return [{
      type: "fill-in-blank",
      prompt: `Translate into English: ${latin}.`,
      answer: gloss,
      acceptableAnswers: glossAlternates(gloss),
      explanation: `"${latin}" — ${entry.english}.`,
    }];
  }
  return [{
    type: "fill-in-blank",
    prompt: `Translate into Latin: ${gloss}`,
    answer: latin,
    acceptableAnswers: [latin, stripMacrons(latin)],
    explanation: `"${gloss}" — ${latin}.`,
  }];
}

// ── parse ─────────────────────────────────────────────────────────────────
/**
 * A fresh recognition drill over the spec's parsed forms: given an inflected
 * form, identify its case and number. The captured "pick out the reflexive
 * pronoun" items train analysis; the fresh instance analyzes a seeded form
 * from the section's parsed paradigm inventory.
 */
const genParse: SpecGenerator = (spec, ctx) => {
  const forms: SpecForm[] = spec.params?.forms ?? [];
  if (forms.length === 0) return [];
  const rng = rngFor(spec, ctx);
  const f = pick(forms, rng);
  if (!f.form || !f.case || !f.number) return [];
  const lemma = f.lemma ?? spec.vocabScope?.lemmas?.[0] ?? "";
  if (!lemma) return [];
  const correct = `${f.case} ${f.number}`;
  const otherLabels = forms
    .filter((x) => x !== f && x.case && x.number)
    .map((x) => `${x.case} ${x.number}`);
  const foils = pickN(
    [...new Set(otherLabels)].filter((l) => l !== correct),
    3,
    rng,
  );
  if (foils.length < 3) return [];
  const options = rotated([correct, ...foils], rng);
  return [{
    type: "multiple-choice",
    prompt: `The form "${f.form}" is the ______ of "${stripFootnotes(lemma)}".`,
    options,
    correctIndex: options.indexOf(correct),
    explanation: `"${f.form}" is the ${correct} of "${stripFootnotes(lemma)}"${
      f.note ? ` (${f.note})` : ""
    }.`,
  }];
};

// ── imitate ───────────────────────────────────────────────────────────────
/** A construction in scope: a word that governs one specific case. */
export interface ConstructionEntry {
  latin: string;
  governedCase: string;
  english: string;
}

const CASE_NAMES: Record<string, string> = {
  abl: "ablative",
  acc: "accusative",
  gen: "genitive",
  dat: "dative",
};

/**
 * Case-government entries in a vocab pool: prepositions typed "prep. w. abl."
 * etc., and verbs/words whose gloss opens "w. dat. {…" / "w. gen. = …".
 * Single-construction entries only — alternating or compound constructions
 * ("w. dat. or ad w. acc.") are skipped, never guessed. Entries whose Latin
 * string carries DIFFERENT cases in the pool (sub w. abl / w. acc) are
 * dropped as ambiguous.
 */
export function constructionEntries(pool: VocabularyItem[]): ConstructionEntry[] {
  const found: ConstructionEntry[] = [];
  for (const v of pool) {
    let governedCase: string | null = null;
    const t = (v.type ?? "").trim();
    const mType = /^prep\.\s*w\.\s*(abl|acc|gen)\.?$/i.exec(t);
    if (mType) {
      governedCase = CASE_NAMES[mType[1].toLowerCase()];
    } else {
      const mGloss = /^w\.\s*(abl|acc|gen|dat)\.\s*[{=]/.exec(v.english.trim());
      if (mGloss) governedCase = CASE_NAMES[mGloss[1].toLowerCase()];
    }
    if (!governedCase) continue;
    found.push({ latin: stripFootnotes(v.latin), governedCase, english: v.english });
  }
  const casesByLatin = new Map<string, Set<string>>();
  for (const e of found) {
    const key = normalizeAnswer(e.latin);
    const set = casesByLatin.get(key) ?? new Set<string>();
    set.add(e.governedCase);
    casesByLatin.set(key, set);
  }
  return found.filter((e) => casesByLatin.get(normalizeAnswer(e.latin))!.size === 1);
}

const GOVERNED_CASES = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "ablative",
];

/**
 * A fresh case-government production drill: the section's constructions put a
 * word in a specific case (propter + accusative, cum + ablative, studeō +
 * dative); the instance asks which case a SEEDED construction demands. The
 * captured "complete the Latin" items train exactly this production.
 */
const genImitate: SpecGenerator = (spec, ctx) => {
  const entries = constructionEntries(poolOf(ctx));
  if (entries.length === 0) return [];
  const rng = rngFor(spec, ctx);
  const e = pick(entries, rng);
  const foils = pickN(
    GOVERNED_CASES.filter((c) => c !== e.governedCase),
    3,
    rng,
  );
  if (foils.length < 3) return [];
  const options = rotated([e.governedCase, ...foils], rng);
  return [{
    type: "multiple-choice",
    prompt: `Which case does "${e.latin}" take?`,
    options,
    correctIndex: options.indexOf(e.governedCase),
    explanation: `"${e.latin}" governs the ${e.governedCase} — ${e.english}.`,
  }];
};

// ── constructions-recall ──────────────────────────────────────────────────
/**
 * A fresh constructions-recall MC: which construction does this description
 * belong to. The scope is the section's GRAMMAR_REFS topics (the section's
 * own grammar program); foils come from other KNOWN spine topics only.
 */
const genConstructionsRecall: SpecGenerator = (spec, ctx) => {
  const topics = ctx.topics ?? [];
  if (topics.length === 0) return [];
  const rng = rngFor(spec, ctx);
  const topic = pick(topics, rng);
  const foilNames = [...new Set((ctx.distractorTopics ?? []).map((t) => t.topic))].filter(
    (n) => n !== topic.topic,
  );
  const foils = pickN(foilNames, 3, rng);
  if (foils.length < 3) return [];
  const options = rotated([topic.topic, ...foils], rng);
  return [{
    type: "multiple-choice",
    prompt: `Which Latin construction is being described? ${topic.definition}`,
    options,
    correctIndex: options.indexOf(topic.topic),
    explanation: `${topic.topic} (${topic.henleGrammarRef}) — ${topic.definition}`,
  }];
};

// ── Registry + dispatch ───────────────────────────────────────────────────

/**
 * One deterministic generator per SpecKind. Each call derives ONE fresh
 * instance (wrapped in an array) from the spec's scope, or [] when the scope
 * lacks the material — the caller falls back to the existing template
 * builders, never fabricates.
 */
export const GENERATORS: Record<SpecKind, SpecGenerator> = {
  "vocab-recall": genVocabRecall,
  "form-drill": genFormDrill,
  "translate-l2e": genTranslateL2E,
  "translate-e2l": genTranslateE2L,
  parse: genParse,
  imitate: genImitate,
  "constructions-recall": genConstructionsRecall,
};

/** Dispatch one spec to its generator (unknown kinds → []). */
export function generateForSpec(
  spec: ExerciseSpec,
  ctx: GeneratorContext,
): GeneratedExercise[] {
  const gen = GENERATORS[spec.kind];
  return gen ? gen(spec, ctx) : [];
}
