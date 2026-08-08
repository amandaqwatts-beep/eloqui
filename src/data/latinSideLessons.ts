// Verbum — Latin side lessons (Explore section), Batch 1: IDs 101–108.
// Optional enrichment content: one side lesson per Henle book lesson (1–16).
// Side lessons never gate core progression, placement, or mastery.
// Data-only file. Uses the existing Exercise union and VocabularyItem
// interface from latinLessons.ts — no rendering, no logic.
import type { Exercise, VocabularyItem } from "./latinLessons";

export interface SideLesson {
  id: number; // 101–116, one per book lesson
  bookLessonId: number; // 1–16, maps to Henle book lesson
  title: string;
  subtitle?: string;
  concept: string; // one-sentence tie-in; no teaching steps
  context: string; // 2–4 sentences of cultural/historical context
  vocabulary: VocabularyItem[]; // exactly 3–5 enrichment items
  exercises: Exercise[]; // exactly 3–4; IDs like "side101-q1"
  optional: true;
}

export const latinSideLessons: SideLesson[] = [
  // ── BOOK 1 · LIFE ON A ROMAN VILLA ─────────────────────────────
  {
    id: 101,
    bookLessonId: 1,
    title: "Life on a Roman Villa",
    subtitle: "First-declension nouns on a country estate",
    concept:
      "First-declension nouns, cases, and simple subject–object sentences in a household setting.",
    context:
      "A villa could be a Roman country estate, with a residence and agricultural buildings. Latin writers often distinguish the owner's household from the land and work around it, so this lesson uses historically neutral household vocabulary rather than claiming every Roman lived in a villa. Most of these words are first-declension nouns with feminine -a endings.",
    vocabulary: [
      { latin: "vīlla", english: "country house/estate", gender: "f.", type: "1st decl." },
      { latin: "familia", english: "household", gender: "f.", type: "1st decl." },
      { latin: "ancīlla", english: "female slave/maid", gender: "f.", type: "1st decl." },
      { latin: "culīna", english: "kitchen", gender: "f.", type: "1st decl." },
    ],
    exercises: [
      {
        type: "matching",
        id: "side101-q1",
        prompt: "Match each household noun with its meaning.",
        pairs: [
          { left: "vīlla", right: "country house/estate" },
          { left: "familia", right: "household" },
          { left: "ancīlla", right: "female slave/maid" },
          { left: "culīna", right: "kitchen" },
        ],
      },
      {
        type: "matching",
        id: "side101-q2",
        prompt:
          "Identify each noun's job in its sentence: nominative subject or accusative direct object.",
        leftLabel: "Noun (in sentence)",
        rightLabel: "Case and job",
        pairs: [
          { left: "ancīlla — Ancīlla aquam portat", right: "nominative — subject" },
          { left: "aquam — Ancīlla aquam portat", right: "accusative — direct object" },
          { left: "culīnam — Ancīlla culīnam intrat", right: "accusative — direct object" },
          { left: "familia — Familia in vīllā est", right: "nominative — subject" },
        ],
      },
      {
        type: "multiple-choice",
        id: "side101-q3",
        prompt: "Translate: Ancilla aquam portat.",
        options: [
          "The maid carries water.",
          "The water carries the maid.",
          "The maid is in the kitchen.",
          "The maids carry water.",
        ],
        correctIndex: 0,
        explanation:
          "Ancilla is the subject (nominative), aquam is the direct object (accusative), and portat means 'carries' (singular -t ending).",
      },
    ],
    optional: true,
  },

  // ── BOOK 2 · A ROMAN HOUSEHOLD AND ITS GENIUS ──────────────────
  {
    id: 102,
    bookLessonId: 2,
    title: "A Roman Household and its Genius",
    subtitle: "Dative case and household religion",
    concept: "Second-declension nouns, the dative case, sum, and et/sed in a household scene.",
    context:
      "The genius was traditionally the protective spirit associated with a Roman man and his household; it is not simply the modern English meaning 'brilliant person.' Household religion included offerings and ritual practice, which varied by time and place. The dative case is a natural fit for describing the gifts and sacrifices offered to a household's spirit.",
    vocabulary: [
      { latin: "dominus", english: "master/lord", gender: "m.", type: "2nd decl." },
      { latin: "serva", english: "female slave", gender: "f.", type: "1st decl." },
      { latin: "genius", english: "protective spirit", gender: "m.", type: "2nd decl." },
      { latin: "sacrificium", english: "sacrifice", gender: "n.", type: "2nd decl." },
    ],
    exercises: [
      {
        type: "matching",
        id: "side102-q1",
        prompt: "Sort each noun by declension and gender.",
        leftLabel: "Noun",
        rightLabel: "Declension and gender",
        pairs: [
          { left: "dominus", right: "2nd decl. — masculine" },
          { left: "serva", right: "1st decl. — feminine" },
          { left: "genius", right: "2nd decl. — masculine" },
          { left: "sacrificium", right: "2nd decl. — neuter" },
        ],
      },
      {
        type: "multiple-choice",
        id: "side102-q2",
        prompt: "Complete with the correct dative form: Dominus dōnum ___ dat. ('The master gives a gift to the slave.')",
        options: ["servō", "servus", "servum", "serva"],
        correctIndex: 0,
        explanation:
          "The indirect object (to/for whom) takes the dative: servō. Servus is nominative, servum is accusative, and serva is a first-declension form.",
      },
      {
        type: "multiple-choice",
        id: "side102-q3",
        prompt: "Complete the dialogue with the correct form of sum: 'Nōs in vīllā sumus. Vōs in forō ___.'",
        options: ["estis", "sumus", "sunt", "es"],
        correctIndex: 0,
        explanation:
          "With vōs (you, plural) the verb sum takes its 2nd-person plural form: estis.",
      },
    ],
    optional: true,
  },

  // ── BOOK 3 · CITIZENS, LAWS, AND ROMAN PUBLIC LIFE ─────────────
  {
    id: 103,
    bookLessonId: 3,
    title: "Citizens, Laws, and Roman Public Life",
    subtitle: "Third-declension nouns in public life",
    concept: "Third-declension patterns, gender, and imperfect forms in Roman public life.",
    context:
      "Roman public life involved laws, assemblies, magistrates, and competing ideas of citizenship. The Twelve Tables belong to Rome's early legal tradition, but Roman law developed over centuries, so this lesson uses 'law' and 'citizen' as vocabulary rather than claiming that one text represents all Roman law. Third-declension nouns like cīvis and iūs change their stems in the oblique cases.",
    vocabulary: [
      { latin: "cīvis", english: "citizen", gender: "m./f.", type: "3rd decl." },
      { latin: "iūs", english: "law/right", gender: "n.", type: "3rd decl." },
      { latin: "forum", english: "forum/marketplace", gender: "n.", type: "2nd decl." },
      { latin: "senātor", english: "senator", gender: "m.", type: "3rd decl." },
    ],
    exercises: [
      {
        type: "matching",
        id: "side103-q1",
        prompt: "Classify each noun by gender and declension pattern.",
        leftLabel: "Noun",
        rightLabel: "Gender and pattern",
        pairs: [
          { left: "cīvis", right: "m./f. — 3rd decl. (i-stem)" },
          { left: "iūs", right: "neuter — 3rd decl." },
          { left: "forum", right: "neuter — 2nd decl." },
          { left: "senātor", right: "masculine — 3rd decl." },
        ],
      },
      {
        type: "multiple-choice",
        id: "side103-q2",
        prompt: "Choose the correct genitive plural of cīvis.",
        options: ["cīvium", "cīvum", "cīvibus", "cīvī"],
        correctIndex: 0,
        explanation:
          "Cīvis is an i-stem noun of the third declension, so its genitive plural ends in -ium: cīvium ('of the citizens').",
      },
      {
        type: "multiple-choice",
        id: "side103-q3",
        prompt: "Translate: Cīvēs in forō erant.",
        options: [
          "The citizens were in the forum.",
          "The citizens are in the forum.",
          "The citizen was in the forum.",
          "The senators were in the forum.",
        ],
        correctIndex: 0,
        explanation:
          "Cīvēs is the nominative plural of cīvis, forō is ablative (place where) with in, and erant is the imperfect of sum: 'were'.",
      },
    ],
    optional: true,
  },

  // ── BOOK 4 · PORTS, ROADS, AND MOVEMENT ────────────────────────
  {
    id: 104,
    bookLessonId: 4,
    title: "Ports, Roads, and Movement",
    subtitle: "Fourth declension and motion with in",
    concept: "Fourth declension and in + ablative/accusative for location versus motion.",
    context:
      "Mediterranean ports connected maritime trade, travel, and military movement, and Roman roads tied the empire together. A Latin case ending can distinguish being in portū ('in the harbor') from moving in portum ('into the harbor'). Verbs of motion are your clue for choosing the accusative.",
    vocabulary: [
      { latin: "nāvis", english: "ship", gender: "f.", type: "3rd decl." },
      { latin: "nauta", english: "sailor", gender: "m.", type: "1st decl." },
      { latin: "lītus", english: "shore", gender: "n.", type: "3rd decl." },
      { latin: "iter", english: "journey", gender: "n.", type: "3rd decl." },
    ],
    exercises: [
      {
        type: "matching",
        id: "side104-q1",
        prompt:
          "Match each sentence with its meaning — notice whether in takes the ablative (location) or the accusative (motion).",
        leftLabel: "Sentence",
        rightLabel: "Meaning",
        pairs: [
          { left: "Nāvis in portū est.", right: "The ship is in the harbor. (location — ablative)" },
          { left: "Nāvis in portum vēnit.", right: "The ship came into the harbor. (motion — accusative)" },
          { left: "Nauta in lītore ambulat.", right: "The sailor walks on the shore. (location — ablative)" },
        ],
      },
      {
        type: "matching",
        id: "side104-q2",
        prompt: "Match each travel noun with its meaning.",
        pairs: [
          { left: "nāvis", right: "ship" },
          { left: "nauta", right: "sailor" },
          { left: "lītus", right: "shore" },
          { left: "iter", right: "journey" },
        ],
      },
      {
        type: "multiple-choice",
        id: "side104-q3",
        prompt: "Translate: Nāvis in portum vēnit.",
        options: [
          "The ship came into the harbor.",
          "The ship is in the harbor.",
          "The sailor came into the harbor.",
          "The ship was in the harbor.",
        ],
        correctIndex: 0,
        explanation:
          "Nāvis is the subject, in portum shows motion into the harbor (accusative), and vēnit means 'came' (perfect of veniō).",
      },
    ],
    optional: true,
  },

  // ── BOOK 5 · ROMAN TIME: DIĒS AND THE FIFTH DECLENSION ─────────
  {
    id: 105,
    bookLessonId: 5,
    title: "Roman Time: Diēs and the Fifth Declension",
    subtitle: "Fifth-declension forms and time words",
    concept: "Fifth-declension forms and the gender exception diēs.",
    context:
      "Romans commonly organized ordinary life around days and civic and religious calendars. The fifth declension is small but contains frequent abstract nouns such as rēs and fidēs, while diēs is the important masculine exception to the usual feminine gender. Time words like hodiē, crās, and heri anchor everyday conversation.",
    vocabulary: [
      { latin: "hodiē", english: "today", type: "adverb" },
      { latin: "crās", english: "tomorrow", type: "adverb" },
      { latin: "heri", english: "yesterday", type: "adverb" },
      { latin: "aetās", english: "age/period of life", gender: "f.", type: "3rd decl." },
    ],
    exercises: [
      {
        type: "matching",
        id: "side105-q1",
        prompt: "Match each noun with its meaning and gender.",
        leftLabel: "Noun",
        rightLabel: "Meaning and gender",
        pairs: [
          { left: "rēs, reī", right: "thing, matter — f." },
          { left: "fidēs, fideī", right: "faith, trust — f." },
          { left: "diēs, diēī", right: "day — m. (the exception)" },
          { left: "aetās, aetātis", right: "age — f. (3rd decl.)" },
        ],
      },
      {
        type: "multiple-choice",
        id: "side105-q2",
        prompt: "Which form is the genitive singular of rēs?",
        options: ["reī", "rērum", "rēbus", "rem"],
        correctIndex: 0,
        explanation:
          "The fifth-declension genitive singular ends in -eī (or -ēī after a vowel): reī. Rērum is genitive plural, rēbus is dative/ablative plural, and rem is accusative singular.",
      },
      {
        type: "multiple-choice",
        id: "side105-q3",
        prompt: "Put the time adverbs in chronological order, earliest first.",
        options: ["heri, hodiē, crās", "hodiē, heri, crās", "crās, hodiē, heri", "hodiē, crās, heri"],
        correctIndex: 0,
        explanation:
          "Heri means 'yesterday', hodiē 'today', and crās 'tomorrow' — so the earliest-to-latest order is heri, hodiē, crās.",
      },
    ],
    optional: true,
  },

  // ── BOOK 6 · ROMAN SOCIAL ROLES AND PLURALIA TANTUM ────────────
  {
    id: 106,
    bookLessonId: 6,
    title: "Roman Social Roles and Pluralia Tantum",
    subtitle: "Plural-only nouns in the Roman camp",
    concept: "Special plural meanings: plural-only nouns like castra.",
    context:
      "Some Latin nouns are normally plural or acquire a special meaning in the plural. Castra ('camp') is a classic plural-only noun: plural in form, singular in meaning. Roman military camps were organized spaces with fortifications, not merely tents scattered at random.",
    vocabulary: [
      { latin: "castra", english: "camp", gender: "n. pl.", type: "2nd decl." },
      { latin: "arma", english: "arms/weapons", gender: "n. pl.", type: "2nd decl." },
      { latin: "mūnīmenta", english: "fortifications", gender: "n. pl.", type: "3rd decl." },
      { latin: "vīcī", english: "villages/neighborhoods", gender: "m. pl.", type: "2nd decl." },
    ],
    exercises: [
      {
        type: "matching",
        id: "side106-q1",
        prompt: "Match each plural-form noun with its lexical meaning.",
        pairs: [
          { left: "castra", right: "camp (singular in meaning)" },
          { left: "arma", right: "arms, weapons" },
          { left: "mūnīmenta", right: "fortifications" },
          { left: "vīcī", right: "villages, neighborhoods" },
        ],
      },
      {
        type: "multiple-choice",
        id: "side106-q2",
        prompt: "Which noun is plural in form but names a single thing?",
        options: ["castra", "vīcī", "mūnīmenta", "arma"],
        correctIndex: 0,
        explanation:
          "Castra is pluralia tantum: plural in form but singular in meaning ('a camp'). Arma is also plural in form, but it names a collection of weapons rather than one thing.",
      },
      {
        type: "multiple-choice",
        id: "side106-q3",
        prompt: "Translate: Mīlitēs castra mūniunt.",
        options: [
          "The soldiers fortify the camp.",
          "The camp fortifies the soldiers.",
          "The soldiers are in the camp.",
          "The soldiers fortify the fortifications.",
        ],
        correctIndex: 0,
        explanation:
          "Mīlitēs (soldiers) is the subject, castra (camp) is the accusative direct object — plural in form, singular in meaning — and mūniunt means 'they fortify'.",
      },
    ],
    optional: true,
  },

  // ── BOOK 7 · A ROMAN REVIEW: A FORUM MYSTERY ───────────────────
  {
    id: 107,
    bookLessonId: 7,
    title: "A Roman Review: A Forum Mystery",
    subtitle: "Unit 1 review in the forum",
    concept: "Unit 1 review of cases, declensions, prepositions, and core verbs.",
    context:
      "The forum served as a civic, commercial, and judicial center, though its appearance and functions changed over Roman history. Shops lined the colonnades, merchants sold their goods, and judges heard cases. This review frames case identification as finding who did what, where, and for whom.",
    vocabulary: [
      { latin: "taberna", english: "shop", gender: "f.", type: "1st decl." },
      { latin: "mercātor", english: "merchant", gender: "m.", type: "3rd decl." },
      { latin: "iūdex", english: "judge", gender: "m./f.", type: "3rd decl." },
      { latin: "nūntius", english: "messenger", gender: "m.", type: "2nd decl." },
    ],
    exercises: [
      {
        type: "matching",
        id: "side107-q1",
        prompt: "Parse each noun in its sentence: identify the case and its job.",
        leftLabel: "Noun (in sentence)",
        rightLabel: "Case and job",
        pairs: [
          { left: "mercātor — Mercātor in forō est.", right: "nominative — subject" },
          { left: "nūntius — Nūntius iūdicī dīcit.", right: "nominative — subject" },
          { left: "tabernam — In tabernam intrat.", right: "accusative — motion into" },
          { left: "iūdicī — Nūntius iūdicī dīcit.", right: "dative — indirect object" },
          { left: "forō — Mercātor in forō est.", right: "ablative — place where" },
          { left: "mercātōris — Taberna mercātōris est.", right: "genitive — possession" },
        ],
      },
      {
        type: "matching",
        id: "side107-q2",
        prompt: "Match each forum noun with its meaning.",
        pairs: [
          { left: "taberna", right: "shop" },
          { left: "mercātor", right: "merchant" },
          { left: "iūdex", right: "judge" },
          { left: "nūntius", right: "messenger" },
        ],
      },
      {
        type: "multiple-choice",
        id: "side107-q3",
        prompt:
          "Translate the mini-scene: Mercātor ad tabernam ambulat; nūntius cum iūdice in forō est.",
        options: [
          "The merchant walks to the shop; the messenger is in the forum with the judge.",
          "The judge walks to the shop; the messenger is in the forum with the merchant.",
          "The merchant walks in the shop; the judge is in the forum with the messenger.",
          "The merchant walks to the forum; the messenger is in the shop with the judge.",
        ],
        correctIndex: 0,
        explanation:
          "Ad tabernam shows motion toward the shop (accusative), cum iūdice is accompaniment ('with the judge', ablative), and in forō is location (ablative).",
      },
    ],
    optional: true,
  },

  // ── BOOK 8 · ROMAN VIRTUES: MAGNUS AND BONUS ───────────────────
  {
    id: 108,
    bookLessonId: 8,
    title: "Roman Virtues: Magnus and Bonus",
    subtitle: "Agreeing adjectives and Roman virtues",
    concept: "Adjective agreement, predicate adjectives, and pro.",
    context:
      "Roman authors frequently praised qualities such as courage, loyalty, and justice, but 'Roman virtue' was debated and presented differently by different writers. Adjectives make those descriptions precise by agreeing with the nouns they describe. Bonus, fortis, and iūstus each follow a regular pattern, so a noun's gender, number, and case tell you which ending to use.",
    vocabulary: [
      { latin: "bonus, -a, -um", english: "good", type: "adj. 2-1-2" },
      { latin: "fortis, forte", english: "brave/strong", type: "adj. 3rd decl." },
      { latin: "iūstus, -a, -um", english: "just", type: "adj. 2-1-2" },
      { latin: "virtūs, virtūtis", english: "virtue/courage", gender: "f.", type: "3rd decl." },
    ],
    exercises: [
      {
        type: "multiple-choice",
        id: "side108-q1",
        prompt: "Complete with the form of bonus that agrees with virtūs (f., 'virtue'): virtūs ___.",
        options: ["bona", "bonus", "bonum", "bonī"],
        correctIndex: 0,
        explanation:
          "Adjectives agree with their nouns in gender, number, and case: virtūs is feminine singular nominative, so bonus takes the feminine ending -a: virtūs bona.",
      },
      {
        type: "multiple-choice",
        id: "side108-q2",
        prompt: "In Mīles bonus est ('the soldier is good'), bonus is a…",
        options: ["predicate adjective", "attributive adjective", "substantive adjective", "adverb"],
        correctIndex: 0,
        explanation:
          "A predicate adjective completes a linking verb (est) and describes the subject: bonus est = 'is good'. An attributive adjective would sit next to its noun without a linking verb, as in mīles bonus.",
      },
      {
        type: "multiple-choice",
        id: "side108-q3",
        prompt: "Translate: Mīles fortis prō patriā stat.",
        options: [
          "The brave soldier stands for his country.",
          "The brave soldiers stand for their country.",
          "The soldier stands bravely in the country.",
          "The strong soldier fights for his country.",
        ],
        correctIndex: 0,
        explanation:
          "Mīles (soldier) is singular, fortis (brave) agrees with it, prō patriā means 'for his country' (prō + ablative), and stat means 'stands'.",
      },
    ],
    optional: true,
  },
  { id: 109, bookLessonId: 9, title: "Weight, Burden, and Comparison", subtitle: "Third-declension adjectives", concept: "Third-declension adjectives agree with nouns in gender, number, and case.", context: "Gravis means both physically heavy and, by semantic extension, serious or burdensome. Latin often carries a concrete image into an abstract meaning, so a burden can be heavy in either sense.", vocabulary: [{ latin: "levis, leve", english: "light", type: "3rd decl. adj." }, { latin: "difficilis, difficile", english: "difficult", type: "3rd decl. adj." }, { latin: "onus, oneris", english: "burden", gender: "n.", type: "3rd decl." }, { latin: "cūpa", english: "fault/blame", gender: "f.", type: "1st decl." }], exercises: [{ type: "matching", id: "side109-q1", prompt: "Match each adjective form to the noun it agrees with.", pairs: [{ left: "gravis (m.)", right: "mīles" }, { left: "grave (n.)", right: "onus" }, { left: "levis (f.)", right: "cūpa" }, { left: "difficile (n.)", right: "iter" }] }, { type: "multiple-choice", id: "side109-q2", prompt: "Which case is required by the adjective in onus grave?", options: ["nominative", "genitive", "dative", "ablative"], correctIndex: 0, explanation: "Onus grave is nominative singular; grave agrees with the neuter noun." }, { type: "multiple-choice", id: "side109-q3", prompt: "Translate: Onus grave est.", options: ["The burden is heavy.", "The burden carries the weight.", "The faults are difficult.", "The light is serious."], correctIndex: 0, explanation: "Onus is the subject, grave agrees with it, and est means 'is'." }], optional: true },
  { id: 110, bookLessonId: 10, title: "Mastery Through Roman Inscriptions", subtitle: "Vocabulary review in stone and metal", concept: "Inscriptions reinforce vocabulary through concise public texts.", context: "Romans carved short texts on stone and metal to record names, dedications, honors, and ownership. Their compact wording rewards careful attention to case endings.", vocabulary: [{ latin: "titulus", english: "inscription/title", gender: "m.", type: "2nd decl." }, { latin: "mūrus", english: "wall", gender: "m.", type: "2nd decl." }, { latin: "lapis, lapidis", english: "stone", gender: "m.", type: "3rd decl." }, { latin: "dōnum", english: "gift", gender: "n.", type: "2nd decl." }], exercises: [{ type: "matching", id: "side110-q1", prompt: "Rapid-match these twelve previously learned words with their meanings.", pairs: [{ left: "titulus", right: "inscription/title" }, { left: "mūrus", right: "wall" }, { left: "lapis", right: "stone" }, { left: "dōnum", right: "gift" }, { left: "cīvis", right: "citizen" }, { left: "via", right: "road" }, { left: "urbs", right: "city" }, { left: "mīles", right: "soldier" }, { left: "aqua", right: "water" }, { left: "rēx", right: "king" }, { left: "terra", right: "land" }, { left: "pax", right: "peace" }] }, { type: "multiple-choice", id: "side110-q2", prompt: "In Dōnum deō, what case is deō?", options: ["dative", "nominative", "accusative", "genitive"], correctIndex: 0, explanation: "Deō is dative singular, marking the recipient: 'to the god'." }, { type: "multiple-choice", id: "side110-q3", prompt: "Translate: Titulus deō.", options: ["An inscription to the god.", "The god's wall.", "The gift sees the inscription.", "The gods are on the stone."], correctIndex: 0, explanation: "Titulus is nominative and deō is dative." }], optional: true },
  { id: 111, bookLessonId: 11, title: "Roman Questions and Answers", subtitle: "Interrogatives in conversation", concept: "Question particles and adverbs turn statements into conversations.", context: "Latin uses -ne for a yes-or-no question; num often expects a negative answer, while nōnne often expects an affirmative one. Cūr, ubi, and quandō ask why, where, and when.", vocabulary: [{ latin: "cūr", english: "why", type: "interrogative adverb" }, { latin: "ubi", english: "where", type: "interrogative adverb" }, { latin: "quandō", english: "when", type: "interrogative adverb" }, { latin: "fortasse", english: "perhaps", type: "adverb" }], exercises: [{ type: "matching", id: "side111-q1", prompt: "Match each question word with its meaning.", pairs: [{ left: "cūr", right: "why" }, { left: "ubi", right: "where" }, { left: "quandō", right: "when" }, { left: "fortasse", right: "perhaps" }] }, { type: "multiple-choice", id: "side111-q2", prompt: "Convert Tu cantās ('You sing') to a yes-or-no question.", options: ["Cantāsne?", "Num cantās.", "Cūr cantat?", "Ubi cantās."], correctIndex: 0, explanation: "Attach -ne to cantās to ask 'Do you sing?'" }, { type: "multiple-choice", id: "side111-q3", prompt: "Choose the correct words: ___ abis? — ___ ad forum abeo?", options: ["Cūr; Ubi", "Ubi; Cūr", "Quandō; Fortasse", "Fortasse; Quandō"], correctIndex: 0, explanation: "Cūr asks why; ubi asks where." }], optional: true },
  { id: 112, bookLessonId: 12, title: "Learning in the Schola", subtitle: "Second-conjugation classroom Latin", concept: "Second-conjugation verbs use -eō, -ēs, and -et in the present tense.", context: "Roman education varied by place, period, and social circumstance, but teachers and students commonly met for instruction in language and literature. This lesson practices classroom vocabulary without assuming one uniform school experience.", vocabulary: [{ latin: "magister", english: "teacher", gender: "m.", type: "2nd decl." }, { latin: "discipulus", english: "student", gender: "m.", type: "2nd decl." }, { latin: "lūdus", english: "school/play", gender: "m.", type: "2nd decl." }, { latin: "doceō, docēre", english: "teach", type: "2nd conj." }], exercises: [{ type: "matching", id: "side112-q1", prompt: "Match each form of doceō with its person and number.", pairs: [{ left: "doceō", right: "I teach" }, { left: "docēs", right: "you teach" }, { left: "docet", right: "he/she teaches" }, { left: "docēmus", right: "we teach" }] }, { type: "multiple-choice", id: "side112-q2", prompt: "Choose the correct verb: Magister discipulōs ___ Latinam.", options: ["docet", "docent", "docēs", "doceō"], correctIndex: 0, explanation: "Magister is third-person singular, so docet is correct." }, { type: "multiple-choice", id: "side112-q3", prompt: "Translate: Magister discipulōs docet.", options: ["The teacher teaches the students.", "The students teach the teacher.", "The teacher hears the students.", "The student teaches the teachers."], correctIndex: 0, explanation: "Magister is subject, discipulōs is the object, and docet means 'teaches'." }], optional: true },
  { id: 113, bookLessonId: 13, title: "Roman Identity: Ego, Tū, Nōs", subtitle: "Personal pronouns and emphasis", concept: "Latin personal pronouns add emphasis when a contrast matters.", context: "Latin often omits subject pronouns because verb endings identify the subject. Pronouns such as ego and tū appear when a speaker wants contrast or emphasis: 'I, not you.'", vocabulary: [{ latin: "ego", english: "I", type: "personal pronoun" }, { latin: "tū", english: "you (singular)", type: "personal pronoun" }, { latin: "nōs", english: "we/us", type: "personal pronoun" }, { latin: "vōs", english: "you (plural)", type: "personal pronoun" }], exercises: [{ type: "matching", id: "side113-q1", prompt: "Match each pronoun with person and number.", pairs: [{ left: "ego", right: "first-person singular" }, { left: "tū", right: "second-person singular" }, { left: "nōs", right: "first-person plural" }, { left: "vōs", right: "second-person plural" }] }, { type: "multiple-choice", id: "side113-q2", prompt: "Supply the emphatic pronoun: ___, nōn tū, hostem videō. ('I, not you, see the enemy.')", options: ["Ego", "Tū", "Nōs", "Vōs"], correctIndex: 0, explanation: "Ego is the first-person singular pronoun used for contrast with tū." }, { type: "multiple-choice", id: "side113-q3", prompt: "Translate: Nōs hostēs vīdimus.", options: ["We saw the enemies.", "You saw the enemy.", "They see our enemies.", "We hear the enemies."], correctIndex: 0, explanation: "Nōs is 'we', hostēs is accusative plural, and vīdimus means 'we saw'." }], optional: true },
  { id: 114, bookLessonId: 14, title: "Engineering a Roman Road", subtitle: "Third-conjugation future", concept: "Third-conjugation future forms distinguish planned action from present action.", context: "Roman roads used layered construction and durable paving to connect settlements, farms, and military routes. Their engineering required coordinated labor, bridges, drainage, and stonework.", vocabulary: [{ latin: "via", english: "road", gender: "f.", type: "1st decl." }, { latin: "pons, pontis", english: "bridge", gender: "m.", type: "3rd decl." }, { latin: "lapis, lapidis", english: "stone", gender: "m.", type: "3rd decl." }, { latin: "aedificō, aedificāre", english: "build", type: "1st conj." }], exercises: [{ type: "matching", id: "side114-q1", prompt: "Distinguish present dūcit from future dūcet.", pairs: [{ left: "dūcit", right: "he leads (present)" }, { left: "dūcet", right: "he will lead (future)" }, { left: "dūcunt", right: "they lead (present)" }, { left: "dūcent", right: "they will lead (future)" }] }, { type: "matching", id: "side114-q2", prompt: "Match each road-building word with its meaning.", pairs: [{ left: "via", right: "road" }, { left: "pons", right: "bridge" }, { left: "lapis", right: "stone" }, { left: "aedificō", right: "build" }] }, { type: "multiple-choice", id: "side114-q3", prompt: "Translate: Mīlitēs pontem aedificābunt.", options: ["The soldiers will build a bridge.", "The soldier builds roads.", "The soldiers built a wall.", "The bridge will lead the soldiers."], correctIndex: 0, explanation: "Mīlitēs is plural subject, pontem is object, and aedificābunt is future plural." }], optional: true },
  { id: 115, bookLessonId: 15, title: "Roman Hearing and Communication", subtitle: "Fourth-conjugation verbs", concept: "Fourth-conjugation verbs are marked by the long -īre infinitive and -iunt plural.", context: "Public announcements and speeches had to carry across Roman forums, theaters, and meeting spaces. Listeners and heralds relied on clear voices, while deliberate silentium could make a public moment more attentive.", vocabulary: [{ latin: "audiō, audīre", english: "hear/listen", type: "4th conj." }, { latin: "vocō, vocāre", english: "call", type: "1st conj." }, { latin: "clāmō, clāmāre", english: "shout", type: "1st conj." }, { latin: "silentium", english: "silence", gender: "n.", type: "2nd decl." }], exercises: [{ type: "matching", id: "side115-q1", prompt: "Identify the fourth-conjugation forms among these distractors.", pairs: [{ left: "audiō", right: "fourth conjugation" }, { left: "audīre", right: "fourth conjugation" }, { left: "vocāre", right: "first conjugation" }, { left: "clāmāre", right: "first conjugation" }] }, { type: "multiple-choice", id: "side115-q2", prompt: "Choose the correct form: Cīvēs orātōrem ___.", options: ["audit", "audiunt", "audīs", "audīmus"], correctIndex: 1, explanation: "Cīvēs is third-person plural, so audiunt ('they hear') is required." }, { type: "multiple-choice", id: "side115-q3", prompt: "Translate: Cīvēs orātōrem audiunt.", options: ["The citizens hear the speaker.", "The speaker hears the citizens.", "The citizen calls the speaker.", "The citizens shout in silence."], correctIndex: 0, explanation: "Cīvēs is the plural subject, orātōrem is the object, and audiunt means 'hear'." }], optional: true },
  { id: 116, bookLessonId: 16, title: "There Is a City: Sum in Roman Geography", subtitle: "Sum as a capstone", concept: "Est and sunt express 'there is/are' as well as ordinary forms of sum.", context: "Roman itineraries and geographic descriptions named cities, rivers, and regions along a route. In such descriptions est and sunt can introduce what exists at a place: 'there is' or 'there are.'", vocabulary: [{ latin: "urbs, urbis", english: "city", gender: "f.", type: "3rd decl." }, { latin: "flūvius", english: "river", gender: "m.", type: "2nd decl." }, { latin: "regiō, regiōnis", english: "region", gender: "f.", type: "3rd decl." }, { latin: "procul", english: "far away", type: "adverb" }], exercises: [{ type: "multiple-choice", id: "side116-q1", prompt: "Choose the correct form: In urbe ___ flūvius; in regiōne ___ viae.", options: ["est; sunt", "sunt; est", "erat; erant", "estis; sumus"], correctIndex: 0, explanation: "Flūvius is singular, so est; viae is plural, so sunt." }, { type: "multiple-choice", id: "side116-q2", prompt: "Translate: In regiōne est urbs; procul sunt flūvius et viae.", options: ["In the region there is a city; far away there are a river and roads.", "The region is a city; far away the roads are rivers.", "There was a city in the region; the river was far away.", "In the city there are regions; the road is far away."], correctIndex: 0, explanation: "Est introduces singular urbs, while sunt introduces the plural flūvius et viae." }, { type: "multiple-choice", id: "side116-q3", prompt: "Select the Latin for 'There were roads in the region.'", options: ["Viae in regiōne erant.", "Via in regiōne est.", "Viae in regiōne sunt.", "Regiō viās erat."], correctIndex: 0, explanation: "Viae is plural and erant is the imperfect plural of sum: 'there were roads.'" }], optional: true }

];
