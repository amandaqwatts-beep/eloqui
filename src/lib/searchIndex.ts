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

export function buildSearchIndex(
  lessons: Lesson[],
  sideLessons: SideLesson[],
  grammar: GrammarTopic[],
): SearchResult[] {
  const entries: IndexEntry[] = [];

  const add = (result: SearchResult, haystacks: string[], titleRank: number) => {
    entries.push({
      result,
      haystack: normalizeText(haystacks.join(" ")),
      titleRank,
    });
  };

  for (const [idx, l] of lessons.entries()) {
    const title = `Lesson ${l.id}: ${l.title}`;
    const concept = stripHtml(l.conceptHtml ?? l.concept);
    add(
      { kind: "lesson", lessonId: l.id, idx, title: `Lesson ${l.id}: ${l.title}`, match: concept },
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
            title: `Culture · Lesson ${l.id}`,
            match: ex.prompt,
            exerciseId: ex.id,
          },
          [ex.prompt, ex.domain, ex.explanation],
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

  return entries.map((e) => e.result);
}

/** Rank: title-keyword matches first, then first-occurrence order. */
export function searchIndex(
  index: SearchResult[],
  query: string,
  limit = 12,
): SearchResult[] {
  const q = normalizeText(query.trim());
  if (q.length === 0) return [];
  const scored: { result: SearchResult; score: number }[] = [];
  for (const result of index) {
    const text = normalizeText(result.title + " " + result.match);
    const i = text.indexOf(q);
    if (i < 0) continue;
    // Title match scores far above match-body match; earlier occurrence wins.
    const inTitle = normalizeText(result.title).includes(q) ? -1000 : 0;
    scored.push({ result, score: inTitle + i });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.result);
}
