/**
 * latin.tsx — thin route orchestrator for Latin 101.
 *
 * All state machines live in the Engine department (src/engine/) and all
 * rendering lives in the Screens department (src/screens/). This file only
 * wires them together: owns the small amount of route-local UI state
 * (drill setup, settings overlay, AI lesson target) and switches between
 * the screens exposed by the engines.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import latinLessons from "~/data/latinLessons";
import placementQuestions from "~/data/placementTest";
import { PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE } from "~/data/settings";
import { LANGUAGES } from "~/data/languages";
import { useLessonEngine } from "~/engine/lesson";
import { usePlacementEngine } from "~/engine/placement";
import { useSettings } from "~/engine/settings";
import {
  buildDrillCards,
  shuffle,
  type DrillCard,
  type DrillKind,
} from "~/lib/drillUtils";

import LessonMenu from "~/screens/LessonMenu";
import LessonIntro from "~/screens/LessonIntro";
import TeachingScreen from "~/screens/TeachingScreen";
import ExerciseScreen from "~/screens/ExerciseScreen";
import LessonCompleteScreen from "~/screens/LessonCompleteScreen";
import DrillSetup from "~/screens/DrillSetup";
import DrillView from "~/screens/DrillView";
import PlacementTest from "~/screens/PlacementTest";
import AIPracticeScreen from "~/screens/AIPracticeScreen";
import SettingsScreen from "~/screens/SettingsScreen";
import AudioPlayerScreen from "~/screens/AudioPlayerScreen";
import ProgressScreen from "~/screens/ProgressScreen";
import { loadProgress, getDashboardStats, saveProgress } from "~/engine/progress";
import { loadAccuracy, recordAccuracy } from "~/engine/storage";
import ReviewScreen from "~/screens/ReviewScreen";

export const Route = createFileRoute("/lessons/latin/")({
  component: LatinLessons,
});

function LatinLessons() {
  // ── Engine hooks (state machines) ────────────────────────────
  const language = LANGUAGES.latin;
  const totalLevels = PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE.latin;
  const lesson = useLessonEngine(latinLessons, language.id);
  const placement = usePlacementEngine(placementQuestions, totalLevels, language.id);
  const settingsEngine = useSettings(language.id);
  const pronMode = settingsEngine.settings.pronMode;
  const navigate = useNavigate();

  // ── Route-local UI state ─────────────────────────────────────
  const [drillMode, setDrillMode] = useState<DrillKind | "mixed">("mixed");
  const [drillCount, setDrillCount] = useState<10 | 20 | "all">(10);
  const [drillCards, setDrillCards] = useState<DrillCard[] | null>(null);
  const [aiLessonId, setAiLessonId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Navigation wrappers: keep engine screen transitions in sync with
  // route-local state the screens don't own.
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

  const startDrill = useCallback(() => {
    const pool = shuffle(
      buildDrillCards(
        latinLessons,
        lesson.unlockedLessons,
        drillMode,
        pronMode,
      ),
    );
    setDrillCards(
      pool.slice(0, drillCount === "all" ? pool.length : drillCount),
    );
  }, [lesson.unlockedLessons, drillMode, drillCount, pronMode]);

  const restartMissed = useCallback(
    (cards: DrillCard[]) => setDrillCards(cards),
    [],
  );

  const aiLesson =
    latinLessons.find((l) => l.id === aiLessonId) ?? lesson.currentLesson;

  switch (lesson.screen) {
    case "menu":
      if (showAudio) return <AudioPlayerScreen lessons={latinLessons} unlockedLessons={lesson.unlockedLessons} onBack={()=>setShowAudio(false)} />;
      if (showReview) return <ReviewScreen accuracy={loadAccuracy(language.id)} lessons={latinLessons} onBack={()=>setShowReview(false)} onPracticeLesson={openAIPractice} />;
      if (showProgress) return <ProgressScreen lessons={latinLessons} stats={getDashboardStats(latinLessons.length, [], language.id)} lessonProgress={loadProgress(language.id)} onBack={()=>setShowProgress(false)} onOpenReview={()=>{setShowProgress(false);setShowReview(true)}} />;
      if (showSettings) {
        return (
          <SettingsScreen
            settings={settingsEngine.settings}
            onUpdateSettings={settingsEngine.updateSettings}
            onClearData={settingsEngine.clearAllData}
            onEnableDevMode={settingsEngine.enableDevMode}
            onBack={() => setShowSettings(false)}
          />
        );
      }
      return (
        <LessonMenu
          lessons={latinLessons}
          unlockedLessons={lesson.unlockedLessons}
          onSelectLesson={lesson.selectLesson}
          onOpenDrill={openDrill}
          onOpenPlacement={lesson.goToPlacement}
          onOpenAIPractice={openAIPractice}
          onPronModeChange={(mode) => settingsEngine.updateSettings({ pronMode: mode })}
          onOpenSettings={() => setShowSettings(true)}
          onOpenAudio={() => setShowAudio(true)}
          onOpenProgress={() => setShowProgress(true)}
          onOpenReview={() => setShowReview(true)}
          onOpenExplore={() => navigate({ to: "/lessons/latin/explore" })}
          devMode={settingsEngine.settings.devMode}
        />
      );

    case "teaching":
      return (
        <TeachingScreen
          lesson={lesson.currentLesson}
          onComplete={lesson.completeTeaching}
          onSkip={lesson.skipTeaching}
        />
      );

    case "intro":
      return (
        <LessonIntro
          lesson={lesson.currentLesson}
          totalLessons={lesson.totalLessons}
          pronMode={pronMode}
          onStart={lesson.startLesson}
          onBack={lesson.backToMenu}
          onOpenAIPractice={openAIPractice}
        />
      );

    case "exercise":
      return (
        <ExerciseScreen
          lesson={lesson.currentLesson}
          exerciseIdx={lesson.exerciseIdx}
          pronMode={pronMode}
          onComplete={(correct) => { recordAccuracy(`lesson-${lesson.currentLesson.id}`, correct, language.id); lesson.completeExercise(correct); }}
          onQuit={lesson.backToMenu}
        />
      );

    case "complete":
      saveProgress(lesson.currentLesson.id, lesson.correctCount, lesson.totalAnswered, language.id);
      return (
        <LessonCompleteScreen
          lesson={lesson.currentLesson}
          totalLessons={lesson.totalLessons}
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
          onExit={lesson.backToMenu}
          onRestartMissed={restartMissed}
          pronMode={pronMode}
        />
      ) : (
        <DrillSetup
          drillMode={drillMode}
          drillCount={drillCount}
          onModeChange={(mode) => setDrillMode(mode as DrillKind | "mixed")}
          onCountChange={(count) => setDrillCount(count as 10 | 20 | "all")}
          onPronModeChange={(mode) => settingsEngine.updateSettings({ pronMode: mode })}
          onStart={startDrill}
          onBack={lesson.backToMenu}
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
          questions={placementQuestions}
          onStart={placement.start}
          onAnswer={placement.answer}
          onQuit={placement.quit}
          onRetake={placement.retake}
          onChooseStart={placement.chooseStart}
        />
      );

    case "ai-practice":
      return (
        <AIPracticeScreen
          lesson={aiLesson}
          pronMode={pronMode}
          onBack={lesson.backToMenu}
          aiEnabled={settingsEngine.settings.aiEnabled}
        />
      );

    default:
      return null;
  }
}
