// Verbum — Latin 2 (Book 2) section → lesson seam (lib/latin2Sections.ts).
//
// Pure composition layer: turns the capture pipeline's data (LATIN2_STRUCTURE
// + LATIN2_SECTION_EXERCISES + LATIN2_SECTION_GRAMMAR_REFS in data/latin2.ts)
// into the Lesson shape the existing exercise flow renders (ExerciseScreen /
// ExerciseRenderer — the SAME components Book 1's route uses). No React, no
// storage, no rendering — pure functions over the data files.
//
// Lesson ids: Book 2 sections get ids in the 2000-range (BASE 2000 + the
// section's own Henle Lesson number from its id, e.g. part4-l01-nouns-sum →
// 2001). This namespace is disjoint from Book 1 (ids ≤ 179) and from the
// cross-language lessons (1007/1008), so nothing collides in any shared map.
//
// Honesty rules (Minimalist Scholarly, plan rev 72):
//   • Only sections the capture pipeline marked "captured" with a non-empty
//     exercise list build a Lesson. Everything else returns null — the shell
//     renders those rows honest-empty.
//   • The Lesson carries ONLY what the data owns: the section's exercises,
//     its title, its part, its folio. No invented teaching steps, no invented
//     vocabulary — content is the content department's.

import type { Latin2Part, Latin2Section } from "~/data/latin2";
import {
  LATIN2_SECTION_EXERCISES,
  LATIN2_SECTION_GRAMMAR_REFS,
  LATIN2_STRUCTURE,
} from "~/data/latin2";
import type { Lesson } from "~/data/latinLessons";
import { GRAMMAR_INDEX, type GrammarTopic } from "~/data/grammarIndex";

/** Base for Book 2's synthetic lesson-id namespace (see header). */
export const LATIN2_SECTION_BASE_ID = 2000;

/** The print source named on every Book 2 lesson (matches shelves.ts Book 2). */
const BOOK2_SOURCE = "Henle Second Year Latin (1943)";

/** A section together with the part it hangs from. */
export interface Latin2SectionContext {
  section: Latin2Section;
  part: Latin2Part;
}

/** The Henle Lesson number encoded in a Part IV section id ("…l07-…" → 7). */
export function latin2SectionLessonNumber(sectionId: string): number | null {
  const m = /^part4-l(\d+)-/.exec(sectionId);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** The stable synthetic lesson id for a captured section (2000-range). */
export function latin2SectionLessonId(sectionId: string): number | null {
  const n = latin2SectionLessonNumber(sectionId);
  return n === null ? null : LATIN2_SECTION_BASE_ID + n;
}

/** Every captured section in book order, with its part. */
export function latin2CapturedSections(): Latin2SectionContext[] {
  const found: Latin2SectionContext[] = [];
  for (const part of LATIN2_STRUCTURE) {
    for (const section of part.sections) {
      if (section.status === "captured") found.push({ section, part });
    }
  }
  return found;
}

/** Locate a section (and its part) by id — null when the id is unknown. */
export function latin2SectionContext(
  sectionId: string,
): Latin2SectionContext | null {
  for (const part of LATIN2_STRUCTURE) {
    const section = part.sections.find((s) => s.id === sectionId);
    if (section) return { section, part };
  }
  return null;
}

/**
 * Build the Lesson the existing exercise flow renders for a captured section,
 * or null when the section is awaiting capture, unknown, contentless, or its
 * id carries no Henle Lesson number. Pure — no fabrication.
 */
export function buildLatin2SectionLesson(sectionId: string): Lesson | null {
  const ctx = latin2SectionContext(sectionId);
  if (!ctx || ctx.section.status !== "captured") return null;
  const exercises = LATIN2_SECTION_EXERCISES[sectionId];
  if (!exercises || exercises.length === 0) return null;
  const n = latin2SectionLessonNumber(sectionId);
  if (n === null) return null;
  const folio = ctx.section.folio;
  return {
    id: LATIN2_SECTION_BASE_ID + n,
    title: ctx.section.title,
    subtitle: ctx.part.title,
    concept: `The book's own exercises for ${ctx.section.title} (${BOOK2_SOURCE}${
      folio != null ? `, p. ${folio}` : ""
    }) — captured verbatim by the capture pipeline.`,
    exercises,
  };
}

/**
 * The grammar-index topics a section trains (LATIN2_SECTION_GRAMMAR_REFS),
 * resolved to GRAMMAR_INDEX entries in the section's own order. Unknown topic
 * ids are skipped — the index is data-owned; the seam never invents topics.
 */
export function latin2SectionGrammarTopics(
  sectionId: string,
): GrammarTopic[] {
  const ids = LATIN2_SECTION_GRAMMAR_REFS[sectionId] ?? [];
  const topics: GrammarTopic[] = [];
  for (const id of ids) {
    const topic = GRAMMAR_INDEX.find((t) => t.id === id);
    if (topic) topics.push(topic);
  }
  return topics;
}
