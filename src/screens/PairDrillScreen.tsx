import type { ConfusionPair } from "~/engine/types";
import { PAIR_GENERIC_REASON } from "~/lib/diagnosticUi";

/**
 * PairDrillScreen — intro phase of the confusion-pair drill (UI-spec §6.1).
 * The pair's meanings are shown side by side with the "why" narrative;
 * [Start Drill] hands off to the route, which builds the deck and renders
 * DrillView (the drill run is DrillView's own state).
 */
interface Props {
  pair: ConfusionPair;
  glossA?: string;
  glossB?: string;
  onStart: () => void;
  onBack: () => void;
}

export default function PairDrillScreen({ pair, glossA, glossB, onStart, onBack }: Props) {
  const cheatLine = [
    glossA ? `${pair.labelA} = ${glossA}` : pair.labelA,
    glossB ? `${pair.labelB} = ${glossB}` : pair.labelB,
  ].join(" · ");

  return (
    <main className="min-h-dvh bg-cream-50 px-4 py-10 text-burgundy-900">
      <div className="mx-auto max-w-xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-bold text-burgundy-700 hover:underline"
        >
          ← Back
        </button>
        <div className="rounded-3xl border-2 border-burgundy-200 bg-white p-6 shadow-lg">
          <h1 className="text-2xl font-black text-burgundy-900">
            ⚔️ Confusion Drill: {pair.labelA} vs {pair.labelB}
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            You've been swapping these two — let's lock in the difference.
          </p>
          <p className="mt-1 text-xs text-gray-400">{PAIR_GENERIC_REASON}</p>
          <div className="mt-5 rounded-xl border-2 border-gold-200 bg-gold-50 px-4 py-3 text-center">
            <p className="text-sm font-bold text-gold-800">{cheatLine}</p>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            The pair's meanings stay on screen for the whole drill — read them
            before you answer, and the ear starts to hear the difference.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onStart}
              className="flex-1 rounded-xl bg-gold-400 py-3 font-bold text-burgundy-950 transition hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
            >
              Start Drill
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-xl border-2 border-burgundy-200 py-3 font-bold text-burgundy-700 transition hover:border-gold-500"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
