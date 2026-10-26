/**
 * latin2Sections.test.ts — regression guards for the Book 2 rendering seam
 * (screens dept, 2026-10-25): captured Latin 2 sections open their exercises
 * through the existing exercise flow.
 *
 * Self-contained (no bun:test import) so the project's `tsc --noEmit` stays
 * at its baseline error count without pulling in @types/bun (house pattern —
 * see shelfPacking.test.ts). Run with `bun src/lib/latin2Sections.test.ts`
 * or via `bun test` (a nonzero exit marks the file failed).
 *
 * Guards:
 *   1. Every captured section builds a Lesson for the existing exercise flow —
 *      2000-range ids, the section's own exercises, honest title/part.
 *   2. Awaiting-capture and unknown sections build NOTHING (honest-empty).
 *   3. Id namespace: Book 2 ids never collide with Book 1 (≤179) or the
 *      cross-language lessons (1007/1008).
 *   4. Grammar links resolve — every captured section's refs resolve into
 *      GRAMMAR_INDEX, in order, with § citations.
 *   5. The progress seam records section completion honestly (idempotent
 *      upsert, storage-injectable, path choice preserved).
 */
import type { Lesson } from "~/data/latinLessons";
import { LATIN2_SECTION_GRAMMAR_REFS, LATIN2_STRUCTURE } from "~/data/latin2";
import { GRAMMAR_INDEX } from "~/data/grammarIndex";
import {
  LATIN2_SECTION_BASE_ID,
  buildLatin2SectionLesson,
  latin2CapturedSections,
  latin2SectionContext,
  latin2SectionGrammarTopics,
  latin2SectionLessonId,
  latin2SectionLessonNumber,
} from "./latin2Sections";
import {
  BOOK2_PROGRESS_KEY,
  loadBook2Progress,
  saveBook2PathChoice,
  saveBook2SectionCompletion,
  type StorageLike,
} from "./book2Progress";

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

function eq<T>(actual: T, expected: T, msg?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg ?? "assertion"}: expected ${b}, got ${a}`);
}
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

// ── 1. Captured sections build playable lessons ──────────────────────────
test("every captured section builds a Lesson for the existing exercise flow", () => {
  const captured = latin2CapturedSections();
  ok(captured.length >= 6, "the dictated opening (l01–l06) must be captured");
  for (const { section, part } of captured) {
    const lesson = buildLatin2SectionLesson(section.id);
    ok(lesson !== null, `captured section ${section.id} must build a lesson`);
    const l = lesson as NonNullable<typeof lesson>;
    ok(l.exercises.length > 0, `${section.id} has no exercises`);
    eq(l.title, section.title, `${section.id} title must be the book's own`);
    eq(l.subtitle, part.title, `${section.id} carries its part`);
    ok(l.teachingSteps === undefined, `${section.id} must not invent teaching steps`);
    ok(l.vocabulary === undefined, `${section.id} must not invent vocabulary`);
    // Every exercise belongs to the section's capture (sy-* namespace).
    for (const ex of l.exercises) {
      ok(ex.id.startsWith("sy-"), `${section.id} carries a foreign exercise ${ex.id}`);
    }
  }
});

test("l01 is the review spine's opening: third-declension nouns + sum", () => {
  const l01 = buildLatin2SectionLesson("part4-l01-nouns-sum") as Lesson;
  eq(l01.id, LATIN2_SECTION_BASE_ID + 1);
  ok(l01.title.includes("Lesson 1"), "the book's own lesson number stays in the title");
  ok(l01.exercises.length >= 60, "Exercise 1–6 items are captured (69 in tranche 1)");
  eq(latin2SectionLessonNumber("part4-l01-nouns-sum"), 1);
  eq(latin2SectionLessonId("part4-l06-pronouns"), 2006);
});

// ── 2. Awaiting-capture stays honest-empty ───────────────────────────────
test("awaiting-capture and unknown sections build NOTHING", () => {
  for (const part of LATIN2_STRUCTURE) {
    for (const section of part.sections) {
      if (section.status !== "captured") {
        eq(
          buildLatin2SectionLesson(section.id),
          null,
          `${section.id} is awaiting capture but builds content`,
        );
      }
    }
  }
  eq(buildLatin2SectionLesson("part4-l99-ghost"), null, "unknown ids build nothing");
  eq(latin2SectionContext("part4-l99-ghost"), null, "unknown ids resolve nowhere");
});

// ── 3. Id namespace: no collisions with Book 1 or the cross-language ids ─
test("Book 2 lesson ids live in a disjoint 2000-range namespace", () => {
  for (const { section } of latin2CapturedSections()) {
    const id = latin2SectionLessonId(section.id) ?? -1;
    ok(id >= LATIN2_SECTION_BASE_ID + 1, `${section.id} id below base`);
    ok(id !== 1007 && id !== 1008, "collides with the cross-language lessons");
    ok(id > 179, "collides with Book 1's lesson ids");
  }
});

// ── 4. Grammar links resolve into the index ──────────────────────────────
test("every captured section's grammar refs resolve, in order, with § cites", () => {
  for (const { section } of latin2CapturedSections()) {
    const refIds = LATIN2_SECTION_GRAMMAR_REFS[section.id] ?? [];
    ok(refIds.length > 0, `${section.id} has no grammar refs at birth`);
    const topics = latin2SectionGrammarTopics(section.id);
    eq(
      topics.map((t) => t.id),
      refIds,
      `${section.id} grammar topics must resolve in the section's own order`,
    );
    for (const topic of topics) {
      ok(topic.henleGrammarRef.length > 0, `${topic.id} lacks its § cite`);
      ok(GRAMMAR_INDEX.includes(topic), `${topic.id} not in GRAMMAR_INDEX`);
    }
  }
});

// ── 5. The progress seam records completion honestly ─────────────────────
test("section completion upserts idempotently and preserves the path choice", () => {
  const store = memoryStorage();
  saveBook2PathChoice("book", store);
  const after = saveBook2SectionCompletion("part4-l01-nouns-sum", store);
  eq(after.completedSectionIds, ["part4-l01-nouns-sum"]);
  eq(after.path, "book", "the path choice survives the completion write");
  saveBook2SectionCompletion("part4-l01-nouns-sum", store);
  eq(
    loadBook2Progress(store).completedSectionIds,
    ["part4-l01-nouns-sum"],
    "completion is idempotent — no double counting",
  );
  saveBook2SectionCompletion("part4-l02-adjectives", store);
  eq(loadBook2Progress(store).completedSectionIds, [
    "part4-l01-nouns-sum",
    "part4-l02-adjectives",
  ]);
  ok(loadBook2Progress(store).updatedAt !== null, "updatedAt stamped");
});

test("section completion is a no-op without storage and survives hostile data", () => {
  // No storage at all: must not throw.
  saveBook2SectionCompletion("part4-l03-indicative-questions", undefined);
  // Hostile payload: the loader sanitizes; the upsert still records.
  const store = memoryStorage({
    [BOOK2_PROGRESS_KEY]: JSON.stringify({ path: "caesar", completedSectionIds: [5, null, "ok"] }),
  });
  saveBook2SectionCompletion("part4-l04-pres-subj", store);
  const loaded = loadBook2Progress(store);
  eq(loaded.path, "caesar");
  eq(loaded.completedSectionIds, ["ok", "part4-l04-pres-subj"]);
});

if (failed > 0) {
  console.error(`${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} passed`);
