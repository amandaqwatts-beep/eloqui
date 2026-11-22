/**
 * generators.test.ts — Engine verification for the spec-driven generator
 * registry and the Book-2 section adapter (PR-A of the four-phase wrap).
 *
 * Covers:
 *   - registry completeness (one deterministic generator per SpecKind)
 *   - adapter coverage: all 16 captured spine sections, all 1,176 captured
 *     items classified with ids preserved, derived section specs where the
 *     data supports them, no numeric (English 2000-range) ids
 *   - at least one REAL Book-2 spec per kind generating a valid instance that
 *     the existing scorers (checkFillInBlank / checkMultipleChoice) accept
 *   - seed determinism (same seed byte-identical; a new date re-draws)
 *   - the doctrine gates: never the captured prompt verbatim, never material
 *     from untaught (later) sections, [] on empty scope — never fabricate
 *
 * Self-contained (no bun:test import) so `tsc --noEmit` stays at its 7-error
 * baseline. Run with:
 *   bun src/engine/generators.test.ts
 */

import { SPEC_KINDS, type ExerciseSpec } from "~/engine/exerciseSpec";
import {
  GENERATORS,
  generateForSpec,
  specSeed,
  type GeneratorContext,
} from "~/engine/generators";
import {
  latin2SectionGenerationContext,
  latin2SectionSpecs,
  latin2SpineSpecs,
} from "~/engine/latin2SectionSpecs";
import {
  LATIN2_SECTION_EXERCISES,
} from "~/data/latin2";
import {
  checkFillInBlank,
  checkMultipleChoice,
} from "~/engine/answers";

// ── Tiny harness (mirrors the other engine tests) ────────────────────────
let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`(pass) ${name}`);
  } catch (e) {
    failed++;
    console.error(`(fail) ${name}`);
    console.error(e);
  }
}
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
function eq<T>(actual: T, expected: T, msg?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg ?? "assertion"}: expected ${b}, got ${a}`);
}

const FROZEN_DATE = "2026-11-21";
function ctxFor(sectionId: string, batch = 0, date = FROZEN_DATE): GeneratorContext {
  return latin2SectionGenerationContext(sectionId, {
    phase: "quizzed",
    date,
    batch,
  });
}

const DERIVED_SUFFIX = /-(constructions|parse|imitate)$/;
const allSections = latin2SpineSpecs();
const allSpecs: { sectionId: string; spec: ExerciseSpec }[] = allSections.flatMap(
  ({ sectionId, specs }) => specs.map((spec) => ({ sectionId, spec })),
);

// ── 1. Registry completeness ─────────────────────────────────────────────
test("registry: one generator per SpecKind, no extras", () => {
  eq([...SPEC_KINDS].sort(), Object.keys(GENERATORS).sort(), "kinds covered");
  for (const kind of SPEC_KINDS) {
    ok(typeof GENERATORS[kind] === "function", `generator for ${kind}`);
  }
});

test("seed chain: `seedBase|spec:<id>`", () => {
  const { spec } = allSpecs[0];
  const ctx = ctxFor(allSpecs[0].sectionId, 3);
  eq(
    specSeed(spec, ctx),
    `${ctx.seedBase}|spec:${spec.id}`,
    "spec seed appended to the batch chain",
  );
});

// ── 2. Adapter coverage over the real spine ──────────────────────────────
test("adapter: 16 captured spine sections, 1,176 captured items, zero skip", () => {
  eq(allSections.length, 16, "spine sections");
  let captured = 0;
  for (const [sid, arr] of Object.entries(LATIN2_SECTION_EXERCISES)) {
    captured += arr.length;
    const specs = latin2SectionSpecs(sid);
    const itemSpecs = specs.filter((s) => !DERIVED_SUFFIX.test(s.id));
    eq(itemSpecs.length, arr.length, `every captured item yields a spec (${sid})`);
    const itemIds = arr.map((e) => (e as { id: string }).id).sort();
    eq(itemSpecs.map((s) => s.id).sort(), itemIds, `capture ids preserved (${sid})`);
  }
  eq(captured, 1176, "recorded spine item count");
});

test("adapter: derived section specs only where data supports them", () => {
  for (const { sectionId, specs } of allSections) {
    const derived = specs.filter((s) => DERIVED_SUFFIX.test(s.id)).map((s) => s.id);
    ok(
      derived.includes(`${sectionId}-constructions`),
      `${sectionId} has a constructions-recall spec`,
    );
    for (const d of derived) {
      ok(d === `${sectionId}-constructions` || d === `${sectionId}-parse` || d === `${sectionId}-imitate`, `derived id shape: ${d}`);
    }
  }
  const kinds = new Set(allSpecs.map(({ spec }) => spec.kind));
  for (const kind of SPEC_KINDS) {
    ok(kinds.has(kind), `spine carries at least one ${kind} spec`);
  }
});

test("adapter: string ids only — no numeric/2000-range collisions", () => {
  const ids = new Set<string>();
  for (const { spec } of allSpecs) {
    ok(!/^\d+$/.test(spec.id), `non-numeric spec id: ${spec.id}`);
    ok(!ids.has(spec.id), `unique spec id: ${spec.id}`);
    ids.add(spec.id);
  }
});

test("adapter: every spec carries topicIds + latin2 provenance", () => {
  for (const { spec } of allSpecs) {
    eq(spec.provenance.book, "latin2", `provenance book (${spec.id})`);
    ok((spec.topicIds ?? []).length > 0, `topicIds present (${spec.id})`);
  }
});

// ── 3. Parsed forms (the form-drill family's ground truth) ──────────────
test("forms: sy-e1-q1 parses gen. sg. clāmōris; notes parse where printed", () => {
  const spec = allSpecs.find(({ spec: s }) => s.id === "sy-e1-q1")!.spec;
  eq(spec.kind, "form-drill", "flashcard → form-drill");
  eq(spec.vocabScope?.lemmas, ["clāmor"], "front preserved as the lemma");
  const forms = spec.params?.forms ?? [];
  const genSg = forms.find((f) => f.case === "genitive" && f.number === "singular");
  ok(!!genSg, "genitive singular parsed");
  eq(genSg!.form, "clāmōris", "form verbatim");
  // Covering-rule notes ride along where the capture prints one (e.g. the
  // §62a note on frātrum in sy-e1-q4).
  const q4 = allSpecs.find(({ spec: s }) => s.id === "sy-e1-q4")!.spec;
  ok((q4.params?.forms ?? []).some((f) => !!f.note), "a covering-rule note parses");
});

test("forms: ≥60 flashcards across the spine parse into usable forms", () => {
  let parsed = 0;
  for (const { spec } of allSpecs) {
    if (spec.kind === "form-drill" && (spec.params?.forms ?? []).length > 0) parsed++;
  }
  ok(parsed >= 60, `expected ≥60 parsed form-drill specs, got ${parsed}`);
});

// ── 4. Per-kind live generation on real Book-2 specs ────────────────────
function firstGeneration(kind: string): {
  sectionId: string;
  spec: ExerciseSpec;
  items: ReturnType<typeof generateForSpec>;
} | null {
  for (const { sectionId, spec } of allSpecs) {
    if (spec.kind !== kind) continue;
    const items = generateForSpec(spec, ctxFor(sectionId));
    if (items.length > 0) return { sectionId, spec, items };
  }
  return null;
}

function validateMc(item: { options?: string[]; correctIndex?: number }) {
  const options = item.options ?? [];
  eq(options.length, 4, "MC has 4 options");
  ok(new Set(options).size === options.length, "MC options are distinct");
  const idx = item.correctIndex ?? -1;
  ok(idx >= 0 && idx < options.length, "correctIndex in range");
  ok(checkMultipleChoice(idx, idx), "correct option scores correct");
  ok(!checkMultipleChoice((idx + 1) % options.length, idx), "wrong option scores incorrect");
}

function validateFill(item: { answer?: string; acceptableAnswers?: string[] }) {
  const answer = item.answer ?? "";
  ok(answer.length > 0, "fill answer non-empty");
  const acceptable = item.acceptableAnswers ?? [];
  ok(checkFillInBlank(answer, answer, acceptable), "answer scores correct");
  ok(!checkFillInBlank("qqzzwwx", answer, acceptable), "nonsense scores incorrect");
}

test("every kind generates a valid, scoreable instance from a real spec", () => {
  for (const kind of SPEC_KINDS) {
    const found = firstGeneration(kind);
    ok(!!found, `${kind}: at least one real spec generates`);
    for (const item of found!.items) {
      ok(item.prompt.length > 0, `${kind}: prompt non-empty`);
      if (item.type === "multiple-choice") validateMc(item);
      else if (item.type === "fill-in-blank") validateFill(item);
      else throw new Error(`${kind}: unexpected generated type ${item.type}`);
    }
  }
});

test("imitate generates from real case-government vocab (prep. w. abl / w. dat.)", () => {
  const found = firstGeneration("imitate")!;
  const item = found!.items[0];
  ok(/Which case does "/.test(item.prompt), "asks the governing case");
  for (const c of ["ablative", "accusative", "genitive", "dative", "nominative"]) {
    ok(!item.prompt.includes(c), "the answer case must not leak into the prompt");
  }
  validateMc(item);
});

test("form-drill prompts ask a single seeded case/number, never the book's recipe", () => {
  const l01 = allSections[0].specs;
  let seen = 0;
  for (const spec of l01) {
    if (spec.kind !== "form-drill" || (spec.params?.forms ?? []).length === 0) continue;
    const [item] = generateForSpec(spec, ctxFor(allSections[0].sectionId));
    ok(!!item, "generates");
    ok(/^Give the (nominative|genitive|dative|accusative|ablative) (singular|plural) of "/.test(item!.prompt), `fresh single-demand prompt: ${item!.prompt}`);
    ok(!item!.prompt.includes("SY "), "no book-reference text");
    if (++seen >= 5) break;
  }
  ok(seen >= 5, "enough parsed form drills to sample");
});

// ── 5. Determinism ───────────────────────────────────────────────────────
test("determinism: same (spec, ctx) → byte-identical instance", () => {
  const { sectionId, spec } = allSpecs.find(({ spec: s }) => s.kind === "translate-l2e")!;
  const ctx = ctxFor(sectionId, 0);
  eq(JSON.stringify(generateForSpec(spec, ctx)), JSON.stringify(generateForSpec(spec, ctx)), "identical output");
});

test("determinism: a new UTC date re-draws fresh instances", () => {
  const { sectionId, spec } = allSpecs.find(({ spec: s }) => s.kind === "translate-l2e")!;
  const a: string[] = [];
  const b: string[] = [];
  for (let batch = 0; batch < 10; batch++) {
    a.push(JSON.stringify(generateForSpec(spec, ctxFor(sectionId, batch, "2026-11-21"))));
    b.push(JSON.stringify(generateForSpec(spec, ctxFor(sectionId, batch, "2026-11-22"))));
  }
  ok(JSON.stringify(a) !== JSON.stringify(b), "date change → fresh instances");
});

// ── 6. Doctrine gates ────────────────────────────────────────────────────
test("never verbatim: no generated prompt equals a captured prompt", () => {
  for (const sectionId of ["part4-l03-indicative-questions", "part4-l12-comparison-quam"]) {
    const capturedPrompts = new Set(
      (LATIN2_SECTION_EXERCISES[sectionId] ?? []).map((e) => (e as { prompt: string }).prompt),
    );
    for (const spec of latin2SectionSpecs(sectionId)) {
      for (const item of generateForSpec(spec, ctxFor(sectionId))) {
        ok(!capturedPrompts.has(item.prompt), `fresh prompt, not the captured one (${spec.id})`);
        ok(!/SY /.test(item.prompt), `no book-reference text (${spec.id}): ${item.prompt}`);
      }
    }
  }
});

test("never untaught: instances draw only from this-and-prior section vocab", () => {
  const sectionId = "part4-l03-indicative-questions";
  const ctx = ctxFor(sectionId);
  const pool = [...ctx.sectionVocab, ...(ctx.priorVocab ?? [])];
  const strip = (s: string) => s.replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]/g, "");
  const glosses = new Set(
    pool.map((v) =>
      v.english
        .replace(/[{}]/g, "")
        .replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]/g, "")
        .trim(),
    ),
  );
  const latins = new Set(pool.map((v) => strip(v.latin)));
  const specs = latin2SectionSpecs(sectionId).filter(
    (s) => s.kind === "vocab-recall" || s.kind === "translate-l2e" || s.kind === "translate-e2l",
  );
  ok(specs.length > 0, "recall/translate specs exist in l03");
  for (const spec of specs) {
    for (const item of generateForSpec(spec, ctx)) {
      const values =
        item.type === "multiple-choice" ? (item.options ?? []) : [item.answer ?? ""];
      ok(values.length > 0, `instance emitted (${spec.id})`);
      const asksEnglish =
        item.prompt.startsWith("What does") ||
        item.prompt.startsWith("Give one English meaning") ||
        item.prompt.startsWith("Translate into English");
      const universe = asksEnglish ? glosses : latins;
      for (const v of values) {
        ok(universe.has(v), `drawn from the bounded pool (${spec.id}): ${v}`);
      }
    }
  }
});

test("empty scope → [] (never fabricate)", () => {
  const supply = allSpecs.find(({ spec }) => spec.id === "sy-e8-q1");
  ok(!!supply, "hic/is/ille supply item captured as a spec");
  eq(supply!.spec.kind, "form-drill", "supply items classify form-drill");
  eq(generateForSpec(supply!.spec, ctxFor(supply!.sectionId)), [], "no parsed forms → no instance");
  const vocabSpec = allSpecs.find(({ spec }) => spec.kind === "vocab-recall")!;
  const emptyCtx: GeneratorContext = { sectionVocab: [], seedBase: "x|y|z|batch:0" };
  eq(generateForSpec(vocabSpec.spec, emptyCtx), [], "empty pool → no instance");
});

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
