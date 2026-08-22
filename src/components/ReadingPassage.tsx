import { useState } from "react";
import type {
  ReadingPassageExercise,
  ReadingPassageQuestion,
} from "~/data/latinLessons";
import type { PronMode } from "~/lib/pronunciation";
import { SPEECH_DEFAULT_RATE, SPEECH_CLASSICAL_RATE } from "~/data/settings";
import MultipleChoice from "~/components/MultipleChoice";
import FillInBlank from "~/components/FillInBlank";
import { speakSequentially } from "~/engine/speech";
import { splitSentences, chunkTextForSpeech } from "~/engine/speechChunks";

// Re-exported for recitation.ts (imports splitSentences from components/ReadingPassage);
// the definition now lives in the shared engine module.
export { splitSentences };

interface Props {
  exercise: ReadingPassageExercise;
  pronMode: PronMode;
  onComplete: (correct: boolean) => void;
  /** Optional TTS rate override; defaults to the pronunciation-mode rate. */
  rate?: number;
}

export default function ReadingPassage({ exercise, pronMode, onComplete, rate }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>(() =>
    exercise.questions.map(() => null),
  );
  const [showTranslation, setShowTranslation] = useState(false);

  const total = exercise.questions.length;
  const finished = qIdx >= total;
  const answered = results[qIdx] !== null;
  const threshold = exercise.passThreshold ?? 1;
  const correctCount = results.filter(Boolean).length;
  const passed = correctCount / total >= threshold;

  const recordResult = (correct: boolean) => {
    setResults((prev) => {
      const next = [...prev];
      next[qIdx] = correct;
      return next;
    });
  };

  const advance = () => {
    if (qIdx + 1 < total) setQIdx(qIdx + 1);
    else setQIdx(total); // show wrap-up
  };

  return (
    <div className="space-y-5">
      {/* ── Passage panel ─────────────────────────────────────── */}
      <div className="paper-page pt-6 pr-6 pb-6 pl-8 sm:pt-8 sm:pr-8 sm:pb-8 sm:pl-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg font-bold text-burgundy-900">
              {exercise.title}
            </h3>
            {exercise.source && (
              <p className="text-xs text-gray-500 mt-0.5">
                Source: {exercise.source}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              // Chunked read-aloud (voice-tts P3/G6): break the passage into
              // sentence/line-bounded chunks and queue them end-to-end so it
              // flows as one reading instead of one (possibly truncated) long
              // utterance — still through the mode's voice ladder.
              speakSequentially(chunkTextForSpeech(exercise.passage), {
                language: "latin",
                mode: pronMode,
                rate: rate ?? (pronMode === "classical" ? SPEECH_CLASSICAL_RATE : SPEECH_DEFAULT_RATE),
              })
            }
            aria-label="Hear the passage read aloud"
            title="Read passage aloud"
            className="shrink-0 rounded-lg border border-burgundy-300 bg-white px-3 py-1.5 text-sm text-burgundy-700 hover:bg-burgundy-50 transition"
          >
            🔊 Read aloud
          </button>
        </div>

        <div className="space-y-1.5">
          {(exercise.passageLines ?? splitSentences(exercise.passage)).map(
            (line, i) => (
              <p
                key={i}
                className="paper-reading text-lg font-medium text-burgundy-900"
              >
                {line}
              </p>
            ),
          )}
        </div>

        {exercise.glosses && exercise.glosses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {exercise.glosses.map((g) => (
              <span
                key={g.latin}
                className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-sm text-gray-700"
              >
                <em className="font-medium">{g.latin}</em> — {g.english}
              </span>
            ))}
          </div>
        )}

        {exercise.translation && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowTranslation((v) => !v)}
              className="text-sm font-medium text-burgundy-600 hover:text-burgundy-800 transition"
            >
              {showTranslation ? "▲ Hide translation" : "▼ Show translation"}
            </button>
            {showTranslation && (
              <p className="mt-2 rounded-lg border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-700">
                {exercise.translation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Questions (one at a time) ──────────────────────────── */}
      {!finished && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-500">
            Question {qIdx + 1} of {total}
          </p>

          {exercise.questions[qIdx].type === "multiple-choice" ? (
            <MultipleChoice
              key={exercise.questions[qIdx].id}
              exercise={exercise.questions[qIdx]}
              onComplete={recordResult}
            />
          ) : (
            <FillInBlank
              key={exercise.questions[qIdx].id}
              exercise={exercise.questions[qIdx]}
              onComplete={recordResult}
            />
          )}

          {answered && (
            <button
              type="button"
              onClick={advance}
              className="w-full rounded-xl bg-burgundy-700 py-3 text-base font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
            >
              {qIdx + 1 < total ? "Next Question →" : "See Results →"}
            </button>
          )}
        </div>
      )}

      {/* ── Wrap-up ────────────────────────────────────────────── */}
      {finished && (
        <div className="space-y-4">
          <div
            className={`rounded-xl p-4 text-sm font-medium leading-relaxed ${
              passed
                ? "bg-green-50 border border-green-300 text-green-800"
                : "bg-red-50 border border-red-300 text-red-700"
            }`}
          >
            {passed
              ? `🎉 Passage complete — ${correctCount} of ${total} correct.`
              : `Keep going — ${correctCount} of ${total} correct. You need ${
                  Math.ceil(threshold * total)
                } to pass.`}
          </div>

          <div className="space-y-2">
            {exercise.questions.map((q: ReadingPassageQuestion, i: number) => (
              <div
                key={q.id}
                className={`rounded-xl border p-3 text-sm ${
                  results[i]
                    ? "border-green-200 bg-green-50/60"
                    : "border-red-200 bg-red-50/60"
                }`}
              >
                <p className="font-medium text-gray-800">
                  {results[i] ? "✅" : "❌"} {q.prompt}
                </p>
                {q.explanation && (
                  <p className="mt-1 text-gray-600 leading-relaxed">
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onComplete(passed)}
            className="w-full rounded-xl bg-burgundy-700 py-3 text-base font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  );
}
