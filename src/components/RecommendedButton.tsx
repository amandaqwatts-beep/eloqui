import type { Recommendation } from "~/engine/recommendation";

/**
 * RecommendedButton — the free-zone "do the recommended" affordance
 * (owner directive 2026-09-10: user selection lives in the free zones, and
 * every free zone carries a prominent button that jumps to the engine's next
 * suggestion — targeted flow screens never render it).
 *
 * Presentational only: the route passes the engine-computed Recommendation
 * plus the dispatch callback. Variants:
 *   banner  — full-width gold card (DrillSetup header, LessonMenu canonical
 *             slot between desk-bar and menuCards, AIPractice idle callout).
 *   compact — inline pill (reserved for tighter free-zone chrome).
 *
 * The whole banner is ONE real <button> (single tap target); the glyph and
 * arrow are aria-hidden so screen readers announce the full aria-label.
 * Theme: Tailwind v4 @theme tokens only (gold / burgundy scales).
 */

const KIND_GLYPH: Record<Recommendation["kind"], string> = {
  lesson: "📖",
  "unit-review": "🎯",
  drill: "⭐",
};

const SOURCE_KICKER: Record<Recommendation["source"], string> = {
  "unit-review": "Review ready",
  remediation: "Weakest area",
  bonus: "Streak earned",
  frontier: "Next up",
};

interface Props {
  recommendation: Recommendation;
  onDoRecommended: () => void;
  variant?: "banner" | "compact";
}

export default function RecommendedButton({ recommendation, onDoRecommended, variant = "banner" }: Props) {
  const glyph = KIND_GLYPH[recommendation.kind];
  const ariaLabel = `Do the recommended: ${recommendation.label}`;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onDoRecommended}
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold-600 bg-gold-100 px-3 py-1 text-xs font-bold text-burgundy-800 shadow-sm transition hover:bg-gold-200"
      >
        <span aria-hidden="true">{glyph}</span>
        <span>Do the recommended</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onDoRecommended}
      aria-label={ariaLabel}
      className="group mb-4 flex w-full items-center gap-3 rounded-2xl border-2 border-gold-500 bg-gold-100 px-4 py-3 text-left shadow-md transition hover:border-gold-600 hover:bg-gold-200"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm"
      >
        {glyph}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-black uppercase tracking-widest text-gold-700">
          {SOURCE_KICKER[recommendation.source]} · Do the recommended
        </span>
        <span className="block truncate font-bold text-burgundy-900">{recommendation.label}</span>
        <span className="block truncate text-sm text-burgundy-700">{recommendation.reason}</span>
      </span>
      <span
        aria-hidden="true"
        className="shrink-0 rounded-full bg-burgundy-700 px-3 py-1.5 text-xs font-black text-white shadow transition group-hover:bg-burgundy-800"
      >
        Go →
      </span>
    </button>
  );
}
