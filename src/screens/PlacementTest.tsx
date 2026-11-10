import type { MultipleChoiceExercise } from "~/data/latinLessons";
import ProgressBar from "~/components/ProgressBar";
import MultipleChoice from "~/components/MultipleChoice";
import WindowFrame from "~/components/WindowFrame";
import type { PlacementSearchEngine } from "~/engine/placementSearch";

interface Props {
  engine: PlacementSearchEngine;
  /** Unit wording (Latin units) vs Level wording (English levels). */
  unitBased?: boolean;
  introBlurb?: string;
  resultBlurb?: string;
  /** Bugfix batch 3 (FIX-B): 🪲 in the frame chrome — every WindowFrame this
   *  screen renders carries it; the route renders the one dialog. */
  onReportBug?: () => void;
}

const noun = (unitBased: boolean) => (unitBased ? "Unit" : "Level");

/**
 * Adaptive placement screen (FIX-2, owner directive 2026-11-07): binary
 * search over units with relatively hard probes — ⌈log₂ units⌉ questions
 * (4 for Latin 1's 14 units, ≤ 5 with the one optional boundary
 * confirmation). Result = the boundary unit = the KEY POINT TO REVIEW,
 * mapped to its starting lesson exactly as the linear test did. Track-agnostic:
 * the engine drives everything from the probe bank, so English levels and
 * future shelves inherit it unchanged.
 */
export default function PlacementTest({
  engine,
  unitBased = false,
  introBlurb,
  resultBlurb,
  onReportBug,
}: Props) {
  const N = noun(unitBased);
  const blurb =
    introBlurb ??
    `A few well-chosen questions — about ${engine.maxQuestions - 1} for ${engine.totalUnits} ${unitBased ? "units" : "levels"} — find your key point to review. Each question sits in the middle of what you haven't been asked yet, so answer honestly; hard questions are expected.`;

  // ── Idle: intro ────────────────────────────────────────────────────────
  if (engine.phase === "idle")
    return (
      <WindowFrame title="Placement" onBack={engine.quit} onReportBug={onReportBug}>
        <main className="flex flex-1 items-center px-4 py-8 sm:py-12">
          <div className="mx-auto w-full max-w-xl rounded-3xl border border-burgundy-200 bg-white p-7 text-center shadow-lg sm:p-10">
            <div className="text-5xl">📋</div>
            <h1 className="mt-4 text-3xl font-black text-burgundy-900">Placement Test</h1>
            <p className="mt-4 text-gray-600 leading-relaxed">{blurb}</p>
            <p className="mt-2 text-sm font-semibold text-gold-700">
              ~{engine.maxQuestions - 1} questions (at most {engine.maxQuestions})
            </p>
            <button
              onClick={engine.start}
              className="mt-8 w-full rounded-xl bg-burgundy-700 py-3.5 text-lg font-bold text-white shadow hover:bg-burgundy-800"
            >
              Start Test
            </button>
          </div>
        </main>
      </WindowFrame>
    );

  // ── Done: KEY POINT TO REVIEW ─────────────────────────────────────────
  if (engine.phase === "done") {
    const unit = Math.min(engine.resultUnit ?? 1, engine.totalUnits);
    const startLessonMapped = engine.allMastered ? null : unit;
    return (
      <WindowFrame title="Placement" onBack={engine.quit} onReportBug={onReportBug}>
        <main className="flex-1 px-4 py-8 sm:py-12">
          <div className="mx-auto w-full max-w-xl rounded-3xl border border-burgundy-200 bg-white p-6 shadow-lg sm:p-10">
            <div className="text-center">
              <div className="text-5xl">{engine.allMastered ? "🎉" : "🔑"}</div>
              <h1 className="mt-3 text-2xl font-black text-burgundy-900 sm:text-3xl">
                {engine.allMastered
                  ? `You've mastered all ${engine.totalUnits} ${unitBased ? "units" : "levels"}!`
                  : unitBased
                    ? `KEY POINT TO REVIEW — start your review at Unit ${unit}`
                    : `KEY POINT TO REVIEW — start your review at Level ${unit}`}
              </h1>
              <p className="mt-2 text-gray-600">
                {resultBlurb ??
                  `Everything before ${N} ${unit} held up under hard probing; ${N.toLowerCase()} ${unit} is where the search converged.`}
              </p>
            </div>
            <div className="mt-7 space-y-2">
              {engine.passed.map((ok, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                    ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
                  }`}
                >
                  <span className="font-semibold">
                    {N} {i + 1}
                  </span>
                  <span className="font-bold">{ok ? "✓ Passed" : "✕ Key point"}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 space-y-3">
              {engine.allMastered ? (
                <button
                  onClick={() => engine.chooseStart(engine.totalUnits)}
                  className="w-full rounded-xl bg-burgundy-700 py-3.5 font-bold text-white shadow hover:bg-burgundy-800"
                >
                  Keep the result
                </button>
              ) : (
                <button
                  onClick={() => engine.chooseStart(startLessonMapped ?? unit)}
                  className="w-full rounded-xl bg-burgundy-700 py-3.5 font-bold text-white shadow hover:bg-burgundy-800"
                >
                  {unitBased ? `Start from Unit ${unit}` : `Start from Level ${unit}`}
                </button>
              )}
              <button
                onClick={() => engine.chooseStart(1)}
                className="w-full rounded-xl border-2 border-burgundy-200 py-3.5 font-bold text-burgundy-700 hover:bg-burgundy-50"
              >
                {unitBased ? "Start from the beginning" : `Start from ${N} 1`}
              </button>
              <button
                onClick={engine.retake}
                className="w-full py-2 text-sm font-semibold text-gold-700 hover:text-burgundy-700"
              >
                Retake Test
              </button>
            </div>
          </div>
        </main>
      </WindowFrame>
    );
  }

  // ── Running / confirm: one probe at a time ────────────────────────────
  const q = engine.probe?.question as MultipleChoiceExercise | undefined;
  if (!q) return null;
  const isConfirm = engine.phase === "confirm";
  return (
    <WindowFrame title="Placement" onBack={engine.quit} onReportBug={onReportBug}>
      <main className="flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 flex items-center justify-between text-sm font-semibold text-burgundy-700">
            <span>
              Question {engine.questionNumber} of at most {engine.maxQuestions}
            </span>
            <button onClick={engine.quit} className="text-gray-400 hover:text-burgundy-600">
              Quit
            </button>
          </div>
          <ProgressBar current={engine.questionNumber - 1} total={engine.maxQuestions} />
          <div className="mt-8 rounded-3xl border border-burgundy-200 bg-white p-5 shadow-lg sm:p-8">
            <div className="mb-5 text-xs font-bold uppercase tracking-widest text-gold-700">
              {isConfirm
                ? `One more — checking ${N} ${engine.probe?.unit}`
                : `Probing ${N} ${engine.probe?.unit}`}
            </div>
            <MultipleChoice key={q.id} exercise={q} onComplete={isConfirm ? engine.confirm : engine.answer} />
          </div>
        </div>
      </main>
    </WindowFrame>
  );
}
