/**
 * bookStructureModel.test.ts — guards for the uniform book-menu structure
 * model (screens dept, 2026-11-14; owner doctrine rev 81: "a book is a
 * book, then the components intelligently subdivide sections, chapters,
 * etc.").
 *
 * Self-contained (no bun:test import) so the project's `tsc --noEmit` stays
 * at its baseline error count without pulling in @types/bun (house pattern —
 * see shelfPacking.test.ts). Run with
 * `bun src/lib/bookStructureModel.test.ts` or via `bun test`.
 *
 * Guards:
 *   1. Book 1's adapter folds buildBookshelfModel into 14 unit parts with the
 *      full shelf population, in display (array-index) order.
 *   2. The Book-1-isms moved behind model data: tone only on henle sections,
 *      legacyReview exactly on units 1/2/5/14 mastery spines, cultureIntro on
 *      every culture section.
 *   3. The focus resolvers replace the old bookKeyForLesson formats — every
 *      lesson id resolves to the section that owns it, first-book-wins, and
 *      explore sections resolve by side-lesson id.
 *   4. Book 2's adapter maps LATIN2_STRUCTURE honestly (folio, composed
 *      lesson numbers, scoreless completion seam).
 *   5. Book 3's adapter maps the received 8 books, all awaiting-capture.
 */
import latinLessons from "~/data/latinLessons";
import { bookLessons } from "~/data/bookLessons";
import { latinSideLessons } from "~/data/latinSideLessons";
import { LATIN2_STRUCTURE } from "~/data/latin2";
import { GALLIC_WAR_STRUCTURE } from "~/data/gallicWar";
import {
  buildBook1StructureModel,
  buildBook2StructureModel,
  buildBook3StructureModel,
} from "./bookStructureModel";

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

test("Book 1: 14 unit parts in ascending order with the full shelf population", () => {
  const model = buildBook1StructureModel(latinLessons, bookLessons, latinSideLessons);
  eq(model.bookKey, "latin-1");
  eq(model.parts.map((p) => p.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], "part order");
  eq(model.parts.map((p) => p.label), model.parts.map((p) => `Unit ${p.number}`), "part labels");
  const sections = model.parts.flatMap((p) => p.sections);
  eq(sections.filter((s) => s.kind === "henle").length,
    bookLessons.filter((b) => b.kind === "lesson").length, "henle sections");
  eq(sections.filter((s) => s.kind === "review").length,
    bookLessons.filter((b) => b.kind === "mastery-review").length, "mastery-review sections");
  eq(sections.filter((s) => s.kind === "unit-review").length,
    bookLessons.filter((b) => b.kind === "unit-review").length, "unit-review sections");
  ok(sections.filter((s) => s.kind === "culture").length >= 1, "culture books exist");
  eq(sections.filter((s) => s.kind === "explore").length, latinSideLessons.length, "explore sections");
  ok(new Set(sections.map((s) => s.id)).size === sections.length, "section ids unique");
  // Array-order constraint: every chapter-book's refs ascend (never id order).
  for (const s of sections) {
    const refs = s.chapters.map((c) => c.ref);
    ok(refs.every((r, i) => i === 0 || refs[i - 1] < r), `refs ascend in ${s.id}`);
  }
});

test("Book 1: the moved Book-1-isms live on the sections, not the renderer", () => {
  const model = buildBook1StructureModel(latinLessons, bookLessons, latinSideLessons);
  const sections = model.parts.flatMap((p) => p.sections);
  for (const s of sections) {
    if (s.kind === "henle") ok(s.tone !== undefined, `henle ${s.id} carries a tone`);
    else ok(s.tone === undefined, `non-henle ${s.id} carries no tone`);
    if (s.kind === "review") {
      eq(s.legacyReview, [1, 2, 5, 14].includes(s.unit), `legacy flag on ${s.id}`);
    } else {
      ok(s.legacyReview === undefined, `non-review ${s.id} carries no legacy flag`);
    }
    if (s.kind === "culture") {
      // The original intros cover units 1–5 only; later units render no intro
      // line (byte-identical: the old renderer's map had the same coverage).
      if (s.unit <= 5) {
        ok(typeof s.cultureIntro === "string" && s.cultureIntro.length > 0, `culture intro on ${s.id}`);
      } else {
        ok(s.cultureIntro === undefined, `no fabricated intro on ${s.id}`);
      }
    }
  }
  eq(sections.filter((s) => s.legacyReview === true).length, 4, "exactly four legacy spines");
});

test("Book 1: resolvers replace bookKeyForLesson — first-book-wins, explores by id", () => {
  const model = buildBook1StructureModel(latinLessons, bookLessons, latinSideLessons);
  const sections = model.parts.flatMap((p) => p.sections);
  // Every lesson id resolves to a section that actually owns it.
  for (const lesson of latinLessons) {
    const sid = model.sectionIdForChapter(lesson.id);
    ok(sid !== null, `lesson ${lesson.id} resolves`);
    const owner = sections.find((s) => s.id === sid);
    ok(owner !== undefined, `resolved section ${sid} exists`);
    ok(
      (owner as NonNullable<typeof owner>).chapters.some((c) => c.id === lesson.id),
      `lesson ${lesson.id} is a chapter of ${sid}`,
    );
  }
  eq(model.sectionIdForChapter(1), "henle-1", "lesson 1");
  eq(model.sectionIdForChapter(25), "review-u1", "mastery review chapter");
  eq(model.sectionIdForChapter(999999), null, "unknown id");
  for (const s of sections.filter((x) => x.kind === "explore")) {
    const ref = s.contentRef;
    ok(ref !== undefined && "sideLesson" in ref && ref.sideLesson !== undefined, `explore ${s.id} carries its side lesson`);
    const sideLessonId = (ref as { sideLesson: { id: number } }).sideLesson.id;
    eq(model.exploreSectionId?.(sideLessonId), s.id, `explore focus for ${s.id}`);
  }
});

test("Book 2: LATIN2_STRUCTURE maps honestly; the completion seam is scoreless", () => {
  const model = buildBook2StructureModel();
  eq(model.bookKey, "latin-2");
  eq(model.parts.length, LATIN2_STRUCTURE.length, "part count");
  for (const [i, part] of model.parts.entries()) {
    eq(part.id, LATIN2_STRUCTURE[i].id, "part id");
    eq(part.sections.length, LATIN2_STRUCTURE[i].sections.length, "section count");
    for (const [j, s] of part.sections.entries()) {
      const src = LATIN2_STRUCTURE[i].sections[j];
      eq(s.status, src.status === "captured" ? "captured" : "awaiting-capture", `${s.id} status`);
      ok(s.chapters.length === 0, `${s.id} has no chapter layer yet`);
      ok(
        s.contentRef !== undefined && "folio" in s.contentRef && s.contentRef.folio === src.folio,
        `${s.id} carries its folio`,
      );
      // Composed lesson numbers exist only for the Part-4 spine sections
      // (part4-l<N> ids) — the honest latin2Sections semantics.
      if (/^part4-l\d+-/.test(s.id)) {
        ok(
          s.contentRef !== undefined && "lessonNumber" in s.contentRef && s.contentRef.lessonNumber !== null,
          `${s.id} carries its composed lesson number`,
        );
      } else {
        ok(
          s.contentRef !== undefined && "lessonNumber" in s.contentRef && s.contentRef.lessonNumber === null,
          `${s.id} carries no composed lesson number`,
        );
      }
    }
  }
  const done = buildBook2StructureModel(["part1-1-caesar"]);
  eq(done.getSectionCompletion?.("part1-1-caesar"), true, "completed section");
  eq(done.getSectionCompletion?.("part1-2-road"), false, "uncompleted section");
  eq(buildBook2StructureModel().getSectionCompletion?.("part1-1-caesar"), false, "no fabricated progress");
});

test("Book 3: the received 8 books, all awaiting capture", () => {
  const model = buildBook3StructureModel();
  eq(model.bookKey, "latin-gallic-war");
  eq(model.parts.length, GALLIC_WAR_STRUCTURE.length, "part count");
  eq(model.parts.map((p) => p.number), [1, 2, 3, 4, 5, 6, 7, 8], "book numbers");
  for (const part of model.parts) {
    ok(part.sections.length >= 2, `part ${part.id} has anchors`);
    for (const s of part.sections) eq(s.status, "awaiting-capture", `${s.id}`);
  }
  eq(model.sectionIdForChapter(1), null, "no chapters to resolve yet");
});

if (failed > 0) {
  console.error(`${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} passed`);
