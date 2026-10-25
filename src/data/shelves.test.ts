/**
 * shelves.test.ts — regression guards for the shelf-book architecture.
 *
 * Self-contained (no bun:test import) so the project's `tsc --noEmit` stays
 * at its baseline error count without pulling in @types/bun (house pattern —
 * see shelfPacking.test.ts). Run with `bun src/data/shelves.test.ts` or via
 * `bun test` (a nonzero exit marks the file failed).
 *
 * Guards:
 *   1. The shelf registry is enumerable and well-formed (shelf = language).
 *   2. The Latin shelf holds EXACTLY Books 1+2 as siblings (plan rev 73).
 *   3. Book 1's wiring is unchanged — the registry re-parents ABOVE the
 *      existing course without touching its internals (latinLessons array
 *      order, bookLessons mapping, book 45/H42, subLessonToBook).
 *   4. Book 2's skeleton is structure-not-content (parts/sections from the
 *      folio map, all awaiting-capture, no lesson/exercise data anywhere).
 *   5. The per-path progress seam stores a choice honestly and never
 *      fabricates progress.
 */
import {
  SHELVES,
  shelfForLanguage,
  allShelfBookKeys,
  type LanguageShelf,
} from "./shelves";
import { LANGUAGES } from "./languages";
import { bookLessons, subLessonToBook } from "./bookLessons";
import { latinLessons } from "./latinLessons";
import {
  LATIN2_STRUCTURE,
  LATIN2_PATHS,
  LATIN2_EXERCISES_SPINE,
  latin2ReadingLadder,
} from "./latin2";
import {
  loadBook2Progress,
  saveBook2PathChoice,
  BOOK2_PROGRESS_KEY,
  type StorageLike,
} from "~/lib/book2Progress";
import {
  GALLIC_WAR_META,
  GALLIC_WAR_STRUCTURE,
  gallicWarSection,
  gallicWarSectionIds,
} from "./gallicWar";

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

/** In-memory Storage stub (the shape localStorage satisfies). */
function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

// ── 1. The registry is enumerable and well-formed ────────────────────────

test("shelves are enumerable — at least one shelf, every shelf has books", () => {
  ok(SHELVES.length >= 1, "SHELVES must not be empty");
  for (const shelf of SHELVES) {
    ok(shelf.books.length >= 1, `shelf ${shelf.shelfKey} has no books`);
    ok(shelf.books.length === new Set(shelf.books.map((b) => b.number)).size,
      `shelf ${shelf.shelfKey} has duplicate book numbers`);
    const sorted = [...shelf.books.map((b) => b.number)].sort((a, b) => a - b);
    eq(sorted, shelf.books.map((b) => b.number), `shelf ${shelf.shelfKey} books must ascend by number`);
  }
});

test("every shelf maps to a real language; book keys are globally unique", () => {
  const keys = allShelfBookKeys();
  ok(keys.length === new Set(keys).size, "bookKey collision across shelves");
  for (const shelf of SHELVES) {
    ok(shelf.languageId in LANGUAGES, `shelf ${shelf.shelfKey} has unknown language ${shelf.languageId}`);
    ok(shelfForLanguage(shelf.languageId) === shelf, `shelfForLanguage(${shelf.languageId}) resolves to the registry entry`);
  }
});

// ── 2. The Latin shelf: exactly Books 1+2 as siblings (plan rev 73) ──────

test("the Latin shelf has exactly two sibling books — Henle FY = Book 1, Henle SY = Book 2", () => {
  const latin = shelfForLanguage("latin");
  ok(latin !== undefined, "no Latin shelf");
  const shelf = latin as LanguageShelf;
  eq(shelf.shelfKey, "latin");
  eq(shelf.books.length, 2, "the Latin shelf holds exactly Book 1 and Book 2");
  const [b1, b2] = shelf.books;
  eq(b1.number, 1);
  eq(b1.title, "Henle First Year Latin");
  eq(b1.status, "live");
  eq(b1.entryPath, "/lessons/latin");
  eq(b2.number, 2);
  eq(b2.title, "Henle Second Year Latin");
  eq(b2.status, "scaffold");
  eq(b2.entryPath, "/shelf/latin?book=2");
  // Book kinds (plan rev 75): the Henle volumes are courses — textbooks.
  eq(b1.kind, "textbook");
  eq(b2.kind, "textbook");
});

test("Book 2 is a real book on the shelf — present and openable, not dusted or locked", () => {
  const b2 = shelfForLanguage("latin")?.books[1];
  ok(b2 !== undefined, "Book 2 missing from the Latin shelf");
  // The scaffold book still names its print source (provenance, not marketing).
  ok((b2 as NonNullable<typeof b2>).source.includes("1943"), "Book 2 source must cite the 1943 print");
});

// ── 3. Book 1's wiring is UNCHANGED (the re-parent touched nothing) ──────

test("latinLessons array untouched: 179 lessons, array order intact", () => {
  eq(latinLessons.length, 179);
  eq(latinLessons[178].id, 179, "the last array slot must remain lesson 179 (FY L57)");
  eq(latinLessons[0].id, 1, "the first array slot must remain lesson 1");
  // Array order ≠ id order by design (ids 51/52 precede 46–50); the shelf
  // layer must never have sorted it.
  const idx51 = latinLessons.findIndex((l) => l.id === 51);
  const idx46 = latinLessons.findIndex((l) => l.id === 46);
  ok(idx51 >= 0 && idx46 >= 0 && idx51 < idx46, "array-order constraint violated (51 must precede 46)");
});

test("bookLessons mapping untouched: 57 books (46 base + U3 General Review + 10 unit-reviews), book 45 (H42) intact", () => {
  eq(bookLessons.length, 57);
  const b45 = bookLessons.find((b) => b.id === 45);
  ok(b45 !== undefined, "book 45 missing");
  eq((b45 as NonNullable<typeof b45>).henleNumber, 42);
  ok((b45 as NonNullable<typeof b45>).subLessonIds.includes(179), "book 45 must still hold lesson 179");
  ok((b45 as NonNullable<typeof b45>).subLessonIds.includes(168), "book 45 must still hold lesson 168");
  const b57 = bookLessons.find((b) => b.id === 57);
  ok(b57 !== undefined, "book 57 (Unit 3 General Review) missing");
  ok((b57 as NonNullable<typeof b57>).subLessonIds.includes(166), "book 57 must still hold the General Review chapters");
  eq(subLessonToBook[179], 45);
  eq(subLessonToBook[1], 1);
});

// ── 4. Book 2's skeleton: structure, NOT content ─────────────────────────

test("Book 2's structure has the five mapped parts in book order", () => {
  eq(LATIN2_STRUCTURE.map((p) => p.id), [
    "part-1",
    "part-2",
    "part-3",
    "part-4",
    "end-matter",
  ]);
});

test("Part II carries the book's eleven adapted Caesar stories (pp. 17–265)", () => {
  const part2 = LATIN2_STRUCTURE.find((p) => p.id === "part-2");
  ok(part2 !== undefined, "Part II missing");
  const p2 = part2 as NonNullable<typeof part2>;
  eq(p2.sections.length, 11);
  eq(p2.sections[0].title, "The Helvetian Drive to the West");
  eq(p2.sections[0].folio, 17);
  eq(p2.sections[10].title, "Dē Morte Caesaris");
  eq(p2.sections[10].folio, 264);
  eq(p2.folioRange, [17, 265]);
});

test("Part IV's spine is Exercises 1–16 (pp. 305–394), the ladder follows", () => {
  const part4 = LATIN2_STRUCTURE.find((p) => p.id === "part-4");
  ok(part4 !== undefined, "Part IV missing");
  eq(LATIN2_EXERCISES_SPINE.folioRange, [305, 394]);
  eq(LATIN2_EXERCISES_SPINE.sectionIds.length, 16, "the shared spine is exactly Lessons 1–16");
  const p4 = part4 as NonNullable<typeof part4>;
  for (const id of LATIN2_EXERCISES_SPINE.sectionIds) {
    ok(p4.sections.some((s) => s.id === id), `spine id ${id} does not resolve to a Part IV section`);
  }
  eq(p4.sections[0].folio, 305);
  eq(latin2ReadingLadder()[0].folio, 395, "the Caesar-reading ladder starts at Lesson 17, p. 395");
});

test("every structural node is awaiting-capture — no fabricated content", () => {
  for (const part of LATIN2_STRUCTURE) {
    for (const section of part.sections) {
      eq(section.status, "awaiting-capture");
    }
  }
  // The skeleton is pure wayfinding: no node carries exercises, lesson
  // arrays, or Latin text. A JSON walk proves the data shape stays lean.
  const raw = JSON.stringify({ parts: LATIN2_STRUCTURE, paths: LATIN2_PATHS });
  for (const banned of ["exercises", "teachingSteps", "vocabulary", "latinText"]) {
    ok(!raw.includes(`"${banned}"`), `structure carries a "${banned}" key — content leaked into the skeleton`);
  }
});

test("both reading paths are defined and honestly framed (plan rev 74)", () => {
  eq(LATIN2_PATHS.map((p) => p.id), ["book", "caesar"]);
  for (const path of LATIN2_PATHS) {
    ok(path.title.length > 0 && path.description.length > 0 && path.difficulty.length > 0,
      `path ${path.id} missing selector copy`);
    ok(path.opensWith.length > 0, `path ${path.id} missing its opening`);
  }
});

// ── 5. The per-path progress seam: honest, storage-injectable ────────────

test("path choice persists to storage and loads back", () => {
  const store = memoryStorage();
  eq(loadBook2Progress(store).path, null, "no choice before one is saved");
  eq(loadBook2Progress(store).completedSectionIds, [], "no progress is ever fabricated");
  const after = saveBook2PathChoice("caesar", store);
  eq(after.path, "caesar");
  eq(loadBook2Progress(store).path, "caesar");
  eq(loadBook2Progress(store).completedSectionIds, []);
  ok(loadBook2Progress(store).updatedAt !== null, "updatedAt set on first save");
  ok(store.getItem(BOOK2_PROGRESS_KEY) !== null, "record written under the namespaced key");
  saveBook2PathChoice("book", store);
  eq(loadBook2Progress(store).path, "book", "choice is switchable — a preference, not a gate");
});

test("corrupt or hostile storage never throws and never fabricates", () => {
  eq(loadBook2Progress(memoryStorage({ [BOOK2_PROGRESS_KEY]: "{not json" })).path, null);
  eq(loadBook2Progress(memoryStorage({ [BOOK2_PROGRESS_KEY]: JSON.stringify({ path: "evil" }) })).path, null);
  const mixed = loadBook2Progress(memoryStorage({
    [BOOK2_PROGRESS_KEY]: JSON.stringify({ path: "book", completedSectionIds: ["ok", 5, null] }),
  }));
  eq(mixed.completedSectionIds, ["ok"], "string ids pass through; the rest are dropped");
});

// ── 6. The first original — Caesar's Gallic War (Book 3, plan rev 75) ────

test("the Gallic War skeleton is EXACTLY the received 8 books, in order", () => {
  eq(GALLIC_WAR_STRUCTURE.length, 8);
  eq(GALLIC_WAR_STRUCTURE.map((p) => p.id), [
    "gw-book-1",
    "gw-book-2",
    "gw-book-3",
    "gw-book-4",
    "gw-book-5",
    "gw-book-6",
    "gw-book-7",
    "gw-book-8",
  ]);
  eq(GALLIC_WAR_STRUCTURE.map((p) => p.book), [1, 2, 3, 4, 5, 6, 7, 8]);
  // The standard chapter enumeration of the received text (wayfinding; the
  // capture pipeline verifies against the PD source before content lands).
  eq(GALLIC_WAR_STRUCTURE.map((p) => p.chapters), [54, 35, 29, 38, 58, 44, 90, 55]);
  ok(GALLIC_WAR_STRUCTURE[7].subtitle.includes("Hirtius"), "Book VIII must be honestly framed as Hirtius' supplement");
});

test("the Gallic War skeleton is structure, NOT content — zero content keys", () => {
  const ids = gallicWarSectionIds();
  ok(ids.length === new Set(ids).size, "section id collision inside the Gallic War skeleton");
  for (const part of GALLIC_WAR_STRUCTURE) {
    ok(part.sections.length >= 2, `part ${part.id} has no section anchors to hang content on`);
    for (const section of part.sections) {
      eq(section.status, "awaiting-capture");
    }
  }
  // Pure wayfinding: no node carries exercises, lesson arrays, or Latin text —
  // not even a sample translation. A JSON walk proves the shape stays lean.
  const raw = JSON.stringify(GALLIC_WAR_STRUCTURE);
  for (const banned of ["exercises", "teachingSteps", "vocabulary", "latinText", "translation"]) {
    ok(!raw.includes(`"${banned}"`), `skeleton carries a "${banned}" key — content leaked into the original`);
  }
});

test("the Gallic War content seam resolves; the meta names the shelf book", () => {
  const found = gallicWarSection("gw-b7-alesia");
  ok(found !== undefined, "gw-b7-alesia does not resolve");
  eq((found as NonNullable<typeof found>).part.id, "gw-book-7");
  eq(gallicWarSection("gw-b9-ghost"), undefined, "invented sections must not resolve");
  eq(GALLIC_WAR_META.bookKey, "latin-gallic-war");
});

if (failed > 0) {
  console.error(`${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} passed`);
