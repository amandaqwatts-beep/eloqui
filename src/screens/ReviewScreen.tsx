import { useState } from "react";
import type { Lesson } from "~/data/latinLessons";
import type { AccuracyEntry, ConfusionPair, WeakSpot } from "~/engine/types";
import {
  conceptGloss,
  lessonTitles,
  type DiagnosticsSummary,
} from "~/lib/diagnosticUi";
import WindowFrame from "~/components/WindowFrame";
import WeakSpotRow from "~/components/WeakSpotRow";
import ConfusionPairCard from "~/components/ConfusionPairCard";
import WeakSpotDetail from "~/components/WeakSpotDetail";
import DiagnosticsEmptyState from "~/components/DiagnosticsEmptyState";

/**
 * ReviewScreen — Review Weak Spots. Upgraded per UI-spec §7: two diagnostics
 * sections (confusion pairs + weak words) render above the existing
 * lesson-weak-spot cards, which are untouched (Practice → AI preserved).
 * `selectedSpot` opens the WeakSpotDetail overlay; its drill actions return
 * here via the route.
 */
interface Props {
  accuracy: AccuracyEntry[];
  lessons: Lesson[];
  onBack: () => void;
  onPracticeLesson: (lessonId: number) => void;
  summary?: DiagnosticsSummary;
  onDrillWord?: (conceptId: string) => void;
  onDrillPair?: (pair: ConfusionPair) => void;
  onOpenLesson?: (lessonId: number) => void;
  /** Beta bug-report affordance (PR #78 pattern) — optional; the route renders the one BugReportDialog. */
  onReportBug?: () => void;
}

export default function ReviewScreen({
  accuracy,
  lessons,
  onBack,
  onPracticeLesson,
  summary,
  onDrillWord,
  onDrillPair,
  onOpenLesson,
  onReportBug,
}: Props) {
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const selectedSpot =
    summary?.weakSpots.find((s) => s.conceptId === selectedSpotId) ?? null;
  const titles = lessonTitles(lessons);

  const weak = accuracy
    .filter((a) => a.total > 0 && a.correct / a.total < 0.6)
    .map((a) => ({
      a,
      lesson: lessons.find((l) => a.conceptId === `lesson-${l.id}`),
    }))
    .filter((x) => x.lesson);

  if (selectedSpot) {
    const pair =
      summary?.confusionPairs.find(
        (p) => p.a === selectedSpot.conceptId || p.b === selectedSpot.conceptId,
      ) ?? null;
    return (
      <WindowFrame title="Review" onBack={onBack} variant="overlay">
        <main className="mx-auto max-w-2xl px-4 py-8">
          <WeakSpotDetail
            spot={selectedSpot}
            pair={pair}
            gloss={conceptGloss(selectedSpot.conceptId, lessons)}
            lessonTitles={titles}
            onBack={() => setSelectedSpotId(null)}
            onDrillWord={() => onDrillWord?.(selectedSpot.conceptId)}
            onDrillPair={pair ? () => onDrillPair?.(pair) : undefined}
            onOpenLesson={onOpenLesson}
          />
        </main>
      </WindowFrame>
    );
  }

  const weakWords = (summary?.weakSpots ?? []).filter((s) => s.kind === "vocab");
  const pairs = summary?.confusionPairs ?? [];

  return (
    <WindowFrame title="Review" onBack={onBack} variant="overlay">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-3xl font-black">🔍 Review Weak Spots</h1>
          {onReportBug && (
            <button
              type="button"
              onClick={onReportBug}
              className="shrink-0 text-sm font-semibold text-wood-800 transition hover:text-burgundy-700"
            >
              🪲 Report a problem
            </button>
          )}
        </div>

        <section className="mt-6 space-y-3" aria-label="Diagnostics">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gold-700">
              Last 14 days · Your patterns
            </h2>
            <span className="text-xs text-gray-400">
              window: {summary?.windowDays ?? 14} days
            </span>
          </div>
          {!summary || !summary.enoughData ? (
            <DiagnosticsEmptyState variant="no-data" answerCount={summary?.answerCount ?? 0} />
          ) : (
            <>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-burgundy-700">
                  ⚔️ Confusion Pairs
                </h3>
                <div className="mt-2 space-y-3">
                  {pairs.length === 0 ? (
                    <DiagnosticsEmptyState variant="no-pairs" />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {pairs.map((p) => (
                        <ConfusionPairCard
                          key={`${p.a}|${p.b}`}
                          pair={p}
                          onDrill={() => onDrillPair?.(p)}
                          glossA={conceptGloss(p.a, lessons)}
                          glossB={conceptGloss(p.b, lessons)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-burgundy-700">
                  🎯 Weak Words
                </h3>
                <div className="mt-2 space-y-3">
                  {weakWords.length === 0 ? (
                    <DiagnosticsEmptyState variant="no-weak" />
                  ) : (
                    weakWords.map((spot: WeakSpot) => (
                      <WeakSpotRow
                        key={spot.conceptId}
                        spot={spot}
                        gloss={conceptGloss(spot.conceptId, lessons)}
                        onDrill={() => onDrillWord?.(spot.conceptId)}
                        onOpen={() => setSelectedSpotId(spot.conceptId)}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {weak.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow">
            <p className="text-2xl">🎉 No weak spots! Great job.</p>
            <p className="mt-2 text-gray-600">Keep practicing to maintain your Latin mastery.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-burgundy-700">
              📖 Weak Lessons
            </h3>
            {weak.map(({ a, lesson }) => {
              const pct = Math.round((a.correct / a.total) * 100);
              return (
                <div key={a.conceptId} className="rounded-2xl bg-white p-4 shadow">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold">Lesson {lesson!.id}: {lesson!.title}</div>
                    <button
                      onClick={() => onPracticeLesson(lesson!.id)}
                      className="rounded-lg bg-gold-400 px-3 py-2 text-sm font-bold text-burgundy-950 hover:bg-gold-300"
                    >
                      Practice
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-3 flex-1 rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${pct < 40 ? "bg-red-500" : "bg-amber-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-12 text-right text-sm font-bold ${pct < 40 ? "text-red-600" : "text-amber-600"}`}>
                      {pct}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {a.correct} correct of {a.total}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </WindowFrame>
  );
}
