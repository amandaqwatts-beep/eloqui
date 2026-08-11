import type { MultipleChoiceExercise } from "./latinLessons";
export interface PlacementQuestion extends MultipleChoiceExercise { level:number }
const q=(level:number,n:number,prompt:string,options:string[],correctIndex:number,explanation?:string):PlacementQuestion=>({id:`p${level}-${n}`,level,type:"multiple-choice",prompt,options,correctIndex,explanation});
export const placementQuestions:PlacementQuestion[] = [
// Level 1 — The Declension of Terra
q(1,1,"What does silva mean?",["forest","gate","sailor","fame"],0),
q(1,2,"The nominative plural ending of a first-declension noun is…",["-ae","-a","-am","-ās"],0),
// Level 2 — Rules for Gender
q(2,1,"nauta is unusual because it is a ___ first-declension noun.",["masculine","feminine","neuter","plural"],0),
q(2,2,"Most first-declension nouns are…",["feminine","masculine","neuter","of any gender"],0),
// Level 3 — Use of Verbs
q(3,1,"orant means…",["they pray","he prays","they see","we pray"],0),
q(3,2,"The 3rd-person plural ending is…",["-nt","-t","-mus","-s"],0),
// Level 4 — The Accusative Case
q(4,1,"laudat means…",["he/she praises","they praise","he prays","he sees"],0),
q(4,2,"The accusative singular of terra is…",["terram","terrae","terrā","terrās"],0),
// Level 5 — The Genitive Case
q(5,1,"The genitive singular of porta is…",["portae","portam","portā","portās"],0),
q(5,2,"The genitive case shows…",["possession","the subject","the direct object","motion toward"],0),
// Level 6 — The Declension of Servus
q(6,1,"servus means…",["slave","son","friend","war"],0),
q(6,2,"Second-declension masculine nouns end in -us in the nominative and in ___ in the genitive.",["-ī","-ae","-ūs","-is"],0),
// Level 7 — The Declension of Bellum
q(7,1,"bellum means…",["war","heaven","reward","danger"],0),
q(7,2,"In neuter nouns, the nominative and accusative are…",["the same","different","always plural","always -um"],0),
// Level 8 — The Indirect Object
q(8,1,"dedit means…",["he/she gave","they gave","he gives","he had"],0),
q(8,2,"The dative case is used for the…",["indirect object","subject","possession","direct object"],0),
// Level 9 — Use of Prepositions
q(9,1,"cum takes the…",["ablative","accusative","genitive","dative"],0),
q(9,2,"propter means…",["on account of","with","after","in"],0),
// Level 10 — The Predicate Noun
q(10,1,"sumus means…",["we are","I am","they are","you are"],0),
q(10,2,"A predicate noun after est is in the…",["nominative","accusative","genitive","ablative"],0),
// Level 11 — Use of Quod
q(11,1,"quod means…",["because","therefore","but","and"],0),
q(11,2,"itaque means…",["therefore","because","however","nor"],0),
// Level 12 — Gender in the Third Declension
q(12,1,"Third-declension nouns may be…",["any gender","feminine only","neuter only","masculine only"],0),
q(12,2,"The gender of a third-declension noun must be…",["learned with the noun","guessed from -a","always feminine","always masculine"],0),
// Level 13 — Rules for Nouns like Lex and Pars
q(13,1,"lēx is a ___ stem noun.",["consonant","i","vowel","double"],0),
q(13,2,"pars is an ___ stem noun.",["i","consonant","a","u"],0),
// Level 14 — The Declension of Lex
q(14,1,"dux means…",["leader","king","law","light"],0),
q(14,2,"The genitive singular of lēx is…",["lēgis","lēgum","lēgem","lēge"],0),
// Level 15 — Appositives
q(15,1,"An appositive is a noun that…",["renames another noun in the same case","modifies the verb","is always accusative","replaces the subject"],0),
q(15,2,"audīvit means…",["he/she heard","he sees","he prays","he gave"],0),
// Level 16 — The Expletive 'There'
q(16,1,"mīles means…",["soldier","peace","road","people"],0),
q(16,2,"'There are towns in Gaul' is…",["In Galliā sunt oppida","In Galliam sunt oppida","Oppida in Galliam sunt","In Galliā est oppidum"],0),
// Level 17 — The Declension of Pars
q(17,1,"hostis means…",["enemy","hill","part","tribe"],0),
q(17,2,"I-stem nouns like pars have a genitive plural in…",["-ium","-um","-ōrum","-ārum"],0),
// Level 18 — Review of Nouns like Lex and Pars
q(18,1,"frāter means…",["brother","father","mother","chief"],0),
q(18,2,"occīdērunt means…",["they killed","they heard","they built","they gave"],0),
// Level 19 — The Declension of Flumen
q(19,1,"flūmen means…",["river","journey","body","name"],0),
q(19,2,"Neuter third-declension nouns have a nominative plural in…",["-a","-ēs","-ī","-um"],0),
// Level 20 — Review of the Third Declension
q(20,1,"erat means…",["was","were","is","will be"],0),
q(20,2,"mundus means…",["world","mountain","war","man"],0),
// Level 21 — The Declension of Portus
q(21,1,"portus means…",["harbor","arrival","attack","fear"],0),
q(21,2,"The fourth-declension genitive singular ends in…",["-ūs","-ī","-is","-ēī"],0),
// Level 22 — In with the Accusative
q(22,1,"in with the accusative shows…",["motion into","place where","possession","means"],0),
q(22,2,"vēnit means…",["he came","they came","he made","he placed"],0),
// Level 23 — The Fifth Declension
q(23,1,"rēs means…",["thing","faith","hope","line of battle"],0),
q(23,2,"The fifth-declension genitive singular ends in…",["-ēī / -eī","-ūs","-ī","-is"],0),
// Level 24 — Special Plural Meanings
q(24,1,"grātiae (plural) means…",["thanks","favor","troops","supplies"],0),
q(24,2,"cōpiae (plural) means…",["troops","supply","thanks","favors"],0),
// Level 25 — Review of Unit 1
q(25,1,"The dative singular of servus is…",["servō","servum","servī","servōrum"],0),
q(25,2,"Which noun is fifth declension?",["rēs","portus","lēx","bellum"],0),
// Level 26 — The Declension of Magnus
q(26,1,"'magnus, magna, ___'",["magnum","magnī","magnam","magna"],0),
q(26,2,"bonus means…",["good","bad","great","long"],0),
// Level 27 — Agreement of Adjectives
q(27,1,"Adjectives agree with nouns in gender, number, and…",["case","tense","person","voice"],0),
q(27,2,"'The great war' is…",["bellum magnum","bellum magnus","bella magna","belli magnī"],0),
// Level 28 — Predicate Adjectives
q(28,1,"angustus means…",["narrow","safe","remaining","holy"],0),
q(28,2,"'The road is narrow' is…",["Via est angusta","Viam est angustam","Via est angustus","Viae sunt angustae"],0),
// Level 29 — Use of Pro
q(29,1,"prō takes the…",["ablative","accusative","genitive","dative"],0),
q(29,2,"legiō means…",["legion","wall","grain","lack"],0),
// Level 30 — The Declension of Gravis
q(30,1,"The neuter nominative plural of gravis is…",["gravia","gravēs","gravis","gravium"],0),
q(30,2,"fortis means…",["brave, strong","heavy","short","easy"],0),
// Level 31 — Adjectives Governing Cases
q(31,1,"cupidus takes the…",["genitive","dative","ablative","accusative"],0),
q(31,2,"similis takes the…",["dative or genitive","ablative only","accusative only","nominative only"],0),
// Level 32 — The Declension of Jesus
q(32,1,"The genitive of Iēsūs is…",["Iēsū","Iēsūs","Iēsum","Iēsūī"],0),
q(32,2,"urbs means…",["city","bridge","sign","horseman"],0),
// Level 33 — Mastery Review Vocab #1
q(33,1,"Which noun is fourth declension?",["portus","rēs","lēx","flūmen"],0),
q(33,2,"'There is hope' is…",["Spēs est","Spem est","Spēī sunt","Spēs sunt"],0),
// Level 34 — The First Conjugation: Principal Parts
q(34,1,"The second principal part of laudō is…",["laudāvī","laudāre","laudātus","laudō"],1,"The second principal part is the present infinitive, laudāre."),
q(34,2,"An infinitive ending in -āre identifies the…",["second conjugation","first conjugation","third conjugation","fourth conjugation"],1,"First-conjugation infinitives end in -āre."),
// Level 35 — Present Indicative Active
q(35,1,"laudāmus means…",["they praise","I praise","we praise","you (singular) praise"],2),
q(35,2,"The 2nd-person singular present ending is…",["-at","-ō","-ant","-ās"],3),
// Level 36 — Agreement of Verbs
q(36,1,"The plural subject nautae (sailors) takes the verb…",["portat","portant","portō","portās"],1,"A plural subject takes the 3rd-person plural ending -nt."),
q(36,2,"A singular subject takes a verb ending in…",["-nt","-mus","-t","-āmus"],2,"The ending -t marks 3rd-person singular."),
// Level 37 — Imperfect Indicative Active
q(37,1,"laudābat means…",["they were praising","he/she was praising","he/she praises","he/she will praise"],1),
q(37,2,"The imperfect tense sign is…",["-bi-","-bā-","-bō-","-nt"],1),
// Level 38 — Future Indicative Active
q(38,1,"laudābō means…",["I was praising","I praise","I shall praise","they will praise"],2),
q(38,2,"Which form is future tense?",["laudat","laudābat","laudant","laudābit"],3),
// Level 39 — Questions
q(39,1,"cūr means…",["where?","who?","what?","why?"],3),
q(39,2,"'Who fights?' is…",["Ubi pugnat?","Quis pugnat?","Quid pugnat?","Cūr pugnat?"],1),
// Level 40 — The Interrogative Particle
q(40,1,"'Is he coming?' is…",["Venit?","Venitne?","Nevenit?","Venitnē?"],1),
q(40,2,"The -ne particle turns a statement into a…",["command","plural noun","yes/no question","past tense"],2),
// Level 41 — The Second Conjugation
q(41,1,"The infinitive ending -ēre identifies the…",["second conjugation","first conjugation","third conjugation","fourth conjugation"],0,"Second-conjugation infinitives end in -ēre, like monēre."),
q(41,2,"The second principal part of moneō is…",["monēre","monuī","moneō","monitus"],0,"The second principal part is the present infinitive, monēre."),
// Level 42 — Personal Pronouns
q(42,1,"The Latin word for 'I' is…",["ego","tū","is","nōs"],0,"ego is the first-person singular pronoun."),
q(42,2,"nōs means…",["we","I","you (plural)","they"],0,"nōs is the first-person plural pronoun, we."),
// Level 43 — The Third Conjugation: Principal Parts
q(43,1,"Third-conjugation infinitives end in…",["-ere (short e)","-ēre (long e)","-āre","-īre"],0,"Third-conjugation infinitives have a short -e-, like mittere."),
q(43,2,"The second principal part of dūcō is…",["dūcere","dūxī","ductus","dūcō"],0,"The second principal part is the present infinitive, dūcere."),
// Level 44 — Present Active: Third Conjugation
q(44,1,"dūcit means…",["he/she leads","they lead","we lead","I lead"],0,"The ending -it marks third-person singular present."),
q(44,2,"The 3rd-person plural present of mittō is…",["mittunt","mittit","mittimus","mittitis"],0,"The third plural uses the ending -unt: mittunt."),
// Level 45 — Imperfect Active: Third Conjugation
q(45,1,"dūcēbat means…",["he/she was leading","he/she leads","they were leading","I was leading"],0,"The ending -bat marks third-person singular imperfect."),
q(45,2,"The imperfect tense sign for third conjugation is…",["-ēbā-","-bi-","-a-/-ē-","-bō-"],0,"Third-conjugation imperfects use the linking vowel -ē- plus -bā-."),
// Level 46 — Future Active: Third Conjugation
q(46,1,"dūcet means…",["he/she will lead","he/she leads","he/she was leading","they will lead"],0,"The ending -et marks third-person singular future."),
q(46,2,"Which form is future tense?",["dūcet","dūcit","dūcēbat","dūxerat"],0,"dūcet is the third-person singular future of dūcō."),
// Level 47 — The Fourth Conjugation
q(47,1,"audit means…",["he/she hears","they hear","we hear","I hear"],0,"The ending -it marks third-person singular present."),
q(47,2,"The fourth-conjugation infinitive ends in…",["-īre","-ēre","-ere","-āre"],0,"Fourth-conjugation infinitives end in -īre, like audīre."),
// Level 48 — Sum
q(48,1,"sumus means…",["we are","I am","they are","you are"],0,"sumus is the first-person plural present of sum."),
q(48,2,"erant means…",["they were","they are","they will be","we were"],0,"erant is the third-person plural imperfect of sum."),
// Level 49 — Future Active: Third Conjugation
q(49,1,"pōnam means…",["I shall place","I place","I was placing","they will place"],0,"The first-person singular third-conjugation future ends in -am: pōnam."),
q(49,2,"The third-conjugation future tense sign is…",["-a-/-ē-","-bi-","-bā-","-u-"],0,"Third conjugation uses -a- in the first singular and -ē- elsewhere, unlike the -bi- of first and second conjugations."),
// Level 50 — The Fourth Conjugation
q(50,1,"mūniō means…",["I fortify","I hear","I come","I praise"],0,"mūniō is a fourth-conjugation verb meaning 'I fortify'."),
q(50,2,"audiēbat means…",["he/she was hearing","he/she hears","he/she will hear","they were hearing"],0,"The fourth-conjugation imperfect adds -ēbā- to the stem: audiēbat."),
// Level 51 — Sum: Present, Imperfect, and Future
q(51,1,"erāmus means…",["we were","we are","we will be","you (plural) were"],0,"erāmus is the first-person plural imperfect of sum."),
q(51,2,"erit means…",["he/she will be","he/she was","he/she is","they will be"],0,"erit is the third-person singular future of sum."),
// Level 52 — Compounds of Sum
q(52,1,"abest means…",["he/she is absent","he/she is present","we are absent","they are absent"],0,"abest (ab + est) means 'he/she is absent, away'."),
q(52,2,"longē means…",["far off","nearby","long","then"],0,"longē is an adverb meaning 'far off'."),
// Level 53 — The Perfect Active System
q(53,1,"The perfect active endings are…",["-ī, -istī, -it, -imus, -istis, -ērunt","-ō, -s, -t, -mus, -tis, -nt","-bō, -bis, -bit, -bimus, -bitis, -bunt","-am, -ēs, -et, -ēmus, -ētis, -ent"],0,"Every conjugation shares the same perfect endings: -ī, -istī, -it, -imus, -istis, -ērunt."),
q(53,2,"The perfect stem comes from the ___ principal part.",["third","first","second","fourth"],0,"Drop the final -ī of the third principal part to get the perfect stem: laudāvī → laudāv-."),
// Level 54 — The Perfect Indicative Active
q(54,1,"collocāvī means…",["I placed, stationed","I was placing","I shall place","they placed"],0,"collocāvī (perfect stem collocāv- + -ī) means 'I placed, stationed'."),
q(54,2,"atque means…",["and, also","but","because","therefore"],0,"atque is a conjunction meaning 'and, also'."),
// Level 55 — Pluperfect and Future Perfect
q(55,1,"The pluperfect is formed with the perfect stem plus…",["the imperfect of sum (-eram, -erās, -erat)","the future of sum (-erō, -eris, -erit)","the present of sum","the perfect endings (-ī, -istī, -it)"],0,"Pluperfect = perfect stem + imperfect of sum: laudāveram, 'I had praised'."),
q(55,2,"The third-person plural future perfect ending is…",["-erint","-erunt","-ērunt","-erant"],0,"The future perfect third plural is -erint (not -erunt): laudāverint."),
// Level 56 — Declension of Puer, Ager, and Vir
q(56,1,"The genitive singular of ager is…",["agrī","agerī","agrō","agrum"],0,"Ager-type nouns drop the -e- outside the nominative singular: ager, agrī."),
q(56,2,"trans takes the…",["accusative","ablative","genitive","dative"],0,"trans is used with the accusative: trans flūmen, 'across the river'."),
// Level 57 — Declension of Miser and Integer
q(57,1,"The feminine nominative singular of liber (free) is…",["libera","libra","liberī","liberum"],0,"Miser-type adjectives keep the -e- in every form: liber, libera, liberum."),
q(57,2,"cīvitās means…",["state, citizenship","battle","war","city"],0,"cīvitās is a third-declension noun meaning 'state, citizenship'."),
// Level 58 — Possessive Adjectives
q(58,1,"Possessive adjectives agree with the noun they modify in gender, number, and case — not with the…",["possessor","verb","tense","sentence"],0,"The possessive matches the thing possessed: pater meus is masculine because pater is masculine."),
q(58,2,"Which form of noster agrees with the neuter noun oppidum?",["nostrum","noster","nostra","nostrī"],0,"noster declines like magnus, so the neuter form is nostrum."),
// Level 59 — Active and Passive Voice
q(59,1,"In the passive voice, the subject…",["receives the action","performs the action","is always plural","names the instrument"],0,"In the passive voice the subject receives the action, as in laudātur, 'he is praised'."),
q(59,2,"Which form is passive?",["laudātur","laudat","laudō","laudāmus"],0,"laudātur carries the passive ending -tur; the others are active forms of laudō."),
// Level 60 — Final Personal Signs in the Passive
q(60,1,"The passive ending -mur marks…",["first-person plural","second-person singular","third-person plural","first-person singular"],0,"-mur is the passive personal ending meaning 'we are'."),
q(60,2,"The passive ending -ris marks…",["second-person singular","third-person singular","first-person plural","second-person plural"],0,"-ris is the passive personal ending meaning 'you (singular) are'."),
// Level 61 — Present System Passive of the First Conjugation
q(61,1,"laudor means…",["I am praised","I praise","he is praised","we are praised"],0,"laudor is the first-person singular present passive of laudō, 'I am praised'."),
q(61,2,"laudāris means…",["you (singular) are praised","he is praised","I am praised","they are praised"],0,"laudāris is the second-person singular present passive of laudō."),
// Level 62 — The Ablative of Agent
q(62,1,"A personal agent in a passive sentence is expressed by…",["ā/ab + ablative","a bare ablative","cum + ablative","the accusative"],0,"A person performing a passive action is marked by ā or ab with the ablative, as ā nautā."),
q(62,2,"conservō means…",["save","manage","call","confirm"],0,"conservō is a first-conjugation verb meaning 'save'."),
// Level 63 — Present System Passive of the Second Conjugation
q(63,1,"monētur means…",["he/she is warned","he/she warns","we are warned","they are warned"],0,"monētur is the third-person singular present passive of moneō, 'warn'."),
q(63,2,"neque...neque means…",["neither...nor","either...or","both...and","not only...but also"],0,"neque...neque is a correlative pair meaning 'neither...nor'."),
// Level 64 — The Ablative of Means
q(64,1,"The ablative of means uses…",["a bare ablative with no preposition","ā/ab + ablative","cum + ablative","in + ablative"],0,"Means or instrument is a bare ablative without a preposition, like tēlīs, 'by weapons'."),
q(64,2,"tēlīs means…",["by weapons","by a word","with friends","without weapons"],0,"tēlīs is the ablative plural of tēlum meaning 'by/with weapons'."),
// Level 65 — Present System Passive of the Third Conjugation
q(65,1,"mittitur means…",["he/she is sent","he/she sends","they are sent","I am sent"],0,"mittitur is the third-person singular present passive of mittō, 'send'."),
q(65,2,"sine takes the…",["ablative","accusative","genitive","dative"],0,"sine, 'without', is used with the ablative."),
// Level 66 — Ablatives of Agency and Means Compared
q(66,1,"Which phrase means 'by Caesar' (a personal agent)?",["ā Caesare","Caesare","cum Caesare","Caesarem"],0,"A personal agent is expressed by ā/ab plus the ablative: ā Caesare."),
q(66,2,"gladiō, 'by a sword', is an example of the ablative of…",["means","agent","accompaniment","place"],0,"A thing used as means takes a bare ablative with no preposition: gladiō."),
// Level 67 — Present System Passive of the Fourth Conjugation
q(67,1,"audītur means…",["he/she is heard","he/she hears","they are heard","we are heard"],0,"audītur is the third-person singular present passive of audiō, 'hear'."),
q(67,2,"mūniuntur means…",["they are fortified","they fortify","he is fortified","we are fortified"],0,"mūniuntur has the passive ending -ntur, so it means 'they are fortified'."),
// Level 68 — The Ablative of Accompaniment
q(68,1,"Accompaniment, 'with friends', is expressed by…",["cum + ablative","a bare ablative","ā/ab + ablative","cum + accusative"],0,"cum plus the ablative means 'with' in accompaniment: cum amīcīs."),
q(68,2,"cum amīcīs means…",["with friends","by friends","without friends","for friends"],0,"cum amīcīs is 'with friends', cum with the ablative plural of amīcus."),
// Level 69 — The Perfect System of the Indicative Passive
q(69,1,"The perfect passive is formed with…",["the fourth principal part plus sum","the present stem plus -tur","the perfect stem plus -eram","the second principal part alone"],0,"The perfect passive is the fourth principal part plus sum: laudātus est, 'he was praised'."),
q(69,2,"vehementer means…",["violently, greatly","afterwards","almost","therefore"],0,"vehementer is an adverb meaning 'violently, greatly'."),
// Level 70 — Mastery Review Vocab #2
q(70,1,"audīmur means…",["we are heard","we hear","they are heard","I am heard"],0,"audīmur is the first-person plural present passive, 'we are heard'."),
q(70,2,"Which phrase shows a personal agent?",["ā Caesare","gladiō","cum amīcīs","tēlīs"],0,"ā Caesare is ā/ab plus a person — the ablative of agent; the others express means or accompaniment."),
// Level 71 — The Present Subjunctive Active
q(71,1,"The present subjunctive of amō (1st sg.) is…",["amem","amō","amet","amāvī"],0,"First conjugation changes -ā- to -ē-: amem, 'I may love'."),
q(71,2,"celeriter means…",["quickly","for a long time","sharply","easily"],0,"celeriter is an adverb meaning 'quickly'."),
// Level 72 — Mood in Purpose Clauses
q(72,1,"A purpose clause is introduced by ___ + subjunctive.",["ut","quod","et","sed"],0,"ut + subjunctive expresses purpose: 'so that, in order that'."),
q(72,2,"Venit ut videat means…",["he comes to see","he comes because he sees","he sees the coming","he came to see"],0,"ut videat = so that he may see, i.e., to see."),
// Level 73 — Primary Tenses: Sequence of Tenses
q(73,1,"Which main-verb tenses are primary?",["present and future","imperfect and perfect","pluperfect only","all past tenses"],0,"Primary tenses (present, future) take the present subjunctive in purpose clauses."),
q(73,2,"exspectō means…",["I wait for, expect","I storm","I see","I come"],0,"exspectō, exspectāre means 'I wait for, expect'."),
// Level 74 — Negative Purpose Clauses
q(74,1,"Negative purpose is introduced by…",["nē","ut","quod","cum"],0,"nē ('so that...not, lest') introduces negative purpose clauses."),
q(74,2,"Fugit nē videātur means…",["he flees so that he may not be seen","he flees to be seen","he does not flee","they flee so as not to be seen"],0,"nē videātur = so that he may not be seen."),
// Level 75 — The Imperfect Subjunctive Active
q(75,1,"The imperfect subjunctive is formed from the ___ + personal endings.",["present active infinitive","perfect stem","future stem","4th principal part"],0,"Add -m, -s, -t, -mus, -tis, -nt to the present active infinitive."),
q(75,2,"The imperfect subjunctive of amō (1st sg.) is…",["amārem","amem","amābam","amāvī"],0,"amāre + -m = amārem, 'I might love'."),
// Level 76 — Secondary Tenses: Sequence of Tenses
q(76,1,"Vēnit ut vidēret means…",["he came to see","he comes to see","he will come to see","they came to see"],0,"The perfect main verb vēnit takes the imperfect subjunctive vidēret."),
q(76,2,"With a past main verb, a purpose clause uses the…",["imperfect subjunctive","present subjunctive","future indicative","perfect indicative"],0,"Past main verb → imperfect subjunctive in the purpose clause."),
// Level 77 — Adjectives Used as Nouns; Imperfect Subjunctive of sum
q(77,1,"The imperfect subjunctive of sum (1st sg.) is…",["essem","eram","sum","fuī"],0,"esse + -m = essem, 'I might be'."),
q(77,2,"bonī used as a noun means…",["the good (people)","goodness","the good thing","a good man"],0,"The masculine plural of an adjective used as a noun names a group of people."),
// Level 78 — quī, quae, quod: The Relative Pronoun
q(78,1,"quī, quae, quod means…",["who, which, that","because","so that","who?"],0,"quī, quae, quod is the relative pronoun: who, which, that."),
q(78,2,"The relative pronoun agrees with its antecedent in…",["gender and number","case only","tense","person"],0,"Gender and number come from the antecedent; case comes from the relative's own clause."),
// Level 79 — The Use of ad
q(79,1,"ad takes the…",["accusative","ablative","genitive","dative"],0,"ad governs the accusative case."),
q(79,2,"usque ad flūmen means…",["all the way to the river","in the river","from the river","to the bridge"],0,"usque (all the way) strengthens ad: all the way to the river."),
// Level 80 — Relative Clauses of Purpose
q(80,1,"Mīsit virōs quī adjuvārent means…",["he sent men to help","he sent the men who were helping","the men helped him","he helped the men"],0,"quī adjuvārent (subjunctive) = who would help, i.e., to help."),
q(80,2,"The verb of a relative clause of purpose is in the…",["subjunctive","indicative","imperative","infinitive"],0,"A relative clause of purpose uses the subjunctive."),
// Level 81 — Purpose Clauses with quō
q(81,1,"A purpose clause containing a comparative is introduced by…",["quō","ut","quod","nē"],0,"quō + comparative + subjunctive expresses purpose with a comparative."),
q(81,2,"facilius means…",["more easily","easily","easiest","harder"],0,"facilius is the comparative adverb: more easily."),
// Level 82 — Interrogative Adverbs
q(82,1,"ubi means…",["where?","why?","from where?","to where?"],0,"ubi asks about place where: 'where?'"),
q(82,2,"Which adverb asks 'to where?'",["quō","ubi","unde","cūr"],0,"quō is the adverb of destination: 'to where?' (whither)."),
// Level 83 — Interrogative Particles
q(83,1,"num expects the answer…",["no","yes","maybe","either"],0,"num introduces a question expecting 'no': 'Surely…not?'"),
q(83,2,"nōnne is a compound of…",["nōn + -ne","num + -ne","nōn + quis","ne + nōn"],0,"nōnne = nōn + -ne; it expects the answer 'yes'."),
// Level 84 — The Interrogative Pronoun
q(84,1,"quis means…",["who?","what?","which?","why?"],0,"quis is the interrogative pronoun 'who?' (nominative singular, m./f.)."),
q(84,2,"The genitive of quis is…",["cuius","cui","quem","quō"],0,"cuius means 'whose?': Cuius est? 'Whose is it?'"),
// Level 85 — The Interrogative Adjective
q(85,1,"As an interrogative adjective, quī, quae, quod means…",["which? what?","who? what?","because","where?"],0,"quī, quae, quod as an adjective means 'which? what?': Quod oppidum? 'What town?'"),
q(85,2,"In Quod oppidum?, quod is a(n)…",["interrogative adjective","relative pronoun","conjunction","adverb"],0,"Here quod modifies oppidum, so it is the interrogative adjective, not 'because'."),
// Level 86 — Perfect and Pluperfect Subjunctive Active
q(86,1,"The perfect subjunctive is built from the ___ stem.",["perfect","present","infinitive","future"],0,"Add -erim, -erīs, -erit, -erīmus, -erītis, -erint to the perfect stem: laudāverim."),
q(86,2,"The pluperfect subjunctive of laudō (1st sg.) is…",["laudāvissem","laudāverim","laudāveram","laudāvī"],0,"Perfect stem + -issem gives the pluperfect subjunctive: laudāvissem, 'I might have praised'."),
// Level 87 — Indirect Questions: Primary Sequence
q(87,1,"An indirect question takes its verb in the…",["subjunctive","indicative","infinitive","imperative"],0,"The verb of an indirect question is subjunctive: Rogat quis veniat, 'He asks who is coming.'"),
q(87,2,"In an indirect question, num means…",["whether","surely not","no","indeed"],0,"num keeps its form but changes meaning: in indirect questions it means 'whether'."),
// Level 88 — Indirect Questions: Secondary Sequence
q(88,1,"With a past main verb, an indirect question uses the ___ subjunctive.",["imperfect or pluperfect","present","perfect only","future"],0,"Secondary sequence: imperfect subjunctive for same-time action, pluperfect for earlier action."),
q(88,2,"Rogāvit quis venīret means…",["He asked who was coming","He asks who is coming","He will ask who comes","Who came? He asked"],0,"The past main verb rogāvit takes the imperfect subjunctive venīret: 'who was coming.'"),

// Level 89 — The Vocative Case
q(89,1,"The vocative singular of dominus is…",["domine","dominus","dominī","dominum"],0,"2nd-declension -us nouns form the vocative in -e: dominus → domine."),
q(89,2,"The vocative singular of fīlius is…",["fīlī","fīlius","fīlium","fīliō"],0,"Nouns in -ius drop to -ī in the vocative: fīlius → fīlī."),
// Level 90 — The Present Imperative Active
q(90,1,"The imperative singular of laudō is…",["laudā","laudat","laudāre","laudāte"],0,"The singular imperative is the present stem: laudā, 'praise!'"),
q(90,2,"The imperative plural of mittō is…",["mittite","mitte","mittēte","mittunt"],0,"Third-conjugation plurals show -i- before -te: mittite, 'send!'"),
// Level 91 — The Subjunctive in Wishes and Exhortations
q(91,1,"Laudēmus means…",["Let us praise","Praise!","He may praise","They praise"],0,"The 1st-person plural present subjunctive expresses exhortation: 'let us praise.'"),
q(91,2,"The negative hortatory subjunctive uses…",["nē + subjunctive","ut + subjunctive","nōn + imperative","num + subjunctive"],0,"Negative exhortations use nē with the subjunctive: Nē timeāmus! 'Let us not fear!'"),
// Level 92 — Suus and Suī: Direct Reflexives
q(92,1,"suus, -a, -um refers back to…",["the subject of its clause","the direct object","the speaker","the person addressed"],0,"suus means 'his/her/its/their own' and points back to the subject."),
q(92,2,"In Caesar suum fīlium laudat, eius would mean…",["his (someone else's) son","his own son","the son's Caesar","our son"],0,"eius (genitive of is) refers away from the subject: 'his (another's)'; suus is the subject's own."),
// Level 93 — Suus and Suī: Indirect Reflexives
q(93,1,"An indirect reflexive in a subordinate clause refers back to…",["the subject of the main clause","the nearest noun","the object of its own clause","the speaker"],0,"In subordinate clauses suus/sē can look back to the main-clause subject: the indirect reflexive."),
q(93,2,"rēs pūblica means…",["republic, state","public thing","a meeting","the people's wealth"],0,"rēs pūblica, reī pūblicae is the 'public thing' — the republic, the state."),
// Level 94 — The Present and Imperfect Subjunctive Passive
q(94,1,"The present subjunctive passive of amō (1st sg.) is…",["amer","amor","amārer","amātur"],0,"Swap the passive endings onto the present subjunctive active: amem → amer, 'I may be loved'."),
q(94,2,"The imperfect subjunctive passive is formed from…",["the present active infinitive + passive endings","the perfect stem + -erim","the 4th principal part + sum","the present stem + -bā-"],0,"amāre + -r = amārer, 'I might be loved' — the same rule as the imperfect subjunctive active."),
// Level 95 — The Perfect System of the Passive Subjunctive
q(95,1,"The perfect subjunctive passive is formed with…",["the 4th principal part + present subjunctive of sum","the perfect stem + -erim","the 4th principal part + eram","the infinitive + -r"],0,"laudātus sim, 'I may have been praised' — 4th principal part + sim."),
q(95,2,"The pluperfect subjunctive passive of laudō (1st sg.) is…",["laudātus essem","laudātus sim","laudātus eram","laudātus sum"],0,"4th principal part + imperfect subjunctive of sum: laudātus essem, 'I might have been praised'."),
// Level 96 — The Ablative of Cause
q(96,1,"The ablative of cause is…",["a bare ablative expressing reason","ā/ab + a person","cum + ablative","an accusative phrase"],0,"Cause is expressed by a bare ablative without a preposition: dolōre, 'from grief'."),
q(96,2,"causā with a genitive means…",["for the sake of","because of the case","by the cause","with the cause"],0,"causā (postpositive) with a genitive means 'for the sake of': rēī pūblicae causā."),
// Level 97 — The Perfect Participle Passive
q(97,1,"The perfect passive participle is the ___ principal part used as an adjective.",["4th","1st","2nd","3rd"],0,"The 4th principal part (laudātus, -a, -um) is the perfect passive participle, a 2-1-2 adjective."),
q(97,2,"The perfect passive participle of mittō is…",["missus, -a, -um","mittēns","mīsī","mittere"],0,"The 4th principal part of mittō is missus: 'sent'."),
// Level 98 — Hic, Haec, Hoc: The Declension
q(98,1,"The genitive singular of hic (all genders) is…",["huius","huic","hōrum","hunc"],0,"huius is the genitive singular of hic, haec, hoc — one form for all genders."),
q(98,2,"The dative plural of hic (all genders) is…",["hīs","hōrum","huic","hās"],0,"The dative and ablative plural of hic is hīs."),
// Level 99 — Hic, Haec, Hoc: Uses
q(99,1,"summus mōns means…",["the top of the mountain","the highest mountain","a high mountain","the greatest mountains"],0,"summus with a noun means 'the top of': summus mōns = the top of the mountain."),
q(99,2,"In Hic vir fortis est, hic is a(n)…",["adjective modifying vir","pronoun standing alone","adverb","conjunction"],0,"hic here modifies vir, so it is the demonstrative adjective."),
// Level 100 — Prepositions Ex, Ab, Dē
q(100,1,"ex/ē takes the…",["ablative","accusative","genitive","dative"],0,"ex/ē ('out of, from') governs the ablative."),
q(100,2,"'About the war' is…",["dē bellō","ex bellō","ā bellō","ad bellum"],0,"dē means 'about, concerning' with the ablative: dē bellō."),
// Level 101 — Ille and Is
q(101,1,"The genitive singular of ille (all genders) is…",["illīus","illī","illōrum","illum"],0,"ille declines like magnus except genitive illīus and dative illī."),
q(101,2,"numquam means…",["never","always","sometimes","often"],0,"numquam is the adverb 'never'."),
// Level 102 — The Ablative of Separation
q(102,1,"The ablative of separation is used with verbs and adjectives of…",["freeing, lacking, depriving","praising","motion toward","giving"],0,"līberō, prohibeō, vacuus, līber take the ablative of separation."),
q(102,2,"In Caesar mīlitēs perīculō līberāvit, perīculō is…",["the ablative of separation (from danger)","the dative","accusative","genitive"],0,"perīculō is the ablative: freed the soldiers FROM danger."),
// Level 103 — Review of Ablative Constructions
q(103,1,"Agent is expressed by…",["ā/ab + a person","a bare ablative of a thing","cum + a person","ex/ab/dē + a place"],0,"The personal agent in a passive sentence is ā/ab + ablative."),
q(103,2,"'From Rome' is…",["Rōmā","ex Rōmā","ab Rōmā","dē Rōmā"],0,"Names of towns use the bare ablative for place from which: Rōmā discēdō, 'I depart from Rome.'"),// Level 104 — Possum: Present, Imperfect, Future
q(104,1,"possum, posse, potuī means…",["be able, can","be absent, away","be well, be strong","begin"],0,"possum is a compound of pot- ('able') and sum: 'be able, can'."),
q(104,2,"The present 3rd-person plural of possum is…",["possunt","potestis","poterunt","possint"],0,"pot + sunt → possunt: the t of pot- assimilates to the following s."),
// Level 105 — Possum: Perfect System and Subjunctive
q(105,1,"The perfect 1st-person singular of possum is…",["potuī","potueram","poteram","possim"],0,"The perfect stem of possum is potu-: potuī, 'I was able'."),
q(105,2,"The present subjunctive of possum (1st sg.) is…",["possim","possem","potuerim","possum"],0,"The present subjunctive is possim, possīs, possit, possīmus, possītis, possint."),
// Level 106 — The Infinitive as Subject
q(106,1,"Errare est hūmānum means…",["To err is human","Error is human nature","To err is harmful","Human beings always err"],0,"The infinitive errāre is the subject of est — the infinitive used as a noun."),
q(106,2,"An infinitive used as a noun is ___ singular.",["neuter","masculine","feminine","always plural"],0,"The infinitive-noun is neuter singular: errāre est hūmānum, not *hūmānus."),
// Level 107 — The Infinitive as Object
q(107,1,"Possum pugnāre means…",["I can fight","I am fighting","I will fight","I fight well"],0,"possum + infinitive = 'I am able to fight' = 'I can fight'."),
q(107,2,"Oportet pugnāre means…",["It is necessary to fight","It is possible to fight","We must not fight","To fight is easy"],0,"oportet is impersonal — 'it is necessary' — and takes the infinitive."),
// Level 108 — Numerals
q(108,1,"The genitive singular of ūnus (all genders) is…",["ūnīus","ūnus","ūnī","ūnōrum"],0,"ūnus follows the -īus pattern of the nine irregular adjectives: genitive ūnīus, dative ūnī."),
q(108,2,"mīlia mīlitum means…",["thousands of soldiers","a thousand soldiers","a thousand armies","very many soldiers"],0,"mīlia is the plural noun 'thousands' and takes a genitive: thousands of soldiers."),
// Level 109 — Irregular Adjectives
q(109,1,"The nine irregular adjectives have genitive singular ___ for all genders.",["-īus","-ae","-īs","-ium"],0,"alius, alter, neuter, nūllus, ūllus, sōlus, tōtus, ūnus, uter take -īus in the genitive singular and -ī in the dative."),
q(109,2,"The genitive singular of alius is…",["alīus","aliīus","aliī","aliud"],0,"alius is irregular even within the set: genitive alīus, dative aliī, neuter aliud."),
// Level 110 — Indicative Active of -iō Verbs
q(110,1,"capiō, capere, cēpī, captus means…",["take, seize","make, do","flee","desire, wish"],0,"capiō is the model -iō verb: 'take, seize' — 3rd-conjugation infinitive capere."),
q(110,2,"The present 3rd-person plural of capiō is…",["capiunt","capient","capīunt","capunt"],0,"-iō verbs end in -iunt in the 3rd plural: capiunt (capient would be future)."),
// Level 111 — Time When
q(111,1,"Time when is expressed by the…",["ablative","accusative","genitive","dative"],0,"Time when uses the bare ablative: eō diē, 'on that day'."),
q(111,2,"annus means…",["year","day","hour","time"],0,"annus, -ī (m.) is 'year'."),
// Level 112 — Subjunctive Active of -iō Verbs
q(112,1,"The present subjunctive of capiō (1st sg.) is…",["capiam","caperem","capīrem","capiō"],0,"The present subjunctive of -iō verbs follows the 4th conjugation: capiam."),
q(112,2,"The imperfect subjunctive of capiō (1st sg.) is…",["caperem","capiam","capiēbam","capīrem"],0,"The imperfect subjunctive is the one-rule of lesson 75: capere + -m = caperem — never *capīrem."),
// Level 113 — Extent of Time and Space
q(113,1,"'For three hours' (duration) is…",["trēs hōrās","trībus hōrīs","trium hōrārum","trēs hōrae"],0,"Duration of time is accusative: trēs hōrās, 'for three hours'."),
q(113,2,"A Roman mile is…",["mīlle passūs","mīlia passuum","mīlle pedēs","passus mīlle"],0,"mīlle passūs = one thousand paces = a Roman mile."),
// Level 114 — Indicative Passive of -iō Verbs
q(114,1,"The 2nd-person singular present passive of capiō is…",["caperis","capīris","capiēris","capieris"],0,"The -iō verbs keep the 3rd-conjugation passive ending -eris: caperis, not *capīris."),
q(114,2,"interficiō means…",["I kill","I receive, accept","I finish, exhaust","I take"],0,"interficiō, interficere, interfēcī, interfectus = 'kill' (perfect stem like faciō's)."),
// Level 115 — Time Within Which
q(115,1,"Time within which is expressed by the…",["ablative","accusative","genitive","nominative"],0,"Within what time? → ablative: trībus hōrīs, 'within three hours'."),
q(115,2,"'Within three days' is…",["trībus diēbus","trēs diēs","trium diērum","trēs diēbus"],0,"Time within which uses the ablative plural: trībus diēbus."),
// Level 116 — Subjunctive Passive of -iō Verbs
q(116,1,"The present subjunctive passive of capiō (1st sg.) is…",["capiar","caperer","capior","capīrer"],0,"Present subjunctive passive = 4th-conj pattern: capiar, 'I may be taken'."),
q(116,2,"The imperfect subjunctive passive of capiō (1st sg.) is…",["caperer","capiar","caperem","capīrer"],0,"capere + -r = caperer, 'I might be taken' — never *capīrer."),
// Level 117 — Dative Verbs
q(117,1,"noceō takes the…",["dative","accusative","genitive","ablative"],0,"noceō + dative: noceō tibi = 'I harm you'."),
q(117,2,"praesum, praeesse, praefuī means…",["be in charge of, preside over","be present","be able","be absent"],0,"praesum = prae + sum, 'be in charge of' + dative."),
// Level 118 — Passive of Verbs of Calling
q(118,1,"Appellor Rōmānus means…",["I am called a Roman","I call a Roman","The Roman calls me","I am calling the Roman"],0,"Passive of a verb of calling + predicate nominative: 'I am called a Roman'."),
q(118,2,"After a passive verb of calling, the predicate stands in the…",["nominative","accusative","ablative","dative"],0,"Appellor Rōmānus — the predicate is nominative, agreeing with the subject."),

// Level 119 — The Perfect and Future Infinitives Active
q(119,1,"The perfect active infinitive of laudō is…",["laudāvisse","laudāre","laudātūrus esse","laudātus esse"],0,"Perfect active infinitive = perfect stem + isse: laudāv- + isse = laudāvisse, 'to have praised'."),
q(119,2,"The future active infinitive of mittō is…",["missūrus esse","mīsisse","mittere","missus esse"],0,"Future active infinitive = future participle + esse: missūrus esse, 'to be about to send'."),
// Level 120 — The Accusative with the Infinitive: Introduction
q(120,1,"Caesar dīcit sē pugnāre means…",["Caesar says that he is fighting","Caesar can fight","Caesar orders him to fight","Caesar is fighting"],0,"ACI: accusative subject (sē) + present infinitive (pugnāre) = 'Caesar says that he is fighting'."),
q(120,2,"In the accusative-with-infinitive, the subject of the infinitive is in the…",["accusative","nominative","genitive","dative"],0,"The ACI puts the subject of the reported idea in the accusative and the verb as an infinitive — no 'that' in Latin."),
// Level 121 — The Accusative with the Infinitive: Continued
q(121,1,"Caesar dīcit sē pugnāvisse means…",["Caesar says that he fought","Caesar says that he is fighting","Caesar says that he will fight","Caesar fought him"],0,"The perfect infinitive (pugnāvisse) marks action earlier than the main verb: 'he fought / has fought'."),
q(121,2,"Caesar dīcit sē pugnātūrum esse means…",["Caesar says that he will fight","Caesar says that he fought","Caesar says that he is fighting","Caesar will say that he fights"],0,"The future infinitive (pugnātūrum esse) marks action later than the main verb: 'he will fight'."),
// Level 122 — Passive Infinitives in Indirect Statement
q(122,1,"The present passive infinitive of laudō is…",["laudārī","laudāre","laudātus esse","laudātum īrī"],0,"Present passive infinitive (1st conj.) = stem + -ārī: laudārī, 'to be praised'."),
q(122,2,"Caesar dīcit mīlitēs laudātōs esse means…",["Caesar says that the soldiers were praised","Caesar says that the soldiers are being praised","Caesar says that the soldiers will be praised","The soldiers say that Caesar was praised"],0,"Perfect passive infinitive = PPP (laudātōs, agreeing with mīlitēs) + esse: 'were praised'."),
];
export default placementQuestions;
