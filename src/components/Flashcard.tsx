import { useState } from "react";
import type { FlashcardExercise } from "~/data/latinLessons";

interface Props {
  exercise: FlashcardExercise;
  onComplete: (correct: boolean) => void;
}

export default function Flashcard({ exercise, onComplete }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState(false);

  const handleFlip = () => {
    if (rated) return;
    setFlipped(true);
  };

  const handleRating = (gotIt: boolean) => {
    setRated(true);
    onComplete(gotIt);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-burgundy-900 leading-relaxed">
        {exercise.prompt}
      </p>

      {/* Card */}
      <div
        onClick={handleFlip}
        className={`relative w-full min-h-[180px] rounded-2xl border-2 transition-all duration-500 cursor-pointer select-none ${
          flipped
            ? "border-burgundy-300 bg-cream-50 shadow-inner"
            : "border-burgundy-400 bg-burgundy-50 shadow-md hover:shadow-lg hover:border-burgundy-500"
        }`}
        style={{ perspective: "1000px" }}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[180px]">
          {!flipped ? (
            <>
              <p className="text-sm uppercase tracking-wide text-burgundy-500 mb-3">
                Tap to reveal
              </p>
              <p className="text-2xl font-bold text-burgundy-900 whitespace-pre-line">
                {exercise.front}
              </p>
              {exercise.hint && (
                <p className="mt-3 text-sm text-gray-400 italic">
                  Hint: {exercise.hint}
                </p>
              )}
            </>
          ) : (
            <p className="text-xl font-semibold text-burgundy-800 whitespace-pre-line leading-relaxed">
              {exercise.back}
            </p>
          )}
        </div>
      </div>

      {flipped && !rated && (
        <div className="flex gap-3">
          <button
            onClick={() => handleRating(false)}
            className="flex-1 rounded-xl border-2 border-red-300 bg-red-50 py-3 text-base font-semibold text-red-700 transition hover:bg-red-100"
          >
            Still Learning
          </button>
          <button
            onClick={() => handleRating(true)}
            className="flex-1 rounded-xl border-2 border-green-400 bg-green-50 py-3 text-base font-semibold text-green-700 transition hover:bg-green-100"
          >
            Got It!
          </button>
        </div>
      )}

      {rated && (
        <div className="rounded-xl bg-burgundy-50 border border-burgundy-200 p-4 text-sm text-burgundy-800 text-center font-medium">
          Card reviewed — moving on!
        </div>
      )}
    </div>
  );
}
