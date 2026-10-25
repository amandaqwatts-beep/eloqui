/**
 * Book2Shell.tsx — Book 2's study room (Henle Second Year Latin).
 *
 * Owner directive (plan rev 74): TWO READING PATHS. When a student opens
 * Book 2 they choose — Path 1 "Follow the Book" (the book's own adapted
 * Caesar stories, Part II) or Path 2 "All the Caesar, in order" (the full
 * account read in sequence; harder because LONGER, not denser). Both paths
 * share the Exercises 1–16 review spine, which runs simultaneous with the
 * reading from day one.
 *
 * Plan rev 75 (owner 2026-10-25): Path 2 is the COMPANION-READING BRIDGE to
 * the Caesar's Gallic War original book (Book 3 on this shelf) — the full
 * campaign is read in the original's own book, adapted for readability as
 * part of that book. The bridge is data (LATIN2_PATHS[].bridgesTo → shelf
 * bookKey); the path remains a preference, not a gate, and the E1–16 spine
 * framing is unchanged.
 *
 * The selector routes to honest empty path views — the reading and exercises
 * land with the capture pipeline, and nothing here pretends otherwise
 * (Minimalist Scholarly, rev 72: no badges, no artifice, no fake progress).
 * The path CHOICE persists via book2Progress.ts; the per-path progress record
 * is the seam the content pipeline fills later.
 *
 * Below the selector, the book's STRUCTURAL skeleton renders from
 * latin2-folio-map.md — Parts I–IV + end matter with folio anchors, every
 * node awaiting-capture. STRUCTURE, NOT CONTENT.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { LanguageShelf } from "~/data/shelves";
import {
  LATIN2_EXERCISES_SPINE,
  LATIN2_PATHS,
  LATIN2_STRUCTURE,
  type Latin2PathId,
} from "~/data/latin2";
import {
  loadBook2Progress,
  saveBook2PathChoice,
  type Latin2PathProgress,
} from "~/lib/book2Progress";

interface Book2ShellProps {
  shelf: LanguageShelf;
}

export default function Book2Shell({ shelf }: Book2ShellProps) {
  const book = shelf.books.find((b) => b.number === 2);
  // The saved choice (if any) opens straight to that path's view; switching
  // is always one click away — a preference, not a gate.
  const [progress, setProgress] = useState<Latin2PathProgress>(() =>
    loadBook2Progress(),
  );
  const [choosing, setChoosing] = useState<boolean | null>(null);
  const showSelector = choosing ?? progress.path == null;
  const activePath = LATIN2_PATHS.find((p) => p.id === progress.path) ?? null;

  const choose = (id: Latin2PathId) => {
    setProgress(saveBook2PathChoice(id));
    setChoosing(false);
  };

  // The shared spine's 16 exercise rows, resolved from Part IV in book order.
  const spineRows = useMemo(() => {
    const part4 = LATIN2_STRUCTURE.find((p) => p.id === "part-4");
    if (!part4) return [];
    return LATIN2_EXERCISES_SPINE.sectionIds
      .map((id) => part4.sections.find((s) => s.id === id))
      .filter((s) => s !== undefined);
  }, []);

  // The companion-reading bridge (plan rev 75): Path 2 reads the campaign in
  // the original's own book on this shelf. Resolved from the path data by
  // bookKey — the bridge is data, not a hard-coded link.
  const bridge = LATIN2_PATHS.find((p) => p.bridgesTo)?.bridgesTo;
  const bridgeBook = bridge
    ? shelf.books.find((b) => b.bookKey === bridge.bookKey)
    : undefined;

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
          </header>

          {/* ── The two reading paths (owner directive, plan rev 74) ── */}
          <section className="mt-8" aria-label="Choose your reading path">
            <h2 className="paper-title text-lg">Two Reading Paths</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              Both paths run the same review spine; what differs is the
              reading. You can switch whenever you like — this is a preference,
              not a gate.
            </p>

            {showSelector ? (
              <>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {LATIN2_PATHS.map((path, i) => (
                    <button
                      key={path.id}
                      type="button"
                      onClick={() => choose(path.id)}
                      aria-label={`Choose Path ${i + 1}: ${path.title}`}
                      className="book-panel p-4 text-left transition hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
                        Path {i + 1}
                      </p>
                      <h3 className="paper-title mt-1 text-base">{path.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-gray-700">
                        {path.description}
                      </p>
                      <p className="font-book mt-2 text-[11px] italic text-gray-500">
                        {path.difficulty}
                      </p>
                      <p className="mt-3 text-xs font-bold text-burgundy-700">
                        Choose this path →
                      </p>
                    </button>
                  ))}
                </div>
                {bridge && bridgeBook && (
                  // The companion-reading bridge (plan rev 75) — Path 2's
                  // campaign lives in the original's own book, on this shelf.
                  <p className="font-book mt-3 text-xs italic text-gray-500">
                    Path 2 reads the campaign in its own book:{" "}
                    <Link
                      to="/shelf/$language"
                      params={{ language: shelf.languageId }}
                      search={{ book: bridgeBook.number }}
                      className="font-semibold not-italic text-burgundy-700 transition hover:text-burgundy-600"
                    >
                      {bridgeBook.title} — Book {romanBook(bridgeBook.number)} on
                      this shelf →
                    </Link>
                  </p>
                )}
              </>
            ) : activePath ? (
              <PathView
                pathId={activePath.id}
                title={activePath.title}
                description={activePath.description}
                opensWith={activePath.opensWith}
                bridgeBook={activePath.bridgesTo ? bridgeBook : undefined}
                spineRows={spineRows}
                progress={progress}
                onChangePath={() => setChoosing(true)}
              />
            ) : null}
          </section>

          {/* ── The shared review spine (visible even while choosing) ── */}
          {showSelector && (
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
          )}

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

/** The honest per-path view: the path's reading outline (Path 1 lists the
    book's own stories; Path 2 bridges to the original's own book), the
    shared exercises spine, and a truthful progress line. Everything is
    awaiting-capture. */
function PathView({
  pathId,
  title,
  description,
  opensWith,
  bridgeBook,
  spineRows,
  progress,
  onChangePath,
}: {
  pathId: Latin2PathId;
  title: string;
  description: string;
  opensWith: string;
  /** The companion-reading target (Path 2 only) — the original on this shelf. */
  bridgeBook?: LanguageShelf["books"][number];
  spineRows: { id: string; title: string; folio: number | null }[];
  progress: Latin2PathProgress;
  onChangePath: () => void;
}) {
  const pathNo = pathId === "book" ? 1 : 2;
  // Path 1's reading outline IS Part II — the book's eleven stories. Path 2
  // reads the campaign in the original's own book (its bridge target); its
  // chapters land here once the text is sourced, adapted, and captured.
  const part2 = LATIN2_STRUCTURE.find((p) => p.id === "part-2");
  const storyRows =
    pathId === "book" ? (part2?.sections ?? []) : [];

  return (
    <div className="mt-4 space-y-4">
      <div className="book-panel p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
              Path {pathNo}
            </p>
            <h3 className="paper-title mt-0.5 text-base">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onChangePath}
            className="text-xs font-semibold text-burgundy-600 transition hover:text-burgundy-800"
          >
            Change path
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gray-700">{description}</p>
        <p className="mt-2 rounded-lg border border-wood-200 bg-cream-100 px-3 py-2 text-xs text-wood-800">
          Opens with: {opensWith} — the capture pipeline is filling the book in
          order; this view will carry the reading and its exercises as they
          land.
        </p>
        {/* Per-path progress seam — truthful: nothing recorded yet. */}
        <p className="mt-2 text-xs text-gray-500">
          {progress.completedSectionIds.length > 0
            ? `${progress.completedSectionIds.length} section${progress.completedSectionIds.length === 1 ? "" : "s"} recorded on this path.`
            : "No progress recorded yet — the first exercises and chapters arrive with the capture pipeline."}
        </p>
      </div>

      {/* The path's reading outline. */}
      <div className="rounded-xl border border-burgundy-100 bg-white/70 p-4">
        <h4 className="font-book text-sm font-bold text-burgundy-900">
          {pathId === "book" ? "The Reading — the book's eleven stories" : "The Reading — Caesar's own account, in order"}
        </h4>
        {storyRows.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {storyRows.map((section, i) => (
              <li
                key={section.id}
                className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 odd:bg-cream-50/70"
              >
                <span className="min-w-0 text-xs text-gray-800">
                  {i + 1}. {section.title}
                </span>
                <span className="font-book shrink-0 text-[11px] italic text-gray-400">
                  {section.folio != null ? `p. ${section.folio}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 text-xs leading-relaxed text-gray-600">
            <p>
              The longer road: the Gallic War read forward from the beginning —
              harder not because it is denser, but because it is longer. The
              full campaign is read in the original's own book on this shelf,
              adapted for readability as part of that book.
            </p>
            {bridgeBook && (
              <Link
                to="/shelf/$language"
                params={{ language: "latin" }}
                search={{ book: bridgeBook.number }}
                className="font-book mt-3 inline-block text-xs font-semibold not-italic text-burgundy-700 transition hover:text-burgundy-600"
              >
                Read {bridgeBook.title} — Book {romanBook(bridgeBook.number)} on the shelf →
              </Link>
            )}
            <p className="mt-1 text-gray-500">
              Its chapters land with the capture pipeline; the path choice here
              stays a preference, not a gate.
            </p>
          </div>
        )}
      </div>

      {/* The shared exercises spine — identical for both paths. */}
      <div className="rounded-xl border border-teal-200 bg-white/70 p-4">
        <h4 className="font-book text-sm font-bold text-burgundy-900">
          The Shared Spine — Exercises 1–16
        </h4>
        <p className="mt-1 text-xs text-gray-600">
          Review of First Year material, run simultaneous with the reading from
          day one on either path.
        </p>
        <ul className="mt-3 space-y-1.5">
          {spineRows.map((section) => (
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
      </div>
    </div>
  );
}

/** One part of the book: serif heading, folio span, its sections as quiet
    rows. Every row is awaiting-capture — stated once per part, not per row. */
function PartBlock({
  part,
}: {
  part: (typeof LATIN2_STRUCTURE)[number];
}) {
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

/** Roman numeral for a shelf book number (spine/caption style). */
function romanBook(n: number): string {
  return ["I", "II", "III", "IV", "V"][n - 1] ?? String(n);
}
