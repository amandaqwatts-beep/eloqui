// Verbum — shelf-book architecture: the SHELVES REGISTRY (shelves.ts)
// Owner directive (plan rev 73/74, 2026-10-20/21): a SHELF = a LANGUAGE.
// Shelves are first-class; books are first-class beneath them. The Latin
// shelf is ONE shelf holding sibling books — Henle First Year = Book 1 (the
// live course), Henle Second Year = Book 2 (the incoming shell). Each new
// language (Japanese, Biblical Hebrew, Biblical Greek…) gets its own shelf.
//
// This file is PURE DATA + pure helpers — no React, no storage, no lesson
// content. The existing Latin 1 course (latinLessons.ts + bookLessons.ts +
// the /lessons/latin route) is NOT re-parented in its internals: Book 1
// merely points at the existing entry path. Nothing here renders progress —
// Book 2 is an honest empty shell until the capture pipeline lands content.
//
// ⚠️ Book 1's wiring is load-bearing: entryPath "/lessons/latin" must keep
// working byte-identically (the shelf layer sits ABOVE the course, never
// inside it). Guarded by shelves.test.ts.

export type ShelfBookStatus = "live" | "scaffold";

/**
 * What kind of book this is (plan rev 75, owner 2026-10-25): textbooks are
 * courses (Henle First/Second Year); originals are the works themselves —
 * raw or adapted, read in their own book (Caesar's Gallic War first).
 * Data only; the shelf may quietly label the kind on a caption, nothing more.
 */
export type ShelfBookKind = "textbook" | "original";

/** One physical book standing on a language shelf. */
export interface ShelfBook {
  /** Stable book key — e.g. "latin-1", "latin-2", "latin-gallic-war". Unique across all shelves. */
  bookKey: string;
  /** Position on the shelf (1-based). Book 1 = Henle FY, Book 2 = Henle SY. */
  number: number;
  title: string;
  subtitle: string;
  /** The print source behind the book (provenance, not marketing). */
  source: string;
  /** "live" = the book opens its existing course; "scaffold" = structure only. */
  status: ShelfBookStatus;
  /** Course or original (plan rev 75): the shelf marks the difference in its captions. */
  kind: ShelfBookKind;
  /**
   * Where the book opens. Book 1 points at the EXISTING Latin 1 route (the
   * full lesson menu); Book 2 points at the two-path shell on the shelf page.
   * Purely navigational — never a content URL.
   */
  entryPath: string;
}

/** A language shelf — one per language (plan rev 73). */
export interface LanguageShelf {
  /** Stable shelf key, e.g. "latin". Unique across the registry. */
  shelfKey: string;
  /** The Language id this shelf belongs to (languages.ts). */
  languageId: "latin" | "greek" | "hebrew" | "english";
  /** Display label — the language name as printed on the shelf. */
  label: string;
  /** The books standing on this shelf, in shelf order (Book 1, Book 2, …). */
  books: ShelfBook[];
}

/**
 * The shelf registry. Today: one shelf (Latin) with two sibling books.
 * Add a language's shelf here when its track opens (Japanese next in the
 * flowplan); the languages hub re-points automatically via shelfForLanguage.
 */
export const SHELVES: LanguageShelf[] = [
  {
    shelfKey: "latin",
    languageId: "latin",
    label: "Latin",
    books: [
      {
        bookKey: "latin-1",
        number: 1,
        title: "Henle First Year Latin",
        subtitle: "The complete first-year course — 42 Henle lessons, 179 chapters live",
        source: "Henle First Year Latin (1943)",
        status: "live",
        kind: "textbook",
        // The EXISTING Latin 1 entry — untouched by the shelf layer.
        entryPath: "/lessons/latin",
      },
      {
        bookKey: "latin-2",
        number: 2,
        title: "Henle Second Year Latin",
        subtitle: "Structure in place — content lands with the capture pipeline",
        source: "Henle Second Year Latin (1943)",
        status: "scaffold",
        kind: "textbook",
        entryPath: "/shelf/latin?book=2",
      },
    ],
  },
];

/** The shelf for a language, if one exists. Pure lookup. */
export function shelfForLanguage(
  languageId: LanguageShelf["languageId"],
): LanguageShelf | undefined {
  return SHELVES.find((shelf) => shelf.languageId === languageId);
}

/** Every shelf a language id could resolve to (registry sanity helper). */
export function allShelfBookKeys(): string[] {
  return SHELVES.flatMap((shelf) => shelf.books.map((book) => book.bookKey));
}
