/**
 * GrammarDrawer.tsx — right-hand drawer listing the grammar index (67 topics
 * from GRAMMAR_INDEX). Presentational (screens dept): renders whatever topic
 * array it is given; gated on the `topics` prop upstream so the build stays
 * green even when the data has not landed.
 *
 * a11y: role="dialog" + aria-modal, Escape / backdrop / ✕ close, focus
 * retained inside while open, reduced-motion safe (no animation on close).
 */
import { useEffect, useRef } from "react";
import type { GrammarCategory, GrammarTopic } from "~/data/grammarIndex";

const CATEGORY_LABELS: Record<GrammarCategory, string> = {
  declension: "Declension",
  "case-usage": "Case Usage",
  prepositions: "Prepositions",
  pronouns: "Pronouns",
  adjectives: "Adjectives",
  comparison: "Comparison",
  numerals: "Numerals",
  conjugation: "Conjugation",
  irregulars: "Irregular Verbs",
  voice: "Voice",
  subjunctive: "Subjunctive",
  clauses: "Clauses",
  "participles-infinitives": "Participles & Infinitives",
};

const CATEGORY_ORDER: GrammarCategory[] = [
  "declension",
  "case-usage",
  "prepositions",
  "pronouns",
  "adjectives",
  "comparison",
  "numerals",
  "conjugation",
  "irregulars",
  "voice",
  "subjunctive",
  "clauses",
  "participles-infinitives",
];

interface Props {
  open: boolean;
  onClose: () => void;
  topics: GrammarTopic[];
  /** First relatedLessonId → the menu converts to an array index. */
  onOpenLesson: (lessonId: number) => void;
  /** Scroll target — { topicId, nonce } bumps re-scroll on repeat opens. */
  scrollTo?: { topicId: string; nonce: number } | null;
}

export default function GrammarDrawer({
  open,
  onClose,
  topics,
  onOpenLesson,
  scrollTo,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Escape closes; focus stays inside while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const panel = panelRef.current;
    if (panel) (panel.querySelector<HTMLElement>("button") ?? panel).focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Scroll the requested topic into view (instant — reduced-motion safe).
  useEffect(() => {
    if (!open || !scrollTo) return;
    const el = document.getElementById(`grammar-topic-${scrollTo.topicId}`);
    el?.scrollIntoView({ block: "center" });
  }, [open, scrollTo?.topicId, scrollTo?.nonce]);

  if (!open) return null;

  const byCategory = new Map<GrammarCategory, GrammarTopic[]>();
  for (const t of topics) {
    const arr = byCategory.get(t.category) ?? [];
    arr.push(t);
    byCategory.set(t.category, arr);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Grammar Index"
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col bg-cream-50 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-burgundy-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-burgundy-900">Grammar Index</h2>
            <p className="text-xs text-gray-500">
              {topics.length} topics · Henle <em>Grammar</em> citations forthcoming
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close grammar index"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-burgundy-200 bg-white text-gray-500 transition hover:border-burgundy-400 hover:text-burgundy-700"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {topics.length === 0 ? (
            <p className="text-sm text-gray-400">No grammar topics yet.</p>
          ) : (
            CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => (
              <section key={cat} className="mb-6">
                <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-burgundy-700">
                  {CATEGORY_LABELS[cat]}
                  <span className="ml-1.5 font-medium text-gray-400">
                    {byCategory.get(cat)!.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {byCategory.get(cat)!.map((t) => (
                    <div
                      key={t.id}
                      id={`grammar-topic-${t.id}`}
                      className="rounded-xl border border-burgundy-100 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-burgundy-900">{t.topic}</h4>
                        {t.relatedLessonIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onOpenLesson(t.relatedLessonIds[0])}
                            className="shrink-0 text-xs font-semibold text-gold-700 underline-offset-2 hover:underline"
                          >
                            Open
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">
                        {t.definition}
                      </p>
                      <p className="mt-1.5 text-[10px] text-gray-400">
                        {t.henleGrammarRef === "[owner to cite]"
                          ? "citation pending"
                          : `Henle Grammar §${t.henleGrammarRef}`}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </>
  );
}
