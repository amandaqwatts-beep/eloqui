/**
 * Bookshelf.tsx — shelf-style lesson navigation (presentational, screens dept).
 *
 * Visual skin over the existing flat lesson list: lessons render as books on
 * shelves (one shelf per unit), the current lesson juts out of its shelf, and
 * the current unit's shelf auto-scrolls into view on mount / currentUnit
 * change. Zero engine/data changes — terminology stays "units/lessons".
 *
 * UNIT_MAP is the Latin curriculum's unit boundaries (hardcoded here because
 * units are NOT derivable from lesson data — see bookshelf-implementation-plan
 * §2/Decision A). It is an optional prop so a future English shelf (one
 * contiguous 2001–2010 shelf) can be expressed by the consumer.
 */
import { useEffect, useMemo, useRef } from "react";
import type { Lesson } from "~/data/latinLessons";
import type { LessonProgress } from "~/engine/progress";

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

/** Unlocked palette rotation (idx % 4); current book is forced gold. */
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
  unitMap?: UnitShelf[]; // optional: default = Latin UNIT_MAP
}

interface BookData {
  lesson: Lesson;
  idx: number; // array index in `lessons` (what onSelectLesson expects)
  locked: boolean;
  isCurrent: boolean;
}

export default function Bookshelf({
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
