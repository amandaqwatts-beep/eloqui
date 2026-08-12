import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { Lesson, CultureQuestionExercise } from "~/data/latinLessons";
import type { BookLesson } from "~/data/bookLessons";
import type { SideLesson } from "~/data/latinSideLessons";
import type { GrammarTopic } from "~/data/grammarIndex";
import type { PronMode } from "~/lib/pronunciation";
import type { LessonProgress } from "~/engine/progress";
import type { ExerciseResultDetail } from "~/engine/types";
import NavBar from "~/components/NavBar";
import PronunciationToggle from "~/components/PronunciationToggle";
import Bookshelf from "~/components/Bookshelf";
import SearchBox from "~/components/SearchBox";
import GrammarDrawer from "~/components/GrammarDrawer";
import { buildSearchIndex } from "~/lib/searchIndex";

interface Props {
  lessons: Lesson[]; unlockedLessons: number; onSelectLesson: (idx: number) => void;
  onOpenDrill: () => void; onOpenPlacement: () => void; onOpenAIPractice: (lessonId: number) => void;
  onPronModeChange: (mode: PronMode) => void;
  // Optional until the route integration phase wires them in (keeps build green).
  onOpenSettings?: () => void; onOpenAudio?: () => void; onOpenSleepAudio?: () => void; onOpenProgress?: () => void; onOpenReview?: () => void;
  /** Backward-compat only — the Explore banner was removed in Bookshelf v2 (Explore books live on the shelf). */
  onOpenExplore?: () => void; devMode?: boolean;
  // Language-parameterized copy (English route passes its own; defaults keep Latin byte-identical).
  title?: string; description?: string; emoji?: string; showPronToggle?: boolean; showAIPractice?: boolean; backTo?: string;
  // Per-book progress for shelf bookmark tabs (route passes loadProgress(language.id)).
  lessonProgress?: LessonProgress[];
  // ── Bookshelf v2 (optional — absent → TOC fallback, e.g. English route) ──
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
}

const CHIP =
  "rounded-xl border-2 border-burgundy-200 bg-cream-50 px-3.5 py-2 text-sm font-bold text-burgundy-800 shadow-sm transition hover:border-burgundy-400 hover:bg-white";

export default function LessonMenu({
  lessons,unlockedLessons,onSelectLesson,onOpenDrill,onOpenPlacement,onOpenAIPractice,onPronModeChange,
  onOpenSettings,onOpenAudio,onOpenSleepAudio,onOpenProgress,onOpenReview,devMode=false,
  title="Latin 101",description="Master Latin grammar through bite-sized, interactive lessons — from first declension through passive voice, following Henle's <em>First Year Latin</em>.",
  emoji="🏛️",showPronToggle=true,showAIPractice=true,backTo="/",lessonProgress,
  bookLessons,sideLessons,grammarTopics,menuCards,onCultureResult,
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
  const openGrammarLesson = (lessonId: number) => {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    setDrawerOpen(false);
    if (idx >= 0) onSelectLesson(idx);
  };

  const row2Members =
    (onOpenAudio ? 1 : 0) +
    (onOpenSleepAudio ? 1 : 0) +
    (onOpenProgress ? 1 : 0) +
    (onOpenReview ? 1 : 0) +
    (showPronToggle ? 1 : 0) +
    (onOpenSettings ? 1 : 0);

  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <span className="text-5xl mb-4 block">{emoji}</span>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-extrabold text-burgundy-900 sm:text-4xl">{title}</h1>
              {devMode && (
                <span className="rounded-full border border-amber-400 bg-amber-100 px-2.5 py-1 text-[11px] font-black tracking-wider text-amber-800">DEV</span>
              )}
            </div>
            <p className="mt-3 text-gray-600 leading-relaxed max-w-md mx-auto" dangerouslySetInnerHTML={{ __html: description }} />
          </div>

          {/* Toolbar row 1 — primary actions */}
          <div className="mb-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
            <button onClick={onOpenDrill} className="w-full rounded-2xl bg-gold-400 py-4 text-lg font-black text-burgundy-950 shadow-lg transition hover:bg-gold-300 hover:shadow-xl">🗡️ Drill</button>
            {showAIPractice && (
              <button onClick={() => onOpenAIPractice(aiTargetLessonId)} className="w-full rounded-2xl bg-purple-100 border-2 border-purple-300 py-4 text-lg font-black text-purple-800 shadow transition hover:bg-purple-200 hover:shadow-lg">🤖 AI Practice</button>
            )}
            <button onClick={onOpenPlacement} className="w-full rounded-2xl border-2 border-gold-600 bg-cream-50 py-4 text-lg font-black text-burgundy-800 shadow transition hover:bg-gold-50 hover:shadow-lg">📋 Placement</button>
          </div>

          {/* Toolbar row 2 — compact chips + pron toggle + settings */}
          {row2Members > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {onOpenAudio && <button onClick={onOpenAudio} className={CHIP}>🎧 Listen</button>}
              {onOpenSleepAudio && <button onClick={onOpenSleepAudio} className={CHIP}>🌙 Sleep</button>}
              {onOpenProgress && <button onClick={onOpenProgress} className={CHIP}>📊 Progress</button>}
              {onOpenReview && <button onClick={onOpenReview} className={CHIP}>🔍 Review</button>}
              {showPronToggle && (
                <span className="ml-auto">
                  <PronunciationToggle onChange={onPronModeChange} />
                </span>
              )}
              {onOpenSettings && (
                <button onClick={onOpenSettings} title="Settings" aria-label="Settings" className="flex w-14 items-center justify-center self-stretch rounded-xl border-2 border-gray-300 bg-white text-xl text-gray-500 shadow-sm transition hover:border-gray-400 hover:bg-cream-50 hover:text-burgundy-700">⚙️</button>
              )}
            </div>
          )}

          {/* Reserved slot for daily-lesson / improvement-streak cards */}
          {menuCards && (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">{menuCards}</div>
          )}

          {/* Search row + grammar drawer opener */}
          <div className="mb-6 flex items-stretch gap-2">
            <SearchBox
              index={searchIndex}
              lessons={lessons}
              onSelectLesson={onSelectLesson}
              onOpenGrammar={openGrammarTopic}
              onOpenExplore={openExploreBook}
            />
            {grammarTopics && grammarTopics.length > 0 && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                title="Grammar Index"
                aria-label="Open Grammar Index"
                className="flex w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-burgundy-200 bg-cream-50 text-lg shadow-sm transition hover:border-burgundy-400 hover:bg-white"
              >
                📖
              </button>
            )}
          </div>

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
