// Eloqui — Cross-language side lessons 1007–1008 (Latin ↔ English).
// Data-only file (build spec: research/cross-language-1007-1008-build.md; D1–D9 ratified).
// This file merges independently — nothing imports it yet (zero runtime risk);
// engine (src/engine/crossLanguage.ts + CROSS_PROGRESS storage key) and screens
// (CrossLanguageScreen, ComparisonPanel, route /languages/connections) integration
// is a separate later PR.
// Interfaces are defined in-file per the spec §2; exercises stay within the existing
// Exercise union from latinLessons.ts. Gates per ratified D1: 1007 unlocks at
// English 2004 (not 2005 — 2005 is Greek roots); 1008 at English 2002.
import type { Exercise, VocabularyItem, TeachingStep, ComprehensionQuestion } from "./latinLessons";
import type { Language } from "./languages";

export interface CrossLanguageRequirement {
  language: Language;          // "latin" | "english"
  minLessonId: number;
  unlockMode?: "completed" | "unlocked";   // default "completed"
}

export interface CrossLanguageTerm {
  language: Language;
  term: string;
  romanization?: string;       // for Latin: macron-preserving form; for English: omit
  pronunciation?: string;
  meaning: string;
  gender?: string;
}

export interface CrossLanguageComparison {
  id: string;
  category: "cognate" | "parallel" | "grammar" | "culture" | "false-friend";
  topic: string;
  left: CrossLanguageTerm;
  right: CrossLanguageTerm;
  note: string;
}

export interface CrossLanguageSideLesson {
  id: number;
  pair: "latin-english";                      // CrossLanguagePair per plan
  languages: [Language, Language];
  title: string;
  subtitle?: string;
  concept: string;
  context: string;
  requires: CrossLanguageRequirement[];
  comparisons: CrossLanguageComparison[];
  vocabulary: VocabularyItem[];               // optional enrichment
  teachingSteps?: TeachingStep[];             // SPEC ADDITION
  comprehensionCheck?: ComprehensionQuestion[]; // SPEC ADDITION
  exercises: Exercise[];                      // 8 per the lead's brief (design said 3–4)
  optional: true;
}

const crossLanguageLessons: CrossLanguageSideLesson[] = [
  // ── 1007 · LATIN INSIDE ENGLISH: ROOTS OF FORMAL WORDS ──────────
  {
    id: 1007,
    pair: "latin-english",
    languages: ["latin", "english"],
    title: "Latin Inside English: Roots of Formal Words",
    subtitle: "How dict-, scrib-, and duc- power formal English",
    concept:
      "English has a native layer (start, get) and a Latin layer (commence, obtain). The formal register of English is largely the Latin layer: roots like <strong>dict-</strong> (from <em>dīcō</em>, 'say'), <strong>scrib-/script-</strong> (from <em>scrībō</em>, 'write'), and <strong>duc-</strong> (from <em>dūcō</em>, 'lead') power words like <em>predict</em>, <em>describe</em>, and <em>conduct</em>. Learn the root, and the formal word unlocks itself.",
    context:
      "The Latin you are learning in this course already lives inside English. When the English course teaches register, it is teaching you to choose the Latinate twin: commence over start, obtain over get. Those formal words are not random vocabulary — they are Latin roots wearing English endings. This lesson traces the roots you will meet properly in Latin Lessons 46 (dūcō), 119 (scrībō), and 120 (dīcō) through the formal words of English Lessons 2003–2004.",
    requires: [
      { language: "latin", minLessonId: 10, unlockMode: "completed" },
      { language: "english", minLessonId: 2004, unlockMode: "completed" },
    ],
    comparisons: [
      {
        id: "xl1007-c1",
        category: "cognate",
        topic: "dīcō → predict, dictate",
        left: { language: "latin", term: "dīcō, dīcere, dīxī, dictus", romanization: "dīcō", pronunciation: "DEE-koh", meaning: "say, tell" },
        right: { language: "english", term: "predict", pronunciation: "prih-DIKT", meaning: "say what will happen before it does" },
        note: "dict- comes from Latin dīcō (Latin L120: dīcō 'say, tell'; English 2003 teaches dict- 'say, speak' — Latin dictō). predict = pre- (before) + dict (say): say before. dictate = say or order authoritatively. [English words: English 2003 vocab.]",
      },
      {
        id: "xl1007-c2",
        category: "cognate",
        topic: "scrībō → describe, prescribe",
        left: { language: "latin", term: "scrībō, scrībere, scrīpsī, scriptus", romanization: "scrībō", pronunciation: "SKREE-boh", meaning: "write" },
        right: { language: "english", term: "describe", pronunciation: "dih-SKRYB", meaning: "say or write what something is like" },
        note: "scrib-/script- comes from Latin scrībere, 'to write' (English 2004 teachingStep 1; Latin L119: scrībō). describe = de- (down) + scrib (write): write down. prescribe = pre- (before) + scrib: write before/order. [English words: English 2004 vocab.]",
      },
      {
        id: "xl1007-c3",
        category: "cognate",
        topic: "dūcō → conduct, deduce",
        left: { language: "latin", term: "dūcō, dūcere, dūxī, ductus", romanization: "dūcō", pronunciation: "DOO-koh", meaning: "lead" },
        right: { language: "english", term: "conduct", pronunciation: "kuhn-DUKT", meaning: "lead or guide" },
        note: "duc- comes from Latin dūcere, 'to lead' (English 2004 teachingStep 3; Latin L46: dūcō 'I lead'). conduct = con- (together) + duc (lead): lead together. deduce = de- (down) + duc: lead down to a conclusion. [English words: English 2004 vocab.]",
      },
      {
        id: "xl1007-c4",
        category: "parallel",
        topic: "The register pair: start/commence, get/obtain",
        left: { language: "english", term: "commence", pronunciation: "kuh-MENS", meaning: "start; to begin — formal twin" },
        right: { language: "english", term: "start", pronunciation: "stahrt", meaning: "to begin — everyday word" },
        note: "English 2001 teaches the register pairs start/commence, end/terminate, get/obtain. The formal twin is the Latinate word; the everyday word is native English. Choosing the formal register is often choosing the Latin layer. [English 2001 vocab: commence, obtain.]",
      },
      {
        id: "xl1007-c5",
        category: "cognate",
        topic: "Latin you already know → English words you already use",
        left: { language: "latin", term: "terra, glōria, victōria, amīcus", pronunciation: "TER-rah / GLOR-ee-ah / veek-TOR-ee-ah / ah-MEE-koos", meaning: "earth, land / fame, glory / victory / friend" },
        right: { language: "english", term: "territory · glorious · victory · amicable", meaning: "illustrative derivatives" },
        note: "Latin L1 words carry English descendants: terra → territory, terrestrial; glōria → glory, glorious; victōria → victory; amīcus → amicable. (Derivatives are illustrative only — not in English course data yet; research-verify each before merge.)",
      },
    ],
    vocabulary: [
      { latin: "dīcō, dīcere, dīxī, dictus", english: "say, tell — root of predict, dictate", pronunciation: "DEE-koh", type: "3rd conj. (introduced early — full lesson L120)" },
      { latin: "scrībō, scrībere, scrīpsī, scriptus", english: "write — root of describe, prescribe", pronunciation: "SKREE-boh", type: "3rd conj. (introduced early — full lesson L119)" },
      { latin: "dūcō, dūcere, dūxī, ductus", english: "lead — root of conduct, deduce", pronunciation: "DOO-koh", type: "3rd conj. (introduced early — full lesson L46)" },
      { latin: "predict", english: "say what will happen before it does (pre- + dict)", pronunciation: "prih-DIKT" },
      { latin: "describe", english: "say or write what something is like (de- + scrib)", pronunciation: "dih-SKRYB" },
      { latin: "conduct", english: "lead or guide (con- + duc)", pronunciation: "kuhn-DUKT" },
      { latin: "commence", english: "start; to begin — the formal twin of start", pronunciation: "kuh-MENS" },
      { latin: "obtain", english: "get; to acquire — the formal twin of get", pronunciation: "uhb-TAYN" },
    ],
    teachingSteps: [
      { title: "Two Layers of English", explanation: "English has a native layer (start, get, tell) and a Latin layer (commence, obtain, describe). Formal register — the English course's spine (2001–2002) — usually means choosing the Latinate word.", exampleLatin: "commence / start", exampleEnglish: "the formal twin / the everyday word", tip: "Formal English is not 'bigger words' — it is often the Latin-rooted word for the same idea." },
      { title: "Three Roots, Three Families", explanation: "dict- (from dīcō, say): predict, dictate; scrib-/script- (from scrībō, write): describe, prescribe; duc- (from dūcō, lead): conduct, deduce. You will meet these verbs properly in Latin lessons 46, 119, and 120.", exampleLatin: "dīcō / scrībō / dūcō", exampleEnglish: "say / write / lead", tip: "The root carries the meaning; the prefix adjusts it: pre- = before, de- = down, con- = together." },
      { title: "Reading New Words by Their Roots", explanation: "predict = pre- (before) + dict (say) = say before. describe = de- (down) + scrib (write) = write down. conduct = con- (together) + duc (lead) = lead together.", exampleLatin: "pre- + dict", exampleEnglish: "before + say = predict", tip: "English 2003–2004 teach exactly these prefix + root decompositions." },
    ],
    comprehensionCheck: [
      { question: "The Latin root dict- comes from dīcō. What does dīcō mean?", options: ["say, tell", "write", "lead", "send"], correctIndex: 0, explanation: "dīcō means 'say, tell' (Latin L120; English 2003: dict- 'say, speak')." },
      { question: "Which word is the formal twin of 'start' (English 2001)?", options: ["commence", "obtain", "request", "assist"], correctIndex: 0, explanation: "commence is the formal twin of start — the Latinate word for the same idea (English 2001 vocab)." },
      { question: "conduct literally means 'lead ___' — from Latin dūcō.", options: ["together (con-)", "down (de-)", "forth (pro-)", "across (trans-)"], correctIndex: 0, explanation: "con- = together; conduct = 'lead together' (English 2004)." },
    ],
    exercises: [
      { type: "multiple-choice", id: "xl1007-q1", prompt: "The Latin root dict- comes from dīcō. What does dīcō mean?", options: ["say, tell", "write", "lead", "send"], correctIndex: 0, explanation: "dīcō = say, tell (Latin L120; English 2003 root dict- = say, speak)." },
      { type: "multiple-choice", id: "xl1007-q2", prompt: "Which word contains the root scrib-, from scrībō ('write')?", options: ["describe", "predict", "benefit", "malady"], correctIndex: 0, explanation: "describe = de- + scrib (write); predict has dict-, benefit has bene-, malady has mal- (English 2003–2004 vocab)." },
      { type: "fill-in-blank", id: "xl1007-q3", prompt: "predict = pre- (before) + dict (say) = say ___", answer: "before", acceptableAnswers: ["before"], explanation: "predict = say before it happens (English 2003; copy bank §3.4: 'pre- + dict = to say before')." },
      { type: "multiple-choice", id: "xl1007-q4", prompt: "conduct contains the root duc-, which means…", options: ["lead", "write", "say", "send"], correctIndex: 0, explanation: "duc- = lead, from Latin dūcō (English 2004; Latin L46 'I lead')." },
      { type: "fill-in-blank", id: "xl1007-q5", prompt: "The formal twin of 'start' is ___ (English 2001)", answer: "commence", acceptableAnswers: ["commence"], explanation: "commence = start; to begin — the formal twin (English 2001 vocab; copy bank §3.2)." },
      { type: "multiple-choice", id: "xl1007-q6", prompt: "'obtain' is the formal twin of…", options: ["get", "start", "need", "help"], correctIndex: 0, explanation: "obtain = get; to acquire (English 2001 vocab)." },
      { type: "matching", id: "xl1007-q7", prompt: "Match each Latin verb to its English root family.", leftLabel: "Latin verb", rightLabel: "Root family", pairs: [
        { left: "dīcō (L120)", right: "dict- → predict, dictate" },
        { left: "scrībō (L119)", right: "scrib-/script- → describe, prescribe" },
        { left: "dūcō (L46)", right: "duc- → conduct, deduce" },
      ] },
      { type: "flashcard", id: "xl1007-q8", prompt: "Review card: the Latin layer of English.", front: "Why are formal English words (commence, obtain, describe) often Latinate?", back: "English's formal register is largely the Latin layer: formal twins are the Latin-rooted words (commence over start, obtain over get; English 2001–2004). Learn the root (dict-, scrib-, duc-) and the formal word unlocks itself.", hint: "Think start vs commence — which one sounds Latinate?" },
    ],
    optional: true,
  },
  // ── 1008 · CASES VS WORD ORDER ──────────────────────────────────
  {
    id: 1008,
    pair: "latin-english",
    languages: ["latin", "english"],
    title: "Cases vs Word Order",
    subtitle: "Latin endings do the work English word order does",
    concept:
      "Latin shows who does what with <strong>case endings</strong>; English shows it with <strong>word order</strong>. <em>Nauta silvam videt</em> and <em>Silvam nauta videt</em> both mean 'the sailor sees the forest' — the ending <strong>-am</strong> marks <em>silvam</em> as the object, wherever it sits. English cannot reorder 'the sailor sees the forest' without changing the meaning: 'the forest sees the sailor' is the opposite sentence. And where English needs two helpers — <strong>of</strong> or <strong>'s</strong> — Latin has one genitive ending: <em>porta silvae</em> = 'the gate of the forest' = 'the forest's gate'.",
    context:
      "This difference is the first big shock for English speakers meeting Latin — and it is why Latin can move words around for emphasis and rhythm. Latin carries each noun's job in its ending, so order is style; English carries the job in position, so order is grammar. The English course's register work (2001–2002) adds one more layer: when English has two ways to say the same thing — the gate of the forest vs the forest's gate — choosing between them is a register choice, made by audience and purpose.",
    requires: [
      { language: "latin", minLessonId: 10, unlockMode: "completed" },
      { language: "english", minLessonId: 2002, unlockMode: "completed" },
    ],
    comparisons: [
      {
        id: "xl1008-c1",
        category: "grammar",
        topic: "Endings vs position: the sailor sees the forest",
        left: { language: "latin", term: "Nauta silvam videt. / Silvam nauta videt.", romanization: "Nauta silvam videt.", pronunciation: "NOW-tah SEEL-vahm VEE-det", meaning: "The sailor sees the forest — either order, same meaning (silvam = -am accusative)" },
        right: { language: "english", term: "The sailor sees the forest.", pronunciation: "The SAIL-er SEEZ the FOR-est", meaning: "Subject → verb → object; reorder and it means something else" },
        note: "Latin: nauta (L1, m.) is nominative, silvam (L1, -am accusative) is the object — the -am does the work, so the words can swap. English: 'the forest sees the sailor' is the opposite meaning. Exact sentence from Latin L4 exercise q4: 'Nauta silvam videt' → 'The sailor sees the forest'; videt = 'he/she sees' (L3).",
      },
      {
        id: "xl1008-c2",
        category: "grammar",
        topic: "The genitive: one Latin ending, two English helpers",
        left: { language: "latin", term: "porta silvae", romanization: "porta silvae", pronunciation: "POR-tah SEEL-vay", meaning: "the gate of the forest (silvae = genitive -ae)" },
        right: { language: "english", term: "the gate of the forest / the forest's gate", pronunciation: "the gate of the FOR-est / the FOR-ests gate", meaning: "of-phrase (formal) or 's (everyday) — a register choice" },
        note: "Latin has one ending for possession: -ae (L5: porta silvae = 'the gate of the forest', L5 q3; victoria nautae = 'the victory of the sailor', L5 q7; fīlius amīcī = 'the friend's son', L6 q5). English splits the job between of and 's — and choosing between them is audience-and-purpose register work (English 2001–2002).",
      },
      {
        id: "xl1008-c3",
        category: "grammar",
        topic: "Word order is style in Latin, grammar in English",
        left: { language: "latin", term: "Silvam nauta videt.", romanization: "Silvam nauta videt.", pronunciation: "SEEL-vahm NOW-tah VEE-det", meaning: "The sailor sees the forest — with silvam fronted for emphasis" },
        right: { language: "english", term: "The forest the sailor sees.", pronunciation: "The FOR-est the SAIL-er SEEZ", meaning: "grammatical but marked/poetic — English only rarely front-shifts an object" },
        note: "Latin fronts the object to highlight it; English fronting of a direct object is poetic at best. This is why Latin word order feels 'free' and English word order feels rigid: the job moved from endings to position (Latin L4–L6 patterns; English 2001–2002 register).",
      },
    ],
    vocabulary: [
      { latin: "nauta", english: "sailor", pronunciation: "NOW-tah", gender: "m.", type: "1st decl." },
      { latin: "silva", english: "forest", pronunciation: "SEEL-vah", gender: "f.", type: "1st decl." },
      { latin: "porta", english: "gate", pronunciation: "POR-tah", gender: "f.", type: "1st decl." },
      { latin: "fīlius", english: "son", pronunciation: "FEE-lee-oos", gender: "m.", type: "2nd decl." },
      { latin: "amīcus", english: "friend", pronunciation: "ah-MEE-koos", gender: "m.", type: "2nd decl." },
      { latin: "videt", english: "he/she sees", pronunciation: "VEE-det", type: "verb" },
      { latin: "nominative", english: "subject case (nauta, porta)", pronunciation: "NOM-uh-nuh-tiv" },
      { latin: "accusative", english: "direct object case (-am: silvam)", pronunciation: "uh-KYOO-zuh-tiv" },
      { latin: "genitive", english: "possession case (-ae: silvae = 'of the forest')", pronunciation: "JEN-uh-tiv" },
    ],
    teachingSteps: [
      { title: "Endings vs Position", explanation: "In 'Nauta silvam videt' (L4 q4), nauta is the subject (nominative) and silvam the object (-am accusative). Swap the words — 'Silvam nauta videt' — and the meaning is identical, because the ending, not the position, marks the job.", exampleLatin: "Nauta silvam videt. / Silvam nauta videt.", exampleEnglish: "The sailor sees the forest. (both)", tip: "In English, 'the forest sees the sailor' would be a different sentence." },
      { title: "One Ending, Two English Helpers", explanation: "Latin shows possession with one genitive ending: porta silvae = 'the gate of the forest' (L5 q3); fīlius amīcī = 'the friend's son' (L6 q5). English splits the job between of and 's — and the choice between them is a register choice (audience and purpose, English 2001–2002).", exampleLatin: "porta silvae", exampleEnglish: "the gate of the forest / the forest's gate", tip: "Of-phrase leans formal; 's leans everyday." },
      { title: "Reading the Ending, Not the Order", explanation: "When a Latin sentence starts with an object — 'Silvam nauta videt' — do not translate in order; find the endings first. The -am tells you silvam is the object, so nauta must be the subject.", exampleLatin: "Silvam nauta videt.", exampleEnglish: "The sailor sees the forest (with the forest fronted).", tip: "Latin: ask 'what ending?' English: ask 'what order?'" },
    ],
    comprehensionCheck: [
      { question: "In Latin, who-does-what is shown mainly by…", options: ["case endings on nouns", "word order", "the verb's tense", "prepositions"], correctIndex: 0, explanation: "Latin uses case endings (nominative -a/-us, accusative -am/-um) — order is style (Latin L1–L6)." },
      { question: "porta silvae means…", options: ["the gate of the forest", "the forest is a gate", "the forest's gates", "the gate sees the forest"], correctIndex: 0, explanation: "silvae is genitive -ae: 'of the forest' (Latin L5 q3)." },
      { question: "Why does reordering change the meaning in English but not in Latin?", options: ["English marks roles by word order; Latin by endings", "English has no endings at all", "Latin has no word order", "English verbs are case-marked"], correctIndex: 0, explanation: "English: subject → verb → object. Latin: the ending carries the job (Latin L4–L6; English 2001–2002)." },
    ],
    exercises: [
      { type: "multiple-choice", id: "xl1008-q1", prompt: "In 'Nauta silvam videt' (L4), the ending -am on silvam marks it as the…", options: ["direct object (accusative)", "subject (nominative)", "possessor (genitive)", "indirect object (dative)"], correctIndex: 0, explanation: "-am is the accusative singular: silvam is the object — the forest is seen, not the seer (Latin L4)." },
      { type: "multiple-choice", id: "xl1008-q2", prompt: "Both 'Nauta silvam videt' and 'Silvam nauta videt' mean…", options: ["The sailor sees the forest", "The forest sees the sailor", "The sailor is in the forest", "The forest is a sailor"], correctIndex: 0, explanation: "The -am marks silvam as the object in both orders; nauta (nominative) is the subject (Latin L4 q4)." },
      { type: "fill-in-blank", id: "xl1008-q3", prompt: "English shows roles by word order: subject → ___ → object.", answer: "verb", acceptableAnswers: ["verb"], explanation: "English: the sailor sees the forest — subject, verb, object in that order (English 2001–2002 clarity work)." },
      { type: "matching", id: "xl1008-q4", prompt: "Match each Latin ending to its case and job.", leftLabel: "Ending", rightLabel: "Case and job", pairs: [
        { left: "-a (porta)", right: "nominative — subject" },
        { left: "-am (silvam)", right: "accusative — direct object" },
        { left: "-ae (silvae)", right: "genitive — of / possession" },
      ] },
      { type: "fill-in-blank", id: "xl1008-q5", prompt: "Translate: porta silvae (L5)", answer: "the gate of the forest", acceptableAnswers: ["the gate of the forest", "the forest's gate", "a gate of the forest"], explanation: "silvae = genitive -ae: 'of the forest' (Latin L5 q3)." },
      { type: "multiple-choice", id: "xl1008-q6", prompt: "Translate: fīlius amīcī (L6)", options: ["the friend's son", "the son's friend", "a friendly son", "the friends' son"], correctIndex: 0, explanation: "amīcī = genitive singular: 'of the friend' → the friend's son (Latin L6 q5)." },
      { type: "matching", id: "xl1008-q7", prompt: "Match each Latin phrase to its English translation — notice the genitive.", leftLabel: "Latin", rightLabel: "English", pairs: [
        { left: "porta silvae", right: "the gate of the forest" },
        { left: "victoria nautae", right: "the victory of the sailor" },
        { left: "fīlius amīcī", right: "the friend's son" },
        { left: "gloria Mariae", right: "the glory of Mary" },
      ] },
      { type: "flashcard", id: "xl1008-q8", prompt: "Review card: the one-sentence summary.", front: "How does Latin show grammatical roles? How does English?", back: "Latin: case endings (nominative -a/-us = subject, accusative -am/-um = object, genitive -ae = of). English: word order (subject → verb → object) and helper words (of, 's). Latin can reorder for emphasis; English cannot (Latin L1–L6; English 2001–2002).", hint: "Think 'Nauta silvam videt' vs 'the sailor sees the forest'." },
    ],
    optional: true,
  },
];

export default crossLanguageLessons;
export { crossLanguageLessons };
