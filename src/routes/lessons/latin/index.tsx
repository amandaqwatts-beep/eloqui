/**
 * latin.tsx — thin route orchestrator for Latin 101.
 *
 * All state machines live in the Engine department (src/engine/) and all
 * rendering lives in the Screens department (src/screens/). This file only
 * wires them together: owns the small amount of route-local UI state
 * (drill setup, settings overlay, AI lesson target, diagnostics drill meta)
 * and switches between the screens exposed by the engines.
 *
 * Diagnostics (owner direction 2026-08-11): the route assembles a
 * DiagnosticsSummary from the engine's query functions (loadDiagnostics +
 * getWeakSpots + getConfusionPairs) and passes it to ProgressScreen /
 * ReviewScreen, which stay presentational. Word/pair drills compose decks
 * from the free drill engine and enter the existing drill screen with
 * optional DrillView meta (title/reference/exitLabel).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import latinLessons from "~/data/latinLessons";
import placementQuestions from "~/data/placementTest";
import { bookLessons } from "~/data/bookLessons";
import { latinSideLessons } from "~/data/latinSideLessons";
import { GRAMMAR_INDEX } from "~/data/grammarIndex";
import { PLACEMENT_TOTAL_LEVELS_BY_LANGUAGE, DIAGNOSTICS_WINDOW_DAYS, MIN_MISTAKE_EVIDENCE, BONUS_DRILL_DEFAULT_COUNT, IMPROVEMENT_ACTIVE_DAYS } from "~/data/settings";
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
import {
  getWeakSpots,
  getConfusionPairs,
  recordLessonAttempt,
} from "~/engine/diagnostics";
import { loadDiagnostics, recordAttempt } from "~/engine/storage";
import type { ConfusionPair, ExerciseResultDetail } from "~/engine/types";
import {
  buildWordDrillCards,
  buildPairDrillCards,
  pairCheatLine,
  conceptGloss,
  type DiagnosticsSummary,
} from "~/lib/diagnosticUi";

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
import SleepAudioScreen from "~/screens/SleepAudioScreen";
import ProgressScreen from "~/screens/ProgressScreen";
import { loadProgress, getDashboardStats, saveProgress } from "~/engine/progress";
import { loadAccuracy, recordAccuracy } from "~/engine/storage";
import ReviewScreen from "~/screens/ReviewScreen";
import PairDrillScreen from "~/screens/PairDrillScreen";
import { DailyLessonCard, BonusLessonCard } from "~/components/ProficiencyCards";
import WindowFrame from "~/components/WindowFrame";

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

  // ── Route-local UI state ─────────────────────────────────────
  const [drillMode, setDrillMode] = useState<DrillKind | "mixed">("mixed");
  const [drillCount, setDrillCount] = useState<10 | 20 | "all">(10);
  const [drillCards, setDrillCards] = useState<DrillCard[] | null>(null);
  const [aiLessonId, setAiLessonId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showSleepAudio, setShowSleepAudio] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showReview, setShowReview] = useState(false);
  // Origin-aware drill exits (§1.3): diagnostics drills launched from the
  // Progress / Review overlays return to that overlay instead of the menu.
  const [drillOrigin, setDrillOrigin] = useState<"menu" | "progress" | "review">("menu");
  // Diagnostics drill session meta (UI-spec §6): title/reference/exitLabel
  // passed through to DrillView; pendingPair gates the pair-drill intro.
  // P2 adds instructionOverride (bonus deck tiers 3–4) and badgeLine (bonus
  // drill chip) — both optional, absent → DrillView output byte-identical.
  const [drillMeta, setDrillMeta] = useState<{
    title?: string;
    reference?: string;
    exitLabel?: string;
    instructionOverride?: Partial<Record<DrillKind, string>>;
    badgeLine?: string;
  } | null>(null);
  const [pendingPair, setPendingPair] = useState<ConfusionPair | null>(null);

  // ── Diagnostics summary (assembled per render — the event log is small) ──
  const diagnosticsEvents = loadDiagnostics(language.id);
  const summary: DiagnosticsSummary = {
    windowDays: DIAGNOSTICS_WINDOW_DAYS,
    answerCount: diagnosticsEvents.length,
    enoughData: diagnosticsEvents.length >= MIN_MISTAKE_EVIDENCE,
    weakSpots: getWeakSpots(diagnosticsEvents, latinLessons),
    confusionPairs: getConfusionPairs(diagnosticsEvents, latinLessons),
  };

  // ── Proficiency cards (P2): daily worst-area lesson + improvement streak ──
  // Both are pure reads (getDailyWorstLesson / getImprovementStreak write
  // nothing); derived per render alongside the summary. Same (events,
  // progress, language, UTC date) → byte-identical card.
  const completedLessonIds = loadProgress(language.id).filter((p) => p.completed).map((p) => p.lessonId);
  const dailyLesson = getDailyWorstLesson({
    events: diagnosticsEvents,
    lessons: latinLessons,
    completedLessonIds,
    unlockedLessons: lesson.unlockedLessons,
    language: language.id,
  });
  const streak = getImprovementStreak(diagnosticsEvents, { language: language.id });
  const dailyCompleted = dailyLesson ? completedLessonIds.includes(dailyLesson.lessonId) : false;
  const bonusClaimable = streak.streakDays >= IMPROVEMENT_ACTIVE_DAYS && !streak.bonusClaimedToday;

  // Navigation wrappers: keep engine screen transitions in sync with
  // route-local state the screens don't own.
  const openDrill = useCallback(() => {
    setDrillCards(null); // re-enter drill from the setup screen
    setDrillOrigin("menu"); // plain menu drill exits to the menu
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

  // ── Diagnostics drill wiring (UI-spec §6) ────────────────────
  // Exit label + return target derive from the origin overlay (drillOrigin),
  // captured when the drill starts — the overlays unmount during the drill
  // run, so the live showProgress/showReview booleans are unreliable mid-run.

  const startWordDrill = useCallback(
    (conceptId: string) => {
      const spot = summary.weakSpots.find((s) => s.conceptId === conceptId);
      const partnerConceptId =
        spot?.mainMistake?.type === "confused-with"
          ? spot.mainMistake.partner?.conceptId
          : undefined;
      const cards = buildWordDrillCards({
        conceptId,
        partnerConceptId,
        lessons: latinLessons,
        pronMode,
      });
      const origin = showProgress ? "progress" : "review";
      setDrillOrigin(origin);
      setPendingPair(null);
      setDrillMeta({
        title: "🎯 Word Drill",
        reference: partnerConceptId
          ? pairCheatLine(
              {
                a: conceptId,
                b: partnerConceptId,
                labelA: spot?.label ?? conceptId,
                labelB: spot?.mainMistake?.partner?.label ?? partnerConceptId,
                aToB: 0,
                bToA: 0,
                total: 0,
                attempts: 0,
                rate: 0,
              },
              latinLessons,
            )
          : undefined,
        exitLabel: origin === "progress" ? "Back to Progress" : "Back to Review",
      });
      if (cards.length === 0) {
        lesson.backToMenu();
        return;
      }
      setDrillCards(cards);
      lesson.goToDrill();
    },
    [summary.weakSpots, pronMode, lesson, showProgress],
  );

  const beginPairDrill = useCallback(
    (pair: ConfusionPair) => {
      setDrillOrigin(showProgress ? "progress" : "review");
      setDrillCards(null);
      setPendingPair(pair);
      lesson.goToDrill();
    },
    [lesson, showProgress],
  );

  const startPairDrill = useCallback(
    (pair: ConfusionPair) => {
      const cards = buildPairDrillCards({
        pair,
        lessons: latinLessons,
        pronMode,
      });
      if (cards.length === 0) {
        setPendingPair(null);
        lesson.backToMenu();
        return;
      }
      const exitLabel =
        drillOrigin === "progress"
          ? "Back to Progress"
          : drillOrigin === "review"
            ? "Back to Review"
            : "Back to Lessons";
      setPendingPair(null);
      setDrillCards(cards);
      setDrillMeta({
        title: "⚔️ Confusion Drill",
        reference: pairCheatLine(pair, latinLessons),
        exitLabel,
      });
      lesson.goToDrill();
    },
    [pronMode, lesson, drillOrigin],
  );

  const exitDiagnosticsDrill = useCallback(() => {
    setDrillMeta(null);
    setDrillCards(null);
    setPendingPair(null);
    // §1.3 origin-aware exits: drills launched from the Progress / Review
    // overlays return to that overlay; plain menu drills return to the menu.
    if (drillOrigin === "progress") setShowProgress(true);
    else if (drillOrigin === "review") setShowReview(true);
    lesson.backToMenu();
  }, [lesson, drillOrigin]);

  const openLessonFromDiagnostics = useCallback(
    (lessonId: number) => {
      const idx = latinLessons.findIndex((l) => l.id === lessonId);
      if (idx >= 0 && idx < lesson.unlockedLessons) {
        setShowProgress(false);
        setShowReview(false);
        lesson.selectLesson(idx);
      }
    },
    [lesson],
  );

  // ── Proficiency cards (P2) handlers ───────────────────────────
  // Daily lesson card: SELECT_LESSON resets the run and opens at teaching.
  const openDailyLesson = useCallback(() => {
    if (!dailyLesson) return;
    const idx = latinLessons.findIndex((l) => l.id === dailyLesson.lessonId);
    if (idx >= 0 && idx < lesson.unlockedLessons) lesson.selectLesson(idx);
  }, [dailyLesson, lesson]);

  // Bonus drill card: claim first (gates + records the daily entitlement),
  // then build the tiered deck. Empty deck (no worst area resolves) falls
  // back to a generic mixed review deck (lead decision B).
  const startBonusDrill = useCallback(() => {
    const claimed = claimBonusDrill(language.id);
    if (!claimed) return;
    setDrillOrigin("menu"); // bonus drills always exit to the menu
    const deck = buildBonusDrillDeck({
      tier: streak.tier,
      events: diagnosticsEvents,
      lessons: latinLessons,
      pronMode,
    });
    if (deck.cards.length === 0) {
      const pool = shuffle(
        buildDrillCards(latinLessons, lesson.unlockedLessons, "mixed", pronMode),
      );
      setDrillCards(pool.slice(0, BONUS_DRILL_DEFAULT_COUNT));
    } else {
      setDrillCards(deck.cards);
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

  const aiLesson =
    latinLessons.find((l) => l.id === aiLessonId) ?? lesson.currentLesson;

  // ── F13: gate the shelf's scroll-to-frontier (§1.3) ──────────
  // The menu mounts fresh on page load (auto-open to the frontier — the
  // ratified v2 behavior) but also remounts when a mode (drill / placement /
  // AI) exits. The shelf scroll on a mode return is the "yank" — so once the
  // menu has mounted this page load, the scroll fires only when the frontier
  // moved past the last viewed one (persisted in sessionStorage, keyed by
  // language, written by Bookshelf). The frontier book still expands.
  const menuMountedRef = useRef(false);
  useEffect(() => {
    if (lesson.screen === "menu") menuMountedRef.current = true;
  }, [lesson.screen]);
  const frontierKey = `eloqui:frontier:${language.id}`;
  let suppressFrontierScroll = false;
  if (menuMountedRef.current) {
    try {
      suppressFrontierScroll =
        Number(sessionStorage.getItem(frontierKey)) === lesson.unlockedLessons;
    } catch {
      suppressFrontierScroll = false; // storage unavailable — scroll as before
    }
  }

  switch (lesson.screen) {
    case "menu":
      // Overlay stack (design §1.1/§1.2): the shelf NEVER unmounts while a
      // window is open. LessonMenu renders always; utility windows mount as
      // WindowFrame overlays (z-60) on top, so scroll position, expanded
      // book, and open culture section survive every round trip.
      return (
        <>
          <LessonMenu
            lessons={latinLessons}
            unlockedLessons={lesson.unlockedLessons}
            onSelectLesson={lesson.selectLesson}
            onOpenDrill={openDrill}
            onOpenPlacement={lesson.goToPlacement}
            onOpenAIPractice={openAIPractice}
            onOpenSettings={() => setShowSettings(true)}
            onOpenAudio={() => setShowAudio(true)}
            onOpenSleep={() => setShowSleepAudio(true)}
            onOpenProgress={() => setShowProgress(true)}
            onOpenReview={() => setShowReview(true)}
            devMode={settingsEngine.settings.devMode}
            lessonProgress={loadProgress(language.id)}
            bookLessons={bookLessons}
            sideLessons={latinSideLessons}
            grammarTopics={GRAMMAR_INDEX}
            languageId={language.id}
            suppressFrontierScroll={suppressFrontierScroll}
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
            onCultureResult={(exercise, hostLessonId, detail) =>
              recordAttempt(
                {
                  conceptId: `culture:${exercise.id}`,
                  tags: [`lesson:${hostLessonId}`],
                  kind: "concept",
                  ok: detail.correct,
                  source: "review",
                  context: exercise.id,
                  mistake: detail.correct ? undefined : "unknown",
                  wrong: detail.wrong,
                  expected: detail.expected,
                },
                language.id,
              )
            }
          />
          {showSettings && (
            <SettingsScreen
              settings={settingsEngine.settings}
              onUpdateSettings={settingsEngine.updateSettings}
              onClearData={settingsEngine.clearAllData}
              onEnableDevMode={settingsEngine.enableDevMode}
              onBack={() => setShowSettings(false)}
            />
          )}
          {showProgress && (
            <ProgressScreen
              lessons={latinLessons}
              stats={getDashboardStats(latinLessons.length, [], language.id, diagnosticsEvents, streak.streakDays)}
              lessonProgress={loadProgress(language.id)}
              onBack={() => setShowProgress(false)}
              onOpenReview={() => { setShowProgress(false); setShowReview(true); }}
              summary={summary}
              onDrillWord={startWordDrill}
              onDrillPair={beginPairDrill}
              onOpenLesson={openLessonFromDiagnostics}
            />
          )}
          {showReview && (
            <ReviewScreen
              accuracy={loadAccuracy(language.id)}
              lessons={latinLessons}
              onBack={() => setShowReview(false)}
              onPracticeLesson={openAIPractice}
              summary={summary}
              onDrillWord={startWordDrill}
              onDrillPair={beginPairDrill}
              onOpenLesson={openLessonFromDiagnostics}
            />
          )}
          {showAudio && (
            <AudioPlayerScreen
              lessons={latinLessons}
              unlockedLessons={lesson.unlockedLessons}
              onBack={() => setShowAudio(false)}
            />
          )}
          {showSleepAudio && (
            <WindowFrame
              title="Sleep Audio"
              onBack={() => setShowSleepAudio(false)}
              variant="overlay"
            >
              <SleepAudioScreen
                lessons={latinLessons}
                completedLessonIds={completedLessonIds}
                events={diagnosticsEvents}
                pronMode={pronMode}
                language={language.id}
                onBack={() => setShowSleepAudio(false)}
              />
            </WindowFrame>
          )}
        </>
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
          allLessons={latinLessons}
          onComplete={(detail: ExerciseResultDetail) => {
            recordAccuracy(`lesson-${lesson.currentLesson.id}`, detail.correct, language.id);
            recordLessonAttempt({ lesson: lesson.currentLesson, exerciseIdx: lesson.exerciseIdx, detail, language: language.id, allLessons: latinLessons });
            lesson.completeExercise(detail.correct);
          }}
          onQuit={lesson.backToMenu}
        />
      );

    case "complete":
      saveProgress(lesson.currentLesson.id, lesson.correctCount, lesson.totalAnswered, language.id);
      // Improvement streak: idempotent per UTC date key (StrictMode-safe) —
      // below-floor days are no-ops (pause, not break).
      recordStreakDay(language.id);
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
      if (pendingPair && !drillCards) {
        // Pair-drill intro phase (UI-spec §6.1); Start builds the deck.
        return (
          <PairDrillScreen
            pair={pendingPair}
            glossA={conceptGloss(pendingPair.a, latinLessons)}
            glossB={conceptGloss(pendingPair.b, latinLessons)}
            onStart={() => startPairDrill(pendingPair)}
            onBack={exitDiagnosticsDrill}
          />
        );
      }
      return drillCards && drillCards.length > 0 ? (
        <DrillView
          key={drillCards.map((c) => c.id).join(",")}
          cards={drillCards}
          onExit={drillMeta ? exitDiagnosticsDrill : lesson.backToMenu}
          onRestartMissed={restartMissed}
          pronMode={pronMode}
          title={drillMeta?.title}
          reference={drillMeta?.reference}
          exitLabel={drillMeta?.exitLabel}
          instructionOverride={drillMeta?.instructionOverride}
          badgeLine={drillMeta?.badgeLine}
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
