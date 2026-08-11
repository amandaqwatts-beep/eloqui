import { useState, useRef, type KeyboardEvent } from "react";
import type { FillInBlankExercise } from "~/data/latinLessons";
import type { ExerciseResultDetail } from "~/engine/types";

interface Props {
  exercise: FillInBlankExercise;
  onComplete: (correct: boolean) => void;
  /**
   * Optional additive detail hook (diagnostics): forwards the typed answer
   * and the canonical answer so the route can record wrong/expected.
   */
  onResult?: (detail: ExerciseResultDetail) => void;
}

export default function FillInBlank({ exercise, onComplete, onResult }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const checkAnswer = (input: string): boolean => {
    const normalized = normalize(input);
    if (normalized === normalize(exercise.answer)) return true;
    if (exercise.acceptableAnswers) {
      return exercise.acceptableAnswers.some(
        (a) => normalize(a) === normalized,
      );
    }
    return false;
  };

  const isCorrect = checkAnswer(value);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    onComplete(isCorrect);
    onResult?.({ correct: isCorrect, wrong: value, expected: exercise.answer });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-burgundy-900 leading-relaxed">
        {exercise.prompt}
      </p>

      <div className="flex items-center gap-2 flex-wrap text-lg">
        {exercise.before && (
          <span className="text-gray-700">{exercise.before}</span>
        )}
        <span className="relative inline-flex items-center">
          {submitted ? (
            <span
              className={`inline-block min-w-[120px] rounded-lg border-2 px-4 py-2.5 text-center font-bold ${
                isCorrect
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-red-400 bg-red-50 text-red-700 line-through"
              }`}
            >
              {value || "(no answer)"}
            </span>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type your answer"
              autoFocus
              className="min-w-[140px] rounded-lg border-2 border-burgundy-300 bg-white px-4 py-2.5 text-center text-burgundy-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-200"
            />
          )}
        </span>
        {exercise.after && (
          <span className="text-gray-700">{exercise.after}</span>
        )}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full rounded-xl bg-burgundy-700 py-3 text-base font-semibold text-cream-50 shadow transition hover:bg-burgundy-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check Answer
        </button>
      )}

      {submitted && (
        <div
          className={`rounded-xl p-4 text-sm font-medium leading-relaxed ${
            isCorrect
              ? "bg-green-50 border border-green-300 text-green-800"
              : "bg-red-50 border border-red-300 text-red-700"
          }`}
        >
          {isCorrect ? "✅ Correct! " : "❌ Not quite. "}
          {!isCorrect && (
            <span className="font-bold">
              Correct answer: <em>{exercise.answer}</em>.{" "}
            </span>
          )}
          {exercise.explanation}
        </div>
      )}
    </div>
  );
}
