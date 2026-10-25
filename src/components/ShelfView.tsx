/**
 * ShelfView.tsx — the language SHELF (shelf-book architecture, plan rev 73).
 *
 * A shelf = a language; the books standing on it are its first-class books.
 * The Latin shelf holds two siblings: Book 1 (Henle First Year — the live
 * course, opening its existing /lessons/latin route untouched) and Book 2
 * (Henle Second Year — present as a real book, opening the scaffold shell).
 *
 * Theme: the Bookshelf v2.1 patterns exactly — .library-wall wall, .spine
 * cloth + .shelf-board board, serif (.font-book) labels, gold-ribbon
 * progress (owner doctrine: "progress marked by ribbons") computed ONLY from
 * real progress data. No badges, no artifice (Minimalist Scholarly, rev 72):
 * Book 2 carries NO ribbon and NO progress strip — it has no progress yet.
 */
import { Link } from "@tanstack/react-router";
import { useMemo, type CSSProperties } from "react";
import type { LanguageShelf, ShelfBook } from "~/data/shelves";
import { latinLessons } from "~/data/latinLessons";
import { loadProgress, type LessonProgress } from "~/engine/progress";

interface ShelfViewProps {
  shelf: LanguageShelf;
}

export default function ShelfView({ shelf }: ShelfViewProps) {
  // Real ribbon data for LIVE books only — computed once, never fabricated.
  const progressByLesson = useMemo(() => {
    const entries = loadProgress(shelf.languageId) as LessonProgress[];
    return new Map(entries.map((p) => [p.lessonId, p]));
  }, [shelf.languageId]);
  const chapterCount = latinLessons.length;

  return (
    <main className="library-wall min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/languages"
          className="text-sm font-semibold text-burgundy-800 transition hover:text-burgundy-600"
        >
          ← Languages
        </Link>

        <header className="mt-6 mb-10">
          <h1 className="font-book text-4xl font-extrabold text-burgundy-900">
            {shelf.label}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            One shelf, one language. Each book standing here is a complete
            course; open one to begin where you left off.
          </p>
        </header>

        {/* The shelf row — books stand flush on the board (items-end), like
            the unit shelves of the lesson menu. */}
        <section aria-label={`${shelf.label} shelf`}>
          <div className="relative z-0 flex items-end gap-4 pl-2 pt-3">
            {shelf.books.map((book) => (
              <ShelfBookSpine
                key={book.bookKey}
                book={book}
                ribbon={
                  book.status === "live"
                    ? ribbonForBook(progressByLesson, chapterCount)
                    : null
                }
              />
            ))}
          </div>
          {/* The board the books stand on. */}
          <div className="shelf-board" />

          {/* Museum-label captions under the board — quiet, serif titles. */}
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
            {shelf.books.map((book) => (
              <div key={book.bookKey} className="max-w-xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-wood-700">
                  Book {romanize(book.number)}
                </span>
                <span className="font-book mt-0.5 block text-sm font-bold text-burgundy-900">
                  {book.title}
                </span>
                <span className="mt-0.5 block text-xs text-gray-600">{book.subtitle}</span>
                <span className="font-book mt-0.5 block text-[11px] italic text-gray-400">
                  {book.source}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/** A whole book standing on the shelf — same cloth as the unit spines,
    scaled up to book size. No locked state: every book here is openable. */
function ShelfBookSpine({ book, ribbon }: { book: ShelfBook; ribbon: RibbonTone }) {
  const spineStyle: Record<string, string> = {
    width: book.number === 1 ? "64px" : "52px",
    height: book.number === 1 ? "176px" : "156px",
  };
  if (book.status === "live") {
    // Book 1 — the burgundy cloth of the live Henle course (tone A of the
    // house rotation), gold serif numeral.
    spineStyle["--spine-a"] = "var(--color-burgundy-700)";
    spineStyle["--spine-b"] = "var(--color-burgundy-800)";
    spineStyle["--spine-label"] = "var(--color-gold-300)";
    return (
      <Link
        to={book.entryPath as "/lessons/latin"}
        aria-label={`Book ${romanize(book.number)} · ${book.title} — ${book.subtitle}`}
        style={spineStyle as CSSProperties}
        className="spine spine-henle relative flex flex-col items-center pb-2 pt-3 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
      >
        {ribbon && (
          // Ribbon bookmark hanging from the head of the book (owner
          // doctrine: progress marked by ribbons) — real progress only.
          <span
            aria-hidden="true"
            className={`absolute top-0 right-2 h-5 w-2.5 rounded-b-sm ${
              ribbon === "gold" ? "bg-gold-400" : "bg-gold-200"
            }`}
          />
        )}
        <span className="spine-label font-book text-xl leading-none">{romanize(book.number)}</span>
      </Link>
    );
  }
  // Book 2 (scaffold) — a distinct, scholarly wood-cloth volume (same
  // pattern, inline custom props). No dust, no lock, no progress: it is a
  // real book whose content is arriving. Opens the shell on this shelf page.
  spineStyle["--spine-a"] = "var(--color-wood-400)";
  spineStyle["--spine-b"] = "var(--color-wood-700)";
  spineStyle["--spine-label"] = "var(--color-cream-50)";
  return (
    <Link
      to="/shelf/$language"
      params={{ language: "latin" }}
      search={{ book: book.number }}
      aria-label={`Book ${romanize(book.number)} · ${book.title} — ${book.subtitle}`}
      style={spineStyle as CSSProperties}
      className="spine spine-henle relative flex flex-col items-center pb-2 pt-3 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
    >
      <span className="spine-label font-book text-xl leading-none">{romanize(book.number)}</span>
    </Link>
  );
}

type RibbonTone = "gold" | "pale" | null;

/** Whole-course ribbon: gold when every completed chapter averages ≥80,
    pale when any progress exists, null when none (never fabricated). */
function ribbonForBook(
  progressByLesson: Map<number, LessonProgress>,
  chapterCount: number,
): RibbonTone {
  const completed = [...progressByLesson.values()].filter((p) => p.completed);
  if (completed.length === 0) return null;
  const avg = completed.reduce((sum, p) => sum + p.bestScore, 0) / completed.length;
  if (completed.length >= chapterCount && avg >= 80) return "gold";
  return "pale";
}

function romanize(n: number): string {
  return ["I", "II", "III", "IV", "V"][n - 1] ?? String(n);
}
