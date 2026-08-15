import type { MultipleChoiceExercise } from "./latinLessons";
export interface PlacementQuestion extends MultipleChoiceExercise { level:number }
const q=(level:number,n:number,prompt:string,options:string[],correctIndex:number,explanation?:string):PlacementQuestion=>({id:`p${level}-${n}`,level,type:"multiple-choice",prompt,options,correctIndex,explanation});
// Placement test — Latin (owner direction 2026-08-14 placement rework).
// Exactly 28 questions: 2 per unit × 14 units. The first argument (level) now
// means UNIT number (1–14), not sub-lesson level — the engine maps unit → the
// lesson where the student starts. Each unit's 2 questions are the most
// representative items from that unit's lessons (unit membership from
// unitReviews.ts unitToLessonIds): 1 vocabulary + 1 grammar/forms where
// possible, chosen to capture the unit's core material. Reused verbatim from
// the previous 268-question level-based bank (verified content).
export const placementQuestions:PlacementQuestion[] = [
// Unit 1 — First–Fifth Declensions and the Cases (lessons 1–25)
q(1,1,"What does silva mean?",["forest","gate","sailor","fame"],0),
q(1,2,"The dative singular of servus is…",["servō","servum","servī","servōrum"],0),
// Unit 2 — Adjectives: 2-1-2 and Third Declension (lessons 26–33)
q(2,1,"fortis means…",["brave, strong","heavy","short","easy"],0),
q(2,2,"Adjectives agree with nouns in gender, number, and…",["case","tense","person","voice"],0),
// Unit 3 — The Four Conjugations and Sum (lessons 34–52)
q(3,1,"The Latin word for 'I' is…",["ego","tū","is","nōs"],0),
q(3,2,"The imperfect tense sign is…",["-bi-","-bā-","-bō-","-nt"],1),
// Unit 4 — The Perfect Active System (lessons 53–58)
q(4,1,"The perfect active endings are…",["-ī, -istī, -it, -imus, -istis, -ērunt","-ō, -s, -t, -mus, -tis, -nt","-bō, -bis, -bit, -bimus, -bitis, -bunt","-am, -ēs, -et, -ēmus, -ētis, -ent"],0),
q(4,2,"cīvitās means…",["state, citizenship","battle","war","city"],0),
// Unit 5 — The Passive Voice (lessons 59–70)
q(5,1,"A personal agent in a passive sentence is expressed by…",["ā/ab + ablative","a bare ablative","cum + ablative","the accusative"],0),
q(5,2,"tēlīs means…",["by weapons","by a word","with friends","without weapons"],0),
// Unit 6 — The Subjunctive: Purpose Clauses and Sequence of Tenses (lessons 71–81)
q(6,1,"A purpose clause is introduced by ___ + subjunctive.",["ut","quod","et","sed"],0),
q(6,2,"exspectō means…",["I wait for, expect","I storm","I see","I come"],0),
// Unit 7 — Interrogatives and Indirect Questions (lessons 82–88)
q(7,1,"Which adverb asks 'to where?'",["quō","ubi","unde","cūr"],0),
q(7,2,"An indirect question takes its verb in the…",["subjunctive","indicative","infinitive","imperative"],0),
// Unit 8 — Vocative, Imperative, Reflexives, and Subjunctive Passive (lessons 89–96)
q(8,1,"Laudēmus means…",["Let us praise","Praise!","He may praise","They praise"],0),
q(8,2,"rēs pūblica means…",["republic, state","public thing","a meeting","the people's wealth"],0),
// Unit 9 — Participles, Demonstratives, and Ablative of Separation (lessons 97–103)
q(9,1,"The genitive singular of hic (all genders) is…",["huius","huic","hōrum","hunc"],0),
q(9,2,"summus mōns means…",["the top of the mountain","the highest mountain","a high mountain","the greatest mountains"],0),
// Unit 10 — Possum, Infinitives, Numerals, and the Nine -īus Adjectives (lessons 104–109)
q(10,1,"possum, posse, potuī means…",["be able, can","be absent, away","be well, be strong","begin"],0),
q(10,2,"Errare est hūmānum means…",["To err is human","Error is human nature","To err is harmful","Human beings always err"],0),
// Unit 11 — -iō Verbs, Time Rules, and Dative Verbs (lessons 110–118)
q(11,1,"noceō takes the…",["dative","accusative","genitive","ablative"],0),
q(11,2,"interficiō means…",["I kill","I receive, accept","I finish, exhaust","I take"],0),
// Unit 12 — Indirect Statement: The Accusative with the Infinitive (lessons 119–122)
q(12,1,"The perfect active infinitive of laudō is…",["laudāvisse","laudāre","laudātūrus esse","laudātus esse"],0),
q(12,2,"Caesar dīcit sē pugnāre means…",["Caesar says that he is fighting","Caesar can fight","Caesar orders him to fight","Caesar is fighting"],0),
// Unit 13 — Comparison of Adjectives and Deponent Verbs (lessons 123–130)
q(13,1,"Caesar est altior eō means…",["Caesar is taller than he","Caesar is tall","He is taller than Caesar","Caesar is the tallest"],0),
q(13,2,"conor, conārī means…",["try, attempt","be tried","fear","follow"],0),
// Unit 14 — Eō and Mastery Review No. 3 (lessons 131–134)
q(14,1,"The present of eō: eō, īs, it, īmus, ītis, ___",["eunt","eant","ībant","erunt"],0),
q(14,2,"Rēx eōs in Italiam dūcī iussit means…",["The king ordered them to be led into Italy","The king led them into Italy","They ordered the king to be led into Italy","The king ordered them to lead into Italy"],0),
];
export default placementQuestions;
