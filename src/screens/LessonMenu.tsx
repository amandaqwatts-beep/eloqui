import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { Lesson, CultureQuestionExercise } from "~/data/latinLessons";
import type { BookLesson } from "~/data/bookLessons";
import type { SideLesson } from "~/data/latinSideLessons";
import type { GrammarTopic } from "~/data/grammarIndex";
import type { LessonProgress } from "~/engine/progress";
import type { ExerciseResultDetail } from "~/engine/types";
import NavBar from "~/components/NavBar";
import Bookshelf from "~/components/Bookshelf";
import SearchBox from "~/components/SearchBox";
import GrammarDrawer from "~/components/GrammarDrawer";
import { buildSearchIndex } from "~/lib/searchIndex";

interface Props {
  lessons: Lesson[]; unlockedLessons: number; onSelectLesson: (idx: number) => void;
  onOpenDrill: () => void; onOpenPlacement: () => void; onOpenAIPractice: (lessonId: number) => void;
  // Optional until the route integration phase wires them in (keeps build green).
  onOpenSettings?: () => void; onOpenAudio?: () => void; onOpenSleep?: () => void; onOpenProgress?: () => void; onOpenReview?: () => void;
  devMode?: boolean;
  // Language-parameterized copy (English route passes its own; defaults keep Latin byte-identical).
  title?: string; description?: string; emoji?: string; showAIPractice?: boolean; backTo?: string;
  // Per-book progress for shelf bookmark tabs (route passes loadProgress(language.id)).
  lessonProgress?: LessonProgress[];
  // Bookshelf v2 (optional — absent → TOC fallback, e.g. English route) ──
  bookLessons?: BookLesson[];
  sideLessons?: SideLesson[];
  grammarTopics?: GrammarTopic[];
  /** Reserved grid slot for daily-lesson / improvement-streak cards (later). */
  menuCards?: ReactNode;
  onCultureResult?: (
    exercise: CultureQuestionExercise,
    hostLessonId: number,
    detail: ExerciseResultDetail,
  ) => void;
  /** F13 — sessionStorage frontier key scope (per-language). Default "latin". */
  languageId?: string;
  /** F13 — route tells the shelf to skip the scroll-to-frontier on mode
   *  returns (frontier unchanged since last menu mount). Expansion kept. */
  suppressFrontierScroll?: boolean;
  /** P2 (review-system rework) — unit-review spines: route passes the open
   *  handler + the isUnitComplete-derived unlocked unit set (pass-through). */
  onOpenUnitReview?: (unitNumber: number) => void;
  unitReviewUnlocked?: Set<number>;
}

/** Base class for the desk bar's 44px icon tiles (📖 ⚙ 🎧 🌙 📊 🎯). */
const ICON_TILE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-wood-300 bg-cream-50 text-lg shadow-sm transition hover:border-wood-500 hover:bg-white";

export default function LessonMenu({
  lessons,unlockedLessons,onSelectLesson,onOpenDrill,onOpenPlacement,onOpenAIPractice,
  onOpenSettings,onOpenAudio,onOpenSleep,onOpenProgress,onOpenReview,devMode=false,
  title="Latin 101",description="Master Latin grammar through bite-sized, interactive lessons — from first declension through passive voice, following Henle's <em>First Year Latin</em>.",
  emoji="🏛️",showAIPractice=true,backTo="/",lessonProgress,
  bookLessons,sideLessons,grammarTopics,menuCards,onCultureResult,
  languageId="latin",suppressFrontierScroll=false,
  onOpenUnitReview,unitReviewUnlocked,
}: Props) {
  const hasShelf = (bookLessons?.length ?? 0) > 0;

  // Bookshelf v2 defaults the AI Practice target to the frontier chapter
  // (the highest unlocked lesson), matching what the shelf visually leads to.
  const aiTargetLessonId =
    lessons[Math.min(Math.max(unlockedLessons, 1), lessons.length) - 1]?.id ?? 1;

  const searchIndex = useMemo(
    () => buildSearchIndex(lessons, sideLessons ?? [], grammarTopics ?? []),
    [lessons, sideLessons, grammarTopics],
  );

  // ── Menu-local UI state (search → grammar drawer / explore focus) ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [grammarScroll, setGrammarScroll] = useState<{ topicId: string; nonce: number } | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ bookKey: string; nonce: number } | null>(null);

  const openGrammarTopic = (topicId: string) => {
    setDrawerOpen(true);
    setGrammarScroll((s) => ({ topicId, nonce: (s?.nonce ?? 0) + 1 }));
  };
  const openExploreBook = (sideLessonId: number) => {
    setFocusRequest((s) => ({ bookKey: `explore-${sideLessonId}`, nonce: (s?.nonce ?? 0) + 1 }));
  };

  /** Book key for the shelf book that contains a sub-lesson id (henle/review
   *  books own all sub-lesson ids; culture/explore books own none). */
  const bookKeyForLesson = (lessonId: number): string | null => {
    if (!bookLessons) return null;
    for (const bl of bookLessons) {
      if (bl.subLessonIds.includes(lessonId)) {
        return bl.kind === "mastery-review" ? `review-u${bl.unitNumber}` : `henle-${bl.henleNumber}`;
      }
    }
    return null;
  };

  const openGrammarLesson = (lessonId: number) => {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    setDrawerOpen(false);
    if (idx < 0) return;
    if (idx < unlockedLessons) {
      onSelectLesson(idx);
      return;
    }
    // F3 — locked-topic "Open": the engine would silently no-op (SELECT_LESSON
    // gates on the unlock frontier), so expand the containing book on the
    // shelf instead — the student sees where the topic lives and why it's
    // locked. The shelf's focusRequest effect scrolls + expands the book.
    const bookKey = bookKeyForLesson(lessonId);
    if (bookKey) {
      setFocusRequest((s) => ({ bookKey, nonce: (s?.nonce ?? 0) + 1 }));
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-6">
            <span className="text-5xl mb-4 block">{emoji}</span>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-extrabold text-burgundy-900 sm:text-4xl">{title}</h1>
              {devMode && (
                <span className="rounded-full border border-amber-400 bg-amber-100 px-2.5 py-1 text-[11px] font-black tracking-wider text-amber-800">DEV</span>
              )}
            </div>
            <p className="mt-3 text-gray-600 leading-relaxed max-w-md mx-auto" dangerouslySetInnerHTML={{ __html: description }} />
          </div>

          {/*
            ── Desk bar (v2.1 §4.1) — integrated controls ──────────────
            One wood-tone chrome strip anchored above the shelf: every
            control is 44px (h-11 / w-11, glyphs text-lg). Mobile: row A =
            search + 📖 + ⚙️, row B = the remaining actions in a 3-col grid.
            sm+: both rows merge into one wrapping row — search · 📖 · 🗡️ ·
            📋 · 🤖 · 🎧 · 🌙 · 📊 · 🎯 · ⚙️ (⚙️ re-orders to the end).
            Conditional rendering unchanged: each route's prop subset renders
            only its own tiles.
          */}
          <div className="desk-bar mb-4 flex flex-col gap-2 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Row A — search + grammar + settings */}
            <div className="flex items-stretch gap-2 sm:contents">
              <SearchBox
                index={searchIndex}
                lessons={lessons}
                onSelectLesson={onSelectLesson}
                onOpenGrammar={openGrammarTopic}
                onOpenExplore={openExploreBook}
                className="min-w-[180px]"
              />
              {grammarTopics && grammarTopics.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  title="Grammar Index"
                  aria-label="Open Grammar Index"
                  className={ICON_TILE}
                >
                  📖
                </button>
              )}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  title="Settings"
                  aria-label="Settings"
                  className={`${ICON_TILE} sm:order-10`}
                >
                  ⚙️
                </button>
              )}
            </div>

            {/* Row B — remaining actions (3-col grid on mobile) */}
            <div className="grid grid-cols-3 gap-2 sm:contents">
              <button
                type="button"
                onClick={onOpenDrill}
                className="flex h-11 flex-col items-center justify-center gap-0 rounded-xl bg-gold-400 px-1 text-burgundy-950 shadow transition hover:bg-gold-300 sm:flex-row sm:gap-1.5 sm:px-4"
              >
                <span aria-hidden="true" className="text-lg leading-none">🗡️</span>
                <span className="text-[10px] font-black leading-tight sm:text-base">Drill</span>
              </button>
              {showAIPractice && (
                <button
                  type="button"
                  onClick={() => onOpenAIPractice(aiTargetLessonId)}
                  className="flex h-11 flex-col items-center justify-center gap-0 rounded-xl border-2 border-purple-300 bg-purple-100 px-1 text-purple-800 shadow-sm transition hover:bg-purple-200 sm:flex-row sm:gap-1.5 sm:px-4"
                >
                  <span aria-hidden="true" className="text-lg leading-none">🤖</span>
                  <span className="text-[10px] font-black leading-tight sm:text-base">AI Practice</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenPlacement}
                className="flex h-11 flex-col items-center justify-center gap-0 rounded-xl border-2 border-gold-600 bg-cream-50 px-1 text-burgundy-800 shadow-sm transition hover:bg-gold-50 sm:flex-row sm:gap-1.5 sm:px-4"
              >
                <span aria-hidden="true" className="text-lg leading-none">📋</span>
                <span className="text-[10px] font-black leading-tight sm:text-base">Placement</span>
              </button>
              {onOpenAudio && (
                <button type="button" onClick={onOpenAudio} title="Listen" aria-label="Listen" className={ICON_TILE}>
                  🎧
                </button>
              )}
              {onOpenSleep && (
                <button type="button" onClick={onOpenSleep} title="Sleep" aria-label="Sleep" className={ICON_TILE}>
                  🌙
                </button>
              )}
              {onOpenProgress && (
                <button type="button" onClick={onOpenProgress} title="Progress" aria-label="Progress" className={ICON_TILE}>
                  📊
                </button>
              )}
              {onOpenReview && (
                <button type="button" onClick={onOpenReview} title="Review" aria-label="Review" className={ICON_TILE}>
                  🎯
                </button>
              )}
            </div>
          </div>

          {/* Reserved slot for daily-lesson / improvement-streak cards */}
          {menuCards && (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">{menuCards}</div>
          )}

          {/* Shelf area: v2 packed shelves when bookLessons is present, else TOC */}
          {hasShelf ? (
            <Bookshelf
              lessons={lessons}
              unlockedLessons={unlockedLessons}
              lessonProgress={lessonProgress}
              onSelectLesson={onSelectLesson}
              bookLessons={bookLessons}
              sideLessons={sideLessons}
              onCultureResult={onCultureResult}
              focusRequest={focusRequest}
              languageId={languageId}
              suppressFrontierScroll={suppressFrontierScroll}
              onOpenUnitReview={onOpenUnitReview}
              unitReviewUnlocked={unitReviewUnlocked}
            />
          ) : (
            <LessonTOC
              lessons={lessons}
              unlockedLessons={unlockedLessons}
              onSelectLesson={onSelectLesson}
              showAIPractice={showAIPractice}
              onOpenAIPractice={onOpenAIPractice}
            />
          )}

          <div className="mt-10 text-center">
            <Link to={backTo} className="text-sm text-gray-400 hover:text-burgundy-600 transition">
              ← Back to {backTo === "/" ? "Verbum" : "Languages"}
            </Link>
          </div>
        </div>
      </main>
      <GrammarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        topics={grammarTopics ?? []}
        onOpenLesson={openGrammarLesson}
        scrollTo={grammarScroll}
      />
    </div>
  );
}

/** Today's flat lesson list, extracted verbatim from the menu (TOC fallback). */
function LessonTOC({lessons,unlockedLessons,onSelectLesson,showAIPractice,onOpenAIPractice}:{lessons:Lesson[];unlockedLessons:number;onSelectLesson:(idx:number)=>void;showAIPractice:boolean;onOpenAIPractice:(lessonId:number)=>void}) {
 return <div className="space-y-3">{lessons.map((l,i)=>{const locked=i>=unlockedLessons;return <button key={l.id} onClick={()=>onSelectLesson(i)} disabled={locked} className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${locked?"border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed":"border-burgundy-200 bg-white hover:border-burgundy-400 hover:shadow-md cursor-pointer"}`}><div className="flex items-start gap-4"><div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 text-lg font-bold ${locked?"bg-gray-200 text-gray-400":"bg-burgundy-100 text-burgundy-700"}`}>{locked?"🔒":l.id}</div><div className="flex-1 min-w-0"><h3 className={`font-bold text-base ${locked?"text-gray-400":"text-burgundy-900"}`}>Lesson {l.id}: {l.title}</h3>{l.subtitle&&<p className="text-sm text-gray-500 mt-0.5">{l.subtitle}</p>}<p className="text-xs text-gray-400 mt-1">{l.exercises.length} exercises</p>{!locked&&showAIPractice&&<span role="button" tabIndex={0} onClick={e=>{e.stopPropagation();onOpenAIPractice(l.id)}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onOpenAIPractice(l.id)}}} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full transition">🤖 Practice</span>}</div>{!locked&&<svg className="h-5 w-5 text-burgundy-400 shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>}</div></button>})}</div>;
}
