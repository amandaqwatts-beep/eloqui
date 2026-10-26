// Verbum — Latin 2 (Henle Second Year Latin, 1943): the STRUCTURAL skeleton.
//
// ⚠️ STRUCTURE, NOT CONTENT. This file carries the book's wayfinding —
// parts, sections, and folio anchors, pulled (pull-don't-rephrase) from the
// book's own CONTENTS pages as mapped in
// research/henle-owner-notes/latin2-folio-map.md (587 rows, integrity-
// checked). There are NO lessons, exercises, or Latin text here. The capture
// pipeline fills this skeleton later: folio-first vision reads → the content
// team's lesson modules hang off these section ids.
//
// Owner directives encoded here (plan rev 74, 2026-10-20/21):
//   • Exercises 1–16 (Part IV review) run SIMULTANEOUS with reading from day
//     one — pure First Year review while the reading ramps up. Both reading
//     paths share this spine.
//   • TWO READING PATHS: Path 1 = the book's own adapted Caesar stories
//     (Part II) as designed. Path 2 = all the Caesar in order — read in the
//     ORIGINAL'S OWN BOOK (Caesar's Gallic War, Book 3 on this shelf) as
//     companion reading, harder because LONGER. Students pick their
//     difficulty; both paths share the Exercises 1–16 spine.
//   • Provenance: the owner's copy is a post-1952 printing; the PD-1943 text
//     stays the structural spine. Folio numbers below are the book's own.

import type { Exercise } from "./latinLessons";

/** Status of a structural node. "awaiting-capture" = structure only;
 *  "captured" = the capture pipeline has attached exercise content keyed by
 *  the section id (see LATIN2_SECTION_EXERCISES below). */
export type Latin2SectionStatus = "awaiting-capture" | "captured";

/** A section = a capture unit the content team fills (story / lesson / list). */
export interface Latin2Section {
  /** Stable section id — content modules hang off this ("part2-story-1"). */
  id: string;
  /** The book's own heading (pull-don't-rephrase). */
  title: string;
  /** Printed folio the section starts on (from the folio map / contents). */
  folio: number | null;
  status: Latin2SectionStatus;
}

/** A part of the book — the spine's top-level grouping. */
export interface Latin2Part {
  id: string;
  /** The book's own part title. */
  title: string;
  /** The book's subtitle/running description where it has one. */
  subtitle?: string;
  /** Folio range the part spans, from the map ([start, end]). */
  folioRange: [number, number | null];
  sections: Latin2Section[];
}

// ── Part I — English background (pp. 3–13) ──────────────────────────────
const PART_1: Latin2Part = {
  id: "part-1",
  title: "Julius Caesar and Roman Imperialism in Gaul",
  subtitle: "English background readings",
  folioRange: [3, 13],
  sections: [
    { id: "part1-1-caesar", title: "Caesar", folio: 3, status: "awaiting-capture" },
    { id: "part1-2-caesar-as-a-leader", title: "Caesar as a Leader", folio: 8, status: "awaiting-capture" },
    { id: "part1-3-imperialism", title: "Imperialism", folio: 10, status: "awaiting-capture" },
    { id: "part1-4-gallic-side", title: "The Contest from the Gallic Side", folio: 12, status: "awaiting-capture" },
    { id: "part1-5-roman-side", title: "The Contest from the Roman Side", folio: 13, status: "awaiting-capture" },
  ],
};

// ── Part II — the book's adapted Caesar (pp. 17–265), 11 stories ────────
// These 11 stories ARE Path 1's reading skeleton. Titles + folios verbatim
// from the contents page (map: IMG_1136).
const PART_2: Latin2Part = {
  id: "part-2",
  title: "Roman Imperialism in Gaul",
  subtitle: "As reported by Julius Caesar — the book's eleven adapted stories",
  folioRange: [17, 265],
  sections: [
    { id: "part2-story-1-helvetii", title: "The Helvetian Drive to the West", folio: 17, status: "awaiting-capture" },
    { id: "part2-story-2-german-peril", title: "The German Peril", folio: 51, status: "awaiting-capture" },
    { id: "part2-story-3-belgians", title: "Conspiracy among the Belgians", folio: 55, status: "awaiting-capture" },
    { id: "part2-story-4-alps", title: "Danger in the Alps", folio: 68, status: "awaiting-capture" },
    { id: "part2-story-5-seacoast", title: "Revolt along the Seacoast", folio: 73, status: "awaiting-capture" },
    { id: "part2-story-6-usipetes", title: "The Massacre of the Usipetes", folio: 90, status: "awaiting-capture" },
    { id: "part2-story-7-britain", title: "The First Invasion of Britain", folio: 99, status: "awaiting-capture" },
    { id: "part2-story-8-north", title: "Rebellion in the North", folio: 125, status: "awaiting-capture" },
    { id: "part2-story-9-all-gaul", title: "All Gaul in Arms", folio: 169, status: "awaiting-capture" },
    { id: "part2-story-10-civil-war", title: "The Civil War", folio: 262, status: "awaiting-capture" },
    { id: "part2-story-11-morte-caesaris", title: "Dē Morte Caesaris", folio: 264, status: "awaiting-capture" },
  ],
};

// ── Part III — the Passion narrative (pp. ~267–303) ─────────────────────
// The map gives 17 titled readings (contents IMG_1136–1138); the skeleton
// carries the part + folio span, and the sections ride along as structure.
const PART_3: Latin2Part = {
  id: "part-3",
  title: "Jēsus Christus, Rēx Rēgum",
  subtitle: "The Passion narrative and medieval readings",
  folioRange: [267, 303],
  sections: [
    { id: "part3-1-introduction", title: "Introduction", folio: 269, status: "awaiting-capture" },
    { id: "part3-2-pilatus", title: "Christus, dē rēgnō suō rogātus, Pilātō respondet", folio: 272, status: "awaiting-capture" },
    { id: "part3-3-regnum", title: "Rēgnum meum nōn est dē hōc mundō", folio: 274, status: "awaiting-capture" },
    { id: "part3-4-preface-mass", title: "From the Preface of the Mass of Christ the King", folio: 275, status: "awaiting-capture" },
    { id: "part3-5-prayer-mass", title: "Prayer from the Mass of Christ the King", folio: 277, status: "awaiting-capture" },
    { id: "part3-6-legibus", title: "Dē lēgibus rēgnī Christī", folio: 278, status: "awaiting-capture" },
    { id: "part3-7-commission", title: "The Commission to the Apostles", folio: 282, status: "awaiting-capture" },
    { id: "part3-8-christus-ipsum", title: "Dē Christō Ipsō", folio: 283, status: "awaiting-capture" },
    { id: "part3-9-souls-answer", title: "The Soul's Answer to Christ's Call", folio: 285, status: "awaiting-capture" },
    { id: "part3-10-short-story", title: "The World's Greatest Short Story", folio: 287, status: "awaiting-capture" },
    { id: "part3-11-never-man-spoke", title: "Never Did Man Speak as This Man!", folio: 291, status: "awaiting-capture" },
    { id: "part3-12-christmas-hymn", title: "The Greatest Christmas Hymn of All", folio: 293, status: "awaiting-capture" },
    { id: "part3-13-orient-kings", title: "And the Kings of the Orient Came…", folio: 296, status: "awaiting-capture" },
    { id: "part3-14-innocents", title: "In Festō Sānctōrum Innocentium", folio: 298, status: "awaiting-capture" },
    { id: "part3-15-tantum-ergo", title: "Tantum Ergō", folio: 300, status: "awaiting-capture" },
    { id: "part3-16-salutaris", title: "Ō Salūtāris Hostia", folio: 301, status: "awaiting-capture" },
    { id: "part3-17-students-lament", title: "The Student's Lament", folio: 302, status: "awaiting-capture" },
  ],
};

// ── Part IV — exercises + Caesar reading (pp. 305–550) ──────────────────
// L1–L16 (pp. 305–394) = the review spine BOTH paths share — the dictated
// opening: exercises run simultaneous with reading from day one. L17–L32
// (pp. 395–550) = the Caesar-reading exercise ladder; then the continuous
// passages and end-of-book apparatus.
const PART_4: Latin2Part = {
  id: "part-4",
  title: "Exercises Based on Caesar",
  subtitle: "Review Lessons 1–16 (the shared spine) then the Caesar-reading ladder",
  folioRange: [305, 550],
  sections: [
    { id: "part4-l01-nouns-sum", title: "Lesson 1 — Third-Declension Nouns; Sum", folio: 305, status: "captured" },
    { id: "part4-l02-adjectives", title: "Lesson 2 — Review of Adjectives", folio: 309, status: "awaiting-capture" },
    { id: "part4-l03-indicative-questions", title: "Lesson 3 — Indicative Active, the Four Conjugations and -iō; Direct Questions", folio: 313, status: "awaiting-capture" },
    { id: "part4-l04-pres-subj", title: "Lesson 4 — Present Subjunctive Active", folio: 320, status: "awaiting-capture" },
    { id: "part4-l05-subj-indirect", title: "Lesson 5 — Subjunctive Active; Indirect Questions; Sequence of Tenses", folio: 327, status: "awaiting-capture" },
    { id: "part4-l06-pronouns", title: "Lesson 6 — Personal Pronouns", folio: 333, status: "awaiting-capture" },
    { id: "part4-l07-passive", title: "Lesson 7 — Indicative Passive", folio: 343, status: "awaiting-capture" },
    { id: "part4-l08-hic-is-ille", title: "Lesson 8 — Hic, Is, Ille", folio: 348, status: "awaiting-capture" },
    { id: "part4-l09-subj-purpose", title: "Lesson 9 — Subjunctive Passive; Purpose Clauses", folio: 352, status: "awaiting-capture" },
    { id: "part4-l10-adj-dative", title: "Lesson 10 — Other Third-Declension Adjectives; Dative Verbs", folio: 356, status: "awaiting-capture" },
    { id: "part4-l11-deponents-cum", title: "Lesson 11 — Deponents; Cum-Temporal Clauses", folio: 362, status: "awaiting-capture" },
    { id: "part4-l12-comparison-quam", title: "Lesson 12 — Comparison of Adjectives; Quam", folio: 367, status: "awaiting-capture" },
    { id: "part4-l13-relative", title: "Lesson 13 — Relative Clauses", folio: 375, status: "awaiting-capture" },
    { id: "part4-l14-irreg-comparison", title: "Lesson 14 — Irregular Comparison", folio: 380, status: "awaiting-capture" },
    { id: "part4-l15-eo-extent", title: "Lesson 15 — Eō; Accusative of Extent", folio: 386, status: "awaiting-capture" },
    { id: "part4-l16-adverbs", title: "Lesson 16 — Formation and Comparison of Adverbs", folio: 390, status: "awaiting-capture" },
    { id: "part4-l17-adj-numerals", title: "Lesson 17 — Irregular Adjectives; Numerals", folio: 395, status: "awaiting-capture" },
    { id: "part4-l18-fero-ipse", title: "Lesson 18 — Ferō Passive; Īpse; Perfect Participle Passive", folio: 404, status: "awaiting-capture" },
    { id: "part4-l19-possum-infinitive", title: "Lesson 19 — Possum; Infinitive as Noun", folio: 419, status: "awaiting-capture" },
    { id: "part4-l20-aci", title: "Lesson 20 — Accusative with the Infinitive", folio: 432, status: "awaiting-capture" },
    { id: "part4-l21-abl-absolute", title: "Lesson 21 — Ablative Absolute; Interrogative Adjective", folio: 446, status: "awaiting-capture" },
    { id: "part4-l22-pres-participle", title: "Lesson 22 — Present Participle Active; Ablative Absolute (cont.)", folio: 454, status: "awaiting-capture" },
    { id: "part4-l23-volo-temporal", title: "Lesson 23 — Volō; Temporal Clauses", folio: 462, status: "awaiting-capture" },
    { id: "part4-l24-fio-ut", title: "Lesson 24 — Fīō; Noun Ut-Clauses", folio: 470, status: "awaiting-capture" },
    { id: "part4-l25-result-time", title: "Lesson 25 — Result and Characteristic Clauses; Rules for Time", folio: 476, status: "awaiting-capture" },
    { id: "part4-l26-gerund", title: "Lesson 26 — The Gerund", folio: 484, status: "awaiting-capture" },
    { id: "part4-l27-gerundive", title: "Lesson 27 — The Gerundive", folio: 491, status: "awaiting-capture" },
    { id: "part4-l28-gerundive-cont", title: "Lesson 28 — The Gerundive (cont.)", folio: 500, status: "awaiting-capture" },
    { id: "part4-l29-voc-imperative", title: "Lesson 29 — Vocative; Imperative", folio: 505, status: "awaiting-capture" },
    { id: "part4-l30-description", title: "Lesson 30 — Genitive and Ablative of Description", folio: 514, status: "awaiting-capture" },
    { id: "part4-l31-causal", title: "Lesson 31 — Causal Clauses", folio: 517, status: "awaiting-capture" },
    { id: "part4-l32-double-dative", title: "Lesson 32 — Dative of Purpose; Double Dative", folio: 519, status: "awaiting-capture" },
    { id: "part4-continuous-passages", title: "Continuous Passages for Translation", folio: 521, status: "awaiting-capture" },
    { id: "part4-classified-review", title: "Classified Review Exercises", folio: 526, status: "awaiting-capture" },
    { id: "part4-chronological-table", title: "Chronological Table", folio: 544, status: "awaiting-capture" },
    { id: "part4-wtr-review", title: "Recognition Review of Words to Remember", folio: 546, status: "awaiting-capture" },
  ],
};

// ── End matter (pp. 551+; capture ends mid-dictionary at 584) ───────────
const END_MATTER: Latin2Part = {
  id: "end-matter",
  title: "End Matter",
  subtitle: "The book's own reference apparatus — the Latin-1↔Latin-2 vocab cross-link lives here",
  folioRange: [551, null],
  sections: [
    // The Classified Word List's asterisk marks second-year words vs the FY
    // required vocabulary — a built-in Book 1 ↔ Book 2 cross-link (map).
    { id: "end-classified-word-list", title: "Classified Word List (551 entries; asterisk = second-year word)", folio: 551, status: "awaiting-capture" },
    { id: "end-latin-english", title: "Latin-English Vocabulary", folio: 585, status: "awaiting-capture" },
    { id: "end-english-latin", title: "English-Latin Vocabulary", folio: 624, status: "awaiting-capture" },
  ],
};

/**
 * Book 2's parts in book order. The shell renders this as the structural
 * outline; the capture pipeline replaces each section's "awaiting-capture"
 * with real content modules keyed by section id.
 */
export const LATIN2_STRUCTURE: Latin2Part[] = [
  PART_1,
  PART_2,
  PART_3,
  PART_4,
  END_MATTER,
];

// ── The two reading paths (owner directive, plan rev 74) ────────────────

export type Latin2PathId = "book" | "caesar";

export interface Latin2Path {
  id: Latin2PathId;
  /** Printed on the selector, per the owner's own framing. */
  title: string;
  /** One-line description of what the student actually reads. */
  description: string;
  /** Honest difficulty framing — why the path is harder. */
  difficulty: string;
  /** What the path opens with, once content lands. */
  opensWith: string;
  /**
   * The companion-reading bridge (plan rev 75, owner 2026-10-25): Path 2
   * reads the full campaign in the ORIGINAL'S OWN BOOK on this shelf, not
   * inside this textbook. Points at the shelf book by bookKey. Path 1 stays
   * inside Book 2 — no bridge.
   */
  bridgesTo?: { bookKey: string; label: string };
}

export const LATIN2_PATHS: Latin2Path[] = [
  {
    id: "book",
    title: "Follow the Book",
    description:
      "The book's own path: eleven adapted Caesar stories from the Helvetii to Dē Morte Caesaris (Part II), built for second-year students.",
    difficulty: "The book's pace — adapted throughout.",
    opensWith: "Story 1 — The Helvetian Drive to the West (p. 17)",
  },
  {
    id: "caesar",
    title: "All the Caesar, in Order",
    description:
      "Caesar's own account read in sequence, as companion reading to the exercises. The full campaign is read in the original's own book on this shelf — Caesar's Gallic War (Book III) — adapted for readability as part of that book.",
    difficulty: "Harder — not denser, just longer: the whole campaign, in order.",
    opensWith: "The Gallic War from the beginning — in Caesar's Gallic War (Book III), capture pending",
    bridgesTo: { bookKey: "latin-gallic-war", label: "Caesar's Gallic War — Book III on this shelf" },
  },
];

/**
 * The shared spine: Exercises 1–16 (Part IV, pp. 305–394). Both paths run
 * these simultaneous with reading from day one — they begin as pure First
 * Year review while the reading ramps up through the review stretch.
 */
export const LATIN2_EXERCISES_SPINE = {
  id: "exercises-spine",
  title: "Exercises 1–16 — the review spine",
  description:
    "Review of First Year material: both reading paths run these exercises simultaneous with the reading from day one. The exercises begin as pure review while the reading slowly amps up.",
  folioRange: [305, 394] as [number, number],
  /** Part IV L1–L16 carry the spine (section ids). */
  sectionIds: PART_4.sections.slice(0, 16).map((s) => s.id),
};

/** Part IV sections past the spine (the Caesar-reading ladder, L17+). */
export function latin2ReadingLadder(): Latin2Section[] {
  return PART_4.sections.slice(16);
}

// ── Captured exercise content — the seam the capture pipeline fills ──────
// Exercises transcribed PULL-DON'T-REPHRASE from the owner's photo archive
// (Henle Second Year Latin, Part IV), keyed by LATIN2_STRUCTURE section id.
// Capture notes (verbatim directions, item counts, flags):
//   research/henle-owner-notes/latin2-captures/part04-e1-e6.md
// Ids are namespaced sy-e{1..6}-q{n}, q numbering sequential within the
// Lesson (matching the book's own exercise/item numbering). Answer keys
// cite Henle Grammar rule numbers verified against the §-numbered archive.
// Rendering: Book2Shell does not yet surface this record (screens/engine own
// the UI) — the data seam stays clean here.
export const LATIN2_SECTION_EXERCISES: Record<string, Exercise[]> = {
  "part4-l01-nouns-sum": [
    { type: "flashcard", id: "sy-e1-q1", prompt: "SY Ex. 1.1 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "clāmor", back: "gen. sg. clāmōris — m. (-or, ERROR §48) — acc. sg. clāmōrem — “a shout, clamor” — abl. sg. clāmōre — nom. pl. clāmōrēs — gen. pl. clāmōrum", hint: "SY Part IV Lesson 1, Exercise 1.1 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q2", prompt: "SY Ex. 1.2 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "dux", back: "gen. sg. ducis — m. (male person, §46) — acc. sg. ducem — “a leader” — abl. sg. duce — nom. pl. ducēs — gen. pl. ducum", hint: "SY Part IV Lesson 1, Exercise 1.2 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q3", prompt: "SY Ex. 1.3 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "eques", back: "gen. sg. equitis — m. (male person, §46) — acc. sg. equitem — “a horseman, rider” — abl. sg. equite — nom. pl. equitēs — gen. pl. equitum", hint: "SY Part IV Lesson 1, Exercise 1.3 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q4", prompt: "SY Ex. 1.4 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "frāter", back: "gen. sg. frātris — m. (-er, ERROR §48) — acc. sg. frātrem — “a brother” — abl. sg. frātre — nom. pl. frātrēs — gen. pl. frātrum (§62a)", hint: "SY Part IV Lesson 1, Exercise 1.4 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q5", prompt: "SY Ex. 1.5 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "homō", back: "gen. sg. hominis — m. (male person, §46 — applied before SOX) — acc. sg. hominem — “a man, human being” — abl. sg. homine — nom. pl. hominēs — gen. pl. hominum", hint: "SY Part IV Lesson 1, Exercise 1.5 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q6", prompt: "SY Ex. 1.6 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "imperātor", back: "gen. sg. imperātōris — m. (-or, ERROR §48) — acc. sg. imperātōrem — “a commander, general” — abl. sg. imperātōre — nom. pl. imperātōrēs — gen. pl. imperātōrum", hint: "SY Part IV Lesson 1, Exercise 1.6 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q7", prompt: "SY Ex. 1.7 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "legiō", back: "gen. sg. legiōnis — f. (-ō, SOX §50) — acc. sg. legiōnem — “a legion” — abl. sg. legiōne — nom. pl. legiōnēs — gen. pl. legiōnum (i-stem)", hint: "SY Part IV Lesson 1, Exercise 1.7 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q8", prompt: "SY Ex. 1.8 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "lēx", back: "gen. sg. lēgis — f. (-x, SOX §50) — acc. sg. lēgem — “a law” — abl. sg. lēge — nom. pl. lēgēs — gen. pl. lēgum", hint: "SY Part IV Lesson 1, Exercise 1.8 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q9", prompt: "SY Ex. 1.9 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "māter", back: "gen. sg. mātris — f. (female person, §47) — acc. sg. mātrem — “a mother” — abl. sg. mātre — nom. pl. mātrēs — gen. pl. mātrum (§62a)", hint: "SY Part IV Lesson 1, Exercise 1.9 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q10", prompt: "SY Ex. 1.10 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "mīles", back: "gen. sg. mīlitis — m. (male person, §46) — acc. sg. mīlitem — “a soldier” — abl. sg. mīlite — nom. pl. mīlitēs — gen. pl. mīlitum", hint: "SY Part IV Lesson 1, Exercise 1.10 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q11", prompt: "SY Ex. 1.11 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "pater", back: "gen. sg. patris — m. (male person, §46) — acc. sg. patrem — “a father” — abl. sg. patre — nom. pl. patrēs — gen. pl. patrum (§62a)", hint: "SY Part IV Lesson 1, Exercise 1.11 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q12", prompt: "SY Ex. 1.12 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "princeps", back: "gen. sg. principis — m. (male person, §46) — acc. sg. principem — “a chief, leader” — abl. sg. principe — nom. pl. principēs — gen. pl. principum", hint: "SY Part IV Lesson 1, Exercise 1.12 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q13", prompt: "SY Ex. 1.13 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "rēx", back: "gen. sg. rēgis — m. (male person, §46) — acc. sg. rēgem — “a king” — abl. sg. rēge — nom. pl. rēgēs — gen. pl. rēgum", hint: "SY Part IV Lesson 1, Exercise 1.13 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q14", prompt: "SY Ex. 1.14 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "virtūs", back: "gen. sg. virtūtis — f. (-s, SOX §50) — acc. sg. virtūtem — “courage, virtue” — abl. sg. virtūte — nom. pl. virtūtēs — gen. pl. virtūtum", hint: "SY Part IV Lesson 1, Exercise 1.14 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q15", prompt: "SY Ex. 1.15 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "cohors", back: "gen. sg. cohortis — f. (-s, SOX §50) — acc. sg. cohortem — “a cohort” — abl. sg. cohorte — nom. pl. cohortēs — gen. pl. cohortum", hint: "SY Part IV Lesson 1, Exercise 1.15 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q16", prompt: "SY Ex. 1.16 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "vōx", back: "gen. sg. vōcis — f. (-x, SOX §50) — acc. sg. vōcem — “a voice” — abl. sg. vōce — nom. pl. vōcēs — gen. pl. vōcum", hint: "SY Part IV Lesson 1, Exercise 1.16 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q17", prompt: "SY Ex. 1.17 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "collis", back: "gen. sg. collis — m. (exception — gender marked in vocab) — acc. sg. collem — “a hill” — abl. sg. colle — nom. pl. collēs — gen. pl. collium (i-stem, double consonant)", hint: "SY Part IV Lesson 1, Exercise 1.17 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q18", prompt: "SY Ex. 1.18 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "gēns", back: "gen. sg. gentis — f. (-s, SOX §50) — acc. sg. gentem — “a clan, race, tribe” — abl. sg. gente — nom. pl. gentēs — gen. pl. gentium (§61)", hint: "SY Part IV Lesson 1, Exercise 1.18 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q19", prompt: "SY Ex. 1.19 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "hostis", back: "gen. sg. hostis — m. (male person, §46) — acc. sg. hostem — “an enemy” — abl. sg. hoste — nom. pl. hostēs — gen. pl. hostium (§60)", hint: "SY Part IV Lesson 1, Exercise 1.19 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q20", prompt: "SY Ex. 1.20 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "mōns", back: "gen. sg. montis — m. (exception — gender marked in vocab) — acc. sg. montem — “a mountain” — abl. sg. monte — nom. pl. montēs — gen. pl. montium (§61)", hint: "SY Part IV Lesson 1, Exercise 1.20 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q21", prompt: "SY Ex. 1.21 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "pars", back: "gen. sg. partis — f. (-s, SOX §50) — acc. sg. partem — “a part” — abl. sg. parte — nom. pl. partēs — gen. pl. partium (§61)", hint: "SY Part IV Lesson 1, Exercise 1.21 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q22", prompt: "SY Ex. 1.22 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "pōns", back: "gen. sg. pontis — m. (exception — gender marked in vocab) — acc. sg. pontem — “a bridge” — abl. sg. ponte — nom. pl. pontēs — gen. pl. pontium (§61)", hint: "SY Part IV Lesson 1, Exercise 1.22 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q23", prompt: "SY Ex. 1.23 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "ōrātiō", back: "gen. sg. ōrātiōnis — f. (-ō, SOX §50) — acc. sg. ōrātiōnem — “a speech, prayer” — abl. sg. ōrātiōne — nom. pl. ōrātiōnēs — gen. pl. ōrātiōnum (i-stem)", hint: "SY Part IV Lesson 1, Exercise 1.23 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q24", prompt: "SY Ex. 1.24 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "urbs", back: "gen. sg. urbis — f. (-s, SOX §50) — acc. sg. urbem — “a city” — abl. sg. urbe — nom. pl. urbēs — gen. pl. urbium (§61)", hint: "SY Part IV Lesson 1, Exercise 1.24 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q25", prompt: "SY Ex. 1.25 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "agmen", back: "gen. sg. agminis — n. (-n, LANCET §51) — acc. sg. agmen — “a line of march, column” — abl. sg. agmine — nom. pl. agmina — gen. pl. agminum", hint: "SY Part IV Lesson 1, Exercise 1.25 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q26", prompt: "SY Ex. 1.26 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "flūmen", back: "gen. sg. flūminis — n. (-n, LANCET §51) — acc. sg. flūmen — “a river” — abl. sg. flūmine — nom. pl. flūmina — gen. pl. flūminum", hint: "SY Part IV Lesson 1, Exercise 1.26 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q27", prompt: "SY Ex. 1.27 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "obses", back: "gen. sg. obsidis — m. (male person, §46) — acc. sg. obsidem — “a hostage” — abl. sg. obside — nom. pl. obsidēs — gen. pl. obsidum", hint: "SY Part IV Lesson 1, Exercise 1.27 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q28", prompt: "SY Ex. 1.28 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "iter", back: "gen. sg. itineris — n. (exception — gender marked in vocab) — acc. sg. iter — “a journey, march” — abl. sg. itinere — nom. pl. itinera — gen. pl. itinerum", hint: "SY Part IV Lesson 1, Exercise 1.28 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q29", prompt: "SY Ex. 1.29 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "nōmen", back: "gen. sg. nōminis — n. (-n, LANCET §51) — acc. sg. nōmen — “a name” — abl. sg. nōmine — nom. pl. nōmina — gen. pl. nōminum", hint: "SY Part IV Lesson 1, Exercise 1.29 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q30", prompt: "SY Ex. 1.30 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "vulnus", back: "gen. sg. vulneris — n. (-us with -ris, §52) — acc. sg. vulnus — “a wound” — abl. sg. vulnere — nom. pl. vulnera — gen. pl. vulnerum", hint: "SY Part IV Lesson 1, Exercise 1.30 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q31", prompt: "SY Ex. 1.31 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "centuriō", back: "gen. sg. centuriōnis — m. (male person, §46) — acc. sg. centuriōnem — “a centurion” — abl. sg. centuriōne — nom. pl. centuriōnēs — gen. pl. centuriōnum (i-stem)", hint: "SY Part IV Lesson 1, Exercise 1.31 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q32", prompt: "SY Ex. 1.32 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "cīvitās", back: "gen. sg. cīvitātis — f. (-s, SOX §50) — acc. sg. cīvitātem — “a state, citizenship” — abl. sg. cīvitāte — nom. pl. cīvitātēs — gen. pl. cīvitātum", hint: "SY Part IV Lesson 1, Exercise 1.32 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q33", prompt: "SY Ex. 1.33 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "cōnsul", back: "gen. sg. cōnsulis — m. (male person, §46) — acc. sg. cōnsulem — “a consul” — abl. sg. cōnsule — nom. pl. cōnsulēs — gen. pl. cōnsulum", hint: "SY Part IV Lesson 1, Exercise 1.33 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q34", prompt: "SY Ex. 1.34 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular; nominative plural; genitive plural and covering rule.", front: "classis", back: "gen. sg. classis — f. (-s, SOX §50) — acc. sg. classem — “a fleet” — abl. sg. classī or classe (f.305 fn. ¹) — nom. pl. classēs — gen. pl. classium (§60)", hint: "SY Part IV Lesson 1, Exercise 1.34 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q35", prompt: "SY Ex. 2.1 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "Caesar", back: "gen. sg. Caesaris — m. (male person, §46) — acc. sg. Caesarem — “Caesar” — abl. sg. Caesare", hint: "SY Part IV Lesson 1, Exercise 2.1 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q36", prompt: "SY Ex. 2.2 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "lūx", back: "gen. sg. lūcis — f. (-x, SOX §50) — acc. sg. lūcem — “light” — abl. sg. lūce", hint: "SY Part IV Lesson 1, Exercise 2.2 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q37", prompt: "SY Ex. 2.3 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "timor", back: "gen. sg. timōris — m. (-or, ERROR §48) — acc. sg. timōrem — “fear” — abl. sg. timōre", hint: "SY Part IV Lesson 1, Exercise 2.3 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q38", prompt: "SY Ex. 2.4 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "lībertās", back: "gen. sg. lībertātis — f. (-s, SOX §50) — acc. sg. lībertātem — “liberty” — abl. sg. lībertāte", hint: "SY Part IV Lesson 1, Exercise 2.4 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q39", prompt: "SY Ex. 2.5 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "salūs", back: "gen. sg. salūtis — f. (-s, SOX §50) — acc. sg. salūtem — “safety, salvation, welfare” — abl. sg. salūte", hint: "SY Part IV Lesson 1, Exercise 2.5 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q40", prompt: "SY Ex. 2.6 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "vēritās", back: "gen. sg. vēritātis — f. (-s, SOX §50) — acc. sg. vēritātem — “truth” — abl. sg. vēritāte", hint: "SY Part IV Lesson 1, Exercise 2.6 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q41", prompt: "SY Ex. 2.7 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "caedēs", back: "gen. sg. caedis — f. (-s, SOX §50) — acc. sg. caedem — “slaughter” — abl. sg. caede", hint: "SY Part IV Lesson 1, Exercise 2.7 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q42", prompt: "SY Ex. 2.8 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "mors", back: "gen. sg. mortis — f. (-s, SOX §50) — acc. sg. mortem — “death” — abl. sg. morte", hint: "SY Part IV Lesson 1, Exercise 2.8 (p. 306)" },
    { type: "flashcard", id: "sy-e1-q43", prompt: "SY Ex. 2.9 — Give: genitive singular; gender and covering rule; accusative singular; meaning; ablative singular.", front: "auctōritās", back: "gen. sg. auctōritātis — f. (-s, SOX §50) — acc. sg. auctōritātem — “authority, influence” — abl. sg. auctōritāte", hint: "SY Part IV Lesson 1, Exercise 2.9 (p. 306)" },
    { type: "fill-in-blank", id: "sy-e1-q44", prompt: "Complete the Latin and translate (SY Ex. 3.1): Propter mortem patr……… et mātr……… et frātrum.", answer: "em", explanation: "both gaps: patrem, mātrem — propter takes the accusative; frātrum = gen. pl.", },
    { type: "fill-in-blank", id: "sy-e1-q45", prompt: "Complete the Latin and translate (SY Ex. 3.2): In nōmin……… Deī.", before: "In nōmin", after: " Deī.", answer: "e", explanation: "nōmine — ablative after in (locative sense: in the name of God)", },
    { type: "fill-in-blank", id: "sy-e1-q46", prompt: "Complete the Latin and translate (SY Ex. 3.3): Propter auctōritāt……… Deī.", before: "Propter auctōritāt", after: " Deī.", answer: "em", explanation: "auctōritātem — propter takes the accusative", },
    { type: "fill-in-blank", id: "sy-e1-q47", prompt: "Complete the Latin and translate (SY Ex. 3.4): Cum timōr………", before: "Cum timōr", after: "", answer: "e", },
    { type: "fill-in-blank", id: "sy-e1-q48", prompt: "Complete the Latin and translate (SY Ex. 3.5): In class………", before: "In class", after: "", answer: "e", acceptableAnswers: ["e", "\u012b"] },
    { type: "fill-in-blank", id: "sy-e1-q49", prompt: "Complete the Latin and translate (SY Ex. 3.6): Dux propter timōr………", before: "Dux propter timōr", after: "", answer: "em", },
    { type: "fill-in-blank", id: "sy-e1-q50", prompt: "Complete the Latin and translate (SY Ex. 3.7): Pars hostium in itiner……… fuit.", before: "Pars hostium in itiner", after: " fuit.", answer: "e", explanation: "itinere — ablative after in", },
    { type: "fill-in-blank", id: "sy-e1-q51", prompt: "Complete the Latin and translate (SY Ex. 3.8): Caesar et Bibulus cōnsul……… erant.", before: "Caesar et Bibulus cōnsul", after: " erant.", answer: "ēs", explanation: "cōnsulēs — nominative plural (two consuls)", },
    { type: "fill-in-blank", id: "sy-e1-q52", prompt: "Complete the Latin and translate (SY Ex. 3.9): Imperātor cum mīlit……… in montibus erit.", before: "Imperātor cum mīlit", after: " in montibus erit.", answer: "ibus", explanation: "mīlitibus — cum + ablative", },
    { type: "fill-in-blank", id: "sy-e1-q53", prompt: "Complete the Latin and translate (SY Ex. 3.10): Agmen hostium in flūmin……… erat.", before: "Agmen hostium in flūmin", after: " erat.", answer: "e", explanation: "flūmine — ablative after in", },
    { type: "fill-in-blank", id: "sy-e1-q54", prompt: "Complete the Latin and translate (SY Ex. 3.11): Propter salūtem homin………", before: "Propter salūtem homin", after: "", answer: "um", },
    { type: "fill-in-blank", id: "sy-e1-q55", prompt: "Complete the Latin and translate (SY Ex. 3.12): Propter Gallōrum lībertāt………", before: "Propter Gallōrum lībertāt", after: "", answer: "em", },
    { type: "fill-in-blank", id: "sy-e1-q56", prompt: "Complete the Latin and translate (SY Ex. 3.13): Christus est rēx homin………", before: "Christus est rēx homin", after: "", answer: "um", },
    { type: "fill-in-blank", id: "sy-e1-q57", prompt: "Complete the Latin and translate (SY Ex. 3.14): Cohortēs cum cōnsul……… fuērunt.", before: "Cohortēs cum cōnsul", after: " fuērunt.", answer: "e", explanation: "cōnsule — cum + ablative", },
    { type: "fill-in-blank", id: "sy-e1-q58", prompt: "Complete the Latin and translate (SY Ex. 3.15): Post Rōmānōrum victōriās nōn erat lībertās in Gallōrum cīvitāt………", before: "Post Rōmānōrum victōriās nōn erat lībertās in Gallōrum cīvitāt", after: "", answer: "ibus", },
    { type: "fill-in-blank", id: "sy-e1-q59", prompt: "Translate (SY Ex. 4.1): Christus est spēs nostra.", answer: "Christ is our hope.", acceptableAnswers: ["Christ is our hope"], explanation: "spēs (italicized in the book) is a predicate nominative agreeing with its subject-complement sense — explain the agreement" },
    { type: "fill-in-blank", id: "sy-e1-q60", prompt: "Translate (SY Ex. 4.2): Grātiā Deī, ego et tū Christiānī sumus.", answer: "By the grace of God, we are Christians.", acceptableAnswers: ["By the grace of God I and you are Christians", "By the grace of God, I and you are Christians"], explanation: "sumus (italicized) — 1st pl. with ego et tū as compound subject; Christiānī agrees" },
    { type: "fill-in-blank", id: "sy-e1-q61", prompt: "Translate (SY Ex. 4.3): Tū et cōnsulēs in urbe erātis.", answer: "You and the consuls were in the city.", acceptableAnswers: ["You and the consuls were in the city"], explanation: "erātis (italicized) — 2nd pl. with tū et cōnsulēs" },
    { type: "fill-in-blank", id: "sy-e1-q62", prompt: "Translate (SY Ex. 4.4): Ego Christiānus sum et tū.", answer: "I am a Christian, and you (too).", acceptableAnswers: ["I am a Christian and you", "I am a Christian, and you too"], explanation: "sum (italicized) — 1st sg. with ego" },
    { type: "fill-in-blank", id: "sy-e1-q63", prompt: "Translate (SY Ex. 4.5): In nostrā cīvitāte lībertās est et pāx.", answer: "In our state there is liberty and peace.", acceptableAnswers: ["In our city there is liberty and peace", "In our state there is liberty and peace"], explanation: "lībertās and pāx are compound predicate nominatives" },
    { type: "fill-in-blank", id: "sy-e1-q64", prompt: "Translate (SY Ex. 5.1): Post victōriam Caesaris in Gallōrum cīvitātibus nōn erat lībertās.", answer: "After Caesar's victory there was no liberty in the states of the Gauls.", acceptableAnswers: ["After the victory of Caesar there was not liberty in the states of the Gauls", "After Caesar's victory there was no liberty in the states of the Gauls"], explanation: "lībertās (italicized) stands at the end for emphasis — explain the position" },
    { type: "fill-in-blank", id: "sy-e1-q65", prompt: "Translate (SY Ex. 5.2): Christus propter nostram salūtem in mundum vēnit.", answer: "Christ came into the world on account of our salvation.", acceptableAnswers: ["Christ came into the world because of our salvation", "Christ came into the world for our salvation"], explanation: "vēnit (italicized) — verb placed last; propter + accusative" },
    { type: "fill-in-blank", id: "sy-e1-q66", prompt: "Translate (SY Ex. 6.1): Signum Christiānōrum est signum sānctae crucis.", answer: "The sign of the Christians is the sign of the holy cross.", acceptableAnswers: ["The sign of the Christians is the sign of the holy cross"] },
    { type: "fill-in-blank", id: "sy-e1-q67", prompt: "Translate (SY Ex. 6.2): In cruce Christī est nostra salūs.", answer: "In the cross of Christ is our salvation.", acceptableAnswers: ["In the cross of Christ is our salvation"] },
    { type: "fill-in-blank", id: "sy-e1-q68", prompt: "Translate (SY Ex. 6.3): In voluntāte Deī est nostra pāx.", answer: "In the will of God is our peace.", acceptableAnswers: ["In the will of God is our peace"] },
    { type: "fill-in-blank", id: "sy-e1-q69", prompt: "Translate (SY Ex. 6.4): Christus est lūx mundī.", answer: "Christ is the light of the world.", acceptableAnswers: ["Christ is the light of the world"] },
  ],
};

/** Grammar-index topic ids (src/data/grammarIndex.ts) each captured section
 *  trains — populated at birth per the weave policy. */
export const LATIN2_SECTION_GRAMMAR_REFS: Record<string, string[]> = {
  "part4-l01-nouns-sum": [
    "third-declension",
    "third-declension-i-stems",
    "verb-sum",
    "predicate-adjectives",
  ],
};
