// Verbum — Bookshelf v2: Henle book-lesson mapping (bookLessons.ts)
// Data-only file. Maps the 142 flat sub-lessons of latinLessons.ts into 56
// "books": 42 Henle book lessons (kind "lesson", henleNumber 1–42) + 4
// mastery reviews (kind "mastery-review", henleNumber null; sub-lesson ids
// 25/33/70/134) + 10 unit reviews (kind "unit-review", henleNumber null; ids
// 47–56, one per unit 3/4/6–13 — P3a of the review-system rework, derived
// from BASE_BOOKS so unit membership never drifts). Canonical title = the
// first sub-lesson's title; the subtitle carries the sub-lesson span. The 46
// base books' ids ascend by unit (interleaved-by-unit: each unit's
// mastery-review book sits immediately after that unit's Henle lessons),
// matching the §A mapping-table row order; the 10 unit-review books append
// after the base, ids in unit order 3,4,6,7,8,9,10,11,12,13.
// NLE supplement (2026-08-20): sub-lessons 135–138 (present active
// participle, ablative of manner, impersonal verbs, locative) are appended
// at the END of latinLessons.ts (array order is unlock order; appending is
// the only index-safe placement) and assigned here to the most relevant
// EXISTING Henle book so each unlocks at that book's normal position and
// renders as its final chapter: 136→book 20 (H18, U5, w/ ablative of means),
// 135→book 33 (H30, U9, w/ perfect passive participle), 137→book 38 (H35,
// U10, w/ oportet), 138→book 40 (H37, U11, w/ time & place). See
// research/nle-phase2-placement.md.
// Phase 3a (irregular-verbs block, 2026-08-20): sub-lessons 139–142
// (volō/nōlō/mālō, ferō, fīō, semi-deponent verbs) also appended at the END
// of latinLessons.ts and assigned: 139–141→book 45 (H42, U14, w/ eō — the
// irregular-verb book) and 142→book 44 (H41, U13, w/ deponents).
// Phase 3b (subjunctive-uses block, 2026-08-20): sub-lessons 143–149
// (indirect command, result, cum, fearing, conditions, optative/deliberative,
// relative of characteristic/purpose) appended at the END and assigned to
// book 45 (H42, U14, the advanced/subjunctive book).
// Phase 3c (verbal block, 2026-08-20): sub-lessons 150–154 (gerund, gerundive,
// supine, periphrastic, fore + defective verbs) appended at the END and
// assigned by verbal-noun/verbal-adjective affinity: 150/152→book 42 (H39,
// U12, w/ infinitives — the verbal-noun book), 151→book 33 (H30, U9, w/
// participles — the verbal-adjective book), 153→book 44 (H41, U13, w/
// deponents — the advanced verbal book), 154→book 45 (H42, U14, w/ irregular
// verbs — fore is a form of esse, defectives are irregular verbs). See
// research/nle-phase3c-placement.md.
//
// ⚠️ ARRAY-ORDER CONSTRAINT — read before touching this file or latinLessons.ts:
// latinLessons.ts array order is NOT id order (sub-lessons 51/52 — Henle 14,
// "Sum — Present, Imperfect, and Future" — physically precede 46–50, Henle
// 12–13, 3rd/4th conjugation, in the array). The shelf model orders
// books/chapters by ARRAY INDEX (unlock order), not by id. The subLessonIds
// arrays below are therefore MEMBERSHIP SETS only: the model derives display
// order from the lesson array (min array index per book), never from these
// ids. Do not sort or reorder anything by subLessonIds, and never reorder
// latinLessons.ts — reordering the data file would shift indices and break
// persisted progress.

export type BookLessonKind = "lesson" | "mastery-review" | "unit-review";

export interface BookLesson {
  id: number;
  henleNumber: number | null;
  unitNumber: number;
  title: string;
  subtitle?: string;
  subLessonIds: number[];
  kind: BookLessonKind;
}

const BASE_BOOKS: BookLesson[] = [
  // ── UNIT 1 · Henle 1–6 + Review of Unit 1 ─────────────────────
  { id: 1, henleNumber: 1, unitNumber: 1, title: "The Declension of Terra", subtitle: "IDs 1–5 · Terra → Genitive Case", subLessonIds: [1, 2, 3, 4, 5], kind: "lesson" },
  { id: 2, henleNumber: 2, unitNumber: 1, title: "The Declension of Servus", subtitle: "IDs 6–11 · Servus → Use of Quod", subLessonIds: [6, 7, 8, 9, 10, 11], kind: "lesson" },
  { id: 3, henleNumber: 3, unitNumber: 1, title: "Gender in the Third Declension", subtitle: "IDs 12–20 · 3rd-decl gender → Review of the Third Declension", subLessonIds: [12, 13, 14, 15, 16, 17, 18, 19, 20], kind: "lesson" },
  { id: 4, henleNumber: 4, unitNumber: 1, title: "The Declension of Portus", subtitle: "IDs 21–22 · Portus; In with the Accusative", subLessonIds: [21, 22], kind: "lesson" },
  { id: 5, henleNumber: 5, unitNumber: 1, title: "The Fifth Declension", subtitle: "ID 23", subLessonIds: [23], kind: "lesson" },
  { id: 6, henleNumber: 6, unitNumber: 1, title: "Special Plural Meanings", subtitle: "ID 24", subLessonIds: [24], kind: "lesson" },
  { id: 7, henleNumber: null, unitNumber: 1, title: "Review of Unit 1", subtitle: "ID 25 · Unit 1 checkpoint", subLessonIds: [25], kind: "mastery-review" },

  // ── UNIT 2 · Henle 7–8 + Mastery Review Vocab #1 ──────────────
  { id: 8, henleNumber: 7, unitNumber: 2, title: "The Declension of Magnus", subtitle: "IDs 26–29 · Magnus → Use of Pro", subLessonIds: [26, 27, 28, 29], kind: "lesson" },
  { id: 9, henleNumber: 8, unitNumber: 2, title: "The Declension of Gravis", subtitle: "IDs 30–32 · Gravis → The Declension of Jesus", subLessonIds: [30, 31, 32], kind: "lesson" },
  { id: 10, henleNumber: null, unitNumber: 2, title: "Mastery Review Vocab #1", subtitle: "ID 33 · Unit 2 checkpoint", subLessonIds: [33], kind: "mastery-review" },

  // ── UNIT 3 · Henle 9–14 ───────────────────────────────────────
  { id: 11, henleNumber: 9, unitNumber: 3, title: "The First Conjugation", subtitle: "IDs 34–40 · Principal parts → Interrogative Particle -ne", subLessonIds: [34, 35, 36, 37, 38, 39, 40], kind: "lesson" },
  { id: 12, henleNumber: 10, unitNumber: 3, title: "The Second Conjugation", subtitle: "ID 41", subLessonIds: [41], kind: "lesson" },
  { id: 13, henleNumber: 11, unitNumber: 3, title: "Personal Pronouns — First Person", subtitle: "IDs 42–45 · 1st/2nd person; is, ea, id; reflexive suī", subLessonIds: [42, 43, 44, 45], kind: "lesson" },
  { id: 14, henleNumber: 12, unitNumber: 3, title: "The Third Conjugation", subtitle: "IDs 46–49 · Principal parts; present; imperfect; future", subLessonIds: [46, 47, 48, 49], kind: "lesson" },
  { id: 15, henleNumber: 13, unitNumber: 3, title: "The Fourth Conjugation", subtitle: "ID 50", subLessonIds: [50], kind: "lesson" },
  { id: 16, henleNumber: 14, unitNumber: 3, title: "Sum — Present, Imperfect, and Future", subtitle: "IDs 51–52 · Sum + compounds (absum)", subLessonIds: [51, 52], kind: "lesson" },

  // ── UNIT 4 · Henle 15–16 ──────────────────────────────────────
  { id: 17, henleNumber: 15, unitNumber: 4, title: "The Perfect Active System", subtitle: "IDs 53–55 · Perfect; perfect indicative; pluperfect/future perfect", subLessonIds: [53, 54, 55], kind: "lesson" },
  { id: 18, henleNumber: 16, unitNumber: 4, title: "Declension of Puer, Ager, and Vir", subtitle: "IDs 56–58 · -er nouns; miser/integer; possessives", subLessonIds: [56, 57, 58], kind: "lesson" },

  // ── UNIT 5 · Henle 17–21 + Mastery Review Vocab #2 ────────────
  { id: 19, henleNumber: 17, unitNumber: 5, title: "Active and Passive Voice", subtitle: "IDs 59–62 · Voice; passive endings; 1st-conj passive; agent", subLessonIds: [59, 60, 61, 62], kind: "lesson" },
  { id: 20, henleNumber: 18, unitNumber: 5, title: "Present System Passive of the Second Conjugation", subtitle: "IDs 63–64, 136 · 2nd-conj passive; ablative of means; ablative of manner", subLessonIds: [63, 64, 136], kind: "lesson" },
  { id: 21, henleNumber: 19, unitNumber: 5, title: "Present System Passive of the Third Conjugation", subtitle: "IDs 65–66 · 3rd-conj passive; agency vs means", subLessonIds: [65, 66], kind: "lesson" },
  { id: 22, henleNumber: 20, unitNumber: 5, title: "Present System Passive of the Fourth Conjugation", subtitle: "IDs 67–68 · 4th-conj passive; accompaniment", subLessonIds: [67, 68], kind: "lesson" },
  { id: 23, henleNumber: 21, unitNumber: 5, title: "The Perfect System of the Indicative Passive", subtitle: "ID 69", subLessonIds: [69], kind: "lesson" },
  { id: 24, henleNumber: null, unitNumber: 5, title: "Mastery Review Vocab #2", subtitle: "ID 70 · Unit 5 checkpoint", subLessonIds: [70], kind: "mastery-review" },

  // ── UNIT 6 · Henle 22–24 ──────────────────────────────────────
  { id: 25, henleNumber: 22, unitNumber: 6, title: "The Present Subjunctive Active", subtitle: "IDs 71–74 · Present subj.; purpose clauses; primary sequence; nē", subLessonIds: [71, 72, 73, 74], kind: "lesson" },
  { id: 26, henleNumber: 23, unitNumber: 6, title: "The Imperfect Subjunctive Active", subtitle: "IDs 75–77 · Imperfect subj.; secondary sequence; essem", subLessonIds: [75, 76, 77], kind: "lesson" },
  { id: 27, henleNumber: 24, unitNumber: 6, title: "quī, quae, quod: The Relative Pronoun", subtitle: "IDs 78–81 · Relative pronoun; ad; relative purpose; quō", subLessonIds: [78, 79, 80, 81], kind: "lesson" },

  // ── UNIT 7 · Henle 25–26 ──────────────────────────────────────
  { id: 28, henleNumber: 25, unitNumber: 7, title: "Interrogative Adverbs", subtitle: "IDs 82–85 · ubi/cūr/unde/quō; num/nōnne; quis; quī adj.", subLessonIds: [82, 83, 84, 85], kind: "lesson" },
  { id: 29, henleNumber: 26, unitNumber: 7, title: "The Perfect and Pluperfect Subjunctive Active", subtitle: "IDs 86–88 · Perfect subj.; indirect questions (primary; secondary)", subLessonIds: [86, 87, 88], kind: "lesson" },

  // ── UNIT 8 · Henle 27–29 ──────────────────────────────────────
  { id: 30, henleNumber: 27, unitNumber: 8, title: "The Vocative Case", subtitle: "IDs 89–91 · Vocative; imperative; hortatory/jussive", subLessonIds: [89, 90, 91], kind: "lesson" },
  { id: 31, henleNumber: 28, unitNumber: 8, title: "Suus and Suī — Direct Reflexives", subtitle: "IDs 92–93 · Direct + indirect reflexives", subLessonIds: [92, 93], kind: "lesson" },
  { id: 32, henleNumber: 29, unitNumber: 8, title: "The Present and Imperfect Subjunctive Passive", subtitle: "IDs 94–96 · Subj. passive; perfect passive subj.; ablative of cause", subLessonIds: [94, 95, 96], kind: "lesson" },

  // ── UNIT 9 · Henle 30–34 ──────────────────────────────────────
  { id: 33, henleNumber: 30, unitNumber: 9, title: "The Perfect Participle Passive", subtitle: "IDs 97, 135, 151 · Perfect, present active participles & the gerundive", subLessonIds: [97, 135, 151], kind: "lesson" },
  { id: 34, henleNumber: 31, unitNumber: 9, title: "Hic, Haec, Hoc — The Declension", subtitle: "IDs 98–99 · Declension; uses (+ summus idiom)", subLessonIds: [98, 99], kind: "lesson" },
  { id: 35, henleNumber: 32, unitNumber: 9, title: "Prepositions Ex, Ab, Dē", subtitle: "ID 100", subLessonIds: [100], kind: "lesson" },
  { id: 36, henleNumber: 33, unitNumber: 9, title: "Ille and Is", subtitle: "ID 101", subLessonIds: [101], kind: "lesson" },
  { id: 37, henleNumber: 34, unitNumber: 9, title: "The Ablative of Separation", subtitle: "IDs 102–103 · Separation; review of ablative constructions", subLessonIds: [102, 103], kind: "lesson" },

  // ── UNIT 10 · Henle 35–36 ─────────────────────────────────────
  { id: 38, henleNumber: 35, unitNumber: 10, title: "Possum — Present, Imperfect, Future", subtitle: "IDs 104–107, 137 · possum tenses; infinitive as subject/object; impersonal verbs", subLessonIds: [104, 105, 106, 107, 137], kind: "lesson" },
  { id: 39, henleNumber: 36, unitNumber: 10, title: "Numerals", subtitle: "IDs 108–109, 155 · Cardinals; nine -īus adjectives; ordinals", subLessonIds: [108, 109, 155], kind: "lesson" },

  // ── UNIT 11 · Henle 37–38 ─────────────────────────────────────
  { id: 40, henleNumber: 37, unitNumber: 11, title: "Indicative Active of -iō Verbs", subtitle: "IDs 110–116, 138 · -iō; time & place constructions; the locative case", subLessonIds: [110, 111, 112, 113, 114, 115, 116, 138], kind: "lesson" },
  { id: 41, henleNumber: 38, unitNumber: 11, title: "Dative Verbs", subtitle: "IDs 117–118 · noceō/praesum; passive of verbs of calling", subLessonIds: [117, 118], kind: "lesson" },

  // ── UNIT 12 · Henle 39 ────────────────────────────────────────
  { id: 42, henleNumber: 39, unitNumber: 12, title: "The Perfect and Future Infinitives Active", subtitle: "IDs 119–122, 150, 152 · Perfect/future inf.; ACI intro; ACI time; passive infinitives; gerund; supine", subLessonIds: [119, 120, 121, 122, 150, 152], kind: "lesson" },

  // ── UNIT 13 · Henle 40–41 ─────────────────────────────────────
  { id: 43, henleNumber: 40, unitNumber: 13, title: "Regular Comparison of Adjectives", subtitle: "IDs 123–126, 156–157 · Regular; declension of comparative; abl. of comparison; irregular; -limus/-rimus & adverbs", subLessonIds: [123, 124, 125, 126, 156, 157], kind: "lesson" },
  { id: 44, henleNumber: 41, unitNumber: 13, title: "Indicative of Deponent Verbs", subtitle: "IDs 127–130, 142, 153 · Deponent + semi-deponent verbs; periphrastics", subLessonIds: [127, 128, 129, 130, 142, 153], kind: "lesson" },

  // ── UNIT 14 · Henle 42 + Mastery Review No. 3 ─────────────────
  { id: 45, henleNumber: 42, unitNumber: 14, title: "The Indicative of Eō", subtitle: "IDs 131–133, 139–149, 154 · eō + irregular verbs + subjunctive uses; fore & defective verbs", subLessonIds: [131, 132, 133, 139, 140, 141, 143, 144, 145, 146, 147, 148, 149, 154], kind: "lesson" },
  { id: 46, henleNumber: null, unitNumber: 14, title: "Mastery Review No. 3", subtitle: "ID 134 · Unit 14 checkpoint", subLessonIds: [134], kind: "mastery-review" },
];

// ── UNIT-REVIEW BOOKS (P3a · review-system rework) — ids 47–56 ──────────
// One per unit {3, 4, 6, 7, 8, 9, 10, 11, 12, 13}, in unit order. Units
// 1/2/5/14 already carry a mastery-review book (ids 7/10/24/46, sub-lessons
// 25/33/70/134) anchoring their review, so they get no unit-review book.
// subLessonIds are DERIVED from BASE_BOOKS (same unit, kind "lesson") — never
// hand-written — so each book's membership stays in exact lockstep with the
// verified unit boundaries (U3 34–52, U4 53–58, U6 71–81, U7 82–88, U8 89–96,
// U9 97–103, U10 104–109, U11 110–118, U12 119–122, U13 123–130), preserving
// the source books' array order so membership sets stay in unlock order.
const UNIT_REVIEW_UNITS = [3, 4, 6, 7, 8, 9, 10, 11, 12, 13] as const;

const UNIT_REVIEW_BOOKS: BookLesson[] = UNIT_REVIEW_UNITS.map((unit, i) => ({
  id: 47 + i,
  henleNumber: null,
  unitNumber: unit,
  title: `Unit ${unit} Review`,
  subtitle: `Checkpoint · Unit ${unit} lessons recap`,
  subLessonIds: BASE_BOOKS.filter((b) => b.unitNumber === unit && b.kind === "lesson").flatMap(
    (b) => b.subLessonIds,
  ),
  kind: "unit-review",
}));

export const bookLessons: BookLesson[] = [...BASE_BOOKS, ...UNIT_REVIEW_BOOKS];

// Derived at module load: sub-lesson id (1–134) → BASE book id (1–46).
// Pure lookup map over the BASE books only (unit-review books re-cover the
// same ids — they must not displace a lesson's Henle book in this map); the
// shelf model may use it to attach a lesson to its book without scanning
// bookLessons every time.
export const subLessonToBook: Record<number, number> = {};
for (const book of BASE_BOOKS) {
  for (const sub of book.subLessonIds) {
    subLessonToBook[sub] = book.id;
  }
}
