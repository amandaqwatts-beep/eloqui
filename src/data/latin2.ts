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
//     (Part II) as designed. Path 2 = all the Caesar in order — the raw
//     account, adapted for readability, harder because LONGER. Students pick
//     their difficulty; both paths share the Exercises 1–16 spine.
//   • Provenance: the owner's copy is a post-1952 printing; the PD-1943 text
//     stays the structural spine. Folio numbers below are the book's own.

/** Status of every structural node — always "awaiting-capture" in this pass. */
export type Latin2SectionStatus = "awaiting-capture";

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
    { id: "part4-l01-nouns-sum", title: "Lesson 1 — Third-Declension Nouns; Sum", folio: 305, status: "awaiting-capture" },
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
      "Caesar's own account read in sequence, adapted for readability — the same ground as the book's stories, but the full campaign rather than the book's selection.",
    difficulty: "Harder — not denser, just longer: the whole Caesar in order.",
    opensWith: "The Gallic War from the beginning (capture pending)",
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
