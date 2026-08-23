/**
 * fourPhaseGen.test.ts — Engine verification for four-phase lesson structure,
 * STEP 1: the generative drill machinery (research/four-phase-lesson-design.md
 * §2). Covers:
 *   - seed determinism in generateFallbackExercises (re-drill an item set)
 *   - per-phase emission via generatePhaseExercises (memorized/quizzed/incorporated)
 *     mapping onto the existing GeneratedExercise union (no new shapes)
 *   - CompoundFrame synthesis in translationGen (2–3 sentence passages whose
 *     `requires` span current + prior grammarIndex topics)
 *
 * Self-contained (no bun:test import) so `tsc --noEmit` stays at its 7-error
 * baseline. Run with:
 *   bun src/engine/fourPhaseGen.test.ts
 */

import latinLessons, { type Lesson } from "~/data/latinLessons";
import { buildLearnedUniverse } from "~/engine/learnedUniverse";
import {
  generateFallbackExercises,
  generatePhaseExercises,
  type GeneratedExercise,
} from "~/engine/fallbackGenerator";
import {
  COMPOUND_FRAMES,
  generateCompoundExercises,
  type CompoundFrame,
} from "~/engine/translationGen";

// ── Tiny harness (mirrors other engine tests) ────────────────────────────
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
  if (a !== b)
    throw new Error(`${msg ?? "assertion"}: expected ${b}, got ${a}`);
}

const lessons: Lesson[] = latinLessons;
const order = new Map(lessons.map((l, i) => [l.id, i]));
const lessonOf = (id: number): Lesson => {
  const l = lessons.find((x) => x.id === id);
  if (!l) throw new Error(`lesson ${id} missing`);
  return l;
};
function completedThrough(id: number): number[] {
  const idx = order.get(id)!;
  return lessons.filter((l) => order.get(l.id)! <= idx).map((l) => l.id);
}

const VALID_TYPES = new Set(["multiple-choice", "fill-in-blank", "matching"]);
function assertValidGenerated(items: GeneratedExercise[], msg: string) {
  ok(items.length > 0, `${msg}: produced at least one item`);
  for (const it of items) {
    ok(
      VALID_TYPES.has(it.type),
      `${msg}: item type "${it.type}" is a known GeneratedExercise shape`,
    );
    ok(
      typeof it.prompt === "string" && it.prompt.length > 0,
      `${msg}: prompt present`,
    );
  }
}

// ── 1. Seed determinism (fallback) ───────────────────────────────────────
test("seed: same seed re-emits identical items; different seed diverges", () => {
  const l = lessonOf(1);
  const a = generateFallbackExercises(
    l,
    8,
    "mixed",
    "latin",
    undefined,
    "drill-a",
  );
  const b = generateFallbackExercises(
    l,
    8,
    "mixed",
    "latin",
    undefined,
    "drill-a",
  );
  const c = generateFallbackExercises(
    l,
    8,
    "mixed",
    "latin",
    undefined,
    "drill-b",
  );
  eq(a, b, "same seed → byte-identical items");
  // Different seed almost surely diverges; same count so arrays are comparable.
  const same = JSON.stringify(a) === JSON.stringify(c);
  ok(!same, "different seed → different items (expected to diverge)");
  assertValidGenerated(a, "seeded fallback");
});

test("seed: no seed still generates a valid set", () => {
  const items = generateFallbackExercises(lessonOf(1), 6, "mixed", "latin");
  assertValidGenerated(items, "unseeded fallback");
});

// ── 2. Per-phase emission ────────────────────────────────────────────────
test("phase memorized: template MC/fill/matching only", () => {
  const items = generatePhaseExercises({
    phase: "memorized",
    lesson: lessonOf(1),
    count: 6,
    seed: "m1",
  });
  assertValidGenerated(items, "memorized");
});

test("phase quizzed: with universe → translation fill-in-blank; without → template fallback", () => {
  const u = buildLearnedUniverse({
    lessons,
    completedLessonIds: completedThrough(53),
    currentLessonId: 53,
  });
  const w = generatePhaseExercises({
    phase: "quizzed",
    lesson: lessonOf(53),
    count: 4,
    universe: u,
    seed: "q1",
  });
  assertValidGenerated(w, "quizzed (with universe)");
  for (const it of w)
    ok(
      it.type === "fill-in-blank",
      "quizzed universe item is a translation fill-in-blank",
    );

  const wo = generatePhaseExercises({
    phase: "quizzed",
    lesson: lessonOf(1),
    count: 4,
    seed: "q2",
  });
  assertValidGenerated(wo, "quizzed (no universe → template fallback)");
});

test("phase incorporated: with universe → compound passage; without → template fallback", () => {
  const u = buildLearnedUniverse({
    lessons,
    completedLessonIds: completedThrough(53),
    currentLessonId: 53,
  });
  const w = generatePhaseExercises({
    phase: "incorporated",
    lesson: lessonOf(53),
    count: 3,
    universe: u,
    seed: "i1",
  });
  assertValidGenerated(w, "incorporated (with universe)");
  for (const it of w) {
    ok(
      it.type === "fill-in-blank",
      "incorporated universe item is a translation fill-in-blank",
    );
    ok(
      it.prompt.startsWith("Translate this passage"),
      "prompt signals a multi-sentence passage",
    );
  }

  const wo = generatePhaseExercises({
    phase: "incorporated",
    lesson: lessonOf(1),
    count: 3,
    seed: "i2",
  });
  assertValidGenerated(wo, "incorporated (no universe → template fallback)");
});

// ── 3. CompoundFrame synthesis ───────────────────────────────────────────
test("compound: passage has ≥2 sentences, is a translation fill-in-blank, deterministic per seed", () => {
  const u = buildLearnedUniverse({
    lessons,
    completedLessonIds: completedThrough(53),
    currentLessonId: 53,
  });
  const a = generateCompoundExercises({
    universe: u,
    lesson: lessonOf(53),
    count: 4,
    seed: "cp-a",
    direction: "latin-to-english",
  });
  const b = generateCompoundExercises({
    universe: u,
    lesson: lessonOf(53),
    count: 4,
    seed: "cp-a",
    direction: "latin-to-english",
  });
  eq(a, b, "compound: same seed → byte-identical passages");
  ok(a.length > 0, "compound: produced passages at lesson 53");
  for (const it of a) {
    ok(it.type === "fill-in-blank", "compound item is fill-in-blank");
    // L→E: the prompt is the Latin passage — 2 sentences ⇒ separator ". " + final ".".
    const periodCount = countPeriods(it.prompt);
    ok(
      periodCount >= 2,
      `compound passage contains ≥2 sentences (periods=${periodCount}): ${it.prompt}`,
    );
    ok(
      it.prompt.startsWith("Translate this passage"),
      "compound prompt flags passage translation",
    );
  }
});

test("compound: requires span current + prior topics — gated until all topics bound", () => {
  const twoTopic: CompoundFrame = {
    id: "test-two-topic",
    requires: ["first-declension", "third-conjugation"],
    sentences: COMPOUND_FRAMES.find(
      (f) => f.id === "compound-1st-and-3rd-conj",
    )!.sentences,
  };
  // At lesson 45 the third-conjugation topic (46–49) is not yet learned.
  const u45 = buildLearnedUniverse({
    lessons,
    completedLessonIds: completedThrough(45),
    currentLessonId: 45,
  });
  const none = generateCompoundExercises({
    universe: u45,
    lesson: lessonOf(45),
    count: 2,
    seed: "g",
    frames: [twoTopic],
  });
  eq(
    none.length,
    0,
    "passage requiring unlearned topic is withheld (bespoke raison)",
  );

  // At lesson 49 both first-declension and third-conjugation are learned.
  const u49 = buildLearnedUniverse({
    lessons,
    completedLessonIds: completedThrough(49),
    currentLessonId: 49,
  });
  const some = generateCompoundExercises({
    universe: u49,
    lesson: lessonOf(49),
    count: 2,
    seed: "g",
    frames: [twoTopic],
  });
  ok(some.length > 0, "passage emitted once every required topic is bound");
});

test("compound: empty universe → [] (never fabricate)", () => {
  const empty = buildLearnedUniverse({
    lessons,
    completedLessonIds: [],
    currentLessonId: 1,
  });
  const items = generateCompoundExercises({
    universe: empty,
    lesson: lessonOf(1),
    count: 3,
    seed: "x",
  });
  eq(items.length, 0, "empty universe → no compound passages");
});

function countPeriods(s: string): number {
  return (s.match(/\./g) ?? []).length;
}

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
