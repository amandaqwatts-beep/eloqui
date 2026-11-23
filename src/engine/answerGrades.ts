/**
 * answerGrades.ts — Engine department: the graded-answer feedback system
 * (owner ruling 2026-11-22, "remove the law of excluded middle for answers").
 *
 * OWNER RULING (verbatim intent): "let all technically correct answers
 * through, but always give some helpful info and the most correct answer.
 * Perfect answers should just give trivia."
 *
 * The three-tier contract:
 *   1. PERFECT  — the answer equals the canonical/most-correct form:
 *                 feedback = trivia (an enrichment fact), never remediation;
 *                 the canonical form is confirmed.
 *   2. ACCEPTED — technically correct but not canonical (a captured alternate
 *                 gloss, a macron-lacking spelling, a hyphen-less ending):
 *                 PASS the answer, then ALWAYS show helpful info AND the
 *                 most-correct form. Never a bare "Correct!".
 *   3. REJECTED — always helpful info (mandatory, not optional) + the
 *                 most-correct answer.
 *
 * Doctrine constraints (work order, owner 11-22):
 *   - Deterministic code only: no LLM calls, no Math.random. Same answer +
 *     same item → same verdict + same feedback. Trivia selection is seeded by
 *     the UTC date (the generators' own daily-seed pattern), so a perfect
 *     answer can surface a different fact each session.
 *   - Never fabricate: acceptance alternates come ONLY from captured data —
 *     the exercise's captured acceptableAnswers, alternate glosses inside the
 *     captured vocab entry (sourceGloss), and the existing macron tolerance.
 *     Trivia comes ONLY from captured/verified material in three rings:
 *       (a) item-tied — captured teaching-step tips and culture-bundle lore
 *           that name the drilled item, the Book-2 VOCAB footnote texts mined
 *           from LATIN2_SECTION_VOCAB's trailing comments (verbatim, keyed to
 *           the drilled item), and the Book-2 boxed Latin-motto mini-bank
 *           (verbatim quote + source keyed to the host spine section);
 *       (b) topic-adjacent — the grammar-index topics the item's lesson or
 *           section trains (captured definitions); for Book-2 sections the
 *           ring widens with the section's own LATIN2_SECTION_GRAMMAR_REFS
 *           topics resolved against GRAMMAR_INDEX;
 *       (c) general enrichment — the curated culture bank (NLE culture
 *           B1–B6 bundles), the generalCulture bank (the research trivia
 *           census tranche 1: 37 verified facts), and the grammar-index
 *           definitions (PD-reference lore). Ring (a) is preferred when it
 *           exists.
 *   - No gimmicks: trivia is enrichment, not reward mechanics.
 *
 * Pure TypeScript — zero JSX, zero rendering, zero storage, zero
 * Math.random. Consumed by the shared phase-drill seam (screens/
 * PhaseDrillScreen → MultipleChoice / FillInBlank / MatchingPairs) so Book 1
 * and Book 2 get the graded feedback at once.
 */

import type { GeneratedExercise } from "~/engine/fallbackGenerator";
import { normalizeAnswer } from "~/engine/answers";
import type { Lesson } from "~/data/latinLessons";
import type { GrammarTopic } from "~/data/grammarIndex";
import { GRAMMAR_INDEX } from "~/data/grammarIndex";
import { LATIN2_SECTION_GRAMMAR_REFS } from "~/data/latin2";
import { CULTURE_TEACHING } from "~/data/cultureTeaching";
import { hashString, mulberry32 } from "~/engine/seededRandom";
import { utcDateStr } from "~/engine/dailyLesson";
/** The lesson VALUE rides the default export (named exports are types only). */
import LATIN_LESSONS_VALUE from "~/data/latinLessons";

// ── The graded verdict ─────────────────────────────────────────────────────

export type AnswerTier = "perfect" | "accepted" | "rejected";

export interface GradedAnswer {
  /** The tier the answer landed in. */
  tier: AnswerTier;
  /** Loop gating: perfect AND accepted both count as correct (pass through). */
  correct: boolean;
  /** The most-correct (canonical) form — confirmed on perfect, shown on
   *  accepted/rejected. Empty only for a revealed matching set (the grid
   *  itself displays every correct pair). */
  mostCorrect: string;
  /** Mandatory on accepted/rejected: why the answer works, nuance, or the
   *  captured entry note. Null only when the item carries no captured note. */
  helpfulInfo: string | null;
  /** Perfect tier only: an enrichment fact from the captured trivia pool
   *  (daily-seeded). Null when every pool is empty — the canonical
   *  confirmation then stands alone (omit gracefully). */
  trivia: string | null;
  /** What the student answered (the screens echo it back). */
  given: string | null;
}

/** How the student answered — the components know their own surface. */
export type GradeKind =
  | "typed" // fill-in-blank text input
  | "option" // multiple-choice selection (given = the option's text)
  | "match-complete" // matching: every pair matched
  | "match-gaveup"; // matching: answers revealed

export interface GradeContext {
  /** The host lesson — trivia pools (teaching tips) and Book-1 topic
   *  resolution. Book 1 passes its real Lesson; Book 2 its composed one. */
  lesson?: Lesson;
  /** The grammar topics the item's section trains (Book 2 wiring). Book 1
   *  resolves topics from the lesson id (GRAMMAR_INDEX relatedLessonIds). */
  topics?: GrammarTopic[];
  /** UTC date for the daily-seeded trivia rotation. Default utcDateStr(). */
  date?: string;
}

export type GradeChecker = (input: GradeCheckerInput) => GradedAnswer;

/** The checker's single argument — the components know their own surface. */
export interface GradeCheckerInput {
  exercise: GeneratedExercise;
  /** The typed answer / chosen option's text; null for matching. */
  given: string | null;
  kind: GradeKind;
}

// ── Normalization (deterministic; macron tolerance is an acceptance path) ──

/** Punctuation-insensitive answer key: the existing answer normalization
 *  (trim/lowercase/strip diacritics) plus punctuation removal. Hyphens are
 *  KEPT — "-ās" (a printed ending cell) and "ās" (typed bare) stay distinct,
 *  so the bare form lands in the ACCEPTED tier via the captured variants. */
function answerKey(s: string): string {
  return normalizeAnswer(s)
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the string carries combining marks (macrons/accents). */
function hasDiacritics(s: string): boolean {
  return /[\u0300-\u036f]/.test(s.normalize("NFD"));
}

/** The captured multi-gloss parts of an entry ("power / authority",
 *  "earth, land") — every part is captured data, so each is an honest
 *  acceptance alternate. */
function glossParts(sourceGloss: string): string[] {
  return sourceGloss
    .split(/\s*[/;,]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Leading English infinitive/article stripped ("to love" ≈ "love") — a
 *  normalization nicety for English answers, deterministic both ways. */
function stripArticle(s: string): string {
  return s.replace(/^(?:the|a|an|to)\s+/i, "").trim();
}

function englishKey(s: string): string {
  return answerKey(stripArticle(s));
}

/** The L→E direction of a generated exercise, read off its own prompt (the
 *  generators' fixed phrasings) — English-gloss acceptance applies only when
 *  the answer is an English gloss. */
function isEnglishAnswer(ex: GeneratedExercise): boolean {
  return /into English|English meaning|what does/i.test(ex.prompt);
}

// ── Item keying (which captured item is this exercise about) ───────────────

function normKey(s: string): string {
  return normalizeAnswer(s).trim();
}

/** The drilled item's stable key, from the generator-stamped fields when
 *  present (vocabLatin / lemmas), else derived from the exercise surface. */
function itemKeyOf(ex: GeneratedExercise): string | null {
  const stamped = (ex as { vocabLatin?: unknown }).vocabLatin;
  if (typeof stamped === "string" && stamped.trim()) return normKey(stamped);
  const lemmas = (ex as { lemmas?: unknown }).lemmas;
  if (Array.isArray(lemmas) && lemmas.length > 0) {
    const joined = lemmas.filter((l): l is string => typeof l === "string").join(" ");
    if (joined.trim()) return normKey(joined);
  }
  if (ex.type === "matching" && ex.pairs?.length) return normKey(ex.pairs[0].left);
  if (ex.type === "multiple-choice" && ex.options && ex.correctIndex != null) {
    return normKey(ex.options[ex.correctIndex] ?? "");
  }
  if (ex.answer) return normKey(ex.answer);
  return null;
}

// ── The trivia bank (three rings, all captured material) ───────────────────

interface TriviaFact {
  text: string;
  /** Normalized alphanumeric tokens — the matcher matches item headwords. */
  tokens: Set<string>;
}

function fact(text: string): TriviaFact {
  const tokens = new Set(
    normalizeAnswer(text)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2),
  );
  return { text, tokens };
}

/** Superscript footnote digits the printed headwords carry (the registry
 *  generators strip the same set before stamping vocabLatin). */
function stripFootnotes(s: string): string {
  return s.replace(/[\u00b9\u00b2\u00b3\u2070-\u209f]/g, "");
}

// ── Ring (a) extension 1: the Book-2 VOCAB footnote trivia ─────────────────
// The captured footnote texts ride as trailing comments on LATIN2_SECTION_VOCAB
// entries (src/data/latin2.ts) — copied VERBATIM here, no rephrasing. Keyed to
// the drilled item by the generator-stamped vocabLatin (footnote markers are
// stripped on both sides — the registry's own normalization — and normKey
// removes diacritics, so keys are written pre-normalized). The book's own note
// about the very word drilled: the most item-tied fact in the bank.
export const FOOTNOTE_TRIVIA: Record<string, string[]> = {
  "classis, classis": ["¹ abl. classī or classe"],
  "consul, consulis": ["² two consuls elected each year"],
  "-ne": ["¹ added to emphatic word—generally the verb—and put first"],
  nonne: ["² generally first in its clause"],
  "dedo, dedere, dedidi, deditus": [
    "¹ This verb always takes an object in Latin.",
  ],
  "abdo, abdere, abdidi, abditus": [
    "¹ This verb always takes an object in Latin.",
  ],
  sub: [
    "¹ sub takes the accusative whenever motion is expressed; otherwise ablative",
  ],
  inquit: ["¹ inquit with direct quotations only, after the quotation's first word"],
  "passus, us": [
    "¹ a pace was 5 Roman feet; a mile 5,000 Roman feet or 1,618 English yards",
  ],
  "mille passus": [
    "¹ a pace was 5 Roman feet; a mile 5,000 Roman feet or 1,618 English yards",
  ],
};

// ── Ring (a) extension 2: the Book-2 boxed Latin-motto mini-bank ────────────
// The book's boxed mottoes/quotations, verbatim from the section captures
// (research/henle-owner-notes/latin2-captures/part04-e1-e6.md and
// latin2-e7-16-precapture.md), keyed to the spine sections they ride with.
// quote/translation/source/fns are copied VERBATIM: translation only where the
// capture prints one; fns = the captured footnote glosses (the book's own
// translation aids); source null where the book attributes nothing.
export interface LatinMottoFact {
  quote: string;
  translation: string | null;
  source: string | null;
  fns: string | null;
  /** Book-2 spine section prefixes ("part4-lNN") the box rides with. */
  sectionIds: string[];
}

export const LATIN2_MOTTOES: LatinMottoFact[] = [
  {
    quote: "Pretiōsa¹ in cōnspectū² Deī mors sānctōrum ējus!",
    translation: null,
    source: "The Roman Breviary",
    fns: "¹ pretiōsus, a, um, valuable, precious. ² cōnspectus, ūs, sight.",
    sectionIds: ["part4-l02"],
  },
  {
    quote: "SILENT¹ LĒGĒS INTER ARMA.",
    translation: null,
    source: "Cicero",
    fns: "¹ sileō, silēre, siluī, 2, intr., am silent, keep silent.",
    sectionIds: ["part4-l03"],
  },
  {
    quote: "Dominus det nōbīs suam pācem.",
    translation: "May God give us His peace.",
    source: null,
    fns: null,
    sectionIds: ["part4-l04"],
  },
  {
    quote:
      "VĪVĀS IN DEŌ / VĪVĀS INTER SĀNCTŌS / SOPHRONIA,¹ SOPHRONIA DULCIS² VĪVĀS IN DEŌ",
    translation: null,
    source: "catacomb grave inscriptions",
    fns: "¹ Sophronia, ae, Sophronia, a girl's name. ² dulcis, e, sweet.",
    sectionIds: ["part4-l04"],
  },
  {
    quote:
      "Bonus, etiamsī¹ servus sit,¹ liber est; malus, autem, etiamsī¹ rēx sit,¹ servus est.",
    translation: null,
    source: "Adapted from Dē Cīvitāte Deī, St. Augustine",
    fns: "etiamsī … sit: even if",
    sectionIds: ["part4-l04"],
  },
  {
    quote: "Honōrā² patrem tuum et mātrem tuam.",
    translation: null,
    source: "The Fourth Commandment",
    fns: null,
    sectionIds: ["part4-l06"],
  },
  {
    quote: "JŪSTITIA¹ OMNIBUS",
    translation: null,
    source: "Motto of the District of Columbia",
    fns: "¹ jūstitia, ae, justice.",
    sectionIds: ["part4-l07"],
  },
  {
    quote: "Timeat Dominum omnis terra.",
    translation: null,
    source: "The Roman Breviary",
    fns: null,
    sectionIds: ["part4-l09"],
  },
  {
    quote: "Sī¹ Deus prō nōbīs, quis contrā nōs?",
    translation: null,
    source: "Sānctus Paulus",
    fns: "¹ sī, conj., if.",
    sectionIds: ["part4-l11"],
  },
  {
    quote: "Vīvent nōmina eōrum in aeternum.²",
    translation: null,
    source: "Office of the Martyrs, The Roman Breviary",
    fns: "² in aeternum: unto eternity, forever.",
    sectionIds: ["part4-l11"],
  },
  {
    quote: "Fortī et fidēlī¹ nihil difficile.",
    translation: null,
    source: null,
    fns: "¹ fidēlis, e, faithful.",
    sectionIds: ["part4-l12"],
  },
  {
    quote: "Nil sine magnō / Vīta labōre dedit mortālibus.¹",
    translation: null,
    source: "Horace",
    fns: "¹ mortālibus: to mortals, i.e., to men. ² Quintus Horatius Flaccus, a Roman poet.",
    sectionIds: ["part4-l12"],
  },
  {
    quote: "Benedictus² quī venit in nōmine Dominī.",
    translation: null,
    source: null,
    fns: "² benedictus, a, um, blessed.",
    sectionIds: ["part4-l13"],
  },
  {
    quote: "Quis plūrimum habet? Is quī omnium minimum cupit.",
    translation: null,
    source: "Publīlius Syrus",
    fns: null,
    sectionIds: ["part4-l14"],
  },
  {
    quote:
      "Optima hērēditās⁶ ā patribus liberī⁷ trāditur—glōria virtūtis atque rērum gestārum.⁸",
    translation: null,
    source: "Cicero",
    fns: null,
    sectionIds: ["part4-l14"],
  },
  {
    quote: "Ad Mājōrem Deī Glōriam",
    translation: null,
    source: "Motto of the Jesuits",
    fns: null,
    sectionIds: ["part4-l15"],
  },
  {
    quote: "Nōn quī parum habet sed quī plūs cupit pauper¹ est.",
    translation: null,
    source: "Seneca",
    fns: "¹ pauper, pauperis, a poor man.",
    sectionIds: ["part4-l16"],
  },
  {
    quote: "Quī mājōra cupit — Saepe minōra capit.",
    translation: null,
    source: "A PROVERB",
    fns: null,
    sectionIds: ["part4-l16"],
  },
];

/** The displayed motto line, composed deterministically from the verbatim
 *  fields (quote — translation — source (fns)); a perfect-answer aside. */
export function latinMottoText(m: LatinMottoFact): string {
  let t = `"${m.quote}"`;
  if (m.translation) t += ` — ${m.translation}`;
  if (m.source) t += ` — ${m.source}`;
  if (m.fns) t += ` (${m.fns})`;
  return t;
}

// ── Ring (c) extension: the general culture bank (research tranche 1) ───────
// research/trivia-bank-draft.md (research, 2026-11-23): 40 facts verified
// against the team's own captured sources. The 37 traceable to captured
// bundles (cuN-qN ids) or side lessons (sideNNN) land here — fact text and
// source line VERBATIM from the draft (list indentation stripped). The three
// flagged facts (23, 30, 40 — classical attestations NOT found in the
// captured bundles) stay out per the never-unsourced rule, kept in the
// pending block below for a later research pass. Rotation: the pool merges
// into ring (c) of the daily-seeded selector (pickTrivia) behind rings
// (a)/(b) — the existing precedence, unchanged.

export interface GeneralCultureFact {
  /** The fact, verbatim from research/trivia-bank-draft.md. */
  text: string;
  /** The draft's verbatim source line (bundle id + captured citation) —
   *  the provenance trail, carried in the data. */
  source: string;
}

export const GENERAL_CULTURE_TRIVIA: GeneralCultureFact[] = [
  // Draft fact 1
  {
    text: "The toga — a large, heavy woollen garment worn over the tunica — was the badge of the Roman male citizen, worn for formal occasions, in the Forum, and in court. The stola and palla were the respectable married woman's dress and shawl; the calceus was the shoe.",
    source: "Source: cu90-q1 (OCD s.v. toga; L&S s.v. induō).",
  },
  // Draft fact 2
  {
    text: "The city domus opened onto the ātrium, a central reception hall lit by an opening in the roof, with the cubiculum (bedroom) and trīclīnium (dining room) off it. The poor of Rome lived in tall apartment blocks called īnsulae — literally \"islands.\"",
    source: "Source: cu98-q1 (OCD s.v. domus; Vitruvius, De Architectura 6.4–5).",
  },
  // Draft fact 3
  {
    text: "Romans ate a light breakfast and a light midday prandium; the real meal was the evening cēna, formally served in three courses (tria fercula). A plebeian with no kitchen ate at a taberna.",
    source: "Source: cu108-q1 (OCD s.v. cena; Cato, De Agricultura 156).",
  },
  // Draft fact 4
  {
    text: "Rome had no state schools: elementary schooling was private and fee-paying, run by a magister lūdī in a rented room or shop, with boys usually starting around age seven.",
    source: "Source: cu56-q1 (OCD s.v. education, Roman).",
  },
  // Draft fact 5
  {
    text: "The paterfamilias held patria potestas — legal power over his children and the household's slaves; the household was his to govern.",
    source: "Source: cu57-q1 (OCD s.v. paterfamilias / patria potestas).",
  },
  // Draft fact 6
  {
    text: "In Roman law, familia meant the whole household under the paterfamilias — family and slaves together, more than blood relatives — and was the basic unit of Roman society; domus, by contrast, meant only the physical house.",
    source: "Source: cu60-q1 (OCD s.v. familia).",
  },
  // Draft fact 7
  {
    text: "Manumissiō, the formal freeing of a slave, literally means \"a sending from the hand\" (manus + missiō). The freed person (lībertus/līberta) became a citizen of restricted status, barred from some offices; their children were born full citizens.",
    source: "Sources: cu59-q1, cu65-q1 (OCD s.v. manumission; s.v. freedmen, freedwomen).",
  },
  // Draft fact 8
  {
    text: "Mornings belonged to business and the law-courts; from the afternoon on the city turned to leisure — washing, exercise, and conversation at the great public thermae, or a smaller private balneum.",
    source: "Source: cu111-q1 (OCD s.v. baths/thermae).",
  },
  // Draft fact 9
  {
    text: "The forum was Rome's civic, commercial, and judicial center: shops lined the colonnades, merchants sold their goods, and judges heard cases.",
    source: "Source: side107, latinSideLessons.ts (\"A Forum Mystery\" context).",
  },
  // Draft fact 10
  {
    text: "Romans carved short inscriptions (titulī) on stone and metal to record names, dedications, honors, and ownership.",
    source: "Source: side110, latinSideLessons.ts (\"Mastery Through Roman Inscriptions\" context).",
  },
  // Draft fact 11
  {
    text: "The genius was the protective spirit associated with a Roman man and his household, receiving offerings in household religion — not the modern English sense \"brilliant person.\"",
    source: "Source: side102, latinSideLessons.ts (\"A Roman Household and its Genius\" context).",
  },
  // Draft fact 12
  {
    text: "By the traditional (Varronian) dating Romans counted 753 BC as the city's founding, with Romulus the legendary founder — his twin Remus died in the rivalry before the city was built.",
    source: "Source: cu9-q1 (OCD s.v. Rome (history); Livy 1.6–7).",
  },
  // Draft fact 13
  {
    text: "Lucius Tarquinius Superbus was traditionally the last king, expelled c. 509 BC; the new state called itself rēs pūblica, \"the public thing\" — and Roman hatred of kings ran so deep that calling a man rēx stayed a political charge for centuries, even under the emperors.",
    source: "Source: cu33-q1 (Livy 1.49–60; OCD s.v. Tarquinius Superbus).",
  },
  // Draft fact 14
  {
    text: "The Via Appia, Rome's first great paved road, was begun in 312 BC under the censor Appius Claudius and ran from Rome toward Capua (later extended to Brundisium); Roman roads used layered construction with bridges, drainage, and durable stonework.",
    source: "Sources: cu26-q1 (OCD s.v. via Appia) + side114 (road-engineering context).",
  },
  // Draft fact 15
  {
    text: "Rome's oldest bridge over the Tiber was the wooden Pons Sublicius, built of timber without iron and attributed by tradition to King Ancus Marcius; it was the city's only crossing for centuries and was kept in repair by the priests as a sacred relic.",
    source: "Source: cu32-q1 (Livy 1.33.6; OCD s.v. Pons Sublicius).",
  },
  // Draft fact 16
  {
    text: "Between 58 and 50 BC Caesar conquered Gaul and recounted the war himself in the Commentarii de Bello Gallico — written in the third person, in the plainest style; its opening \"Gallia est omnis divisa in partes tres\" is still many students' first Latin prose.",
    source: "Source: cu27-q1 (OCD s.v. Caesar; Caesar, Bellum Gallicum 1.1).",
  },
  // Draft fact 17
  {
    text: "In 49 BC Caesar brought his army to the Rubicon, the boundary of his province; crossing it with armed force meant civil war against Pompey and the Senate — and \"crossing the Rubicon\" is still our phrase for an irreversible decision.",
    source: "Source: cu37-q1 (Suetonius, Divus Iulius 32; OCD s.v. Rubicon).",
  },
  // Draft fact 18
  {
    text: "A legion of Caesar's day was ten cohorts, nominally about five thousand men, and rarely at full strength on campaign; wherever it stopped for the night it built a fresh fortified camp, digging a ditch (fossa) and raising a rampart (vallum) — a routine Polybius describes in detail.",
    source: "Sources: cu34-q1 + cu35-q1 (OCD s.v. legion; Polybius 6.27–34).",
  },
  // Draft fact 19
  {
    text: "The legionary's standard kit was the pilum — a heavy javelin thrown to break the enemy's shield-wall, designed to bend on impact so it could not be thrown back — and the gladius, the short sword for close work.",
    source: "Source: cu41-q1 (OCD s.v. army, Roman; also pilum, gladius).",
  },
  // Draft fact 20
  {
    text: "In 218 BC, in the Second Punic War, the Carthaginian general Hannibal crossed the Alps with an army that included war elephants — most of the elephants did not survive the crossing.",
    source: "Source: cu53-q1 (Livy 21.31–38; OCD s.v. Hannibal).",
  },
  // Draft fact 21
  {
    text: "Spartacus, a Thracian sold into slavery and trained as a gladiator, led the Third Servile War (73–71 BC) — the largest slave uprising Rome ever faced, finally crushed by Crassus.",
    source: "Source: cu70-q1 (OCD s.v. Spartacus; Appian, Civil Wars 1.116–120).",
  },
  // Draft fact 22
  {
    text: "The triumph was the highest honor a Roman commander could receive: the victorious general rode in a chariot through the city, his soldiers sang, and the procession ended at the temple of Jupiter Optimus Maximus on the Capitoline, where he thanked Jupiter for the victory.",
    source: "Source: cu1-q1 (OCD s.v. triumph; cf. Beard, The Roman Triumph, 2007).",
  },
  // Draft fact 24
  {
    text: "Rome's three chief gods — Iuppiter, Iūnō, and Minerva — were worshipped together in the great temple on the Capitoline Hill (the Capitoline triad), and Romans used their Roman names, not the Greek (Zeus, Hera, Athena).",
    source: "Source: cu120-q1 (OCD s.v. Capitolium; Livy 1.55).",
  },
  // Draft fact 25
  {
    text: "Other gods of the Roman world: Mārs (war), Venus (love), and Neptūnus (the sea).",
    source: "Source: cu120-q1.",
  },
  // Draft fact 26
  {
    text: "Jupiter's Capitoline temple was dedicated to Iuppiter Optimus Maximus — \"Jupiter Best and Greatest.\"",
    source: "Source: cu1-q1/cu120-q1 (OCD s.v. Capitolium).",
  },
  // Draft fact 27
  {
    text: "Before public business, an augur read the gods' will from the flight of birds; the state's chief priest, head of the college of priests, was the pontifex maximus.",
    source: "Source: cu127-q1 (OCD s.v. augures; s.v. pontifex).",
  },
  // Draft fact 28
  {
    text: "Religious rites marked the whole of Roman life — vows (vōta), the wedding (nūptiae), the funeral (fūnus) — and the virtue binding it all was pietās: dutiful love of gods, country, and family.",
    source: "Source: cu127-q1 (OCD s.v. pietas; s.v. marriage/funus).",
  },
  // Draft fact 29
  {
    text: "Every family tended its own household gods, the Larēs and the protecting Genius; the state did on a grander scale what the family did in its house, keeping public cult in temples under its priesthoods.",
    source: "Source: cu127-q1 + side102 (household-religion context).",
  },
  // Draft fact 31
  {
    text: "English \"triumph\" is straight from triumphus, and \"victory\" and \"glorious\" come from victōria and glōria — the vocabulary of a Roman victory parade.",
    source: "Source: cu1-q1 (L&S s.v. triumphus).",
  },
  // Draft fact 32
  {
    text: "Agricola, \"farmer,\" is literally a \"field-tiller\" (ager \"field\" + colō \"I till\"); the same pair gives English \"agriculture\" (ager + cultura).",
    source: "Source: cu2-q1 (L&S s.v. agricola).",
  },
  // Draft fact 33
  {
    text: "Prōvincia \"province\" is literally \"the conquered land\" (prō + vincere), and the same root vincere gives English \"victor\" and \"invincible\"; provinces were governed by Roman magistrates (proconsuls and propraetors) sent out from Rome with imperium.",
    source: "Source: cu4-q1 (OCD s.v. province; L&S s.v. prōvincia).",
  },
  // Draft fact 34
  {
    text: "Caesar's cognomen outlived the Republic: it became \"kaiser\" in German and \"tsar\" in Russian.",
    source: "Source: cu58-q1 (tip; OCD s.v. names, personal, Roman — the tria nomina).",
  },
  // Draft fact 35
  {
    text: "Pōns \"bridge\" survives in English \"pontoon\" — and in Pontifex Maximus, the chief priest's title, literally \"bridge-builder.\"",
    source: "Source: cu32-q1 (L&S s.v. pōns).",
  },
  // Draft fact 36
  {
    text: "Rēs pūblica, \"the public thing,\" gave English \"republic\"; \"public\" itself comes from populus, \"the people\"; and rēx survives in \"regal\" and \"royal.\"",
    source: "Source: cu33-q1 (L&S s.v. rēs pūblica).",
  },
  // Draft fact 37
  {
    text: "Lūdus means \"game, play\" — and by extension \"school\": Roman schooling was literally a \"play-place\" for children (hence magister lūdī).",
    source: "Source: cu56-q1 (L&S s.v. lūdus).",
  },
  // Draft fact 38
  {
    text: "Trīclīnium, the dining room, is built on the same number-root as trēs, \"three\" — named for its three couches arranged around the table.",
    source: "Source: cu108-q1 (OCD s.v. cena context).",
  },
  // Draft fact 39
  {
    text: "Ālea iacta est — \"the die is cast\" — is Suetonius' phrase for Caesar at the Rubicon, still used whenever a gamble is made.",
    source: "Source: cu37-q1 (Suetonius, Divus Iulius 32).",
  },
];

// ── PENDING ON-DISK VERIFICATION — the draft's flagged facts ────────────────
// NOT in the bank: classical attestations the captured bundles do not carry.
// A later research pass either sources them on disk or drops them. Verbatim
// from the draft:
// 23. [FLAGGED — not in captured bundles] The Ides fell on the 15th of March, May, July, and October (the 13th in other months); Caesar was assassinated on the Ides of March, 15 March 44 BC.
// Source: standard Roman-calendar scholarship (classical attestation; flag for the bank).
// 30. [FLAGGED — not in captured bundles] Roman tradition told how the exposed twins Romulus and Remus were suckled by a she-wolf (lupa) beside the Tiber before the founding.
// Source: Livy 1.4 (classical attestation; flag for the bank).
// 40. [FLAGGED — not in captured bundles] Two classical phrases still in modern use: Caesar's report of a swift victory, vēnī, vīdī, vīcī ("I came, I saw, I conquered"), and Horace's carpe diem — carpe literally "pluck," so "pluck the day."
// Sources: Suetonius, Divus Iulius 37; Horace, Odes 1.11.8 (classical attestations; flag for the bank).

interface TriviaBank {
  /** Ring (a) sources: captured tips (Book-1 teaching steps, culture lore). */
  itemFacts: TriviaFact[];
  /** Ring (b)/(c) sources: captured grammar-index definitions. */
  topicDefs: TriviaFact[];
  /** Ring (c) sources: the curated culture bank's step explanations. */
  generalFacts: TriviaFact[];
  /** Ring (a) item-tied footnote facts: normalized item key → verbatim
   *  footnote texts from the Book-2 VOCAB comments. */
  footnoteFacts: Map<string, TriviaFact[]>;
  /** Ring (a) section-tied mottoes: section prefix ("part4-lNN") → the
   *  boxed mottoes that ride with it (verbatim quote + source). */
  mottoesBySection: Map<string, TriviaFact[]>;
  /** Ring (c) general culture bank — the research trivia-census tranche 1
   *  (37 verified facts, GENERAL_CULTURE_TRIVIA); the pool merges it. */
  generalCulture: TriviaFact[];
}

let BANK: TriviaBank | null = null;

function triviaBank(): TriviaBank {
  if (BANK) return BANK;
  const itemFacts: TriviaFact[] = [];
  for (const lesson of LATIN_LESSONS_VALUE) {
    for (const step of lesson.teachingSteps ?? []) {
      if (step.tip) itemFacts.push(fact(step.tip));
    }
  }
  for (const bundle of Object.values(CULTURE_TEACHING)) {
    for (const step of bundle.steps) {
      if (step.tip) itemFacts.push(fact(step.tip));
    }
  }
  const topicDefs = GRAMMAR_INDEX.filter((t) => t.definition).map((t) =>
    fact(t.definition),
  );
  const generalFacts: TriviaFact[] = [];
  for (const bundle of Object.values(CULTURE_TEACHING)) {
    for (const step of bundle.steps) {
      if (step.explanation) generalFacts.push(fact(step.explanation));
    }
  }
  // Ring (a) extension: footnote facts keyed by the drilled item, mottoes
  // keyed by their spine section. Both carry verbatim captured text.
  const footnoteFacts = new Map<string, TriviaFact[]>();
  for (const [key, texts] of Object.entries(FOOTNOTE_TRIVIA)) {
    footnoteFacts.set(
      normKey(key),
      texts.map((t) => fact(t)),
    );
  }
  const mottoesBySection = new Map<string, TriviaFact[]>();
  for (const m of LATIN2_MOTTOES) {
    const composed = fact(latinMottoText(m));
    for (const section of m.sectionIds) {
      const pool = mottoesBySection.get(section) ?? [];
      pool.push(composed);
      mottoesBySection.set(section, pool);
    }
  }
  BANK = {
    itemFacts,
    topicDefs,
    generalFacts,
    footnoteFacts,
    mottoesBySection,
    generalCulture: GENERAL_CULTURE_TRIVIA.map((f) => fact(f.text)),
  };
  return BANK;
}

/** The grammar topics a Book-1 lesson trains (captured mapping). */
function topicsForLesson(lesson: Lesson | undefined): GrammarTopic[] {
  if (!lesson) return [];
  return GRAMMAR_INDEX.filter((t) => t.relatedLessonIds.includes(lesson.id));
}

// ── Book-2 section resolution (the motto / grammar-lore keys) ───────────────
// Book-2 spine lessons ride the 2000-range id namespace (lib/latin2Sections:
// LATIN2_SECTION_BASE_ID + the section's Henle lesson number, e.g.
// part4-l12-comparison-quam → 2012). Resolve that id back to its section
// prefix — validated against the captured spine's own grammar-ref keys — so
// the motto mini-bank and the section's grammar-index lore key off the host
// section without any new screen wiring.

/** The Book-2 synthetic lesson-id base (lib/latin2Sections's own constant). */
const LATIN2_SECTION_BASE_ID = 2000;

/** The section prefix ("part4-lNN") a 2000-range lesson id belongs to — null
 *  for anything that is not a captured Book-2 spine section. */
export function latin2SectionPrefix(lessonId: number): string | null {
  const n = lessonId - LATIN2_SECTION_BASE_ID;
  if (!(n >= 1 && n <= 32)) return null;
  const prefix = `part4-l${String(n).padStart(2, "0")}`;
  for (const key of Object.keys(LATIN2_SECTION_GRAMMAR_REFS)) {
    if (key.startsWith(`${prefix}-`)) return prefix;
  }
  return null;
}

/** The grammar-index topics the section's own GRAMMAR_REFS map to — the
 *  captured topic ids, resolved against GRAMMAR_INDEX in book order. */
export function latin2SectionGrammarTopics(prefix: string): GrammarTopic[] {
  const ids = new Set<string>();
  for (const key of Object.keys(LATIN2_SECTION_GRAMMAR_REFS)) {
    if (!key.startsWith(`${prefix}-`)) continue;
    for (const ref of LATIN2_SECTION_GRAMMAR_REFS[key]) ids.add(ref);
  }
  return GRAMMAR_INDEX.filter((t) => ids.has(t.id));
}

/** Headword tokens of the drilled item — latin headword tokens, then the
 *  English gloss head token, so either direction can tie a fact. */
function itemTokens(ex: GeneratedExercise): Set<string> {
  const out = new Set<string>();
  const add = (s: string) => {
    for (const t of normalizeAnswer(s).split(/[^a-z0-9]+/)) {
      if (t.length > 2) out.add(t);
    }
  };
  const stamped = (ex as { vocabLatin?: unknown }).vocabLatin;
  if (typeof stamped === "string") add(stamped);
  if (ex.type === "multiple-choice" && ex.options && ex.correctIndex != null) {
    add(ex.options[ex.correctIndex] ?? "");
  }
  if (ex.answer) add(ex.answer);
  return out;
}

/**
 * Trivia for a PERFECT answer — three rings, preferred ring (a); deterministic
 * per (item, date): the daily-seeded rotation, same UTC-date pattern the
 * generators use, so a perfect answer can surface a different fact each
 * session. Returns null only when every pool is empty (omit gracefully).
 */
function pickTrivia(
  ex: GeneratedExercise,
  ctx: GradeContext,
  date: string,
): string | null {
  const bank = triviaBank();
  const item = itemTokens(ex);
  const itemKey = itemKeyOf(ex) ?? "general";
  const rng = mulberry32(hashString(`trivia|${date}|${itemKey}`));
  const pickFrom = (pool: TriviaFact[]): string | null => {
    if (pool.length === 0) return null;
    return pool[Math.floor(rng() * pool.length)].text;
  };

  // The Book-2 spine section the drilled item belongs to (mottoes + the
  // section's grammar-index lore key off it); null on Book 1.
  const sectionPrefix =
    ctx.lesson && Number.isFinite(ctx.lesson.id)
      ? latin2SectionPrefix(ctx.lesson.id)
      : null;

  // Ring (a0) — the book's own footnote on the drilled word (Book-2 VOCAB
  // footnote comments, verbatim, keyed by the generator-stamped item). The
  // most item-tied fact in the bank; markers normalized away on both sides.
  const footnotePool =
    bank.footnoteFacts.get(normKey(stripFootnotes(itemKey))) ?? [];
  const a0 = pickFrom(footnotePool);
  if (a0) return a0;

  // Ring (a) — item-tied: captured tips naming the item; then the host
  // lesson's own captured tips (Book 1's teaching-step lore); then the host
  // Book-2 section's boxed mottoes (verbatim quote + source from the
  // captures — the section's stand-in lore, since composed spine lessons
  // carry no teaching steps).
  const tied = bank.itemFacts.filter((f) => {
    for (const t of item) if (f.tokens.has(t)) return true;
    return false;
  });
  const lessonTips: TriviaFact[] = [];
  if (ctx.lesson) {
    for (const step of ctx.lesson.teachingSteps ?? []) {
      if (step.tip) lessonTips.push(fact(step.tip));
    }
  }
  const mottoes = sectionPrefix
    ? (bank.mottoesBySection.get(sectionPrefix) ?? [])
    : [];
  const ringA =
    tied.length > 0 ? tied : lessonTips.length > 0 ? lessonTips : mottoes;
  const a = pickFrom(ringA);
  if (a) return a;

  // Ring (b) — topic-adjacent: the grammar topics this lesson/section trains
  // (captured definitions), widened by the host Book-2 section's own mapped
  // GRAMMAR_REFS lore and by any topic whose keywords name the item.
  const baseTopics = ctx.topics && ctx.topics.length > 0
    ? ctx.topics
    : topicsForLesson(ctx.lesson);
  const sectionTopics = sectionPrefix
    ? latin2SectionGrammarTopics(sectionPrefix).filter(
        (t) => !baseTopics.includes(t),
      )
    : [];
  const extraTopics = GRAMMAR_INDEX.filter(
    (t) =>
      !baseTopics.includes(t) &&
      !sectionTopics.includes(t) &&
      t.keywords.some((k) => {
        const kt = normKey(k);
        return kt.length > 2 && item.has(kt);
      }),
  );
  const ringB = [...baseTopics, ...sectionTopics, ...extraTopics]
    .map((t) => fact(t.definition))
    .filter((f) => f.text.length > 0);
  const b = pickFrom(ringB);
  if (b) return b;

  // Ring (c) — general enrichment: the curated culture bank, the general
  // culture bank (research tranche 1: 37 verified facts), and the grammar
  // index's definitions (verified PD-reference lore).
  return pickFrom([...bank.generalFacts, ...bank.generalCulture, ...bank.topicDefs]);
}

// ── Helpful info (mandatory on accepted/rejected) ──────────────────────────

/** The captured entry line for a vocab exercise ("auctōritās — power /
 *  authority") — built only from the generator-stamped captured fields. */
function entryLine(ex: GeneratedExercise): string | null {
  const latin = (ex as { vocabLatin?: unknown }).vocabLatin;
  const gloss = (ex as { sourceGloss?: unknown }).sourceGloss;
  if (typeof latin === "string" && typeof gloss === "string" && latin && gloss) {
    return `"${latin}" — ${gloss.replace(/[{}]/g, "").trim()}.`;
  }
  return null;
}

// ── The tier matcher ───────────────────────────────────────────────────────

interface TierOutcome {
  tier: AnswerTier;
  /** Why this tier — captured-derived note (macron, entry alternate). */
  note: string | null;
}

/** Grade one typed/chosen answer against the canonical one. Acceptance comes
 *  ONLY from captured data: the exercise's acceptableAnswers, the captured
 *  entry's alternate glosses, and the existing macron tolerance. */
function matchAnswer(
  given: string,
  canonical: string,
  ex: GeneratedExercise,
): TierOutcome {
  const ki = isEnglishAnswer(ex) ? englishKey(given) : answerKey(given);
  const kc = isEnglishAnswer(ex) ? englishKey(canonical) : answerKey(canonical);

  if (ki === kc && ki.length > 0) {
    // Same key — but a macron-bearing canonical typed macron-less is only
    // technically correct: pass it, show the macron. Likewise an English
    // answer that matches only after article/infinitive stripping ("love"
    // for the canonical "to love") is technically correct, not canonical.
    if (hasDiacritics(canonical) && !hasDiacritics(given)) {
      return {
        tier: "accepted",
        note: `Also correct — the macron matters: ${canonical}.`,
      };
    }
    if (isEnglishAnswer(ex) && answerKey(given) !== answerKey(canonical)) {
      return {
        tier: "accepted",
        note: `Also correct — the entry's gloss reads ${canonical}.`,
      };
    }
    return { tier: "perfect", note: null };
  }

  // Captured alternates shipped on the exercise (macron variants, hyphen-less
  // endings, gloss alternates, article-less sentence variants).
  const acceptable = ex.acceptableAnswers ?? [];
  for (const a of acceptable) {
    const ka = isEnglishAnswer(ex) ? englishKey(a) : answerKey(a);
    if (ka === ki && ki.length > 0) return { tier: "accepted", note: null };
  }

  // Captured multi-gloss alternates from the entry itself (e.g. the book
  // prints "power / authority"): any captured part — or the full entry —
  // is a technically-correct English answer.
  const gloss = (ex as { sourceGloss?: unknown }).sourceGloss;
  if (isEnglishAnswer(ex) && typeof gloss === "string" && gloss) {
    const cleaned = gloss.replace(/[{}]/g, "").trim();
    for (const part of glossParts(cleaned)) {
      if (englishKey(part) === ki && ki.length > 0) {
        return {
          tier: "accepted",
          note: `Also correct — "${part}" is one of the entry's meanings: ${cleaned}.`,
        };
      }
    }
    if (englishKey(cleaned) === ki && ki.length > 0) {
      return {
        tier: "accepted",
        note: `Also correct — the entry's full gloss is ${cleaned}.`,
      };
    }
  }

  return { tier: "rejected", note: null };
}

// ── The checker the seam wires in ──────────────────────────────────────────

/**
 * Build the graded checker one loop screen passes down to the shared
 * answer-checker components. Pure and closed over captured data: same
 * (exercise, given, date) → same verdict, byte for byte.
 */
export function buildGradeChecker(ctx: GradeContext = {}): GradeChecker {
  const date = ctx.date ?? utcDateStr();
  return ({ exercise, given, kind }): GradedAnswer => {
    const canonical = canonicalOf(exercise);

    // Matching: the two-pass surface — all pairs matched (perfect) or the
    // answers revealed (rejected; the grid itself shows every correct pair).
    if (kind === "match-complete" || kind === "match-gaveup") {
      const perfect = kind === "match-complete";
      return {
        tier: perfect ? "perfect" : "rejected",
        correct: perfect,
        mostCorrect: perfect ? canonical ?? "" : "",
        helpfulInfo: perfect
          ? null
          : "Every correct match is now revealed above — read the set once, then try it fresh.",
        trivia: perfect
          ? pickTrivia(exercise, ctx, date)
          : null,
        given,
      };
    }

    if (given === null || given.trim().length === 0 || !canonical) {
      // Nothing to grade (defensive — the components never call this way).
      return {
        tier: "rejected",
        correct: false,
        mostCorrect: canonical ?? "",
        helpfulInfo: exercise.explanation ?? entryLine(exercise),
        trivia: null,
        given,
      };
    }

    const outcome = matchAnswer(given, canonical, exercise);

    if (outcome.tier === "perfect") {
      return {
        tier: "perfect",
        correct: true,
        mostCorrect: canonical,
        helpfulInfo: null, // never remediation — trivia only
        trivia: pickTrivia(exercise, ctx, date),
        given,
      };
    }

    if (outcome.tier === "accepted") {
      return {
        tier: "accepted",
        correct: true,
        mostCorrect: canonical,
        helpfulInfo:
          outcome.note ?? exercise.explanation ?? entryLine(exercise),
        trivia: null,
        given,
      };
    }

    return {
      tier: "rejected",
      correct: false,
      mostCorrect: canonical,
      helpfulInfo: exercise.explanation ?? entryLine(exercise),
      trivia: null,
      given,
    };
  };
}

/** The exercise's canonical/most-correct answer, per surface. */
function canonicalOf(ex: GeneratedExercise): string | null {
  if (ex.type === "multiple-choice" && ex.options && ex.correctIndex != null) {
    return ex.options[ex.correctIndex] ?? null;
  }
  if (ex.type === "fill-in-blank") return ex.answer ?? null;
  if (ex.type === "matching" && ex.pairs?.length) {
    return ex.pairs.map((p) => `${p.left} — ${p.right}`).join("; ");
  }
  return null;
}
