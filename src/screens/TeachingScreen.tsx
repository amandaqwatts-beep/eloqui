import { useEffect, useState } from "react";
import type { Lesson } from "~/data/latinLessons";
import NavBar from "~/components/NavBar";
import TeachingStepCard from "~/components/TeachingStepCard";

interface Props {
  lesson: Lesson; // from ~/data/latinLessons
  // Display-only lesson number (= array index + 1); see LessonEngine.currentLessonNumber.
  lessonNumber: number;
  onComplete: () => void; // advance to lesson intro (legacy) / PHASE_TEACH_COMPLETE (four-phase)
  onSkip: () => void; // skip teaching, go to intro (legacy) / abandon run (four-phase)
  // Four-phase loop (STEP 3 — optional; absent → legacy behavior unchanged):
  /** Bounce re-teach: when the run returns memorized→taught, start here. */
  reviewMode?: boolean;
  /** teachingSteps[] index to re-present when reviewMode (pickReTeachStep; null → 0). */
  reTeachStepIndex?: number | null;
  /** Four-phase quit path (PHASE_RESET → menu) — shown instead of Skip while re-teaching. */
  onExit?: () => void;
}

type Phase = "teaching" | "check" | "review" | "success";

export default function TeachingScreen({
  lesson,
  lessonNumber,
  onComplete,
  onSkip,
  reviewMode = false,
  reTeachStepIndex = null,
  onExit,
}: Props) {
  const steps = lesson.teachingSteps ?? [];
  const questions = lesson.comprehensionCheck ?? [];

  // Bounce re-teach (design §1): re-present ONLY the mismatched teaching step
  // (reviewMode lands on the review phase at the reTeachStepIndex step), then
  // re-run the comprehension check before the loop re-enters memorized.
  const [phase, setPhase] = useState<Phase>(reviewMode ? "review" : "teaching");
  const [stepIdx, setStepIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [graded, setGraded] = useState(false);
  const [wrongIdxs, setWrongIdxs] = useState<number[]>([]);
  const [reviewStepIdx, setReviewStepIdx] = useState(
    reviewMode ? (reTeachStepIndex ?? 0) : 0,
  );

  // Safety net: lessons without teaching content have nothing to show —
  // complete immediately (no render loop).
  useEffect(() => {
    if (steps.length === 0 || questions.length === 0) onComplete();
  }, [steps.length, questions.length, onComplete]);

  /** Map a comprehension question to the teaching step it most likely tests. */
  const stepForQuestion = (qi: number): number => {
    if (steps.length <= 1) return 0;
    return Math.min(
      steps.length - 1,
      Math.floor((qi / questions.length) * steps.length),
    );
  };

  const handleTeachingNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
    else setPhase("check");
  };

  const handleAnswer = (idx: number) => {
    if (graded) return;
    setSelectedIdx(idx);
    setGraded(true);
    if (idx !== questions[qIdx].correctIndex) {
      setWrongIdxs((prev) => [...prev, qIdx]);
    }
  };

  const handleCheckNext = () => {
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
      setSelectedIdx(null);
      setGraded(false);
    } else if (wrongIdxs.length > 0) {
      setReviewStepIdx(stepForQuestion(wrongIdxs[0]));
      setPhase("review");
    } else {
      setPhase("success");
    }
  };

  const handleReviewContinue = () => {
    setQIdx(0);
    setSelectedIdx(null);
    setGraded(false);
    setWrongIdxs([]);
    setPhase("check");
  };

  const skipLink = (
    <button
      onClick={onSkip}
      className="mt-3 block w-full py-2 text-center text-sm font-semibold text-wood-800 transition hover:text-burgundy-700"
    >
      Skip teaching
    </button>
  );

  // In a bounce re-teach, "Skip" is replaced by an explicit Exit-to-Menu
  // (PHASE_RESET) — abandoning the re-teach abandons the whole four-phase run.
  const exitLink =
    reviewMode && onExit ? (
      <button
        onClick={onExit}
        className="mt-3 block w-full py-2 text-center text-sm font-semibold text-wood-800 transition hover:text-burgundy-700"
      >
        Exit to Menu
      </button>
    ) : null;

  const footerExit = reviewMode && onExit ? exitLink : skipLink;

  // ── Phase 1: teaching steps ──────────────────────────────────────────
  if (phase === "teaching") {
    return (
      <div className="min-h-dvh flex flex-col">
        <NavBar />
        <main className="paper-desk flex-1 px-4 py-6 sm:py-10">
          <div className="mx-auto w-full max-w-2xl">
            <span className="mb-3 inline-block rounded-full bg-burgundy-100 px-3 py-1 text-xs font-medium text-burgundy-700">
              Lesson {lessonNumber} · Teaching
            </span>
            <div className="paper-rule mb-3" />
            <TeachingStepCard
              step={steps[stepIdx]}
              index={stepIdx + 1}
              total={steps.length}
            />
            <div className="mt-6">
              <button
                onClick={handleTeachingNext}
                className="w-full rounded-xl bg-burgundy-700 py-3.5 text-lg font-bold text-cream-50 shadow-lg transition hover:bg-burgundy-800 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2"
              >
                {stepIdx < steps.length - 1
                  ? "Next"
                  : "Check Understanding →"}
              </button>
              {footerExit}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Phase 2: comprehension check ─────────────────────────────────────
  if (phase === "check") {
    const q = questions[qIdx];
    const correct = selectedIdx === q.correctIndex;
    return (
      <div className="min-h-dvh flex flex-col">
        <NavBar />
        <main className="paper-desk flex-1 px-4 py-6 sm:py-10">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="inline-block rounded-full bg-burgundy-100 px-3 py-1 text-xs font-medium text-burgundy-700">
                Lesson {lessonNumber} · Understanding Check
              </span>
              <span className="text-sm font-semibold text-burgundy-700">
                Question {qIdx + 1} of {questions.length}
              </span>
            </div>
            <div className="paper-page pt-6 pr-6 pb-6 pl-8 sm:pt-8 sm:pr-8 sm:pb-8 sm:pl-10">
              <p className="text-lg font-medium leading-relaxed text-burgundy-900">
                {q.question}
              </p>
              <div className="mt-5 space-y-2.5">
                {q.options.map((opt, idx) => {
                  let btnClass =
                    "w-full text-left rounded-xl border-2 px-4 py-3 font-medium transition-all duration-200 ";
                  if (!graded) {
                    if (selectedIdx === idx) {
                      btnClass +=
                        "border-burgundy-500 bg-burgundy-50 text-burgundy-900 shadow-sm";
                    } else {
                      btnClass +=
                        "border-gray-200 bg-white text-gray-700 hover:border-burgundy-300 hover:bg-cream-50 cursor-pointer";
                    }
                  } else {
                    if (idx === q.correctIndex) {
                      btnClass += "border-green-500 bg-green-50 text-green-800";
                    } else if (selectedIdx === idx) {
                      btnClass += "border-red-400 bg-red-50 text-red-700";
                    } else {
                      btnClass += "border-gray-200 bg-white text-gray-400";
                    }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={graded}
                      className={btnClass}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
              {graded && (
                <>
                  <div
                    className={`mt-5 rounded-xl border p-4 text-sm font-medium leading-relaxed ${
                      correct
                        ? "border-green-300 bg-green-50 text-green-800"
                        : "border-red-300 bg-red-50 text-red-700"
                    }`}
                  >
                    {correct ? "✅ Correct! " : "❌ Not quite. "}
                    {q.explanation}
                  </div>
                  <button
                    onClick={handleCheckNext}
                    className="mt-4 w-full rounded-xl bg-burgundy-700 py-3 text-base font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
                  >
                    {qIdx < questions.length - 1
                      ? "Next Question"
                      : wrongIdxs.length > 0
                        ? "Finish — Review Needed"
                        : "Finish"}
                  </button>
                </>
              )}
            </div>
            {footerExit}
          </div>
        </main>
      </div>
    );
  }

  // ── Review phase: re-teach the concept behind a missed question ──────
  if (phase === "review") {
    return (
      <div className="min-h-dvh flex flex-col">
        <NavBar />
        <main className="paper-desk flex-1 px-4 py-6 sm:py-10">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-4 text-center">
              <h1 className="text-2xl font-black text-burgundy-900">
                Let's review that concept
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                One more look at the idea behind that question — then we'll try
                the check again.
              </p>
            </div>
            <TeachingStepCard
              step={steps[reviewStepIdx]}
              index={reviewStepIdx + 1}
              total={steps.length}
            />
            <div className="mt-6">
              <button
                onClick={handleReviewContinue}
                className="w-full rounded-xl bg-burgundy-700 py-3.5 text-lg font-bold text-cream-50 shadow-lg transition hover:bg-burgundy-800 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2"
              >
                Continue to Understanding Check →
              </button>
              {footerExit}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <main className="paper-desk flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="paper-page mx-auto w-full max-w-xl p-7 text-center sm:p-10">
          <div className="text-5xl">🎉</div>
          <h1 className="paper-title mt-3 text-2xl sm:text-3xl">
            You're ready!
          </h1>
          <p className="mt-2 text-gray-600">
            You've got the key ideas from this lesson — time to put them into
            practice.
          </p>
          <button
            onClick={onComplete}
            className="mt-8 w-full rounded-xl bg-burgundy-700 py-3.5 text-lg font-bold text-cream-50 shadow-lg transition hover:bg-burgundy-800 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2"
          >
            Continue to Lesson →
          </button>
        </div>
      </main>
    </div>
  );
}
