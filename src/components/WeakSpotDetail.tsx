import type { ConfusionPair, WeakSpot } from "~/engine/types";
import AccuracyBar from "~/components/AccuracyBar";
import {
  mainMistakeDetail,
  PAIR_GENERIC_REASON,
} from "~/lib/diagnosticUi";

/**
 * WeakSpotDetail — screen-local detail overlay (UI-spec §8). Rendered by
 * ProgressScreen / ReviewScreen in place of their main content; ← Back
 * returns to the list. Engine's WeakSpot carries a single `lessonId` (the
 * introducing lesson) rather than the assumed `lessonIds[]`, so the
 * "Also appears in" line is adapted to "Introduced in Lesson N".
 */
interface Props {
  spot: WeakSpot;
  /** The confusion pair this spot belongs to, if any (container-resolved). */
  pair?: ConfusionPair | null;
  gloss?: string;
  lessonTitles: Map<number, string>;
  onBack: () => void;
  onDrillWord: () => void;
  onDrillPair?: () => void;
  onOpenLesson?: (lessonId: number) => void;
}

export default function WeakSpotDetail({
  spot,
  pair,
  gloss,
  lessonTitles,
  onBack,
  onDrillWord,
  onDrillPair,
  onOpenLesson,
}: Props) {
  const detail = mainMistakeDetail(spot);
  const lessonTitle =
    spot.lessonId !== undefined ? lessonTitles.get(spot.lessonId) : undefined;
  const kindTag =
    spot.kind === "vocab" ? "vocabulary word" : spot.kind === "concept" ? "grammar concept" : spot.kind;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm font-bold text-burgundy-700 hover:underline"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-black text-burgundy-900">🎯 {spot.label}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {gloss ? `"${gloss}"` : kindTag}
        {spot.lessonId !== undefined
          ? ` · Lesson ${spot.lessonId}${lessonTitle ? `: ${lessonTitle}` : ""}`
          : ""}
      </p>

      <div className="mt-5">
        <AccuracyBar
          pct={spot.accuracy}
          caption={`${spot.accuracy}% · ${spot.correct} of ${spot.total} correct in the last 14 days`}
        />
      </div>

      {detail ? (
        <div className="mt-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            ⚠️ {detail}
          </p>
          <p className="mt-1 text-xs text-amber-700/80">
            {pair ? PAIR_GENERIC_REASON : "Keep drilling to turn this around."}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Keep practicing this word.</p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {pair && onDrillPair && (
          <button
            type="button"
            onClick={onDrillPair}
            className="flex-1 rounded-xl bg-gold-400 py-3 font-bold text-burgundy-950 transition hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          >
            ⚔️ Drill this pair
          </button>
        )}
        <button
          type="button"
          onClick={onDrillWord}
          className="flex-1 rounded-xl bg-burgundy-700 py-3 font-bold text-cream-50 transition hover:bg-burgundy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          🎯 Drill this word
        </button>
        {spot.lessonId !== undefined && onOpenLesson && (
          <button
            type="button"
            onClick={() => onOpenLesson(spot.lessonId as number)}
            className="flex-1 rounded-xl border-2 border-burgundy-200 py-3 font-bold text-burgundy-700 transition hover:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          >
            📖 Open Lesson {spot.lessonId}
          </button>
        )}
      </div>
    </div>
  );
}
