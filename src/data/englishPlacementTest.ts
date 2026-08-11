// Eloqui — English placement test: 20 questions, levels 1–10 (2 per level).
// Levels map to sub-lessons 2001–2010 of Unit 1 "Foundations of Formal English".
// The q() builder is a local copy of the Latin one (not exported) with a `pe` id
// template so cross-track ids can never collide (pe1-1 … pe10-2).
import type { MultipleChoiceExercise } from "./latinLessons";
export interface PlacementQuestion extends MultipleChoiceExercise { level:number }
const q=(level:number,n:number,prompt:string,options:string[],correctIndex:number,explanation?:string):PlacementQuestion=>({id:`pe${level}-${n}`,level,type:"multiple-choice",prompt,options,correctIndex,explanation});
export const englishPlacementQuestions:PlacementQuestion[] = [
// Level 1 — What Is Formal Register?
q(1,1,"Which word belongs to formal register?",["commence","start","begin","kick off"],0,"commence is the formal twin of start — it fits academic and professional writing."),
q(1,2,"approximately means…",["about; roughly","exactly","never","at least"],0,"approximately is the formal partner of 'about'."),
// Level 2 — Choosing the Right Word: Audience and Purpose
q(2,1,"The formal partner of 'tell' is…",["inform","say","speak","chat"],0,"inform is the formal twin of tell."),
q(2,2,"Choosing the right register depends mainly on…",["audience and purpose","vocabulary size","sentence length","paragraph count"],0,"Audience and purpose together set the register."),
// Level 3 — Latin Roots I: bene-, mal-, dict-
q(3,1,"bene- means…",["well, good","bad, evil","say, speak","write"],0,"bene- is the Latin root 'well, good' — benefit, benevolent, benefactor."),
q(3,2,"predict literally means…",["say before","say against","write down","send across"],0,"predict = pre- (before) + dict- (say)."),
// Level 4 — Latin Roots II: scrib-/script-, mit-/miss-, duc-
q(4,1,"scrib-/script- means…",["write","send","lead","say"],0,"scrib/script comes from Latin scrībere, 'to write'."),
q(4,2,"transmit means…",["send across","send away","lead together","write before"],0,"transmit = trans- (across) + mittere (send)."),
// Level 5 — Greek Roots: graph-, log-, chron-, phon-, tele-
q(5,1,"chron- means…",["time","far","sound","word"],0,"chron- is the Greek root for time — chronology, chronic."),
q(5,2,"telephone literally means…",["far sound","far writing","time study","word study"],0,"tele- = far, phon- = sound."),
// Level 6 — The Academic Word List (AWL)
q(6,1,"analyze means…",["study closely; break into parts","judge the value of","happen","point to"],0,"analyze = study closely, break into parts."),
q(6,2,"Which word means 'connected to the matter at hand'?",["relevant","evident","specific","significant"],0,"relevant = connected to the matter at hand."),
// Level 7 — Words That Power Strong Writing (SAT/GRE tier)
q(7,1,"corroborate means…",["support with evidence","argue against","admit","imitate"],0,"corroborate = support with evidence."),
q(7,2,"ambiguous means…",["having more than one possible meaning","completely clear","extremely long","impossible to do"],0,"ambiguous = more than one possible meaning."),
// Level 8 — Commonly Confused Words I: Grammar Pairs
q(8,1,"Which is correct in formal writing?",["fewer errors","less errors","fewer time","lesser errors"],0,"errors are countable: fewer errors."),
q(8,2,"'The weather ___ my mood' (verb, to influence)",["affects","effects","affect","effect"],0,"affect is the verb 'to influence'."),
// Level 9 — Commonly Confused Words II: Precision Pairs
q(9,1,"The speaker or writer ___; the listener or reader ___.",["implies; infers","infers; implies","precedes; proceeds","elicits; illicit"],0,"The writer implies; the reader infers."),
q(9,2,"A disinterested judge is…",["impartial","bored","not interested","illegal"],0,"disinterested = impartial; uninterested = not interested."),
// Level 10 — Academic Writing: Claims, Transitions, Hedging (capstone)
q(10,1,"Which transition introduces a contrast?",["however","furthermore","consequently","moreover"],0,"however introduces a contrast."),
q(10,2,"With a small sample, a careful writer says the data…",["suggests","proves","demonstrates","always"],0,"Small samples support hedged claims: suggests, not proves."),
];
export default englishPlacementQuestions;
