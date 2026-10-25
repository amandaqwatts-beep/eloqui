// Verbum — Caesar's Gallic War (Bellum Gallicum): the STRUCTURAL skeleton.
//
// ⚠️ STRUCTURE, NOT CONTENT. This file carries the original's wayfinding —
// the eight books of the Gallic War as parts with section anchors. There are
// NO lessons, exercises, Latin text, or translations here — not even sample
// text. The capture pipeline fills this skeleton later: the public-domain
// text is sourced (Latin-Library/Perseus-class, verified per the owner's
// verification-source rule — same-author Caesar means near-total vocabulary
// overlap with Henle's Classified Word List), adapted for readability as part
// of the original itself, and the content team's reading modules hang off
// these section ids.
//
// Owner doctrine encoded here (plan rev 75, 2026-10-25):
//   • ORIGINALS ARE SEPARATE BOOKS on the shelf (kind "original") — not a
//     view inside a textbook. This skeleton backs Book 3 on the Latin shelf.
//   • ADAPTATION IS BUILT INTO the original: the book is the work, adapted
//     for readability as it is captured — never a second bowdlerized volume.
//   • Book 2's Path 2 ("All the Caesar, in Order") is the companion-reading
//     BRIDGE to this book: latin2.ts points at it, this file provides the
//     structure the bridge leads to.
//
// Chapter counts are the standard enumeration of the received text; the
// capture pipeline verifies them against the PD source before any content
// attaches. They are wayfinding, not content.

/** Status of every structural node — always "awaiting-capture" in this pass. */
export type GallicWarSectionStatus = "awaiting-capture";

/**
 * A section = an episode anchor the capture pipeline fills (a chapter run of
 * the adapted text + its apparatus). Section ids are the content seam.
 */
export interface GallicWarSection {
  /** Stable section id — content modules hang off this ("gw-b1-helvetii"). */
  id: string;
  /** The episode's standard name (wayfinding only — not translated text). */
  title: string;
  status: GallicWarSectionStatus;
}

/** One book of the Gallic War — the skeleton's top-level grouping. */
export interface GallicWarPart {
  /** Stable part id — "gw-book-1" … "gw-book-8". */
  id: string;
  /** The book's number in the received order (1–8; 8 is Hirtius' supplement). */
  book: number;
  /** The book's own name, as conventionally printed. */
  title: string;
  /** One-line wayfinding subtitle — what the book covers. */
  subtitle: string;
  /** The standard chapter count of the book in the received text. */
  chapters: number;
  sections: GallicWarSection[];
}

// ── Book I — 58 BC: the Helvetii and Ariovistus ──────────────────────────
const GW_BOOK_1: GallicWarPart = {
  id: "gw-book-1",
  book: 1,
  title: "Book I",
  subtitle: "The Helvetii drive west; Ariovistus and the Germans are turned back",
  chapters: 54,
  sections: [
    { id: "gw-b1-helvetii", title: "The Helvetian War", status: "awaiting-capture" },
    { id: "gw-b1-ariovistus", title: "Ariovistus and the Germans", status: "awaiting-capture" },
  ],
};

// ── Book II — 57 BC: the Belgae ──────────────────────────────────────────
const GW_BOOK_2: GallicWarPart = {
  id: "gw-book-2",
  book: 2,
  title: "Book II",
  subtitle: "The Belgae rise; the Sabis against the Nervii; the Aduatuci; the coast",
  chapters: 35,
  sections: [
    { id: "gw-b2-belgae", title: "The Belgae rise", status: "awaiting-capture" },
    { id: "gw-b2-sabis", title: "The Battle of the Sabis", status: "awaiting-capture" },
    { id: "gw-b2-aduatuci", title: "The Aduatuci", status: "awaiting-capture" },
    { id: "gw-b2-morini", title: "The Morini submit", status: "awaiting-capture" },
  ],
};

// ── Book III — 56 BC: the Alpine and Atlantic campaigns ──────────────────
const GW_BOOK_3: GallicWarPart = {
  id: "gw-book-3",
  book: 3,
  title: "Book III",
  subtitle: "The Maritime Alps, the Veneti at sea, the Venelli, Aquitania",
  chapters: 29,
  sections: [
    { id: "gw-b3-alps", title: "Galba holds the Maritime Alps", status: "awaiting-capture" },
    { id: "gw-b3-veneti", title: "The Veneti and the Atlantic war", status: "awaiting-capture" },
    { id: "gw-b3-venelli", title: "Sabinus among the Venelli", status: "awaiting-capture" },
    { id: "gw-b3-aquitania", title: "Crassus in Aquitania", status: "awaiting-capture" },
    { id: "gw-b3-coast", title: "The coast secured", status: "awaiting-capture" },
  ],
};

// ── Book IV — 55 BC: Germans, the Rhine, first Britain ───────────────────
const GW_BOOK_4: GallicWarPart = {
  id: "gw-book-4",
  book: 4,
  title: "Book IV",
  subtitle: "The Usipetes and Tencteri; the bridge over the Rhine; first Britain",
  chapters: 38,
  sections: [
    { id: "gw-b4-germans", title: "The Usipetes and Tencteri", status: "awaiting-capture" },
    { id: "gw-b4-rhine", title: "The bridge over the Rhine", status: "awaiting-capture" },
    { id: "gw-b4-britain", title: "First expedition to Britain", status: "awaiting-capture" },
    { id: "gw-b4-return", title: "Return to Gaul", status: "awaiting-capture" },
  ],
};

// ── Book V — 54 BC: second Britain, the winter disasters ─────────────────
const GW_BOOK_5: GallicWarPart = {
  id: "gw-book-5",
  book: 5,
  title: "Book V",
  subtitle: "Second Britain; the Aduatuca disaster; Quintus Cicero's camp",
  chapters: 58,
  sections: [
    { id: "gw-b5-britain", title: "Second expedition to Britain", status: "awaiting-capture" },
    { id: "gw-b5-aduatuca", title: "The Aduatuca disaster", status: "awaiting-capture" },
    { id: "gw-b5-cicero", title: "Quintus Cicero's camp", status: "awaiting-capture" },
    { id: "gw-b5-indutiomarus", title: "Indutiomarus", status: "awaiting-capture" },
  ],
};

// ── Book VI — 53 BC: the Rhine again, the customs of Gaul ────────────────
const GW_BOOK_6: GallicWarPart = {
  id: "gw-book-6",
  book: 6,
  title: "Book VI",
  subtitle: "The Treveri; the Rhine crossed again; the customs of the Gauls and the Druids",
  chapters: 44,
  sections: [
    { id: "gw-b6-treveri", title: "The Treveri defeated", status: "awaiting-capture" },
    { id: "gw-b6-rhine", title: "The Rhine crossed again", status: "awaiting-capture" },
    { id: "gw-b6-customs", title: "The customs of the Gauls and the Druids", status: "awaiting-capture" },
    { id: "gw-b6-eburones", title: "The Eburones ravaged", status: "awaiting-capture" },
    { id: "gw-b6-ambiorix", title: "The flight of Ambiorix", status: "awaiting-capture" },
  ],
};

// ── Book VII — 52 BC: the great revolt ───────────────────────────────────
const GW_BOOK_7: GallicWarPart = {
  id: "gw-book-7",
  book: 7,
  title: "Book VII",
  subtitle: "Vercingetorix; Avaricum; Gergovia; the siege of Alesia",
  chapters: 90,
  sections: [
    { id: "gw-b7-vercingetorix", title: "The revolt of Vercingetorix", status: "awaiting-capture" },
    { id: "gw-b7-avaricum", title: "Avaricum", status: "awaiting-capture" },
    { id: "gw-b7-gergovia", title: "Gergovia", status: "awaiting-capture" },
    { id: "gw-b7-lutetia", title: "Labienus at Lutetia", status: "awaiting-capture" },
    { id: "gw-b7-alesia", title: "The siege of Alesia", status: "awaiting-capture" },
    { id: "gw-b7-surrender", title: "Vercingetorix surrenders", status: "awaiting-capture" },
  ],
};

// ── Book VIII — 51 BC: Hirtius' supplement ───────────────────────────────
const GW_BOOK_8: GallicWarPart = {
  id: "gw-book-8",
  book: 8,
  title: "Book VIII",
  subtitle: "A. Hirtius' supplement — the winter campaigns that close the war",
  chapters: 55,
  sections: [
    { id: "gw-b8-bellovaci", title: "The Bellovaci", status: "awaiting-capture" },
    { id: "gw-b8-uxellodunum", title: "Uxellodunum", status: "awaiting-capture" },
    { id: "gw-b8-close", title: "The final submissions", status: "awaiting-capture" },
  ],
};

/**
 * The Gallic War's eight books in received order. The Book 3 page renders
 * this as the structural outline; the capture pipeline replaces each
 * section's "awaiting-capture" with the adapted reading keyed by section id.
 */
export const GALLIC_WAR_STRUCTURE: GallicWarPart[] = [
  GW_BOOK_1,
  GW_BOOK_2,
  GW_BOOK_3,
  GW_BOOK_4,
  GW_BOOK_5,
  GW_BOOK_6,
  GW_BOOK_7,
  GW_BOOK_8,
];

/** Every section id in book order — the capture pipeline's content seam. */
export function gallicWarSectionIds(): string[] {
  return GALLIC_WAR_STRUCTURE.flatMap((part) => part.sections.map((s) => s.id));
}

/** Resolve one section by id, knowing its book — pure lookup. */
export function gallicWarSection(
  id: string,
): { part: GallicWarPart; section: GallicWarSection } | undefined {
  for (const part of GALLIC_WAR_STRUCTURE) {
    const section = part.sections.find((s) => s.id === id);
    if (section) return { part, section };
  }
  return undefined;
}

/** Identity metadata for the original itself (provenance + adaptation note). */
export const GALLIC_WAR_META = {
  bookKey: "latin-gallic-war",
  latinTitle: "Bellum Gallicum",
  author: "C. Iulius Caesar",
  /**
   * Owner doctrine (plan rev 75): adaptation is BUILT INTO the original —
   * the captured text is adapted for readability as it is captured; the
   * original is one book, not a raw volume plus a second adapted one.
   */
  adaptationNote:
    "Adapted for readability as it is captured — the adaptation is part of this book, not a separate volume.",
  /**
   * Sourcing note (honest): the PD text is queued for the capture pipeline
   * (Latin-Library/Perseus-class sources, verified per the owner's
   * verification-source rule). Until it lands, the book is structure only.
   */
  sourcingNote:
    "Public-domain text, sourced and verified with the capture pipeline — the book fills in book order.",
} as const;
