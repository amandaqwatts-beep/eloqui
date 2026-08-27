/**
 * searchIndex.ts — full-text search index over everything referenceable on
 * the Latin shelf: lessons, vocabulary, tables, grammar topics, culture
 * questions, and explore side lessons. Pure functions — no React.
 *
 * Normalization: lowercase + diacritics-strip (macrons āēīōū → aeiou) so a
 * user typing "servus" finds "servus" and "gravior" finds "graviōr-".
 */
import type { Lesson } from "~/data/latinLessons";
import type { SideLesson } from "~/data/latinSideLessons";
import type { GrammarTopic } from "~/data/grammarIndex";
import { CULTURE_TEACHING } from "~/data/cultureTeaching";

export type SearchResult =
  | {
      kind: "lesson";
      lessonId: number;
      idx: number;
      title: string;
      match: string;
    }
  | {
      kind: "vocab";
      lessonId: number;
      idx: number;
      title: string;
      match: string;
    }
  | {
      kind: "table";
      lessonId: number;
      idx: number;
      title: string;
      match: string;
    }
  | {
      kind: "grammar";
      topicId: string;
      title: string;
      match: string;
    }
  | {
      kind: "culture";
      lessonId: number;
      idx: number;
      title: string;
      match: string;
      exerciseId: string;
    }
  | {
      kind: "explore";
      sideLessonId: number;
      title: string;
      match: string;
    };

/**
 * A SearchResult that also carries the full normalized haystack it was indexed
 * from (vocabulary glosses, table cells, grammar keywords, culture teaching
 * steps/sources, explore context…). searchIndex() matches against it so
 * haystack-only terms are findable; consumers can keep treating entries as
 * plain SearchResults.
 */
export type SearchEntry = SearchResult & { haystack: string };

/** lowercase + strip combining diacritics (macrons). */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ");
}

interface IndexEntry {
  result: SearchResult;
  haystack: string;
  titleRank: number;
}

/**
 * Module-level memo (PR-E / F11): the index is built from immutable imported
 * data (latinLessons, latinSideLessons, grammarIndex) whose references never
 * change, so build once and reuse. Keyed on reference identity — a caller
 * passing genuinely different arrays (tests) rebuilds correctly.
 */
let buildCache: {
  lessons: Lesson[];
  sideLessons: SideLesson[];
  grammar: GrammarTopic[];
  entries: SearchEntry[];
} | null = null;

export function buildSearchIndex(
  lessons: Lesson[],
  sideLessons: SideLesson[],
  grammar: GrammarTopic[],
): SearchEntry[] {
  if (
    buildCache &&
    buildCache.lessons === lessons &&
    buildCache.sideLessons === sideLessons &&
    buildCache.grammar === grammar
  ) {
    return buildCache.entries;
  }
  const entries: IndexEntry[] = [];

  const add = (result: SearchResult, haystacks: string[], titleRank: number) => {
    entries.push({
      result,
      haystack: normalizeText(haystacks.join(" ")),
      titleRank,
    });
  };

  for (const [idx, l] of lessons.entries()) {
    // Display number = array index + 1 (ids are persistence keys, not display).
    const title = `Lesson ${idx + 1}: ${l.title}`;
    const concept = stripHtml(l.conceptHtml ?? l.concept);
    add(
      { kind: "lesson", lessonId: l.id, idx, title: `Lesson ${idx + 1}: ${l.title}`, match: concept },
      [l.title, l.subtitle ?? "", concept],
      0,
    );

    for (const v of l.vocabulary ?? []) {
      add(
        { kind: "vocab", lessonId: l.id, idx, title, match: `${v.latin} — ${v.english}` },
        [v.latin, v.english, v.pronunciation ?? "", v.type ?? ""],
        1,
      );
    }

    const tableRows: (string | string[] | { person: string; singular: string; plural: string })[][] =
      [];
    if (l.referenceTable) tableRows.push(l.referenceTable.rows);
    if (l.vocabularyTable) tableRows.push(l.vocabularyTable.rows);
    if (l.conjugationTable) tableRows.push(l.conjugationTable.rows);
    for (const rows of tableRows) {
      const name =
        rows === l.referenceTable?.rows
          ? l.referenceTable.title
          : rows === l.vocabularyTable?.rows
            ? l.vocabularyTable.title
            : l.conjugationTable?.title ?? "Conjugation";
      const cells = rows
        .flatMap((r) => (typeof r === "string" ? [r] : Array.isArray(r) ? r : [r.person, r.singular, r.plural]))
        .join(" ");
      add(
        { kind: "table", lessonId: l.id, idx, title, match: `${name} ${cells}` },
        [name, cells],
        2,
      );
    }

    for (const ex of l.exercises) {
      if (ex.type === "culture-question") {
        add(
          {
            kind: "culture",
            lessonId: l.id,
            idx,
            title: `Culture · Lesson ${idx + 1}`,
            match: ex.prompt,
            exerciseId: ex.id,
          },
          [
            ex.prompt,
            ex.domain,
            ex.explanation,
            ...(CULTURE_TEACHING[ex.id]?.steps.flatMap((st) => [
              st.title,
              st.explanation,
              st.exampleLatin,
              st.exampleEnglish,
              st.tip ?? "",
            ]) ?? []),
            ...(CULTURE_TEACHING[ex.id]?.sources ?? []),
          ],
          3,
        );
      }
    }
  }

  for (const sl of sideLessons) {
    const concept = stripHtml(sl.concept);
    const vocab = sl.vocabulary.map((v) => `${v.latin} ${v.english}`).join(" ");
    add(
      { kind: "explore", sideLessonId: sl.id, title: `Explore: ${sl.title}`, match: concept },
      [sl.title, sl.subtitle ?? "", concept, sl.context, vocab],
      4,
    );
  }

  for (const g of grammar) {
    add(
      { kind: "grammar", topicId: g.id, title: g.topic, match: g.definition },
      [g.topic, g.definition, ...g.keywords],
      0,
    );
  }

  // Keep the haystack on the returned entries so searchIndex() can match
  // against the full indexed text — not just title + match.
  const resultEntries = entries.map((e) => ({ ...e.result, haystack: e.haystack }));
  buildCache = { lessons, sideLessons, grammar, entries: resultEntries };
  return resultEntries;
}

/**
 * Rank: title-keyword matches first (inTitle -1000 bonus, unchanged), then
 * match-body hits, then haystack-only hits — all by first-occurrence position
 * in the concatenated searchable text. Accepts either SearchEntry[] (from
 * buildSearchIndex) or plain SearchResult[] (haystack optional) so existing
 * callers keep compiling and behaving identically.
 */
export function searchIndex(
  index: ReadonlyArray<SearchResult & { haystack?: string }>,
  query: string,
  limit = 12,
): SearchResult[] {
  const q = normalizeText(query.trim());
  if (q.length === 0) return [];
  const scored: { result: SearchResult; score: number }[] = [];
  for (const entry of index) {
    const title = normalizeText(entry.title);
    const match = normalizeText(entry.match);
    const haystack = normalizeText(entry.haystack ?? "");
    // Title + match (+ haystack when present) — positions before the haystack
    // are identical to the old title + " " + match concatenation, so existing
    // title/match hits keep their exact scores and ordering.
    const text = `${title} ${match}${haystack ? ` ${haystack}` : ""}`;
    const i = text.indexOf(q);
    if (i < 0) continue;
    // Title match scores far above match-body match; earlier occurrence wins.
    const inTitle = title.includes(q) ? -1000 : 0;
    let result: SearchResult = entry;
    // Haystack-only hit → carry a short snippet of the matched text so the
    // user sees why the result matched (display field only; kind/id intact).
    const bodyLen = title.length + 1 + match.length + 1;
    if (inTitle === 0 && !match.includes(q) && haystack && i >= bodyLen) {
      const hayPos = i - bodyLen;
      const start = Math.max(0, hayPos - 40);
      const end = Math.min(haystack.length, hayPos + q.length + 60);
      const snippet =
        (start > 0 ? "…" : "") +
        haystack.slice(start, end) +
        (end < haystack.length ? "…" : "");
      result = { ...entry, match: snippet };
    }
    scored.push({ result, score: inTitle + i });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.result);
}
