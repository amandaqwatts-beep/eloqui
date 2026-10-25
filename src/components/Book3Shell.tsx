/**
 * Book3Shell.tsx — Book 3's study room (Caesar's Gallic War, the first
 * ORIGINAL, plan rev 75).
 *
 * An original is a separate book on the shelf, not a view inside a textbook.
 * This page is HONEST-EMPTY: the eight books of the Gallic War stand here as
 * structure with section anchors (gallicWar.ts); the public-domain text lands
 * with the capture pipeline — adapted for readability as part of the book
 * itself — and nothing here pretends otherwise (Minimalist Scholarly, rev 72:
 * no badges, no artifice, no fake progress, no invented text, not even a
 * sample translation).
 *
 * Book 2's Path 2 ("All the Caesar, in Order") reads this book as its
 * companion — a quiet link points back to Book 2's study room.
 */
import { Link } from "@tanstack/react-router";
import type { LanguageShelf } from "~/data/shelves";
import { GALLIC_WAR_META, GALLIC_WAR_STRUCTURE } from "~/data/gallicWar";

interface Book3ShellProps {
  shelf: LanguageShelf;
}

export default function Book3Shell({ shelf }: Book3ShellProps) {
  const book = shelf.books.find((b) => b.number === 3);

  return (
    <main className="library-wall min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/shelf/$language"
          params={{ language: shelf.languageId }}
          className="text-sm font-semibold text-burgundy-800 transition hover:text-burgundy-600"
        >
          ← Shelf
        </Link>

        <div className="paper-page mt-6 p-5 sm:p-8">
          <header>
            <p className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
              Book III · Original · {book?.source ?? GALLIC_WAR_META.latinTitle}
            </p>
            <h1 className="paper-title mt-1 text-3xl">{book?.title ?? "Caesar's Gallic War"}</h1>
            <p className="font-book mt-1 text-sm italic text-gray-500">
              {GALLIC_WAR_META.latinTitle} · {GALLIC_WAR_META.author}
            </p>
            <div className="paper-rule mt-3" />
            <p className="mt-4 text-sm leading-relaxed text-gray-700">
              The first original on this shelf: the whole campaign, read in its
              own book beside the textbooks — not inside them.
            </p>
          </header>

          {/* Honest status — what exists (structure) and what arrives (the
              adapted text, via the capture pipeline). Nothing more. */}
          <div className="mt-5 rounded-lg border border-wood-200 bg-cream-100 px-4 py-3">
            <p className="text-xs leading-relaxed text-wood-800">
              {GALLIC_WAR_META.adaptationNote} {GALLIC_WAR_META.sourcingNote}
            </p>
          </div>

          {/* The companion bridge — Book 2's Path 2 reads this book. */}
          <p className="font-book mt-5 text-xs italic text-gray-500">
            Companion reading: Book 2's Path 2 —{" "}
            <Link
              to="/shelf/$language"
              params={{ language: shelf.languageId }}
              search={{ book: 2 }}
              className="font-semibold not-italic text-burgundy-700 transition hover:text-burgundy-600"
            >
              "All the Caesar, in Order" — reads this book alongside its
              exercises. Open Book 2 →
            </Link>
          </p>

          {/* ── The structural skeleton — structure, not content ── */}
          <section className="mt-8" aria-label="The Gallic War's structure">
            <h2 className="paper-title text-lg">The Eight Books</h2>
            <p className="mt-1 text-xs text-gray-500">
              The received text, book by book — each with its section anchors.
              The capture pipeline fills them in book order.
            </p>
            <div className="mt-4 space-y-4">
              {GALLIC_WAR_STRUCTURE.map((part) => (
                <GwBookBlock key={part.id} part={part} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/** One book of the Gallic War: serif heading, wayfinding subtitle, its
    section anchors as quiet rows. Every row is awaiting-capture — stated
    once per book, not per row. No folios: the original has no owner folio
    map; chapters are anchored at capture. */
function GwBookBlock({
  part,
}: {
  part: (typeof GALLIC_WAR_STRUCTURE)[number];
}) {
  return (
    <div className="rounded-xl border border-burgundy-100 bg-white/70 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-book text-sm font-bold text-burgundy-900">
          {part.title}
        </h3>
        <span className="font-book text-[11px] italic text-gray-500">
          {part.chapters} chapters
        </span>
      </div>
      <p className="mt-0.5 text-xs text-gray-600">{part.subtitle}</p>
      <ul className="mt-3 space-y-1.5">
        {part.sections.map((section) => (
          <li
            key={section.id}
            className="rounded-lg px-2 py-1.5 text-xs text-gray-800 odd:bg-cream-50/70"
          >
            {section.title}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {part.sections.length} section{part.sections.length === 1 ? "" : "s"} ·
        all awaiting capture
      </p>
    </div>
  );
}
