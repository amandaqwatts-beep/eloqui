import { useState } from "react";
import type { MultipleChoiceExercise } from "~/data/latinLessons";
import type { ExerciseResultDetail } from "~/engine/types";

interface Props {
  exercise: MultipleChoiceExercise;
  onComplete: (correct: boolean) => void;
  /**
   * Optional additive detail hook (diagnostics): forwards the selected option
   * and the canonical answer so the route can record wrong/expected.
   */
  onResult?: (detail: ExerciseResultDetail) => void;
}

export default function MultipleChoice({ exercise, onComplete, onResult }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === exercise.correctIndex;

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    onComplete(isCorrect);
    onResult?.({
      correct: isCorrect,
      wrong: exercise.options[selected],
      expected: exercise.options[exercise.correctIndex],
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-burgundy-900 leading-relaxed">
        {exercise.prompt}
      </p>

      <div className="space-y-2.5">
        {exercise.options.map((opt, idx) => {
          let btnClass =
            "w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ";

          if (!submitted) {
            if (selected === idx) {
              btnClass += "border-burgundy-500 bg-burgundy-50 text-burgundy-900 shadow-sm";
            } else {
              btnClass +=
                "bg-cream-50 border-wood-200 text-wood-900 hover:bg-cream-100 hover:border-wood-300 cursor-pointer";
            }
          } else {
            if (idx === exercise.correctIndex) {
              btnClass += "border-green-500 bg-green-50 text-green-800";
            } else if (selected === idx) {
              btnClass += "border-red-400 bg-red-50 text-red-700";
            } else {
              btnClass += "border-gray-200 bg-white text-gray-400";
            }
          }

          return (
            <button
              key={idx}
              className={btnClass}
              onClick={() => handleSelect(idx)}
              disabled={submitted}
              aria-pressed={selected === idx}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-sm font-bold shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
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
          {exercise.explanation}
        </div>
      )}
    </div>
  );
}
