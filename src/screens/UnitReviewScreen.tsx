/**
 * UnitReviewScreen.tsx — per-unit review session screen (review-system rework
 * P2, owner direction 2026-08-12 "smaller reviews after each unit").
 *
 * THIN session screen: consumes the ENGINE session machine — the route owns
 * the session object and advances it via rateReviewItem (src/engine/
 * reviewSession.ts); this screen NEVER re-implements session state (index /
 * gotIt / missed / done) the way DrillView does — that is the audit
 * antipattern (design §2.4). What this screen holds is only the completion-
 * order evidence log ({item, ok, wrong?}[]) handed to the route once, when
 * the last item is rated.
 *
 * Items render through the same three exercise components AIPractice uses —
 * MultipleChoice / FillInBlank / MatchingPairs — via a structural pass-through
 * (ReviewItem extends those exercise shapes; the extra ReviewItemMeta fields
 * are ignored). MC + fill rate via their onResult detail (wrong/expected
 * forwarding); matching has no onResult, so it rates with a bare boolean
 * (wrong stays undefined — same as today's lesson matching).
 *
 * Completion view mirrors DrillView's done view (DrillView.tsx:39–93) with a
 * pass/fail verdict vs UNIT_REVIEW_PASS_THRESHOLD. The route wraps this screen
 * in a WindowFrame overlay (variant "overlay") — the menu stays mounted
 * underneath (SleepAudio precedent).
 */
import { useState } from "react";
import type { UnitReview } from "~/data/unitReviews";
import type { ReviewItem, ReviewSession } from "~/engine/reviewSession";
import type { PronMode } from "~/lib/pronunciation";
import type { ExerciseResultDetail } from "~/engine/types";
import { UNIT_REVIEW_PASS_THRESHOLD } from "~/data/settings";
import MultipleChoice from "~/components/MultipleChoice";
import FillInBlank from "~/components/FillInBlank";
import MatchingPairs from "~/components/MatchingPairs";

/** One rated review item, collected in completion order. The route's
 *  completion handler consumes this for recordUnitReviewCompletion (score) +
 *  per-item recordAttempt(source:"review", wrong/expected). */
export interface UnitReviewResult {
  item: ReviewItem;
  ok: boolean;
  /** Student's answer as given — undefined for matching (no onResult). */
  wrong?: string;
}

interface Props {
  unit: UnitReview;
  items: ReviewItem[];
  session: ReviewSession;
  pronMode: PronMode;
  /** Route advances the session (rateReviewItem — the engine machine). */
  onRateItem: (correct: boolean, detail?: ExerciseResultDetail) => void;
  /** Fires exactly once — when the LAST item is rated — with the full
   *  evidence log, so the route persists BEFORE the completion view settles. */
  onComplete: (results: UnitReviewResult[]) => void;
  onExit: () => void;
}

export default function UnitReviewScreen({
  unit,
  items,
  session,
  pronMode,
  onRateItem,
  onComplete,
  onExit,
}: Props) {
  const [results, setResults] = useState<UnitReviewResult[]>([]);

  // ── Completion view (mirrors DrillView's done view, 39–93) ──────────────
  if (session.done) {
    const correct = results.filter((r) => r.ok).length;
    const score = items.length > 0 ? correct / items.length : 0;
    const passed = score >= UNIT_REVIEW_PASS_THRESHOLD;
    const missed = results.filter((r) => !r.ok);
    return (
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-burgundy-200 bg-white p-6 text-center shadow-lg sm:p-10">
          <div className="text-5xl">{passed ? "🏆" : "📚"}</div>
          <h1 className="mt-3 text-3xl font-black text-burgundy-900">
            {unit.title} {passed ? "Passed!" : "Complete!"}
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {passed
              ? "Unit material solid — nice work"
              : "Below the pass mark — review the unit and try again"}
          </p>
          <p className="mt-4 text-5xl font-black text-burgundy-700">
            {correct} / {items.length}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-green-700">
              <b>{correct}</b>
              <br />
              Correct
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-red-700">
              <b>{missed.length}</b>
              <br />
              Needs Work
            </div>
          </div>
          {missed.length > 0 && (
            <div className="mt-6 text-left">
              <h2 className="font-bold text-burgundy-800">Review these next:</h2>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {missed.map((r) => (
                  <li key={r.item.id}>
                    • {r.item.prompt} — {r.item.expected}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onExit}
              className="flex-1 rounded-xl bg-burgundy-700 py-3 font-bold text-white transition hover:bg-burgundy-800"
            >
              Back to Bookshelf
            </button>
          </div>
        </div>
      </main>
    );
  }

  const item = items[session.index];
  if (!item) return null;

  const handleRate = (correct: boolean, detail?: ExerciseResultDetail) => {
    const next = [...results, { item, ok: correct, wrong: detail?.wrong }];
    setResults(next);
    // Last item → hand the full evidence log to the route for persistence
    // (recordUnitReviewCompletion + per-item recordAttempt source:"review").
    if (session.index + 1 >= items.length) onComplete(next);
    onRateItem(correct, detail);
  };

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto w-full max-w-xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold-700">
          {unit.title}
        </p>
        <div className="mb-5 flex items-center justify-between text-sm font-semibold text-burgundy-700">
          <span>
            Item {session.index + 1} / {items.length}
          </span>
          <span>{results.filter((r) => r.ok).length} correct</span>
        </div>
        <div className="rounded-2xl border border-burgundy-200 bg-white p-4 shadow-sm sm:p-6">
          {item.type === "multiple-choice" && (
            <MultipleChoice
              exercise={item}
              onComplete={() => {}}
              onResult={(detail) => handleRate(detail.correct, detail)}
            />
          )}
          {item.type === "fill-in-blank" && (
            <FillInBlank
              exercise={item}
              onComplete={() => {}}
              onResult={(detail) => handleRate(detail.correct, detail)}
            />
          )}
          {item.type === "matching" && (
            <MatchingPairs
              exercise={item}
              onComplete={(correct) => handleRate(correct)}
              pronMode={pronMode}
            />
          )}
        </div>
      </div>
    </main>
  );
}
