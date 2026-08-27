/**
 * english/index.tsx — thin route orchestrator for English 101.
 *
 * Parameterized copy of the Latin route shell (src/routes/lessons/latin/index.tsx)
 * minus the Latin-only surfaces: no AudioPlayer, no Explore, no Review /
 * diagnostics pair drills. AI Practice is wired (Phase B of the
 * english-course-route-wiring spec) — both AI seams are language-aware.
 * Pronunciation mode is fixed to "ecclesiastical" (the Latin PronMode union is
 * the only valid type; English has a single pronunciation mode and nothing
 * consumes pronMode for English since every item carries its own respelling).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import englishLessons from "~/data/englishLessons";
import englishPlacementQuestions from "~/data/englishPlacementTest";
import { PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE, BONUS_DRILL_DEFAULT_COUNT, IMPROVEMENT_ACTIVE_DAYS } from "~/data/settings";
import { LANGUAGES } from "~/data/languages";
import { getDailyWorstLesson } from "~/engine/dailyLesson";
import { getImprovementStreak, claimBonusDrill, buildBonusDrillDeck, recordStreakDay } from "~/engine/improvementStreak";
import { useLessonEngine } from "~/engine/lesson";
import { usePlacementEngine } from "~/engine/placement";
import { useSettings } from "~/engine/settings";
import {
  buildDrillCards,
  shuffle,
  type DrillCard,
  type DrillKind,
} from "~/lib/drillUtils";
import { recordLessonAttempt } from "~/engine/diagnostics";
import { loadDiagnostics, recordAccuracy } from "~/engine/storage";
import { useAccountSync } from "~/engine/sync";
import type { ExerciseResultDetail } from "~/engine/types";
import { speakEnglish } from "~/engine/speech";
import type { PronMode } from "~/lib/pronunciation";

import LessonMenu from "~/screens/LessonMenu";
import LessonIntro from "~/screens/LessonIntro";
import TeachingScreen from "~/screens/TeachingScreen";
import ExerciseScreen from "~/screens/ExerciseScreen";
import LessonCompleteScreen from "~/screens/LessonCompleteScreen";
import DrillSetup from "~/screens/DrillSetup";
import DrillView from "~/screens/DrillView";
import PlacementTest from "~/screens/PlacementTest";
import SettingsScreen from "~/screens/SettingsScreen";
import ProgressScreen from "~/screens/ProgressScreen";
import AIPracticeScreen from "~/screens/AIPracticeScreen";
import { loadProgress, getDashboardStats, saveProgress } from "~/engine/progress";
import { DailyLessonCard, BonusLessonCard } from "~/components/ProficiencyCards";

export const Route = createFileRoute("/lessons/english/")({
  component: EnglishLessons,
});

/** English drill kinds (Phase A): the two vocab directions + mixed. */
const ENGLISH_DRILL_KINDS: readonly (readonly [string, string])[] = [
  ["vocab-latin", "Formal word → plain meaning"],
  ["vocab-english", "Plain meaning → formal word"],
  ["mixed", "Mixed"],
];

/** English drill instruction copy (DrillView is Latin-defaulted). */
const ENGLISH_DRILL_INSTRUCTIONS: Partial<Record<DrillKind, string>> = {
  "vocab-latin": "Translate to plain English:",
  "vocab-english": "Give the formal word:",
};

function EnglishLessons() {
  // ── Engine hooks (state machines) ────────────────────────────
  const language = LANGUAGES.english;
  // Account sync (Phase 1): boots the background sync engine once (client
  // only, offline-first, never a gate — SSR stays anonymous).
  useAccountSync();
  const totalLevels = PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE.english;
  const lesson = useLessonEngine(englishLessons, language.id);
  const placement = usePlacementEngine(englishPlacementQuestions, totalLevels, language.id);
  const settingsEngine = useSettings(language.id);
  // English has a single pronunciation mode; pronMode stays type-correct for
  // the screen props but is never consumed (data carries respellings).
  const pronMode: PronMode = "ecclesiastical";

  // ── Route-local UI state ─────────────────────────────────────
  const [drillMode, setDrillMode] = useState<DrillKind | "mixed">("mixed");
  const [drillCount, setDrillCount] = useState<10 | 20 | "all">(10);
  const [drillCards, setDrillCards] = useState<DrillCard[] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [aiLessonId, setAiLessonId] = useState<number | null>(null);
  // Bonus-drill session meta (P2): title/badge/instructionOverride for DrillView.
  const [drillMeta, setDrillMeta] = useState<{
    title?: string;
    reference?: string;
    exitLabel?: string;
    instructionOverride?: Partial<Record<DrillKind, string>>;
    badgeLine?: string;
  } | null>(null);

  // ── Proficiency cards (P2): daily worst-area lesson + improvement streak ──
  // Pure reads; derived per render. English shares the language-parameterized
  // engine modules (verbum-streak-english / english diagnostics events).
  const diagnosticsEvents = loadDiagnostics(language.id);
  const completedLessonIds = loadProgress(language.id).filter((p) => p.completed).map((p) => p.lessonId);
  const dailyLesson = getDailyWorstLesson({
    events: diagnosticsEvents,
    lessons: englishLessons,
    completedLessonIds,
    unlockedLessons: lesson.unlockedLessons,
    language: language.id,
  });
  const streak = getImprovementStreak(diagnosticsEvents, { language: language.id });
  const dailyCompleted = dailyLesson ? completedLessonIds.includes(dailyLesson.lessonId) : false;
  const bonusClaimable = streak.streakDays >= IMPROVEMENT_ACTIVE_DAYS && !streak.bonusClaimedToday;

  // English data carries no type/gender — the engine's computeBonusInfo would
  // label every card "1st declension". Strip it at the route.
  const stripBonusInfo = (cards: DrillCard[]): DrillCard[] =>
    cards.map((c) => ({ ...c, bonusInfo: undefined }));

  // ── Proficiency cards (P2) handlers ───────────────────────────
  const openDailyLesson = useCallback(() => {
    if (!dailyLesson) return;
    const idx = englishLessons.findIndex((l) => l.id === dailyLesson.lessonId);
    if (idx >= 0 && idx < lesson.unlockedLessons) lesson.selectLesson(idx);
  }, [dailyLesson, lesson]);

  const startBonusDrill = useCallback(() => {
    const claimed = claimBonusDrill(language.id);
    if (!claimed) return;
    const deck = buildBonusDrillDeck({
      tier: streak.tier,
      events: diagnosticsEvents,
      lessons: englishLessons,
      pronMode,
    });
    if (deck.cards.length === 0) {
      const pool = shuffle(
        buildDrillCards(englishLessons, lesson.unlockedLessons, "mixed", pronMode),
      );
      setDrillCards(stripBonusInfo(pool.slice(0, BONUS_DRILL_DEFAULT_COUNT)));
    } else {
      setDrillCards(stripBonusInfo(deck.cards));
    }
    setDrillMeta({
      title: "⭐ Bonus Lesson",
      reference: deck.reference,
      exitLabel: "Back to Lessons",
      instructionOverride: deck.instructionOverride,
      badgeLine: "⭐ Bonus lesson unlocked",
    });
    lesson.goToDrill();
  }, [streak.tier, diagnosticsEvents, pronMode, lesson]);

  // ── Navigation wrappers ──────────────────────────────────────
  const openDrill = useCallback(() => {
    setDrillCards(null); // re-enter drill from the setup screen
    lesson.goToDrill();
  }, [lesson]);

  const openAIPractice = useCallback(
    (lessonId: number) => {
      setAiLessonId(lessonId);
      lesson.goToAIPractice(lessonId);
    },
    [lesson],
  );

  const aiLesson =
    englishLessons.find((l) => l.id === aiLessonId) ?? lesson.currentLesson;

  const startDrill = useCallback(() => {
    const pool = shuffle(
      buildDrillCards(
        englishLessons,
        lesson.unlockedLessons,
        drillMode,
        pronMode,
      ),
    );
    // English data carries no type/gender — the engine's computeBonusInfo
    // would label every card "1st declension". Strip it at the route.
    setDrillCards(
      pool
        .slice(0, drillCount === "all" ? pool.length : drillCount)
        .map((c) => ({ ...c, bonusInfo: undefined })),
    );
  }, [lesson.unlockedLessons, drillMode, drillCount, pronMode]);

  const restartMissed = useCallback(
    (cards: DrillCard[]) => setDrillCards(cards),
    [],
  );

  switch (lesson.screen) {
    case "menu":
      if (showProgress) return (
        <ProgressScreen
          lessons={englishLessons}
          stats={getDashboardStats(englishLessons.length, [], language.id, diagnosticsEvents, streak.streakDays)}
          lessonProgress={loadProgress(language.id)}
          onBack={()=>setShowProgress(false)}
        />
      );
      if (showSettings) {
        return (
          <SettingsScreen
            settings={settingsEngine.settings}
            onUpdateSettings={settingsEngine.updateSettings}
            onClearData={settingsEngine.clearAllData}
            onEnableDevMode={settingsEngine.enableDevMode}
            onBack={() => setShowSettings(false)}
            showPronunciation={false}
          />
        );
      }
      return (
        <LessonMenu
          lessons={englishLessons}
          unlockedLessons={lesson.unlockedLessons}
          onSelectLesson={lesson.selectLesson}
          onOpenDrill={openDrill}
          onOpenPlacement={lesson.goToPlacement}
          onOpenAIPractice={openAIPractice}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProgress={() => setShowProgress(true)}
          devMode={settingsEngine.settings.devMode}
          title="English 101"
          description="Master formal register and academic vocabulary — the language of essays, applications, and professional writing."
          emoji="📚"
          backTo="/languages"
          menuCards={
            <>
              <DailyLessonCard
                dailyLesson={dailyLesson}
                completed={dailyCompleted}
                onOpen={openDailyLesson}
              />
              <BonusLessonCard
                streak={streak}
                claimable={bonusClaimable}
                onClaim={startBonusDrill}
              />
            </>
          }
        />
      );

    case "teaching":
      return (
        <TeachingScreen
          lesson={lesson.currentLesson}
          lessonNumber={lesson.currentLessonNumber}
          onComplete={lesson.completeTeaching}
          onSkip={lesson.skipTeaching}
        />
      );

    case "intro":
      return (
        <LessonIntro
          lesson={lesson.currentLesson}
          totalLessons={lesson.totalLessons}
          lessonNumber={lesson.currentLessonNumber}
          pronMode={pronMode}
          onStart={lesson.startLesson}
          onBack={lesson.backToMenu}
          onOpenAIPractice={openAIPractice}
          vocabLeftHeader="Formal word"
          vocabRightHeader="Informal equivalent"
          onSpeakLeft={speakEnglish}
        />
      );

    case "exercise":
      return (
        <ExerciseScreen
          lesson={lesson.currentLesson}
          exerciseIdx={lesson.exerciseIdx}
          lessonNumber={lesson.currentLessonNumber}
          pronMode={pronMode}
          allLessons={englishLessons}
          onComplete={(detail: ExerciseResultDetail) => {
            recordAccuracy(`lesson-${lesson.currentLesson.id}`, detail.correct, language.id);
            recordLessonAttempt({ lesson: lesson.currentLesson, exerciseIdx: lesson.exerciseIdx, detail, language: language.id, allLessons: englishLessons });
            lesson.completeExercise(detail.correct);
          }}
          onQuit={lesson.backToMenu}
        />
      );

    case "complete":
      saveProgress(lesson.currentLesson.id, lesson.correctCount, lesson.totalAnswered, language.id);
      // Improvement streak: idempotent per UTC date key (StrictMode-safe).
      recordStreakDay(language.id);
      return (
        <LessonCompleteScreen
          lesson={lesson.currentLesson}
          totalLessons={lesson.totalLessons}
          lessonNumber={lesson.currentLessonNumber}
          correct={lesson.correctCount}
          total={lesson.totalAnswered}
          isLastLesson={lesson.isLastLesson}
          onNext={lesson.nextLesson}
          onRestart={lesson.restartLesson}
          onBack={lesson.backToMenu}
          onOpenAIPractice={openAIPractice}
          onOpenDrill={openDrill}
        />
      );

    case "drill":
      return drillCards && drillCards.length > 0 ? (
        <DrillView
          key={drillCards.map((c) => c.id).join(",")}
          cards={drillCards}
          onExit={drillMeta ? () => { setDrillMeta(null); setDrillCards(null); lesson.backToMenu(); } : lesson.backToMenu}
          onRestartMissed={restartMissed}
          pronMode={pronMode}
          title={drillMeta?.title}
          reference={drillMeta?.reference}
          exitLabel={drillMeta?.exitLabel}
          instructionOverride={drillMeta?.instructionOverride ?? ENGLISH_DRILL_INSTRUCTIONS}
          badgeLine={drillMeta?.badgeLine}
        />
      ) : (
        <DrillSetup
          drillMode={drillMode}
          drillCount={drillCount}
          onModeChange={(mode) => setDrillMode(mode as DrillKind | "mixed")}
          onCountChange={(count) => setDrillCount(count as 10 | 20 | "all")}
          onPronModeChange={() => {}}
          onStart={startDrill}
          onBack={lesson.backToMenu}
          kinds={ENGLISH_DRILL_KINDS}
          showPronToggle={false}
        />
      );

    case "placement":
      return (
        <PlacementTest
          idx={placement.state.idx}
          passed={placement.state.passed}
          totalLevels={totalLevels}
          complete={placement.state.complete}
          startLevel={placement.state.startLevel}
          questions={englishPlacementQuestions}
          onStart={placement.start}
          onAnswer={placement.answer}
          onQuit={placement.quit}
          onRetake={placement.retake}
          onChooseStart={placement.chooseStart}
          introBlurb="Answer questions about formal English vocabulary and usage. We'll figure out where you should start."
          resultBlurb="Here's how your placement levels went:"
        />
      );

    case "ai-practice":
      return (
        <AIPracticeScreen
          lesson={aiLesson}
          pronMode={pronMode}
          onBack={lesson.backToMenu}
          aiEnabled={settingsEngine.settings.aiEnabled}
          language="english"
          distractorLessons={englishLessons}
        />
      );

    default:
      return null;
  }
}
