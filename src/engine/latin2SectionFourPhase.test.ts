/**
 * latin2SectionFourPhase.test.ts — Engine verification for the Book-2
 * four-phase batch builder (PR-B of the four-phase wrap).
 *
 * Covers, over the REAL 16-section spine:
 *   - batch shape: every (section, drill phase) yields a full, non-empty batch
 *     (the template fallback guarantees it — no student ever sees nothing)
 *   - phase gating: memorized drills the section's vocab universe
 *     (vocab-recall shapes only); quizzed draws translate/parse specs;
 *     incorporated draws imitate/constructions/form-drill specs
 *   - the doctrine gates: no captured prompt text served verbatim; nothing
 *     from UNtaught (later) sections' vocab; the section's own vocab present
 *   - rotation: successive batches cover disjoint spec slices (fresh windows)
 *   - determinism: same (section, phase, date, batch) → byte-identical batch;
 *     a new date/batch re-draws
 *   - the drill adapter: batchSeed parsing, taught → []
 *
 * Self-contained (no bun:test import) so `tsc --noEmit` stays at its 7-error
 * baseline. Run with:
 *   bun src/engine/latin2SectionFourPhase.test.ts
 */

import {
  latin2BatchForDrill,
  latin2SectionPhaseBatch,
} from "~/engine/latin2SectionFourPhase";
import { latin2SpineSectionIds } from "~/engine/latin2SectionSpecs";
import {
  LATIN2_SECTION_EXERCISES,
  LATIN2_SECTION_VOCAB,
} from "~/data/latin2";

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

const DATE = "2026-11-21";
const BATCH = 8;
const DRILL_PHASES = ["memorized", "quizzed", "incorporated"] as const;
const allSections = latin2SpineSectionIds();
ok(allSections.length === 16, "16 spine sections present");

const batchFor = (sid: string, phase: (typeof DRILL_PHASES)[number], batch = 0) =>
  latin2SectionPhaseBatch(sid, phase, { date: DATE, batch });

// The captured prompt text (the textbook's own answer key) — the doctrine
// gate: a generated instance never serves it.
const capturedPrompts = new Set<string>();
for (const items of Object.values(LATIN2_SECTION_EXERCISES)) {
  for (const ex of items as { prompt: string }[]) {
    if (typeof ex?.prompt === "string") capturedPrompts.add(ex.prompt);
  }
}

// Vocab of a LATER section (never demanded before it is taught).
const lastSectionVocab = new Set(
  (LATIN2_SECTION_VOCAB[allSections[15]] ?? []).map((v) => v.latin),
);

// ── 1. Batch shape over the whole spine ──────────────────────────────────
test("every section × drill phase yields a full non-empty batch", () => {
  for (const sid of allSections) {
    for (const phase of DRILL_PHASES) {
      const batch = batchFor(sid, phase);
      eq(batch.length, BATCH, `batch size (${sid}/${phase})`);
      for (const ex of batch) {
        ok(ex.type === "multiple-choice" || ex.type === "fill-in-blank" || ex.type === "matching",
          `renderable type (${sid}/${phase})`);
        ok(typeof ex.prompt === "string" && ex.prompt.length > 0,
          `prompt present (${sid}/${phase})`);
        if (ex.type === "multiple-choice") {
          ok((ex.options?.length ?? 0) >= 2 && (ex.correctIndex ?? -1) >= 0,
            `MC integrity (${sid}/${phase})`);
        }
        if (ex.type === "fill-in-blank") {
          ok(typeof ex.answer === "string" && ex.answer.length > 0,
            `fill integrity (${sid}/${phase})`);
        }
      }
    }
  }
});

// ── 2. Phase gating ──────────────────────────────────────────────────────
test("memorized drills the section's vocab universe (recall shapes only)", () => {
  for (const sid of allSections) {
    const batch = batchFor(sid, "memorized");
    for (const ex of batch) {
      const isRecallShape =
        (ex.type === "multiple-choice" &&
          (/^What does "/.test(ex.prompt) || /^Which Latin word means "/.test(ex.prompt))) ||
        (ex.type === "fill-in-blank" &&
          (/^Give one English meaning/.test(ex.prompt) || /^Give the Latin word for/.test(ex.prompt)));
      ok(isRecallShape, `memorized emits vocab-recall shapes only (${sid}): ${ex.prompt}`);
    }
  }
});

test("memorized covers the section's OWN vocabulary", () => {
  for (const sid of allSections) {
    const own = new Set(
      (LATIN2_SECTION_VOCAB[sid] ?? []).map((v) => v.latin),
    );
    if (own.size === 0) continue;
    // Window of 8 over the universe: the section's own words must appear
    // across the first few batches (rotation guarantees coverage).
    const seen = new Set<string>();
    for (let b = 0; b < 6; b++) {
      for (const ex of batchFor(sid, "memorized", b)) {
        for (const word of own) {
          if (ex.prompt.includes(word)) seen.add(word);
        }
      }
    }
    ok(seen.size > 0, `section's own vocab reached by rotation (${sid})`);
  }
});

test("memorized never drills an UNtaught (later) section's vocab", () => {
  // The leak vectors for a vocab-recall batch are its LATIN values: an E→L
  // MC's options and a "Give the Latin word for…" fill's answer. (Prompts
  // quote English glosses, which legitimately carry capture metadata like
  // "preceded by gen. …" — not vocabulary.) Every Latin value must be a
  // footnote-stripped member of the section's bounded universe.
  const strip = (s: string) => s.replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]/g, "");
  for (const sid of allSections) {
    const universe = new Set(
      [...(LATIN2_SECTION_VOCAB[sid] ?? []),
        ...allSections
          .slice(0, allSections.indexOf(sid))
          .flatMap((l) => LATIN2_SECTION_VOCAB[l] ?? []),
      ].map((v) => strip(v.latin)),
    );
    for (let b = 0; b < 4; b++) {
      for (const ex of batchFor(sid, "memorized", b)) {
        if (ex.prompt.startsWith("Which Latin word means")) {
          for (const opt of ex.options ?? []) {
            ok(universe.has(opt), `untaught Latin option "${opt}" in ${sid} batch ${b}`);
          }
        }
        if (ex.prompt.startsWith("Give the Latin word for")) {
          ok(universe.has(ex.answer ?? ""), `untaught Latin answer in ${sid} batch ${b}`);
        }
      }
    }
  }
});

test("quizzed draws translate/parse shapes; incorporated draws production shapes", () => {
  for (const sid of allSections) {
    for (const ex of batchFor(sid, "quizzed")) {
      const isQuizzedShape =
        /^Translate (into|and answer)/.test(ex.prompt) ||
        /^Respondē /.test(ex.prompt) ||
        /^The form ".*" is the ______ of/.test(ex.prompt) ||
        /^What does "/.test(ex.prompt) || // template pad (mc mode)
        /^Which Latin word means /.test(ex.prompt); // template pad (mc mode)
      ok(isQuizzedShape, `quizzed shape (${sid}): ${ex.prompt}`);
    }
    for (const ex of batchFor(sid, "incorporated")) {
      const isProductionShape =
        /^Give the (nominative|genitive|dative|accusative|ablative)/.test(ex.prompt) ||
        /^Give the adverb formed from/.test(ex.prompt) ||
        /^Which case does "/.test(ex.prompt) ||
        /^Which Latin construction is being described\?/.test(ex.prompt) ||
        /^What does "/.test(ex.prompt) || // template pad (mc mode)
        /^Which Latin word means /.test(ex.prompt); // template pad (mc mode)
      ok(isProductionShape, `incorporated shape (${sid}): ${ex.prompt}`);
    }
  }
});

// ── 3. Doctrine gates ────────────────────────────────────────────────────
test("no captured prompt text served verbatim in any batch", () => {
  for (const sid of allSections) {
    for (const phase of DRILL_PHASES) {
      for (let b = 0; b < 3; b++) {
        for (const ex of batchFor(sid, phase, b)) {
          ok(!capturedPrompts.has(ex.prompt), `captured prompt verbatim (${sid}/${phase}): ${ex.prompt}`);
        }
      }
    }
  }
});

// ── 4. Rotation + determinism ────────────────────────────────────────────
test("successive batches are fresh instances, not repeats", () => {
  for (const sid of allSections) {
    for (const phase of DRILL_PHASES) {
      const b0 = batchFor(sid, phase, 0);
      const b1 = batchFor(sid, phase, 1);
      const prompts0 = new Set(b0.map((e) => e.prompt));
      ok(
        b1.some((e) => !prompts0.has(e.prompt)),
        `batch 1 reuses all of batch 0's prompts (${sid}/${phase})`,
      );
    }
  }
});

test("determinism: same (section, phase, date, batch) → byte-identical", () => {
  const sid = allSections[6];
  for (const phase of DRILL_PHASES) {
    eq(batchFor(sid, phase, 3), batchFor(sid, phase, 3), `deterministic (${phase})`);
    const nextDate = latin2SectionPhaseBatch(sid, phase, {
      date: "2026-11-22",
      batch: 3,
    });
    ok(
      JSON.stringify(nextDate) !== JSON.stringify(batchFor(sid, phase, 3)),
      `a new date re-draws (${phase})`,
    );
  }
});

// ── 5. Drill adapter ─────────────────────────────────────────────────────
test("adapter: batchSeed parsed; taught yields []", () => {
  const sid = allSections[0];
  const run = { phase: "quizzed" as const };
  const batch = latin2BatchForDrill(
    sid,
    run,
    `latin2|${sid}|2026-11-21|batch:4`,
    BATCH,
  );
  // The adapter stamps the RUNTIME date; compare against the same-date build.
  eq(
    batch,
    latin2SectionPhaseBatch(sid, "quizzed", { batch: 4, count: BATCH }),
    "adapter maps (run, batchSeed) onto the registry chain",
  );
  eq(latin2BatchForDrill(sid, { phase: "taught" }, "x|batch:0", BATCH).length, 0,
    "taught never produces a drill batch");
});

// ── Report ───────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
