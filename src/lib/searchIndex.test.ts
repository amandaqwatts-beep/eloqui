/**
 * searchIndex.test.ts — unit tests for the search haystack fix.
 *
 * Self-contained (no bun:test import) so the project's `tsc --noEmit` stays
 * at its baseline error count without pulling in @types/bun. Run with:
 *   bun src/lib/searchIndex.test.ts
 *
 * Uses the REAL CULTURE_TEACHING bundle for "cu32-q1" (Pons Sublicius): the
 * term "sublicius" lives only in the teaching steps/sources haystack, not in
 * the culture question's prompt — so it exercises the exact PR #33 regression
 * (culture teaching texts added to the haystack but never searchable).
 */
import { buildSearchIndex, searchIndex } from "./searchIndex";
import type { Lesson } from "~/data/latinLessons";

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

/** Minimal lesson carrying one culture-question exercise (id must exist in CULTURE_TEACHING). */
function cultureLesson(
  id: number,
  title: string,
  concept: string,
  exerciseId: string,
  prompt: string,
): Lesson {
  return {
    id,
    title,
    concept,
    exercises: [
      {
        type: "culture-question",
        id: exerciseId,
        prompt,
        options: ["a", "b", "c", "d"],
        correctIndex: 1,
        explanation: "explanation text",
        source: "source text",
        domain: "context",
      },
    ],
  };
}

// Real cu32-q1 prompt (does NOT contain "sublicius" — that term lives only in
// the CULTURE_TEACHING steps/sources haystack).
const SUPLICIUS_PROMPT = "Rome's oldest bridge over the Tiber was traditionally…";
const bridgeLesson = cultureLesson(32, "Rome's First Bridge", "Ancus Marcius built the wooden crossing.", "cu32-q1", SUPLICIUS_PROMPT);

test("haystack-only query returns the entry (culture teaching text 'sublicius')", () => {
  const index = buildSearchIndex([bridgeLesson], [], []);
  const results = searchIndex(index, "sublicius");
  ok(results.length === 1, `expected 1 result, got ${results.length}: ${JSON.stringify(results)}`);
  ok(results[0].kind === "culture", `expected culture kind, got ${results[0].kind}`);
  ok(results[0].kind === "culture" && results[0].lessonId === 32, "expected lesson 32");
  // Nice-to-have: the match carries a snippet of the matched haystack text.
  ok(results[0].match.toLowerCase().includes("sublicius"), `snippet should show the hit, got: ${results[0].match}`);
});

test("title query ranks above haystack-only query", () => {
  const titledLesson: Lesson = {
    id: 99,
    title: "Sublicius Bridge",
    concept: "A bridge over the Tiber.",
    exercises: [],
  };
  const index = buildSearchIndex([bridgeLesson, titledLesson], [], []);
  const results = searchIndex(index, "sublicius");
  ok(results.length >= 2, `expected ≥2 results, got ${results.length}`);
  ok(results[0].kind === "lesson" && results[0].lessonId === 99, "title match must rank first");
  ok(results[1].kind === "culture", "haystack-only match must still be returned");
});

test("empty/whitespace query returns [] (unchanged)", () => {
  const index = buildSearchIndex([bridgeLesson], [], []);
  ok(searchIndex(index, "").length === 0, "empty query");
  ok(searchIndex(index, "   ").length === 0, "whitespace query");
});

test("no match returns [] (unchanged)", () => {
  const index = buildSearchIndex([bridgeLesson], [], []);
  ok(searchIndex(index, "zyxwvutsrqponmlkjihgfedcba").length === 0, "gibberish query");
});

test("limit still caps results (unchanged)", () => {
  const a: Lesson = { id: 1, title: "Alpha", concept: "one", exercises: [] };
  const b: Lesson = { id: 2, title: "Beta", concept: "two", exercises: [] };
  const c: Lesson = { id: 3, title: "Gamma", concept: "three", exercises: [] };
  const index = buildSearchIndex([a, b, c], [], []);
  const results = searchIndex(index, "lesson", 2); // "Lesson N:" in every title
  ok(results.length === 2, `expected 2 results, got ${results.length}`);
});

test("match-body query still works (existing behavior preserved)", () => {
  const index = buildSearchIndex([bridgeLesson], [], []);
  const results = searchIndex(index, "ancus"); // in concept (match), not title
  // The lesson entry hits via its match body; the culture entry ALSO now hits
  // via its haystack (cu32-q1 teaching steps mention "King Ancus Marcius") —
  // haystack findability working as intended. Lesson (earlier position) first.
  ok(results.length === 2, `expected 2 results, got ${results.length}: ${JSON.stringify(results)}`);
  ok(results[0].kind === "lesson" && results[0].lessonId === 32, "lesson entry via match body ranks first");
  ok(results[1].kind === "culture", "culture entry via haystack also returned");
});

test("diacritics still stripped in haystack search", () => {
  const lesson: Lesson = {
    id: 40,
    title: "Comparison",
    concept: "heavier",
    exercises: [],
    vocabulary: [{ latin: "graviōr", english: "heavier" }],
  };
  const index = buildSearchIndex([lesson], [], []);
  const results = searchIndex(index, "gravior");
  ok(results.length === 1, `expected 1 result, got ${results.length}`);
  ok(results[0].kind === "vocab", `expected vocab entry, got ${results[0].kind}`);
});

if (failed > 0) {
  console.error(`${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} passed`);
