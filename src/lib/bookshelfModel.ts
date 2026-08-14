/**
 * bookshelfModel.ts — pure model builder for the Bookshelf v2 layout.
 *
 * Converts the flat lesson array + the BookLesson mapping + side lessons into
 * a list of "shelf books" (henle / review / culture / explore) grouped by
 * unit. Pure function — no React, no rendering, no storage access.
 *
 * ⚠️ ARRAY-ORDER CONSTRAINT — never reorder `latinLessons.ts`, and never sort
 * books/chapters by id. DISPLAY order derives from ARRAY INDEX (unlock order):
 * `subLessonIds` arrays are MEMBERSHIP SETS only. latinLessons.ts runs
 * …45, 51, 52, 46, 47, 48, 49, 50, 53… — ids 51/52 (Henle 14, Sum) physically
 * precede 46–50 (Henle 12/13, 3rd/4th conjugation), so Unit 3 renders books
 * 9, 10, 11, 14, 12, 13. That is correct and intentional (unlock-consistent):
 * `selectLesson` and persisted `startLevel` are array-index based; reordering
 * the data file would shift indices and break saved progress.
 */
import type { Lesson } from "~/data/latinLessons";
import type { BookLesson } from "~/data/bookLessons";
import type { SideLesson } from "~/data/latinSideLessons";
import { CULTURE_TEACHING } from "~/data/cultureTeaching";

export interface ShelfBook {
  /** "henle-9" | "review-u1" | "culture-u1" | "explore-101" */
  bookKey: string;
  kind: "henle" | "review" | "culture" | "explore";
  /** 1..14 */
  unit: number;
  /** canonical BookLesson.title | "Review · Unit N" | "Culture Corner" | SideLesson.title */
  title: string;
  subtitle?: string;
  /** henle books only */
  henleNumber?: number;
  /** sub-lesson ids in ARRAY order; [] for culture/explore */
  chapterIds: number[];
  /** min array index of chapters; -1 for culture/explore */
  firstIdx: number;
  /** max array index of chapters; -1 for culture/explore */
  lastIdx: number;
  /** book unlocked iff unlockIdx < unlockedLessons */
  unlockIdx: number;
  content?:
    | { questions: { hostLessonId: number; exerciseId: string }[] }
    | { sideLessonId: number };
}

export interface BookshelfModel {
  books: ShelfBook[];
  unitOfSubLesson: Map<number, number>;
}

export function buildBookshelfModel(
  lessons: Lesson[],
  bookLessons: BookLesson[],
  sideLessons: SideLesson[],
): BookshelfModel {
  // (1) Lesson id → array index (unlock order — never sort by id).
  const idToIdx = new Map<number, number>(lessons.map((l, i) => [l.id, i] as const));
  const unitOfSubLesson = new Map<number, number>();

  const books: ShelfBook[] = [];

  // (2) Henle + mastery-review books from the BookLesson mapping.
  for (const bl of bookLessons) {
    const kind: ShelfBook["kind"] = bl.kind === "mastery-review" ? "review" : "henle";
    const chapterIds = bl.subLessonIds
      .filter((id) => idToIdx.has(id))
      .sort((a, b) => (idToIdx.get(a) ?? 0) - (idToIdx.get(b) ?? 0)); // ARRAY order
    for (const id of chapterIds) unitOfSubLesson.set(id, bl.unitNumber);
    const firstIdx = chapterIds.length > 0 ? (idToIdx.get(chapterIds[0]) ?? -1) : -1;
    const lastIdx =
      chapterIds.length > 0 ? (idToIdx.get(chapterIds[chapterIds.length - 1]) ?? -1) : -1;
    const unit = bl.unitNumber;
    books.push({
      bookKey: kind === "henle" ? `henle-${bl.henleNumber}` : `review-u${unit}`,
      kind,
      unit,
      title: bl.title ?? (kind === "review" ? `Review · Unit ${unit}` : ""),
      subtitle: bl.subtitle,
      ...(kind === "henle" && bl.henleNumber != null ? { henleNumber: bl.henleNumber } : {}),
      chapterIds,
      firstIdx,
      lastIdx,
      unlockIdx: firstIdx,
    });
  }

  // (3) Culture books (zero new data): walk lessons in ARRAY order; group the
  //     culture-question exercises by their host lesson's unit; one book per
  //     unit with ≥ 1 question.
  const cultureByUnit = new Map<
    number,
    { questions: { hostLessonId: number; exerciseId: string }[]; firstHostIdx: number }
  >();
  for (const l of lessons) {
    const idx = idToIdx.get(l.id);
    if (idx == null) continue;
    const unit = unitOfSubLesson.get(l.id);
    if (unit == null) continue; // warn+skip handled in validation
    for (const ex of l.exercises) {
      if (ex.type !== "culture-question") continue;
      const bucket = cultureByUnit.get(unit) ?? { questions: [], firstHostIdx: idx };
      bucket.questions.push({ hostLessonId: l.id, exerciseId: ex.id });
      cultureByUnit.set(unit, bucket);
    }
  }
  for (const [unit, bucket] of cultureByUnit) {
    books.push({
      bookKey: `culture-u${unit}`,
      kind: "culture",
      unit,
      title: "Culture Corner",
      subtitle: `Unit ${unit}`,
      chapterIds: [],
      firstIdx: -1,
      lastIdx: -1,
      unlockIdx: bucket.firstHostIdx,
      content: { questions: bucket.questions },
    });
  }

  // (4) Explore books: one per SideLesson; the tied henle book decides the
  //     unit and the unlock frontier.
  const henleBooks = bookLessons.filter(
    (bl) => bl.kind === "lesson" && bl.henleNumber != null,
  );
  for (const sl of sideLessons) {
    const tied = henleBooks.find((bl) => bl.henleNumber === sl.bookLessonId);
    if (!tied) {
      console.warn(`[bookshelfModel] explore ${sl.id} ties to no henle book (${sl.bookLessonId})`);
      continue;
    }
    const chapterIdx = tied.subLessonIds
      .map((id) => idToIdx.get(id))
      .filter((i): i is number => i != null);
    const firstIdx = chapterIdx.length > 0 ? Math.min(...chapterIdx) : -1;
    if (firstIdx < 0) {
      console.warn(`[bookshelfModel] explore ${sl.id} tie book ${tied.id} has no resolvable chapters`);
      continue;
    }
    books.push({
      bookKey: `explore-${sl.id}`,
      kind: "explore",
      unit: tied.unitNumber,
      title: sl.title,
      subtitle: sl.subtitle,
      chapterIds: [],
      firstIdx: -1,
      lastIdx: -1,
      unlockIdx: firstIdx,
      content: { sideLessonId: sl.id },
    });
  }

  // (5) Sort each unit's books: henle by firstIdx asc → review → culture → explore.
  const ORDER: Record<ShelfBook["kind"], number> = { henle: 0, review: 1, culture: 2, explore: 3 };
  const unitSet = new Set<number>(books.map((b) => b.unit));
  const sorted: ShelfBook[] = [];
  for (const unit of [...unitSet].sort((a, b) => a - b)) {
    const unitBooks = books
      .filter((b) => b.unit === unit)
      .sort((a, b) => {
        if (ORDER[a.kind] !== ORDER[b.kind]) return ORDER[a.kind] - ORDER[b.kind];
        if (a.kind === "henle" || a.kind === "review") return a.firstIdx - b.firstIdx;
        return a.unlockIdx - b.unlockIdx;
      });
    sorted.push(...unitBooks);
  }

  // (6) Dev-mode validation — console.warn only, never throw.
  validate(lessons, bookLessons, sorted, cultureByUnit, idToIdx);

  return { books: sorted, unitOfSubLesson };
}

function validate(
  lessons: Lesson[],
  bookLessons: BookLesson[],
  sortedBooks: ShelfBook[],
  cultureByUnit: Map<number, { questions: { hostLessonId: number; exerciseId: string }[]; firstHostIdx: number }>,
  idToIdx: Map<number, number>,
): void {
  // Every lesson id appears exactly once across subLessonIds sets.
  const seen = new Map<number, number>();
  for (const bl of bookLessons) {
    for (const id of bl.subLessonIds) {
      if (seen.has(id)) {
        console.warn(`[bookshelfModel] sub-lesson ${id} covered by books ${seen.get(id)} and ${bl.id}`);
      }
      seen.set(id, bl.id);
    }
  }
  for (const l of lessons) {
    if (!seen.has(l.id)) {
      console.warn(`[bookshelfModel] lesson id ${l.id} is not covered by any book`);
    }
  }

  // Per-unit consecutive henle/review books satisfy prev.lastIdx < next.firstIdx.
  const henleReview = sortedBooks.filter((b) => b.kind === "henle" || b.kind === "review");
  const byUnit = new Map<number, ShelfBook[]>();
  for (const b of henleReview) {
    const arr = byUnit.get(b.unit) ?? [];
    arr.push(b);
    byUnit.set(b.unit, arr);
  }
  for (const [, arr] of byUnit) {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1].lastIdx >= arr[i].firstIdx) {
        console.warn(
          `[bookshelfModel] unit ${arr[i].unit}: book "${arr[i - 1].bookKey}" (lastIdx ${arr[i - 1].lastIdx}) ` +
            `overlaps "${arr[i].bookKey}" (firstIdx ${arr[i].firstIdx})`,
        );
      }
    }
  }

  // Every culture host resolves (host lessons must be mapped to a unit).
  for (const [unit, bucket] of cultureByUnit) {
    for (const q of bucket.questions) {
      if (!idToIdx.has(q.hostLessonId)) {
        console.warn(`[bookshelfModel] culture ${q.exerciseId} host lesson ${q.hostLessonId} not in lessons`);
      }
    }
    if (bucket.firstHostIdx < 0) {
      console.warn(`[bookshelfModel] culture book unit ${unit} has no resolvable host lesson`);
    }
  }

  // PR-E §3.1 — culture-teaching ↔ culture-book cross-checks (dev-mode warns
  // only; the shelf must never render an orphan bundle/question silently).
  const bundleIds = Object.keys(CULTURE_TEACHING);

  // exerciseId → host, for every question the model actually bucketed.
  const bucketed = new Map<string, { hostLessonId: number; unit: number }>();
  for (const [unit, bucket] of cultureByUnit) {
    for (const q of bucket.questions) {
      bucketed.set(q.exerciseId, { hostLessonId: q.hostLessonId, unit });
    }
  }

  // (c) direction 1: every bundle id resolves to a real culture-question
  //     exercise (or, if the exercise exists but its host maps to no unit,
  //     that is drift (b)).
  for (const id of bundleIds) {
    if (bucketed.has(id)) continue;
    const host = lessons.find((l) =>
      l.exercises.some((e) => e.type === "culture-question" && e.id === id),
    );
    if (host) {
      console.warn(
        `[bookshelfModel] culture bundle ${id} is hosted by lesson ${host.id}, which maps to no unit — ` +
          `its unit's culture book has ZERO questions (teaches-us data drift)`,
      );
    } else {
      console.warn(
        `[bookshelfModel] culture bundle ${id} resolves to no culture-question exercise (orphan bundle)`,
      );
    }
  }

  // (c) direction 2: every culture question on the shelf has a teaching bundle.
  for (const [unit, bucket] of cultureByUnit) {
    for (const q of bucket.questions) {
      if (!bundleIds.includes(q.exerciseId)) {
        console.warn(
          `[bookshelfModel] culture question ${q.exerciseId} (unit ${unit}) has no teaching bundle (orphan question)`,
        );
      }
    }
  }

  // (a) defensive: at most one culture book per unit ⇒ ≤ 14 today.
  if (cultureByUnit.size > 14) {
    console.warn(
      `[bookshelfModel] ${cultureByUnit.size} culture books — expected at most 14 (one per unit)`,
    );
  }
}
