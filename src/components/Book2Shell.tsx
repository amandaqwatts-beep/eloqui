/**
 * Book2Shell.tsx — Book 2's uniform menu (Henle Second Year Latin).
 *
 * Uniform-menu step 2 (owner doctrine rev 81: "a book is a book, then the
 * components intelligently subdivide sections, chapters, etc."): the bespoke
 * paper-card shell is retired — Book 2 renders through the SAME menu anatomy
 * Book 1 uses. This file is now a thin orchestrator:
 *
 *   1. It builds the Book-2 BookStructureModel (lib/bookStructureModel —
 *      LATIN2_STRUCTURE as parts → capture-sections, with the scoreless
 *      completion seam and the printed LATIN2_SECTION_VOCAB) and composes the
 *      runtime providers (openSection) over it.
 *   2. It renders screens/LessonMenu with that model passed through VERBATIM
 *      — NavBar, book header, desk bar (Search · 📖 Grammar · 🪲 Report),
 *      banner stack (shelf entry · resume), and the shared BookStructure
 *      renderer (packed shelves → parts → spines → capture-section panels).
 *   3. It owns the section session (Book2SectionSession → the four-phase
 *      loop — the SAME state machine and loop screen Book 1's route uses) and
 *      the ONE BugReportDialog, with the 🪲 affordance wired on every Book-2
 *      surface (menu, opener, drill phases, complete) — closing QA's
 *      "Book-II exercise runner has no report affordance" gap.
 *
 * Owner directive (plan rev 74): TWO READING PATHS — kept, as a banner card
 * inside the uniform menu (survey: the path selector stops being a page).
 * Path 1 "Follow the Book" (Part II's adapted Caesar stories) or Path 2 "All
 * the Caesar, in order" (the full campaign, read in the original's own book
 * on this shelf — plan rev 75 bridge). Both paths share the Exercises 1–16
 * review spine, which runs simultaneous with the reading from day one. The
 * choice is a preference, not a gate: the shelf shows the whole book either
 * way.
 *
 * Honesty rules (Minimalist Scholarly, plan rev 72 + generation directive
 * 2026-11-21):
 *   • Captured sections run the FOUR-PHASE loop (owner directive 2026-11-21):
 *     taught → memorized → quizzed → incorporated, over live-generated
 *     instances — the captured 1,176 items are SPECS ONLY (see
 *     engine/latin2SectionFourPhase + engine/latin2SectionSpecs). The shell
 *     owns the FourPhaseRun state machine (the SAME engine/fourPhase machine
 *     Book 1 runs — same mastery gates, same owner bounce rule); the session
 *     screens are presentational. Completion records into the Book 2
 *     progress seam (book2Progress) when incorporated passes.
 *   • Awaiting-capture rows stay visibly awaiting-capture — muted spines
 *     with honest panels. No invented content, no fabricated progress, no
 *     streaks, no hearts.
 *   • The desk bar carries only wired controls: Drill / Placement / AI
 *     Practice need per-book data adapters (survey's engine-side ask) and
 *     are omitted rather than shown dead.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { LanguageShelf } from "~/data/shelves";
import { LATIN2_PATHS } from "~/data/latin2";
import { GRAMMAR_INDEX } from "~/data/grammarIndex";
import { useSettings } from "~/engine/settings";
import type { BugContext, FourPhaseRun } from "~/engine/types";
import {
  applyPhaseAttempt,
  completeTaughtPhase,
  emptyPhaseState,
} from "~/engine/fourPhase";
import { utcDateStr } from "~/engine/dailyLesson";
import { flushBugReports } from "~/lib/bugReport";
import {
  loadBook2Progress,
  saveBook2LastSection,
  saveBook2PathChoice,
  saveBook2SectionCompletion,
  type Latin2PathProgress,
} from "~/lib/book2Progress";
import {
  buildLatin2SectionLesson,
  latin2CapturedSections,
  latin2SectionContext,
  latin2SectionGrammarTopics,
  latin2SectionLessonId,
  latin2SectionLessonNumber,
} from "~/lib/latin2Sections";
import {
  buildBook2StructureModel,
  type BookStructureModel,
} from "~/lib/bookStructureModel";
import LessonMenu from "~/screens/LessonMenu";
import BugReportDialog from "~/components/BugReportDialog";
import GrammarDrawer from "~/components/GrammarDrawer";
import Book2SectionSession from "~/components/Book2SectionSession";

interface Book2ShellProps {
  shelf: LanguageShelf;
  /** ?section= deep link (validated by the shelf route). A captured section
   *  opens straight into its session on mount; anything else is stripped so
   *  the menu renders clean (Book-1's ?lesson=N pattern). */
  deepLinkSection?: string;
}

/** One open section: its four-phase run (taught → memorized → quizzed →
 *  incorporated) — the same state machine Book 1 runs (engine/fourPhase),
 *  owned by the shell; the session screens are presentational. */
interface Book2Session {
  sectionId: string;
  run: FourPhaseRun;
  /** incorporated passed → the quiet close (the completion is recorded once,
   *  at the transition). */
  complete: boolean;
}

/** A fresh section run: opens at the taught phase (the opener presents the
 *  section's vocab universe), seeded per section + UTC date so each session's
 *  drills generate fresh from the specs (registry seed chain). */
function freshSectionRun(sectionId: string): FourPhaseRun {
  return {
    lessonId: latin2SectionLessonId(sectionId) ?? -1,
    phase: "taught",
    reviewMode: false,
    reTeachStepIndex: null,
    phaseState: emptyPhaseState(),
    seed: `latin2|${sectionId}|${utcDateStr()}`,
  };
}

const MENU_DESCRIPTION =
  "Second-year Latin opens with review — Exercises 1–16 run simultaneous with the reading from day one, while the reading itself ramps up through the review stretch.";

export default function Book2Shell({ shelf, deepLinkSection }: Book2ShellProps) {
  const book = shelf.books.find((b) => b.number === 2);
  // The saved choice (if any) opens straight to that path's card; switching
  // is always one click away — a preference, not a gate.
  const [progress, setProgress] = useState<Latin2PathProgress>(() =>
    loadBook2Progress(),
  );
  const [choosing, setChoosing] = useState<boolean | null>(null);
  const showSelector = choosing ?? progress.path == null;
  const activePath = LATIN2_PATHS.find((p) => p.id === progress.path) ?? null;

  // Shared student settings — pronunciation mode (sessions) + devMode badge.
  const settingsEngine = useSettings("latin");

  // The open section (null = the book page). The shell owns the session
  // state and the recording; the session screens are presentational.
  const [session, setSession] = useState<Book2Session | null>(null);

  // Bug-report dialog: the route owns the ONE dialog (PR #78 pattern) — every
  // Book-2 surface reports through it with the context it knows.
  const [bugContext, setBugContext] = useState<BugContext | null>(null);
  useEffect(() => {
    flushBugReports();
  }, []);
  const openBugReport = useCallback((ctx: BugContext) => setBugContext(ctx), []);

  // The session's grammar drawer — the same drawer Book 1 hosts (sessions
  // only; the menu hosts its own through LessonMenu).
  const [grammarOpen, setGrammarOpen] = useState(false);
  const [grammarScroll, setGrammarScroll] = useState<{
    topicId: string;
    nonce: number;
  } | null>(null);
  const navigate = useNavigate();

  // The book's captured sections, composed into the Lesson shape (2000-range
  // ids) — the menu's search index and resume read from these.
  const composedLessons = useMemo(
    () =>
      latin2CapturedSections()
        .map(({ section }) => buildLatin2SectionLesson(section.id))
        .filter((l): l is NonNullable<typeof l> => l !== null),
    [],
  );
  const sectionIdByLessonId = useMemo(
    () =>
      new Map(
        latin2CapturedSections().flatMap(({ section }) => {
          const lessonId = latin2SectionLessonId(section.id);
          return lessonId != null ? [[lessonId, section.id] as const] : [];
        }),
      ),
    [],
  );

  const openSection = useCallback((sectionId: string) => {
    // Only genuinely captured, content-bearing sections may open.
    if (!buildLatin2SectionLesson(sectionId)) return;
    // Resume seam — recorded on OPEN (running it is not required to resume).
    saveBook2LastSection(sectionId);
    setProgress(loadBook2Progress());
    setSession({ sectionId, run: freshSectionRun(sectionId), complete: false });
  }, []);
  // The model's launcher reads through a ref so the memo below never churns.
  const openSectionRef = useRef(openSection);
  openSectionRef.current = openSection;

  // Exit the session — back to the book page, URL cleaned to ?book=2.
  const exitSession = useCallback(() => {
    setSession(null);
    try {
      window.history.replaceState(null, "", `${window.location.pathname}?book=2`);
    } catch {
      /* no window — the URL stays; the state is what matters */
    }
  }, []);

  // taught → memorized: the opener's Begin completes the taught phase (the
  // same PHASE_TEACH_COMPLETE transition Book 1's route fires).
  const handleBeginTaught = useCallback(() => {
    setSession((prev) =>
      prev ? { ...prev, run: completeTaughtPhase(prev.run) } : prev,
    );
  }, []);

  // One drill answer — the SAME state machine Book 1 runs: applyPhaseAttempt
  // judges mastery gates and the owner bounce rule (2 consecutive fails OR
  // <70% over the last 5), advancing / bouncing / completing the run. On
  // "complete" the section's completion records into the Book 2 progress seam.
  const handlePhaseAttempt = useCallback(
    (
      correct: boolean,
      reTeachStepIndex?: number | null,
      passingConcepts?: string[],
    ) => {
      setSession((prev) => {
        if (!prev || prev.complete) return prev;
        const result = applyPhaseAttempt(prev.run, correct, {
          reTeachStepIndex: reTeachStepIndex ?? null,
          passingConcepts,
        });
        if (result.outcome === "complete") {
          saveBook2SectionCompletion(prev.sectionId);
          setProgress(loadBook2Progress());
          return { ...prev, run: result.run, complete: true };
        }
        return { ...prev, run: result.run };
      });
    },
    [],
  );

  // Run it again — a fresh run from the taught phase (fresh generation seed).
  const handleRestartRun = useCallback(() => {
    setSession((prev) =>
      prev
        ? { ...prev, run: freshSectionRun(prev.sectionId), complete: false }
        : prev,
    );
  }, []);

  // ── Section deep links (?book=2&section=…) ──────────────────────────────
  // Mount-only: a captured section opens straight into its session; anything
  // else is stripped (Book-1's ?lesson=N pattern). While a session is open
  // the URL carries the section, so a mid-run reload lands back in it.
  const deepLinkRef = useRef(false);
  useEffect(() => {
    if (deepLinkRef.current) return;
    deepLinkRef.current = true;
    if (!deepLinkSection) return;
    if (buildLatin2SectionLesson(deepLinkSection)) {
      openSectionRef.current(deepLinkSection);
    } else {
      try {
        window.history.replaceState(null, "", `${window.location.pathname}?book=2`);
      } catch {
        /* no window — menu as usual */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkSection]);
  useEffect(() => {
    if (!session) return;
    try {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?book=2&section=${encodeURIComponent(session.sectionId)}`,
      );
    } catch {
      /* no window — state only */
    }
  }, [session]);

  // ── The uniform structure model ─────────────────────────────────────────
  // The Book-2 adapter (static structure + scoreless completion seam) with
  // the shell's session launcher composed over it. Passed to LessonMenu
  // VERBATIM — the menu must not overwrite Book-2 wiring with Book-1's.
  const model = useMemo<BookStructureModel>(
    () => ({
      ...buildBook2StructureModel(progress.completedSectionIds),
      openSection: (section) => openSectionRef.current(section.id),
    }),
    [progress.completedSectionIds],
  );

  // ── Resume (QA-3 pattern) ────────────────────────────────────────────────
  const resumeLesson =
    progress.lastSectionId != null
      ? buildLatin2SectionLesson(progress.lastSectionId)
      : null;

  // ── The two reading paths as a banner card (owner directive, rev 74/75) ──
  const pathCards = (
    <>
      {showSelector
        ? LATIN2_PATHS.map((path, i) => {
            const bridgeBook = path.bridgesTo
              ? shelf.books.find((b) => b.bookKey === path.bridgesTo?.bookKey)
              : undefined;
            return (
              <button
                key={path.id}
                type="button"
                onClick={() => {
                  setProgress(saveBook2PathChoice(path.id));
                  setChoosing(false);
                }}
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
                {bridgeBook && (
                  <p className="font-book mt-2 text-[11px] italic text-gray-500">
                    Reads the campaign in its own book: {bridgeBook.title}.
                  </p>
                )}
                <p className="mt-3 text-xs font-bold text-burgundy-700">
                  Choose this path →
                </p>
              </button>
            );
          })
        : activePath && (
            <div className="book-panel p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
                    Path {activePath.id === "book" ? 1 : 2}
                  </p>
                  <h3 className="paper-title mt-0.5 text-base">{activePath.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setChoosing(true)}
                  className="text-xs font-semibold text-burgundy-600 transition hover:text-burgundy-800"
                >
                  Change path
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-700">
                {activePath.description}
              </p>
              <p className="mt-2 rounded-lg border border-wood-200 bg-cream-100 px-3 py-2 text-xs text-wood-800">
                Opens with: {activePath.opensWith}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {progress.completedSectionIds.length > 0
                  ? `${progress.completedSectionIds.length} section${progress.completedSectionIds.length === 1 ? "" : "s"} recorded on this path.`
                  : "No progress recorded yet — the first exercises and chapters arrive with the capture pipeline."}
              </p>
            </div>
          )}
    </>
  );

  // ── An open section replaces the book page until the student backs out ──
  if (session) {
    const ctx = latin2SectionContext(session.sectionId);
    const lesson = buildLatin2SectionLesson(session.sectionId);
    const lessonNumber = latin2SectionLessonNumber(session.sectionId);
    if (ctx && lesson && lessonNumber !== null) {
      const lessonId = latin2SectionLessonId(session.sectionId) ?? lesson.id;
      const run = session.run;
      const reportFrom = (): BugContext => ({
        screen:
          session.complete
            ? "book2-complete"
            : run.phase === "taught"
              ? "book2-opener"
              : run.phase,
        lessonId,
        lessonNumber,
        phase: session.complete ? null : run.phase,
        // Drill items are generated fresh per session — no stable exercise id.
        exerciseId: null,
      });
      return (
        <>
          <Book2SectionSession
            section={ctx.section}
            part={ctx.part}
            lesson={lesson}
            lessonNumber={lessonNumber}
            run={run}
            complete={session.complete}
            grammarTopics={latin2SectionGrammarTopics(session.sectionId)}
            onOpenGrammarTopic={(topicId) => {
              setGrammarScroll({ topicId, nonce: Date.now() });
              setGrammarOpen(true);
            }}
            pronMode={settingsEngine.settings.pronMode}
            onBegin={handleBeginTaught}
            onAttempt={handlePhaseAttempt}
            onExit={exitSession}
            onRestart={handleRestartRun}
            onReportBug={() => openBugReport(reportFrom())}
          />
          <GrammarDrawer
            open={grammarOpen}
            onClose={() => setGrammarOpen(false)}
            topics={GRAMMAR_INDEX}
            onOpenLesson={() => {
              // A topic's related lessons are Book 1 chapters — hand off to
              // the Latin 1 course menu.
              setGrammarOpen(false);
              void navigate({ to: "/lessons/latin" });
            }}
            scrollTo={grammarScroll}
          />
          {bugContext && (
            <BugReportDialog
              context={bugContext}
              language={"latin"}
              onBack={() => setBugContext(null)}
            />
          )}
        </>
      );
    }
    // Defensive: a session whose data vanished falls back to the book page.
    setSession(null);
  }

  return (
    <>
      <LessonMenu
        lessons={composedLessons}
        unlockedLessons={composedLessons.length}
        onSelectLesson={(idx) => {
          const lesson = composedLessons[idx];
          if (!lesson) return;
          const sectionId = sectionIdByLessonId.get(lesson.id);
          if (sectionId) openSection(sectionId);
        }}
        onReportBug={() => openBugReport({ screen: "book2-menu" })}
        devMode={settingsEngine.settings.devMode}
        title={book?.title ?? "Henle Second Year Latin"}
        description={MENU_DESCRIPTION}
        emoji="🏛️"
        showAIPractice={false}
        backTo="/"
        grammarTopics={GRAMMAR_INDEX}
        structureModel={model}
        languageId="latin"
        menuCards={pathCards}
        resumeLesson={resumeLesson ? { title: resumeLesson.title } : null}
        onResumeLesson={
          resumeLesson && progress.lastSectionId
            ? () => openSection(progress.lastSectionId as string)
            : undefined
        }
        // A grammar topic's related lessons are Book 1 chapters — hand off to
        // the Latin 1 course menu (the shell's historical drawer behavior).
        onOpenForeignLesson={() => {
          void navigate({ to: "/lessons/latin" });
        }}
        // FIX-A sibling (uniform-menu step 2): the quiet shelf link — Book 2's
        // menu reaches its sibling books through the language shelf.
        shelfEntry={
          <div className="mb-4 text-center">
            <Link
              to="/shelf/$language"
              params={{ language: shelf.languageId }}
              className="text-sm font-semibold text-burgundy-700 transition hover:text-burgundy-600"
            >
              📚 The Latin shelf — all three books →
            </Link>
          </div>
        }
      />
      {bugContext && (
        <BugReportDialog
          context={bugContext}
          language={"latin"}
          onBack={() => setBugContext(null)}
        />
      )}
    </>
  );
}
