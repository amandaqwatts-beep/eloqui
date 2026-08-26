/**
 * PhaseDrillScreen.tsx — Screens department: the four-phase drill loop.
 *
 * Renders the three generative drill phases — "memorized" (template drills),
 * "quizzed" (translation sentences) and "incorporated" (CompoundFrame passages)
 * — driven by the step-1 generative engine (generateForPhase via
 * engine/fourPhase; STEP 4 re-enabled the quizzed/incorporated generators over
 * the learned universe). Production/wiring only.
 *
 * It pulls a seeded exercise batch from the step-1 generative engine
 * (generateForPhase via engine/fourPhase), scores each attempt with the
 * existing answer-checker components (MultipleChoice / FillInBlank /
 * MatchingPairs — reused unchanged), and on every submit dispatches a phase
 * attempt (onAttempt → PHASE_ATTEMPT). Wrong answers map back to the most
 * plausible teaching step so that a memorized→taught bounce knows which step
 * to re-present first (pickReTeachStep). The in-window accuracy is shown so
 * the loop reads as intentional rather than infinite.
 */
import { useCallback, useRef, useState } from "react";
import type { Lesson } from "~/data/latinLessons";
import type { FourPhaseRun } from "~/engine/types";
import {
  generateForPhase,
  passingConceptsFor,
  pickReTeachStep,
  windowAccuracy,
} from "~/engine/fourPhase";
import type { GeneratedExercise } from "~/engine/fallbackGenerator";
import MultipleChoice from "~/components/MultipleChoice";
import FillInBlank from "~/components/FillInBlank";
import MatchingPairs from "~/components/MatchingPairs";
import NavBar from "~/components/NavBar";
import type { PronMode } from "~/lib/pronunciation";
import {
  batchSeedFor,
  mapExerciseToStep,
  phaseDisplayTitle,
} from "~/screens/phaseDrillUtil";

const BATCH_SIZE = 8;

export type DrillPhase = "memorized" | "quizzed" | "incorporated";

interface Props {
  phase: DrillPhase;
  lesson: Lesson;
  run: FourPhaseRun;
  pronMode: PronMode;
  distractorLessons?: Lesson[];
  /**
   * → lesson.recordPhaseAttempt (dispatch PHASE_ATTEMPT + persist).
   * reTeachStepIndex: the step to re-present on a memorized→taught bounce.
   * passingConcepts: grammarIndex topic ids the (incorporated) passage
   * required — reported on a CORRECT attempt so the engine marks them
   * incorporated (STEP 4). Undefined for memorized/quizzed or wrong answers.
   */
  onAttempt: (
    correct: boolean,
    reTeachStepIndex?: number | null,
    passingConcepts?: string[],
  ) => void;
  /** → lesson.resetPhase — abandon the run and return to the menu. */
  onQuit: () => void;
}

function buildBatch(
  run: FourPhaseRun,
  lesson: Lesson,
  seed: string,
  distractorLessons?: Lesson[],
): GeneratedExercise[] {
  try {
    return generateForPhase({ ...run, seed }, lesson, {
      count: BATCH_SIZE,
      distractorLessons,
      // STEP 4: the engine builds the learned universe from the full course
      // array (completed lessons + this in-flight lesson) so quizzed emits
      // real translation sentences and incorporated emits CompoundFrame
      // passages instead of the memorized template fallback. The route passes
      // the full latinLessons array as distractorLessons today.
      allLessons: distractorLessons,
    });
  } catch {
    return [];
  }
}

export default function PhaseDrillScreen({
  phase,
  lesson,
  run,
  pronMode,
  distractorLessons,
  onAttempt,
  onQuit,
}: Props) {
  const steps = lesson.teachingSteps ?? [];
  const [batchNo, setBatchNo] = useState(0);
  const [exercises, setExercises] = useState<GeneratedExercise[]>(() =>
    buildBatch(run, lesson, batchSeedFor(run, 0), distractorLessons),
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  // Per-step wrong tally, kept in a ref so pickReTeachStep can be computed
  // synchronously with the attempt (not in async state). Reset per mount.
  const wrongCountsRef = useRef<number[]>(steps.map(() => 0));

  const title = phaseDisplayTitle(phase);
  const accuracy = windowAccuracy(run.phaseState.accuracyWindow);
  const attempts = run.phaseState.phases[phase]?.attempts ?? 0;

  const handleComplete = useCallback(
    (correct: boolean) => {
      let reTeachStepIndex: number | null | undefined;
      if (!correct && steps.length > 0 && exercises.length > 0) {
        const step = Math.min(
          mapExerciseToStep(exercises[currentIdx], steps),
          steps.length - 1,
        );
        wrongCountsRef.current[step] = (wrongCountsRef.current[step] ?? 0) + 1;
        reTeachStepIndex = pickReTeachStep(steps, wrongCountsRef.current);
      }
      // STEP 4: report the compound passage's required topics as passingConcepts
      // so a CORRECT incorporated attempt marks them incorporated (design §3).
      const passingConcepts =
        phase === "incorporated" && correct
          ? passingConceptsFor(exercises[currentIdx])
          : undefined;
      onAttempt(correct, reTeachStepIndex, passingConcepts);

      const next = currentIdx + 1;
      if (next >= exercises.length) {
        const nBatch = batchNo + 1;
        setBatchNo(nBatch);
        // Re-seed a fresh batch (same run seed, next batch index).
        setExercises(
          buildBatch(run, lesson, batchSeedFor(run, nBatch), distractorLessons),
        );
        setCurrentIdx(0);
      } else {
        setCurrentIdx(next);
      }
    },
    [
      steps,
      exercises,
      currentIdx,
      batchNo,
      run,
      lesson,
      phase,
      distractorLessons,
      onAttempt,
    ],
  );

  const ex = exercises[currentIdx];
  const pct = Math.round(accuracy * 100);

  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <main className="paper-desk flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl">
          {/* Header */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-block rounded-full bg-burgundy-100 px-3 py-1 text-xs font-medium text-burgundy-700">
              Lesson {lesson.id} · {title}
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span
                className={`rounded-full px-3 py-1 ${
                  accuracy >= 0.8
                    ? "bg-green-100 text-green-700"
                    : "bg-gold-100 text-gold-800"
                }`}
              >
                In-loop accuracy: {pct}%
              </span>
              <span className="rounded-full bg-cream-50 px-3 py-1 text-wood-700">
                {attempts} answered · hit 80% to advance
              </span>
            </div>
          </div>
          <div className="paper-rule mb-3" />

          {/* Progress within the batch */}
          <div className="mb-4">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-burgundy-600 transition-all duration-300"
                style={{
                  width: `${exercises.length > 0 ? (Math.min(currentIdx, exercises.length - 1) / exercises.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-gray-500">
              {exercises.length > 0
                ? `drill ${currentIdx + 1} of ${exercises.length}`
                : "generating…"}
            </p>
          </div>

          {/* Exercise (reuse the shared answer-checker components) */}
          {ex ? (
            <div className="paper-page pt-6 pr-6 pb-6 pl-8 sm:pt-8 sm:pr-8 sm:pb-8 sm:pl-10">
              {ex.type === "multiple-choice" && (
                <MultipleChoice
                  exercise={ex as never}
                  onComplete={handleComplete}
                />
              )}
              {ex.type === "fill-in-blank" && (
                <FillInBlank
                  exercise={ex as never}
                  onComplete={handleComplete}
                />
              )}
              {ex.type === "matching" && (
                <MatchingPairs
                  exercise={ex as never}
                  onComplete={handleComplete}
                  pronMode={pronMode}
                />
              )}
              <button
                onClick={onQuit}
                className="mt-4 block w-full py-2 text-center text-sm font-semibold text-wood-800 transition hover:text-burgundy-700"
              >
                Exit to Lessons
              </button>
            </div>
          ) : (
            <div className="paper-page p-8 text-center text-gray-500">
              Nothing to drill yet for this lesson.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
