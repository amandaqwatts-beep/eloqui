/**
 * ShelfView.tsx — the language SHELF (shelf-book architecture, plan rev 73).
 *
 * A shelf = a language; the books standing on it are its first-class books.
 * The Latin shelf holds three siblings: Book 1 (Henle First Year — the live
 * course, opening its existing /lessons/latin route untouched), Book 2
 * (Henle Second Year — present as a real book, opening the scaffold shell),
 * and Book 3 (Caesar's Gallic War — the first ORIGINAL, plan rev 75, opening
 * its own honest-empty study room).
 *
 * Theme: the Bookshelf v2.1 patterns exactly — .library-wall wall, .spine
 * cloth + .shelf-board board, serif (.font-book) labels, gold-ribbon
 * progress (owner doctrine: "progress marked by ribbons") computed ONLY from
 * real progress data. No badges, no artifice (Minimalist Scholarly, rev 72):
 * scaffold books carry NO ribbon and NO progress strip — they have no
 * progress yet.
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
            One shelf, one language. Each book standing here opens its own
            study — open one to begin where you left off.
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
                  {book.kind === "original" ? " · Original" : ""}
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
    scaled up to book size. No locked state: every book here is openable.
    Live books carry real ribbon progress; scaffold books stand bare (no
    ribbon, no progress) — honest empties until their content arrives. */
function ShelfBookSpine({ book, ribbon }: { book: ShelfBook; ribbon: RibbonTone }) {
  // Slight per-tome sizing variance — three volumes should not look die-cut.
  const sizes: Record<number, { width: string; height: string }> = {
    1: { width: "64px", height: "176px" },
    2: { width: "52px", height: "156px" },
    3: { width: "56px", height: "160px" },
  };
  const { width, height } = sizes[book.number] ?? { width: "52px", height: "156px" };
  const spineStyle: Record<string, string> = { width, height };
  const common =
    "spine spine-henle relative flex flex-col items-center pb-2 pt-3 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2";
  const label = (
    <span className="spine-label font-book text-xl leading-none">{romanize(book.number)}</span>
  );
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
        className={common}
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
        {label}
      </Link>
    );
  }
  // Scaffold volumes — real books whose content is arriving, each in its own
  // distinct scholarly cloth. No dust, no lock, no progress. They open their
  // study rooms on this shelf page (?book=N).
  if (book.kind === "original") {
    // The original — deep green cloth, distinct from both Henle tomes (the
    // emerald tones the explore spines already use), gold serif numeral.
    spineStyle["--spine-a"] = "var(--color-emerald-800)";
    spineStyle["--spine-b"] = "var(--color-emerald-900)";
    spineStyle["--spine-label"] = "var(--color-gold-300)";
  } else {
    // Book 2 (textbook scaffold) — a scholarly wood-cloth volume.
    spineStyle["--spine-a"] = "var(--color-wood-400)";
    spineStyle["--spine-b"] = "var(--color-wood-700)";
    spineStyle["--spine-label"] = "var(--color-cream-50)";
  }
  return (
    <Link
      to="/shelf/$language"
      params={{ language: "latin" }}
      search={{ book: book.number }}
      aria-label={`Book ${romanize(book.number)} · ${book.title} — ${book.subtitle}`}
      style={spineStyle as CSSProperties}
      className={common}
    >
      {label}
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
