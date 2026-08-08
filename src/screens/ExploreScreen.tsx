/**
 * ExploreScreen — Explore section UI for Latin side lessons (IDs 101–116).
 *
 * Presentational screen owned by the Screens department. Renders the side
 * lesson list and a mini-lesson view reusing the shared exercise components
 * (MultipleChoice, MatchingPairs) and VocabularyTable from /components.
 *
 * Side lessons are optional enrichment: they never gate progression, never
 * affect placement, and this screen NEVER writes to core lesson progress
 * storage — all answer tracking is component-local state that resets when
 * the screen unmounts.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Exercise } from "~/data/latinLessons";
import { latinSideLessons, type SideLesson } from "~/data/latinSideLessons";
import NavBar from "~/components/NavBar";
import ProgressBar from "~/components/ProgressBar";
import VocabularyTable from "~/components/VocabularyTable";
import MultipleChoice from "~/components/MultipleChoice";
import MatchingPairs from "~/components/MatchingPairs";

/** Reuse the existing exercise components — side lessons only use MC + matching. */
function SideExercise({
  exercise,
  onComplete,
}: {
  exercise: Exercise;
  onComplete: (correct: boolean) => void;
}) {
  switch (exercise.type) {
    case "multiple-choice":
      return <MultipleChoice exercise={exercise} onComplete={onComplete} />;
    case "matching":
      return <MatchingPairs exercise={exercise} onComplete={onComplete} />;
    default:
      return <p className="text-red-500">Unknown exercise type</p>;
  }
}

function SideLessonView({ lesson, onBack }: { lesson: SideLesson; onBack: () => void }) {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const total = lesson.exercises.length;
  const done = exerciseIdx >= total;

  const handleComplete = (correct: boolean) => {
    setCorrectCount((c) => c + (correct ? 1 : 0));
    setExerciseIdx((i) => i + 1);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <main className="flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={onBack}
            className="mb-4 inline-block text-sm text-gray-400 transition hover:text-burgundy-600"
          >
            ← Back to Explore
          </button>

          <span className="mb-3 inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-800">
            Explore · Ties to Lesson {lesson.bookLessonId}
          </span>
          <h1 className="text-2xl font-extrabold text-burgundy-900 sm:text-3xl">
            {lesson.title}
          </h1>
          {lesson.subtitle && (
            <p className="mt-1 text-lg font-medium text-gold-700">{lesson.subtitle}</p>
          )}

          <div className="mt-6 rounded-2xl border border-burgundy-200 bg-cream-50 p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-burgundy-600">
              Key Concept
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
              {lesson.concept}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-gold-200 bg-gold-50 p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold-800">
              Cultural Context
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
              {lesson.context}
            </p>
          </div>

          {lesson.vocabulary.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-burgundy-600">
                Vocabulary
              </h2>
              <VocabularyTable title={`${lesson.title} — Vocabulary`} items={lesson.vocabulary} />
            </div>
          )}

          <div className="mt-8">
            {done ? (
              <div className="rounded-2xl border border-burgundy-200 bg-cream-50 p-6 text-center">
                <span className="block text-4xl mb-2">
                  {correctCount === total ? "🏆" : correctCount >= Math.ceil(total / 2) ? "🎉" : "📖"}
                </span>
                <h2 className="text-xl font-extrabold text-burgundy-900">Explore Complete!</h2>
                <p className="mt-2 text-gray-600">
                  You answered <span className="font-bold text-burgundy-700">{correctCount}</span> of{" "}
                  <span className="font-bold">{total}</span> exercises correctly.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  This is an optional enrichment lesson — nothing is saved to your progress.
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => {
                      setExerciseIdx(0);
                      setCorrectCount(0);
                    }}
                    className="flex-1 rounded-xl border-2 border-burgundy-200 bg-white py-2.5 text-sm font-semibold text-burgundy-700 transition hover:border-burgundy-400"
                  >
                    ↻ Try Again
                  </button>
                  <button
                    onClick={onBack}
                    className="flex-1 rounded-xl bg-burgundy-700 py-2.5 text-sm font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
                  >
                    Back to Explore
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Exercise {exerciseIdx + 1} of {total}
                  </span>
                  <span className="text-sm font-semibold text-gold-700">
                    {correctCount} correct
                  </span>
                </div>
                <ProgressBar current={exerciseIdx} total={total} />
                <div className="mt-5">
                  <SideExercise
                    key={lesson.exercises[exerciseIdx].id}
                    exercise={lesson.exercises[exerciseIdx]}
                    onComplete={handleComplete}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ExploreList({ onOpen }: { onOpen: (id: number) => void }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <span className="mb-4 block text-5xl">🏛️</span>
            <h1 className="text-3xl font-extrabold text-burgundy-900 sm:text-4xl">
              Explore Latin
            </h1>
            <p className="mx-auto mt-3 max-w-lg leading-relaxed text-gray-600">
              Optional enrichment lessons on Roman life, culture, and review — tied to
              each Henle book lesson. Explore freely: these never gate your progress.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {latinSideLessons.map((l) => (
              <button
                key={l.id}
                onClick={() => onOpen(l.id)}
                className="w-full rounded-2xl border-2 border-burgundy-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-sm font-bold text-gold-800">
                    {l.bookLessonId}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-burgundy-900">{l.title}</h3>
                      <span className="rounded-full bg-burgundy-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-burgundy-600">
                        L{l.bookLessonId}
                      </span>
                    </div>
                    {l.subtitle && (
                      <p className="mt-0.5 text-sm text-gray-500">{l.subtitle}</p>
                    )}
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-400 line-clamp-2">
                      {l.concept}
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-gold-700">
                      {l.exercises.length} exercises · {l.vocabulary.length} words
                    </p>
                  </div>
                  <svg
                    className="mt-2 h-5 w-5 shrink-0 text-burgundy-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/lessons/latin"
              className="text-sm text-gray-400 transition hover:text-burgundy-600"
            >
              ← Back to Latin 101
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ExploreScreen() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const lesson = latinSideLessons.find((l) => l.id === selectedId);
  if (lesson) return <SideLessonView lesson={lesson} onBack={() => setSelectedId(null)} />;
  return <ExploreList onOpen={setSelectedId} />;
}
