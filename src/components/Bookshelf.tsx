/**
 * Bookshelf.tsx — shelf-style lesson navigation v2 (presentational, screens
 * dept).
 *
 * v2 (bookLessons present): one physical book = one Henle lesson; chapters =
 * sub-lessons. Books are grouped by unit, units greedily packed onto physical
 * shelves (packShelves), and each book expands in place to a chapter panel.
 * Culture books (per-unit Culture Corner) and Explore books (one per side
 * lesson) sit at the end of their unit cluster with distinct spines and
 * separate lock state. Everything reads `unlockedLessons` / `lessonProgress`
 * and calls the existing `onSelectLesson(idx)` — zero engine changes.
 *
 * v1 (bookLessons absent — English route / migration valve): the original
 * UNIT_MAP shelf retained verbatim below.
 *
 * ⚠️ ARRAY-ORDER CONSTRAINT — never reorder `latinLessons.ts`, and never sort
 * books/chapters by id. Display order derives from ARRAY INDEX (unlock order);
 * `subLessonIds` arrays are membership sets only. See bookshelfModel.ts.
 */
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { Lesson, CultureQuestionExercise } from "~/data/latinLessons";
import type { BookLesson } from "~/data/bookLessons";
import type { SideLesson } from "~/data/latinSideLessons";
import type { LessonProgress } from "~/engine/progress";
import type { ExerciseResultDetail } from "~/engine/types";
import { buildBookshelfModel, type ShelfBook } from "~/lib/bookshelfModel";
import { packShelves, type PackableUnit } from "~/lib/shelfPacking";
import { useBookshelfCapacity } from "~/lib/useBookshelfCapacity";
import { CULTURE_TEACHING } from "~/data/cultureTeaching";
import CultureQuestion from "~/components/CultureQuestion";
import TeachingStepCard from "~/components/TeachingStepCard";
import MultipleChoice from "~/components/MultipleChoice";
import MatchingPairs from "~/components/MatchingPairs";

export interface UnitShelf {
  unit: number;
  startId: number;
  endId: number;
}

/** Latin curriculum unit boundaries (verified against lesson-mapping.md). */
export const UNIT_MAP: UnitShelf[] = [
  { unit: 1, startId: 1, endId: 25 }, // Lessons 1-6 + Review 25
  { unit: 2, startId: 26, endId: 33 }, // Lessons 7-8 + Mastery Review #1
  { unit: 3, startId: 34, endId: 52 }, // Lessons 9-14
  { unit: 4, startId: 53, endId: 58 }, // Lessons 15-16
  { unit: 5, startId: 59, endId: 70 }, // Lessons 17-21 + Mastery Review #2
  { unit: 6, startId: 71, endId: 81 }, // Lessons 22-24 (subjunctive; purpose; relative clauses)
  { unit: 7, startId: 82, endId: 88 }, // Lessons 25-26 (direct questions; perfect/pluperfect subjunctive)
  { unit: 8, startId: 89, endId: 96 }, // Lessons 27-30 (perfect passive system; participles; ablative absolute)
  { unit: 9, startId: 97, endId: 103 }, // Lessons 30-34 (perfect passive participle; hic/ille/is; ablative constructions)
  { unit: 10, startId: 104, endId: 109 }, // Lessons 34-36 (possum; infinitives as subject/object; numerals; -īus adjectives)
  { unit: 11, startId: 110, endId: 118 }, // Lessons 37-38 (-iō verbs; rules for time; dative verbs; passive of calling)
  { unit: 12, startId: 119, endId: 122 }, // Lesson 39 (perfect/future active infinitives; ACI/indirect statement; passive infinitives)
  { unit: 13, startId: 123, endId: 130 }, // Lessons 40-41 (comparison of adjectives; deponent verbs)
  { unit: 14, startId: 131, endId: 134 }, // Lesson 42 (eō) + Mastery Review #3
];

/** Unlocked palette rotation (firstIdx % 4); current book is forced gold. */
const UNLOCKED_PALETTE = [
  "bg-burgundy-700 text-cream-50",
  "bg-gold-500 text-burgundy-950",
  "bg-burgundy-800 text-cream-50",
  "bg-cream-300 text-burgundy-900",
];

interface BookshelfProps {
  lessons: Lesson[];
  unlockedLessons: number; // from useLessonEngine — the persisted frontier
  lessonProgress?: LessonProgress[]; // from loadProgress(language.id) — optional
  onSelectLesson: (idx: number) => void; // engine selectLesson — ARRAY INDEX, not id
  unitMap?: UnitShelf[]; // v1 fallback: default = Latin UNIT_MAP
  // ── v2 (bookLessons present → packed Henle-book shelves) ──
  bookLessons?: BookLesson[];
  sideLessons?: SideLesson[];
  onCultureResult?: (
    exercise: CultureQuestionExercise,
    hostLessonId: number,
    detail: ExerciseResultDetail,
  ) => void;
  focusRequest?: { bookKey: string; nonce: number } | null;
  /** F13 — sessionStorage frontier key scope (per-language). Default "latin". */
  languageId?: string;
  /** F13 — skip the scroll-to-frontier on mode returns (frontier unchanged
   *  since the last menu mount); the frontier book still expands. */
  suppressFrontierScroll?: boolean;
  /** P2 (review-system rework) — unit-review books: call to start the unit's
   *  review session (the route composes the items and owns the session). */
  onOpenUnitReview?: (unitNumber: number) => void;
  /** P2 — units whose review is unlocked. Computed by the route via
   *  isUnitComplete(UNIT_REVIEWS[n-1], loadProgress(language.id)) — NEVER the
   *  unlockedLessons frontier (design edges #4/#12). */
  unitReviewUnlocked?: Set<number>;
}

export default function Bookshelf(props: BookshelfProps) {
  if (props.bookLessons && props.bookLessons.length > 0) {
    return <BookshelfV2 {...props} />;
  }
  return <BookshelfV1 {...props} />;
}

/* ═══════════════════════════ v1 — legacy UNIT_MAP path (verbatim) ═══════════════════════════ */

interface BookData {
  lesson: Lesson;
  idx: number; // array index in `lessons` (what onSelectLesson expects)
  locked: boolean;
  isCurrent: boolean;
}

function BookshelfV1({
  lessons,
  unlockedLessons,
  lessonProgress,
  onSelectLesson,
  unitMap = UNIT_MAP,
}: BookshelfProps) {
  // Lesson id → array index (spine ids map back to onSelectLesson indices).
  const idToIdx = useMemo(
    () => new Map(lessons.map((l, i) => [l.id, i] as const)),
    [lessons],
  );
  const progressById = useMemo(
    () => new Map((lessonProgress ?? []).map((p) => [p.lessonId, p])),
    [lessonProgress],
  );

  // Frontier = highest unlocked sub-lesson (persisted position). Clamped so
  // stale storage can never produce an out-of-range current book.
  const currentIdx = Math.min(Math.max(unlockedLessons, 1), lessons.length) - 1;
  const currentLessonId = lessons[currentIdx]?.id;
  const currentUnit =
    currentLessonId == null
      ? undefined
      : unitMap.find(
          (u) => currentLessonId >= u.startId && currentLessonId <= u.endId,
        )?.unit;

  const shelfRefs = useRef(new Map<number, HTMLDivElement | null>());

  // Auto-open: scroll the current unit's shelf into view (instant, so it is
  // reduced-motion safe). scroll-mt-24 clears the sticky NavBar.
  useEffect(() => {
    if (currentUnit == null) return;
    const el = shelfRefs.current.get(currentUnit);
    if (el) el.scrollIntoView({ block: "start" });
  }, [currentUnit]);

  return (
    <div className="space-y-9">
      {unitMap.map((u) => {
        const rows = lessons
          .map((l, i) => ({ lesson: l, idx: idToIdx.get(l.id) ?? i }))
          .filter(
            ({ lesson }) => lesson.id >= u.startId && lesson.id <= u.endId,
          )
          .map<BookData>(({ lesson, idx }) => ({
            lesson,
            idx,
            locked: idx >= unlockedLessons,
            isCurrent: idx === currentIdx,
          }));
        if (rows.length === 0) return null;
        return (
          <Shelf
            key={u.unit}
            unit={u.unit}
            rows={rows}
            progressById={progressById}
            onSelectLesson={onSelectLesson}
            shelfRef={(el) => {
              if (el) shelfRefs.current.set(u.unit, el);
              else shelfRefs.current.delete(u.unit);
            }}
          />
        );
      })}
    </div>
  );
}

interface ShelfProps {
  unit: number;
  rows: BookData[];
  progressById: Map<number, LessonProgress>;
  onSelectLesson: (idx: number) => void;
  shelfRef: (el: HTMLDivElement | null) => void;
}

function Shelf({ unit, rows, progressById, onSelectLesson, shelfRef }: ShelfProps) {
  return (
    <section
      ref={shelfRef}
      aria-label={`Unit ${unit} bookshelf`}
      className="scroll-mt-24"
    >
      <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-burgundy-800">
        Unit {unit}
      </h3>
      <div className="relative z-0 flex flex-wrap items-end gap-2 pt-3">
        {rows.map((data) => (
          <Book
            key={data.lesson.id}
            data={data}
            progress={progressById.get(data.lesson.id)}
            onSelect={onSelectLesson}
          />
        ))}
      </div>
      {/* Shelf board */}
      <div className="border-b-4 border-amber-900/40" />
    </section>
  );
}

interface BookProps {
  data: BookData;
  progress?: LessonProgress;
  onSelect: (idx: number) => void;
}

function Book({ data, progress, onSelect }: BookProps) {
  const { lesson, idx, locked, isCurrent } = data;
  // Bookmark tab from loadProgress: gold ≥80, pale gold <80, none if never completed.
  const bookmark = progress?.completed
    ? progress.bestScore >= 80
      ? "bg-gold-400"
      : "bg-gold-200"
    : null;
  return (
    <button
      type="button"
      onClick={() => onSelect(idx)}
      disabled={locked}
      aria-disabled={locked || undefined}
      aria-current={isCurrent ? "true" : undefined}
      aria-label={`Lesson ${lesson.id}: ${lesson.title}`}
      title={`Lesson ${lesson.id}: ${lesson.title}`}
      className={`relative flex h-14 w-9 flex-col items-center justify-end rounded-t-sm pb-1 sm:h-16 sm:w-11 ${
        locked
          ? "cursor-not-allowed border border-gray-300 bg-gray-200 text-gray-400 shadow-none"
          : isCurrent
            ? "-translate-y-2 bg-gold-500 text-burgundy-950 shadow-xl ring-2 ring-gold-500 sm:-translate-y-3 z-10"
            : `shadow-md ${UNLOCKED_PALETTE[idx % 4]} hover:brightness-110`
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2`}
    >
      {bookmark && (
        <span
          aria-hidden="true"
          className={`absolute -top-1 right-0.5 h-2 w-3 rounded-t-sm ${bookmark}`}
        />
      )}
      <span className="text-[10px] font-black leading-none sm:text-xs">
        {lesson.id}
      </span>
    </button>
  );
}

/* ═══════════════════════════ v2 — packed Henle-book shelves ═══════════════════════════ */

type BookmarkTone = "gold" | "pale" | null;

function BookshelfV2({
  lessons,
  unlockedLessons,
  lessonProgress,
  onSelectLesson,
  bookLessons = [],
  sideLessons = [],
  onCultureResult,
  focusRequest,
  languageId = "latin",
  suppressFrontierScroll = false,
  onOpenUnitReview,
  unitReviewUnlocked,
}: BookshelfProps) {
  const model = useMemo(
    () => buildBookshelfModel(lessons, bookLessons, sideLessons),
    [lessons, bookLessons, sideLessons],
  );
  const booksByUnit = useMemo(() => {
    const m = new Map<number, ShelfBook[]>();
    for (const b of model.books) {
      const arr = m.get(b.unit) ?? [];
      arr.push(b);
      m.set(b.unit, arr);
    }
    return m;
  }, [model.books]);

  const idToIdx = useMemo(
    () => new Map(lessons.map((l, i) => [l.id, i] as const)),
    [lessons],
  );
  const progressById = useMemo(
    () => new Map((lessonProgress ?? []).map((p) => [p.lessonId, p])),
    [lessonProgress],
  );
  const sideLessonById = useMemo(
    () => new Map(sideLessons.map((s) => [s.id, s])),
    [sideLessons],
  );

  const unitVector: PackableUnit[] = useMemo(
    () =>
      [...booksByUnit.keys()]
        .sort((a, b) => a - b)
        .map((unit) => ({ unit, bookCount: booksByUnit.get(unit)?.length ?? 0 })),
    [booksByUnit],
  );

  const { ref: capacityRef, capacity } = useBookshelfCapacity<HTMLDivElement>();
  const packed = useMemo(
    () => packShelves(unitVector, capacity),
    [unitVector, capacity],
  );

  // Frontier (clamped for stale storage) + the book that holds the frontier chapter.
  const currentIdx = Math.min(Math.max(unlockedLessons, 1), lessons.length) - 1;
  const currentLesson = lessons[currentIdx];
  const currentBook = currentLesson
    ? model.books.find((b) => b.chapterIds.includes(currentLesson.id))
    : undefined;

  const [expandedBookKey, setExpandedBookKey] = useState<string | null>(null);
  const shelfRefs = useRef(new Map<number, HTMLElement | null>());
  const packedRef = useRef(packed);
  packedRef.current = packed;

  // Auto-open on mount / unlockedLessons change: scroll the packed shelf
  // containing the frontier unit into view (instant — reduced-motion safe),
  // expand the frontier book, then bring the frontier chapter ROW into view
  // (spec §2.2 / audit F2-retargeted: with the "current" marker gone the row
  // itself is where the student actually is; block:"nearest" keeps it inside
  // the fold without yanking the page). The timeout lets the panel commit
  // after setExpandedBookKey. `capacity` is a dependency (F15) so the
  // capacity-8 → measured re-pack re-scrolls instead of orphaning the target.
  //
  // F13 gate (design §1.3): the route sets suppressFrontierScroll when the
  // menu remounts from a mode (drill / placement / AI) with the frontier
  // unchanged since the last visit — the scroll is the "yank" users felt;
  // mode returns keep the expansion but skip both scrolls. Fresh mounts and
  // frontier moves scroll as before. The route persists the last viewed
  // frontier in sessionStorage (keyed by language) to make that call.
  const frontierStorageKey = `eloqui:frontier:${languageId}`;
  useEffect(() => {
    if (!currentBook) return;
    let t = 0;
    if (!suppressFrontierScroll) {
      const shelf = packedRef.current.find((p) => p.units.some((u) => u.unit === currentBook!.unit));
      const el = shelf ? shelfRefs.current.get(shelf.shelfIndex) : null;
      if (el) el.scrollIntoView({ block: "start" });
      t = window.setTimeout(() => {
        const frontierRow = document.querySelector<HTMLElement>("[data-frontier]");
        frontierRow?.scrollIntoView({ block: "nearest" });
      }, 0);
      try {
        sessionStorage.setItem(frontierStorageKey, String(unlockedLessons));
      } catch {
        /* storage unavailable — scroll behavior unchanged */
      }
    }
    setExpandedBookKey(currentBook.bookKey);
    return () => window.clearTimeout(t);
  }, [currentBook, capacity, suppressFrontierScroll, frontierStorageKey, unlockedLessons]);

  // focusRequest (search / explore navigation): same scroll + expand for the
  // requested book, re-fired when the nonce bumps.
  useEffect(() => {
    if (!focusRequest) return;
    const book = model.books.find((b) => b.bookKey === focusRequest.bookKey);
    if (!book) return;
    const shelf = packedRef.current.find((p) => p.units.some((u) => u.unit === book.unit));
    const el = shelf ? shelfRefs.current.get(shelf.shelfIndex) : null;
    if (el) el.scrollIntoView({ block: "start" });
    setExpandedBookKey(book.bookKey);
  }, [focusRequest?.bookKey, focusRequest?.nonce, model.books]);

  const isLocked = (book: ShelfBook) =>
    book.unlockIdx >= unlockedLessons ||
    // P2 — unit-review spines additionally gate on unit completion (design
    // §2.2): the frontier alone (placement jumps / dev-mode unlock) must not
    // open a review for an uncompleted unit (edges #4/#12).
    (book.kind === "unit-review" && !(unitReviewUnlocked?.has(book.unit) ?? false));

  return (
    <div ref={capacityRef} className="library-wall space-y-9">
      {packed.map((shelf) => {
        // F1 — the expansion panel renders at shelf level (below the book
        // row, before the board), so it spans the full shelf width instead of
        // being trapped inside a unit cluster's flex row (which capped it at
        // the cluster width and misaligned sibling clusters via items-end).
        const shelfExpandedBook = shelf.units
          .flatMap((u) => booksByUnit.get(u.unit) ?? [])
          .find((b) => b.bookKey === expandedBookKey);
        return (
          <section
            key={shelf.shelfIndex}
            ref={(el) => {
              if (el) shelfRefs.current.set(shelf.shelfIndex, el);
              else shelfRefs.current.delete(shelf.shelfIndex);
            }}
            aria-label={`Shelf ${shelf.shelfIndex + 1} — Units ${shelf.units.map((u) => u.unit).join(", ")}`}
            className="scroll-mt-24"
          >
            <div className="flex flex-wrap items-start gap-3">
              {shelf.units.map((pu, ui) => (
                <Fragment key={pu.unit}>
                  {ui > 0 && (
                    <div aria-hidden="true" className="w-px self-stretch bg-amber-900/25" />
                  )}
                  <UnitCluster
                    unit={pu.unit}
                    books={booksByUnit.get(pu.unit) ?? []}
                    progressById={progressById}
                    currentBookKey={currentBook?.bookKey}
                    expandedBookKey={expandedBookKey}
                    setExpandedBookKey={setExpandedBookKey}
                    isLocked={isLocked}
                  />
                </Fragment>
              ))}
            </div>
            {shelfExpandedBook && (
              <ExpansionPanel
                key={shelfExpandedBook.bookKey}
                book={shelfExpandedBook}
                lessons={lessons}
                idToIdx={idToIdx}
                progressById={progressById}
                sideLessonById={sideLessonById}
                unlockedLessons={unlockedLessons}
                currentIdx={currentIdx}
                onSelectLesson={onSelectLesson}
                onCultureResult={onCultureResult}
                onOpenUnitReview={onOpenUnitReview}
                unitReviewUnlocked={unitReviewUnlocked}
              />
            )}
            {/* Shelf board */}
            <div className="shelf-board" />
          </section>
        );
      })}
    </div>
  );
}

interface ClusterProps {
  unit: number;
  books: ShelfBook[];
  progressById: Map<number, LessonProgress>;
  currentBookKey?: string;
  expandedBookKey: string | null;
  setExpandedBookKey: (key: string | null) => void;
  isLocked: (book: ShelfBook) => boolean;
}

function UnitCluster({
  unit,
  books,
  progressById,
  currentBookKey,
  expandedBookKey,
  setExpandedBookKey,
  isLocked,
}: ClusterProps) {
  return (
    <div className="flex max-w-full flex-none flex-col">
      <h3 className="mb-1 text-[10px] font-black uppercase tracking-wider text-burgundy-800">
        Unit {unit}
      </h3>
      <div className="relative z-0 flex flex-wrap items-end gap-2 pt-2">
        {books.map((book) => (
          <Spine
            key={book.bookKey}
            book={book}
            locked={isLocked(book)}
            isCurrent={book.bookKey === currentBookKey}
            bookmark={bookmarkFor(book, progressById)}
            progress={chapterProgress(book, progressById)}
            expanded={expandedBookKey === book.bookKey}
            onToggle={() =>
              setExpandedBookKey(expandedBookKey === book.bookKey ? null : book.bookKey)
            }
          />
        ))}
      </div>
    </div>
  );
}

function bookmarkFor(book: ShelfBook, progressById: Map<number, LessonProgress>): BookmarkTone {
  if (book.chapterIds.length === 0) return null;
  const entries = book.chapterIds
    .map((id) => progressById.get(id))
    .filter((p): p is LessonProgress => Boolean(p?.completed));
  if (entries.length === 0) return null;
  if (entries.length < book.chapterIds.length) return "pale";
  const avg = entries.reduce((s, p) => s + p.bestScore, 0) / entries.length;
  return avg >= 80 ? "gold" : "pale";
}

/** Completed/total chapter ratio (0..1) for the spine progress strip
 *  (spec §2.1, optional: a subtle wood-tone fill along the spine foot). */
function chapterProgress(book: ShelfBook, progressById: Map<number, LessonProgress>): number {
  if (book.chapterIds.length === 0) return 0;
  const done = book.chapterIds.filter((id) => progressById.get(id)?.completed).length;
  return done / book.chapterIds.length;
}

/** F6 — reword the book subtitle's "IDs 1–5" developer jargon into a
 *  lessons-based caption ("Lessons 1–5 · Terra → Genitive Case"). */
function lessonsCaption(subtitle: string): string {
  return subtitle.replace(/^IDs?\s+([\d–-]+)/, (_m, nums: string) =>
    nums.includes("–") || nums.includes("-") ? `Lessons ${nums}` : `Lesson ${nums}`,
  );
}

/** Henle 4-tone palette rotation — CSS gradient endpoints for `.spine-henle`. */
const HENLE_TONES = [
  { a: "var(--color-burgundy-700)", b: "var(--color-burgundy-800)", label: "var(--color-gold-300)" },
  { a: "var(--color-gold-500)", b: "var(--color-gold-600)", label: "var(--color-burgundy-950)" },
  { a: "var(--color-burgundy-800)", b: "var(--color-burgundy-900)", label: "var(--color-gold-300)" },
  { a: "var(--color-cream-300)", b: "var(--color-cream-400)", label: "var(--color-burgundy-900)" },
] as const;

/** Q3 resolution — units whose legacy mastery-review spines are demoted to
 *  `.spine-review--legacy` (muted): the review surface is the per-unit review
 *  going forward (design §2.6). Units 1/2/5/14 carry mastery books 7/10/24/46. */
const LEGACY_REVIEW_UNITS = new Set([1, 2, 5, 14]);

/**
 * §B spine geometry — variable, book-driven. Width (thickness) grows with a
 * book's chapter count (clamped) plus a small deterministic hash-of-bookKey
 * jitter, and height varies lightly too, so a shelf reads as a row of organic
 * books rather than identical slabs. Culture/explore (0 chapters) and locked
 * spines keep their own slightly distinct sizes — intentional, not random.
 * Widest stays ≤ 44px (w-11) so shelf packing stays valid against
 * BOOK_SLOT_WIDTH/useBookshelfCapacity (52px slot).
 */
function spineGeometry(book: ShelfBook): { width: number; height: number } {
  const chapters = book.chapterIds.length;
  const hash = [...book.bookKey].reduce(
    (acc, c) => (acc * 31 + c.charCodeAt(0)) % 997,
    7,
  );
  // thickness: 36px base climbing ~1px per chapter (clamped at 6), ±2 jitter
  const width = Math.max(32, Math.min(44, 36 + Math.min(chapters, 6) + ((hash % 5) - 2)));
  // height: 64px base (sm:h-16) lightly varied ±2
  const height = Math.max(54, Math.min(72, 64 + (((hash >> 3) % 5) - 2)));
  return { width, height };
}

function Spine({
  book,
  locked,
  isCurrent,
  bookmark,
  progress,
  expanded,
  onToggle,
}: {
  book: ShelfBook;
  locked: boolean;
  isCurrent: boolean;
  bookmark: BookmarkTone;
  /** Completed/total chapter ratio (0..1) — drives the spine progress strip. */
  progress: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  // Theme classes (§5.3): `.spine` base cloth + per-kind tone; locked spines
  // get the dusted `.spine-locked` treatment regardless of kind. P2: unit-
  // review spines get the deep-teal `.spine-unit-review`; legacy mastery
  // spines in units 1/2/5/14 get the muted `.spine-review--legacy` demotion
  // (Q3 default — the review surface is the per-unit review going forward).
  const kindClass = locked
    ? "spine-locked"
    : book.kind === "unit-review"
      ? "spine-unit-review"
      : book.kind === "review"
        ? LEGACY_REVIEW_UNITS.has(book.unit)
          ? "spine-review spine-review--legacy"
          : "spine-review"
        : book.kind === "culture"
          ? "spine-culture"
          : book.kind === "explore"
            ? "spine-explore"
            : "spine-henle";
  const tone = HENLE_TONES[Math.abs(book.firstIdx) % HENLE_TONES.length];
  // Inline gradient endpoints (custom props / background) — the henle
  // rotation, and the gold "current" book (raised + ringed, same as v2).
  // §B: variable width/height live in the SAME inline style object as the
  // gradient so the book reads as one organic object (gradient + geometry
  // move together; the Tailwind w-/h- classes governing size are removed).
  const kindStyle =
    locked
      ? {}
      : isCurrent
        ? {
            background: "linear-gradient(180deg, var(--color-gold-400), var(--color-gold-500))",
            "--spine-label": "var(--color-burgundy-950)",
          }
        : book.kind === "henle"
          ? {
              background: `linear-gradient(180deg, ${tone.a}, ${tone.b})`,
              "--spine-label": tone.label,
            }
          : {};
  const spineStyle = { ...spineGeometry(book), ...kindStyle };
  const label =
    book.kind === "henle"
      ? book.henleNumber
      : book.kind === "unit-review"
        ? `U${book.unit}`
        : book.kind === "review"
          ? `R${book.unit}`
          : book.kind === "culture"
            ? "🏛️"
            : "✨";
  // F5 — explore spines carry a tiny index number under the glyph so the 16
  // side-lesson books are distinguishable on touch (tooltips don't exist).
  const sideLessonId =
    book.kind === "explore" && book.content && "sideLessonId" in book.content
      ? book.content.sideLessonId
      : null;
  const chapters = book.chapterIds.length;
  // F14 — review spines use the canonical BookLesson title ("Review of Unit
  // 1", "Mastery Review Vocab #1") instead of the generic "Review · Unit N".
  const ariaLabel =
    book.kind === "henle"
      ? `Lesson ${book.henleNumber} · ${book.title} — ${chapters} chapter${chapters === 1 ? "" : "s"}`
      : book.kind === "unit-review"
        ? `${book.title} — ${chapters} chapter${chapters === 1 ? "" : "s"}`
        : book.kind === "review"
          ? `${book.title} — ${chapters} chapter${chapters === 1 ? "" : "s"}`
          : book.kind === "culture"
            ? `Culture Corner — Unit ${book.unit}`
            : `Explore: ${book.title}`;
  const title =
    book.kind === "henle"
      ? `Lesson ${book.henleNumber} · ${book.title} — ${chapters} chapters`
      : ariaLabel;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      aria-disabled={locked || undefined}
      aria-current={isCurrent ? "true" : undefined}
      aria-expanded={expanded || undefined}
      aria-label={ariaLabel}
      title={title}
      style={spineStyle as CSSProperties}
      className={`spine ${kindClass} relative flex flex-col items-center pt-1 pb-1 ${
        isCurrent
          ? "-translate-y-2 shadow-xl ring-2 ring-gold-500 z-10 sm:-translate-y-3"
          : ""
      } ${!locked && !isCurrent ? "hover:brightness-110" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2`}
    >
      {bookmark && (
        <span
          aria-hidden="true"
          className={`absolute -top-1 right-0.5 h-2 w-3 rounded-t-sm ${
            bookmark === "gold" ? "bg-gold-400" : "bg-gold-200"
          }`}
        />
      )}
      <span aria-hidden="true" className="flex flex-col items-center gap-[2px]">
        {Array.from({ length: Math.min(chapters, 6) }).map((_, i) => (
          <span key={i} className="h-0.5 w-1 rounded bg-black/20" />
        ))}
      </span>
      <span className="mt-auto flex flex-col items-center">
        {book.kind === "culture" ? (
          <span className="text-base leading-none">🏛️</span>
        ) : book.kind === "explore" ? (
          <>
            <span className="text-base leading-none">✨</span>
            <span className="spine-label font-book text-[8px] leading-none">
              {sideLessonId}
            </span>
          </>
        ) : (
          <span className="spine-label text-[10px] leading-none sm:text-xs">{label}</span>
        )}
      </span>
      {/* §2.1 — subtle wood-tone progress strip along the spine foot:
          completed/total chapters (bookmark aggregates already encode
          complete/partial; this adds the aggregate as a thin fill). Sits
          just above the `.spine::after` binding band. */}
      {progress > 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0.5 h-0.5 bg-black/15"
        >
          <span
            className="block h-full bg-wood-400"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </span>
      )}
    </button>
  );
}

function ExpansionPanel({
  book,
  lessons,
  idToIdx,
  progressById,
  sideLessonById,
  unlockedLessons,
  currentIdx,
  onSelectLesson,
  onCultureResult,
  onOpenUnitReview,
  unitReviewUnlocked,
}: {
  book: ShelfBook;
  lessons: Lesson[];
  idToIdx: Map<number, number>;
  progressById: Map<number, LessonProgress>;
  sideLessonById: Map<number, SideLesson>;
  unlockedLessons: number;
  currentIdx: number;
  onSelectLesson: (idx: number) => void;
  onCultureResult?: BookshelfProps["onCultureResult"];
  onOpenUnitReview?: (unitNumber: number) => void;
  unitReviewUnlocked?: Set<number>;
}) {
  const header =
    book.kind === "henle"
      ? `Henle Lesson ${book.henleNumber} · ${book.title}`
      : book.kind === "unit-review"
        ? book.title // "Unit N Review" — canonical from the data (P3a)
        : book.kind === "review"
          ? book.title // F14 — canonical title ("Review of Unit 1"), not "Review · Unit N"
          : book.kind === "culture"
            ? `Culture Corner — Unit ${book.unit}`
            : `Explore: ${book.title}`;
  return (
    <div className="book-panel mt-3 w-full p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-extrabold text-burgundy-900">{header}</h4>
        {book.kind === "henle" && (
          <span className="shrink-0 text-[10px] font-semibold text-gray-400">
            {book.chapterIds.length} chapter{book.chapterIds.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {/* F6 — render the book subtitle as a caption under the header,
          reworded from "IDs 1–5" jargon to a lessons-based caption. */}
      {book.subtitle && (
        <p className="mb-3 -mt-1 text-xs text-gray-500">{lessonsCaption(book.subtitle)}</p>
      )}
      {book.kind === "culture" ? (
        <CulturePanel
          book={book}
          lessons={lessons}
          onCultureResult={onCultureResult}
        />
      ) : book.kind === "unit-review" ? (
        // P2 (design §2.2 screens flag): a unit-review book STARTS the review
        // session — it never calls selectLesson. The unit's chapters render
        // read-only below the start CTA (a milestone marker, not a gate).
        <UnitReviewPanel
          book={book}
          lessons={lessons}
          idToIdx={idToIdx}
          unlocked={unitReviewUnlocked?.has(book.unit) ?? false}
          onOpen={() => onOpenUnitReview?.(book.unit)}
        />
      ) : book.kind === "explore" ? (
        book.content && "sideLessonId" in book.content ? (
          <ExploreMiniFlow
            key={book.bookKey}
            lesson={sideLessonById.get(book.content.sideLessonId)}
          />
        ) : null
      ) : (
        <div className="space-y-1.5">
          {book.chapterIds.map((id) => {
            const idx = idToIdx.get(id) ?? -1;
            const lesson = lessons[idx];
            if (!lesson) return null;
            const locked = idx >= unlockedLessons;
            // Frontier = first unlocked chapter with no completion. With
            // contiguous-prefix unlocks the frontier chapter row is the
            // student's actual place — the auto-scroll targets it via
            // data-frontier (spec §2.2 / F2-retargeted). No "current" marker
            // is rendered (owner point 2): the row states are complete /
            // available-incomplete / locked, nothing else.
            const isFrontier = idx === currentIdx;
            const p = progressById.get(id);
            // Number chip by bookmark: gold ≥80 / pale <80 / burgundy
            // (available-incomplete) / gray + 🔒 (locked).
            const chip = locked
              ? "bg-gray-100 text-gray-400"
              : p?.completed
                ? p.bestScore >= 80
                  ? "bg-gold-400 text-burgundy-950"
                  : "bg-gold-200 text-burgundy-900"
                : "bg-burgundy-100 text-burgundy-600";
            return (
              <button
                key={id}
                type="button"
                data-frontier={isFrontier ? "true" : undefined}
                onClick={() => onSelectLesson(idx)}
                disabled={locked}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-2.5 text-left transition ${
                  locked
                    ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                    : "border-transparent bg-white hover:border-burgundy-300 hover:shadow-sm"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${chip}`}>
                  {locked ? "🔒" : id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-burgundy-900">
                    Lesson {id}: {lesson.title}
                  </span>
                  {lesson.subtitle && (
                    <span className="block truncate text-xs text-gray-500">{lesson.subtitle}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * P2 — unit-review expansion panel (design §2.2 screens flag). The unit-review
 * book is a milestone marker, not a gate: STARTING the review is its only
 * action (onOpenUnitReview — the route composes items and owns the session).
 * The unit's chapters are listed READ-ONLY — deliberately NO selectLesson
 * here; unit-review books never open lessons (the next unit already unlocks
 * via the frontier).
 */
function UnitReviewPanel({
  book,
  lessons,
  idToIdx,
  unlocked,
  onOpen,
}: {
  book: ShelfBook;
  lessons: Lesson[];
  idToIdx: Map<number, number>;
  unlocked: boolean;
  onOpen: () => void;
}) {
  const rows = book.chapterIds
    .map((id) => ({ id, lesson: lessons[idToIdx.get(id) ?? -1] }))
    .filter((r): r is { id: number; lesson: Lesson } => r.lesson !== undefined);
  return (
    <div className="space-y-3">
      <p
        className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
          unlocked
            ? "border-teal-200 bg-teal-50 text-teal-800"
            : "border-gray-200 bg-gray-50 text-gray-500"
        }`}
      >
        {unlocked
          ? `Unit ${book.unit} complete — review it`
          : `Complete Unit ${book.unit} to unlock this review`}
      </p>
      <button
        type="button"
        onClick={onOpen}
        disabled={!unlocked}
        className="w-full rounded-xl bg-teal-700 py-3 text-sm font-bold text-cream-50 shadow transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start Unit {book.unit} Review →
      </button>
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Unit {book.unit} lessons
        </p>
        {rows.map(({ id, lesson }) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-xl border border-burgundy-100 bg-cream-50/60 p-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-burgundy-100 text-xs font-bold text-burgundy-700">
              {id}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-burgundy-900">
                Lesson {id}: {lesson.title}
              </span>
              {lesson.subtitle && (
                <span className="block truncate text-xs text-gray-500">{lesson.subtitle}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rēs Rōmānae unit themes (culture-teaching-design.md §2.2) — the culture
 * books are teach-then-quiz books, so each panel opens with its unit's theme. */
const UNIT_CULTURE_INTROS: Record<number, string> = {
  1: "The world of the early Republic: land, province, and city.",
  2: "Rome and Gaul: roads, bridges, kings, and the Republic.",
  3: "Caesar's army: the legion, the camp, weapons, and the Rubicon.",
  4: "The past and the family: Hannibal, schooling, the household, and Roman names.",
  5: "Slavery and freedom: manumission, the familia, the freedman, and Spartacus.",
};

/** One culture-book entry: a culture-question exercise + its host lesson id. */
interface CultureEntry {
  hostLessonId: number;
  exerciseId: string;
  exercise: CultureQuestionExercise;
}

/**
 * Dense culture book (PR-E / owner point 3): read-then-quiz, one book per unit.
 *
 * LEARN — the unit's CULTURE_TEACHING bundles as accordion sections, one open
 * at a time (auto-open section 1). Each section names its host lesson so a
 * locked host still gives the student context (F9). "Skip to practice →" is
 * always available at the top — enrichment, never gated.
 *
 * PRACTICE — the unit's quizzes one at a time: the bundle's advisory check,
 * then the quiz via CultureQuestion with teaching skipped (startAt="quiz").
 * After submit: existing feedback + fact-check caption + "Next section →"
 * (or "Finish" on the last). Completion footer: nothing saved to progress.
 *
 * Enrichment policy: every question is playable regardless of host-lesson
 * lock, and onComplete/onResult fire only on quiz submit (diagnostics only —
 * no progress writes, unchanged).
 */
function CulturePanel({
  book,
  lessons,
  onCultureResult,
}: {
  book: ShelfBook;
  lessons: Lesson[];
  onCultureResult?: BookshelfProps["onCultureResult"];
}) {
  const questions: CultureEntry[] = (
    book.content && "questions" in book.content ? book.content.questions : []
  )
    .map((q) => {
      const host = lessons.find((l) => l.id === q.hostLessonId);
      const exercise = host?.exercises.find((e) => e.id === q.exerciseId);
      return exercise?.type === "culture-question"
        ? { hostLessonId: q.hostLessonId, exerciseId: q.exerciseId, exercise }
        : null;
    })
    .filter((q): q is CultureEntry => q !== null);

  const [phase, setPhase] = useState<"learn" | "practice">("learn");
  const [openSection, setOpenSection] = useState(0);
  const [readUpTo, setReadUpTo] = useState(0); // sections < readUpTo carry "✓ read"
  const [quizIdx, setQuizIdx] = useState(0);
  const [checkSelected, setCheckSelected] = useState<number | null>(null);
  const [checkGraded, setCheckGraded] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return <p className="text-sm text-gray-400">No culture questions for this unit.</p>;
  }
  const total = questions.length;
  const sectionNo = phase === "learn" ? openSection : quizIdx;
  const bundleTitle = (i: number) =>
    CULTURE_TEACHING[questions[i].exerciseId]?.steps[0]?.title ?? "Culture Corner";

  // Theme intro — prefer a bundle `unitIntro` if the data ever carries one
  // (PR3 stub field), falling back to the unit map.
  const intro =
    (CULTURE_TEACHING[questions[0].exerciseId] as { unitIntro?: string } | undefined)
      ?.unitIntro ?? UNIT_CULTURE_INTROS[book.unit];

  const startPractice = () => {
    setPhase("practice");
    setQuizIdx(0);
    setCheckSelected(null);
    setCheckGraded(false);
    setCheckDone(false);
    setQuizSubmitted(false);
    setFinished(false);
  };

  const handleSectionNext = () => {
    setReadUpTo((r) => Math.max(r, openSection + 1));
    if (openSection < total - 1) setOpenSection(openSection + 1);
    else startPractice();
  };

  const handleQuizNext = () => {
    if (quizIdx < total - 1) {
      setQuizIdx(quizIdx + 1);
      setCheckSelected(null);
      setCheckGraded(false);
      setCheckDone(false);
      setQuizSubmitted(false);
    } else {
      setFinished(true);
    }
  };

  const header = (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
        🏛️ Rēs Rōmānae · Culture Book
      </p>
      {intro && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-bold">Unit {book.unit}:</span> {intro}
        </p>
      )}
      <p className="text-xs font-semibold text-burgundy-900">
        Section {sectionNo + 1} of {total} · {bundleTitle(sectionNo)}
      </p>
    </div>
  );

  // ── LEARN: the unit's teaching bundles as accordion sections ──────────────
  if (phase === "learn") {
    return (
      <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
        {header}
        <button
          type="button"
          onClick={startPractice}
          className="block text-xs font-semibold text-burgundy-600 transition hover:text-burgundy-800"
        >
          Skip to practice →
        </button>
        <div className="space-y-2">
          {questions.map((q, i) => {
            const bundle = CULTURE_TEACHING[q.exerciseId];
            const isOpen = openSection === i;
            const isRead = i < readUpTo && !isOpen;
            return (
              <div
                key={q.exerciseId}
                className={`overflow-hidden rounded-xl border bg-white transition ${
                  isOpen ? "border-gold-300" : "border-burgundy-100"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenSection(i)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                >
                  <span
                    className={`shrink-0 text-xs font-bold ${
                      isOpen ? "text-gold-700" : "text-gray-400"
                    }`}
                  >
                    {isOpen ? "▾" : "▸"}
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-bold text-burgundy-900">
                    {i + 1} · {bundleTitle(i)} — from Lesson {q.hostLessonId}
                  </span>
                  {isRead && (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      ✓ read
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-burgundy-100 p-3">
                    {bundle && bundle.steps.length > 0 ? (
                      <>
                        {bundle.steps.map((step, si) => (
                          <TeachingStepCard
                            key={si}
                            step={step}
                            index={si + 1}
                            total={bundle.steps.length}
                          />
                        ))}
                        {bundle.sources.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Fact check: {bundle.sources.join(" · ")}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">
                        No teaching cards for this question yet — jump to
                        practice.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleSectionNext}
                      className="w-full rounded-xl bg-burgundy-700 py-2.5 text-sm font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
                    >
                      {i < total - 1 ? "Next section →" : "Start practice →"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── PRACTICE: advisory check → quiz (teaching skipped) → next ────────────
  const q = questions[quizIdx];
  const bundle = CULTURE_TEACHING[q.exerciseId];
  const check = bundle?.check;
  const checkCorrect = checkSelected === check?.correctIndex;

  return (
    <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
      {header}
      <button
        type="button"
        onClick={() => setPhase("learn")}
        className="block text-xs font-semibold text-gray-400 transition hover:text-burgundy-600"
      >
        ← Back to read
      </button>
      {finished ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <span className="mb-1 block text-3xl">🏛️</span>
          <p className="text-sm font-bold text-burgundy-900">
            Unit {book.unit} culture complete — {total}/{total}
          </p>
          <p className="mt-1 text-xs text-gray-500">nothing saved to progress</p>
          <button
            type="button"
            onClick={() => setPhase("learn")}
            className="mt-3 rounded-xl border-2 border-burgundy-200 bg-white px-4 py-1.5 text-xs font-semibold text-burgundy-700 transition hover:border-burgundy-400"
          >
            ↻ Read again
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {check && !checkDone && (
            <div className="rounded-3xl border border-burgundy-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium leading-relaxed text-burgundy-900">
                {check.question}
              </p>
              <div className="mt-3 space-y-2">
                {check.options.map((opt, idx) => {
                  let btnClass =
                    "w-full text-left rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-200 ";
                  if (!checkGraded) {
                    if (checkSelected === idx) {
                      btnClass +=
                        "border-burgundy-500 bg-burgundy-50 text-burgundy-900 shadow-sm";
                    } else {
                      btnClass +=
                        "border-gray-200 bg-white text-gray-700 hover:border-burgundy-300 hover:bg-cream-50 cursor-pointer";
                    }
                  } else {
                    if (idx === check.correctIndex) {
                      btnClass += "border-green-500 bg-green-50 text-green-800";
                    } else if (checkSelected === idx) {
                      btnClass += "border-red-400 bg-red-50 text-red-700";
                    } else {
                      btnClass += "border-gray-200 bg-white text-gray-400";
                    }
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (checkGraded) return;
                        setCheckSelected(idx);
                        setCheckGraded(true);
                      }}
                      disabled={checkGraded}
                      className={btnClass}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
              {checkGraded && (
                <p
                  className={`mt-3 rounded-xl border p-3 text-xs font-medium leading-relaxed ${
                    checkCorrect
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {checkCorrect ? "✅ Correct! " : "❌ Not quite. "}
                  {check.explanation}
                </p>
              )}
              <button
                type="button"
                onClick={() => setCheckDone(true)}
                className="mt-3 w-full rounded-xl bg-burgundy-700 py-2.5 text-sm font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
              >
                Continue to the question →
              </button>
            </div>
          )}
          {(!check || checkDone) && (
            <div className="rounded-xl border border-burgundy-100 bg-white p-3">
              <CultureQuestion
                key={q.exerciseId}
                exercise={q.exercise}
                startAt="quiz"
                onComplete={() => setQuizSubmitted(true)}
                onResult={(detail) =>
                  onCultureResult?.(q.exercise, q.hostLessonId, detail)
                }
              />
            </div>
          )}
          {quizSubmitted && (
            <button
              type="button"
              onClick={handleQuizNext}
              className="w-full rounded-xl bg-burgundy-700 py-2.5 text-sm font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
            >
              {quizIdx < total - 1 ? "Next section →" : "Finish"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** ~40-line mini-flow over a side lesson — identical to SideLessonView. */
function ExploreMiniFlow({ lesson }: { lesson?: SideLesson }) {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  if (!lesson) return <p className="text-sm text-gray-400">Side lesson unavailable.</p>;
  const total = lesson.exercises.length;
  const done = exerciseIdx >= total;
  const current = lesson.exercises[exerciseIdx];
  const handleComplete = (correct: boolean) => {
    setCorrectCount((c) => c + (correct ? 1 : 0));
    setExerciseIdx((i) => i + 1);
  };
  if (done) {
    return (
      <div className="rounded-xl border border-burgundy-200 bg-cream-50 p-4 text-center">
        <span className="mb-1 block text-3xl">
          {correctCount === total ? "🏆" : correctCount >= Math.ceil(total / 2) ? "🎉" : "📖"}
        </span>
        <p className="text-sm font-bold text-burgundy-900">Explore Complete!</p>
        <p className="mt-1 text-xs text-gray-500">
          {correctCount} of {total} correct — nothing saved to progress.
        </p>
        <button
          type="button"
          onClick={() => {
            setExerciseIdx(0);
            setCorrectCount(0);
          }}
          className="mt-3 rounded-xl border-2 border-burgundy-200 bg-white px-4 py-1.5 text-xs font-semibold text-burgundy-700 transition hover:border-burgundy-400"
        >
          ↻ Try Again
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          Exercise {exerciseIdx + 1} of {total}
        </span>
        <span className="text-xs font-semibold text-gold-700">{correctCount} correct</span>
      </div>
      {current?.type === "multiple-choice" ? (
        <MultipleChoice exercise={current} onComplete={handleComplete} />
      ) : current?.type === "matching" ? (
        <MatchingPairs exercise={current} onComplete={handleComplete} />
      ) : (
        <p className="text-xs text-red-500">Unknown exercise type</p>
      )}
    </div>
  );
}

// Re-export the model types so consumers can import them alongside the
// component without reaching into lib internals.
export type { ShelfBook };
