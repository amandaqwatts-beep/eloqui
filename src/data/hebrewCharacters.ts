// Eloqui — Hebrew character quizzer data (consonants, niqqud, begadkefat, and marks).
// Data-only file — no rendering, no logic. Pronunciation convention: PVP
// traditional pronunciation with Modern Israeli alternatives.

export interface CharacterQuizItem {
  id: string;
  category: "letter" | "vowel" | "mark" | "final-form";
  name: string;
  form: string;
  forms?: string[];
  transliteration: string;
  pronunciation: {
    traditional: string;
    modern: string;
  };
  example?: string;
  difficulty: "basic" | "advanced";
  separateItem: boolean;
  notes?: string;
}

export const hebrewCharacters: CharacterQuizItem[] = [
  {
    id: "hebrew-aleph",
    category: "letter",
    name: "aleph",
    form: "א",
    transliteration: "ʾ",
    pronunciation: { traditional: "silent (glottal stop / no vowel sound)", modern: "silent (glottal stop / no vowel sound)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-bet",
    category: "letter",
    name: "bet",
    form: "ב",
    transliteration: "b",
    pronunciation: { traditional: "b with dagesh; v without dagesh", modern: "b with dagesh; v without dagesh" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-gimel",
    category: "letter",
    name: "gimel",
    form: "ג",
    transliteration: "g",
    pronunciation: { traditional: "g; traditionally gh without dagesh", modern: "g" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-dalet",
    category: "letter",
    name: "dalet",
    form: "ד",
    transliteration: "d",
    pronunciation: { traditional: "d; traditionally dh without dagesh", modern: "d" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-he",
    category: "letter",
    name: "he",
    form: "ה",
    transliteration: "h",
    pronunciation: { traditional: "h", modern: "h" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-vav",
    category: "letter",
    name: "vav",
    form: "ו",
    transliteration: "w",
    pronunciation: { traditional: "w", modern: "v" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-zayin",
    category: "letter",
    name: "zayin",
    form: "ז",
    transliteration: "z",
    pronunciation: { traditional: "z", modern: "z" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-het",
    category: "letter",
    name: "het",
    form: "ח",
    transliteration: "ḥ",
    pronunciation: { traditional: "ḥ (German Bach / Scottish loch)", modern: "kh (as in Bach)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-tet",
    category: "letter",
    name: "tet",
    form: "ט",
    transliteration: "ṭ",
    pronunciation: { traditional: "ṭ (emphatic t)", modern: "t (emphatic t)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-yod",
    category: "letter",
    name: "yod",
    form: "י",
    transliteration: "y",
    pronunciation: { traditional: "y", modern: "y" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-kaf",
    category: "letter",
    name: "kaf",
    form: "כ",
    transliteration: "k",
    pronunciation: { traditional: "k with dagesh; kh without", modern: "k with dagesh; kh without" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-lamed",
    category: "letter",
    name: "lamed",
    form: "ל",
    transliteration: "l",
    pronunciation: { traditional: "l", modern: "l" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-mem",
    category: "letter",
    name: "mem",
    form: "מ",
    transliteration: "m",
    pronunciation: { traditional: "m", modern: "m" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-nun",
    category: "letter",
    name: "nun",
    form: "נ",
    transliteration: "n",
    pronunciation: { traditional: "n", modern: "n" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-samekh",
    category: "letter",
    name: "samekh",
    form: "ס",
    transliteration: "s",
    pronunciation: { traditional: "s", modern: "s" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-ayin",
    category: "letter",
    name: "ayin",
    form: "ע",
    transliteration: "ʿ",
    pronunciation: { traditional: "silent (pharyngeal historically)", modern: "silent (pharyngeal historically)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-pe",
    category: "letter",
    name: "pe",
    form: "פ",
    transliteration: "p",
    pronunciation: { traditional: "p with dagesh; f without", modern: "p with dagesh; f without" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-tsade",
    category: "letter",
    name: "tsade",
    form: "צ",
    transliteration: "ṣ",
    pronunciation: { traditional: "ṣ (emphatic ts)", modern: "ts" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-qof",
    category: "letter",
    name: "qof",
    form: "ק",
    transliteration: "q",
    pronunciation: { traditional: "q (uvular k)", modern: "k" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-resh",
    category: "letter",
    name: "resh",
    form: "ר",
    transliteration: "r",
    pronunciation: { traditional: "r (uvular/pharyngealized)", modern: "r" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-shin",
    category: "letter",
    name: "shin",
    form: "שׁ",
    transliteration: "š",
    pronunciation: { traditional: "sh", modern: "sh" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-sin",
    category: "letter",
    name: "sin",
    form: "שׂ",
    transliteration: "ś",
    pronunciation: { traditional: "s", modern: "s" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-tav",
    category: "letter",
    name: "tav",
    form: "ת",
    transliteration: "t",
    pronunciation: { traditional: "t with dagesh; th without", modern: "t" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-kaf-sofit",
    category: "final-form",
    name: "kaf sofit",
    form: "ך",
    transliteration: "k",
    pronunciation: { traditional: "same sound as its medial form", modern: "same sound as its medial form" },
    difficulty: "basic",
    separateItem: true,
    notes: "Final form used at the end of a word.",
  },

  {
    id: "hebrew-mem-sofit",
    category: "final-form",
    name: "mem sofit",
    form: "ם",
    transliteration: "m",
    pronunciation: { traditional: "same sound as its medial form", modern: "same sound as its medial form" },
    difficulty: "basic",
    separateItem: true,
    notes: "Final form used at the end of a word.",
  },

  {
    id: "hebrew-nun-sofit",
    category: "final-form",
    name: "nun sofit",
    form: "ן",
    transliteration: "n",
    pronunciation: { traditional: "same sound as its medial form", modern: "same sound as its medial form" },
    difficulty: "basic",
    separateItem: true,
    notes: "Final form used at the end of a word.",
  },

  {
    id: "hebrew-pe-sofit",
    category: "final-form",
    name: "pe sofit",
    form: "ף",
    transliteration: "p",
    pronunciation: { traditional: "same sound as its medial form", modern: "same sound as its medial form" },
    difficulty: "basic",
    separateItem: true,
    notes: "Final form used at the end of a word.",
  },

  {
    id: "hebrew-tsade-sofit",
    category: "final-form",
    name: "tsade sofit",
    form: "ץ",
    transliteration: "ṣ",
    pronunciation: { traditional: "same sound as its medial form", modern: "same sound as its medial form" },
    difficulty: "basic",
    separateItem: true,
    notes: "Final form used at the end of a word.",
  },

  {
    id: "hebrew-qamets",
    category: "vowel",
    name: "qamets",
    form: "בָּ",
    forms: ["בָּ"],
    transliteration: "ā",
    pronunciation: { traditional: "a as in father (long)", modern: "a as in father (long)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-patach",
    category: "vowel",
    name: "patach",
    form: "בַּ",
    forms: ["בַּ"],
    transliteration: "a",
    pronunciation: { traditional: "a as in father (short)", modern: "a as in father (short)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-tsere",
    category: "vowel",
    name: "tsere",
    form: "בֵּ",
    forms: ["בֵּ"],
    transliteration: "ē",
    pronunciation: { traditional: "e as in they (long)", modern: "e as in they (long)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-segol",
    category: "vowel",
    name: "segol",
    form: "בֶּ",
    forms: ["בֶּ"],
    transliteration: "e",
    pronunciation: { traditional: "e as in bed (short)", modern: "e as in bed (short)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-cholam",
    category: "vowel",
    name: "cholam",
    form: "בֹּ",
    forms: ["בֹּ"],
    transliteration: "ō",
    pronunciation: { traditional: "o as in note (long)", modern: "o as in note (long)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-chirik",
    category: "vowel",
    name: "chirik",
    form: "בִּ",
    forms: ["בִּ"],
    transliteration: "i",
    pronunciation: { traditional: "i as in machine", modern: "i as in machine" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-kubutz",
    category: "vowel",
    name: "kubutz",
    form: "בֻּ",
    forms: ["בֻּ"],
    transliteration: "u",
    pronunciation: { traditional: "u as in rule (short)", modern: "u as in rule (short)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-shuruk",
    category: "vowel",
    name: "shuruk",
    form: "וּ",
    forms: ["וּ"],
    transliteration: "ū",
    pronunciation: { traditional: "u as in rule (long)", modern: "u as in rule (long)" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-sheva",
    category: "vowel",
    name: "sheva",
    form: "בְּ",
    forms: ["בְּ"],
    transliteration: "ə",
    pronunciation: { traditional: "vocal e or silent, by context", modern: "vocal e or silent, by context" },
    difficulty: "basic",
    separateItem: true,
  },

  {
    id: "hebrew-chataf-patach",
    category: "vowel",
    name: "chataf-patach",
    form: "בֲּ",
    forms: ["בֲּ"],
    transliteration: "ă",
    pronunciation: { traditional: "a (half-vowel)", modern: "a (half-vowel)" },
    difficulty: "advanced",
    separateItem: true,
  },

  {
    id: "hebrew-chataf-segol",
    category: "vowel",
    name: "chataf-segol",
    form: "בֱּ",
    forms: ["בֱּ"],
    transliteration: "ĕ",
    pronunciation: { traditional: "e (half-vowel)", modern: "e (half-vowel)" },
    difficulty: "advanced",
    separateItem: true,
  },

  {
    id: "hebrew-chataf-qamets",
    category: "vowel",
    name: "chataf-qamets",
    form: "בֳּ",
    forms: ["בֳּ"],
    transliteration: "ŏ",
    pronunciation: { traditional: "o (half-vowel)", modern: "o (half-vowel)" },
    difficulty: "advanced",
    separateItem: true,
  },

  {
    id: "hebrew-bet-dagesh",
    category: "mark",
    name: "bet: dagesh / lene",
    form: "בּ",
    forms: ["ב"],
    transliteration: "b / v",
    pronunciation: { traditional: "b with dagesh; v without", modern: "b with dagesh; v without" },
    difficulty: "advanced",
    separateItem: true,
    notes: "Begadkefat pair: dagesh lene changes the consonant sound.",
  },

  {
    id: "hebrew-gimel-dagesh",
    category: "mark",
    name: "gimel: dagesh / lene",
    form: "גּ",
    forms: ["ג"],
    transliteration: "g / gh",
    pronunciation: { traditional: "g with dagesh; gh without", modern: "g" },
    difficulty: "advanced",
    separateItem: true,
    notes: "Begadkefat pair: dagesh lene changes the consonant sound.",
  },

  {
    id: "hebrew-dalet-dagesh",
    category: "mark",
    name: "dalet: dagesh / lene",
    form: "דּ",
    forms: ["ד"],
    transliteration: "d / dh",
    pronunciation: { traditional: "d with dagesh; dh without", modern: "d" },
    difficulty: "advanced",
    separateItem: true,
    notes: "Begadkefat pair: dagesh lene changes the consonant sound.",
  },

  {
    id: "hebrew-kaf-dagesh",
    category: "mark",
    name: "kaf: dagesh / lene",
    form: "כּ",
    forms: ["כ"],
    transliteration: "k / kh",
    pronunciation: { traditional: "k with dagesh; kh without", modern: "k with dagesh; kh without" },
    difficulty: "advanced",
    separateItem: true,
    notes: "Begadkefat pair: dagesh lene changes the consonant sound.",
  },

  {
    id: "hebrew-pe-dagesh",
    category: "mark",
    name: "pe: dagesh / lene",
    form: "פּ",
    forms: ["פ"],
    transliteration: "p / f",
    pronunciation: { traditional: "p with dagesh; f without", modern: "p with dagesh; f without" },
    difficulty: "advanced",
    separateItem: true,
    notes: "Begadkefat pair: dagesh lene changes the consonant sound.",
  },

  {
    id: "hebrew-tav-dagesh",
    category: "mark",
    name: "tav: dagesh / lene",
    form: "תּ",
    forms: ["ת"],
    transliteration: "t / th",
    pronunciation: { traditional: "t with dagesh; th without", modern: "t" },
    difficulty: "advanced",
    separateItem: true,
    notes: "Begadkefat pair: dagesh lene changes the consonant sound.",
  },

  {
    id: "hebrew-maqqef",
    category: "mark",
    name: "maqqef",
    form: "־",
    transliteration: "-",
    pronunciation: { traditional: "word-joining hyphen", modern: "word-joining hyphen" },
    difficulty: "basic",
    separateItem: true,
    notes: "Joins words into one accentual unit.",
  },

  {
    id: "hebrew-meteg",
    category: "mark",
    name: "meteg",
    form: "ֽ",
    transliteration: "̄",
    pronunciation: { traditional: "stress / secondary stress mark", modern: "stress / secondary stress mark" },
    difficulty: "advanced",
    separateItem: true,
    notes: "Vertical stroke placed under a consonant.",
  },

  {
    id: "hebrew-rafe",
    category: "mark",
    name: "rafe",
    form: "ֿ",
    transliteration: "̄",
    pronunciation: { traditional: "absence of dagesh; historically spirant", modern: "absence of dagesh; spirant indication" },
    difficulty: "advanced",
    separateItem: true,
    notes: "Rare mark indicating a non-geminated or spirant consonant.",
  },

  {
    id: "hebrew-mapiq",
    category: "mark",
    name: "mapiq",
    form: "ּ",
    transliteration: "̇",
    pronunciation: { traditional: "marks consonantal ה (especially final הּ)", modern: "marks consonantal ה" },
    difficulty: "advanced",
    separateItem: true,
    notes: "A dagesh in ה indicating that the he is consonantal.",
  },
];
