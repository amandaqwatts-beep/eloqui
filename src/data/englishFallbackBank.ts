// Eloqui — English Fallback Copy Bank (Phase C, content department)
// Data-only file: 158 authored, data-grounded fallback items (93 fill + 65 MC)
// for English lessons 2001–2010, consumed by the AI Practice fallback generator
// (src/engine/fallbackGenerator.ts). This file merges independently — the engine
// wiring PR (wire-in notes W1–W7) imports it; per decision O6 it ships as its own
// PR, separate from Phase B (O6: separate PR — folding into Phase B no longer
// possible).
//
// Source of truth: research/english-fallback-copy-bank.md (content deliverable
// d2bd5b67, 2026-08-11), lead-ratified decisions O1–O6. Authoring rules from the
// spec's quality section: every item is grounded in src/data/englishLessons.ts —
// the tested word, its meaning, and every option/answer word appear in that
// lesson's data or the marked cross-lesson pools (R2). Explanations quote the
// data's own glosses and rules (R6). Fill answers are lowercase single words with
// no apostrophes or hyphens (R5). Items that reuse the data's own vetted stems
// are flagged "(mirrors l…)" (R9). Confused-pair items always include the
// confused twin as an option, with the other options from the same lesson (R7).
// Mirrored data-exercise stems are allowed per O2.
//
// Export shape (wire-in note W7): LessonBank { mc, fill } keyed by lesson id
// (2001–2010). mc items: {prompt, options, correctIndex, explanation?};
// fill items: {prompt, answer, acceptableAnswers?, explanation?}. This is the
// subset of GeneratedExercise (fallbackGenerator.ts) the client already renders
// for multiple-choice and fill-in-blank.
//
// NOT in this file (data-driven, generated at runtime by the engine wiring PR,
// per W7 "authored items only"):
//  - vocab MC in both directions + the A2/A3 book-switch prompts (W1; O1 chose
//    "Which word means…" for 2003–2010 and "Which formal word means…" for
//    2001–2002);
//  - register twin/partner fills for 2001–2002 (W2, from referenceTable rows);
//  - root-meaning fills and word→root MC for 2003–2005 (W3, from "Roots of…"
//    tables; ROOT_MEANING_ACCEPTABLE_ANSWERS below is the optional H4 map);
//  - vocab-sourced matching with the per-book prompts of §3.1 (W5 rotation).
// Table-sourced matching (register twins start↔commence, roots bene-↔well good,
// transitions furthermore↔adds a point) is deferred to Phase D per O3, pending
// the MatchingPairs pronunciation fallback (W6):
// // TODO Phase D — table-sourced matching pairs after the MatchingPairs
// // pronunciation fallback is made language-aware (research spec §3.10, W6, O3).

export interface BankMcItem {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface BankFillItem {
  prompt: string;
  answer: string;
  acceptableAnswers?: string[];
  explanation?: string;
}

/** One lesson's authored bank: multiple-choice and fill-in-blank items. */
export interface LessonBank {
  mc: BankMcItem[];
  fill: BankFillItem[];
}

const bmc=(prompt:string,options:string[],correctIndex:number,explanation?:string):BankMcItem=>({prompt,options,correctIndex,explanation});
const bfill=(prompt:string,answer:string,acceptableAnswers?:string[],explanation?:string):BankFillItem=>({prompt,answer,acceptableAnswers,explanation});

// H4 (optional data for the engine): accepted synonyms for the data-driven
// root-meaning fills (buildEnglishRootFill, W3). Keys match the "Root" column
// cells of the "Roots of…" referenceTables in englishLessons.ts (the runtime
// source); the builder's answer is the first word of the Meaning column, and
// this map adds the accepted alternatives from research spec §3.4–3.6. The
// wiring PR may hardcode this map instead — it is exported here as
// content-owned data.
export const ROOT_MEANING_ACCEPTABLE_ANSWERS: Record<string, string[]> = {
  "bene-": ["well", "good"],
  "mal-": ["bad", "evil"],
  "dict-": ["say", "speak"],
  "log": ["word", "study", "reason"],
  "phon": ["sound", "voice"],
  "tele": ["far", "distant"],
};

const englishFallbackBank: Record<number, LessonBank> = {
// ── BOOK 1 · LESSON 1.1 — What Is Formal Register? ────────────── 16 items (10 fill + 6 mc)
2001:{
fill:[
  bfill("We need to ___ the project.","commence",undefined,"commence is the formal twin of start."),
  bfill("The meeting will ___ at noon.","commence",undefined,"commence = start; to begin."), // mirrors l2001-q5
  bfill("The contract will ___ in June.","terminate",undefined,"terminate = end; to bring to a close."),
  bfill("Please ___ permission before entering the lab.","obtain",undefined,"obtain = get; to acquire."),
  bfill("The school plans to ___ new equipment.","purchase",undefined,"purchase = buy."),
  bfill("Please ___ more information from the office.","request",undefined,"request = ask (for)."),
  bfill("The trip will take ___ two hours.","approximately",undefined,"approximately = about; roughly."),
  bfill("The position will ___ two years of experience.","require",undefined,"require = need; to be necessary."),
  bfill("Staff will ___ you with the forms.","assist",undefined,"assist = help; to give aid."),
  bfill("The study aims to ___ a connection between the two variables.","demonstrate",undefined,"demonstrate = show; to make evident.")],
mc:[
  bmc("Which word belongs to formal register?",["commence","start","get","buy"],0,"commence is the formal twin of start."), // mirrors l2001-q1
  bmc("Which word belongs to formal register?",["terminate","end","ask","help"],0,"terminate is the formal twin of end."),
  bmc("Which word belongs to formal register?",["request","ask","start","end"],0,"request is the formal twin of ask."),
  bmc("Which word belongs to formal register?",["approximately","about","need","show"],0,"approximately is the formal twin of about."),
  bmc("Which sentence uses formal register?",["We need to commence the project.","We need to start the project.","We need to get the project going.","We'll show them what we did."],0,"commence is the formal choice for academic/professional writing."),
  bmc("Formal register is expected in…",["an academic essay","a text message to a friend","a note on the fridge","a group chat"],0,"Academic writing expects formal register.")]}, // mirrors l2001-q9
// ── BOOK 1 · LESSON 1.2 — Choosing the Right Word: Audience and Purpose ── 16 items (8 fill + 8 mc)
2002:{
fill:[
  bfill("Please ___ the committee of your decision.","inform",undefined,"inform = tell; give information to — the choice for a committee."),
  bfill("She will ___ the award at noon.","receive",undefined,"receive = get; be given."),
  bfill("The report describes a ___ change in enrollment.","substantial",undefined,"substantial = big; large in size or importance."),
  bfill("Regular review is ___ for long-term retention.","beneficial",undefined,"beneficial = good; producing good results."),
  bfill("We will ___ the data before drawing conclusions.","examine",undefined,"examine = look at closely; study — the lab-report verb."),
  bfill("The factory aims to ___ 500 units per day.","produce",undefined,"produce = make; bring about."),
  bfill("We should not ___ the results are reliable without proof.","assume",undefined,"assume = think; take as true."),
  bfill("The results are clear; ___, the sample was small.","however",undefined,"however = but; nevertheless — the formal connector.")],
mc:[
  bmc("Which audience expects formal register?",["your teacher","your best friend","your sibling","your roommate"],0,"A teacher expects formal words — inform, substantial, beneficial."), // mirrors l2002-q1
  bmc("Which sentence suits a formal report?",["The data produced clear results.","We got clear results.","The stuff worked out.","It was fine."],0,"A report's purpose is precise evidence — produce, not get."), // mirrors l2002-q5
  bmc("Which sentence suits a lab report?",["We examined the data and produced a chart.","We looked at the data and made a chart.","We got the results and made a chart.","We think the data is fine."],0,"examine and produce are the register-appropriate verbs for presenting evidence."),
  bmc("Which sentence suits a job application?",["I will inform the committee of the results.","I'll tell the committee about the results.","The committee will get the results from me.","We made a chart of the results."],0,"A job application calls for formal register — inform, not tell."),
  bmc("In formal writing, 'but' is often replaced by…",["however","so","because","also"],0,"however is the formal connector where but is conversational."), // mirrors l2002-q6
  bmc("The formal twin of 'big' is…",["substantial","enormous","giant","huge"],0,"substantial is the formal, measured word; the others stay informal."), // mirrors l2002-q3
  bmc("Choosing the right register depends mainly on…",["audience and purpose","vocabulary size","sentence length","paragraph count"],0,"Audience and purpose together set the register."), // mirrors l2002-q9
  bmc("In a lab report, you would most likely write…",["We examined the data.","We looked at the data.","We checked stuff.","We saw things."],0,"A report's purpose is precise evidence — examine is the register-appropriate verb.")]}, // mirrors comprehensionCheck q3
// ── BOOK 2 · LESSON 2.1 — Latin Roots I: bene-, mal-, dict- ─────── 2 items (2 fill)
2003:{
fill:[
  bfill("contra + dict = to speak ___: ___","against",undefined,"contradict = contra- (against) + dict (say) = say the opposite."), // mirrors l2003-q7
  bfill("pre- + dict = to say ___: ___","before",undefined,"predict = pre- (before) + dict (say) = say what will happen before it does.")],
mc:[]},
// ── BOOK 2 · LESSON 2.2 — Latin Roots II: scrib-/script-, mit-/miss-, duc- ── 3 items (3 fill)
2004:{
fill:[
  bfill("transmit = send ___","across",undefined,"transmit = trans- (across) + mittere (send)."), // mirrors l2004-q4
  bfill("produce = lead ___","forth",["forth","out"],"produce = pro- (forth) + ducere (lead)."), // mirrors l2004-q7
  bfill("A document written by hand is a ___: ___","manuscript",undefined,"manuscript = manu- (hand) + script (write).")],
mc:[]},
// ── BOOK 2 · LESSON 2.3 — Greek Roots: graph-, log-, chron-, phon-, tele- ── 4 items (4 fill)
2005:{
fill:[
  bfill("The order of events in time is the ___: ___","chronology",undefined,"chronology = chron- (time) + -logy."), // mirrors l2005-q7
  bfill("A written account of a life is a ___: ___","biography",undefined,"biography = bio- (life) + graph (write)."),
  bfill("The study of life is ___: ___","biology",undefined,"biology = bio- (life) + logy (the study of)."),
  bfill("A device for sound over distance is a ___: ___","telephone",undefined,"telephone = tele- (far) + phon- (sound).")],
mc:[]},
// ── BOOK 3 · LESSON 3.1 — The Academic Word List (AWL) ──────────── 26 items (26 fill)
2006:{
fill:[
  bfill("We will ___ the survey results before writing the report.","analyze",undefined,"analyze = study closely; break into parts."),
  bfill("The data ___ a clear trend.","indicates",["indicates","indicate"],"indicates = points to; shows."), // mirrors l2006-q4
  bfill("The committee will ___ each proposal before funding it.","evaluate",undefined,"evaluate = judge the value of."),
  bfill("Please ___ the term 'register' in your essay.","define",undefined,"define = state the meaning of."),
  bfill("Accidents can ___ without any warning.","occur",undefined,"occur = happen."),
  bfill("Students must ___ within 24 hours.","respond",undefined,"respond = answer; react."),
  bfill("The results ___ from school to school.","vary",undefined,"vary = differ; change."),
  bfill("Keep your answer ___ to the question.","relevant",undefined,"relevant = connected to the matter at hand."),
  bfill("Please give a ___ example of what you mean.","specific",undefined,"specific = particular; exact."),
  bfill("The difference between the two groups was ___.","significant",undefined,"significant = important; meaningful."),
  bfill("The pattern was ___ in every trial.","evident",undefined,"evident = clear; obvious."),
  bfill("The study aims to ___ a link between sleep and memory.","establish",undefined,"establish = set up; prove."),
  bfill("It is hard to ___ the results of that experiment.","interpret",undefined,"interpret = explain the meaning of."),
  bfill("We will ___ the damage after the storm.","assess",undefined,"assess = judge the quality of."),
  bfill("The study used a reliable ___ for collecting data.","method",undefined,"method = a way of doing something."),
  bfill("Each ___ contributed to the final result.","factor",undefined,"factor = one of the things that contribute to a result."),
  bfill("The theory provides a ___ for understanding the evidence.","framework",undefined,"framework = a basic structure or set of ideas."),
  bfill("Follow the same ___ in every experiment.","process",undefined,"process = a series of steps."),
  bfill("The ___ behind the rule is fairness.","principle",undefined,"principle = a fundamental rule or truth."),
  bfill("The ___ of the essay was clear.","structure",undefined,"structure = the way parts are arranged."),
  bfill("A ___ is a tested explanation of the evidence.","theory",undefined,"theory = a tested explanation."),
  bfill("Her ___ to the problem was practical and direct.","approach",undefined,"approach = a way of dealing with something."),
  bfill("Read the sentence in ___ before judging the word.","context",undefined,"context = the surrounding words or situation."),
  bfill("The central ___ of the chapter is difficult to grasp.","concept",undefined,"concept = an idea or general notion."),
  bfill("The job will ___ a college degree.","require",undefined,"require = need; demand."),
  bfill("Her ___ into the history of the word took months.","research",undefined,"research = systematic study.")],
mc:[]},
// ── BOOK 3 · LESSON 3.2 — Words That Power Strong Writing (SAT/GRE tier) ── 20 items (20 fill)
2007:{
fill:[
  bfill("She kept ___ notes on every detail of the experiment.","meticulous",undefined,"meticulous = extremely careful about details."),
  bfill("The instructions were ___ and left the students confused.","ambiguous",undefined,"ambiguous = having more than one possible meaning."),
  bfill("The essay was clear and ___ from start to finish.","coherent",undefined,"coherent = logically connected; clear."),
  bfill("The plan is ___ and could work within our budget.","feasible",undefined,"feasible = possible to do."),
  bfill("We took a ___ approach: if it works, we use it.","pragmatic",undefined,"pragmatic = practical; concerned with results."),
  bfill("Smoking is ___ to your health.","detrimental",undefined,"detrimental = harmful."),
  bfill("It is ___ that you attend the training.","imperative",undefined,"imperative = absolutely necessary."),
  bfill("The program produced ___ results you could see and measure.","tangible",undefined,"tangible = able to be touched; concrete."),
  bfill("The discovery had a ___ impact on the field.","profound",undefined,"profound = deep; far-reaching."),
  bfill("This belief is ___ among college students.","prevalent",undefined,"prevalent = widespread; common."),
  bfill("Researchers must ___ their findings before publishing.","verify",undefined,"verify = check that something is true."),
  bfill("Young writers often ___ their favorite authors.","emulate",undefined,"emulate = imitate in order to equal or surpass."),
  bfill("She is an ___ speaker.","articulate",undefined,"articulate = able to express ideas clearly."),
  bfill("The report was ___ and covered every aspect of the issue.","comprehensive",undefined,"comprehensive = covering everything."),
  bfill("I ___ that the evidence is incomplete.","concede",undefined,"concede = admit that something is true."),
  bfill("I ___ that the theory is correct.","contend",undefined,"contend = argue; maintain."),
  bfill("The professor posed a ___ question: 'Suppose gravity did not exist.'","hypothetical",undefined,"hypothetical = assumed for the sake of argument."),
  bfill("His speech was ___ and persuaded the whole room.","eloquent",undefined,"eloquent = fluent and persuasive in speech or writing."),
  bfill("New evidence will ___ the witness's account.","corroborate",undefined,"corroborate = support with evidence."),
  bfill("The donation made a ___ difference to the program.","substantial",undefined,"substantial = large; considerable (review from 2002).")],
mc:[]},
// ── BOOK 4 · LESSON 4.1 — Commonly Confused Words I: Grammar Pairs ── 27 items (8 fill + 19 mc)
2008:{
fill:[
  bfill("The new policy will ___ everyone. (verb, to influence)","affect",undefined,"affect = verb 'to influence'; effect = noun 'a result'."), // mirrors l2008-q2
  bfill("The ___ of the policy was immediate. (noun, a result)","effect",undefined,"effect = noun 'a result'; affect = verb 'to influence'."), // mirrors l2008-q3
  bfill("She is taller ___ her brother. (comparison)","than",undefined,"than marks comparison."), // mirrors l2008-q6
  bfill("The recipe calls for a small ___ of salt. (uncountable quantity)","amount",undefined,"salt is uncountable: amount."), // mirrors l2008-q8
  bfill("There were ___ students this year. (countable)","fewer",undefined,"students are countable: fewer."),
  bfill("First we studied; ___ we took the test. (time)","then",undefined,"then marks time; than marks comparison."),
  bfill("The dog wagged ___ tail. (possessive)","its",undefined,"possessive of it is its — no apostrophe."),
  bfill("The prize was divided ___ the three winners. (more than two)","among",undefined,"among for more than two; between for two.")],
mc:[
  bmc("The weather will ___ tomorrow's outdoor event.",["affect","effect","fewer","less"],0,"affect = verb 'to influence'; effect = noun 'a result' — the verb slot takes affect."),
  bmc("The new policy had an immediate ___ on enrollment.",["effect","affect","among","number"],0,"effect = noun 'a result'; affect = verb 'to influence' — the noun slot takes effect."),
  bmc("There were ___ students in class this term.",["fewer","less","amount","number"],0,"students are countable: fewer."),
  bmc("We have ___ time than we expected.",["less","fewer","then","than"],0,"time is uncountable: less."),
  bmc("___ called the office this morning?",["Who","Whom","Its","Their"],0,"who is the subject pronoun — 'he called'; whom is the object twin."),
  bmc("To ___ should I address the letter?",["Whom","Who","Their","There"],0,"the object of a preposition takes whom in formal writing."),
  bmc("The dog wagged ___ tail.",["its","it's","their","there"],0,"possessive of it is its — no apostrophe."), // mirrors l2008-q4
  bmc("___ raining outside.",["It's","Its","Their","They're"],0,"it's = it is; its is the possessive."),
  bmc("___ books are on the shelf.",["Their","There","They're","Its"],0,"their = belonging to them."),
  bmc("The keys are over ___.",["there","their","they're","it's"],0,"there = in that place."),
  bmc("___ ready to begin.",["They're","Their","There","Its"],0,"they're = they are."),
  bmc("The secret stays ___ you and me.",["between","among","less","fewer"],0,"between for two — you and me."),
  bmc("The prize was divided ___ the three winners.",["among","between","then","than"],0,"among for more than two."),
  bmc("A large ___ of water was wasted.",["amount","number","less","fewer"],0,"water is uncountable: amount."),
  bmc("The ___ of books in the library keeps growing.",["number","amount","between","than"],0,"books are countable: number."),
  bmc("First we studied; ___ we took the test.",["then","than","their","there"],0,"then marks time; than marks comparison."),
  bmc("She is taller ___ her brother.",["than","then","amount","among"],0,"than marks comparison."),
  bmc("Which sentence follows the formal rule?",["To whom did you speak?","To who did you speak?","Whom spoke to you?","Who did you speak to?"],0,"the object of a preposition takes whom in formal writing."), // mirrors l2008-q7
  bmc("Which is correct in formal writing?",["fewer errors","less errors","fewer time","lesser errors"],0,"errors are countable: fewer errors.")]}, // mirrors l2008-q1
// ── BOOK 4 · LESSON 4.2 — Commonly Confused Words II: Precision Pairs ── 24 items (6 fill + 18 mc)
2009:{
fill:[
  bfill("From the evidence, the jury ___ that he was innocent.","inferred",undefined,"infer = conclude from evidence — the listener does it."), // mirrors l2009-q2
  bfill("principle means: a fundamental ___","rule",["rule","truth"],"principle = a fundamental rule or truth."), // mirrors l2009-q5
  bfill("The storm is ___: it will arrive within the hour.","imminent",undefined,"imminent = about to happen."), // mirrors l2009-q7
  bfill("The whole ___ the parts.","comprises",undefined,"the whole comprises the parts; the parts compose the whole."), // mirrors comprehensionCheck q3
  bfill("continuous means: without ___","interruption",undefined,"continuous = without interruption."),
  bfill("The chapter that ___ this one comes first.","precedes",undefined,"precede = come before.")],
mc:[
  bmc("Her tone ___ doubt.",["implied","inferred","preceded","proceeded"],0,"the speaker/writer implies; the listener/reader infers."),
  bmc("From his silence I ___ that he disagreed.",["inferred","implied","elicited","assumed"],0,"the listener infers — I concluded from the evidence."),
  bmc("The committee ___ nine members.",["comprises","composes","presumes","proceeds"],0,"the whole comprises the parts."),
  bmc("Nine members ___ the committee.",["compose","comprise","imply","infer"],0,"the parts compose the whole."),
  bmc("I ___ it will rain, though I have no evidence.",["assume","presume","infer","imply"],0,"assume = take for granted without proof."),
  bmc("I ___ you have read the chapter, since you mentioned it.",["presume","assume","elicit","infer"],0,"presume = believe on some evidence or anticipation."),
  bmc("The judge was ___ — impartial, not bored.",["disinterested","uninterested","continuous","continual"],0,"disinterested = impartial."),
  bmc("The audience was ___ and began to leave.",["uninterested","disinterested","eminent","imminent"],0,"uninterested = not interested."),
  bmc("___ rain fell for three days without stopping.",["Continuous","Continual","Elicit","Illicit"],0,"continuous = without interruption."),
  bmc("The meeting was interrupted by ___ phone calls.",["continual","continuous","disinterested","eminent"],0,"continual = recurring frequently, with pauses."),
  bmc("The ___ reason for the change was cost.",["principal","principle","eminent","imminent"],0,"principal = main."),
  bmc("He resigned as a matter of ___.",["principle","principal","precede","proceed"],0,"principle = a fundamental rule or truth."),
  bmc("The teacher tried to ___ a response from the class.",["elicit","illicit","infer","imply"],0,"elicit = draw out (a response)."),
  bmc("The ___ sale of tickets was stopped.",["illicit","elicit","eminent","principal"],0,"illicit = illegal."),
  bmc("Please ___ with your presentation.",["proceed","precede","elicit","assume"],0,"proceed = go forward."),
  bmc("The introduction ___ the first chapter.",["precedes","proceeds","implies","infers"],0,"precede = come before."),
  bmc("An ___ scholar visited the university.",["eminent","imminent","illicit","continual"],0,"eminent = distinguished."),
  bmc("The storm is ___; it will arrive within the hour.",["imminent","eminent","illicit","principal"],0,"imminent = about to happen.")]}, // mirrors l2009-q7 stem
// ── BOOK 4 · LESSON 4.3 — Academic Writing: Claims, Transitions, Hedging ── 20 items (6 fill + 14 mc)
2010:{
fill:[
  bfill("The theory is elegant; ___, the evidence is mixed. (contrast)","however",undefined,"however introduces a contrast."), // mirrors l2010-q2
  bfill("The sample was small; ___, the conclusions are tentative. (result)","consequently",["consequently","therefore"],"consequently shows a result."), // mirrors l2010-q4
  bfill("The main claim of an essay is the ___: ___","thesis",undefined,"thesis = the main claim of an essay."), // mirrors l2010-q7
  bfill("The data ___ a trend, but the sample was small. (hedged)","suggests",undefined,"suggests = indicates a possibility (hedged)."),
  bfill("A statement to be supported is a ___: ___","claim",undefined,"claim = a statement to be supported."),
  bfill("Facts that support a claim are ___: ___","evidence",undefined,"evidence = facts that support a claim.")],
mc:[
  bmc("Which is a strong thesis?",["This essay argues that Hamlet's soliloquies show a mind learning to act.","This essay is about Hamlet.","Shakespeare wrote Hamlet.","Hamlet is a famous play."],0,"A strong thesis is specific and arguable — not a topic or a fact."), // mirrors l2010-q1
  bmc("Which is a strong thesis?",["This essay argues that formal register improves students' chances in job applications.","This essay is about formal register.","Formal register is a topic.","Many students write essays."],0,"The first names a claim AND a reason it is worth arguing."),
  bmc("Which is a strong thesis?",["This essay argues that Latin roots unlock academic vocabulary.","This essay is about Latin roots.","Latin roots are interesting.","English has many roots."],0,"A strong thesis is specific and arguable — not a topic or a fact."),
  bmc("Which transition adds a supporting point?",["furthermore","however","consequently","nevertheless"],0,"furthermore adds a supporting point."), // mirrors l2010-q3
  bmc("Which transition introduces a contrast?",["however","furthermore","consequently","moreover"],0,"however introduces a contrast."), // mirrors comprehensionCheck q2
  bmc("Which transition shows a result?",["consequently","furthermore","however","nevertheless"],0,"consequently shows a result."),
  bmc("Which transition concedes and continues?",["nevertheless","furthermore","consequently","moreover"],0,"nevertheless introduces a contrast despite what came before."),
  bmc("Which word is a synonym of 'moreover'?",["furthermore","however","therefore","suggests"],0,"the lesson glosses moreover as 'adds a supporting point (synonym)'."),
  bmc("With weak evidence, a careful writer says the data…",["suggests","proves","demonstrates","concludes"],0,"suggests = indicates a possibility (hedged) — weak evidence supports a hedged claim."), // mirrors l2010-q5
  bmc("With strong evidence, a careful writer may say the data…",["demonstrates","suggests","appears","indicates"],0,"strong evidence demonstrates; only conclusive evidence proves."),
  bmc("The sample was small, so the data…",["suggests","proves","demonstrates","concludes"],0,"a small sample supports a hedged claim: suggests, not proves."),
  bmc("Which word makes the strongest claim?",["proves","suggests","indicates","appears"],0,"proves = establishes beyond reasonable doubt."), // mirrors l2010-q6
  bmc("Hedging means…",["calibrating a claim to the strength of the evidence","making a claim vague on purpose","adding more transitions","removing all evidence"],0,"Hedging is honest calibration — it matches the claim to the evidence."), // mirrors l2010-q9
  bmc("The thesis is…",["the main claim of the essay","the first paragraph","a transition word","a kind of evidence"],0,"The thesis is the essay's main claim — everything else supports it.")]}, // mirrors comprehensionCheck q1
};
export default englishFallbackBank;
export { englishFallbackBank };
