/**
 * BookStructure.tsx — the ONE structure renderer (uniform-menu step 1).
 *
 * Extracted verbatim from components/Bookshelf.tsx (the BookshelfV2
 * presentation: packed shelves → UnitClusters (parts) → Spines (sections) →
 * ExpansionPanel (chapters / culture / unit-review / explore panels)), and
 * re-driven by the book-agnostic BookStructureModel (lib/bookStructureModel.ts)
 * instead of BookshelfV2's hard-coded props. The Book-1 data (HENLE_TONES,
 * LEGACY_REVIEW_UNITS, UNIT_CULTURE_INTROS, bookKey formats) moved behind
 * model fields (tone / legacyReview / cultureIntro / sectionIdForChapter) in
 * the Book-1 adapter — nothing Book-1-specific remains in this file except
 * the shelf metaphor itself, which is the shared visual language.
 *
 * PURE REFACTOR: Book 1's menu output is byte-identical to the BookshelfV2
 * render it replaces (same packing, spines, chips, locks, frontier
 * auto-expand, focusRequest scroll+expand, F13 suppression, deep-link
 * resume). Books 2/3 have adapters but nothing renders from them yet —
 * their shells rebuild in later steps of the uniform-menu program.
 *
 * ⚠️ ARRAY-ORDER CONSTRAINT — display order comes from the model (the
 * adapter's array-index order); never sort parts/sections/chapters by id.
 */
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { CultureQuestionExercise } from "~/data/latinLessons";
import type { SideLesson } from "~/data/latinSideLessons";
import type { LessonProgress } from "~/engine/progress";
import {
  type BookStructureChapter,
  type BookStructureContentRef,
  type BookStructureModel,
  type BookStructurePart,
  type BookStructureSection,
} from "~/lib/bookStructureModel";
import { packShelves, type PackableUnit } from "~/lib/shelfPacking";
import { useBookshelfCapacity } from "~/lib/useBookshelfCapacity";
import { CULTURE_TEACHING } from "~/data/cultureTeaching";
import CultureQuestion from "~/components/CultureQuestion";
import TeachingStepCard from "~/components/TeachingStepCard";
import MultipleChoice from "~/components/MultipleChoice";
import MatchingPairs from "~/components/MatchingPairs";

export interface BookStructureProps {
  /** The book's structure + providers — adapter-built; the route composes
   *  the runtime providers (progress / launcher / frontier) over the static
   *  structure it memoizes. */
  model: BookStructureModel;
  /** Search / explore focus request (sectionId + nonce) — expand + scroll
   *  to the named section, re-fired when the nonce bumps. */
  focusRequest?: { sectionId: string; nonce: number } | null;
}

type BookmarkTone = "gold" | "pale" | null;

/** A progress-read function — the model's getChapterProgress, defaulted so
 *  provider-less models (scaffold books) render honest empty progress. */
type ProgressRead = (chapterId: number) => LessonProgress | undefined;

export default function BookStructure({ model, focusRequest }: BookStructureProps) {
  const frontier = model.frontier;
  const frontierCount = frontier?.count ?? Number.POSITIVE_INFINITY;
  const getProgress: ProgressRead = model.getChapterProgress ?? (() => undefined);

  const partsByNumber = useMemo(() => {
    const m = new Map<number, BookStructurePart>();
    for (const part of model.parts) {
      m.set(part.number, part);
    }
    return m;
  }, [model.parts]);

  const unitVector: PackableUnit[] = useMemo(
    () =>
      [...partsByNumber.keys()]
        .sort((a, b) => a - b)
        .map((unit) => ({
          unit,
          bookCount: partsByNumber.get(unit)?.sections.length ?? 0,
        })),
    [partsByNumber],
  );

  const { ref: capacityRef, capacity } = useBookshelfCapacity<HTMLDivElement>();
  const packed = useMemo(
    () => packShelves(unitVector, capacity),
    [unitVector, capacity],
  );

  // Frontier section: the section that holds the frontier chapter (the
  // adapter's sectionIdForChapter resolves the id — the old renderer walked
  // model.books with chapterIds.includes; same section, one hop).
  const currentSection = useMemo(() => {
    const chapterId = frontier?.chapterId;
    if (chapterId == null) return undefined;
    const sectionId = model.sectionIdForChapter(chapterId);
    if (!sectionId) return undefined;
    return model.parts
      .flatMap((part) => part.sections)
      .find((section) => section.id === sectionId);
  }, [model.parts, model.sectionIdForChapter, frontier?.chapterId]);

  const [expandedBookKey, setExpandedBookKey] = useState<string | null>(null);
  const shelfRefs = useRef(new Map<number, HTMLElement | null>());
  const packedRef = useRef(packed);
  packedRef.current = packed;

  // Auto-open on mount / frontier change: expand the frontier section so its
  // chapter rows are open when the student arrives (spec §2.2), and position
  // the page (see FIX-C below). `capacity` is a dependency (F15) so the
  // capacity-8 → measured re-pack re-runs the positioning.
  //
  // F13 gate (design §1.3): the route sets frontier.suppressScroll when the
  // menu remounts from a mode (drill / placement / AI) with the frontier
  // unchanged since the last visit — the scroll is the "yank" users felt;
  // mode returns keep the expansion but skip the scroll. The route persists
  // the last viewed frontier in sessionStorage (keyed by language).
  // FIX-C (QA-R1, reopened QA-4): the mount auto-scroll was the bug. On every
  // fresh menu mount it scrollIntoView'd the frontier shelf — pushing the
  // free-zone recommendation card ABOVE the viewport (rect y ≈ −123 with the
  // frontier on the first shelf, −868 once placement seeds a deep frontier),
  // so the card could not be seen or clicked without scrolling up first.
  // Root cause confirmed live (elementFromPoint at the card's off-screen
  // click point returns the wrapper div — pure geometry, no pointer-events
  // guard). Fix, per the work order: fresh mounts and frontier moves scroll
  // to TOP instead; the frontier section still EXPANDS (auto-open survives),
  // the recommendation card is in view and clickable on load, and browser
  // scroll restoration on reload is overridden by the same scrollTo. Mode
  // returns with the frontier unchanged keep the F13 no-scroll behavior.
  const frontierStorageKey = frontier?.storageKey ?? "eloqui:frontier:latin";
  useEffect(() => {
    if (!currentSection) return;
    let t = 0;
    if (!frontier?.suppressScroll) {
      const toTop = () => {
        try {
          window.scrollTo(0, 0);
        } catch {
          /* no window — nothing to reset */
        }
      };
      toTop();
      // Re-assert once the expansion panel has committed — this also defeats
      // any scroll restoration that lands after the first paint. On viewports
      // shorter than the header+desk-bar stack, a minimum nudge keeps the
      // recommendation card's click target inside the fold (block:"nearest"
      // scrolls 0px whenever the card already fits — desktop heights).
      t = window.setTimeout(() => {
        toTop();
        document
          .querySelector<HTMLElement>('button[aria-label^="Do the recommended"]')
          ?.scrollIntoView({ block: "nearest" });
      }, 0);
      try {
        sessionStorage.setItem(frontierStorageKey, String(frontier?.count ?? ""));
      } catch {
        /* storage unavailable — scroll behavior unchanged */
      }
    }
    setExpandedBookKey(currentSection.id);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, capacity, frontier?.suppressScroll, frontierStorageKey, frontier?.count]);

  // focusRequest (search / explore navigation): same scroll + expand for the
  // requested section, re-fired when the nonce bumps.
  useEffect(() => {
    if (!focusRequest) return;
    const section = model.parts
      .flatMap((part) => part.sections)
      .find((s) => s.id === focusRequest.sectionId);
    if (!section) return;
    const shelf = packedRef.current.find((p) =>
      p.units.some((u) => u.unit === section.unit),
    );
    const el = shelf ? shelfRefs.current.get(shelf.shelfIndex) : null;
    if (el) el.scrollIntoView({ block: "start" });
    setExpandedBookKey(section.id);
  }, [focusRequest?.sectionId, focusRequest?.nonce, model.parts]);

  const isLocked = (section: BookStructureSection) =>
    section.unlockIdx >= frontierCount ||
    // P2 — unit-review spines additionally gate on unit completion (design
    // §2.2): the frontier alone (placement jumps / dev-mode unlock) must not
    // open a review for an uncompleted unit (edges #4/#12).
    (section.kind === "unit-review" &&
      !(model.unitReviewUnlocked?.has(section.unit) ?? false));

  return (
    <div ref={capacityRef} className="library-wall space-y-9">
      {packed.map((shelf) => {
        // F1 — the expansion panel renders at shelf level (below the book
        // row, before the board), so it spans the full shelf width instead of
        // being trapped inside a unit cluster's flex row (which capped it at
        // the cluster width and misaligned sibling clusters via items-end).
        const shelfExpandedSection = shelf.units
          .flatMap((u) => partsByNumber.get(u.unit)?.sections ?? [])
          .find((s) => s.id === expandedBookKey);
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
                    part={partsByNumber.get(pu.unit)}
                    getProgress={getProgress}
                    currentSectionId={currentSection?.id}
                    expandedBookKey={expandedBookKey}
                    setExpandedBookKey={setExpandedBookKey}
                    isLocked={isLocked}
                  />
                </Fragment>
              ))}
            </div>
            {shelfExpandedSection && (
              <ExpansionPanel
                key={shelfExpandedSection.id}
                section={shelfExpandedSection}
                frontierCount={frontierCount}
                currentRef={frontier?.currentRef ?? -1}
                getProgress={getProgress}
                openChapter={model.openChapter}
                onCultureResult={model.onCultureResult}
                openUnitReview={model.openUnitReview}
                unitReviewUnlocked={model.unitReviewUnlocked}
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
  part?: BookStructurePart;
  getProgress: ProgressRead;
  currentSectionId?: string;
  expandedBookKey: string | null;
  setExpandedBookKey: (key: string | null) => void;
  isLocked: (section: BookStructureSection) => boolean;
}

function UnitCluster({
  part,
  getProgress,
  currentSectionId,
  expandedBookKey,
  setExpandedBookKey,
  isLocked,
}: ClusterProps) {
  if (!part) return null;
  return (
    <div className="flex max-w-full flex-none flex-col">
      <h3 className="mb-1 text-[10px] font-black uppercase tracking-wider text-burgundy-800">
        {part.label}
      </h3>
      {/* Owner: books sit FLUSH on their sides (no horizontal gap) like a real
          shelf of leaning volumes; gap-y-2 keeps only the vertical rhythm
          between flex-wrapped rows. The raised current book (z-10 + -translate-y)
          cleanly overlaps the neighbors it now touches. */}
      <div className="relative z-0 flex flex-wrap items-end gap-y-2 pt-2">
        {part.sections.map((section) => (
          <Spine
            key={section.id}
            section={section}
            locked={isLocked(section)}
            isCurrent={section.id === currentSectionId}
            bookmark={bookmarkFor(section, getProgress)}
            progress={chapterProgress(section, getProgress)}
            expanded={expandedBookKey === section.id}
            onToggle={() =>
              setExpandedBookKey(expandedBookKey === section.id ? null : section.id)
            }
          />
        ))}
      </div>
    </div>
  );
}

function bookmarkFor(section: BookStructureSection, getProgress: ProgressRead): BookmarkTone {
  if (section.chapters.length === 0) return null;
  const entries = section.chapters
    .map((chapter) => getProgress(chapter.id))
    .filter((p): p is LessonProgress => Boolean(p?.completed));
  if (entries.length === 0) return null;
  if (entries.length < section.chapters.length) return "pale";
  const avg = entries.reduce((s, p) => s + p.bestScore, 0) / entries.length;
  return avg >= 80 ? "gold" : "pale";
}

/** Completed/total chapter ratio (0..1) for the spine progress strip
 *  (spec §2.1, optional: a subtle wood-tone fill along the spine foot). */
function chapterProgress(section: BookStructureSection, getProgress: ProgressRead): number {
  if (section.chapters.length === 0) return 0;
  const done = section.chapters.filter((chapter) => getProgress(chapter.id)?.completed).length;
  return done / section.chapters.length;
}

/** F6 — reword the book subtitle's "IDs 1–5" developer jargon into a
 *  lessons-based caption ("Lessons 1–5 · Terra → Genitive Case"). */
function lessonsCaption(subtitle: string): string {
  return subtitle.replace(/^IDs?\s+([\d–-]+)/, (_m, nums: string) =>
    nums.includes("–") || nums.includes("-") ? `Lessons ${nums}` : `Lesson ${nums}`,
  );
}

/**
 * §B spine geometry — variable, book-driven. Width (thickness) grows with a
 * book's chapter count (clamped) plus a small deterministic hash-of-section
 * jitter, and height varies lightly too, so a shelf reads as a row of organic
 * books rather than identical slabs. The THIN profile below now applies to
 * EVERY book kind — henle lessons, unit-review, review, culture 🏛️, and
 * explore ✨ — so no spine on the shelf reads as a flat digital slab. Widest
 * stays ≤ 26px, comfortably within BOOK_SLOT_WIDTH (34px) for shelf packing.
 */
function spineGeometry(section: BookStructureSection): { width: number; height: number } {
  const chapters = section.chapters.length;
  const hash = [...section.id].reduce(
    (acc, c) => (acc * 31 + c.charCodeAt(0)) % 997,
    7,
  );
  // thickness (width): real hardcovers are thin relative to their height, so
  // every kind gets the slim ~20px spine (clamped 16–26) that reads as books
  // standing on edge.
  const width = Math.max(16, Math.min(26, 20 + Math.min(chapters, 3) + ((hash % 3) - 1)));
  // height: ~64px base with a wide ragged spread (clamp 52–84, ~25px range)
  // so a shelf top reads as an organic, mismatched-volume skyline. Bottoms
  // align (items-end), tops vary — heights stay sensible/tappable.
  const height = Math.max(52, Math.min(84, 68 + (((hash >> 2) % 6) * 5) - 10));
  return { width, height };
}

function Spine({
  section,
  locked,
  isCurrent,
  bookmark,
  progress,
  expanded,
  onToggle,
}: {
  section: BookStructureSection;
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
  // spines get the muted `.spine-review--legacy` demotion via the model's
  // legacyReview flag (Q3 default — the review surface is the per-unit
  // review going forward).
  const kindClass = locked
    ? "spine-locked"
    : section.kind === "unit-review"
      ? "spine-unit-review"
      : section.kind === "review"
        ? section.legacyReview
          ? "spine-review spine-review--legacy"
          : "spine-review"
        : section.kind === "culture"
          ? "spine-culture"
          : section.kind === "explore"
            ? "spine-explore"
            : "spine-henle";
  // Inline gradient endpoints (custom props / background) — the adapter's
  // tone rotation (henle cloth), and the gold "current" book (raised +
  // ringed). §B: variable width/height live in the SAME inline style object
  // as the gradient so the book reads as one organic object (gradient +
  // geometry move together; the Tailwind w-/h- classes governing size are
  // removed).
  const kindStyle = locked
    ? {}
    : isCurrent
      ? {
          background: "linear-gradient(180deg, var(--color-gold-400), var(--color-gold-500))",
          "--spine-label": "var(--color-burgundy-950)",
        }
      : section.tone
        ? {
            background: `linear-gradient(180deg, ${section.tone.a}, ${section.tone.b})`,
            "--spine-label": section.tone.label,
          }
        : {};
  const spineStyle = { ...spineGeometry(section), ...kindStyle };
  const label =
    section.kind === "henle"
      ? section.henleNumber
      : section.kind === "unit-review"
        ? `U${section.unit}`
        : section.kind === "review"
          ? `R${section.unit}`
          : section.kind === "culture"
            ? "🏛️"
            : "✨";
  // F5 — explore spines carry a tiny index number under the glyph so the 16
  // side-lesson books are distinguishable on touch (tooltips don't exist).
  const sideLessonId =
    section.kind === "explore" &&
    section.contentRef &&
    "sideLesson" in section.contentRef
      ? section.contentRef.sideLesson?.id
      : null;
  const chapters = section.chapters.length;
  // F14 — review spines use the canonical section title ("Review of Unit 1",
  // "Mastery Review Vocab #1") instead of the generic "Review · Unit N".
  const chapterWord = `${chapters} chapter${chapters === 1 ? "" : "s"}`;
  const ariaLabel =
    section.kind === "henle"
      ? `Lesson ${section.henleNumber} · ${section.title} — ${chapterWord}`
      : section.kind === "unit-review" || section.kind === "review"
        ? `${section.title} — ${chapterWord}`
        : section.kind === "culture"
          ? `Culture Corner — Unit ${section.unit}`
          : section.kind === "explore"
            ? `Explore: ${section.title}`
            : `${section.title} — ${chapterWord}`;
  const title =
    section.kind === "henle"
      ? `Lesson ${section.henleNumber} · ${section.title} — ${chapterWord}`
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
        {section.kind === "culture" ? (
          <span className="text-base leading-none">🏛️</span>
        ) : section.kind === "explore" ? (
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
  section,
  frontierCount,
  currentRef,
  getProgress,
  openChapter,
  onCultureResult,
  openUnitReview,
  unitReviewUnlocked,
}: {
  section: BookStructureSection;
  frontierCount: number;
  currentRef: number;
  getProgress: ProgressRead;
  openChapter?: (chapter: BookStructureChapter) => void;
  onCultureResult?: BookStructureModel["onCultureResult"];
  openUnitReview?: (unitNumber: number) => void;
  unitReviewUnlocked?: Set<number>;
}) {
  const header =
    section.kind === "henle"
      ? `Henle Lesson ${section.henleNumber} · ${section.title}`
      : section.kind === "unit-review" || section.kind === "review"
        ? section.title // canonical from the data (P3a / F14)
        : section.kind === "culture"
          ? `Culture Corner — Unit ${section.unit}`
          : `Explore: ${section.title}`;
  return (
    <div className="book-panel mt-3 w-full p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-extrabold text-burgundy-900">{header}</h4>
        {section.kind === "henle" && (
          <span className="shrink-0 text-[10px] font-semibold text-gray-400">
            {section.chapters.length} chapter{section.chapters.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {/* F6 — render the section subtitle as a caption under the header,
          reworded from "IDs 1–5" jargon to a lessons-based caption. */}
      {section.subtitle && (
        <p className="mb-3 -mt-1 text-xs text-gray-500">{lessonsCaption(section.subtitle)}</p>
      )}
      {section.kind === "culture" ? (
        <CulturePanel section={section} onCultureResult={onCultureResult} />
      ) : section.kind === "unit-review" ? (
        // P2 (design §2.2 screens flag): a unit-review book STARTS the review
        // session — it never opens a chapter. The unit's chapters render
        // read-only below the start CTA (a milestone marker, not a gate).
        <UnitReviewPanel
          section={section}
          unlocked={unitReviewUnlocked?.has(section.unit) ?? false}
          onOpen={() => openUnitReview?.(section.unit)}
        />
      ) : section.kind === "explore" ? (
        section.contentRef && "sideLesson" in section.contentRef ? (
          <ExploreMiniFlow key={section.id} lesson={section.contentRef.sideLesson} />
        ) : null
      ) : (
        <div className="space-y-1.5">
          {section.chapters.map((chapter) => {
            const idx = chapter.ref;
            const locked = idx >= frontierCount;
            // Frontier = first unlocked chapter with no completion. With
            // contiguous-prefix unlocks the frontier chapter row is the
            // student's actual place — the auto-scroll targets it via
            // data-frontier (spec §2.2 / F2-retargeted). No "current" marker
            // is rendered (owner point 2): the row states are complete /
            // available-incomplete / locked, nothing else.
            const isFrontier = idx === currentRef;
            const p = getProgress(chapter.id);
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
                key={chapter.id}
                type="button"
                data-frontier={isFrontier ? "true" : undefined}
                onClick={() => openChapter?.(chapter)}
                disabled={locked}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-2.5 text-left transition ${
                  locked
                    ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                    : "border-transparent bg-white hover:border-burgundy-300 hover:shadow-sm"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${chip}`}>
                  {locked ? "🔒" : chapter.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-burgundy-900">
                    Lesson {chapter.id}: {chapter.title}
                  </span>
                  {chapter.subtitle && (
                    <span className="block truncate text-xs text-gray-500">{chapter.subtitle}</span>
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
 * action (openUnitReview — the route composes items and owns the session).
 * The unit's chapters are listed READ-ONLY — deliberately NO launcher here;
 * unit-review books never open lessons (the next unit already unlocks
 * via the frontier).
 */
function UnitReviewPanel({
  section,
  unlocked,
  onOpen,
}: {
  section: BookStructureSection;
  unlocked: boolean;
  onOpen: () => void;
}) {
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
          ? `Unit ${section.unit} complete — review it`
          : `Complete Unit ${section.unit} to unlock this review`}
      </p>
      <button
        type="button"
        onClick={onOpen}
        disabled={!unlocked}
        className="w-full rounded-xl bg-teal-700 py-3 text-sm font-bold text-cream-50 shadow transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start Unit {section.unit} Review →
      </button>
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Unit {section.unit} lessons
        </p>
        {section.chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="flex items-center gap-3 rounded-xl border border-burgundy-100 bg-cream-50/60 p-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-burgundy-100 text-xs font-bold text-burgundy-700">
              {chapter.id}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-burgundy-900">
                Lesson {chapter.id}: {chapter.title}
              </span>
              {chapter.subtitle && (
                <span className="block truncate text-xs text-gray-500">{chapter.subtitle}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  section,
  onCultureResult,
}: {
  section: BookStructureSection;
  onCultureResult?: BookStructureModel["onCultureResult"];
}) {
  const questions: CultureEntry[] = (
    section.contentRef && "questions" in section.contentRef
      ? section.contentRef.questions
      : []
  ) as CultureEntry[];

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
  // (PR3 stub field), falling back to the adapter's unit map.
  const intro =
    (CULTURE_TEACHING[questions[0].exerciseId] as { unitIntro?: string } | undefined)
      ?.unitIntro ?? section.cultureIntro;

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
          <span className="font-bold">Unit {section.unit}:</span> {intro}
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
            Unit {section.unit} culture complete — {total}/{total}
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

// Re-export the content-ref type so consumers can import it alongside the
// component without reaching into lib internals.
export type { BookStructureContentRef };
