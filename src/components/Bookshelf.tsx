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
import CultureQuestion from "~/components/CultureQuestion";
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
  const [openCultureId, setOpenCultureId] = useState<string | null>(null);
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

  const isLocked = (book: ShelfBook) => book.unlockIdx >= unlockedLessons;

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
                openCultureId={openCultureId}
                setOpenCultureId={setOpenCultureId}
                onSelectLesson={onSelectLesson}
                onCultureResult={onCultureResult}
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
  // get the dusted `.spine-locked` treatment regardless of kind.
  const kindClass = locked
    ? "spine-locked"
    : book.kind === "review"
      ? "spine-review"
      : book.kind === "culture"
        ? "spine-culture"
        : book.kind === "explore"
          ? "spine-explore"
          : "spine-henle";
  const tone = HENLE_TONES[Math.abs(book.firstIdx) % HENLE_TONES.length];
  // Inline gradient endpoints (custom props / background) — the henle
  // rotation, and the gold "current" book (raised + ringed, same as v2).
  const spineStyle =
    locked
      ? undefined
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
          : undefined;
  const label =
    book.kind === "henle"
      ? book.henleNumber
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
      className={`spine ${kindClass} relative flex h-14 w-9 flex-col items-center pt-1 pb-1 sm:h-16 sm:w-11 ${
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
  openCultureId,
  setOpenCultureId,
  onSelectLesson,
  onCultureResult,
}: {
  book: ShelfBook;
  lessons: Lesson[];
  idToIdx: Map<number, number>;
  progressById: Map<number, LessonProgress>;
  sideLessonById: Map<number, SideLesson>;
  unlockedLessons: number;
  currentIdx: number;
  openCultureId: string | null;
  setOpenCultureId: (id: string | null) => void;
  onSelectLesson: (idx: number) => void;
  onCultureResult?: BookshelfProps["onCultureResult"];
}) {
  const header =
    book.kind === "henle"
      ? `Henle Lesson ${book.henleNumber} · ${book.title}`
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
          openCultureId={openCultureId}
          setOpenCultureId={setOpenCultureId}
          onCultureResult={onCultureResult}
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

/** Rēs Rōmānae unit themes (culture-teaching-design.md §2.2) — the culture
 * books are teach-then-quiz books, so each panel opens with its unit's theme. */
const UNIT_CULTURE_INTROS: Record<number, string> = {
  1: "The world of the early Republic: land, province, and city.",
  2: "Rome and Gaul: roads, bridges, kings, and the Republic.",
  3: "Caesar's army: the legion, the camp, weapons, and the Rubicon.",
  4: "The past and the family: Hannibal, schooling, the household, and Roman names.",
  5: "Slavery and freedom: manumission, the familia, the freedman, and Spartacus.",
};
function CulturePanel({
  book,
  lessons,
  openCultureId,
  setOpenCultureId,
  onCultureResult,
}: {
  book: ShelfBook;
  lessons: Lesson[];
  openCultureId: string | null;
  setOpenCultureId: (id: string | null) => void;
  onCultureResult?: BookshelfProps["onCultureResult"];
}) {
  const questions = (book.content && "questions" in book.content ? book.content.questions : []).map(
    (q) => {
      const host = lessons.find((l) => l.id === q.hostLessonId);
      const exercise = host?.exercises.find((e) => e.id === q.exerciseId);
      return { ...q, exercise, host };
    },
  );
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
        🏛️ Culture Corner · Learn &amp; Practice
      </p>
      {UNIT_CULTURE_INTROS[book.unit] && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-bold">Rēs Rōmānae · Unit {book.unit}:</span>{" "}
          {UNIT_CULTURE_INTROS[book.unit]}
        </p>
      )}
      {questions.map(({ hostLessonId, exerciseId, exercise, host }) =>
        exercise?.type !== "culture-question" || !host ? null : (
          <div
            key={exerciseId}
            className="rounded-xl border border-burgundy-100 bg-white p-3"
          >
            <button
              type="button"
              aria-expanded={openCultureId === exerciseId}
              onClick={() =>
                setOpenCultureId(openCultureId === exerciseId ? null : exerciseId)
              }
              className="flex w-full items-start gap-2 text-left"
            >
              <span className="mt-0.5 text-xs font-bold text-gray-400">
                {openCultureId === exerciseId ? "▾" : "▸"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-burgundy-900">
                  Culture Corner · {exercise.domain}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-gray-600">
                  {exercise.prompt}
                </span>
              </span>
            </button>
            {openCultureId === exerciseId && (
              <div className="mt-3 border-t border-burgundy-100 pt-3">
                <CultureQuestion
                  key={exerciseId}
                  exercise={exercise}
                  onComplete={() => {
                    /* nothing persisted — diagnostics only */
                  }}
                  onResult={(detail) =>
                    onCultureResult?.(exercise, hostLessonId, detail)
                  }
                />
              </div>
            )}
          </div>
        ),
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
