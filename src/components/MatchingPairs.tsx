import { useState, useMemo } from "react";
import type { MatchingExercise } from "~/data/latinLessons";
import { getPronunciation, type PronMode } from "~/lib/pronunciation";

interface Props {
  exercise: MatchingExercise;
  onComplete: (correct: boolean) => void;
  pronMode?: PronMode;
}

export default function MatchingPairs({ exercise, onComplete, pronMode = "ecclesiastical" }: Props) {
  const pairs = exercise.pairs;

  // Shuffle right column on mount
  const shuffledRight = useMemo(() => {
    const arr = pairs.map((p, i) => ({ text: p.right, originalIndex: i }));
    // Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [pairs]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<{ left: number; right: number }[]>([]);
  const [wrongFlash, setWrongFlash] = useState<{
    left: number;
    right: number;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);

  const isMatchedLeft = (idx: number) =>
    matches.some((m) => m.left === idx);
  const isMatchedRight = (idx: number) =>
    matches.some((m) => m.right === idx);

  const handleLeftClick = (idx: number) => {
    if (submitted || isMatchedLeft(idx)) return;
    setWrongFlash(null);
    setSelectedLeft(idx);

    if (selectedRight !== null) {
      // Check match: does the selected right's original index match the left index?
      const rightOrigIdx = shuffledRight[selectedRight].originalIndex;
      if (rightOrigIdx === idx) {
        setMatches((prev) => [
          ...prev,
          { left: idx, right: selectedRight },
        ]);
        setSelectedLeft(null);
        setSelectedRight(null);

        // Check if all matched
        const newMatches = [...matches, { left: idx, right: selectedRight }];
        if (newMatches.length === pairs.length) {
          setAllCorrect(true);
          setSubmitted(true);
          onComplete(true);
        }
      } else {
        setWrongFlash({ left: idx, right: selectedRight });
        setTimeout(() => setWrongFlash(null), 600);
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const handleRightClick = (idx: number) => {
    if (submitted || isMatchedRight(idx)) return;
    setWrongFlash(null);
    setSelectedRight(idx);

    if (selectedLeft !== null) {
      const leftIdx = selectedLeft;
      const rightOrigIdx = shuffledRight[idx].originalIndex;
      if (rightOrigIdx === leftIdx) {
        setMatches((prev) => [...prev, { left: leftIdx, right: idx }]);
        setSelectedLeft(null);
        setSelectedRight(null);

        const newMatches = [...matches, { left: leftIdx, right: idx }];
        if (newMatches.length === pairs.length) {
          setAllCorrect(true);
          setSubmitted(true);
          onComplete(true);
        }
      } else {
        setWrongFlash({ left: leftIdx, right: idx });
        setTimeout(() => setWrongFlash(null), 600);
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const handleGiveUp = () => {
    // Match all remaining
    const remaining: { left: number; right: number }[] = [];
    pairs.forEach((_, i) => {
      if (!isMatchedLeft(i)) {
        const rightIdx = shuffledRight.findIndex(
          (r) => r.originalIndex === i,
        );
        if (rightIdx !== -1) remaining.push({ left: i, right: rightIdx });
      }
    });
    setMatches((prev) => [...prev, ...remaining]);
    setSubmitted(true);
    setAllCorrect(false);
    onComplete(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-burgundy-900 leading-relaxed">
        {exercise.prompt}
      </p>
      <p className="text-xs text-gray-500">
        Tap a word on the left, then tap its match on the right.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {exercise.leftLabel && (
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              {exercise.leftLabel}
            </div>
          )}
          {pairs.map((pair, idx) => {
            const matched = isMatchedLeft(idx);
            const isSelected = selectedLeft === idx;
            const isWrong =
              wrongFlash?.left === idx;

            let cls =
              "w-full text-left px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150 ";
            if (matched) {
              cls += "border-green-400 bg-green-50 text-green-800 cursor-default";
            } else if (isWrong) {
              cls += "border-red-400 bg-red-100 text-red-700";
            } else if (isSelected) {
              cls += "border-burgundy-500 bg-burgundy-50 text-burgundy-900 shadow-sm";
            } else {
              cls +=
                "bg-cream-50 border-wood-200 text-wood-900 hover:bg-cream-100 hover:border-wood-300 cursor-pointer";
            }

            return (
              <button
                key={idx}
                className={cls}
                onClick={() => handleLeftClick(idx)}
                disabled={matched || submitted}
              >
                {pair.left}
                <span className="block text-xs italic text-gray-400 mt-0.5">
                  {pair.pronunciation ?? getPronunciation(pair.left, pronMode)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {exercise.rightLabel && (
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              {exercise.rightLabel}
            </div>
          )}
          {shuffledRight.map((item, idx) => {
            const matched = isMatchedRight(idx);
            const isSelected = selectedRight === idx;
            const isWrong = wrongFlash?.right === idx;

            let cls =
              "w-full text-left px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150 ";
            if (matched) {
              cls += "border-green-400 bg-green-50 text-green-800 cursor-default";
            } else if (isWrong) {
              cls += "border-red-400 bg-red-100 text-red-700";
            } else if (isSelected) {
              cls += "border-burgundy-500 bg-burgundy-50 text-burgundy-900 shadow-sm";
            } else {
              cls +=
                "bg-cream-50 border-wood-200 text-wood-900 hover:bg-cream-100 hover:border-wood-300 cursor-pointer";
            }

            return (
              <button
                key={idx}
                className={cls}
                onClick={() => handleRightClick(idx)}
                disabled={matched || submitted}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {matches.length > 0 && matches.length < pairs.length && !submitted && (
        <button
          onClick={handleGiveUp}
          className="w-full rounded-xl border-2 border-wood-300 bg-cream-50 py-2.5 text-sm font-medium text-wood-800 transition hover:border-red-300 hover:text-red-600"
        >
          Skip (show answers)
        </button>
      )}

      {submitted && (
        <div
          className={`rounded-xl p-4 text-sm font-medium leading-relaxed ${
            allCorrect
              ? "bg-green-50 border border-green-300 text-green-800"
              : "bg-amber-50 border border-amber-300 text-amber-800"
          }`}
        >
          {allCorrect
            ? "✅ Perfect! All pairs matched correctly."
            : "⚠️ Matches revealed. Review them above — you'll get it next time!"}
        </div>
      )}
    </div>
  );
}
