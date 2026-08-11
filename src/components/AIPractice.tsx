import { useState, useCallback } from "react";
import { generatePractice, generateCultureCard } from "~/server/aiPractice";
import type { CultureCard, PracticeResult } from "~/server/aiPractice";
import { generateFallbackExercises, type GeneratedExercise } from "~/engine/fallbackGenerator";
import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import MultipleChoice from "~/components/MultipleChoice";
import FillInBlank from "~/components/FillInBlank";
import MatchingPairs from "~/components/MatchingPairs";
import type { PronMode } from "~/lib/pronunciation";

// ── Types ────────────────────────────────────────────────────

interface AIPracticeProps {
  lesson: Lesson;
  pronMode: PronMode;
  onBack: () => void;
  /** When false, exercises are generated locally (free tier) — no AI, no culture cards. */
  aiEnabled: boolean;
  /** Language of the lesson; defaults to latin. Drives server prompts + copy. */
  language?: Language;
  /** Curriculum used for fallback distractors (English passes englishLessons; Latin omits it). */
  distractorLessons?: Lesson[];
}

type AIState = "idle" | "loading" | "practicing" | "complete";

// ── Component ────────────────────────────────────────────────

export default function AIPractice({ lesson, pronMode, onBack, aiEnabled, language = "latin", distractorLessons }: AIPracticeProps) {
  const [state, setState] = useState<AIState>("idle");
  const [exercises, setExercises] = useState<GeneratedExercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [culture, setCulture] = useState<CultureCard | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCulture, setShowCulture] = useState(false);

  const generateExercises = useCallback(
    async (count: number) => {
      setError(null);

      // Free tier: generate locally from lesson data — instant, zero API calls.
      if (!aiEnabled) {
        if (!lesson) {
          setError("Lesson not found — cannot generate practice");
          setState("idle");
          return;
        }
        setExercises(
          generateFallbackExercises(
            lesson,
            count,
            "mixed",
            language === "english" ? "english" : "latin",
            distractorLessons,
          ),
        );
        setCulture(null); // fallback never produces culture cards
        setCurrentIdx(0);
        setResults([]);
        setShowCulture(false);
        setState("practicing");
        return;
      }

      setState("loading");
      try {
        // TanStack Start server functions expect the payload under `data`.
        const result = await (generatePractice as unknown as (data: { data: { lessonId: number; count: number; language?: Language } }) => Promise<PracticeResult>)({ data: { lessonId: lesson.id, count, language } });
        if (result.error) throw new Error(result.error);
        setExercises(result.exercises as unknown as GeneratedExercise[]);
        setCulture(result.culture);
        setCurrentIdx(0);
        setResults([]);
        setShowCulture(false);
        setState("practicing");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate practice");
        setState("idle");
      }
    },
    [lesson, aiEnabled, language, distractorLessons],
  );

  const handleExerciseComplete = useCallback(
    (correct: boolean) => {
      const newResults = [...results, correct];
      setResults(newResults);
      if (currentIdx < exercises.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        setState("complete");
      }
    },
    [currentIdx, results, exercises.length],
  );

  const handleGenerateMore = useCallback(() => {
    generateExercises(5);
  }, [generateExercises]);

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setResults([]);
    setState("practicing");
  }, []);

  const handleCultureClick = useCallback(async () => {
    if (!aiEnabled) return; // fallback never generates culture cards
    if (culture) {
      setShowCulture(!showCulture);
      return;
    }
    try {
      const card = await (generateCultureCard as unknown as (data: { data: { lessonId: number; language?: Language } }) => Promise<CultureCard>)({ data: { lessonId: lesson.id, language } });
      setCulture(card);
      setShowCulture(true);
    } catch {
      // silent fallback
    }
  }, [culture, showCulture, lesson, language]);

  // ── Render: Idle ───────────────────────────────────────────

  if (state === "idle") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <span className="text-5xl mb-4 block">🤖</span>
          <h2 className="text-2xl font-bold text-burgundy-900 mb-2">
            AI Practice
          </h2>
          <p className="text-gray-600 mb-2">
            {aiEnabled
              ? "Generate fresh exercises using AI — every session is different."
              : "Generate fresh exercises from this lesson — no AI needed, works offline."}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Based on: {lesson.title}
          </p>

          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => generateExercises(5)}
              className="px-8 py-3 bg-burgundy-700 text-white rounded-xl font-semibold hover:bg-burgundy-800 transition shadow-md"
            >
              🎯 Generate 5 Exercises
            </button>
            <button
              onClick={() => generateExercises(10)}
              className="px-8 py-3 bg-gold-500 text-burgundy-900 rounded-xl font-semibold hover:bg-gold-600 transition shadow-md"
            >
              🔥 Generate 10 Exercises
            </button>
            <button
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-burgundy-600 transition mt-2"
            >
              ← Back to Lesson
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Loading ────────────────────────────────────────

  if (state === "loading") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <p className="text-gray-600">Generating exercises with AI...</p>
        <p className="text-sm text-gray-400 mt-1">This takes a few seconds</p>
      </div>
    );
  }

  // ── Render: Practicing ─────────────────────────────────────

  if (state === "practicing" && exercises[currentIdx]) {
    const ex = exercises[currentIdx];
    const progress = exercises.length;
    const done = currentIdx;

    return (
      <div className="min-h-dvh flex flex-col">
        {/* Progress bar */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              AI Practice — {done + 1} of {progress}
            </span>
            <button
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-burgundy-600"
            >
              ✕ Exit
            </button>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-burgundy-600 rounded-full transition-all duration-300"
              style={{ width: `${(done / progress) * 100}%` }}
            />
          </div>
        </div>

        {/* Generated badge */}
        <div className="px-4 pt-2">
          {aiEnabled ? (
            <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              🤖 AI-generated
            </span>
          ) : (
            <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              ⚡ Offline-generated
            </span>
          )}
        </div>

        {/* Exercise */}
        <div className="flex-1 flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-md">
            {ex.type === "multiple-choice" && (
              <MultipleChoice
                exercise={ex as any}
                onComplete={handleExerciseComplete}
              />
            )}
            {ex.type === "fill-in-blank" && (
              <FillInBlank
                exercise={ex as any}
                onComplete={handleExerciseComplete}
              />
            )}
            {ex.type === "matching" && (
              <MatchingPairs
                exercise={ex as any}
                onComplete={handleExerciseComplete}
                pronMode={pronMode}
              />
            )}
          </div>
        </div>

        {/* Culture card peek (AI mode only — fallback has no culture cards) */}
        {aiEnabled && (
          <div className="px-4 pb-4">
            <button
              onClick={handleCultureClick}
              className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-left hover:bg-amber-100 transition"
            >
              <span className="text-sm font-medium text-amber-800">
                {showCulture && culture ? (
                  <>
                    <span className="mr-2">{culture.icon}</span>
                    <strong>{culture.title}:</strong> {culture.fact}
                  </>
                ) : (
                  <>
                    💡 Tap for a {language === "latin" ? "Roman" : "cultural"} fact
                  </>
                )}
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Complete ────────────────────────────────────────

  if (state === "complete") {
    const correctCount = results.filter(Boolean).length;
    const totalCount = results.length;
    const pct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <span className="text-5xl mb-4 block">
            {pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}
          </span>
          <h2 className="text-2xl font-bold text-burgundy-900 mb-2">
            Practice Complete!
          </h2>
          <p className="text-3xl font-bold text-burgundy-700 mb-2">
            {correctCount}/{totalCount}
          </p>
          <p className="text-gray-500 mb-6">
            {pct >= 80
              ? "Excellent work! You're mastering this."
              : pct >= 50
                ? "Good effort! Keep practicing."
                : "Keep at it — practice makes perfect!"}
          </p>

          {aiEnabled && culture && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <p className="text-sm font-medium text-amber-800">
                <span className="mr-2">{culture.icon}</span>
                <strong>{culture.title}</strong>
              </p>
              <p className="text-sm text-amber-700 mt-1">{culture.fact}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={handleGenerateMore}
              className="px-8 py-3 bg-burgundy-700 text-white rounded-xl font-semibold hover:bg-burgundy-800 transition shadow-md"
            >
              🔄 Generate New Set
            </button>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-gold-500 text-burgundy-900 rounded-xl font-semibold hover:bg-gold-600 transition shadow-md"
            >
              🔁 Retry Same Set
            </button>
            <button
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-burgundy-600 transition mt-2"
            >
              ← Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
