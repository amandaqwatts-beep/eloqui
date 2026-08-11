import { useState } from "react";
import type { Lesson } from "~/data/latinLessons";
import type { DashboardStats, LessonProgress } from "~/engine/progress";
import type { ConfusionPair, WeakSpot } from "~/engine/types";
import {
  conceptGloss,
  lessonTitles,
  type DiagnosticsSummary,
} from "~/lib/diagnosticUi";
import WeakSpotRow from "~/components/WeakSpotRow";
import ConfusionPairCard from "~/components/ConfusionPairCard";
import WeakSpotDetail from "~/components/WeakSpotDetail";
import DiagnosticsEmptyState from "~/components/DiagnosticsEmptyState";

/**
 * ProgressScreen — dashboard. Extended per UI-spec §5: a Diagnostics section
 * (confusion pairs + weakest words) sits between the summary cards and the
 * lesson list; everything existing renders unchanged. `selectedSpot` opens
 * the WeakSpotDetail overlay in place (ExploreScreen pattern).
 */
interface Props {
  stats: DashboardStats;
  lessonProgress: LessonProgress[];
  lessons?: Lesson[];
  onBack: () => void;
  onOpenReview?: () => void;
  summary?: DiagnosticsSummary;
  onDrillWord?: (conceptId: string) => void;
  onDrillPair?: (pair: ConfusionPair) => void;
  onOpenWeakSpot?: (conceptId: string) => void;
  onOpenLesson?: (lessonId: number) => void;
}

export default function ProgressScreen({
  stats,
  lessonProgress,
  lessons = [],
  onBack,
  onOpenReview,
  summary,
  onDrillWord,
  onDrillPair,
  onOpenWeakSpot,
  onOpenLesson,
}: Props) {
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const selectedSpot =
    summary?.weakSpots.find((s) => s.conceptId === selectedSpotId) ?? null;
  const titles = lessonTitles(lessons);

  const handleOpenSpot = (conceptId: string) => {
    onOpenWeakSpot?.(conceptId);
    setSelectedSpotId(conceptId);
  };

  if (selectedSpot) {
    const pair =
      summary?.confusionPairs.find(
        (p) => p.a === selectedSpot.conceptId || p.b === selectedSpot.conceptId,
      ) ?? null;
    return (
      <main className="min-h-dvh bg-cream-50 px-4 py-10 text-burgundy-900">
        <div className="mx-auto max-w-2xl">
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
        </div>
      </main>
    );
  }

  const weakWords = (summary?.weakSpots ?? []).filter((s) => s.kind === "vocab");
  const pairs = summary?.confusionPairs ?? [];
  const focusCount = (summary?.weakSpots.length ?? 0) + pairs.length;

  return (
    <main className="min-h-dvh bg-cream-50 px-4 py-10 text-burgundy-900">
      <div className="mx-auto max-w-2xl">
        <button onClick={onBack} className="mb-6 text-sm font-bold text-burgundy-700 hover:underline">
          ← Back
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">📊 Your Progress</h1>
            {summary && !summary.enoughData && (
              <p className="mt-1 text-sm text-gray-500">
                Patterns appear after a few sessions — keep going!
              </p>
            )}
          </div>
          {onOpenReview && (
            <button
              onClick={onOpenReview}
              className="rounded-lg bg-gold-400 px-3 py-2 text-sm font-bold text-burgundy-950 hover:bg-gold-300"
            >
              🔍 Review
            </button>
          )}
        </div>
        <div
          className={`mt-6 grid gap-3 ${
            summary ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
          }`}
        >
          {[
            [`${stats.lessonsCompleted}/${stats.totalLessons}`, "Lessons Completed"],
            [`${stats.overallAccuracy}%`, "Overall Accuracy"],
            [stats.bestStreak, "Best Streak"],
          ].map(([v, l]) => (
            <div className="rounded-xl bg-white p-4 text-center shadow" key={String(l)}>
              <b className="text-2xl">{v}</b>
              <p className="text-xs text-gray-500">{l}</p>
            </div>
          ))}
          {summary && (
            <div className="rounded-xl bg-white p-4 text-center shadow" key="focus">
              <b className="text-2xl">{focusCount}</b>
              <p className="text-xs text-gray-500">Focus Items</p>
            </div>
          )}
        </div>

        {summary && (
          <section className="mt-6 space-y-3" aria-label="Diagnostics">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold-700">
                Last 14 days · Your patterns
              </h2>
              <span className="text-xs text-gray-400">
                window: {summary.windowDays} days
              </span>
            </div>
            {!summary.enoughData ? (
              <DiagnosticsEmptyState variant="no-data" answerCount={summary.answerCount} />
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-burgundy-700">
                      ⚔️ Confusion Pairs
                    </h3>
                    <span className="text-xs text-gray-400">{pairs.length} pair{pairs.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="mt-2 space-y-3">
                    {pairs.length === 0 ? (
                      <DiagnosticsEmptyState variant="no-pairs" />
                    ) : (
                      <>
                        {pairs.slice(0, 3).map((p) => (
                          <ConfusionPairCard
                            key={`${p.a}|${p.b}`}
                            pair={p}
                            compact
                            onDrill={() => onDrillPair?.(p)}
                            glossA={conceptGloss(p.a, lessons)}
                            glossB={conceptGloss(p.b, lessons)}
                          />
                        ))}
                        {pairs.length > 3 && (
                          <button
                            onClick={onOpenReview}
                            className="text-sm font-semibold text-burgundy-700 hover:underline"
                          >
                            See all {pairs.length} →
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-burgundy-700">
                      🎯 Weakest Words
                    </h3>
                    <span className="text-xs text-gray-400">{weakWords.length} word{weakWords.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="mt-2 space-y-3">
                    {weakWords.length === 0 ? (
                      <DiagnosticsEmptyState variant="no-weak" />
                    ) : (
                      <>
                        {weakWords.slice(0, 3).map((spot: WeakSpot) => (
                          <WeakSpotRow
                            key={spot.conceptId}
                            spot={spot}
                            gloss={conceptGloss(spot.conceptId, lessons)}
                            onDrill={() => onDrillWord?.(spot.conceptId)}
                            onOpen={() => handleOpenSpot(spot.conceptId)}
                          />
                        ))}
                        {weakWords.length > 3 && (
                          <button
                            onClick={onOpenReview}
                            className="text-sm font-semibold text-burgundy-700 hover:underline"
                          >
                            See all {weakWords.length} →
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        <div className="mt-6 space-y-2 rounded-2xl bg-white p-4 shadow">
          {(lessons.length ? lessons : Array.from({length:stats.totalLessons},(_,i)=>({id:i+1,title:"Lesson"} as Lesson))).map(l=>{
            const p=lessonProgress.find(x=>x.lessonId===l.id);
            return <div className="flex items-center gap-3" key={l.id}>
              <span>{p?.completed?"✅":"🔒"}</span>
              <span className="w-48 truncate text-sm">Lesson {l.id}: {l.title}</span>
              <div className="h-2 flex-1 rounded bg-gray-100"><div className="h-full rounded bg-green-500" style={{width:`${p?.bestScore??0}%`}}/></div>
              <span className="text-xs">{p?`${p.bestScore}%`:"Not attempted"}</span>
            </div>;
          })}
        </div>
      </div>
    </main>
  );
}
