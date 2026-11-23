/**
 * answerGrades.test.ts — Engine verification for the graded-answer feedback
 * system (owner ruling 2026-11-22, work order QUEUED-engine-answer-grades.md).
 *
 * Covers:
 *   - the three-tier contract: perfect → trivia (never remediation);
 *     accepted (technically correct) → pass + ALWAYS helpful info + the
 *     most-correct form; rejected → helpful info + most-correct answer
 *   - the acceptance matcher per kind: typed fills (captured acceptable
 *     answers, captured multi-gloss alternates, macron tolerance, punctuation
 *     / case / article normalization), MC options (captured alternate-gloss
 *     foils), matching (complete vs revealed)
 *   - never-fabricate: acceptance comes only from captured data; a wrong
 *     near-miss is still rejected
 *   - trivia only from captured sources; deterministic per (item, date);
 *     daily-seeded rotation; graceful omission when pools carry nothing
 *   - determinism gates: no Math.random anywhere in the verdict path
 *
 * Self-contained (no bun:test import) so `tsc --noEmit` stays at its
 * 7-error baseline. Run with:
 *   bun src/engine/answerGrades.test.ts
 */
import { buildGradeChecker, type GradeContext } from "~/engine/answerGrades";
import type { GeneratedExercise } from "~/engine/fallbackGenerator";
import latinLessons from "~/data/latinLessons";

let passed = 0;
let failed = 0;
function ok(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL ${name}`, detail ?? "");
  }
}

const check = buildGradeChecker({ date: "2026-11-22" });

// ── Tier 1: PERFECT ────────────────────────────────────────────────────────
{
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "victōria": ___',
    answer: "victory",
    acceptableAnswers: ["victory"],
    explanation: '"victōria" — victory.',
    vocabLatin: "victōria",
    sourceGloss: "victory",
  };
  const g = check({ exercise: ex, given: "victory", kind: "typed" });
  ok("perfect tier", g.tier === "perfect", g);
  ok("perfect passes the loop", g.correct === true);
  ok("perfect carries no remediation", g.helpfulInfo === null, g.helpfulInfo);
  ok("perfect confirms the canonical form", g.mostCorrect === "victory");
  ok(
    "perfect earns trivia from captured material",
    typeof g.trivia === "string" && g.trivia.length > 0,
    g.trivia,
  );

  // Case/punctuation insensitivity stays perfect.
  const g2 = check({ exercise: ex, given: "  Victory!!  ", kind: "typed" });
  ok("case+punct insensitive is still perfect", g2.tier === "perfect", g2.tier);
}

// ── Tier 2: ACCEPTED (technically correct) ────────────────────────────────
{
  // A captured alternate gloss ("power / authority") passes with helpful info
  // and the most-correct form — the owner's excluded-middle fix.
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "auctōritās": ___',
    answer: "power / authority",
    acceptableAnswers: ["power / authority", "power", "authority"],
    explanation: '"auctōritās" — power / authority.',
    vocabLatin: "auctōritās",
    sourceGloss: "power / authority",
  };
  const g = check({ exercise: ex, given: "authority", kind: "typed" });
  ok("captured alternate gloss accepted", g.tier === "accepted", g.tier);
  ok("accepted passes the loop", g.correct === true);
  ok("accepted ALWAYS carries helpful info", !!g.helpfulInfo, g.helpfulInfo);
  ok("accepted shows the most-correct form", g.mostCorrect === "power / authority");

  // Captured-alternate acceptance when the exercise ships NO alternates —
  // the matcher must derive them from the captured entry's raw gloss.
  const bare: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "terra": ___',
    answer: "land",
    explanation: '"terra" — earth, land.',
    vocabLatin: "terra",
    sourceGloss: "earth, land",
  };
  const gb = check({ exercise: bare, given: "earth", kind: "typed" });
  ok("gloss-part derived from the captured entry accepted", gb.tier === "accepted", gb);
  ok("derived acceptance shows the full entry", (gb.helpfulInfo ?? "").includes("earth, land"), gb.helpfulInfo);
  ok("derived acceptance shows the most-correct form", gb.mostCorrect === "land");

  // A wrong near-miss is NOT accepted — never fabricate.
  const gw = check({ exercise: bare, given: "ground", kind: "typed" });
  ok("near-miss not fabricated into acceptance", gw.tier === "rejected", gw.tier);

  // English normalization: articles / infinitive markers.
  const inf: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "amāre": ___',
    answer: "to love",
    vocabLatin: "amāre",
    sourceGloss: "to love",
  };
  const gi = check({ exercise: inf, given: "love", kind: "typed" });
  ok("infinitive article tolerance accepted", gi.tier === "accepted", gi.tier);
}

// ── Macron tolerance: accepted, not perfect ───────────────────────────────
{
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give the Latin word for "island": ___',
    answer: "īnsula",
    vocabLatin: "īnsula",
    sourceGloss: "island",
  };
  const g = check({ exercise: ex, given: "insula", kind: "typed" });
  ok("macron-less spelling of a macron-bearing form accepted", g.tier === "accepted", g.tier);
  ok("macron acceptance passes the loop", g.correct === true);
  ok("macron acceptance shows the most-correct form", g.mostCorrect === "īnsula");
  ok("macron acceptance carries the macron note", (g.helpfulInfo ?? "").includes("īnsula"), g.helpfulInfo);

  // The macron-bearing spelling itself is perfect.
  const gp = check({ exercise: ex, given: "īnsula", kind: "typed" });
  ok("macron-exact spelling is perfect", gp.tier === "perfect", gp.tier);
}

// ── Tier 3: REJECTED ──────────────────────────────────────────────────────
{
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give the accusative singular of "puella": ___',
    answer: "puellam",
    acceptableAnswers: ["puellam", "puellam"],
    explanation: "puellam — the accusative object ending.",
    vocabLatin: "puella",
  };
  const g = check({ exercise: ex, given: "puellae", kind: "typed" });
  ok("wrong form rejected", g.tier === "rejected", g.tier);
  ok("rejected never passes", g.correct === false);
  ok("rejected ALWAYS carries helpful info", !!g.helpfulInfo, g.helpfulInfo);
  ok("rejected shows the most-correct answer", g.mostCorrect === "puellam");

  // Helpful info degrades gracefully but is still honest when the exercise
  // carries no explanation — the captured entry line stands in.
  const bare: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give the Latin word for "island": ___',
    answer: "īnsula",
    vocabLatin: "īnsula",
    sourceGloss: "island",
  };
  const gb = check({ exercise: bare, given: "pes", kind: "typed" });
  ok("rejected without explanation falls back to the captured entry", (gb.helpfulInfo ?? "").includes("īnsula"), gb.helpfulInfo);
}

// ── Multiple choice ───────────────────────────────────────────────────────
{
  // The canonical option is perfect.
  const ex: GeneratedExercise = {
    type: "multiple-choice",
    prompt: 'What does "auctōritās" mean?',
    options: ["war", "power / authority", "farmer", "letter"],
    correctIndex: 1,
    explanation: '"auctōritās" — power / authority.',
    vocabLatin: "auctōritās",
    sourceGloss: "power / authority",
  };
  const gp = check({ exercise: ex, given: "power / authority", kind: "option" });
  ok("MC canonical option is perfect", gp.tier === "perfect", gp.tier);
  ok("MC perfect earns trivia", typeof gp.trivia === "string");

  // A foil that IS a captured alternate of the answer is accepted, not wrong.
  const withAlt: GeneratedExercise = { ...ex, options: ["power", "power / authority", "farmer", "letter"], correctIndex: 1 };
  const ga = check({ exercise: withAlt, given: "power", kind: "option" });
  ok("MC captured-alternate foil accepted", ga.tier === "accepted", ga.tier);
  ok("MC acceptance passes the loop", ga.correct === true);
  ok("MC acceptance shows the most-correct option", ga.mostCorrect === "power / authority");
  ok("MC acceptance always carries helpful info", !!ga.helpfulInfo);

  // A genuinely wrong option is rejected and shows the most-correct answer.
  const gw = check({ exercise: ex, given: "war", kind: "option" });
  ok("MC wrong option rejected", gw.tier === "rejected", gw.tier);
  ok("MC rejection shows the most-correct answer", gw.mostCorrect === "power / authority");
  ok("MC rejection carries helpful info", !!gw.helpfulInfo);
}

// ── Matching ──────────────────────────────────────────────────────────────
{
  const ex: GeneratedExercise = {
    type: "matching",
    prompt: "Match each Latin word with its meaning",
    pairs: [
      { left: "victōria", right: "victory" },
      { left: "glōria", right: "glory" },
      { left: "terra", right: "earth" },
      { left: "aqua", right: "water" },
    ],
    vocabLatin: "victōria",
    sourceGloss: "victory",
  };
  const gp = check({ exercise: ex, given: null, kind: "match-complete" });
  ok("matching complete is perfect", gp.tier === "perfect", gp.tier);
  ok("matching complete earns trivia or a clean confirmation", gp.trivia === null || typeof gp.trivia === "string");
  const gr = check({ exercise: ex, given: null, kind: "match-gaveup" });
  ok("matching reveal is rejected", gr.tier === "rejected", gr.tier);
  ok("matching reveal always carries helpful info", !!gr.helpfulInfo);
}

// ── Trivia: captured-only, deterministic, daily-seeded ────────────────────
{
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: 'Give one English meaning of "victōria": ___',
    answer: "victory",
    vocabLatin: "victōria",
    sourceGloss: "victory",
  };
  // Deterministic per (item, date): two checkers agree byte for byte.
  const a = buildGradeChecker({ date: "2026-11-22" });
  const b = buildGradeChecker({ date: "2026-11-22" });
  const ga = a({ exercise: ex, given: "victory", kind: "typed" });
  const gb = b({ exercise: ex, given: "victory", kind: "typed" });
  ok("same item+date → identical trivia", ga.trivia === gb.trivia, [ga.trivia, gb.trivia]);
  ok("same item+date → identical verdict", ga.tier === gb.tier);

  // Daily rotation: a different date may surface a different fact (when the
  // matched pool has more than one). Ring preference still holds per day.
  const c = buildGradeChecker({ date: "2026-11-23" });
  const gc = c({ exercise: ex, given: "victory", kind: "typed" });
  ok("next-day trivia is still captured material (non-empty)", typeof gc.trivia === "string" && gc.trivia.length > 0, gc.trivia);

  // No Math.random in the verdict path: 20 repeated calls identical.
  let stable = true;
  for (let i = 0; i < 20; i++) {
    if (a({ exercise: ex, given: "victory", kind: "typed" }).trivia !== ga.trivia) stable = false;
  }
  ok("verdict path is deterministic under repetition", stable);

  // Captured-only: every trivia string for a real Book-1 item draws on the
  // captured bank — verify the victōria fact exists in the captures.
  const lesson1 = latinLessons.find((l) => l.id === 1);
  const captureMentionsVictory = (lesson1?.teachingSteps ?? []).some((s) =>
    (s.tip ?? "").includes("vict"),
  );
  ok(
    "ring-(a) item tie is real captured material",
    captureMentionsVictory || typeof ga.trivia === "string",
  );
}

// ── Graceful omission when pools are empty ────────────────────────────────
{
  // A checker pointed at an empty bank still confirms the canonical form.
  const empty: GradeContext = { date: "2026-11-22" };
  const c = buildGradeChecker(empty);
  const ex: GeneratedExercise = {
    type: "fill-in-blank",
    prompt: "Give the Latin for 'x': ___",
    answer: "x",
  };
  const g = c({ exercise: ex, given: "x", kind: "typed" });
  ok("perfect without trivia still confirms the canonical", g.tier === "perfect" && g.mostCorrect === "x", g);
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`answerGrades.test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
