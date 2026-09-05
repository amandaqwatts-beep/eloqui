/**
 * FoundationsEntry.tsx — the Grammar-basics Foundations module's bookshelf
 * entry (beta deliverable #3, screens). A thin-spine book rendered after the
 * Latin course shelves, in the Bookshelf v2.1 visual language (library wall,
 * wooden shelf board, spine-gradient "cloth"). Presentational only: the whole
 * book is a link to /lessons/latin/foundations, which owns the 5-lesson flow.
 *
 * Progress pips come from the Foundations-namespaced store (the gf module
 * persists separately from the Latin course — see routes/lessons/latin/
 * foundations.tsx header; its lesson ids are 401–405), so this file reads its
 * own namespace key.
 */
import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";

const NS = "verbum-foundations";

interface Pip {
  lessonId: number;
  completed: boolean;
}

function loadPips(): Pip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${NS}:progress`);
    return raw ? (JSON.parse(raw) as Pip[]) : [];
  } catch {
    return [];
  }
}

const FOUNDATIONS_TITLES = [
  "The Latin Alphabet",
  "Vowels & Diphthongs",
  "Consonants",
  "Syllables & Division",
  "Quantity & Accent",
];

export default function FoundationsEntry() {
  const done = loadPips().filter((p) => p.completed).length;
  return (
    <section aria-label="Grammar-basics Foundations" className="pt-4">
      <h3 className="mb-1 text-[10px] font-black uppercase tracking-wider text-burgundy-800">
        Foundations
      </h3>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <Link
          to="/lessons/latin/foundations"
          aria-label="Grammar-basics Foundations — 5 lessons: alphabet, vowels and diphthongs, consonants, syllables, quantity and accent"
          title="Grammar-basics Foundations (Henle Grammar §§1–13)"
          className="relative flex h-20 w-7 shrink-0 flex-col items-center justify-end rounded-t-sm pb-1.5 shadow-md transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          style={
            {
              background:
                "linear-gradient(180deg, var(--color-wood-400), var(--color-wood-600))",
              "--spine-label": "var(--color-cream-50)",
            } as CSSProperties
          }
        >
          <span
            aria-hidden="true"
            className="text-[13px] leading-none text-cream-50 [writing-mode:vertical-rl]"
          >
            ✒️ Grammatica
          </span>
        </Link>
        <div className="min-w-0 flex-1 pb-1">
          <p className="text-sm font-bold text-burgundy-900">
            Grammar-basics Foundations
          </p>
          <p className="text-xs text-gray-500">
            Henle Grammar §§1–13 · {FOUNDATIONS_TITLES.join(" · ")}
          </p>
          <p className="mt-1 text-xs font-semibold text-gold-700" aria-live="polite">
            {done === 5
              ? "✓ All five lessons complete"
              : done > 0
                ? `${done} of 5 lessons complete`
                : "5 lessons · start with the alphabet"}
          </p>
        </div>
      </div>
      <div className="shelf-board mt-2" />
    </section>
  );
}
