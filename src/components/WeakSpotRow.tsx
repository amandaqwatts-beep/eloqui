import type { KeyboardEvent } from "react";
import type { WeakSpot } from "~/engine/types";
import AccuracyBar from "~/components/AccuracyBar";
import { mainMistakeLine } from "~/lib/diagnosticUi";

/**
 * WeakSpotRow — one weak word/concept row (UI-spec §8). Tapping the row
 * (not the Drill button) opens the WeakSpotDetail overlay; the Drill button
 * uses stopPropagation exactly like LessonMenu's AI-practice pill.
 */
interface Props {
  spot: WeakSpot;
  /** English gloss for vocab spots (data lookup, done by the container). */
  gloss?: string;
  onDrill: () => void;
  onOpen: () => void;
}

export default function WeakSpotRow({ spot, gloss, onDrill, onOpen }: Props) {
  const mistake = mainMistakeLine(spot);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      aria-label={`${spot.label} — weak spot, ${spot.accuracy}% accuracy`}
      className="cursor-pointer rounded-2xl border-2 border-burgundy-200 bg-white p-4 shadow-sm transition hover:border-gold-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-burgundy-900">
            {spot.label}
            {gloss ? (
              <span className="ml-2 text-sm font-normal text-gray-500">
                &ldquo;{gloss}&rdquo;
              </span>
            ) : null}
          </p>
          <div className="mt-2">
            <AccuracyBar
              pct={spot.accuracy}
              caption={`${spot.accuracy}% · ${spot.correct}/${spot.total}`}
              size="sm"
            />
          </div>
          {mistake ? (
            <p className="mt-1.5 text-xs text-amber-600 line-clamp-1 sm:line-clamp-2">
              {mistake}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDrill();
          }}
          className="shrink-0 rounded-lg bg-gold-400 px-3 py-2 text-sm font-bold text-burgundy-950 transition hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          🎯 Drill
        </button>
      </div>
    </div>
  );
}
