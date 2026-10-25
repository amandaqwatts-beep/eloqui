/**
 * Book2Shell.tsx — Book 2's study room (Henle Second Year Latin).
 *
 * STAGE A (scaffold pass): the shell + the book's STRUCTURAL skeleton from
 * latin2-folio-map.md — Parts I–IV + end matter as parts/sections with folio
 * anchors, every node marked awaiting-capture. STRUCTURE, NOT CONTENT: no
 * lesson text, no exercises, no fake progress — the capture pipeline fills
 * the skeleton and the two-path selector composes on top (next commit).
 *
 * Theme: paper windows pattern — a .paper-page sheet lying on the shelf's
 * desk (.library-wall behind), serif titles, gold page marker. Minimalist
 * Scholarly: honest empty states, no badges, no artifice (rev 72).
 */
import { Link } from "@tanstack/react-router";
import type { LanguageShelf } from "~/data/shelves";
import {
  LATIN2_EXERCISES_SPINE,
  LATIN2_STRUCTURE,
  type Latin2Part,
} from "~/data/latin2";

interface Book2ShellProps {
  shelf: LanguageShelf;
}

export default function Book2Shell({ shelf }: Book2ShellProps) {
  const book = shelf.books.find((b) => b.number === 2);
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
              Book II · {book?.source}
            </p>
            <h1 className="paper-title mt-1 text-3xl">
              {book?.title ?? "Henle Second Year Latin"}
            </h1>
            <div className="paper-rule mt-3" />
            <p className="mt-4 text-sm leading-relaxed text-gray-700">
              Second-year Latin opens with review — Exercises 1–16 run
              simultaneous with the reading from day one, while the reading
              itself ramps up through the review stretch.
            </p>
            <p className="mt-3 rounded-xl border border-wood-200 bg-cream-100 px-3 py-2 text-xs text-wood-800">
              The book's structure is in place below. The reading and exercises
              land with the capture pipeline — nothing here is playable yet,
              and nothing pretends to be.
            </p>
          </header>

          {/* ── The shared review spine (owner directive, plan rev 74) ── */}
          <section className="mt-8" aria-label="The shared review spine">
            <h2 className="paper-title text-lg">{LATIN2_EXERCISES_SPINE.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              {LATIN2_EXERCISES_SPINE.description}
            </p>
            <p className="font-book mt-2 text-xs italic text-gray-500">
              Part IV, pp. {LATIN2_EXERCISES_SPINE.folioRange[0]}–
              {LATIN2_EXERCISES_SPINE.folioRange[1]} · shared by both reading
              paths
            </p>
          </section>

          {/* Two reading paths arrive here (next commit) — the selector. */}

          {/* ── The structural skeleton — structure, not content ── */}
          <section className="mt-8" aria-label="The book's structure">
            <h2 className="paper-title text-lg">The Book's Structure</h2>
            <p className="mt-1 text-xs text-gray-500">
              Parts and sections exactly as the book lays them out — the
              capture pipeline fills them in book order.
            </p>
            <div className="mt-4 space-y-4">
              {LATIN2_STRUCTURE.map((part) => (
                <PartBlock key={part.id} part={part} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/** One part of the book: serif heading, folio span, its sections as quiet
    rows. Every row is awaiting-capture — stated once per part, not per row. */
function PartBlock({ part }: { part: Latin2Part }) {
  const [, end] = part.folioRange;
  return (
    <div className="rounded-xl border border-burgundy-100 bg-white/70 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-book text-sm font-bold text-burgundy-900">
          {part.title}
        </h3>
        <span className="font-book text-[11px] italic text-gray-500">
          pp. {part.folioRange[0]}
          {end != null ? `–${end}` : " →"}
        </span>
      </div>
      {part.subtitle && (
        <p className="mt-0.5 text-xs text-gray-600">{part.subtitle}</p>
      )}
      <ul className="mt-3 space-y-1.5">
        {part.sections.map((section) => (
          <li
            key={section.id}
            className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 odd:bg-cream-50/70"
          >
            <span className="min-w-0 text-xs text-gray-800">{section.title}</span>
            <span className="font-book shrink-0 text-[11px] italic text-gray-400">
              {section.folio != null ? `p. ${section.folio}` : "—"}
            </span>
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
