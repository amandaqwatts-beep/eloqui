import type { ConfusionPair } from "~/engine/types";
import { PAIR_GENERIC_REASON } from "~/lib/diagnosticUi";

/**
 * ConfusionPairCard — UI-spec §9. Container is a plain <div> (not a
 * row-button) so the Drill button is a normal button. `compact` (dashboard)
 * drops the reason line.
 */
interface Props {
  pair: ConfusionPair;
  onDrill: () => void;
  compact?: boolean;
  /** English glosses resolved by the container (not part of the engine pair). */
  glossA?: string;
  glossB?: string;
}

export default function ConfusionPairCard({
  pair,
  onDrill,
  compact = false,
  glossA,
  glossB,
}: Props) {
  const glossLine =
    glossA !== undefined && glossB !== undefined
      ? `"${glossA}" vs "${glossB}"`
      : null;
  return (
    <div
      aria-label={`${pair.labelA} confused with ${pair.labelB}`}
      className="rounded-2xl border-2 border-burgundy-200 bg-white p-4 shadow-sm transition hover:border-gold-500"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-burgundy-900">
          ⚔️ {pair.labelA} ↔ {pair.labelB}
        </p>
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">
          {pair.total}×
        </span>
      </div>
      {glossLine && <p className="mt-1 text-sm text-gray-500">{glossLine}</p>}
      <p className="mt-1 text-xs font-semibold text-amber-600">
        Mixed up {pair.total}× in the last 14 days
      </p>
      {!compact && (
        <p className="mt-1 text-xs text-gray-400">{PAIR_GENERIC_REASON}</p>
      )}
      <button
        type="button"
        onClick={onDrill}
        className="mt-3 w-full rounded-lg bg-gold-400 py-2.5 text-sm font-bold text-burgundy-950 transition hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
      >
        ⚔️ Drill this pair
      </button>
    </div>
  );
}
