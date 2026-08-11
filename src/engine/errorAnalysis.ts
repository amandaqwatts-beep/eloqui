/**
 * errorAnalysis.ts — Engine department: rule-based mistake explanations.
 *
 * Owner direction 2026-08-11: "rule-based (no AI needed if well coded)
 * explanations of what you got wrong, why, what would be correct, and why —
 * in context", fed by diagnostics data. Pure logic — zero JSX, zero fetch,
 * no LLM calls.
 *
 * Design: research/error-analysis-engine-design.md. Phase A ships the
 * per-answer explanation engine:
 *  - one template per closed MistakeType (D1) — we map classifyMistake's
 *    verdict, never re-classify;
 *  - context assembled from the wrong/expected answers + lesson data (§5);
 *  - the "why correct" rule text is *selected* from existing lesson content
 *    (comprehensionCheck → teachingSteps → concept), never authored (D6);
 *  - events are accepted but unused in Phase A copy (D7 — Phase B adds the
 *    pattern + confusion-pair layers on top of this same pipeline).
 *
 * Reuses diagnostics (classifyMistake, deriveConceptIds, buildVocabularyIndex,
 * buildConceptIndex), answers (normalizeAnswer) and the fallback generator's
 * stripHtml. No changes to lesson.ts / answers.ts / storage.ts / drill.ts /
 * data files. Per-language data is a Phase C concern (template copy is English,
 * matching the app's existing exercise explanations).
 */
import type { Exercise, Lesson } from "~/data/latinLessons";
import { normalizeAnswer } from "~/engine/answers";
import {
  buildVocabularyIndex,
  classifyMistake,
  deriveConceptIds,
  type VocabIndex,
} from "~/engine/diagnostics";
import { stripHtml } from "~/engine/fallbackGenerator";
import type {
  ConceptKind,
  ExplanationContext,
  ExplanationExerciseSource,
  ExplanationPoint,
  ExplanationRequest,
  ExplanationResult,
  ExplanationTemplate,
  FormLabel,
  MistakeType,
} from "~/engine/types";

// ── Classification plumbing (D1: map, never re-classify) ─────────

/**
 * Adapt a structural exercise source to the Exercise shape the shared
 * diagnostics helpers need. `id` is synthetic (classifyMistake/deriveConceptIds
 * never read it); only type/options/correctIndex/answer/acceptableAnswers/prompt
 * are consulted. A degenerate MC (no options or out-of-range index) falls back
 * to the fill shape so no code path indexes an empty option list.
 */
function toExercise(src: ExplanationExerciseSource): Exercise {
  const base = { id: "explained", prompt: src.prompt };
  if (
    src.type === "multiple-choice" &&
    Array.isArray(src.options) &&
    src.options.length > 0 &&
    typeof src.correctIndex === "number" &&
    src.correctIndex >= 0 &&
    src.correctIndex < src.options.length
  ) {
    return { ...base, type: "multiple-choice", options: src.options, correctIndex: src.correctIndex };
  }
  return {
    ...base,
    type: "fill-in-blank",
    answer: src.answer ?? "",
    acceptableAnswers: src.acceptableAnswers ?? [],
  };
}

/** The canonical answer text when the request did not forward `expected` (§5.1). */
function deriveExpected(exercise: ExplanationExerciseSource): string {
  if (exercise.type === "multiple-choice" && exercise.options && exercise.correctIndex !== undefined) {
    return exercise.options[exercise.correctIndex] ?? "";
  }
  if (exercise.type === "fill-in-blank") return exercise.answer ?? "";
  return "";
}

// ── Form labelling (§5.5) ───────────────────────────────────────

const CASE_NAMES = /^(nominative|genitive|dative|accusative|ablative|vocative|locative)$/i;

/** Strip a leading hyphen/em-dash from ending cells ("-ae" → "ae"). */
function stripLeadingHyphen(s: string | undefined): string {
  return (s ?? "").replace(/^[-–—]+/, "");
}

/**
 * A referenceTable is case-shaped when the first header is "Case" or the first
 * row starts with a case name. Verb-form tables (e.g. lesson 3's
 * "3rd-Person Verb Forms") are skipped so their cells are never mislabelled.
 */
function isCaseTable(headers: string[], rows: string[][]): boolean {
  if ((headers[0] ?? "").trim().toLowerCase() === "case") return true;
  if (rows.length === 0) return false;
  return CASE_NAMES.test((rows[0][0] ?? "").trim());
}

/**
 * Map a form to case/number (reference table) or person/number (conjugation
 * table) labels by equality with table cells. Returns null when the form is
 * not a cell of either table — copy then degrades rather than fabricating a
 * case name (§10).
 */
export function describeForm(form: string, lesson: Lesson): FormLabel | null {
  const n = normalizeAnswer(form);
  if (!n) return null;
  const rt = lesson.referenceTable;
  if (rt && isCaseTable(rt.headers, rt.rows)) {
    for (const row of rt.rows) {
      const caseName = row[0] ?? "";
      const singular = stripLeadingHyphen(row[1]);
      const plural = stripLeadingHyphen(row[2]);
      if (n === normalizeAnswer(singular)) return { case: caseName, number: "singular" };
      if (n === normalizeAnswer(plural)) return { case: caseName, number: "plural" };
    }
  }
  const ct = lesson.conjugationTable;
  if (ct) {
    for (const row of ct.rows) {
      if (n === normalizeAnswer(row.singular)) return { person: row.person, number: "singular" };
      if (n === normalizeAnswer(row.plural)) return { person: row.person, number: "plural" };
    }
  }
  return null;
}

// ── Ending rule derivation (§5.4) ───────────────────────────────

const DECLENSION_PATTERNS: Array<[RegExp, string]> = [
  [/(first|1st)[\s-]*(?:declension|decl\.?)/i, "first-declension"],
  [/(second|2nd)[\s-]*(?:declension|decl\.?)/i, "second-declension"],
  [/(third|3rd)[\s-]*(?:declension|decl\.?)/i, "third-declension"],
  [/(fourth|4th)[\s-]*(?:declension|decl\.?)/i, "fourth-declension"],
  [/(fifth|5th)[\s-]*(?:declension|decl\.?)/i, "fifth-declension"],
];

/** "first-declension" (etc.) from lesson title/subtitle/concept/table title, else null. */
function declensionOf(lesson: Lesson): string | null {
  const hay = `${lesson.title ?? ""} ${lesson.subtitle ?? ""} ${lesson.concept ?? ""} ${lesson.referenceTable?.title ?? ""}`;
  for (const [re, label] of DECLENSION_PATTERNS) {
    if (re.test(hay)) return label;
  }
  return null;
}

function ruleLine(
  caseName: string,
  number: "singular" | "plural",
  decl: string | null,
  ending?: string,
  cell?: string,
): string {
  const c = caseName.toLowerCase();
  const declText = decl ? ` of a ${decl} noun` : "";
  if (ending !== undefined) {
    const dash = ending.startsWith("-") ? ending : `-${ending}`;
    return decl
      ? `The ${c} ${number}${declText} ends in ${dash}.`
      : `The ${c} ${number} ending is ${dash}.`;
  }
  return `The ${c} ${number}${declText} is ${cell ?? "the form asked for"}.`;
}

function jobLine(caseName: string, job: string | undefined): string | null {
  const j = (job ?? "").trim();
  if (!j) return null;
  // Terse data jobs ("of / possession", "to / for") read better with "expresses".
  if (/^(of|to|for|with|from|in)\b/.test(j)) return `The ${caseName.toLowerCase()} case expresses ${j}.`;
  return `The ${caseName.toLowerCase()} is the ${j}.`;
}

/**
 * "The genitive singular ending is -ae." — derived from the lesson's
 * referenceTable. Exact cell equality first (unambiguous); when `expected` is
 * an ending, match cell endings, preferring the case hinted by `prompt` and
 * singular cells over plural (spec §5.4 worked example: "ae" → genitive
 * singular). Returns null when the lesson lacks a case-shaped table.
 */
export function endingRuleFor(expected: string, lesson: Lesson, hint?: string): string | null {
  const rt = lesson.referenceTable;
  if (!rt || !isCaseTable(rt.headers, rt.rows)) return null;
  const target = stripLeadingHyphen(normalizeAnswer(expected));
  if (!target) return null;
  const decl = declensionOf(lesson);
  const rows = rt.rows
    .map((row) => ({
      case: row[0] ?? "",
      singular: stripLeadingHyphen(row[1]),
      plural: stripLeadingHyphen(row[2]),
      job: row[3],
    }))
    .filter((r) => r.singular !== "" || r.plural !== "");
  // 1. Full-form equality — only when the expected clearly is a full form
  //    (word-like, not a bare ending like "ae"). Ending-style cells ("-ae")
  //    never short-circuit the ending branch, so "ae" → genitive singular
  //    (spec §5.4 worked example), not nominative plural.
  const isFullForm = expected.includes(" ") || expected.length > 4;
  if (isFullForm) {
    for (const r of rows) {
      if (normalizeAnswer(r.singular) === target) {
        const line = ruleLine(r.case, "singular", decl, undefined, r.singular);
        const job = jobLine(r.case, r.job);
        return job ? `${line} ${job}` : line;
      }
      if (normalizeAnswer(r.plural) === target) {
        const line = ruleLine(r.case, "plural", decl, undefined, r.plural);
        const job = jobLine(r.case, r.job);
        return job ? `${line} ${job}` : line;
      }
    }
  }
  // 2. Ending match — prefer the case the prompt names, then singular cells.
  const hinted = hint ? rows.find((r) => hint.toLowerCase().includes(r.case.toLowerCase())) : undefined;
  const ordered = hinted ? [hinted, ...rows.filter((r) => r !== hinted)] : rows;
  for (const pass of [0, 1] as const) {
    for (const r of ordered) {
      const cell = pass === 0 ? r.singular : r.plural;
      if (cell && cell.endsWith(target)) {
        const line = ruleLine(r.case, pass === 0 ? "singular" : "plural", decl, target);
        const job = jobLine(r.case, r.job);
        return job ? `${line} ${job}` : line;
      }
    }
  }
  return null;
}

// ── Stem/ending decomposition (§5.5) ────────────────────────────

/**
 * For fill ending prompts ("…port___"), parse the stem from the prompt's
 * underscore pattern and split it off the given form. When the form does not
 * start with the stem (a bare ending, or a word from another paradigm) only
 * the stem is returned — the caller treats the whole form as an ending.
 */
export function decomposeForm(form: string, prompt: string): { stem?: string; ending?: string } {
  const m = prompt.match(/[\p{L}]+_{3,}/u);
  if (!m) return {};
  const stem = m[0].replace(/_+$/u, "");
  if (!stem) return {};
  const nForm = normalizeAnswer(form);
  const nStem = normalizeAnswer(stem);
  if (nForm.startsWith(nStem) && nForm.length > nStem.length) {
    return { stem, ending: form.slice(stem.length) };
  }
  return { stem };
}

// ── Difference description (§5.5) ───────────────────────────────

/**
 * Orthographic description of how `b` differs from `a` ("orat" vs "orant" →
 * "the extra 'n' before the 't'"). Returns null when there is no meaningful
 * structural overlap (prefix/suffix shorter than 2 chars) — copy then omits
 * the distinguishing line rather than printing noise.
 */
export function describeDifference(a: string, b: string): string | null {
  const A = normalizeAnswer(a);
  const B = normalizeAnswer(b);
  if (!A || !B || A === B) return null;
  // Longest common prefix up to (but excluding) the first differing char.
  let p = 0;
  while (p < A.length && p < B.length && A[p] === B[p]) p++;
  if (p >= 2) {
    const diff = describeRest(A.slice(p), B.slice(p));
    if (diff) return diff;
  }
  // Longest common suffix, when the prefix is too short to be meaningful.
  let s = 0;
  while (s < A.length && s < B.length && A[A.length - 1 - s] === B[B.length - 1 - s]) s++;
  if (s >= 2) {
    const aHead = A.slice(0, A.length - s);
    const bHead = B.slice(0, B.length - s);
    return `the '${aHead}' should be '${bHead}' at the start`;
  }
  return null;
}

function describeRest(aRest: string, bRest: string): string | null {
  if (aRest === "" && bRest === "") return null;
  if (aRest === "") return `there's an extra '${bRest}' at the end`;
  if (bRest === "") return `there's an extra '${aRest}' at the end`;
  if (bRest.endsWith(aRest)) {
    const extra = bRest.slice(0, bRest.length - aRest.length);
    return `the extra '${extra}' before the '${aRest}'`;
  }
  if (aRest.endsWith(bRest)) {
    const extra = aRest.slice(0, aRest.length - bRest.length);
    return `the extra '${extra}' before the '${bRest}'`;
  }
  if (aRest.length === bRest.length) return `the '${aRest}' should be '${bRest}' at the end`;
  return `the '${aRest}' should be '${bRest}'`;
}

// ── Person-ending fallback (§5.5) ───────────────────────────────

/**
 * Latin-specific static ending → person map for verb prompts when the lesson
 * has no conjugationTable. Must become per-language data when Greek/Hebrew
 * tracks get diagnostics (spec §12.3).
 */
const STATIC_PERSON_ENDINGS: Record<string, string> = {
  "-t": "3rd person singular",
  "-nt": "3rd person plural",
  "-s": "2nd person singular",
  "-tis": "2nd person plural",
  "-mus": "1st person plural",
  "-o": "1st person singular",
  "-ō": "1st person singular",
};

function personForEnding(form: string): string | null {
  const n = stripLeadingHyphen(normalizeAnswer(form));
  if (!n) return null;
  const endings = Object.entries(STATIC_PERSON_ENDINGS)
    .map(([k, v]) => [stripLeadingHyphen(k), v] as const)
    .sort((a, b) => b[0].length - a[0].length); // longest first: "-tis" before "-s"
  for (const [ending, person] of endings) {
    if (ending && n.endsWith(ending)) return person;
  }
  return null;
}

// ── Rule-text selection (D6, §5.3) ──────────────────────────────

/**
 * Select (never author) the rule sentence that explains why the expected
 * answer is correct. Priority: comprehensionCheck whose question matches the
 * exercise prompt → scored teachingStep sentences → scored concept sentences.
 * Among tied top scores pick the shortest. Null only when nothing scores > 0.
 */
export function pickRuleText(lesson: Lesson, ctx: ExplanationContext): string | null {
  const np = normalizeAnswer(ctx.prompt);
  for (const q of lesson.comprehensionCheck ?? []) {
    const nq = normalizeAnswer(q.question);
    if (nq !== "" && (nq === np || (np !== "" && nq.includes(np)) || (nq.length > 0 && np.includes(nq)))) {
      const t = stripHtml(q.explanation).trim();
      if (t) return t;
    }
  }
  let best: { score: number; text: string } | null = null;
  const candidates: string[] = [];
  for (const step of lesson.teachingSteps ?? []) {
    candidates.push(step.explanation);
    if (step.tip) candidates.push(step.tip);
  }
  candidates.push(lesson.concept);
  for (const text of candidates) {
    for (const s of splitSentences(stripHtml(text))) {
      const score = scoreSentence(s, ctx);
      if (score > 0 && (best === null || score > best.score || (score === best.score && s.length < best.text.length))) {
        best = { score, text: s };
      }
    }
  }
  return best ? best.text : null;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZĀ-Ū])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function scoreSentence(s: string, ctx: ExplanationContext): number {
  const n = normalizeAnswer(s);
  if (!n) return 0;
  let score = 0;
  const targets: string[] = [];
  if (ctx.expectedN) targets.push(ctx.expectedN);
  if (ctx.expectedEnding) {
    const ending = stripLeadingHyphen(normalizeAnswer(ctx.expectedEnding));
    // Length-1 endings ("a") match nearly every sentence — skip them as substrings.
    if (ending && ending.length >= 2 && !targets.includes(ending)) targets.push(ending);
  }
  if (targets.some((t) => n.includes(t))) score += 2;
  const labels = [
    ctx.expectedCase, ctx.wrongCase, ctx.expectedNum, ctx.wrongNum,
    ctx.expectedPerson, ctx.wrongPerson, ctx.expectedGender, ctx.wrongGender,
  ].filter((l): l is string => !!l);
  if (labels.some((l) => n.includes(normalizeAnswer(l)))) score += 1;
  if (/declension|ending|case|singular|plural|person|gender|number/.test(n)) score += 1;
  return score;
}

// ── Context assembly (§5) ───────────────────────────────────────

/**
 * Resolve the wrong answer through the vocab index (lemma OR gloss,
 * normalized) and report which field matched. Returns null on gloss
 * collisions — a wrong word is never named on ambiguous evidence (§5.2, §10).
 */
function resolveLemma(
  normalized: string,
  lessons: Lesson[],
): { lemma: string; gloss: string; matched: "latin" | "english" } | null {
  if (!normalized) return null;
  const hits = new Map<string, { lemma: string; gloss: string; matched: "latin" | "english" }>();
  for (const lesson of lessons) {
    for (const item of lesson.vocabulary ?? []) {
      if (normalizeAnswer(item.latin) === normalized) {
        hits.set(normalizeAnswer(item.latin), { lemma: item.latin, gloss: item.english, matched: "latin" });
      }
      if (normalizeAnswer(item.english) === normalized) {
        hits.set(normalizeAnswer(item.latin), { lemma: item.latin, gloss: item.english, matched: "english" });
      }
    }
  }
  return hits.size === 1 ? [...hits.values()][0] : null;
}

/**
 * For concept-kind prompts that name a vocab word (e.g. "The gender of terra
 * is ___"), use that word as the label instead of the lesson title — the
 * title reads wrongly in "You called The Declension of Terra feminine…".
 * Latin lemmas only (English gloss scans are too noisy: "is" is a gloss).
 */
function vocabLabelInPrompt(prompt: string, lesson: Lesson): string | undefined {
  const np = normalizeAnswer(prompt);
  if (!np) return undefined;
  for (const item of lesson.vocabulary ?? []) {
    const lemma = normalizeAnswer(item.latin);
    if (lemma.length >= 2 && np.includes(lemma)) return item.latin;
  }
  return undefined;
}

/** Assemble the full context a template build needs (exported for tests, §5). */
export function resolveContext(req: ExplanationRequest, mistake: MistakeType): ExplanationContext {
  const { detail, exercise, lesson } = req;
  const allLessons = req.allLessons && req.allLessons.length > 0 ? req.allLessons : [lesson];
  const wrong = detail.wrong ?? "";
  const expected = detail.expected ?? deriveExpected(exercise);
  const wrongN = normalizeAnswer(wrong);
  const expectedN = normalizeAnswer(expected);
  const exerciseType = exercise.type;
  const prompt = exercise.prompt ?? "";
  const vocabIndex: VocabIndex = buildVocabularyIndex(allLessons);
  const { primary, kind } = deriveConceptIds(lesson, toExercise(exercise));

  // Label & gloss (§5.2).
  let label = "";
  let gloss: string | undefined;
  if (kind === "vocab") {
    const entry = vocabIndex.get(primary.slice("vocab:".length));
    label = entry?.lemma ?? primary.slice("vocab:".length);
    gloss = entry?.gloss;
  } else {
    label = vocabLabelInPrompt(prompt, lesson) ?? lesson.title;
  }

  // Wrong → different lemma (§5.2).
  const wHit = resolveLemma(wrongN, allLessons);
  const wrongLemma = wHit?.lemma;
  const wrongLemmaGloss = wHit?.gloss;
  const wrongMatched = wHit?.matched;

  // Stem/ending decomposition (§5.5). When the answer is a bare ending, the
  // whole answer IS the ending (no stem match).
  const decompSource = prompt.includes("___") ? prompt : (exercise.before ?? prompt);
  const dWrong = decomposeForm(wrong, decompSource);
  const dExpected = decomposeForm(expected, decompSource);
  const stem = dWrong.stem ?? dExpected.stem;
  let wrongEnding = dWrong.ending;
  let expectedEnding = dExpected.ending;
  if (stem) {
    if (!wrongEnding) wrongEnding = wrong;
    if (!expectedEnding) expectedEnding = expected;
  }

  // Form labels (§5.5) — table scan first, static person endings as fallback.
  const wrongFL = describeForm(wrong, lesson);
  const expectedFL = describeForm(expected, lesson);
  const wrongCase = wrongFL?.case;
  const wrongNum = wrongFL?.number;
  const expectedCase = expectedFL?.case;
  const expectedNum = expectedFL?.number;
  let wrongPerson = wrongFL?.person;
  let expectedPerson = expectedFL?.person;
  if (!wrongPerson) wrongPerson = personForEnding(wrong) ?? undefined;
  if (!expectedPerson) expectedPerson = personForEnding(expected) ?? undefined;

  // Gender labels come from the answer text on gender prompts.
  let wrongGender: string | undefined;
  let expectedGender: string | undefined;
  if (/\bgender\b/i.test(prompt)) {
    wrongGender = wrong;
    expectedGender = expected;
  }

  const ctx: ExplanationContext = {
    mistake,
    wrong,
    expected,
    wrongN,
    expectedN,
    exerciseType,
    prompt,
    conceptId: primary,
    kind,
    label,
    gloss,
    wrongLemma,
    wrongLemmaGloss,
    wrongMatched,
    stem,
    wrongEnding,
    expectedEnding,
    wrongCase,
    expectedCase,
    wrongNum,
    expectedNum,
    wrongPerson,
    expectedPerson,
    wrongGender,
    expectedGender,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    canned: exercise.explanation,
    lesson,
  };
  ctx.ruleText = pickRuleText(lesson, ctx) ?? undefined;
  ctx.endingRule = endingRuleFor(expectedEnding ?? expected, lesson, prompt) ?? undefined;
  if (mistake === "confused-with") {
    ctx.difference = describeDifference(label, wrongLemma ?? wrong) ?? undefined;
  } else if (mistake === "spelling") {
    ctx.difference = describeDifference(wrong, expected) ?? undefined;
  }
  return ctx;
}

// ── Templates (§4) ──────────────────────────────────────────────

function verbFor(c: ExplanationContext): string {
  return c.exerciseType === "multiple-choice" ? "You chose" : "You wrote";
}

function mkPoint(text: string, ...highlights: Array<string | undefined>): ExplanationPoint {
  const hs = highlights.filter((h): h is string => !!h && h.length > 0 && text.includes(h));
  return hs.length > 0 ? { text, highlight: hs } : { text };
}

function caseNum(caseName: string | undefined, num: "singular" | "plural" | undefined): string {
  if (caseName && num) return `${caseName} ${num}`;
  return caseName ?? num ?? "the wrong form";
}

function vocabDrill(label: string): { conceptId: string; label: string; kind: ConceptKind } {
  return { conceptId: `vocab:${normalizeAnswer(label)}`, label, kind: "vocab" };
}

function conceptDrill(c: ExplanationContext): { conceptId: string; label: string; kind: ConceptKind } {
  return { conceptId: `concept:${c.lessonId}`, label: c.lessonTitle, kind: "concept" };
}

function makeTemplate(type: MistakeType, build: (c: ExplanationContext) => ExplanationResult): ExplanationTemplate {
  return { type, build };
}

export const EXPLANATION_TEMPLATES: Record<MistakeType, ExplanationTemplate> = {
  "wrong-meaning": makeTemplate("wrong-meaning", (c) => {
    const v = verbFor(c);
    let body = `${v} ${c.wrong}, but ${c.label} means ${c.expected}.`;
    const points: ExplanationPoint[] = [mkPoint(`${c.label} = ${c.expected}.`, c.label, c.expected)];
    if (c.wrongLemma) {
      if (c.wrongMatched === "latin") {
        // The student typed a Latin word from another lesson.
        body += ` ${c.wrong} is the Latin word for ${c.wrongLemmaGloss}.`;
        points.push(mkPoint(`You may be thinking of ${c.wrongLemmaGloss} (${c.wrongLemma}).`, c.wrongLemmaGloss, c.wrongLemma));
      } else {
        body += ` ${c.wrong} is the meaning of ${c.wrongLemma}.`;
        points.push(mkPoint(`You may be thinking of ${c.wrongLemma} (${c.wrong}).`, c.wrongLemma, c.wrong));
      }
    }
    return {
      title: "Not quite — different word",
      body,
      points,
      drillSuggestion: c.wrongLemma ? vocabDrill(c.wrongLemma) : undefined,
      source: "rule-generated",
    };
  }),

  "wrong-form": makeTemplate("wrong-form", (c) => {
    const v = verbFor(c);
    const points: ExplanationPoint[] = [];
    let body: string;
    if (c.exerciseType === "fill-in-blank" && c.stem) {
      // Ending prompt (§10): wrong/expected may be full words or bare endings.
      const wrongIsEnding = c.wrongEnding === c.wrong;
      const expectedIsEnding = c.expectedEnding === c.expected;
      if (wrongIsEnding && !expectedIsEnding) {
        body = `You wrote the ending ${c.wrong}, but the question asks for the full form ${c.expected}.`;
      } else {
        body = `${v} ${c.wrong}; the ending asked for is ${c.expected}.`;
      }
      if (c.endingRule) {
        body += ` ${c.endingRule}`;
        points.push(mkPoint(c.endingRule, c.expectedEnding ?? c.expected));
      }
    } else {
      body = `${v} ${c.wrong} — the right word, but not the form asked for. The form needed is ${c.expected}.`;
      if (c.wrongCase && c.expectedCase) {
        body += ` ${c.wrong} is ${caseNum(c.wrongCase, c.wrongNum)}; ${c.expected} is ${caseNum(c.expectedCase, c.expectedNum)}.`;
      }
    }
    return { title: "Right word, wrong form", body, points, drillSuggestion: conceptDrill(c), source: "rule-generated" };
  }),

  "wrong-case": makeTemplate("wrong-case", (c) => {
    const v = verbFor(c);
    const both = !!c.wrongCase && !!c.expectedCase;
    const title = both ? `Case mix-up: ${c.wrongCase} vs ${c.expectedCase}` : "Case mix-up";
    let body = `${v} ${c.wrong}`;
    if (c.wrongCase) body += `, which is the ${c.wrongCase} form`;
    body += `. The prompt asks for the ${c.expectedCase ?? "case"}: ${c.expected}. Each case has its own ending and job.`;
    const points: ExplanationPoint[] = [];
    const caseName = c.expectedCase ?? c.wrongCase;
    if (caseName) {
      const rt = c.lesson?.referenceTable;
      const row = rt?.rows.find((r) => (r[0] ?? "").toLowerCase() === caseName.toLowerCase());
      const job = row ? jobLine(caseName, row[3]) : null;
      if (job) points.push(mkPoint(job, caseName, c.expected));
    }
    return { title, body, points, drillSuggestion: conceptDrill(c), source: "rule-generated" };
  }),

  "wrong-number": makeTemplate("wrong-number", (c) => {
    const v = verbFor(c);
    const pluralHint = (n: "singular" | "plural" | undefined) =>
      n === "singular" ? "one" : n === "plural" ? "more than one" : undefined;
    let body = `${v} ${c.wrong}`;
    if (c.wrongNum) body += `, which is ${c.wrongNum} (${pluralHint(c.wrongNum)})`;
    body += `. The prompt asks for the ${c.expectedNum ?? "right number"}: ${c.expected}. In Latin, number changes the ending.`;
    const points: ExplanationPoint[] = [];
    if (c.expectedNum) {
      const label = c.expectedCase ? `${c.expectedNum} ${c.expectedCase}` : c.expectedNum;
      points.push(mkPoint(`${label}: ${c.expected}.`, c.expected));
    }
    if (c.endingRule) points.push(mkPoint(c.endingRule, c.expectedEnding ?? c.expected));
    return { title: "Singular vs plural", body, points, drillSuggestion: conceptDrill(c), source: "rule-generated" };
  }),

  "wrong-person": makeTemplate("wrong-person", (c) => {
    const v = verbFor(c);
    let body = `${v} ${c.wrong}`;
    if (c.wrongPerson) body += ` — that's ${c.wrongPerson}`;
    body += `. The form asked for is ${c.expectedPerson ? `${c.expectedPerson}: ` : ""}${c.expected}. The verb ending tells you who is doing the action.`;
    const points: ExplanationPoint[] = [];
    if (c.expectedPerson) {
      // Conjugation line: static ending → person, with a teaching example when one matches.
      let example: string | null = null;
      for (const step of c.lesson?.teachingSteps ?? []) {
        if (normalizeAnswer(step.exampleLatin).includes(normalizeAnswer(c.expected))) {
          example = `${step.exampleLatin} (${step.exampleEnglish})`;
          break;
        }
      }
      points.push(mkPoint(`${c.expected} = ${c.expectedPerson}${example ? `: e.g. ${example}` : ""}.`, c.expected));
    }
    return { title: "Person mix-up", body, points, drillSuggestion: conceptDrill(c), source: "rule-generated" };
  }),

  "wrong-gender": makeTemplate("wrong-gender", (c) => {
    const points: ExplanationPoint[] = [];
    if (c.ruleText) points.push(mkPoint(c.ruleText, c.expectedGender));
    return {
      title: "Gender mix-up",
      body: `You called ${c.label} ${c.wrongGender ?? "the wrong gender"}, but it is ${c.expectedGender ?? "different"}. Gender is a property of the noun itself, not its meaning.`,
      points,
      drillSuggestion: vocabDrill(c.label),
      source: "rule-generated",
    };
  }),

  "confused-with": makeTemplate("confused-with", (c) => {
    const v = verbFor(c);
    const wl = c.wrongLemma ?? c.wrong;
    const title = `Confusing ${c.label} with ${wl}`;
    // When the wrong answer is a gloss (L→E direction): "You chose gate — that's
    // the meaning of porta…". When it is a Latin word (E→L direction): "You chose
    // terra — that's the word for earth, land…".
    const body =
      c.wrongMatched === "latin"
        ? `${v} ${c.wrong} — that's the word for ${c.wrongLemmaGloss}, not ${c.label}. ${c.label} means ${c.expected}.`
        : `${v} ${c.wrong} — that's the meaning of ${wl}, not ${c.label}. ${c.label} means ${c.expected}.`;
    const points: ExplanationPoint[] = [];
    if (c.difference) points.push(mkPoint(`Look at the difference: ${c.label} vs ${wl} — ${c.difference}.`, c.label, wl));
    return { title, body, points, drillSuggestion: vocabDrill(wl), source: "rule-generated" };
  }),

  spelling: makeTemplate("spelling", (c) => {
    let body = `You wrote ${c.wrong}; the correct form is ${c.expected}.`;
    if (c.difference) body += ` The difference: ${c.difference}.`;
    const points: ExplanationPoint[] = [mkPoint(`Check the letters: ${c.expected}.`, c.expected)];
    return {
      title: "Almost — spelling slip",
      body,
      points,
      drillSuggestion: c.kind === "vocab" ? vocabDrill(c.label) : conceptDrill(c),
      source: "rule-generated",
    };
  }),

  rule: makeTemplate("rule", (c) => {
    const v = verbFor(c);
    const body = `${v} ${c.wrong}, but ${c.ruleText ? `${c.ruleText} ` : ""}The answer is ${c.expected}.`;
    const points: ExplanationPoint[] = c.ruleText ? [mkPoint(c.ruleText, c.expected)] : [];
    return { title: "The rule, again", body, points, drillSuggestion: conceptDrill(c), source: "rule-generated" };
  }),

  unknown: makeTemplate("unknown", (c) => ({
    title: "Not quite",
    body: `The correct answer is ${c.expected}.`,
    points: [],
    source: "fallback",
  })),
};

// ── Public entry point (§6) ─────────────────────────────────────

/**
 * Produce a rule-generated explanation for a wrong answer, or null when there
 * is nothing specific to say (correct answers, missing wrong detail,
 * unclassifiable mistakes the canned explanation already covers, and
 * matching/flashcard/reading-passage in MVP — §4.3 matrix). Null means the
 * screen preserves today's behavior exactly (D3).
 */
export function getExplanation(req: ExplanationRequest): ExplanationResult | null {
  const { detail, exercise, lesson } = req;
  // §5.1 baseline.
  if (detail.correct) return null;
  // §4.3 surface matrix: MC + fill only in Phase A (no per-answer detail elsewhere).
  if (exercise.type !== "multiple-choice" && exercise.type !== "fill-in-blank") return null;
  const wrong = detail.wrong ?? "";
  const expected = detail.expected ?? deriveExpected(exercise);
  if (wrong === "" || normalizeAnswer(wrong) === normalizeAnswer(expected)) return null;
  const allLessons = req.allLessons && req.allLessons.length > 0 ? req.allLessons : [lesson];
  const vocabIndex = buildVocabularyIndex(allLessons);
  const ex = toExercise(exercise);
  const { primary } = deriveConceptIds(lesson, ex);
  const mistake = classifyMistake({ conceptId: primary, exercise: ex, wrong, expected, vocabIndex });
  if (!mistake) return null;
  // Master rule: unknown + canned explanation → existing UI already covers it (D4).
  if (mistake === "unknown" && exercise.explanation) return null;
  const ctx = resolveContext(req, mistake);
  const result = EXPLANATION_TEMPLATES[mistake].build(ctx);
  if (result.source === "rule-generated") {
    result.relatedConcept = {
      conceptId: ctx.kind === "vocab" ? `concept:${ctx.lessonId}` : `lesson:${ctx.lessonId}`,
      label: ctx.lessonTitle,
      lessonId: ctx.lessonId,
    };
  }
  return result;
}
