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
import { recordLessonAttempt } from "~/engine/diagnostics";
import { loadDiagnostics, recordAccuracy } from "~/engine/storage";
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
          stats={getDashboardStats(englishLessons.length, [], language.id, loadDiagnostics(language.id))}
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
          onPronModeChange={() => {}}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProgress={() => setShowProgress(true)}
          devMode={settingsEngine.settings.devMode}
          title="English 101"
          description="Master formal register and academic vocabulary — the language of essays, applications, and professional writing."
          emoji="📚"
          showPronToggle={false}
          backTo="/languages"
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
          pronMode={pronMode}
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
          instructionOverride={ENGLISH_DRILL_INSTRUCTIONS}
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
