/**
 * SearchBox.tsx — search input + grouped results dropdown for the Bookshelf v2
 * lesson menu. Presentational (screens dept): consumes the prebuilt search
 * index and fires navigation callbacks; owns only its own input state.
 *
 * Behavior: 150ms debounce, ≥2 chars, max 12 results, ↑/↓ + Enter keyboard
 * navigation, Escape closes, click-outside closes, ARIA listbox.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "~/data/latinLessons";
import { searchIndex, type SearchResult } from "~/lib/searchIndex";

const KIND_BADGE: Record<SearchResult["kind"], string> = {
  lesson: "📘",
  vocab: "🔤",
  table: "📊",
  grammar: "📖",
  culture: "🏛️",
  explore: "✨",
};

interface Props {
  index: SearchResult[];
  lessons: Lesson[];
  onSelectLesson: (idx: number) => void;
  onOpenGrammar: (topicId: string) => void;
  onOpenExplore: (sideLessonId: number) => void;
  /** Extra classes merged onto the root (desk bar sizing, e.g. min-w). */
  className?: string;
}

export default function SearchBox({
  index,
  lessons,
  onSelectLesson,
  onOpenGrammar,
  onOpenExplore,
  className,
}: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Debounce 150ms.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(
    () => (debounced.trim().length >= 2 ? searchIndex(index, debounced, 12) : []),
    [index, debounced],
  );
  const showDropdown = open && debounced.trim().length >= 2;

  useEffect(() => setHighlight(0), [debounced]);

  // Click-outside.
  useEffect(() => {
    if (!showDropdown) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [showDropdown]);

  const activate = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setDebounced("");
    switch (result.kind) {
      case "lesson":
      case "vocab":
      case "table":
      case "culture":
        onSelectLesson(result.idx);
        return;
      case "grammar":
        onOpenGrammar(result.topicId);
        return;
      case "explore":
        onOpenExplore(result.sideLessonId);
        return;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(results[highlight]);
    }
  };

  const hostTitle = (lessonId: number) =>
    lessons.find((l) => l.id === lessonId)?.title ?? "";

  return (
    <div ref={rootRef} className={`relative flex-1 ${className ?? ""}`}>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          🔍
        </span>
        <input
          type="search"
          role="searchbox"
          aria-label="Search lessons, vocabulary, and grammar"
          aria-expanded={showDropdown}
          aria-controls="search-results"
          aria-activedescendant={
            showDropdown && results.length > 0 ? `search-option-${highlight}` : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search lessons, vocabulary, grammar…"
          className="w-full rounded-2xl border-2 border-burgundy-200 bg-white py-2.5 pl-9 pr-3 text-sm text-burgundy-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-300"
        />
      </div>
      {showDropdown && (
        <div
          id="search-results"
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-2xl border border-burgundy-200 bg-white p-1.5 shadow-2xl"
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">No matches for “{debounced}”.</p>
          ) : (
            results.map((result, i) => {
              const badge = KIND_BADGE[result.kind];
              const sub =
                result.kind === "grammar"
                  ? "Grammar"
                  : result.kind === "explore"
                    ? "Explore"
                    : "Lesson " + result.lessonId;
              const host =
                result.kind !== "grammar" && result.kind !== "explore"
                  ? hostTitle(result.lessonId)
                  : "";
              return (
                <button
                  key={`${result.kind}:${"topicId" in result ? result.topicId : "lessonId" in result ? result.lessonId : result.sideLessonId}:${result.match.slice(0, 24)}`}
                  type="button"
                  role="option"
                  id={`search-option-${i}`}
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => activate(result)}
                  className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition ${
                    i === highlight ? "bg-gold-100" : "hover:bg-cream-100"
                  }`}
                >
                  <span aria-hidden="true" className="mt-0.5 text-sm">
                    {badge}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-burgundy-900">
                      {result.title}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {sub}
                      {host ? ` · ${host}` : ""}
                    </span>
                  </span>
                  <span aria-hidden="true" className="mt-0.5 text-[10px] text-gray-300">
                    ↵
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
