import { useState } from "react";
import { Link } from "@tanstack/react-router";
import crossLanguageLessons, {
  type CrossLanguageRequirement,
  type CrossLanguageSideLesson,
} from "~/data/crossLanguageLessons";
import { LANGUAGES, type Language } from "~/data/languages";
import type { Exercise } from "~/data/latinLessons";
import { loadProgress } from "~/engine/progress";
import {
  loadCrossProgress,
  saveCrossProgress,
} from "~/engine/crossLanguage";
import { speakLatin, speakEnglish } from "~/engine/speech";
import ComparisonPanel from "~/components/ComparisonPanel";
import VocabularyTable from "~/components/VocabularyTable";
import TeachingStepCard from "~/components/TeachingStepCard";
import MultipleChoice from "~/components/MultipleChoice";
import FillInBlank from "~/components/FillInBlank";
import MatchingPairs from "~/components/MatchingPairs";
import Flashcard from "~/components/Flashcard";

/**
 * CrossLanguageScreen — list view + lesson view for the Latin↔English side
 * lessons 1007/1008 (SEPARATE route, never injected into the shelf).
 *
 * Unlock gating reads per-language progress directly (C2): a lesson is
 * unlocked when EVERY requirement is met — `loadProgress(req.language)` has a
 * completed entry with `lessonId >= req.minLessonId`. We deliberately do NOT
 * use `hasCompletedThrough` from engine/crossLanguage.ts — that helper is
 * CROSS-scoped (reads verbum-cross-progress) and cannot gate these lessons.
 *
 * Completion is StrictMode-safe: `saveCrossProgress` is called ONLY from the
 * final exercise's `onComplete` user-event handler (never during render), and
 * writes ONLY the verbum-cross-progress key — never per-language progress.
 */

/**
 * Pure gate check: is a single per-language requirement met given the lesson
 * progress list for that language (a completed entry with lessonId >= min).
 * Exported pure (no localStorage access) for smoke-testing.
 */
export function isRequirementMet(
  req: CrossLanguageRequirement,
  progress: ReturnType<typeof loadProgress>,
): boolean {
  return progress.some(
    (p) => p.completed && p.lessonId >= req.minLessonId,
  );
}

/** Reads the per-language progress and evaluates one requirement. */
function requirementMet(req: CrossLanguageRequirement): boolean {
  return isRequirementMet(req, loadProgress(req.language));
}

function renderExercise(exercise: Exercise, onComplete: (correct: boolean) => void) {
  switch (exercise.type) {
    case "multiple-choice":
      return <MultipleChoice key={exercise.id} exercise={exercise} onComplete={onComplete} />;
    case "fill-in-blank":
      return <FillInBlank key={exercise.id} exercise={exercise} onComplete={onComplete} />;
    case "matching":
      return <MatchingPairs key={exercise.id} exercise={exercise} onComplete={onComplete} />;
    case "flashcard":
      return <Flashcard key={exercise.id} exercise={exercise} onComplete={onComplete} />;
    default:
      return <p className="text-xs text-red-500">Unknown exercise type</p>;
  }
}

export default function CrossLanguageScreen() {
  const [activeLesson, setActiveLesson] = useState<CrossLanguageSideLesson | null>(null);

  if (activeLesson) {
    return (
      <LessonView
        lesson={activeLesson}
        onBack={() => setActiveLesson(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-cream-50 px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <Link to="/languages" className="text-sm font-semibold text-burgundy-800">
          ← Languages
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-burgundy-900">
          🔗 Cross-Language Connections
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Latin meets English: roots and grammar across the two courses.
        </p>
        <div className="mt-8 space-y-5">
          {crossLanguageLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onOpen={() => setActiveLesson(lesson)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function LessonCard({
  lesson,
  onOpen,
}: {
  lesson: CrossLanguageSideLesson;
  onOpen: () => void;
}) {
  const unlocked = lesson.requires.every(requirementMet);
  const completed = loadCrossProgress().some(
    (p) => p.lessonId === lesson.id && p.completed,
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!unlocked}
      className={`w-full rounded-2xl border bg-white p-6 text-left shadow-sm transition ${
        unlocked
          ? "border-burgundy-200 hover:-translate-y-0.5 hover:shadow-md"
          : "cursor-not-allowed border-gray-200 opacity-75"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-burgundy-900">
          {!unlocked ? "🔒" : completed ? "✅" : "🔓"} {lesson.title}
        </h2>
        <span className="shrink-0 text-xs text-gray-400">
          {lesson.exercises.length} exercises
        </span>
      </div>
      {lesson.subtitle && (
        <p className="mt-1 text-sm text-gray-600">{lesson.subtitle}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {lesson.requires.map((req) => {
          const met = requirementMet(req);
          return (
            <span
              key={`${req.language}-${req.minLessonId}`}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                met ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
              }`}
            >
              Needs: {LANGUAGES[req.language].name} Lesson {req.minLessonId}{" "}
              {met ? "✓" : "✗"}
            </span>
          );
        })}
      </div>
      {!unlocked && (
        <p className="mt-3 text-xs text-gray-400">
          Complete the lessons above to unlock this connection.
        </p>
      )}
    </button>
  );
}

/**
 * Lesson view — clones the ExploreMiniFlow flow (Bookshelf.tsx L1234–1286)
 * but widens the exercise switch to MC / FillInBlank / MatchingPairs /
 * Flashcard, and precedes the exercises with the full teach surface:
 * Concept box → Context box → ComparisonPanels → VocabularyTable →
 * TeachingSteps. Completion card deliberately says "saved to your
 * Connections progress" (opposite ExploreMiniFlow's "nothing saved").
 */
function LessonView({
  lesson,
  onBack,
}: {
  lesson: CrossLanguageSideLesson;
  onBack: () => void;
}) {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const total = lesson.exercises.length;
  const done = exerciseIdx >= total;

  /**
   * StrictMode-safe completion: called ONLY as the user-event onComplete of
   * each exercise. The closure's exerciseIdx/correctCount reflect the count
   * AFTER the previous exercise, so `score` here is correct for 0..exerciseIdx
   * and the `exerciseIdx + 1 === total` check fires exactly once, on the final
   * exercise, inside a click handler -> saveCrossProgress runs once.
   */
  const handleComplete = (correct: boolean) => {
    const score = correctCount + (correct ? 1 : 0);
    setCorrectCount(score);
    setExerciseIdx((i) => i + 1);
    if (exerciseIdx + 1 === total) {
      const list = loadCrossProgress();
      const entry = list.find((e) => e.lessonId === lesson.id);
      const timesCompleted = (entry?.timesCompleted ?? 0) + 1;
      const next = [
        ...list.filter((e) => e.lessonId !== lesson.id),
        {
          lessonId: lesson.id,
          completed: true,
          bestScore: Math.max(
            entry?.bestScore ?? 0,
            Math.round((score / total) * 100),
          ),
          lastAttemptedAt: new Date().toISOString(),
          timesCompleted,
        },
      ];
      saveCrossProgress(next);
    }
  };

  return (
    <main className="min-h-screen bg-cream-50 px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-burgundy-800"
        >
          ← All Connections
        </button>
        <h1 className="mt-6 text-2xl font-bold text-burgundy-900">
          {lesson.title}
        </h1>
        {lesson.subtitle && (
          <p className="mt-1 text-gray-600">{lesson.subtitle}</p>
        )}

        {done ? (
          <div className="mt-8 rounded-2xl border border-burgundy-200 bg-cream-50 p-6 text-center">
            <span className="mb-2 block text-4xl">
              {correctCount === total
                ? "🏆"
                : correctCount >= Math.ceil(total / 2)
                  ? "🎉"
                  : "📖"}
            </span>
            <p className="text-lg font-bold text-burgundy-900">
              Connections Complete!
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {correctCount} of {total} correct — saved to your Connections
              progress.
            </p>
            <button
              type="button"
              onClick={() => {
                setExerciseIdx(0);
                setCorrectCount(0);
              }}
              className="mt-4 rounded-xl border-2 border-burgundy-200 bg-white px-4 py-1.5 text-xs font-semibold text-burgundy-700 transition hover:border-burgundy-400"
            >
              ↻ Try Again
            </button>
          </div>
        ) : (
          <>
            {/* 1. Concept box */}
            <div className="mt-6 rounded-2xl border border-burgundy-200 bg-white p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-burgundy-500">
                Concept
              </span>
              <p
                className="mt-2 text-sm leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{ __html: lesson.concept }}
              />
            </div>

            {/* 2. Context box */}
            <div className="mt-4 rounded-2xl border border-cream-300 bg-gold-50 p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                Context
              </span>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {lesson.context}
              </p>
            </div>

            {/* 3. Comparison panels */}
            <div className="mt-6 space-y-4">
              {lesson.comparisons.map((c) => (
                <ComparisonPanel key={c.id} comparison={c} />
              ))}
            </div>

            {/* 4. Vocabulary table (per-lesson headers/speaker quirk, see §3) */}
            <div className="mt-6">
              <VocabularyTable
                title={`${lesson.title} — Vocabulary`}
                items={lesson.vocabulary}
                {...(lesson.id === 1007
                  ? { leftHeader: "Term", onSpeakLeft: speakEnglish }
                  : { leftHeader: "Latin", onSpeakLeft: speakLatin })}
              />
            </div>

            {/* 5. Teaching steps */}
            {lesson.teachingSteps && lesson.teachingSteps.length > 0 && (
              <div className="mt-6 space-y-4">
                <h2 className="text-sm font-bold text-burgundy-900">
                  Teaching Steps
                </h2>
                {lesson.teachingSteps.map((step, i) => (
                  <TeachingStepCard
                    key={i}
                    step={step}
                    index={i + 1}
                    total={lesson.teachingSteps!.length}
                  />
                ))}
              </div>
            )}

            {/* 6. Exercises — full switch, boolean onComplete */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  Exercise {exerciseIdx + 1} of {total}
                </span>
                <span className="text-xs font-semibold text-gold-700">
                  {correctCount} correct
                </span>
              </div>
              {renderExercise(lesson.exercises[exerciseIdx], handleComplete)}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Re-export for consumers that need the type alongside the screen.
export type { Language };
