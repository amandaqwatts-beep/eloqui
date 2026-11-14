/**
 * bookStructureModel.ts — the ONE book-menu structure model (owner doctrine
 * rev 81: "a book is a book, then the components intelligently subdivide
 * sections, chapters, etc.").
 *
 * A BookStructureModel is what a book hands the shared BookStructure renderer
 * (components/BookStructure.tsx): parts → sections → chapters in DISPLAY
 * order, plus the provider wiring the renderer needs (progress reads, the
 * session launcher, the frontier/resume provider). The renderer is
 * book-agnostic: every Book-1-ism (unit culture intros, legacy-review
 * demotion, the Henle tone rotation, bookKey formats) lives in the book's
 * ADAPTER below — never in the model type and never in the renderer.
 *
 * Three adapters today (uniform-menu step 1):
 *   - buildBook1StructureModel — Henle First Year Latin. Wraps
 *     lib/bookshelfModel.buildBookshelfModel (the Book-1 model builder) and
 *     folds its ShelfBooks into parts/sections/chapters.
 *   - buildBook2StructureModel — Henle Second Year Latin, from
 *     LATIN2_STRUCTURE (+ lib/latin2Sections for the composed lesson numbers;
 *     the completion seam is lib/book2Progress, scoreless, wired through
 *     getSectionCompletion). Data-level: nothing renders from it yet — Book 2
 *     keeps its shell until the uniform-menu rebuild (step 4).
 *   - buildBook3StructureModel — Caesar's Gallic War, from GALLIC_WAR_STRUCTURE.
 *
 * ⚠️ Book 1 display order derives from ARRAY INDEX (unlock order), never id
 * order — the array-order constraint from bookshelfModel.ts carries through:
 * subLessonIds are membership sets; chapter refs are array indices.
 */
import type { Lesson, CultureQuestionExercise } from "~/data/latinLessons";
import type { BookLesson } from "~/data/bookLessons";
import type { SideLesson } from "~/data/latinSideLessons";
import type { LessonProgress } from "~/engine/progress";
import type { ExerciseResultDetail } from "~/engine/types";
import { buildBookshelfModel, type ShelfBook } from "~/lib/bookshelfModel";
import { LATIN2_STRUCTURE } from "~/data/latin2";
import { latin2SectionLessonNumber } from "~/lib/latin2Sections";
import { GALLIC_WAR_STRUCTURE } from "~/data/gallicWar";

/** Section kinds. The first five are the Book-1 shelf kinds (bookshelfModel);
 *  "capture-section" is the Books-2/3 capture-row kind (no chapter layer yet
 *  — sections open straight to a session once the uniform shell lands). */
export type BookStructureSectionKind =
  | "henle"
  | "review"
  | "unit-review"
  | "culture"
  | "explore"
  | "capture-section";

/** Capture status of a section. Book 1 sections are all "live"; Books 2/3
 *  carry the capture pipeline's honest statuses. */
export type BookStructureSectionStatus = "live" | "captured" | "awaiting-capture";

/** A chapter = one openable row inside an expansion panel (Book 1: a
 *  sub-lesson). `ref` is the session launcher's address — Book 1: the array
 *  index into latinLessons (onSelectLesson takes ARRAY INDEX, not id). */
export interface BookStructureChapter {
  /** Printed chapter id (Book 1: the lesson id on the chip). */
  id: number;
  /** Session-launcher ref (Book 1: array index). */
  ref: number;
  title: string;
  subtitle?: string;
}

/** Per-kind payload the expansion panel renders — resolved by the adapter,
 *  so the renderer does no content lookups of its own. */
export type BookStructureContentRef =
  | {
      questions: {
        hostLessonId: number;
        exerciseId: string;
        exercise: CultureQuestionExercise;
      }[];
    }
  | { sideLesson?: SideLesson }
  | { folio: number | null; lessonNumber: number | null };

export interface BookStructureSection {
  /** Stable section id — the expansion key AND the search-focus address
   *  (Book 1: the bookKey — "henle-9" / "review-u1" / "explore-101"). */
  id: string;
  /** Canonical title (spine aria + expansion header). */
  title: string;
  /** Expansion-panel caption (already F6-reworded by the Book-1 adapter). */
  subtitle?: string;
  kind: BookStructureSectionKind;
  status: BookStructureSectionStatus;
  /** The part ordinal this section belongs to (Book 1: the unit number). */
  unit: number;
  /** Chapters in DISPLAY order (array-index order — never sorted by id). */
  chapters: BookStructureChapter[];
  /** Unlock position: unlocked iff unlockIdx < frontier.count. Book 1: the
   *  firstIdx of the book's chapters (lastIdx for unit-review books, whose
   *  REAL gate is the route's unitReviewUnlocked set). Books 2/3 capture
   *  rows carry -1 (openable regardless of any frontier — honest). */
  unlockIdx: number;
  /** Display position of the section's first chapter (Book 1: firstIdx —
   *  drives the within-part ordering and the spine tone rotation). */
  firstIdx: number;
  /** Henle lesson number (Book 1 henle sections — spine label + aria). */
  henleNumber?: number;
  /** §B spine tone — the adapter's palette rotation (was the renderer's
   *  HENLE_TONES Book-1-ism). Absent → no cloth gradient. */
  tone?: { a: string; b: string; label: string };
  /** Q3 legacy-review demotion (units 1/2/5/14 mastery spines render muted
   *  — was the renderer's LEGACY_REVIEW_UNITS Book-1-ism). */
  legacyReview?: boolean;
  /** Culture theme intro (was the renderer's UNIT_CULTURE_INTROS Book-1-ism). */
  cultureIntro?: string;
  contentRef?: BookStructureContentRef;
}

export interface BookStructurePart {
  /** Stable part id — Book 1: "unit-3"; Book 2: "part-2"; Book 3: "gw-book-1". */
  id: string;
  /** Printed heading (Book 1: "Unit 3"; Book 3: "Book I"). */
  label: string;
  /** Part ordinal for shelf packing (Book 1: the unit number). */
  number: number;
  /** Sections in display order (the ratified shelf order for Book 1). */
  sections: BookStructureSection[];
}

/** Frontier/resume provider — where the student stands. Route-owned. */
export interface BookStructureFrontier {
  /** Raw unlock frontier (Book 1: unlockedLessons — locks compare against
   *  this). */
  count: number;
  /** The clamped frontier row (Book 1: the min/max/len−1 index) — marks the
   *  frontier chapter row's data-frontier attribute. */
  currentRef: number;
  /** The frontier chapter's id — names the section that auto-expands. */
  chapterId: number | null;
  /** F13 — skip the mount scroll-to-top on mode returns (expansion kept). */
  suppressScroll?: boolean;
  /** F13 sessionStorage key (per-language: `eloqui:frontier:${languageId}`). */
  storageKey?: string;
}

export interface BookStructureModel {
  /** Stable book identity — "latin-1", "latin-2", "latin-gallic-war". */
  bookKey: string;
  /** Parts in display order; sections within a part in display order. */
  parts: BookStructurePart[];

  /** ── Providers (route-owned; the adapters wire Book 1's, the uniform
   *     shell wires Books 2/3's in later steps) ─────────────────────────── */

  /** Progress reads: chapter id → progress record (Book 1: loadProgress). */
  getChapterProgress?: (chapterId: number) => LessonProgress | undefined;
  /** Scoreless per-section completion (Book 2's honest seam — completed
   *  section ids from lib/book2Progress, no scores). */
  getSectionCompletion?: (sectionId: string) => boolean;
  /** Session launcher — open a chapter (Book 1: four-phase selectLesson by
   *  array index). */
  openChapter?: (chapter: BookStructureChapter) => void;
  /** Frontier/resume provider (auto-expand, scroll, locks). */
  frontier?: BookStructureFrontier;
  /** Culture diagnostics sink (Book 1: route recordAttempt passthrough). */
  onCultureResult?: (
    exercise: CultureQuestionExercise,
    hostLessonId: number,
    detail: ExerciseResultDetail,
  ) => void;
  /** Unit-review session launcher + unlock set (part-ordinal keyed). */
  openUnitReview?: (unitNumber: number) => void;
  unitReviewUnlocked?: Set<number>;

  /** ── Search-focus resolvers (which section owns a chapter / side lesson) ── */

  /** Chapter id → owning section id (locked-lesson focus from the grammar
   *  drawer). Book 1: the OLD bookKeyForLesson semantics — first book in
   *  bookLessons order wins (unit-review re-covers never win). */
  sectionIdForChapter: (chapterId: number) => string | null;
  /** Side-lesson id → explore section id (search explore focus). */
  exploreSectionId?: (sideLessonId: number) => string | null;
}

/* ═══════════════════════ Book-1-ism data (moved OUT of the renderer) ═══════════════════════ */

/** Henle 4-tone palette rotation — CSS gradient endpoints for `.spine-henle`.
 *  Index = |firstIdx| % 4 (the book's first chapter's array position). */
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

/** Rēs Rōmānae unit themes (culture-teaching-design.md §2.2) — the culture
 *  books are teach-then-quiz books, so each panel opens with its unit's theme. */
const UNIT_CULTURE_INTROS: Record<number, string> = {
  1: "The world of the early Republic: land, province, and city.",
  2: "Rome and Gaul: roads, bridges, kings, and the Republic.",
  3: "Caesar's army: the legion, the camp, weapons, and the Rubicon.",
  4: "The past and the family: Hannibal, schooling, the household, and Roman names.",
  5: "Slavery and freedom: manumission, the familia, the freedman, and Spartacus.",
};

/* ═══════════════════════════════ Book 1 — Henle First Year ═══════════════════════════════ */

/** The Book-1 adapter: buildBookshelfModel folded into parts → sections →
 *  chapters. STATIC structure only — the route composes the runtime providers
 *  (progress, session launcher, frontier) over the returned object. */
export function buildBook1StructureModel(
  lessons: Lesson[],
  bookLessons: BookLesson[],
  sideLessons: SideLesson[],
): BookStructureModel {
  const model = buildBookshelfModel(lessons, bookLessons, sideLessons);
  const idToIdx = new Map<number, number>(lessons.map((l, i) => [l.id, i] as const));
  const sideLessonById = new Map<number, SideLesson>(sideLessons.map((s) => [s.id, s] as const));

  // Group the sorted books by unit (buildBookshelfModel emits ascending
  // units; within a unit the book order is the ratified shelf order).
  const byUnit = new Map<number, ShelfBook[]>();
  for (const book of model.books) {
    const arr = byUnit.get(book.unit) ?? [];
    arr.push(book);
    byUnit.set(book.unit, arr);
  }

  const parts: BookStructurePart[] = [];
  for (const [unit, books] of [...byUnit.entries()].sort((a, b) => a[0] - b[0])) {
    parts.push({
      id: `unit-${unit}`,
      label: `Unit ${unit}`,
      number: unit,
      sections: books.map((book) => bookToSection(book, lessons, idToIdx, sideLessonById)),
    });
  }

  // Locked-lesson focus resolver — the old LessonMenu.bookKeyForLesson's
  // first-book-wins walk over bookLessons, now expressed against the model's
  // own section ids. Unit-review books re-cover ids but sit after the owning
  // henle/mastery book in bookLessons order, so they never win (skipped).
  const chapterToSection = new Map<number, string>();
  for (const bl of bookLessons) {
    if (bl.kind === "unit-review") continue;
    const sectionId =
      bl.kind === "mastery-review"
        ? `review-u${bl.unitNumber}`
        : `henle-${bl.henleNumber}`;
    for (const id of bl.subLessonIds) {
      if (!chapterToSection.has(id)) chapterToSection.set(id, sectionId);
    }
  }

  return {
    bookKey: "latin-1",
    parts,
    sectionIdForChapter: (chapterId) => chapterToSection.get(chapterId) ?? null,
    exploreSectionId: (sideLessonId) =>
      parts
        .flatMap((part) => part.sections)
        .find(
          (section) =>
            section.kind === "explore" &&
            section.contentRef !== undefined &&
            "sideLesson" in section.contentRef &&
            section.contentRef.sideLesson?.id === sideLessonId,
        )?.id ?? null,
  };
}

function bookToSection(
  book: ShelfBook,
  lessons: Lesson[],
  idToIdx: Map<number, number>,
  sideLessonById: Map<number, SideLesson>,
): BookStructureSection {
  // Chapters in array order; unresolvable ids are dropped (the renderer
  // skipped them too — `if (!lesson) return null`).
  const chapters: BookStructureChapter[] = [];
  for (const id of book.chapterIds) {
    const idx = idToIdx.get(id);
    if (idx == null) continue;
    const lesson = lessons[idx];
    if (!lesson) continue;
    chapters.push({ id, ref: idx, title: lesson.title, subtitle: lesson.subtitle });
  }

  // Resolve per-kind content payloads (the renderer used to do this at
  // render time — same lookups, done once here).
  let contentRef: BookStructureContentRef | undefined;
  if (book.content && "questions" in book.content) {
    const questions = book.content.questions
      .map((q) => {
        const host = lessons.find((l) => l.id === q.hostLessonId);
        const exercise = host?.exercises.find((e) => e.id === q.exerciseId);
        return exercise?.type === "culture-question"
          ? { hostLessonId: q.hostLessonId, exerciseId: q.exerciseId, exercise }
          : null;
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);
    contentRef = { questions };
  } else if (book.content && "sideLessonId" in book.content) {
    contentRef = { sideLesson: sideLessonById.get(book.content.sideLessonId) };
  }

  return {
    id: book.bookKey,
    title: book.title,
    subtitle: book.subtitle,
    kind: book.kind,
    status: "live",
    unit: book.unit,
    chapters,
    unlockIdx: book.unlockIdx,
    firstIdx: book.firstIdx,
    henleNumber: book.henleNumber,
    tone:
      book.kind === "henle"
        ? HENLE_TONES[Math.abs(book.firstIdx) % HENLE_TONES.length]
        : undefined,
    legacyReview:
      book.kind === "review" ? LEGACY_REVIEW_UNITS.has(book.unit) : undefined,
    cultureIntro:
      book.kind === "culture" ? UNIT_CULTURE_INTROS[book.unit] : undefined,
    contentRef,
  };
}

/* ═══════════════════════════════ Book 2 — Henle Second Year ═══════════════════════════════ */

/** The Book-2 adapter: LATIN2_STRUCTURE as parts → capture-sections. The
 *  folio map's own part/section order is display order (it IS the book's
 *  contents). Completion is the scoreless per-section seam
 *  (lib/book2Progress.completedSectionIds → getSectionCompletion); callers
 *  pass loadBook2Progress().completedSectionIds. Nothing renders from this
 *  adapter yet — Book 2 keeps its shell until the uniform-menu rebuild. */
export function buildBook2StructureModel(
  completedSectionIds: string[] = [],
): BookStructureModel {
  const done = new Set(completedSectionIds);
  const parts: BookStructurePart[] = LATIN2_STRUCTURE.map((part, partIdx) => ({
    id: part.id,
    label: part.title,
    number: partIdx + 1,
    sections: part.sections.map((section, i) => ({
      id: section.id,
      title: section.title,
      kind: "capture-section" as const,
      status:
        section.status === "captured"
          ? ("captured" as const)
          : ("awaiting-capture" as const),
      unit: partIdx + 1,
      chapters: [],
      // Captured rows are openable regardless of any frontier (honest — the
      // shell gates on real content, not on a ladder position).
      unlockIdx: -1,
      firstIdx: i,
      contentRef: {
        folio: section.folio,
        lessonNumber: latin2SectionLessonNumber(section.id),
      },
    })),
  }));
  return {
    bookKey: "latin-2",
    parts,
    sectionIdForChapter: () => null,
    getSectionCompletion: (sectionId) => done.has(sectionId),
  };
}

/* ═══════════════════════════ Book 3 — Caesar's Gallic War ═══════════════════════════ */

/** The Book-3 adapter: the received 8 books as parts, section anchors as
 *  capture-sections. Structure only — the campaign text lands with the
 *  capture pipeline. */
export function buildBook3StructureModel(): BookStructureModel {
  const parts: BookStructurePart[] = GALLIC_WAR_STRUCTURE.map((part) => ({
    id: part.id,
    label: part.title,
    number: part.book,
    sections: part.sections.map((section, i) => ({
      id: section.id,
      title: section.title,
      kind: "capture-section" as const,
      status: "awaiting-capture" as const,
      unit: part.book,
      chapters: [],
      unlockIdx: -1,
      firstIdx: i,
    })),
  }));
  return {
    bookKey: "latin-gallic-war",
    parts,
    sectionIdForChapter: () => null,
  };
}
