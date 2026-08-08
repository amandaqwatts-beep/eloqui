import { useState } from "react";
import { saveFeedback } from "~/lib/feedbackStore";

interface LessonCompleteProps {
  lessonNumber: number;
  totalLessons: number;
  correct: number;
  total: number;
  onNext: () => void;
  onRestart: () => void;
  isLastLesson: boolean;
  onDrill?: () => void;
}

function StarRating({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const displayed = hovered || rating;

  return (
    <div
      className="inline-flex gap-1.5"
      onMouseLeave={() => setHovered(0)}
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="p-1 -m-1 rounded transition-colors hover:bg-gold-100/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-400"
        >
          <svg
            className={`h-8 w-8 sm:h-9 sm:w-9 transition-all duration-150 ${
              star <= displayed
                ? "text-gold-400 drop-shadow-sm"
                : "text-gray-300"
            } ${star <= hovered && hovered > 0 ? "scale-110" : ""}`}
            viewBox="0 0 24 24"
            fill={star <= displayed ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={star <= displayed ? 0 : 1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

type FeedbackState = "idle" | "submitted" | "error";

export default function LessonComplete({
  lessonNumber,
  totalLessons,
  correct,
  total,
  onNext,
  onRestart,
  isLastLesson,
  onDrill,
}: LessonCompleteProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  let emoji: string;
  let message: string;
  let subMessage: string;

  if (pct === 100) {
    emoji = "🏆";
    message = "Perfect Score!";
    subMessage = "You got every exercise right — outstanding work!";
  } else if (pct >= 80) {
    emoji = "🌟";
    message = "Great Job!";
    subMessage = "You're really getting the hang of this. Keep it up!";
  } else if (pct >= 60) {
    emoji = "👍";
    message = "Good Effort!";
    subMessage =
      "Solid progress. Review the tricky parts and you'll master it in no time.";
  } else {
    emoji = "📖";
    message = "Keep Practicing!";
    subMessage =
      "Latin takes time. Try the lesson again — you'll improve!";
  }

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackState, setFeedbackState] = useState<FeedbackState>("idle");

  const handleSubmitFeedback = () => {
    if (feedbackRating === 0) return;
    try {
      saveFeedback(lessonNumber, feedbackRating, feedbackComment || undefined);
      setFeedbackState("submitted");
    } catch {
      setFeedbackState("error");
    }
  };

  return (
    <div className="flex flex-col items-center text-center space-y-5 py-6 px-4">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-100 text-5xl shadow-inner">
        {emoji}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-extrabold text-burgundy-900">
        Lesson {lessonNumber} Complete!
      </h2>

      {/* Score */}
      <div className="space-y-1">
        <p className="text-4xl font-black text-burgundy-700">
          {correct}/{total}
        </p>
        <p className="text-sm font-medium text-gray-500">
          {pct}% correct — {message}
        </p>
      </div>

      {/* Sub-message */}
      <p className="max-w-sm text-sm leading-relaxed text-gray-600">
        {subMessage}
      </p>

      {/* Compact progress indicator (the bar scales to any number of lessons) */}
      <div
        className="w-full max-w-sm space-y-2"
        aria-label={`Lesson ${lessonNumber} of ${totalLessons} complete`}
      >
        <div
          className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalLessons}
          aria-valuenow={lessonNumber}
          aria-label={`${lessonNumber} of ${totalLessons} lessons complete`}
        >
          <div
            className="h-full rounded-full bg-burgundy-600 transition-all duration-500"
            style={{
              width: `${totalLessons > 0 ? Math.min(100, Math.max(0, (lessonNumber / totalLessons) * 100)) : 0}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-400">
          Lesson {lessonNumber} of {totalLessons}
        </p>
      </div>

      {/* Feedback card */}
      <div className="w-full max-w-sm border border-burgundy-200 rounded-2xl bg-cream-50 p-5 space-y-3 mt-2">
        {feedbackState === "submitted" ? (
          <div className="py-3 text-center">
            <p className="text-burgundy-700 font-semibold text-base">
              Thanks for your feedback!
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Your input helps us make Verbum better.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-base font-semibold text-burgundy-800">
              How was this lesson?
            </h3>

            <StarRating rating={feedbackRating} onChange={setFeedbackRating} />

            <div>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="What worked? What was confusing?"
                rows={3}
                className="w-full rounded-xl border border-burgundy-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 resize-none transition focus:outline-none focus:ring-2 focus:ring-burgundy-400 focus:border-transparent"
              />
            </div>

            {feedbackState === "error" && (
              <p className="text-sm text-red-600">
                Something went wrong. Please try again.
              </p>
            )}

            <button
              onClick={handleSubmitFeedback}
              disabled={feedbackRating === 0}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-1 ${
                feedbackRating === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-burgundy-700 text-cream-50 hover:bg-burgundy-800 shadow-sm"
              }`}
            >
              Submit Feedback
            </button>
          </>
        )}
      </div>

      {onDrill && (
        <button
          onClick={onDrill}
          className="w-full max-w-sm rounded-xl bg-gold-400 py-3 text-base font-black text-burgundy-950 shadow transition hover:bg-gold-300"
        >
          🗡️ Practice with Drill Mode
        </button>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
        <button
          onClick={onRestart}
          className="flex-1 rounded-xl border-2 border-gray-300 bg-white py-3 text-base font-semibold text-gray-600 transition hover:border-burgundy-300 hover:text-burgundy-700"
        >
          Retry Lesson
        </button>
        {!isLastLesson ? (
          <button
            onClick={onNext}
            className="flex-1 rounded-xl bg-burgundy-700 py-3 text-base font-semibold text-cream-50 shadow transition hover:bg-burgundy-800 flex items-center justify-center gap-2"
          >
            Next Lesson
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl bg-gold-500 py-3 text-base font-semibold text-burgundy-950 shadow transition hover:bg-gold-400"
          >
            🎉 You finished Latin 101!
          </button>
        )}
      </div>

      {isLastLesson && (
        <p className="text-xs text-gray-400 max-w-xs">
          {`Congratulations! You've completed all ${totalLessons} Latin 101 lessons.`}{" "}
          Try them again to solidify your skills — Hebrew and Greek are coming
          soon!
        </p>
      )}
    </div>
  );
}
