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
 *           that name the drilled item (or the host lesson's own tips);
 *       (b) topic-adjacent — the grammar-index topics the item's lesson or
 *           section trains (captured definitions);
 *       (c) general enrichment — the curated culture bank (NLE culture
 *           B1–B6 bundles) and the grammar-index definitions (PD-reference
 *           lore). Ring (a) is preferred when it exists.
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

interface TriviaBank {
  /** Ring (a) sources: captured tips (Book-1 teaching steps, culture lore). */
  itemFacts: TriviaFact[];
  /** Ring (b)/(c) sources: captured grammar-index definitions. */
  topicDefs: TriviaFact[];
  /** Ring (c) sources: the curated culture bank's step explanations. */
  generalFacts: TriviaFact[];
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
  BANK = { itemFacts, topicDefs, generalFacts };
  return BANK;
}

/** The grammar topics a Book-1 lesson trains (captured mapping). */
function topicsForLesson(lesson: Lesson | undefined): GrammarTopic[] {
  if (!lesson) return [];
  return GRAMMAR_INDEX.filter((t) => t.relatedLessonIds.includes(lesson.id));
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

  // Ring (a) — item-tied: captured tips naming the item; fall back to the
  // host lesson's own captured tips (Book 1's teaching-step lore).
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
  const ringA = tied.length > 0 ? tied : lessonTips;
  const a = pickFrom(ringA);
  if (a) return a;

  // Ring (b) — topic-adjacent: the grammar topics this lesson/section trains
  // (captured definitions), widened by any topic whose keywords name the item.
  const baseTopics = ctx.topics && ctx.topics.length > 0
    ? ctx.topics
    : topicsForLesson(ctx.lesson);
  const extraTopics = GRAMMAR_INDEX.filter(
    (t) =>
      !baseTopics.includes(t) &&
      t.keywords.some((k) => {
        const kt = normKey(k);
        return kt.length > 2 && item.has(kt);
      }),
  );
  const ringB = [...baseTopics, ...extraTopics]
    .map((t) => fact(t.definition))
    .filter((f) => f.text.length > 0);
  const b = pickFrom(ringB);
  if (b) return b;

  // Ring (c) — general enrichment: the curated culture bank + the grammar
  // index's definitions (verified PD-reference lore).
  return pickFrom([...bank.generalFacts, ...bank.topicDefs]);
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
