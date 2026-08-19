import type { CrossLanguageComparison } from "~/data/crossLanguageLessons";
import { LANGUAGES } from "~/data/languages";

/**
 * ComparisonPanel — presentational renderer for a single CrossLanguageComparison
 * (cognate / parallel / grammar / culture / false-friend). Category chip colors
 * mirror the CultureQuestion domain-chip pattern. Makes NO assumption that the
 * left term is Latin and the right is English — both blocks render purely from
 * the authored term objects (1007-c4 has English on both sides). `dir="rtl"`
 * is applied per term when its language is right-to-left (defensive only).
 */

const CATEGORY_LABELS: Record<CrossLanguageComparison["category"], string> = {
  cognate: "Cognate",
  parallel: "Parallel",
  grammar: "Grammar",
  culture: "Culture",
  "false-friend": "False friend",
};

const CATEGORY_STYLES: Record<CrossLanguageComparison["category"], string> = {
  cognate: "bg-emerald-100 text-emerald-800",
  parallel: "bg-sky-100 text-sky-800",
  grammar: "bg-violet-100 text-violet-800",
  culture: "bg-gold-100 text-gold-800",
  "false-friend": "bg-rose-100 text-rose-700",
};

function TermBlock({
  term,
}: {
  term: CrossLanguageComparison["left"];
}) {
  const rtl = LANGUAGES[term.language].rtl;
  return (
    <div
      dir={rtl ? "rtl" : undefined}
      className="flex-1 rounded-xl border border-burgundy-100 bg-white p-4"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {LANGUAGES[term.language].name}
      </span>
      <p className="mt-1 text-lg font-bold text-burgundy-900">
        {term.term}
        {term.romanization && term.romanization !== term.term && (
          <span className="ml-2 text-sm font-normal italic text-gray-500">
            {term.romanization}
          </span>
        )}
      </p>
      {term.pronunciation && (
        <p className="mt-1 text-xs italic text-gray-500">
          {term.pronunciation}
        </p>
      )}
      <p className="mt-2 text-sm text-gray-700">{term.meaning}</p>
    </div>
  );
}

export default function ComparisonPanel({
  comparison,
}: {
  comparison: CrossLanguageComparison;
}) {
  return (
    <div className="rounded-2xl border border-burgundy-200 bg-cream-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-burgundy-900">
          {comparison.topic}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_STYLES[comparison.category]}`}
        >
          {CATEGORY_LABELS[comparison.category]}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <TermBlock term={comparison.left} />
        <TermBlock term={comparison.right} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        {comparison.note}
      </p>
    </div>
  );
}
