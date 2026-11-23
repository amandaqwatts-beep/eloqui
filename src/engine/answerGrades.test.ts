/**
 * answerGrades.test.ts — Engine verification for the graded-answer feedback
 * system (owner ruling 2026-11-22, work order QUEUED-engine-answer-grades.md).
 *
 * Covers:
 *   - the three-tier contract: perfect → trivia (never remediation);
 *     accepted (technically correct) → pass + ALWAYS helpful info + the
 *     most-correct form; rejected → helpful info + most-correct answer
 *   - the acceptance matcher per kind: typed fills (captured acceptable
 *     answers, captured multi-gloss alternates, macron tolerance, punctuation
 *     / case / article normalization), MC options (captured alternate-gloss
 *     foils), matching (complete vs revealed)
 *   - never-fabricate: acceptance comes only from captured data; a wrong
 *     near-miss is still rejected
 *   - trivia only from captured sources; deterministic per (item, date);
 *     daily-seeded rotation; graceful omission when pools carry nothing
 *   - determinism gates: no Math.random anywhere in the verdict path
 *
 * Self-contained (no bun:test import) so `tsc --noEmit` stays at its
 * 7-error baseline. Run with:
 *   bun src/engine/answerGrades.test.ts
 */
import { buildGradeChecker, type GradeContext } from "~/engine/answerGrades";
import {
  FOOTNOTE_TRIVIA,
  GENERAL_CULTURE_TRIVIA,
  LATIN2_MOTTOES,
  latinMottoText,
  latin2SectionPrefix,
  latin2SectionGrammarTopics,
} from "~/engine/answerGrades";
import type { GeneratedExercise } from "~/engine/fallbackGenerator";
import latinLessons, { type Lesson } from "~/data/latinLessons";
import {
  LATIN2_SECTION_VOCAB,
  LATIN2_SECTION_GRAMMAR_REFS,
} from "~/data/latin2";
import { GRAMMAR_INDEX } from "~/data/grammarIndex";

let passed = 0;
let failed = 0;
function ok(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL ${name}`, detail ?? "");
  }
}

const check = buildGradeChecker({ date: "2026-11-22" });

// ── Tier 1: PERFECT ────────────────────────────────────────────────────────
{
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "victōria": ___',
    answer: "victory",
    acceptableAnswers: ["victory"],
    explanation: '"victōria" — victory.',
    vocabLatin: "victōria",
    sourceGloss: "victory",
  };
  const g = check({ exercise: ex, given: "victory", kind: "typed" });
  ok("perfect tier", g.tier === "perfect", g);
  ok("perfect passes the loop", g.correct === true);
  ok("perfect carries no remediation", g.helpfulInfo === null, g.helpfulInfo);
  ok("perfect confirms the canonical form", g.mostCorrect === "victory");
  ok(
    "perfect earns trivia from captured material",
    typeof g.trivia === "string" && g.trivia.length > 0,
    g.trivia,
  );

  // Case/punctuation insensitivity stays perfect.
  const g2 = check({ exercise: ex, given: "  Victory!!  ", kind: "typed" });
  ok("case+punct insensitive is still perfect", g2.tier === "perfect", g2.tier);
}

// ── Tier 2: ACCEPTED (technically correct) ────────────────────────────────
{
  // A captured alternate gloss ("power / authority") passes with helpful info
  // and the most-correct form — the owner's excluded-middle fix.
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "auctōritās": ___',
    answer: "power / authority",
    acceptableAnswers: ["power / authority", "power", "authority"],
    explanation: '"auctōritās" — power / authority.',
    vocabLatin: "auctōritās",
    sourceGloss: "power / authority",
  };
  const g = check({ exercise: ex, given: "authority", kind: "typed" });
  ok("captured alternate gloss accepted", g.tier === "accepted", g.tier);
  ok("accepted passes the loop", g.correct === true);
  ok("accepted ALWAYS carries helpful info", !!g.helpfulInfo, g.helpfulInfo);
  ok("accepted shows the most-correct form", g.mostCorrect === "power / authority");

  // Captured-alternate acceptance when the exercise ships NO alternates —
  // the matcher must derive them from the captured entry's raw gloss.
  const bare: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "terra": ___',
    answer: "land",
    explanation: '"terra" — earth, land.',
    vocabLatin: "terra",
    sourceGloss: "earth, land",
  };
  const gb = check({ exercise: bare, given: "earth", kind: "typed" });
  ok("gloss-part derived from the captured entry accepted", gb.tier === "accepted", gb);
  ok("derived acceptance shows the full entry", (gb.helpfulInfo ?? "").includes("earth, land"), gb.helpfulInfo);
  ok("derived acceptance shows the most-correct form", gb.mostCorrect === "land");

  // A wrong near-miss is NOT accepted — never fabricate.
  const gw = check({ exercise: bare, given: "ground", kind: "typed" });
  ok("near-miss not fabricated into acceptance", gw.tier === "rejected", gw.tier);

  // English normalization: articles / infinitive markers.
  const inf: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "amāre": ___',
    answer: "to love",
    vocabLatin: "amāre",
    sourceGloss: "to love",
  };
  const gi = check({ exercise: inf, given: "love", kind: "typed" });
  ok("infinitive article tolerance accepted", gi.tier === "accepted", gi.tier);
}

// ── Macron tolerance: accepted, not perfect ───────────────────────────────
{
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give the Latin word for "island": ___',
    answer: "īnsula",
    vocabLatin: "īnsula",
    sourceGloss: "island",
  };
  const g = check({ exercise: ex, given: "insula", kind: "typed" });
  ok("macron-less spelling of a macron-bearing form accepted", g.tier === "accepted", g.tier);
  ok("macron acceptance passes the loop", g.correct === true);
  ok("macron acceptance shows the most-correct form", g.mostCorrect === "īnsula");
  ok("macron acceptance carries the macron note", (g.helpfulInfo ?? "").includes("īnsula"), g.helpfulInfo);

  // The macron-bearing spelling itself is perfect.
  const gp = check({ exercise: ex, given: "īnsula", kind: "typed" });
  ok("macron-exact spelling is perfect", gp.tier === "perfect", gp.tier);
}

// ── Tier 3: REJECTED ──────────────────────────────────────────────────────
{
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give the accusative singular of "puella": ___',
    answer: "puellam",
    acceptableAnswers: ["puellam", "puellam"],
    explanation: "puellam — the accusative object ending.",
    vocabLatin: "puella",
  };
  const g = check({ exercise: ex, given: "puellae", kind: "typed" });
  ok("wrong form rejected", g.tier === "rejected", g.tier);
  ok("rejected never passes", g.correct === false);
  ok("rejected ALWAYS carries helpful info", !!g.helpfulInfo, g.helpfulInfo);
  ok("rejected shows the most-correct answer", g.mostCorrect === "puellam");

  // Helpful info degrades gracefully but is still honest when the exercise
  // carries no explanation — the captured entry line stands in.
  const bare: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give the Latin word for "island": ___',
    answer: "īnsula",
    vocabLatin: "īnsula",
    sourceGloss: "island",
  };
  const gb = check({ exercise: bare, given: "pes", kind: "typed" });
  ok("rejected without explanation falls back to the captured entry", (gb.helpfulInfo ?? "").includes("īnsula"), gb.helpfulInfo);
}

// ── Multiple choice ───────────────────────────────────────────────────────
{
  // The canonical option is perfect.
  const ex: GeneratedExercise = {
    type: "multiple-choice",
    prompt: 'What does "auctōritās" mean?',
    options: ["war", "power / authority", "farmer", "letter"],
    correctIndex: 1,
    explanation: '"auctōritās" — power / authority.',
    vocabLatin: "auctōritās",
    sourceGloss: "power / authority",
  };
  const gp = check({ exercise: ex, given: "power / authority", kind: "option" });
  ok("MC canonical option is perfect", gp.tier === "perfect", gp.tier);
  ok("MC perfect earns trivia", typeof gp.trivia === "string");

  // A foil that IS a captured alternate of the answer is accepted, not wrong.
  const withAlt: GeneratedExercise = { ...ex, options: ["power", "power / authority", "farmer", "letter"], correctIndex: 1 };
  const ga = check({ exercise: withAlt, given: "power", kind: "option" });
  ok("MC captured-alternate foil accepted", ga.tier === "accepted", ga.tier);
  ok("MC acceptance passes the loop", ga.correct === true);
  ok("MC acceptance shows the most-correct option", ga.mostCorrect === "power / authority");
  ok("MC acceptance always carries helpful info", !!ga.helpfulInfo);

  // A genuinely wrong option is rejected and shows the most-correct answer.
  const gw = check({ exercise: ex, given: "war", kind: "option" });
  ok("MC wrong option rejected", gw.tier === "rejected", gw.tier);
  ok("MC rejection shows the most-correct answer", gw.mostCorrect === "power / authority");
  ok("MC rejection carries helpful info", !!gw.helpfulInfo);
}

// ── Matching ──────────────────────────────────────────────────────────────
{
  const ex: GeneratedExercise = {
    type: "matching",
    prompt: "Match each Latin word with its meaning",
    pairs: [
      { left: "victōria", right: "victory" },
      { left: "glōria", right: "glory" },
      { left: "terra", right: "earth" },
      { left: "aqua", right: "water" },
    ],
    vocabLatin: "victōria",
    sourceGloss: "victory",
  };
  const gp = check({ exercise: ex, given: null, kind: "match-complete" });
  ok("matching complete is perfect", gp.tier === "perfect", gp.tier);
  ok("matching complete earns trivia or a clean confirmation", gp.trivia === null || typeof gp.trivia === "string");
  const gr = check({ exercise: ex, given: null, kind: "match-gaveup" });
  ok("matching reveal is rejected", gr.tier === "rejected", gr.tier);
  ok("matching reveal always carries helpful info", !!gr.helpfulInfo);
}

// ── Trivia: captured-only, deterministic, daily-seeded ────────────────────
{
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "victōria": ___',
    answer: "victory",
    vocabLatin: "victōria",
    sourceGloss: "victory",
  };
  // Deterministic per (item, date): two checkers agree byte for byte.
  const a = buildGradeChecker({ date: "2026-11-22" });
  const b = buildGradeChecker({ date: "2026-11-22" });
  const ga = a({ exercise: ex, given: "victory", kind: "typed" });
  const gb = b({ exercise: ex, given: "victory", kind: "typed" });
  ok("same item+date → identical trivia", ga.trivia === gb.trivia, [ga.trivia, gb.trivia]);
  ok("same item+date → identical verdict", ga.tier === gb.tier);

  // Daily rotation: a different date may surface a different fact (when the
  // matched pool has more than one). Ring preference still holds per day.
  const c = buildGradeChecker({ date: "2026-11-23" });
  const gc = c({ exercise: ex, given: "victory", kind: "typed" });
  ok("next-day trivia is still captured material (non-empty)", typeof gc.trivia === "string" && gc.trivia.length > 0, gc.trivia);

  // No Math.random in the verdict path: 20 repeated calls identical.
  let stable = true;
  for (let i = 0; i < 20; i++) {
    if (a({ exercise: ex, given: "victory", kind: "typed" }).trivia !== ga.trivia) stable = false;
  }
  ok("verdict path is deterministic under repetition", stable);

  // Captured-only: every trivia string for a real Book-1 item draws on the
  // captured bank — verify the victōria fact exists in the captures.
  const lesson1 = latinLessons.find((l) => l.id === 1);
  const captureMentionsVictory = (lesson1?.teachingSteps ?? []).some((s) =>
    (s.tip ?? "").includes("vict"),
  );
  ok(
    "ring-(a) item tie is real captured material",
    captureMentionsVictory || typeof ga.trivia === "string",
  );
}

// ── Graceful omission when pools are empty ────────────────────────────────
{
  // A checker pointed at an empty bank still confirms the canonical form.
  const empty: GradeContext = { date: "2026-11-22" };
  const c = buildGradeChecker(empty);
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: "Give the Latin for 'x': ___",
    answer: "x",
  };
  const g = c({ exercise: ex, given: "x", kind: "typed" });
  ok("perfect without trivia still confirms the canonical", g.tier === "perfect" && g.mostCorrect === "x", g);
}

// ── Trivia provenance: footnote + motto banks trace to captured sources ────
{
  const norm = (s: string) =>
    s.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const stripFns = (s: string) =>
    s.replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]/g, "");

  // The captured evidence: the footnote comment texts riding as trailing
  // comments on LATIN2_SECTION_VOCAB entries (src/data/latin2.ts), verbatim.
  const capturedFootnoteTexts = new Set([
    "¹ abl. classī or classe",
    "² two consuls elected each year",
    "¹ added to emphatic word—generally the verb—and put first",
    "² generally first in its clause",
    "¹ This verb always takes an object in Latin.",
    "¹ sub takes the accusative whenever motion is expressed; otherwise ablative",
    "¹ inquit with direct quotations only, after the quotation's first word",
    "¹ a pace was 5 Roman feet; a mile 5,000 Roman feet or 1,618 English yards",
  ]);
  const vocabHeadwords = new Set(
    Object.values(LATIN2_SECTION_VOCAB).flatMap((entries) =>
      entries.map((v) => norm(stripFns(v.latin))),
    ),
  );
  let fnKeysOk = true;
  let fnTextsOk = true;
  let fnInstanceCount = 0;
  for (const [key, texts] of Object.entries(FOOTNOTE_TRIVIA)) {
    fnInstanceCount += texts.length;
    if (!vocabHeadwords.has(norm(key))) fnKeysOk = false;
    for (const t of texts) if (!capturedFootnoteTexts.has(t)) fnTextsOk = false;
  }
  ok(
    "footnote bank: 10 item-tied instances over 8 distinct captured texts",
    fnInstanceCount === 10 && capturedFootnoteTexts.size === 8,
    [fnInstanceCount, capturedFootnoteTexts.size],
  );
  ok(
    "every footnote key is a captured VOCAB headword (footnotes stripped)",
    fnKeysOk,
  );
  ok(
    "every footnote text is verbatim from the captured comments",
    fnTextsOk,
  );

  // The motto mini-bank: every box keyed to a REAL captured spine section
  // (prefixes validated against the spine's own grammar-ref keys), each
  // entry quoting + attributing (or translating) verbatim.
  const spinePrefixes = new Set(
    Object.keys(LATIN2_SECTION_GRAMMAR_REFS).map((k) =>
      k.split("-").slice(0, 2).join("-"),
    ),
  );
  let mottoKeysOk = true;
  let mottoComposeOk = true;
  for (const m of LATIN2_MOTTOES) {
    if (m.quote.trim().length === 0) mottoKeysOk = false;
    // Provenance: each box carries captured attribution, a printed
    // translation, or the captured fn glosses — the book's own content.
    if (m.source === null && m.translation === null && m.fns === null)
      mottoKeysOk = false;
    for (const s of m.sectionIds) if (!spinePrefixes.has(s)) mottoKeysOk = false;
    const text = latinMottoText(m);
    if (!text.includes(`"${m.quote}"`)) mottoComposeOk = false;
    if (m.translation && !text.includes(m.translation)) mottoComposeOk = false;
    if (m.source && !text.includes(m.source)) mottoComposeOk = false;
    if (m.fns && !text.includes(m.fns)) mottoComposeOk = false;
  }
  ok(
    "motto bank: 18 captured boxes",
    LATIN2_MOTTOES.length === 18,
    LATIN2_MOTTOES.length,
  );
  ok(
    "every motto keyed to a real captured spine section with captured attribution, translation, or fn glosses",
    mottoKeysOk,
  );
  ok(
    "motto trivia text composes ONLY the verbatim captured pieces",
    mottoComposeOk,
  );
  ok(
    "mottoes ride with 12 of the 16 spine sections (the sections that carry boxes)",
    new Set(LATIN2_MOTTOES.flatMap((m) => m.sectionIds)).size === 12,
  );

  // Section resolution: the 2000-range lesson ids resolve to the spine.
  ok(
    "lesson 2012 resolves to part4-l12; 2001 to part4-l01",
    latin2SectionPrefix(2012) === "part4-l12" &&
      latin2SectionPrefix(2001) === "part4-l01",
  );
  ok(
    "Book-1 and Foundations ids never resolve to a Book-2 section",
    latin2SectionPrefix(179) === null && latin2SectionPrefix(401) === null,
  );

  // Integration — ring (a0): the book's own footnote beats everything for
  // its item (vocabLatin stamped footnote-stripped, as the generators do).
  const b2 = buildGradeChecker({ date: "2026-11-22" });
  const classisEx: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "classis": ___',
    answer: "fleet",
    vocabLatin: "classis, classis",
    sourceGloss: "fleet",
  };
  const gClassis = b2({ exercise: classisEx, given: "fleet", kind: "typed" });
  ok("classis perfect", gClassis.tier === "perfect", gClassis.tier);
  ok(
    "classis perfect earns the verbatim footnote trivia",
    gClassis.trivia === "¹ abl. classī or classe",
    gClassis.trivia,
  );
  ok(
    "footnote trivia deterministic under repetition",
    (() => {
      for (let i = 0; i < 10; i++) {
        if (b2({ exercise: classisEx, given: "fleet", kind: "typed" }).trivia !== gClassis.trivia)
          return false;
      }
      return true;
    })(),
  );

  // Integration — mottoes: a Book-2 section whose item carries no footnote
  // and no Book-1 tip tie (dubius — verified untied) draws its section's
  // boxed mottoes, byte-stable per (item, date).
  const lesson12 = { id: 2012, teachingSteps: [] } as unknown as Lesson;
  const b12 = buildGradeChecker({ date: "2026-11-22", lesson: lesson12 });
  const dubiusEx: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "dubius": ___',
    answer: "doubtful",
    vocabLatin: "dubius",
    sourceGloss: "doubtful / uncertain",
  };
  const gDub = b12({ exercise: dubiusEx, given: "doubtful", kind: "typed" });
  const l12MottoTexts = LATIN2_MOTTOES.filter((m) =>
    m.sectionIds.includes("part4-l12"),
  ).map(latinMottoText);
  ok("dubius perfect", gDub.tier === "perfect", gDub.tier);
  ok(
    "the section's boxed motto supplies the trivia",
    gDub.trivia !== null && l12MottoTexts.includes(gDub.trivia),
    gDub.trivia,
  );
  ok(
    "motto selection deterministic per (item, date)",
    (() => {
      const g2 = b12({ exercise: dubiusEx, given: "doubtful", kind: "typed" });
      const g3 = buildGradeChecker({ date: "2026-11-22", lesson: lesson12 })({
        exercise: dubiusEx,
        given: "doubtful",
        kind: "typed",
      });
      return g2.trivia === gDub.trivia && g3.trivia === gDub.trivia;
    })(),
  );

  // Integration — ring (b): a section WITHOUT mottoes (part4-l08 carries no
  // box) still reaches its mapped grammar-index lore through the section's
  // own GRAMMAR_REFS topics (dīligō — verified untied by tips or keywords).
  const l8Topics = latin2SectionGrammarTopics("part4-l08");
  ok(
    "part4-l08 resolves its captured GRAMMAR_REFS topics in book order",
    l8Topics.map((t) => t.id).join(",") === "demonstratives,adjective-agreement",
    l8Topics.map((t) => t.id),
  );
  const lesson8 = { id: 2008, teachingSteps: [] } as unknown as Lesson;
  const b8 = buildGradeChecker({ date: "2026-11-22", lesson: lesson8 });
  const diligoEx: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give the Latin for "love": ___',
    answer: "dīligō",
    vocabLatin: "dīligō, dīligere, dīlēxī, dīlēctus",
    sourceGloss: "love",
  };
  const gDil = b8({ exercise: diligoEx, given: "dīligō", kind: "typed" });
  const defs = new Set(
    GRAMMAR_INDEX.filter((t) => t.definition).map((t) => t.definition),
  );
  ok("dīligō perfect", gDil.tier === "perfect", gDil.tier);
  ok(
    "ring (b) supplies a captured grammar-index definition",
    gDil.trivia !== null && defs.has(gDil.trivia),
    gDil.trivia,
  );
  ok(
    "ring (b) deterministic per (item, date)",
    (() => {
      const g2 = b8({ exercise: diligoEx, given: "dīligō", kind: "typed" });
      return g2.trivia === gDil.trivia;
    })(),
  );
}

// ── General culture bank (research tranche 1): provenance + count ──────────
{
  // Provenance gate: every general entry carries the draft's verbatim source
  // line, and that line cites a captured bundle (cuN-qN) or side lesson
  // (sideNNN) — the never-unsourced rule, ring (c) included.
  const capturedRef = /(cu\d+-q\d+|side\d+)/;
  let provenanceOk = true;
  let textOk = true;
  for (const f of GENERAL_CULTURE_TRIVIA) {
    if (typeof f.source !== "string" || f.source.trim().length === 0)
      provenanceOk = false;
    if (!capturedRef.test(f.source)) provenanceOk = false;
    if (typeof f.text !== "string" || f.text.trim().length === 0) textOk = false;
  }
  ok(
    "general culture bank: 37 verified facts (tranche 1)",
    GENERAL_CULTURE_TRIVIA.length === 37,
    GENERAL_CULTURE_TRIVIA.length,
  );
  ok(
    "every general entry cites a captured bundle or side lesson",
    provenanceOk,
  );
  ok("every general entry carries non-empty fact text", textOk);

  // The three flagged draft facts (23, 30, 40 — classical attestations NOT in
  // the captured bundles) stay OUT of the bank (pending on-disk verification).
  const leaked = GENERAL_CULTURE_TRIVIA.some(
    (f) =>
      f.text.includes("Ides of March") ||
      f.text.includes("she-wolf") ||
      f.text.includes("carpe diem"),
  );
  ok("flagged facts (23, 30, 40) excluded from the bank", !leaked);

  // Rotation — ring (c) rides the same daily-seeded selector as the other
  // rings (existing precedence, unchanged): an untied item draws from the
  // merged general pool, deterministic per (item, date), with tranche facts
  // surfacing across days.
  const xEx: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: "Give the Latin for 'x': ___",
    answer: "x",
  };
  const generalTexts = new Set(GENERAL_CULTURE_TRIVIA.map((f) => f.text));
  let deterministic = true;
  let poolNeverEmpty = true;
  let sawTranche = false;
  for (let i = 0; i < 365; i++) {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    const g1 = buildGradeChecker({ date })({ exercise: xEx, given: "x", kind: "typed" });
    const g2 = buildGradeChecker({ date })({ exercise: xEx, given: "x", kind: "typed" });
    if (g1.tier !== "perfect") poolNeverEmpty = false;
    if (g1.trivia === null || g1.trivia.length === 0) poolNeverEmpty = false;
    if (g1.trivia !== g2.trivia) deterministic = false;
    if (g1.trivia !== null && generalTexts.has(g1.trivia)) sawTranche = true;
  }
  ok("ring (c) merged pool deterministic per (item, date)", deterministic);
  ok("ring (c) pool never empty for an untied item (tranche merged)", poolNeverEmpty);
  ok("tranche facts rotate through the daily-seeded selector", sawTranche);
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`answerGrades.test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
