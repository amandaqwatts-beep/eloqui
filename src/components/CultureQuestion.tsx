import { useState } from "react";
import type { CultureQuestionExercise } from "~/data/latinLessons";
import type { ExerciseResultDetail } from "~/engine/types";
import { CULTURE_TEACHING } from "~/data/cultureTeaching";
import TeachingStepCard from "~/components/TeachingStepCard";

const DOMAIN_LABELS: Record<CultureQuestionExercise["domain"], string> = {
  history: "History",
  customs: "Customs",
  context: "Context",
};

interface Props {
  exercise: CultureQuestionExercise;
  onComplete: (correct: boolean) => void;
  /**
   * Optional additive detail hook (diagnostics): forwards the selected option
   * and the canonical answer so the route can record wrong/expected.
   */
  onResult?: (detail: ExerciseResultDetail) => void;
}

/**
 * Culture Corner — teach → check → quiz phase machine (culture-teaching PR2).
 *
 * If the exercise id has a bundle in CULTURE_TEACHING, the student is TAUGHT
 * first (1–3 TeachingStep cards, same card UI as the lesson Teach phase),
 * optionally given one advisory comprehension check, and only then asked the
 * existing fact-checked question. This is enrichment, never assessment: the
 * quiz is never locked ("Skip teaching" and "Continue to the question" always
 * reach it), and teach/check phases are stateless and silent — onComplete /
 * onResult fire ONLY on quiz submit, so scoring, diagnostics, and lesson
 * completion are byte-identical to the pre-rework quiz-only behavior.
 * A question without a bundle (future data, interim state) renders quiz-only.
 */
export default function CultureQuestion({ exercise, onComplete, onResult }: Props) {
  const bundle = CULTURE_TEACHING[exercise.id];
  const steps = bundle?.steps ?? [];
  const check = bundle?.check;
  const hasTeaching = steps.length > 0;

  const [phase, setPhase] = useState<"teach" | "check" | "quiz">(
    hasTeaching ? "teach" : "quiz",
  );
  const [stepIdx, setStepIdx] = useState(0);

  // check phase (advisory — wrong answers re-teach on request, never trap)
  const [checkSelected, setCheckSelected] = useState<number | null>(null);
  const [checkGraded, setCheckGraded] = useState(false);

  // quiz phase
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === exercise.correctIndex;

  const goToQuiz = () => setPhase("quiz");
  const goToTeach = () => {
    setStepIdx(0);
    setPhase("teach");
  };

  const handleTeachNext = () => {
    if (stepIdx < steps.length - 1) {
      setStepIdx(stepIdx + 1);
    } else if (check) {
      setCheckSelected(null);
      setCheckGraded(false);
      setPhase("check");
    } else {
      goToQuiz();
    }
  };

  const handleCheckAnswer = (idx: number) => {
    if (checkGraded) return;
    setCheckSelected(idx);
    setCheckGraded(true);
  };

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

  const banner = (chip: string) => (
    <div className="flex items-center justify-between rounded-xl border border-gold-200 bg-gold-50 p-3">
      <span className="font-semibold text-burgundy-900">🏛️ Culture Corner</span>
      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-800">
        {chip}
      </span>
    </div>
  );

  const skipTeaching = (
    <button
      onClick={goToQuiz}
      className="mt-3 block w-full py-2 text-center text-sm font-semibold text-gray-400 transition hover:text-burgundy-600"
    >
      Skip teaching
    </button>
  );

  // ── Phase 1: teach — the bundle's cards (shared TeachingStepCard UI) ──────
  if (phase === "teach") {
    return (
      <div className="space-y-4">
        {banner("Learn")}
        <TeachingStepCard
          step={steps[stepIdx]}
          index={stepIdx + 1}
          total={steps.length}
        />
        {stepIdx === steps.length - 1 && bundle && bundle.sources.length > 0 && (
          <p className="text-xs text-gray-500">
            Fact check: {bundle.sources.join(" · ")}
          </p>
        )}
        <div>
          <button
            onClick={handleTeachNext}
            className="w-full rounded-xl bg-burgundy-700 py-3 text-base font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
          >
            {stepIdx < steps.length - 1
              ? "Next"
              : check
                ? "Check Understanding →"
                : "Continue to the Question →"}
          </button>
          {skipTeaching}
        </div>
      </div>
    );
  }

  // ── Phase 2 (optional): quick comprehension check — never blocks ──────────
  if (phase === "check") {
    const q = check!;
    const checkCorrect = checkSelected === q.correctIndex;
    return (
      <div className="space-y-4">
        {banner("Check")}
        <div className="rounded-3xl border border-burgundy-200 bg-white p-6 shadow-lg sm:p-8">
          <p className="text-lg font-medium leading-relaxed text-burgundy-900">
            {q.question}
          </p>
          <div className="mt-5 space-y-2.5">
            {q.options.map((opt, idx) => {
              let btnClass =
                "w-full text-left rounded-xl border-2 px-4 py-3 font-medium transition-all duration-200 ";
              if (!checkGraded) {
                if (checkSelected === idx) {
                  btnClass +=
                    "border-burgundy-500 bg-burgundy-50 text-burgundy-900 shadow-sm";
                } else {
                  btnClass +=
                    "border-gray-200 bg-white text-gray-700 hover:border-burgundy-300 hover:bg-cream-50 cursor-pointer";
                }
              } else {
                if (idx === q.correctIndex) {
                  btnClass += "border-green-500 bg-green-50 text-green-800";
                } else if (checkSelected === idx) {
                  btnClass += "border-red-400 bg-red-50 text-red-700";
                } else {
                  btnClass += "border-gray-200 bg-white text-gray-400";
                }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleCheckAnswer(idx)}
                  disabled={checkGraded}
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
          {checkGraded && (
            <div
              className={`mt-5 rounded-xl border p-4 text-sm font-medium leading-relaxed ${
                checkCorrect
                  ? "border-green-300 bg-green-50 text-green-800"
                  : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {checkCorrect ? "✅ Correct! " : "❌ Not quite. "}
              {q.explanation}
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={goToQuiz}
              className="w-full rounded-xl bg-burgundy-700 py-3 text-base font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
            >
              Continue to the question
            </button>
            {checkGraded && !checkCorrect && (
              <button
                onClick={goToTeach}
                className="mt-3 block w-full py-2 text-center text-sm font-semibold text-gray-400 transition hover:text-burgundy-600"
              >
                📖 Review the card
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 3: the existing fact-checked quiz — verbatim + review affordance ─
  return (
    <div className="space-y-4">
      {banner(DOMAIN_LABELS[exercise.domain])}

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
                "border-gray-200 bg-white text-gray-700 hover:border-burgundy-300 hover:bg-cream-50 cursor-pointer";
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
        <div>
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
          <p className="mt-2 text-xs text-gray-500">Fact check: {exercise.source}</p>
          {!isCorrect && (
            <button
              onClick={goToTeach}
              className="mt-3 block w-full py-2 text-center text-sm font-semibold text-gray-400 transition hover:text-burgundy-600"
            >
              📖 Review the culture card
            </button>
          )}
        </div>
      )}
    </div>
  );
}
