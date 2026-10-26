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
    { id: "part4-l02-adjectives", title: "Lesson 2 — Review of Adjectives", folio: 309, status: "captured" },
    { id: "part4-l03-indicative-questions", title: "Lesson 3 — Indicative Active, the Four Conjugations and -iō; Direct Questions", folio: 313, status: "captured" },
    { id: "part4-l04-pres-subj", title: "Lesson 4 — Present Subjunctive Active", folio: 320, status: "captured" },
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
  "part4-l02-adjectives": [
    { type: "flashcard", id: "sy-e2-q1", prompt: "SY Ex. 7.1 — Decline:", front: "homō miser", back: "sg: homō miser, hominis miseri, hominī miserō, hominem miserum, homine miserō · pl: hominēs miserī, hominum miserōrum, hominibus miserīs, hominēs miserōs, hominibus miserīs", hint: "SY Part IV Lesson 2, Exercise 7.1 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q2", prompt: "SY Ex. 7.2 — Decline:", front: "urbs nōbilis", back: "sg: urbs nōbilis, urbis nōbilis, urbī nōbilī, urbem nōbilem, urbe nōbilī · pl: urbēs nōbilēs, urbium nōbilium, urbibus nōbilibus, urbēs nōbilēs, urbibus nōbilibus", hint: "SY Part IV Lesson 2, Exercise 7.2 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q3", prompt: "SY Ex. 7.3 — Decline:", front: "magna rēs", back: "sg: magna rēs, magnae reī, magnae reī, magnam rem, magnā rē · pl: magnae rēs, magnārum rērum, magnīs rēbus, magnās rēs, magnīs rēbus (5th decl.)", hint: "SY Part IV Lesson 2, Exercise 7.3 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q4", prompt: "SY Ex. 7.4 — Decline:", front: "mīles integer", back: "sg: mīles integer, mīlitis integrī, mīlitī integrō, mīlitem integrum, mīlite integrō · pl: mīlitēs integrī, mīlitum integrōrum, mīlitibus integrīs, mīlitēs integrōs, mīlitibus integrīs", hint: "SY Part IV Lesson 2, Exercise 7.4 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q5", prompt: "SY Ex. 7.5 — Decline:", front: "perīculum grave", back: "sg: perīculum grave, perīculī gravis, perīculō gravī, perīculum grave, perīculō gravī · pl: perīcula gravia, perīculōrum gravium, perīculīs gravibus, perīcula gravia, perīculīs gravibus (neuter)", hint: "SY Part IV Lesson 2, Exercise 7.5 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q6", prompt: "SY Ex. 7.6 — Decline:", front: "cīvitās misera", back: "sg: cīvitās misera, cīvitātis miserae, cīvitātī miserae, cīvitātem miseram, cīvitāte miserā · pl: cīvitātēs miserae, cīvitātum miserārum, cīvitātibus miserīs, cīvitātēs miserās, cīvitātibus miserīs", hint: "SY Part IV Lesson 2, Exercise 7.6 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q7", prompt: "SY Ex. 7.7 — Decline:", front: "rēs difficilis", back: "sg: rēs difficilis, reī difficilis, reī difficilī, rem difficilem, rē difficilī · pl: rēs difficilēs, rērum difficilium, rēbus difficilibus, rēs difficilēs, rēbus difficilibus", hint: "SY Part IV Lesson 2, Exercise 7.7 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q8", prompt: "SY Ex. 7.8 — Decline:", front: "magna castra", back: "pl. only (3rd decl. n.): magna castra, magnōrum castrōrum, magnīs castrīs, magna castra, magnīs castrīs", hint: "SY Part IV Lesson 2, Exercise 7.8 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q9", prompt: "SY Ex. 7.9 — Decline:", front: "imperium fīrmum", back: "sg: imperium fīrmum, imperiī fīrmī, imperiō fīrmō, imperium fīrmum, imperiō fīrmō · pl: imperia fīrma, imperiōrum fīrmōrum, imperiīs fīrmīs, imperia fīrma, imperiīs fīrmīs", hint: "SY Part IV Lesson 2, Exercise 7.9 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q10", prompt: "SY Ex. 7.10 — Decline:", front: "locus idōneus", back: "sg: locus idōneus, locī idōneī, locō idōneō, locum idōneum, locō idōneō · pl: loca idōnea (the book's own plural), locōrum idōneōrum, locīs idōneīs, loca idōnea, locīs idōneīs", hint: "SY Part IV Lesson 2, Exercise 7.10 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q11", prompt: "SY Ex. 7.11 — Decline:", front: "amīcus fīrmus", back: "sg: amīcus fīrmus, amīcī fīrmī, amīcō fīrmō, amīcum fīrmum, amīcō fīrmō · pl: amīcī fīrmī, amīcōrum fīrmōrum, amīcīs fīrmīs, amīcōs fīrmōs, amīcīs fīrmīs", hint: "SY Part IV Lesson 2, Exercise 7.11 (p. 310)" },
    { type: "flashcard", id: "sy-e2-q12", prompt: "SY Ex. 7.12 — Decline:", front: "vir fortis", back: "sg: vir fortis, virī fortis, virō fortī, virum fortem, virō fortī · pl: virī fortēs, virōrum fortium, virīs fortibus, virōs fortēs, virīs fortibus", hint: "SY Part IV Lesson 2, Exercise 7.12 (p. 310)" },
    { type: "fill-in-blank", id: "sy-e2-q10", prompt: "Translate (SY Ex. 8.1): Plūrimī hominēs bonī sunt.", answer: "Very many men are good.", acceptableAnswers: ["Very many men are good"], explanation: "bonī (italicized) — nom. pl. masc. agreeing with hominēs" },
    { type: "fill-in-blank", id: "sy-e2-q11", prompt: "Translate (SY Ex. 8.2): Gallī erant barbarī.", answer: "The Gauls were barbarians.", acceptableAnswers: ["The Gauls were barbarians", "The Gauls were barbarous"], explanation: "barbarī (italicized) — predicate nom. pl. masc. agreeing with Gallī" },
    { type: "fill-in-blank", id: "sy-e2-q12", prompt: "Translate (SY Ex. 8.3): Imperium Rōmānum fīrmum erat.", answer: "The Roman empire was strong.", acceptableAnswers: ["The Roman empire was strong"], explanation: "Rōmānum and fīrmum (italicized) — nom. sg. neut. agreeing with imperium" },
    { type: "fill-in-blank", id: "sy-e2-q13", prompt: "Translate (SY Ex. 8.4): Cīvitās Americānōrum est fīrma.", answer: "The state of the Americans is strong.", acceptableAnswers: ["The American state is strong", "The state of the Americans is strong"], explanation: "fīrma (italicized) — nom. sg. fem. agreeing with cīvitās" },
    { type: "fill-in-blank", id: "sy-e2-q14", prompt: "Translate (SY Ex. 8.5): Vīta hominum brevis est.", answer: "The life of men is short.", acceptableAnswers: ["The life of men is short", "Man's life is short"], explanation: "brevis (italicized) — nom. sg. fem. agreeing with vīta" },
    { type: "fill-in-blank", id: "sy-e2-q15", prompt: "Translate (SY Ex. 8.6): Iter difficile erat.", answer: "The journey was difficult.", acceptableAnswers: ["The journey was difficult", "The march was difficult"], explanation: "difficile (italicized) — nom. sg. neut. agreeing with iter" },
    { type: "fill-in-blank", id: "sy-e2-q16", prompt: "Translate (SY Ex. 8.7): Vīta hominum fortium nōbilis est.", answer: "The life of brave men is noble.", acceptableAnswers: ["The life of brave men is noble"], explanation: "fortium (italicized) — gen. pl. masc. agreeing with hominum" },
    { type: "fill-in-blank", id: "sy-e2-q17", prompt: "Translate (SY Ex. 8.8): Nōn omnēs lēgēs gravēs sunt.", answer: "Not all laws are serious.", acceptableAnswers: ["Not all laws are serious"], explanation: "omnēs … gravēs (italicized) — nom. pl. fem. agreeing with lēgēs" },
    { type: "fill-in-blank", id: "sy-e2-q18", prompt: "Translate (SY Ex. 8.9): Iter agminis breve et facile erit.", answer: "The march of the column will be short and easy.", acceptableAnswers: ["The journey of the column will be short and easy", "The march of the column will be short and easy"], explanation: "breve et facile (italicized) — nom. sg. neut. agreeing with iter" },
    { type: "fill-in-blank", id: "sy-e2-q19", prompt: "Translate into Latin (SY Ex. 9.1): The Way of the Cross was short but difficult.", answer: "Via crucis brevis sed difficilis erat.", acceptableAnswers: ["Via crucis erat brevis sed difficilis", "Via crucis brevis sed difficilis erat"] },
    { type: "fill-in-blank", id: "sy-e2-q20", prompt: "Translate into Latin (SY Ex. 9.2): Brave men will be renowned.", answer: "Virī fortēs nōbilēs erunt.", acceptableAnswers: ["Fortēs virī nōbilēs erunt", "Virī fortēs clārī erunt"] },
    { type: "fill-in-blank", id: "sy-e2-q21", prompt: "Translate into Latin (SY Ex. 9.3): The state has not always been strong.", answer: "Cīvitās nōn semper fīrma fuit.", acceptableAnswers: ["Cīvitās nōn semper fīrma erat", "Cīvitās semper nōn fīrma fuit"] },
    { type: "fill-in-blank", id: "sy-e2-q22", prompt: "Translate into Latin (SY Ex. 9.4): The column is not short.", answer: "Agmen nōn breve est.", acceptableAnswers: ["Agmen nōn est breve", "Agmen longum nōn est"] },
    { type: "fill-in-blank", id: "sy-e2-q23", prompt: "Translate into Latin (SY Ex. 9.5): The route will be difficult.", answer: "Iter difficile erit.", acceptableAnswers: ["Iter erit difficile"] },
    { type: "fill-in-blank", id: "sy-e2-q24", prompt: "Translate into Latin (SY Ex. 9.6): Very many men are barbarians.", answer: "Plūrimī hominēs barbarī sunt.", acceptableAnswers: ["Plūrimī sunt hominēs barbarī", "Plūrimī hominēs sunt barbarī"] },
    { type: "fill-in-blank", id: "sy-e2-q25", prompt: "Translate into Latin (SY Ex. 9.7): The Roman cohort was not large.", answer: "Cohors Rōmāna nōn magna erat.", acceptableAnswers: ["Cohors Rōmāna nōn erat magna", "Cohors Rōmāna parva erat"] },
    { type: "fill-in-blank", id: "sy-e2-q26", prompt: "Translate (SY Ex. 10.1): Plūrimī glōriae cupidi sunt.", answer: "Very many (men) are eager for glory.", acceptableAnswers: ["Very many men are eager for glory", "The very greatest number are eager for glory"], explanation: "glōriae (italicized) — gen. sg. object of cupidus, a, um (+ gen.)" },
    { type: "fill-in-blank", id: "sy-e2-q27", prompt: "Translate (SY Ex. 10.2): Bella perīculōrum plēna sunt.", answer: "The wars are full of dangers.", acceptableAnswers: ["The wars are full of dangers"], explanation: "perīculōrum (italicized) — gen. pl. after plēnus (+ gen.)" },
    { type: "fill-in-blank", id: "sy-e2-q28", prompt: "Translate (SY Ex. 10.3): Mexicānī fīnitimī nōbīs sunt.", answer: "The Mexicans are neighbors to us.", acceptableAnswers: ["The Mexicans are our neighbors"], explanation: "nōbīs (italicized) — dat. after fīnitimus (+ dat.)" },
    { type: "fill-in-blank", id: "sy-e2-q29", prompt: "Translate (SY Ex. 10.4): Castra Caesaris saepe flūminī proxima fuērunt.", answer: "Caesar's camp was often near the river.", acceptableAnswers: ["The camp of Caesar was often near the river"], explanation: "flūminī (italicized) — dat. after proximus (+ dat.)" },
    { type: "fill-in-blank", id: "sy-e2-q30", prompt: "Translate (SY Ex. 10.5): Castra plēna armīs sunt.", answer: "The camp is full of arms.", acceptableAnswers: ["The camps are full of arms"], explanation: "armīs (italicized) — abl. after plēnus (plēnus takes the gen. or abl.)" },
    { type: "fill-in-blank", id: "sy-e2-q33", prompt: "Translate into Latin (SY Ex. 11.1): A hill is suitable for a camp.", answer: "Collis castrīs idōneus est.", acceptableAnswers: ["Collis ad castra idōneus est", "Collis castris idoneus est"], explanation: "idōneus takes the dat. or ad + acc. (f.310 teaching)" },
    { type: "fill-in-blank", id: "sy-e2-q34", prompt: "Translate into Latin (SY Ex. 11.2): The Helvetians were next to the Roman province.", answer: "Helvētiī prōvinciae Rōmānae proximī erant.", acceptableAnswers: ["Helvetii provinciae Romanae proximi erant", "Helvētiī erant proximī prōvinciae Rōmānae"], explanation: "proximus takes the dat.; Helvētiī, Helvētiōrum (fn. ²)" },
    { type: "fill-in-blank", id: "sy-e2-q35", prompt: "Translate into Latin (SY Ex. 11.3): Most men are eager for peace.", answer: "Plūrimī hominēs pācis cupidi sunt.", acceptableAnswers: ["Plurimi homines pacis cupidi sunt"], explanation: "cupidus takes the gen.: pācis" },
    { type: "fill-in-blank", id: "sy-e2-q36", prompt: "Translate into Latin (SY Ex. 11.4): Mary was “full of grace.”", answer: "Maria “plēna grātiae” erat.", acceptableAnswers: ["Maria plena gratiae erat"], explanation: "plēnus takes the gen.: grātiae" },
    { type: "fill-in-blank", id: "sy-e2-q37", prompt: "Translate into Latin (SY Ex. 11.5): The Romans were eager for glory.", answer: "Rōmānī glōriae cupidi erant.", acceptableAnswers: ["Romani gloriae cupidi erant"], explanation: "cupidus takes the gen.: glōriae" },
    { type: "fill-in-blank", id: "sy-e2-q38", prompt: "Translate into Latin (SY Ex. 11.6): The lives of very many men were full of toil.", answer: "Vītae hominum plūrimōrum plēnae labōris erant.", acceptableAnswers: ["Vitae hominum plurimorum plenae laboris erant"], explanation: "plēnus takes the gen.: labōris (toil, labor, labōris)" },
    { type: "fill-in-blank", id: "sy-e2-q39", prompt: "Translate into Latin (SY Ex. 11.7): All men are desirous of liberty.", answer: "Omnēs hominēs lībertātis cupidi sunt.", acceptableAnswers: ["Omnes homines libertatis cupidi sunt"], explanation: "the f.310 model sentence: Omnēs hominēs lībertātis cupidi sunt." },
    { type: "fill-in-blank", id: "sy-e2-q40", prompt: "Translate and memorize (SY Ex. 12): Via virtūtis fortī est facilis.", answer: "The way of courage is easy for the brave (man).", acceptableAnswers: ["The way of valor is easy for the brave","The way of courage is easy for the brave man","The path of courage is easy for the brave"], explanation: "The book's NOTE: via may be translated as path; fortī is an adjective used as a noun, a dative translated as for or to." }
  ],  "part4-l03-indicative-questions": [
    { type: "flashcard", id: "sy-e3-q1", prompt: "SY Ex. 13.A.1 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "pācō", back: "pres. pācat / pācant (he pacifies, is pacifying, does pacify / they pacify…) · impf. pācābat / pācābant · fut. pācābit / pācābunt · perf. pācāvit / pācāvērunt · plupf. pācāverat / pācāverant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q2", prompt: "SY Ex. 13.A.2 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "moneō", back: "pres. monet / monent · impf. monēbat / monēbant · fut. monēbit / monēbunt · perf. monuit / monuērunt · plupf. monuerat / monuerant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q3", prompt: "SY Ex. 13.A.3 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "capiō", back: "pres. capit / capiunt · impf. capiēbat / capiēbant · fut. capiet / capient · perf. cēpit / cēpērunt · plupf. cēperat / cēperant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q4", prompt: "SY Ex. 13.A.4 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "teneō", back: "pres. tenet / tenent · impf. tenēbat / tenēbant · fut. tenēbit / tenēbunt · perf. tenuit / tenuērunt · plupf. tenuerat / tenuerant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q5", prompt: "SY Ex. 13.A.5 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "audiō", back: "pres. audit / audiunt · impf. audiēbat / audiēbant · fut. audiet / audient · perf. audīvit / audīvērunt · plupf. audīverat / audīverant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q6", prompt: "SY Ex. 13.A.6 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "mittō", back: "pres. mittit / mittunt · impf. mittēbat / mittēbant · fut. mittet / mittent · perf. mīsit / mīsērunt · plupf. mīserat / mīserant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q7", prompt: "SY Ex. 13.A.7 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "mūniō", back: "pres. mūnīt / mūniunt · impf. mūniēbat / mūniēbant · fut. mūniet / mūnient · perf. mūnīvit / mūnīvērunt · plupf. mūnīverat / mūnīverant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q8", prompt: "SY Ex. 13.A.8 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "fugiō", back: "pres. fugit / fugiunt · impf. fugiēbat / fugiēbant · fut. fugiet / fugient · perf. fūgit / fūgērunt · plupf. fūgerat / fūgerant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q9", prompt: "SY Ex. 13.A.9 — Give the 3rd person, singular and plural, of the indicative active (except of the future perfect), and translate each form, giving three meanings for the present:", front: "pugnō", back: "pres. pugnat / pugnant · impf. pugnābat / pugnābant · fut. pugnābit / pugnābunt · perf. pugnāvit / pugnāvērunt · plupf. pugnāverat / pugnāverant", hint: "SY Part IV Lesson 3, Exercise 13.A (p. 314)" },
    { type: "flashcard", id: "sy-e3-q10", prompt: "SY Ex. 13.B.1 — Identify the form and translate:", front: "timent", back: "3 pl. present of timeō — they fear, are fearing, do fear", hint: "SY Part IV Lesson 3, Exercise 13.B.1 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q11", prompt: "SY Ex. 13.B.2 — Identify the form and translate:", front: "incolent", back: "3 pl. future of incolō — they will inhabit, will dwell in", hint: "SY Part IV Lesson 3, Exercise 13.B.2 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q12", prompt: "SY Ex. 13.B.3 — Identify the form and translate:", front: "capient", back: "3 pl. future of capiō — they will take, will capture", hint: "SY Part IV Lesson 3, Exercise 13.B.3 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q13", prompt: "SY Ex. 13.B.4 — Identify the form and translate:", front: "laudābitis", back: "2 pl. future of laudō — you will praise", hint: "SY Part IV Lesson 3, Exercise 13.B.4 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q14", prompt: "SY Ex. 13.B.5 — Identify the form and translate:", front: "cēpērunt", back: "3 pl. perfect of capiō — they took, have captured, did capture", hint: "SY Part IV Lesson 3, Exercise 13.B.5 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q15", prompt: "SY Ex. 13.B.6 — Identify the form and translate:", front: "fugiēbās", back: "2 sg. imperfect of fugiō — you were fleeing, kept fleeing, used to flee", hint: "SY Part IV Lesson 3, Exercise 13.B.6 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q16", prompt: "SY Ex. 13.B.7 — Identify the form and translate:", front: "vīdistī", back: "2 sg. perfect of videō — you saw, have seen, did see", hint: "SY Part IV Lesson 3, Exercise 13.B.7 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q17", prompt: "SY Ex. 13.B.8 — Identify the form and translate:", front: "monuistī", back: "2 sg. perfect of moneō — you warned, have warned", hint: "SY Part IV Lesson 3, Exercise 13.B.8 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q18", prompt: "SY Ex. 13.B.9 — Identify the form and translate:", front: "cupiēbam", back: "1 sg. imperfect of cupiō — I was desiring, kept desiring, used to desire", hint: "SY Part IV Lesson 3, Exercise 13.B.9 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q19", prompt: "SY Ex. 13.B.10 — Identify the form and translate:", front: "faciam", back: "1 sg. future of faciō — I shall do, shall make", hint: "SY Part IV Lesson 3, Exercise 13.B.10 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q20", prompt: "SY Ex. 13.B.11 — Identify the form and translate:", front: "jēcerant", back: "3 pl. pluperfect of jaciō — they had thrown", hint: "SY Part IV Lesson 3, Exercise 13.B.11 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q21", prompt: "SY Ex. 13.B.12 — Identify the form and translate:", front: "mittet", back: "3 sg. future of mittō — he will send", hint: "SY Part IV Lesson 3, Exercise 13.B.12 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q22", prompt: "SY Ex. 13.B.13 — Identify the form and translate:", front: "capit", back: "3 sg. present of capiō — he takes, is taking, does take", hint: "SY Part IV Lesson 3, Exercise 13.B.13 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q23", prompt: "SY Ex. 13.B.14 — Identify the form and translate:", front: "fēcērunt", back: "3 pl. perfect of faciō — they did, made", hint: "SY Part IV Lesson 3, Exercise 13.B.14 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q24", prompt: "SY Ex. 13.B.15 — Identify the form and translate:", front: "cupiunt", back: "3 pl. present of cupiō — they desire, are desiring, do desire", hint: "SY Part IV Lesson 3, Exercise 13.B.15 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q25", prompt: "SY Ex. 13.B.16 — Identify the form and translate:", front: "jacimus", back: "1 pl. present of jaciō — we throw, are throwing, do throw", hint: "SY Part IV Lesson 3, Exercise 13.B.16 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q26", prompt: "SY Ex. 13.B.17 — Identify the form and translate:", front: "veniēs", back: "2 sg. future of veniō — you will come", hint: "SY Part IV Lesson 3, Exercise 13.B.17 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q27", prompt: "SY Ex. 13.B.18 — Identify the form and translate:", front: "monēbō", back: "1 sg. future of moneō — I shall warn", hint: "SY Part IV Lesson 3, Exercise 13.B.18 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q28", prompt: "SY Ex. 13.B.19 — Identify the form and translate:", front: "fūgerat", back: "3 sg. pluperfect of fugiō — he had fled", hint: "SY Part IV Lesson 3, Exercise 13.B.19 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q29", prompt: "SY Ex. 13.B.20 — Identify the form and translate:", front: "mīsit", back: "3 sg. perfect of mittō — he sent, has sent, did send", hint: "SY Part IV Lesson 3, Exercise 13.B.20 (p. 314)" },
    { type: "flashcard", id: "sy-e3-q30", prompt: "SY Ex. 13.B.21 — Identify the form and translate:", front: "faciēbat", back: "3 sg. imperfect of faciō — he was doing/making, kept doing, used to do", hint: "SY Part IV Lesson 3, Exercise 13.B.21 (p. 314)" },
    { type: "fill-in-blank", id: "sy-e3-q31", prompt: "Translate (SY Ex. 14.A.1): Galliam pācat.", answer: "He pacifies Gaul.", acceptableAnswers: ["He is pacifying Gaul", "He does pacify Gaul", "He pacifies Gaul"] },
    { type: "fill-in-blank", id: "sy-e3-q32", prompt: "Translate (SY Ex. 14.A.2): Galliam incolunt.", answer: "They inhabit Gaul." },
    { type: "fill-in-blank", id: "sy-e3-q33", prompt: "Translate (SY Ex. 14.A.3): Iter facit.", answer: "He marches (makes a journey).", acceptableAnswers: ["He is marching", "He does march", "He makes a journey"] },
    { type: "fill-in-blank", id: "sy-e3-q34", prompt: "Translate (SY Ex. 14.A.4): Ducem monet.", answer: "He warns the leader." },
    { type: "fill-in-blank", id: "sy-e3-q35", prompt: "Translate (SY Ex. 14.A.5): Pontem faciunt.", answer: "They build a bridge." },
    { type: "fill-in-blank", id: "sy-e3-q36", prompt: "Translate (SY Ex. 14.A.6): Fugit.", answer: "He flees.", acceptableAnswers: ["He is fleeing", "He does flee"] },
    { type: "fill-in-blank", id: "sy-e3-q37", prompt: "Translate (SY Ex. 14.A.7): Mortem timent.", answer: "They fear death." },
    { type: "fill-in-blank", id: "sy-e3-q38", prompt: "Translate (SY Ex. 14.A.8): Amīcōs adjuvant.", answer: "They help (their) friends." },
    { type: "fill-in-blank", id: "sy-e3-q39", prompt: "Translate (SY Ex. 14.A.9): Glōriam petunt.", answer: "They seek glory." },
    { type: "fill-in-blank", id: "sy-e3-q40", prompt: "Translate (SY Ex. 14.A.10): Tēla jaciunt.", answer: "They hurl weapons.", acceptableAnswers: ["They throw darts", "They are hurling darts", "They hurl darts"] },
    { type: "fill-in-blank", id: "sy-e3-q41", prompt: "Translate (SY Ex. 14.A.11): Castra mūnīt.", answer: "He fortifies the camp.", acceptableAnswers: ["He is fortifying the camp", "He does fortify the camp"] },
    { type: "fill-in-blank", id: "sy-e3-q42", prompt: "Translate (SY Ex. 14.A.12): Vōcēs audiunt.", answer: "They hear voices." },
    { type: "fill-in-blank", id: "sy-e3-q43", prompt: "Translate (SY Ex. 14.A.13): Impetum sustinent.", answer: "They withstand the attack." },
    { type: "fill-in-blank", id: "sy-e3-q44", prompt: "Translate (SY Ex. 14.A.14): Clāmōrem audit.", answer: "He hears the shout." },
    { type: "fill-in-blank", id: "sy-e3-q45", prompt: "Translate (SY Ex. 14.A.15): Viam mūniunt.", answer: "They fortify the road." },
    { type: "fill-in-blank", id: "sy-e3-q46", prompt: "Translate (SY Ex. 14.A.16): Imperium cupiunt.", answer: "They desire power (empire).", acceptableAnswers: ["They desire the empire", "They long for power"] },
    { type: "fill-in-blank", id: "sy-e3-q47", prompt: "Translate (SY Ex. 14.A.17): Urbem capit.", answer: "He captures the city.", acceptableAnswers: ["He is capturing the city", "He takes the city", "He does capture the city"] },
    { type: "fill-in-blank", id: "sy-e3-q48", prompt: "Translate (SY Ex. 14.B.1): Rōmānī Galliam pācāvērunt.", answer: "The Romans pacified Gaul." },
    { type: "fill-in-blank", id: "sy-e3-q49", prompt: "Translate (SY Ex. 14.B.2): Gallī, hominēs fortēs, Galliam incolēbant.", answer: "The Gauls, brave men, were inhabiting Gaul.", acceptableAnswers: ["The Gauls, brave men, inhabited Gaul", "Brave men, the Gauls, were dwelling in Gaul"] },
    { type: "fill-in-blank", id: "sy-e3-q50", prompt: "Translate (SY Ex. 14.B.3): Dux multa itinera fēcit.", answer: "The leader made many marches.", acceptableAnswers: ["The general made many marches", "The leader made a good many marches"] },
    { type: "fill-in-blank", id: "sy-e3-q51", prompt: "Translate (SY Ex. 14.B.4): Servī bonī ducem monuērunt.", answer: "The good slaves warned the leader." },
    { type: "fill-in-blank", id: "sy-e3-q52", prompt: "Translate (SY Ex. 14.B.5): Caesar pontem in flūmine fēcit.", answer: "Caesar built a bridge over the river." },
    { type: "fill-in-blank", id: "sy-e3-q53", prompt: "Translate (SY Ex. 14.B.6): Barbarī in magnās silvās fugiēbant.", answer: "The barbarians were fleeing into the great forests." },
    { type: "fill-in-blank", id: "sy-e3-q54", prompt: "Translate (SY Ex. 14.B.7): Hominēs malī mortem timent.", answer: "Bad men fear death." },
    { type: "fill-in-blank", id: "sy-e3-q55", prompt: "Translate (SY Ex. 14.B.8): Amīcī fīrmī et fortēs amīcōs adjuvābunt.", answer: "Strong and brave friends will help (their) friends." },
    { type: "fill-in-blank", id: "sy-e3-q56", prompt: "Translate (SY Ex. 14.B.9): Rēgēs glōriae cupidī bella petunt.", answer: "Kings, eager for glory, seek wars." },
    { type: "fill-in-blank", id: "sy-e3-q57", prompt: "Translate (SY Ex. 14.B.10): Barbarī plūrima tēla jaciēbant.", answer: "The barbarians were hurling very many weapons." },
    { type: "fill-in-blank", id: "sy-e3-q58", prompt: "Translate (SY Ex. 14.B.11): Imperātor castra mūniēbat.", answer: "The general was fortifying the camp." },
    { type: "fill-in-blank", id: "sy-e3-q59", prompt: "Translate (SY Ex. 14.B.12): Mīles vōcēs hostium audivit.", answer: "The soldier heard the voices of the enemy." },
    { type: "fill-in-blank", id: "sy-e3-q60", prompt: "Translate (SY Ex. 14.B.13): Mīlitēs firmī impetum sustinēbunt.", answer: "The firm soldiers will withstand the attack." },
    { type: "fill-in-blank", id: "sy-e3-q61", prompt: "Translate (SY Ex. 14.B.14): Rōmānī hostium clāmōrem audivērunt.", answer: "The Romans heard the shout of the enemy." },
    { type: "fill-in-blank", id: "sy-e3-q62", prompt: "Translate (SY Ex. 14.B.15): Rōmānī viās per prōvinciās mūnivērunt.", answer: "The Romans fortified roads through the provinces.", acceptableAnswers: ["The Romans fortified roads across the provinces"] },
    { type: "fill-in-blank", id: "sy-e3-q63", prompt: "Translate (SY Ex. 14.B.16): Rēgēs et imperātōrēs imperium cupiēbant.", answer: "Kings and generals were desiring empire.", acceptableAnswers: ["Kings and generals strongly desired empire"] },
    { type: "fill-in-blank", id: "sy-e3-q64", prompt: "Translate (SY Ex. 14.B.17): Rōmānī multās et magnās urbēs cēpērunt.", answer: "The Romans captured many and great cities." },
    { type: "fill-in-blank", id: "sy-e3-q65", prompt: "Translate (SY Ex. 14.C.1): Rōmānī, imperiī cupidi, Galliam pācāvērunt.", answer: "The Romans, eager for empire, pacified Gaul." },
    { type: "fill-in-blank", id: "sy-e3-q66", prompt: "Translate (SY Ex. 14.C.2): Gallī, hominēs barbarī atque fortēs, Galliam incoluērunt.", answer: "The Gauls, barbarous and brave men, inhabited Gaul.", acceptableAnswers: ["The Gauls, barbarous and brave men, were inhabiting Gaul"] },
    { type: "fill-in-blank", id: "sy-e3-q67", prompt: "Translate (SY Ex. 14.C.3): Ducēs Rōmānī, virī fortēs, multa et magna itinera fēcērunt.", answer: "The Roman leaders, brave men, made many and great marches." },
    { type: "fill-in-blank", id: "sy-e3-q68", prompt: "Translate (SY Ex. 14.C.4): Servī bonī ducem bonum monēbunt.", answer: "The good slaves will warn the good leader." },
    { type: "fill-in-blank", id: "sy-e3-q69", prompt: "Translate (SY Ex. 14.C.5): Caesar, vir magnus, pontem in flūmine altō et lātō fēcit.", answer: "Caesar, a great man, built a bridge over the deep and wide river." },
    { type: "fill-in-blank", id: "sy-e3-q70", prompt: "Translate (SY Ex. 14.C.6): Reliquī barbarī propter equitum metum in silvās fūgerant.", answer: "The remaining barbarians had fled into the forests because of fear of the horsemen." },
    { type: "fill-in-blank", id: "sy-e3-q71", prompt: "Translate (SY Ex. 14.C.7): Virī fīrmī et fortēs mortem nōn timēbunt.", answer: "Firm and brave men will not fear death." },
    { type: "fill-in-blank", id: "sy-e3-q72", prompt: "Translate (SY Ex. 14.C.8): Caesar amīcōs semper adjūvit.", answer: "Caesar always helped (his) friends." },
    { type: "fill-in-blank", id: "sy-e3-q73", prompt: "Translate (SY Ex. 14.C.9): Rēgēs victōriae et glōriae cupidī pācem cum fīnitimīs gentibus nōn petīvērunt.", answer: "Kings, eager for victory and glory, did not seek peace with neighboring nations." },
    { type: "fill-in-blank", id: "sy-e3-q74", prompt: "Translate (SY Ex. 14.C.10): Hostēs undique tēla in castra Rōmāna jēcērunt.", answer: "The enemy hurled weapons from every side into the Roman camp." },
    { type: "fill-in-blank", id: "sy-e3-q75", prompt: "Translate (SY Ex. 14.C.11): Imperātor Rōmānus propter magnum hostium numerum castra mūnīvit.", answer: "The Roman general fortified the camp on account of the great number of the enemy." },
    { type: "fill-in-blank", id: "sy-e3-q76", prompt: "Translate (SY Ex. 14.C.12): Mīlitēs vōcēs et clāmōrem servōrum miserōrum audiēbant.", answer: "The soldiers were hearing the voices and shout of the wretched slaves." },
    { type: "fill-in-blank", id: "sy-e3-q77", prompt: "Translate (SY Ex. 14.C.13): legiōnēs impetum barbarōrum fortium fortiter sustinuērunt.", answer: "The legions bravely withstood the attack of the brave barbarians." },
    { type: "fill-in-blank", id: "sy-e3-q78", prompt: "Translate (SY Ex. 14.C.14): Imperātor Rōmānus ōrātiōnem principum audivit.", answer: "The Roman general heard the speech of the chiefs." },
    { type: "fill-in-blank", id: "sy-e3-q79", prompt: "Translate (SY Ex. 14.C.15): Ducēs Rōmānī propter belli metum longās viās per prōvinciās mūniēbant.", answer: "The Roman leaders fortified long roads through the provinces on account of the fear of war." },
    { type: "fill-in-blank", id: "sy-e3-q80", prompt: "Translate (SY Ex. 14.C.16): Virī malī imperium vehementer cupiunt.", answer: "Bad men strongly desire empire." },
    { type: "fill-in-blank", id: "sy-e3-q81", prompt: "Translate (SY Ex. 14.C.17): Imperātōrēs Rōmānī plūrimās urbēs et oppida aliēnārum gentium capiēbant.", answer: "The Roman generals were capturing very many cities and towns of foreign nations." },
    { type: "fill-in-blank", id: "sy-e3-q82", prompt: "Translate into Latin (SY Ex. 15.1): He pacified Gaul.", answer: "Galliam pācāvit." },
    { type: "fill-in-blank", id: "sy-e3-q83", prompt: "Translate into Latin (SY Ex. 15.2): At dawn they fled.", answer: "Prīmā lūce fūgērunt.", acceptableAnswers: ["Prima luce fugerunt"] },
    { type: "fill-in-blank", id: "sy-e3-q84", prompt: "Translate into Latin (SY Ex. 15.3): Soldiers desire victory.", answer: "Mīlitēs victōriam cupiunt.", acceptableAnswers: ["Milites victoriam cupiunt"] },
    { type: "fill-in-blank", id: "sy-e3-q85", prompt: "Translate into Latin (SY Ex. 15.4): They hurled darts.", answer: "Tēla jēcērunt.", acceptableAnswers: ["Tela jecerunt"] },
    { type: "fill-in-blank", id: "sy-e3-q86", prompt: "Translate into Latin (SY Ex. 15.5): A good king makes a good kingdom.", answer: "Rēx bonus rēgnum bonum facit.", acceptableAnswers: ["Rex bonum regnum facit"] },
    { type: "fill-in-blank", id: "sy-e3-q87", prompt: "Translate into Latin (SY Ex. 15.6): Virtue makes a holy life.", answer: "Virtūs vītam sānctam facit.", acceptableAnswers: ["Virtus vitam sanctam facit"] },
    { type: "fill-in-blank", id: "sy-e3-q88", prompt: "Translate into Latin (SY Ex. 15.7): They captured the hill.", answer: "Collem cēpērunt.", acceptableAnswers: ["Collem ceperunt"] },
    { type: "fill-in-blank", id: "sy-e3-q89", prompt: "Translate into Latin (SY Ex. 15.8): They were fleeing into the mountains.", answer: "In montēs fugiēbant.", acceptableAnswers: ["In montes fugiebant"] },
    { type: "fill-in-blank", id: "sy-e3-q90", prompt: "Translate into Latin (SY Ex. 15.9): He is capturing the city.", answer: "Urbem capit.", acceptableAnswers: ["Urbem capit"] },
    { type: "fill-in-blank", id: "sy-e3-q91", prompt: "Translate into Latin (SY Ex. 15.10): Did you see the column?", answer: "Vīdistīne agmen?", acceptableAnswers: ["Vidistine agmen?", "Agmenne vīdistī?"] },
    { type: "fill-in-blank", id: "sy-e3-q92", prompt: "Translate into Latin (SY Ex. 15.11): After the battle there were bodies in the river and on the hill.", answer: "Post proelium corpora in flūmine et in collē erant.", acceptableAnswers: ["Post proelium corpora in flumine et in colle erant"] },
    { type: "fill-in-blank", id: "sy-e3-q93", prompt: "Translate into Latin (SY Ex. 15.12): They withstood the attack.", answer: "Impetum sustinuērunt.", acceptableAnswers: ["Impetum sustinuerunt"] },
    { type: "fill-in-blank", id: "sy-e3-q94", prompt: "Translate into Latin (SY Ex. 15.13): The sailors defend the harbor.", answer: "Nautae portum defendunt.", acceptableAnswers: ["Nautae portum defendunt"] },
    { type: "fill-in-blank", id: "sy-e3-q95", prompt: "Translate into Latin (SY Ex. 15.14): They were fighting with the barbarians.", answer: "Cum barbarīs pugnābant.", acceptableAnswers: ["Cum barbaris pugnabant", "Pugnābant cum barbarīs"] },
    { type: "fill-in-blank", id: "sy-e3-q96", prompt: "Translate into Latin (SY Ex. 15.15): The barbarians were throwing darts.", answer: "Barbarī tēla jaciēbant.", acceptableAnswers: ["Barbari tela jaciebant"] },
    { type: "fill-in-blank", id: "sy-e3-q97", prompt: "Translate into Latin (SY Ex. 15.16): The Gauls saw the standards of the Roman legion.", answer: "Gallī signa legiōnis Rōmānae vīdērunt.", acceptableAnswers: ["Galli signa legionis Romanae viderunt"] },
    { type: "fill-in-blank", id: "sy-e3-q98", prompt: "Translate into Latin (SY Ex. 15.17): There were slaves in the camp.", answer: "Servī in castrīs erant.", acceptableAnswers: ["Servi in castris erant"] },
    { type: "fill-in-blank", id: "sy-e3-q99", prompt: "Translate into Latin (SY Ex. 15.18): Many good men dwelt in Gaul.", answer: "Multī hominēs bonī in Galliā incolēbant.", acceptableAnswers: ["Multi boni homines in Gallia incolebant", "Multi homines boni in Gallia incoluerunt"] },
    { type: "fill-in-blank", id: "sy-e3-q100", prompt: "Translate into Latin (SY Ex. 15.19): He desired power.", answer: "Imperium cupiēbat.", acceptableAnswers: ["Imperium cupīvit", "Imperium cupiebat"] },
    { type: "fill-in-blank", id: "sy-e3-q101", prompt: "Translate into Latin (SY Ex. 15.20): The barbarians will capture the town.", answer: "Barbarī oppidum capient.", acceptableAnswers: ["Barbari oppidum capient"] },
    { type: "fill-in-blank", id: "sy-e3-q102", prompt: "Translate into Latin (SY Ex. 15.21): The legion was in serious danger.", answer: "Legiō in gravī perīculō erat.", acceptableAnswers: ["Legio in magno periculo erat", "Legio in gravi periculo erat"] },
    { type: "fill-in-blank", id: "sy-e3-q103", prompt: "Translate into Latin (SY Ex. 15.22): The soldier will pacify the barbarians.", answer: "Mīles barbarōs pācābit.", acceptableAnswers: ["Miles barbaros pacabit"] },
    { type: "fill-in-blank", id: "sy-e3-q104", prompt: "Translate into Latin (SY Ex. 15.23): They were marching into the province.", answer: "Iter in prōvinciam faciēbant.", acceptableAnswers: ["Iter in provinciam faciebant"] },
    { type: "fill-in-blank", id: "sy-e3-q105", prompt: "Translate into Latin (SY Ex. 15.24): He hurled a dart into the camp.", answer: "Tēlum in castra jēcit.", acceptableAnswers: ["Telum in castra jecit"] },
    { type: "fill-in-blank", id: "sy-e3-q106", prompt: "Translate into Latin (SY Ex. 15.25): Part of the column was on the bridge.", answer: "Pars agminis in ponte erat.", acceptableAnswers: ["Pars agminis in ponte erat"] },
    { type: "fill-in-blank", id: "sy-e3-q107", prompt: "Translate and answer in English (SY Ex. 16.A.1): Quid omnēs Christiānī cupiunt?", answer: "What do all Christians desire?", acceptableAnswers: ["What do all Christians long for"], explanation: "translate the question; the book's “answer in English” is the student's own" },
    { type: "fill-in-blank", id: "sy-e3-q108", prompt: "Translate and answer in English (SY Ex. 16.A.2): In quō est omnis spēs Christiānōrum?", answer: "In what is all the hope of Christians?", acceptableAnswers: ["In whom is all the hope of Christians"], explanation: "translate; “answer in English” is the student's own (in God — in Deō)" },
    { type: "fill-in-blank", id: "sy-e3-q109", prompt: "Translate and answer in English (SY Ex. 16.A.3): Quibus Deus grātiam dat?", answer: "To whom does God give grace?", explanation: "translate; the book's answer is the student's own" },
    { type: "fill-in-blank", id: "sy-e3-q110", prompt: "Translate and answer in English (SY Ex. 16.A.4): Quis fuit Pīlātus?", answer: "Who was Pilate?" },
    { type: "fill-in-blank", id: "sy-e3-q111", prompt: "Translate and answer in English (SY Ex. 16.A.5): Quī cum Rōmānīs in Galliā bellum gessērunt?", answer: "Who waged war with the Romans in Gaul?" },
    { type: "fill-in-blank", id: "sy-e3-q112", prompt: "Translate and answer in English (SY Ex. 16.A.6): Cuī grātiās prō omnibus rēbus agimus?", answer: "To whom do we give thanks for all things?" },
    { type: "fill-in-blank", id: "sy-e3-q113", prompt: "Translate and answer in English (SY Ex. 16.A.7): Quibuscum ad mortem Christum dūxērunt?", answer: "With whom did they lead Christ to death?" },
    { type: "fill-in-blank", id: "sy-e3-q114", prompt: "Translate and answer in English (SY Ex. 16.A.8): Cūjus nōmen semper laudāmus?", answer: "Whose name do we always praise?" },
    { type: "fill-in-blank", id: "sy-e3-q115", prompt: "Translate and answer in English (SY Ex. 16.A.9): Quōs pācāvit Caesar?", answer: "Whom did Caesar pacify?" },
    { type: "fill-in-blank", id: "sy-e3-q116", prompt: "Translate and answer in English (SY Ex. 16.A.10): Quōrum obsidēs Caesar occīdit?", answer: "Whose hostages did Caesar kill?" },
    { type: "fill-in-blank", id: "sy-e3-q117", prompt: "Translate and answer in Latin (SY Ex. 16.B.1): With whom did Caesar wage war?", answer: "Quibuscum Caesar bellum gessit?", acceptableAnswers: ["Cum quibus Caesar bellum gessit?", "Quibuscum bellum gessit Caesar?"] },
    { type: "fill-in-blank", id: "sy-e3-q118", prompt: "Translate and answer in Latin (SY Ex. 16.B.2): Whom did Caesar praise?", answer: "Quōs Caesar laudāvit?", acceptableAnswers: ["Quos Caesar laudavit?", "Quos laudāvit Caesar?"] },
    { type: "fill-in-blank", id: "sy-e3-q119", prompt: "Translate and answer in Latin (SY Ex. 16.B.3): What did Caesar desire?", answer: "Quid Caesar cupiēbat?", acceptableAnswers: ["Quid Caesar cupīvit?", "Quid cupiēbat Caesar?"] },
    { type: "fill-in-blank", id: "sy-e3-q120", prompt: "Translate and answer in Latin (SY Ex. 16.B.4): In whom do we place our hope?", answer: "In quō spem nostram pōnimus?", acceptableAnswers: ["In quo spem ponimus?", "In quō pōnimus spem nostram?"] },
    { type: "fill-in-blank", id: "sy-e3-q121", prompt: "Translate and answer in Latin (SY Ex. 16.B.5): Who conquered the Gauls?", answer: "Quī Gallōs vīcit?", acceptableAnswers: ["Qui Gallos vicit?", "Quī vīcit Gallōs?"] },
    { type: "fill-in-blank", id: "sy-e3-q122", prompt: "Translate and answer in Latin (SY Ex. 16.B.6): Whose fields did Caesar lay waste?", answer: "Cūjus agrōs Caesar vastāvit?", acceptableAnswers: ["Cujus agros Caesar vastavit?", "Cūjus Caesar agrōs vastāvit?"] },
    { type: "fill-in-blank", id: "sy-e3-q123", prompt: "Translate and answer in Latin (SY Ex. 16.B.7): With whose soldiers were the Gauls conquered?", answer: "Quōrum mīlitibus Gallī victī sunt?", acceptableAnswers: ["Quorum militibus Galli victi sunt", "Cum quōrum mīlitibus Gallī victī sunt?"] },
    { type: "fill-in-blank", id: "sy-e3-q124", prompt: "Translate and answer in Latin (SY Ex. 16.B.8): Who inhabited Gaul?", answer: "Quī Galliam incolēbant?", acceptableAnswers: ["Qui Galliam incoluerunt?", "Quī incolēbant Galliam?"] },
    { type: "fill-in-blank", id: "sy-e3-q125", prompt: "Translate and answer in Latin (SY Ex. 16.B.9): To whom will Christ give great rewards?", answer: "Cuī Christus praemia magna dabit?", acceptableAnswers: ["Cui Christus magna praemia dabit?", "Cuī Christus dabit praemia magna?"] },
    { type: "fill-in-blank", id: "sy-e3-q126", prompt: "Translate and answer in Latin (SY Ex. 16.B.10): Whom do you all praise?", answer: "Quōs laudātis?", acceptableAnswers: ["Quos laudatis?", "Quōs vōs laudātis?"] },
    { type: "fill-in-blank", id: "sy-e3-q127", prompt: "Translate (SY Ex. 17.A.1): Cūr Deum laudāmus?", answer: "Why do we praise God?" },
    { type: "fill-in-blank", id: "sy-e3-q128", prompt: "Translate (SY Ex. 17.A.2): Pācāvitne Caesar Galliam?", answer: "Did Caesar pacify Gaul?" },
    { type: "fill-in-blank", id: "sy-e3-q129", prompt: "Translate (SY Ex. 17.A.3): Nōnne Caesar vir magnus fuit?", answer: "Surely Caesar was a great man?", acceptableAnswers: ["Was not Caesar a great man?", "Caesar was a great man, was he not?"] },
    { type: "fill-in-blank", id: "sy-e3-q130", prompt: "Translate (SY Ex. 17.A.4): Num Gallī Rōmānōs vīcērunt?", answer: "Surely the Gauls didn't conquer the Romans?", acceptableAnswers: ["The Gauls did not conquer the Romans, did they?"] },
    { type: "fill-in-blank", id: "sy-e3-q131", prompt: "Translate (SY Ex. 17.A.5): Ubi est flūmen Mississippi?", answer: "Where is the Mississippi River?", acceptableAnswers: ["Where is the river Mississippi"] },
    { type: "fill-in-blank", id: "sy-e3-q132", prompt: "Translate (SY Ex. 17.A.6): Nōnne amīcum fīrmum semper laudāmus?", answer: "Surely we always praise a steadfast friend?", acceptableAnswers: ["Do we not always praise a firm friend?"] },
    { type: "fill-in-blank", id: "sy-e3-q133", prompt: "Translate into Latin (SY Ex. 17.B.1): Where did the Romans dwell?", answer: "Ubi Rōmānī incolēbant?", acceptableAnswers: ["Ubi incolēbant Rōmānī?"] },
    { type: "fill-in-blank", id: "sy-e3-q134", prompt: "Translate into Latin (SY Ex. 17.B.2): Did you hurl the dart?", answer: "Jēcistīne tēlum?", acceptableAnswers: ["Jecistine telum?", "Tēlumne jēcistī?"] },
    { type: "fill-in-blank", id: "sy-e3-q135", prompt: "Translate into Latin (SY Ex. 17.B.3): You won't flee, will you?", answer: "Num fugiēs?", acceptableAnswers: ["Num fugies?", "Nōn fugiēs, nē?"] },
    { type: "fill-in-blank", id: "sy-e3-q136", prompt: "Translate into Latin (SY Ex. 17.B.4): Don't soldiers always desire victory?", answer: "Nōnne mīlitēs semper victōriam cupiunt?", acceptableAnswers: ["Nonne milites semper victoriam cupiunt?"] },
    { type: "fill-in-blank", id: "sy-e3-q137", prompt: "Translate into Latin (SY Ex. 17.B.5): Why did Caesar march into Gaul?", answer: "Cūr Caesar iter in Galliam fēcit?", acceptableAnswers: ["Cur Caesar iter in Galliam fecit?", "Cūr in Galliam iter fēcit Caesar?"] },
    { type: "fill-in-blank", id: "sy-e3-q138", prompt: "Translate into Latin (SY Ex. 17.B.6): Did the Romans capture many cities?", answer: "Rōmānīne multās urbēs cēpērunt?", acceptableAnswers: ["Romanine multas urbes ceperunt?", "Cēpēruntne Rōmānī multās urbēs?"] },
    { type: "fill-in-blank", id: "sy-e3-q139", prompt: "Translate into Latin (SY Ex. 17.B.7): We all praise Mary, don't we?", answer: "Nōnne omnēs Mariam laudāmus?", acceptableAnswers: ["Nonne omnes Mariam laudamus?"] },
    { type: "fill-in-blank", id: "sy-e3-q140", prompt: "Translate into Latin (SY Ex. 17.B.8): Surely the enemy has not conquered the Americans?", answer: "Num hostēs Americānōs vīcērunt?", acceptableAnswers: ["Num hostes Americanos vicerunt?"] },
    { type: "fill-in-blank", id: "sy-e3-q141", prompt: "Translate into Latin (SY Ex. 17.B.9): Have you seen the mountains?", answer: "Vīdistīne montēs?", acceptableAnswers: ["Vidistine montes?", "Montēsne vīdistī?"] },
    { type: "fill-in-blank", id: "sy-e3-q142", prompt: "Translate into Latin (SY Ex. 17.B.10): Were the Gauls fighting with the Romans?", answer: "Pugnābantne Gallī cum Rōmānīs?", acceptableAnswers: ["Pugnabantne Galli cum Romanis?", "Gallīne cum Rōmānīs pugnābant?"] },
    { type: "fill-in-blank", id: "sy-e3-q143", prompt: "Translate into Latin (SY Ex. 17.B.11): Will you always fight on behalf of liberty?", answer: "Semperne prō lībertāte pugnābis?", acceptableAnswers: ["Semperne pro libertate pugnabis?", "Pugnābisne semper prō lībertāte?"] },
    { type: "fill-in-blank", id: "sy-e3-q144", prompt: "Respondē Latīnē (SY f.318–319, question 1): Quid laudant omnēs hominēs?", answer: "Omnēs hominēs lībertātem atque pācem laudant.", acceptableAnswers: ["Libertatem pacemque laudant", "Hominēs lībertātem et pācem laudant."] },
    { type: "fill-in-blank", id: "sy-e3-q145", prompt: "Respondē Latīnē (SY f.318–319, question 2): Suntne omnēs hominēs cupidī?", answer: "Omnēs hominēs lībertātis et pācis cupidī sunt.", acceptableAnswers: ["Omnes homines libertatis et pacis cupidi sunt"], explanation: "⚠ question text partially obscured in the photo (show-through, IMG_1479); visible tail “cupidi?” — model answer follows the reading's own line (f.318)" },
    { type: "fill-in-blank", id: "sy-e3-q146", prompt: "Respondē Latīnē (SY f.318–319, question 3): Quid tamen cupiunt hominēs?", answer: "Hominēs tamen bellī atque imperiī glōriam cupiunt.", acceptableAnswers: ["Bellī atque imperiī glōriam cupiunt"] },
    { type: "fill-in-blank", id: "sy-e3-q147", prompt: "Respondē Latīnē (SY f.318–319, question 4): Cūr exercitum in fīnēs aliēnōs dūcunt?", answer: "Quia agrōs aliēnōs et bona aliēna cupiunt.", acceptableAnswers: ["Quia agrōs et urbēs aliēnās cupiunt", "Agrōs aliēnōs et bona aliēna cupiunt"] },
    { type: "fill-in-blank", id: "sy-e3-q148", prompt: "Respondē Latīnē (SY f.318–319, question 5): Cūr saepe sunt hominēs miserī?", answer: "Saepe miserī sunt hominēs quod lēgēs Deī nōn servāvērunt.", acceptableAnswers: ["Hominēs saepe miserī sunt quod lēgēs Deī nōn servant"] },
    { type: "fill-in-blank", id: "sy-e3-q149", prompt: "Respondē Latīnē (SY f.318–319, question 6): Laudāvēruntne Rōmānī pācem ac lībertātem?", answer: "Rōmānī pācem ac lībertātem laudāvērunt.", acceptableAnswers: ["Pācem ac lībertātem laudāvērunt"] },
    { type: "fill-in-blank", id: "sy-e3-q150", prompt: "Respondē Latīnē (SY f.318–319, question 7): Italianne gentēs atque populī cum Rōmānīs bellum gessērunt?", answer: "Gentēs atque populī cum Rōmānīs bellum gessērunt.", acceptableAnswers: ["Gentēs atque populī bellum gessērunt"] },
    { type: "fill-in-blank", id: "sy-e3-q151", prompt: "Respondē Latīnē (SY f.318–319, question 9): Num pācem Rōmānam cupīvērunt?", answer: "Pācem Rōmānam nōn cupīvērunt.", acceptableAnswers: ["Pācem Rōmānam nōn cupiverunt", "Nōn cupīvērunt pācem Rōmānam"] },
    { type: "fill-in-blank", id: "sy-e3-q152", prompt: "Respondē Latīnē (SY f.318–319, question 10): Nōnne lībertātem memoriā tenēbant?", answer: "Lībertātem memoriā tenēbant.", acceptableAnswers: ["Lībertātem tenēbant memoriā"] },
    { type: "fill-in-blank", id: "sy-e3-q153", prompt: "Respondē Anglicē (SY f.319, question 1): Quid fuit imperium Rōmānum?", answer: "It was Rome's rule over all the lands around the Mediterranean.", acceptableAnswers: ["The Roman empire: Rome's power spread until all the lands around the Mediterranean were under its rule", "Rome's rule over the lands around the Mediterranean"] },
    { type: "fill-in-blank", id: "sy-e3-q154", prompt: "Respondē Anglicē (SY f.319, question 2): Quī in omnibus ferē gentibus pācem servāvērunt?", answer: "The Romans.", acceptableAnswers: ["The Romans kept the peace in almost all nations through their governors and the Pāx Rōmāna", "Rōmānī"] },
    { type: "fill-in-blank", id: "sy-e3-q155", prompt: "Respondē Anglicē (SY f.319, question 3): Cūr rēgēs et barbarōrum prīncipēs cum Rōmānīs bellum gessērunt?", answer: "Because the Romans were oppressors, invaders, latrōnēs (brigands), and the peoples fought fiercely for their ancient liberties.", acceptableAnswers: ["Because the peoples fought fiercely for their ancient liberties", "Because the Romans were oppressors and invaders"] },
  ],
  "part4-l04-pres-subj": [
    { type: "flashcard", id: "sy-e4-q1", prompt: "SY Ex. 18.1 — Identify the form:", front: "veniās", back: "2 sg. present subjunctive of veniō — may you come", hint: "SY Part IV Lesson 4, Exercise 18.1 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q2", prompt: "SY Ex. 18.2 — Identify the form:", front: "rejiciās", back: "2 sg. present subjunctive of rejiciō — may you hurl back", hint: "SY Part IV Lesson 4, Exercise 18.2 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q3", prompt: "SY Ex. 18.3 — Identify the form:", front: "repellat", back: "3 sg. present subjunctive of repellō — may he repel / let him repel", hint: "SY Part IV Lesson 4, Exercise 18.3 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q4", prompt: "SY Ex. 18.4 — Identify the form:", front: "teneat", back: "3 sg. present subjunctive of teneō — may he hold / let him hold", hint: "SY Part IV Lesson 4, Exercise 18.4 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q5", prompt: "SY Ex. 18.5 — Identify the form:", front: "laudem", back: "1 sg. present subjunctive of laudō — may I praise", hint: "SY Part IV Lesson 4, Exercise 18.5 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q6", prompt: "SY Ex. 18.6 — Identify the form:", front: "pācet", back: "3 sg. present subjunctive of pācō — may he pacify", hint: "SY Part IV Lesson 4, Exercise 18.6 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q7", prompt: "SY Ex. 18.7 — Identify the form:", front: "rejiciant", back: "3 pl. present subjunctive of rejiciō — let them hurl back", hint: "SY Part IV Lesson 4, Exercise 18.7 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q8", prompt: "SY Ex. 18.8 — Identify the form:", front: "remittātis", back: "2 pl. present subjunctive of remittō — may you send back", hint: "SY Part IV Lesson 4, Exercise 18.8 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q9", prompt: "SY Ex. 18.9 — Identify the form:", front: "audiant", back: "3 pl. present subjunctive of audiō — let them hear", hint: "SY Part IV Lesson 4, Exercise 18.9 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q10", prompt: "SY Ex. 18.10 — Identify the form:", front: "reprimāmus", back: "1 pl. present subjunctive of reprimō — let us check", hint: "SY Part IV Lesson 4, Exercise 18.10 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q11", prompt: "SY Ex. 18.11 — Identify the form:", front: "moneant", back: "3 pl. present subjunctive of moneō — let them warn", hint: "SY Part IV Lesson 4, Exercise 18.11 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q12", prompt: "SY Ex. 18.12 — Identify the form:", front: "veniam", back: "1 sg. present subjunctive of veniō — may I come", hint: "SY Part IV Lesson 4, Exercise 18.12 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q13", prompt: "SY Ex. 18.13 — Identify the form:", front: "redūcās", back: "2 sg. present subjunctive of reducō — may you lead back", hint: "SY Part IV Lesson 4, Exercise 18.13 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q14", prompt: "SY Ex. 18.14 — Identify the form:", front: "laudēmus", back: "1 pl. present subjunctive of laudō — let us praise", hint: "SY Part IV Lesson 4, Exercise 18.14 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q15", prompt: "SY Ex. 18.15 — Identify the form:", front: "vīvant", back: "3 pl. present subjunctive of vīvō — may they live", hint: "SY Part IV Lesson 4, Exercise 18.15 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q16", prompt: "SY Ex. 19.1 — Distinguish the form (subjunctive or indicative?):", front: "pācat", back: "INDICATIVE present (he pacifies) — not the subjunctive pācet", hint: "SY Part IV Lesson 4, Exercise 19.1 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q17", prompt: "SY Ex. 19.2 — Distinguish the form (subjunctive or indicative?):", front: "redūcat", back: "SUBJUNCTIVE present (may he lead back) — not the indicative future redūcet", hint: "SY Part IV Lesson 4, Exercise 19.2 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q18", prompt: "SY Ex. 19.3 — Distinguish the form (subjunctive or indicative?):", front: "pācet", back: "SUBJUNCTIVE present (may he pacify) — not the indicative pācat", hint: "SY Part IV Lesson 4, Exercise 19.3 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q19", prompt: "SY Ex. 19.4 — Distinguish the form (subjunctive or indicative?):", front: "redūcet", back: "INDICATIVE future (he will lead back) — not the subjunctive redūcat", hint: "SY Part IV Lesson 4, Exercise 19.4 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q20", prompt: "SY Ex. 19.5 — Distinguish the form (subjunctive or indicative?):", front: "remittātis", back: "SUBJUNCTIVE present (may you send back) — not the indicative remittitis", hint: "SY Part IV Lesson 4, Exercise 19.5 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q21", prompt: "SY Ex. 19.6 — Distinguish the form (subjunctive or indicative?):", front: "laudātis", back: "INDICATIVE present (you praise) — not the subjunctive laudētis", hint: "SY Part IV Lesson 4, Exercise 19.6 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q22", prompt: "SY Ex. 19.7 — Distinguish the form (subjunctive or indicative?):", front: "rejiciātis", back: "SUBJUNCTIVE present (may you hurl back) — not the indicative rejicitis", hint: "SY Part IV Lesson 4, Exercise 19.7 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q23", prompt: "SY Ex. 19.8 — Distinguish the form (subjunctive or indicative?):", front: "audiātis", back: "SUBJUNCTIVE present (may you hear) — not the indicative audītis", hint: "SY Part IV Lesson 4, Exercise 19.8 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q24", prompt: "SY Ex. 19.9 — Distinguish the form (subjunctive or indicative?):", front: "rejicient", back: "INDICATIVE future (they will hurl back) — not the subjunctive rejiciant", hint: "SY Part IV Lesson 4, Exercise 19.9 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q25", prompt: "SY Ex. 19.10 — Distinguish the form (subjunctive or indicative?):", front: "monent", back: "INDICATIVE present (they warn) — not the subjunctive moneant", hint: "SY Part IV Lesson 4, Exercise 19.10 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q26", prompt: "SY Ex. 19.11 — Distinguish the form (subjunctive or indicative?):", front: "pugnent", back: "SUBJUNCTIVE present (let them fight) — not an indicative form", hint: "SY Part IV Lesson 4, Exercise 19.11 (p. 321)" },
    { type: "flashcard", id: "sy-e4-q27", prompt: "SY Ex. 19.12 — Distinguish the form (subjunctive or indicative?):", front: "redūcent", back: "INDICATIVE future (they will lead back) — not the subjunctive redūcant", hint: "SY Part IV Lesson 4, Exercise 19.12 (p. 321)" },
    { type: "fill-in-blank", id: "sy-e4-q31", prompt: "Translate (SY Ex. 20.1): Impetum faciāmus.", answer: "Let us make the attack.", acceptableAnswers: ["Let us attack", "Let us make an attack"] },
    { type: "fill-in-blank", id: "sy-e4-q32", prompt: "Translate (SY Ex. 20.2): Nē aliēnō locō pugnēmus.", answer: "Let us not fight on another's ground.", acceptableAnswers: ["Let us not fight in a strange land", "Let us not fight on ground not ours"], explanation: "locō¹ — the ablative of locus is often used without in to express place where (fn.)" },
    { type: "fill-in-blank", id: "sy-e4-q33", prompt: "Translate (SY Ex. 20.3): Equitēs reducāmus.", answer: "Let us lead back the horsemen.", acceptableAnswers: ["Let us lead back the cavalry"] },
    { type: "fill-in-blank", id: "sy-e4-q34", prompt: "Translate (SY Ex. 20.4): Hostēs repellāmus.", answer: "Let us drive back the enemy." },
    { type: "fill-in-blank", id: "sy-e4-q35", prompt: "Translate (SY Ex. 20.5): In castra nē fugiāmus.", answer: "Let us not flee into the camp." },
    { type: "fill-in-blank", id: "sy-e4-q36", prompt: "Translate (SY Ex. 20.6): Pīla rejiciāmus.", answer: "Let us hurl back the javelins." },
    { type: "fill-in-blank", id: "sy-e4-q37", prompt: "Translate (SY Ex. 20.7): Grātiam cupiāmus.", answer: "Let us desire grace." },
    { type: "fill-in-blank", id: "sy-e4-q38", prompt: "Translate (SY Ex. 20.8): Deum laudēmus.", answer: "Let us praise God." },
    { type: "fill-in-blank", id: "sy-e4-q39", prompt: "Translate (SY Ex. 20.9): Servum remittāmus.", answer: "Let us send back the slave.", acceptableAnswers: ["Let us release the slave"] },
    { type: "fill-in-blank", id: "sy-e4-q40", prompt: "Translate (SY Ex. 20.10): Servōs reprimāmus.", answer: "Let us check the slaves.", acceptableAnswers: ["Let us restrain the slaves"] },
    { type: "fill-in-blank", id: "sy-e4-q41", prompt: "Translate (SY Ex. 20.11): In grātiā Deī vīvāmus.", answer: "Let us live in the grace of God." },
    { type: "fill-in-blank", id: "sy-e4-q42", prompt: "Translate into Latin (SY Ex. 21.1): Let us lead back the hostages.", answer: "Obsidēs reducāmus." },
    { type: "fill-in-blank", id: "sy-e4-q43", prompt: "Translate into Latin (SY Ex. 21.2): Let us hurl back the javelins.", answer: "Pīla rejiciāmus." },
    { type: "fill-in-blank", id: "sy-e4-q44", prompt: "Translate into Latin (SY Ex. 21.3): Let us drive back the enemy.", answer: "Hostēs repellāmus." },
    { type: "fill-in-blank", id: "sy-e4-q45", prompt: "Translate into Latin (SY Ex. 21.4): Let us check the cavalry.", answer: "Equitēs reprimāmus." },
    { type: "fill-in-blank", id: "sy-e4-q46", prompt: "Translate into Latin (SY Ex. 21.5): Let us not flee.", answer: "Nē fugiāmus." },
    { type: "fill-in-blank", id: "sy-e4-q47", prompt: "Translate into Latin (SY Ex. 21.6): Let us not send back the envoys.", answer: "Nē lēgātōs remittāmus." },
    { type: "fill-in-blank", id: "sy-e4-q48", prompt: "Translate into Latin (SY Ex. 21.7): Let us station a garrison.", answer: "Praesidium collocēmus." },
    { type: "fill-in-blank", id: "sy-e4-q49", prompt: "Translate into Latin (SY Ex. 21.8): Let us desire good things.", answer: "Bona cupiāmus." },
    { type: "fill-in-blank", id: "sy-e4-q50", prompt: "Translate into Latin (SY Ex. 21.9): Let us not hurl the darts.", answer: "Nē pīla rejiciāmus." },
    { type: "fill-in-blank", id: "sy-e4-q51", prompt: "Translate into Latin (SY Ex. 21.10): Let us all desire heaven.", answer: "Omnēs caelum cupiāmus." },
    { type: "fill-in-blank", id: "sy-e4-q52", prompt: "Translate into Latin (SY Ex. 21.11): Let us help good men.", answer: "Bonōs hominēs adjuvēmus." },
    { type: "fill-in-blank", id: "sy-e4-q53", prompt: "Translate into Latin (SY Ex. 21.12): Let us restrain the envoys.", answer: "Lēgātōs reprimāmus." },
    { type: "fill-in-blank", id: "sy-e4-q54", prompt: "Translate into Latin (SY Ex. 21.13): Let us not remain.", answer: "Nē maneāmus." },
    { type: "fill-in-blank", id: "sy-e4-q55", prompt: "Translate into Latin (SY Ex. 21.14): Let us warn the general.", answer: "Imperātōrem moneāmus." },
    { type: "fill-in-blank", id: "sy-e4-q56", prompt: "Translate into Latin (SY Ex. 21.15): Let us carry the grain.", answer: "Frūmentum portēmus." },
    { type: "fill-in-blank", id: "sy-e4-q57", prompt: "Translate into Latin (SY Ex. 21.16): Let us fight bravely.", answer: "Fortiter pugnēmus." },
    { type: "fill-in-blank", id: "sy-e4-q58", prompt: "Translate into Latin (SY Ex. 21.17): Let us keep the law of God.", answer: "Lēgēs Deī servēmus." },
    { type: "fill-in-blank", id: "sy-e4-q59", prompt: "Translate into Latin (SY Ex. 21.18): Let us not fear death.", answer: "Nē mortem timēāmus." },
    { type: "fill-in-blank", id: "sy-e4-q60", prompt: "Translate into Latin (SY Ex. 21.19): Let us not yield to the barbarians.", answer: "Barbarīs nē cēdāmus." },
    { type: "fill-in-blank", id: "sy-e4-q61", prompt: "Translate into Latin (SY Ex. 21.20): Let us not wage war.", answer: "Nē bellum gerāmus." },
    { type: "fill-in-blank", id: "sy-e4-q62", prompt: "Translate into Latin (SY Ex. 21.21): Let us burn the enemy's camp.", answer: "Castra hostium incendāmus." },
    { type: "fill-in-blank", id: "sy-e4-q63", prompt: "Translate into Latin (SY Ex. 21.22): Let us seek the grace of God.", answer: "Grātiam Deī petāmus." },
    { type: "fill-in-blank", id: "sy-e4-q64", prompt: "Translate into Latin (SY Ex. 21.23): Let us give thanks to God.", answer: "Deō grātiās agāmus." },
    { type: "fill-in-blank", id: "sy-e4-q65", prompt: "Translate into Latin (SY Ex. 21.24): Let us praise Mary.", answer: "Mariam laudēmus." },
    { type: "fill-in-blank", id: "sy-e4-q66", prompt: "Translate into Latin (SY Ex. 21.25): Let us not storm the town.", answer: "Nē oppidum oppugnēmus." },
    { type: "fill-in-blank", id: "sy-e4-q67", prompt: "Translate (SY Ex. 22.1): Utinam praemia habeās.", answer: "Would that you had rewards! (May you have rewards.)", acceptableAnswers: ["May you have rewards", "Would that you had rewards"] },
    { type: "fill-in-blank", id: "sy-e4-q68", prompt: "Translate (SY Ex. 22.2): Utinam nē miserī sīmus.", answer: "Would that we were not wretched!", acceptableAnswers: ["May we not be wretched"] },
    { type: "fill-in-blank", id: "sy-e4-q69", prompt: "Translate (SY Ex. 22.3): Collem teneant.", answer: "May they hold the hill.", acceptableAnswers: ["Let them hold the hill"], explanation: "no utinam — the third person may omit it (the wish sign)" },
    { type: "fill-in-blank", id: "sy-e4-q70", prompt: "Translate (SY Ex. 22.4): Utinam nē fugiās!", answer: "Would that you were not fleeing! (May you not flee!)", acceptableAnswers: ["May you not flee"] },
    { type: "fill-in-blank", id: "sy-e4-q71", prompt: "Translate (SY Ex. 22.5): Utinam vincat.", answer: "May he win.", acceptableAnswers: ["Would that he were winning", "Would that he might win"] },
    { type: "fill-in-blank", id: "sy-e4-q72", prompt: "Translate (SY Ex. 22.6): Nē vincat.", answer: "May he not win.", acceptableAnswers: ["Let him not win"] },
    { type: "fill-in-blank", id: "sy-e4-q73", prompt: "Translate (SY Ex. 22.7): Vīvat!", answer: "May he live! (Long live!)", acceptableAnswers: ["Long live"] },
    { type: "fill-in-blank", id: "sy-e4-q74", prompt: "Translate into Latin (SY Ex. 23.1): May he fight.", answer: "Pugnet.", acceptableAnswers: ["Utinam pugnet"], explanation: "utinam may be omitted with the third person — translate both ways" },
    { type: "fill-in-blank", id: "sy-e4-q75", prompt: "Translate into Latin (SY Ex. 23.2): May you not flee.", answer: "Utinam nē fugiās.", acceptableAnswers: ["Ne fugiās"], explanation: "with the second person utinam is kept" },
    { type: "fill-in-blank", id: "sy-e4-q76", prompt: "Translate into Latin (SY Ex. 23.3): May we conquer.", answer: "Utinam vincāmus.", acceptableAnswers: ["Vincāmus"], explanation: "both ways allowed" },
    { type: "fill-in-blank", id: "sy-e4-q77", prompt: "Translate into Latin (SY Ex. 23.4): May God help the soldiers.", answer: "Deus mīlitēs adjuvet.", acceptableAnswers: ["Utinam Deus mīlitēs adjuvet"], explanation: "both ways allowed (third person)" },
    { type: "fill-in-blank", id: "sy-e4-q78", prompt: "Translate into Latin (SY Ex. 23.5): May they not come.", answer: "Nē veniant.", acceptableAnswers: ["Utinam nē veniant"], explanation: "both ways allowed (third person)" },
    { type: "fill-in-blank", id: "sy-e4-q79", prompt: "Translate (SY Ex. 24.1): Hostēs repellant.", answer: "Let them drive back the enemy." },
    { type: "fill-in-blank", id: "sy-e4-q80", prompt: "Translate (SY Ex. 24.2): Pīla rejiciant.", answer: "Let them hurl back the javelins." },
    { type: "fill-in-blank", id: "sy-e4-q81", prompt: "Translate (SY Ex. 24.3): Hostēs reprimat.", answer: "Let him check the enemy." },
    { type: "fill-in-blank", id: "sy-e4-q82", prompt: "Translate (SY Ex. 24.4): Praesidia collocet.", answer: "Let him station garrisons." },
    { type: "fill-in-blank", id: "sy-e4-q83", prompt: "Translate (SY Ex. 24.5): legiōnēs nē redūcat.", answer: "Let him not lead back the legions." },
    { type: "fill-in-blank", id: "sy-e4-q84", prompt: "Translate (SY Ex. 24.6): Ducem moneat.", answer: "Let him warn the leader." },
    { type: "fill-in-blank", id: "sy-e4-q85", prompt: "Translate (SY Ex. 24.7): Lēgēs Deī servent!", answer: "Let them keep the laws of God!" },
    { type: "fill-in-blank", id: "sy-e4-q86", prompt: "Translate (SY Ex. 24.8): Nē hostibus cēdant.", answer: "Let them not yield to the enemy." },
    { type: "fill-in-blank", id: "sy-e4-q87", prompt: "Translate (SY Ex. 24.9): Nē rēgem occīdat!", answer: "Let him not kill the king!" },
    { type: "fill-in-blank", id: "sy-e4-q88", prompt: "Translate (SY Ex. 24.10): Hīberna mūniat.", answer: "Let him fortify the winter quarters." },
    { type: "fill-in-blank", id: "sy-e4-q89", prompt: "Translate (SY Ex. 24.11): Obsidēs redūcat.", answer: "Let him lead back the hostages." },
    { type: "fill-in-blank", id: "sy-e4-q90", prompt: "Translate into Latin (SY Ex. 25.1): Let them lead back the hostages.", answer: "Obsidēs reducant." },
    { type: "fill-in-blank", id: "sy-e4-q91", prompt: "Translate into Latin (SY Ex. 25.2): Let them not flee.", answer: "Nē fugiant." },
    { type: "fill-in-blank", id: "sy-e4-q92", prompt: "Translate into Latin (SY Ex. 25.3): Let the soldiers hurl back the javelins.", answer: "Mīlitēs pīla rejiciant." },
    { type: "fill-in-blank", id: "sy-e4-q93", prompt: "Translate into Latin (SY Ex. 25.4): Let them send back the slaves.", answer: "Servōs remittant." },
    { type: "fill-in-blank", id: "sy-e4-q94", prompt: "Translate into Latin (SY Ex. 25.5): Let the lieutenant station garrisons.", answer: "Praefectus praesidia collocet." },
    { type: "fill-in-blank", id: "sy-e4-q95", prompt: "Translate into Latin (SY Ex. 25.6): Let the general lead back the soldiers.", answer: "Imperātor mīlitēs reducant." },
    { type: "fill-in-blank", id: "sy-e4-q96", prompt: "Respondē Latīnē (SY f.326, question 1): Vēnēruntne Gallī trāns flūmen?", answer: "Gallī trāns flūmen vēnērunt." },
    { type: "fill-in-blank", id: "sy-e4-q97", prompt: "Respondē Latīnē (SY f.326, question 2): Occupāvēruntne omnem Galliam?", answer: "Occupāvērunt omnem Galliam." },
    { type: "fill-in-blank", id: "sy-e4-q98", prompt: "Respondē Latīnē (SY f.326, question 3): Dūxēruntne cōpiās per Alpēs?", answer: "Cōpiās per Alpēs dūxērunt." },
    { type: "fill-in-blank", id: "sy-e4-q99", prompt: "Respondē Latīnē (SY f.326, question 4): Occupāvēruntne partem Italiae?", answer: "Partem Italiae occupāvērunt." },
    { type: "fill-in-blank", id: "sy-e4-q100", prompt: "Respondē Latīnē (SY f.326, question 5): Contendēruntne cum Rōmānīs?", answer: "Cum Rōmānīs contendērunt." },
    { type: "fill-in-blank", id: "sy-e4-q101", prompt: "Respondē Latīnē (SY f.326, question 6): Quī Rāmam cēpērunt?", answer: "Gallī Rōmam cēpērunt.", acceptableAnswers: ["A Gallī Rōmam cēpērunt? Gallī", "Gallī"], explanation: "⚠ the printed question reads “Quī Rāmam cēpērunt?” at the photo angle — likely Rōmam (flagged; IMG_1486). Model answer per the Dē Gallīs reading and history (the Gauls captured Rome)." },
    { type: "fill-in-blank", id: "sy-e4-q102", prompt: "Respondē Latīnē (SY f.326, question 7): Num Rōmam incendērunt Gallī?", answer: "Gallī Rōmam incendērunt.", acceptableAnswers: ["Gallī Rōmam incenderunt"], explanation: "⚠ num normally expects the answer “no”, but the Dē Gallīs reading says the Gauls “captured and burned R[ome]” — question kept verbatim; verify with the owner." },
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
  ],  "part4-l02-adjectives": [
    "two-one-two-adjectives",
    "third-declension-adjectives",
    "adjective-agreement",
    "adjectives-governing-cases",
    "adjectives-as-nouns",
  ],
  "part4-l03-indicative-questions": [
    "direct-questions",
    "interrogative-pronoun-and-adjective",
    "interrogative-adverbs",
    "sequence-of-tenses",
  ],
  "part4-l04-pres-subj": [
    "present-subjunctive",
    "hortatory-jussive",
  ],

};
