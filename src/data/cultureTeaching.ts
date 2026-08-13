// Verbum — Rēs Rōmānae culture teaching (PR1: data only)
// Pure additive data for the culture-teaching rework (research/culture-teaching-design.md).
// 20 teaching bundles, one per existing culture-question exercise (cu1-q1 … cu70-q1),
// each = 2 teaching cards + 1 quick comprehension check + 1–3 source lines.
// Each card ties the cultural content to the host lesson's OWN vocabulary/sentences
// (verified against latinLessons.ts; see the PR1 runbook's tie-in-facts list).
//
// INERT until the PR2 renderer (CultureQuestion phase machine) consumes it —
// zero consumers today; a missing bundle renders quiz-only at runtime.
// latinLessons.ts exports its VALUE as default only (named exports are the TYPES only),
// so this file needs only type imports — no runtime dependency on the lesson data.
import type { TeachingStep, ComprehensionQuestion } from "./latinLessons";

export interface CultureTeachingBundle {
  exerciseId: string;             // must match a culture-question exercise id, e.g. "cu1-q1"
  steps: TeachingStep[];          // 1–3 cards — EXACTLY the lesson TeachingStep shape
  check?: ComprehensionQuestion;  // optional 1-question quick check
  sources: string[];              // 1–3 one-line verifiable references → "Fact check: …" under the cards
  // unitIntro?: string;          // OPTIONAL (PR3): 1–2 sentence unit-theme blurb (first bundle per unit)
}

// The 20 culture-question exercise ids in latinLessons.ts (units 1–5, capstone-last in their host lessons).
const KNOWN_CULTURE_IDS = [
  "cu1-q1", "cu2-q1", "cu4-q1", "cu9-q1", "cu26-q1",
  "cu27-q1", "cu32-q1", "cu33-q1", "cu34-q1", "cu35-q1",
  "cu37-q1", "cu41-q1", "cu53-q1", "cu56-q1", "cu57-q1",
  "cu58-q1", "cu59-q1", "cu60-q1", "cu65-q1", "cu70-q1",
] as const;

export const CULTURE_TEACHING: Record<string, CultureTeachingBundle> = {
  // ── UNIT 1 · The world of the early Republic ────────────────────────────
  "cu1-q1": {
    exerciseId: "cu1-q1",
    steps: [
      { title: "The Triumph",
        explanation: "A victorious Roman general (imperātor) was awarded a triumph: a grand procession through the city ending at the Temple of Jupiter Optimus Maximus on the Capitoline Hill, where he thanked Jupiter for the victory. The triumph was the highest honour a commander could receive.",
        exampleLatin: "victōria, glōria, triumphus",
        exampleEnglish: "victory, glory, a triumphal procession",
        tip: "triumphus is where our word 'triumph' comes from — the glory (glōria) of victory (victōria) made public." },
      { title: "The Words of Victory",
        explanation: "Lesson 1's own vocabulary gives you the general's prizes: victōria (victory) and glōria (fame, glory). The triumph itself was the public display of both — the victor rode in a chariot, his soldiers sang, and the city watched as he climbed to Jupiter's temple.",
        exampleLatin: "victōria, glōria",
        exampleEnglish: "victory, glory — what a triumph made public",
        tip: "English 'victory' and 'glorious' come from victōria and glōria — and 'triumph' straight from triumphus." }
    ],
    check: { question: "The Latin word triumphus gives us which English word?",
             options: ["triumph", "trident", "tribute", "truce"],
             correctIndex: 0,
             explanation: "triumphus is the direct ancestor of English 'triumph' — the public celebration of a victory." },
    sources: ["OCD s.v. triumph (cf. Beard, The Roman Triumph, 2007): procession ended at the Capitoline temple of Jupiter.",
              "Lewis & Short s.v. triumphus (Latin source of English 'triumph')."]
  },
  "cu2-q1": {
    exerciseId: "cu2-q1",
    steps: [
      { title: "The Mediterranean Triad",
        explanation: "Cato the Elder's De Agricultura, a handbook of traditional Italian farming, is built around the three crops that anchored the farm: grain (wheat), olives, and vines (grapes) — the 'Mediterranean triad.' Foods like maize, potatoes, and tomatoes would have been impossible: they reached Europe only after 1492, so they are anachronisms in the ancient world.",
        exampleLatin: "ager, arbor, vītis",
        exampleEnglish: "field, tree (the olive), vine",
        tip: "When you see New-World crops in a question about antiquity, suspect a distractor — ancient Italy had no maize, potatoes, or tomatoes." },
      { title: "Agricola, the Field-Tiller",
        explanation: "Lesson 2's grammar is rules for gender, and its star noun is agricola ('farmer') — the famous masculine exception to the first-declension rule that nouns in -a are feminine. It is built from ager ('field') + colō ('I till, cultivate'): a farmer is literally a 'field-tiller.'",
        exampleLatin: "agricola",
        exampleEnglish: "farmer (ager 'field' + colō 'I till')",
        tip: "English 'agriculture' is the same word: ager + cultura, the cultivation of the field." }
    ],
    check: { question: "The word agricola is built from ager ('field') + colō ('I till'). What does it literally mean?",
             options: ["field-tiller", "seed-sower", "cattle-driver", "vine-dresser"],
             correctIndex: 0,
             explanation: "agricola = ager (field) + colō (I till, cultivate): literally 'field-tiller' — the farmer." },
    sources: ["Cato, De Agricultura (praef.): the farmer's life as the core of traditional Italian agriculture.",
              "OCD s.v. agriculture, Roman: the Mediterranean triad (cereals, olive, vine).",
              "Lewis & Short s.v. agricola (ager + colō)."]
  },
  "cu4-q1": {
    exerciseId: "cu4-q1",
    steps: [
      { title: "Province: The Conquered Land",
        explanation: "The Latin word provincia is built from prō ('forth, on behalf of') + vincere ('to conquer') — the 'conquered land' brought under Roman rule beyond Italy. A province was governed by a Roman magistrate or former magistrate (a proconsul or propraetor) sent from Rome with imperium ('command power').",
        exampleLatin: "prōvincia",
        exampleEnglish: "province — prō + vincere, 'the conquered land'",
        tip: "The same root vincere gives you English 'victor' and 'invincible'." },
      { title: "Provincia in Lesson 4",
        explanation: "provincia is lesson 4's own new noun, and lesson 4 is the accusative case. In the lesson's sentence Provinciam laudant ('they praise the province'), provinciam is the accusative direct object — the very case Romans used when speaking of the lands they conquered and governed.",
        exampleLatin: "Provinciam laudant.",
        exampleEnglish: "They praise the province.",
        tip: "The accusative ending -am marks the object: the province is acted upon, exactly as it was by Rome." }
    ],
    check: { question: "In the lesson-4 sentence Provinciam laudant, why is provincia in the accusative case?",
             options: ["It is the direct object of the verb", "It is the subject of the verb", "It shows possession", "It means 'from the province'"],
             correctIndex: 0,
             explanation: "Provinciam is the direct object — the thing being praised — so it takes the accusative ending -am." },
    sources: ["OCD s.v. province: provinces were assigned to Roman magistrates/proconsuls.",
              "Lewis & Short s.v. prōvincia (prō + vincere)."]
  },
  "cu9-q1": {
    exerciseId: "cu9-q1",
    steps: [
      { title: "The Founding of Rome",
        explanation: "According to the traditional (Varronian) dating, Rome was founded in 753 BC — the city's birthday, as later Romans counted it. The legendary founder was Romulus, and after a line of kings the city expelled its last king around 509 BC and became a republic (a story your Unit 2 lesson on kings will finish).",
        exampleLatin: "Rōma condita est.",
        exampleEnglish: "Rome was founded.",
        tip: "The 'traditional' label matters: Romans themselves fixed the date from the lists of consuls and kings — it is a convention, not a census record." },
      { title: "Rōma and the Romans",
        explanation: "Lesson 9's vocabulary gives you the city and its neighbours: Rōma ('Rome'), Gallia ('Gaul'), Rōmānus ('a Roman'), Gallus ('a Gaul') — and the lesson sentence Rōmānus in Galliā est ('a Roman is in Gaul'). The Romans never forgot that their city had once been one small settlement among many.",
        exampleLatin: "Rōmānus in Galliā est.",
        exampleEnglish: "A Roman is in Gaul.",
        tip: "Rōma is the root of Rōmānus ('Roman') — the city gives its name to the people, as it did for the whole empire." }
    ],
    check: { question: "According to Roman tradition, who was the legendary founder of Rome?",
             options: ["Romulus", "Aeneas", "Numa Pompilius", "Julius Caesar"],
             correctIndex: 0,
             explanation: "Tradition named Romulus the founder of Rome in 753 BC (his twin Remus died in the rivalry before the city was built)." },
    sources: ["OCD s.v. Rome (history): the traditional foundation date, 753 BC, from Varro's chronology.",
              "Livy 1.6–7 (the story of Romulus and Remus)."]
  },
  // ── UNIT 2 · Rome and Gaul: roads, bridges, kings, Republic ─────────────
  "cu26-q1": {
    exerciseId: "cu26-q1",
    steps: [
      { title: "The Via Appia",
        explanation: "Rome's first great paved road, the Via Appia, was begun in 312 BC under the censor Appius Claudius and ran from Rome toward Capua (later extended to Brundisium). The Roman road network — straight, paved, and durable — was what bound the growing Republic together, moving armies, trade, and news.",
        exampleLatin: "via, viae (f.)",
        exampleEnglish: "road, way",
        tip: "English 'via' ('by way of') is simply the Latin noun via still doing its job." },
      { title: "Via Longa",
        explanation: "Your lesson 26 vocabulary has longus ('long'), and lesson 16 gave you via ('road') — put them together and you get via longa, 'a long road.' Because via is feminine, the 2-1-2 adjective longus takes its feminine form longa — the agreement rule this very lesson teaches with magnus, magna, magnum.",
        exampleLatin: "via longa",
        exampleEnglish: "a long road (feminine adjective agreeing with its noun)",
        tip: "Adjectives change their endings to match their noun: via (f.) → via longa, just as bellum (n.) → bellum longum." }
    ],
    check: { question: "In the phrase via longa ('a long road'), which word is the noun and which is the adjective?",
             options: ["via is the noun, longa the adjective", "longa is the noun, via the adjective", "both are nouns", "both are verbs"],
             correctIndex: 0,
             explanation: "via ('road') is the noun; longa ('long') is the feminine form of the adjective longus agreeing with it." },
    sources: ["OCD s.v. via Appia: the Appian Way, Rome–Capua (later extended to Brundisium), begun 312 BC.",
              "Lewis & Short s.v. via."]
  },
  "cu27-q1": {
    exerciseId: "cu27-q1",
    steps: [
      { title: "The Gallic Wars",
        explanation: "Between 58 and 50 BC Julius Caesar conquered Gaul in a series of campaigns — the Gallic Wars — which he himself recounted in the Commentarii de Bello Gallico ('Commentaries on the Gallic War'). That book is where generations of Latin students, including you, first meet Caesar's own prose.",
        exampleLatin: "Commentāriī dē Bellō Gallicō",
        exampleEnglish: "Commentaries on the Gallic War",
        tip: "Caesar wrote in the third person and in the plainest style — he wanted Rome to read his own version of the war." },
      { title: "Gallia and Gallus in Your Lessons",
        explanation: "Your early vocabulary already knows the players: Gallia ('Gaul'), Gallus ('a Gaul'), Rōmānus ('a Roman'). Unit 2's theme is Rome and Gaul — and the very words you learned in lessons 9 and 10 are the ones Caesar used to tell of marching into Gallia, fighting the Gallī, and reporting to Rome.",
        exampleLatin: "Gallia, Gallus, Rōmānus",
        exampleEnglish: "Gaul, a Gaul, a Roman",
        tip: "The 'Gallic' in 'Gallic Wars' is simply the adjective of Gallia — the land Caesar subdued." }
    ],
    check: { question: "Caesar's own account of his campaigns is titled Commentarii de Bello Gallico. What does that title literally mean?",
             options: ["Commentaries on the Gallic War", "Letters about the Roman army", "Speeches before the Senate", "History of the City of Rome"],
             correctIndex: 0,
             explanation: "Commentarii ('commentaries, notes') de Bello Gallico ('on the Gallic War') — Caesar's firsthand account of the campaigns of 58–50 BC." },
    sources: ["OCD s.v. Caesar: the Gallic campaigns of 58–50 BC, recounted in the Commentarii de Bello Gallico.",
              "Caesar, Bellum Gallicum 1.1: 'Gallia est omnis divisa in partes tres.'"]
  },
  "cu32-q1": {
    exerciseId: "cu32-q1",
    steps: [
      { title: "The Pons Sublicius",
        explanation: "Rome's oldest bridge over the Tiber was the wooden Pons Sublicius, attributed by tradition (Livy 1.33.6) to King Ancus Marcius in the regal period. Built of timber without iron, it was for centuries the city's only crossing — and it was kept in repair by the priests as a sacred relic of the early city.",
        exampleLatin: "pōns, pontis (m.)",
        exampleEnglish: "bridge",
        tip: "Tradition, not archaeology, names Ancus Marcius as the builder — a good reminder that the earliest Roman 'facts' are often origin stories." },
      { title: "Pōns in Your Reading",
        explanation: "pōns ('bridge') is lesson 32's own vocabulary word, and the Unit 2 passage Urbs et Pōns opens with Pōns magnus in flūmine est — 'a great bridge is in the river.' The word lives on in English 'pontoon' and in the title Pontifex Maximus — literally 'great bridge-builder,' the chief priest of Rome.",
        exampleLatin: "Pōns magnus in flūmine est.",
        exampleEnglish: "A great bridge is in the river.",
        tip: "Pontifex Maximus, the head of Roman religion, kept the name 'bridge-builder' — even the priests remembered the old wooden bridge." }
    ],
    check: { question: "In the passage sentence Pōns magnus in flūmine est, what does pōns mean?",
             options: ["bridge", "river", "soldier", "wall"],
             correctIndex: 0,
             explanation: "pōns means 'bridge' — here a great bridge (pōns magnus) standing in the river (in flūmine)." },
    sources: ["Livy 1.33.6; OCD s.v. Pons Sublicius: Rome's oldest bridge, of wood, attributed to Ancus Marcius.",
              "Lewis & Short s.v. pōns (source of English 'pontoon')."]
  },
  "cu33-q1": {
    exerciseId: "cu33-q1",
    steps: [
      { title: "The Last King",
        explanation: "Lucius Tarquinius Superbus ('Tarquin the Proud') was traditionally the last king of Rome, expelled around 509 BC — the event that began the Republic. The new state called itself rēs pūblica, 'the public thing': power was to belong to the people, not to a king. This completes the arc you began in Unit 1: Rome founded in 753 BC, kings expelled in 509 BC.",
        exampleLatin: "rēs pūblica",
        exampleEnglish: "the public thing — the Republic",
        tip: "English 'republic' is just rēs pūblica, and 'public' itself comes from populus, the people." },
      { title: "Rēx in Lesson 33",
        explanation: "Lesson 33's mastery-review vocabulary includes rēx ('king'), dux ('leader'), and imperātor ('general') — the words of the old kingly world and the new military one. The Romans' hatred of kings (odium rēgum) was so deep that the title rēx remained a political insult for centuries, even under their own emperors.",
        exampleLatin: "rēx, rēgis (m.)",
        exampleEnglish: "king",
        tip: "rēx survives in English 'regal' and 'royal' — but at Rome, calling a man 'king' was the gravest charge of all." }
    ],
    check: { question: "What does rēs pūblica — the name the Romans gave their new state — literally mean?",
             options: ["the public thing (public affair)", "the king's house", "the people's army", "the sacred city"],
             correctIndex: 0,
             explanation: "rēs pūblica = 'the public thing' — the state as the people's affair, in deliberate contrast to a king's private rule." },
    sources: ["Livy 1.49–60; OCD s.v. Tarquinius Superbus: traditionally the last king, expelled c. 509 BC.",
              "Lewis & Short s.v. rēs pūblica."]
  },
  // ── UNIT 3 · Caesar's army: legion, camp, weapons, the Rubicon ──────────
  "cu34-q1": {
    exerciseId: "cu34-q1",
    steps: [
      { title: "The Legion",
        explanation: "In Caesar's day a legion was made up of ten cohorts and numbered nominally about 4,800–6,000 men — commonly given as 'about five thousand.' The legion was the unit that conquered the Mediterranean: self-contained, disciplined, and able to fortify a camp wherever it stopped.",
        exampleLatin: "legiō, legiōnis (f.)",
        exampleEnglish: "legion",
        tip: "The commonly-taught figure is a paper strength; a legion on campaign was rarely at full numbers." },
      { title: "Legiō and Parō",
        explanation: "legiō ('legion') entered your vocabulary in lesson 29, and lesson 34 teaches parō ('I prepare') — exactly what soldiers did as the legion got ready for war. The Unit 3 passage title says it in three words: Legiō in Galliā, 'the legion in Gaul.'",
        exampleLatin: "Legiō in Galliā. / Mīlitēs sē parant.",
        exampleEnglish: "The legion is in Gaul. / The soldiers prepare themselves.",
        tip: "English 'legion' and 'legionnaire' come straight from legiō — as does 'legion' in the sense of 'a great many.'" }
    ],
    check: { question: "In the passage title Legiō in Galliā, what does legiō mean?",
             options: ["legion", "camp", "standard", "battle"],
             correctIndex: 0,
             explanation: "legiō means 'legion' — the army unit of about 5,000 men; the title reads 'the legion in Gaul.'" },
    sources: ["OCD s.v. legion: a legion was nominally ~4,800–6,000 men — commonly given as 'about five thousand.'",
              "Lewis & Short s.v. legiō."]
  },
  "cu35-q1": {
    exerciseId: "cu35-q1",
    steps: [
      { title: "The Marching Camp",
        explanation: "When a Roman army stopped for the night on campaign, it did not scatter: every soldier helped build a fortified marching camp, digging a ditch (fossa) and piling up a rampart (vallum) around the tents. Polybius describes the routine in detail (6.27–34) — a fresh fortress every single day.",
        exampleLatin: "fossa et vallum",
        exampleEnglish: "ditch and rampart",
        tip: "The word 'camp' itself comes from Latin campus ('field') — but a Roman camp was no open field; it was a daily-built fortress." },
      { title: "Castra: Camp",
        explanation: "You met the special-plural pattern in lesson 24 — nouns like grātiae ('thanks') and cōpiae ('forces') that are plural in form but singular in meaning. castra ('camp') is the same type: plural in form, singular in meaning. Lesson 54 gives you the sentence Mīlitēs castra collocāvērunt — 'the soldiers stationed the camp' — and lesson 35's verbs pugnō, superō are the words of camp life: soldiers fight (pugnant) and overcome (superant).",
        exampleLatin: "Mīlitēs castra collocāvērunt.",
        exampleEnglish: "The soldiers stationed the camp.",
        tip: "A camp is made of many tents, so castra is plural — but Romans meant one camp, and so do you." }
    ],
    check: { question: "In the sentence Mīlitēs castra collocāvērunt, castra — like grātiae and cōpiae from lesson 24 — is plural in form but means…",
             options: ["camp (singular)", "camps (plural)", "walls", "soldiers"],
             correctIndex: 0,
             explanation: "castra is a special plural: plural in form, singular in meaning — 'camp,' as in 'the soldiers stationed the camp.'" },
    sources: ["Polybius 6.27–34; OCD s.v. camp: a marching camp was fortified nightly with a ditch (fossa) and rampart (vallum).",
              "Lewis & Short s.v. castra (special plural, cf. grātiae, cōpiae)."]
  },
  "cu37-q1": {
    exerciseId: "cu37-q1",
    steps: [
      { title: "The Rubicon",
        explanation: "In 49 BC Julius Caesar brought his army to the river Rubicon, the boundary of his province. Crossing it with armed force meant war with the Republic itself — the point of no return. He crossed, and so began the civil war against Pompey and the Senate. Tradition (Suetonius) has him saying ālea iacta est, 'the die is cast.'",
        exampleLatin: "ālea iacta est",
        exampleEnglish: "the die is cast",
        tip: "'Crossing the Rubicon' is still our phrase for an irreversible decision — the moment Caesar made his." },
      { title: "Caesar vocat mīlitēs",
        explanation: "Your lesson 37 teaches vocō ('I call'), and the Unit 3 passage opens with Prīmā lūce Caesar mīlitēs vocat — 'at first light Caesar calls the soldiers.' That is the army that marched to the Rubicon. And this lesson's imperfect tense is how a Roman described the gathering crisis: Caesar was calling his soldiers as the Republic watched.",
        exampleLatin: "Prīmā lūce Caesar mīlitēs vocat.",
        exampleEnglish: "At first light Caesar calls the soldiers.",
        tip: "vocō is the root of English 'vocal' and 'vocation' — a 'calling' in both senses." }
    ],
    check: { question: "The words ālea iacta est, attributed to Caesar at the Rubicon, are traditionally translated…",
             options: ["The die is cast", "The war is won", "Rome is free", "The river is crossed"],
             correctIndex: 0,
             explanation: "ālea iacta est = 'the die is cast' — the gamble was made; there was no turning back." },
    sources: ["Suetonius, Divus Iulius 32; OCD s.v. Rubicon: the 49 BC crossing opened civil war against Pompey.",
              "Lewis & Short s.v. ālea (the dice-cast as a figure of risk)."]
  },
  "cu41-q1": {
    exerciseId: "cu41-q1",
    steps: [
      { title: "The Legionary's Weapons",
        explanation: "The standard offensive equipment of a Roman legionary in the Republic was the pilum (a heavy throwing javelin) and the gladius (a short sword). The soldier hurled the pilum to break the enemy's shield-wall, then closed in with the gladius — the combination that made the legions feared across the Mediterranean.",
        exampleLatin: "pilum et gladius",
        exampleEnglish: "javelin and sword",
        tip: "The pilum was designed to bend on impact so the enemy could not throw it back — a small detail with a big tactical effect." },
      { title: "Arma and Gladius in Your Lessons",
        explanation: "Lesson 41's own vocabulary gives you arma ('arms, weapons') — a neuter plural noun, because weapons come in sets. And lesson 8 taught you gladius ('sword') in the sentence Dedit gladium fīliō, 'he gave the sword to his son' — the gladius in the accusative, ready to be handed over.",
        exampleLatin: "arma / Dedit gladium fīliō.",
        exampleEnglish: "arms, weapons / He gave the sword to his son.",
        tip: "English 'army,' 'armor,' and 'arms' all descend from arma — and 'gladiator' from gladius." }
    ],
    check: { question: "In lesson 41's vocabulary, the noun arma means…",
             options: ["arms, weapons", "armies", "camps", "standards"],
             correctIndex: 0,
             explanation: "arma means 'arms, weapons' — a neuter plural noun, the root of English 'army' and 'armor.'" },
    sources: ["OCD s.v. army, Roman (also pilum, gladius).",
              "Lewis & Short s.v. arma."]
  },
  // ── UNIT 4 · The past and the family: Hannibal, schooling, household, names ──
  "cu53-q1": {
    exerciseId: "cu53-q1",
    steps: [
      { title: "Hannibal Crosses the Alps",
        explanation: "In 218 BC, during the Second Punic War, the Carthaginian general Hannibal did what no one thought possible: he crossed the Alps with an army that included war elephants (Livy 21.31–38). The march is one of antiquity's most celebrated feats — and it brought the war to Italy itself.",
        exampleLatin: "Hannibal Alpēs trānsīvit.",
        exampleEnglish: "Hannibal crossed the Alps.",
        tip: "The elephants were war machines of a kind Italy had never seen — but most did not survive the crossing." },
      { title: "The Perfect for the Past",
        explanation: "Lesson 53 teaches the perfect active system — the tense Romans used for completed past action: laudāvī ('I praised'), mīsī ('I sent'), vēnit ('he came'), pugnāvit ('he fought'). Hannibal's crossing is exactly the kind of story the perfect was made for: a finished deed, told in one stroke.",
        exampleLatin: "vēnit, pugnāvit, superāvit",
        exampleEnglish: "he came, he fought, he overcame",
        tip: "If a sentence tells you what someone did — one finished event — reach for the perfect; that is its job." }
    ],
    check: { question: "Lesson 53's perfect tense is the natural tense for narrating what Hannibal did in 218 BC because it expresses…",
             options: ["completed past action", "ongoing action in the past", "future action", "present action"],
             correctIndex: 0,
             explanation: "The perfect expresses completed action — vēnit, 'he came' — one finished deed, which is exactly how the Alps crossing is told." },
    sources: ["Livy 21.31–38; OCD s.v. Hannibal: his Alpine crossing (218 BC) with elephants.",
              "Lewis & Short s.v. perficiō / perfect tense (completed action)."]
  },
  "cu56-q1": {
    exerciseId: "cu56-q1",
    steps: [
      { title: "Roman Schooling",
        explanation: "In the Roman world there were no state schools. Formal elementary schooling was private and fee-paying, run by a magister lūdī ('master of the school') in a rented room or shop. Families paid the teacher themselves — education was a family investment, and literacy was one of the things that marked out a respectable citizen.",
        exampleLatin: "magister lūdī",
        exampleEnglish: "master of the school",
        tip: "lūdus means 'game, play' — and by extension 'school': Roman schooling was literally a 'play-place' for children." },
      { title: "Puer Goes to School",
        explanation: "Lesson 56's model noun is puer ('boy') — a second-declension noun that keeps its -e- in the genitive: puer, puerī. The boys (puerī) of a Roman family were the ones sent to the magister lūdī to learn their letters, usually starting around age seven.",
        exampleLatin: "puer, puerī (m.)",
        exampleEnglish: "boy, of a boy — the model noun of lesson 56",
        tip: "Remember the -e-: it is puerī, not purī — the model noun of this lesson is exactly the boy who went to school." }
    ],
    check: { question: "The Roman schoolteacher was called the magister lūdī. What does lūdus mean in this title?",
             options: ["school", "household", "army", "marketplace"],
             correctIndex: 0,
             explanation: "lūdus means 'game, play' and by extension 'school' — the magister lūdī was the master of the school." },
    sources: ["OCD s.v. education, Roman: schools were private, fee-paying enterprises under the magister lūdī.",
              "Lewis & Short s.v. lūdus (game, play; school)."]
  },
  "cu57-q1": {
    exerciseId: "cu57-q1",
    steps: [
      { title: "The Paterfamilias",
        explanation: "The paterfamilias — the head of a Roman household — held legal power (patria potestas) over his children and the household's slaves. His authority was the backbone of Roman family law: the household was his to govern, in life and (for property) even beyond it.",
        exampleLatin: "paterfamiliās",
        exampleEnglish: "head of the household",
        tip: "The word itself is pater ('father') + familiās (old genitive of familia): 'father of the household.'" },
      { title: "Pater in Your Reading",
        explanation: "pater ('father') entered your vocabulary in lesson 18, and the Unit 4 passage Litterae Patris — 'the letters of the father' — is a family story. Lesson 57's -er nouns (miser, integer) have the same shape as pater: the -e- appears in the nominative and drops away in the other cases — patris, not pateris, is the genitive.",
        exampleLatin: "Litterae Patris",
        exampleEnglish: "The Letters of the Father",
        tip: "Genitive patris shows the pattern: pater loses its -e- in the oblique cases, just as your lesson 57 nouns do." }
    ],
    check: { question: "In the passage title Litterae Patris ('the letters of the father'), what case is patris, and what does it show?",
             options: ["genitive — 'of the father'", "nominative — 'the father' (subject)", "accusative — 'the father' (object)", "ablative — 'by the father'"],
             correctIndex: 0,
             explanation: "patris is the genitive of pater — 'of the father' — showing possession, and note the dropped -e- (pater → patris)." },
    sources: ["OCD s.v. paterfamilias / patria potestas: potestas extended over children and slaves.",
              "Lewis & Short s.v. pater."]
  },
  "cu58-q1": {
    exerciseId: "cu58-q1",
    steps: [
      { title: "The Tria Nomina",
        explanation: "A Roman citizen's full name usually had three parts (the tria nomina): the praenomen (first name), the nomen (family name), and the cognomen (third name). Gaius Iulius Caesar is the classic example — Gaius his given name, Iulius his family, Caesar his branch of it. The three names marked a man out as a full citizen.",
        exampleLatin: "Gāius Iūlius Caesar",
        exampleEnglish: "Gaius Iulius Caesar — praenomen, nomen, cognomen",
        tip: "Caesar's cognomen outlived the Republic: it became 'kaiser' in German and 'tsar' in Russian." },
      { title: "My Name Is My Own",
        explanation: "Lesson 58 teaches the possessive adjectives — meus, tuus, noster, vester ('my, your [sg.], our, your [pl.]'). They let a Roman claim his own: meum nōmen, 'my name.' The tria nomina were precisely what made a citizen's identity his own — his to hand down to his children, the very idea this lesson's possessives put into Latin.",
        exampleLatin: "meum nōmen",
        exampleEnglish: "my name",
        tip: "The possessives agree with the noun they own — nōmen is neuter, so 'my name' is meum nōmen." }
    ],
    check: { question: "In the name Gaius Iulius Caesar, which part is the cognomen (the third name)?",
             options: ["Caesar", "Gaius", "Iulius", "all three together"],
             correctIndex: 0,
             explanation: "The cognomen is the third name: Caesar. Gaius is the praenomen (first name), Iulius the nomen (family name)." },
    sources: ["OCD s.v. names, personal, Roman: the tria nomina of the Roman citizen.",
              "Lewis & Short s.v. cognōmen."]
  },
  // ── UNIT 5 · Slavery and freedom: manumission, familia, the freedman, Spartacus ──
  "cu59-q1": {
    exerciseId: "cu59-q1",
    steps: [
      { title: "Manumission",
        explanation: "The formal freeing of a slave was manumissiō — from manus ('hand') + missiō ('a sending'): the ritual act of releasing the slave from one's hand. The freed person became a lībertus (or līberta) — free, and usually still bound to the former master by duties of patronage.",
        exampleLatin: "manumissiō, manūmittō",
        exampleEnglish: "manumission — I free (a slave)",
        tip: "Break it down: manū (from the hand) + mittō (I send) — the slave is 'sent from the hand.'" },
      { title: "Being Freed Is Passive",
        explanation: "Lesson 59 introduces the passive voice: servus laudātur — 'the slave is praised.' Now make it manumission: servus manūmittitur — 'the slave is being freed.' The whole point of the passive is that the slave receives the action rather than doing it — and being freed is the most important thing that ever happened to him.",
        exampleLatin: "Servus manūmittitur.",
        exampleEnglish: "The slave is being freed.",
        tip: "The -tur ending is your passive sign in the present tense: the subject is acted upon, not acting." }
    ],
    check: { question: "In servus manūmittitur ('the slave is being freed'), the ending -tur shows that the verb is…",
             options: ["passive — the slave receives the action", "active — the slave does the action", "future — the slave will be freed", "imperfect — the slave used to be freed"],
             correctIndex: 0,
             explanation: "-tur marks the present passive: the slave is acted upon — he is being freed, he does not free himself." },
    sources: ["OCD s.v. manumission (also slavery, Roman): the freeing of a slave, after which the person became a lībertus/līberta.",
              "Lewis & Short s.v. manūmittō (manus + mittō)."]
  },
  "cu60-q1": {
    exerciseId: "cu60-q1",
    steps: [
      { title: "Familia in Roman Law",
        explanation: "In Roman law familia could mean the whole household under the paterfamilias — the family AND its slaves — more than mere blood relatives. A wealthy Roman's familia might include dozens of slaves, all counted as part of the household's property and persons. It was the basic unit of Roman society, not the nuclear family of today.",
        exampleLatin: "familia",
        exampleEnglish: "the household — family and slaves under the paterfamilias",
        tip: "The English word 'family' has narrowed over time; the Roman familia was wider — everyone under the father's power." },
      { title: "Familia and Your Lessons",
        explanation: "This builds on the paterfamilias of cu57: the familia is exactly what the paterfamilias headed. Lesson 60's passive endings let you put it in a sentence: servus in familiā laudātur — 'the slave in the household is praised.' Contrast familia (the people under the father) with domus (the physical house): the slaves belonged to the familia, not just to the building.",
        exampleLatin: "Servus in familiā laudātur.",
        exampleEnglish: "The slave in the household is praised.",
        tip: "familia and domus are not synonyms: one is the household as a legal body, the other the house itself." }
    ],
    check: { question: "Which Latin word would a Roman use for the whole household under the father's power — free and slave alike?",
             options: ["familia", "domus", "urbs", "nāvis"],
             correctIndex: 0,
             explanation: "familia — the household under the paterfamilias, including slaves. domus is the physical house, urbs the city, nāvis a ship." },
    sources: ["OCD s.v. familia: in Roman law, the household property and persons under the paterfamilias, including slaves.",
              "Lewis & Short s.v. familia."]
  },
  "cu65-q1": {
    exerciseId: "cu65-q1",
    steps: [
      { title: "The Lībertus",
        explanation: "When a slave was freed (manumitted), the freed person — a lībertus or līberta — was free and a citizen, but of restricted status in the first generation: barred from some offices and honors. Their children, born free, were full citizens with no restrictions. Freedom was real, but it came in stages.",
        exampleLatin: "lībertus, līberta",
        exampleEnglish: "freedman, freedwoman",
        tip: "Do not confuse lībertus (a freed slave) with līber ('free') — the -t- marks the one who was freed." },
      { title: "Manūmittitur Is Third Conjugation",
        explanation: "Lesson 65 teaches the present passive of the third conjugation: mittor, mitteris, mittitur, mittimur, mittiminī, mittuntur. The verb manūmittō, manūmittere ('to free a slave') is itself third conjugation — so manūmittitur ('he is freed') follows exactly the pattern you learn in this lesson.",
        exampleLatin: "manūmittor, manūmitteris, manūmittitur",
        exampleEnglish: "I am freed, you are freed, he is freed — 3rd-conjugation passive, like mittor",
        tip: "Spot the infinitive: manūmittere (-ere) = third conjugation, so its passive endings are the mittor pattern." }
    ],
    check: { question: "The verb manūmittō, manūmittere follows which conjugation's passive pattern from lesson 65?",
             options: ["third (-ere) — like mittor, mitteris", "first (-āre) — like laudor", "second (-ēre) — like moneor", "fourth (-īre) — like audior"],
             correctIndex: 0,
             explanation: "manūmittere ends in -ere, the third conjugation — so it is passive like mittor, mitteris, mittitur." },
    sources: ["OCD s.v. freedmen, freedwomen: first-generation freed persons were citizens of restricted status; their children were unrestrained citizens.",
              "Lewis & Short s.v. lībertus."]
  },
  "cu70-q1": {
    exerciseId: "cu70-q1",
    steps: [
      { title: "Spartacus",
        explanation: "The slave revolt led by the gladiator Spartacus — the Third Servile War — ran from 73 to 71 BC and was finally crushed by Crassus. Tens of thousands of slaves and gladiators joined him before the revolt ended; it was the largest slave uprising Rome ever faced.",
        exampleLatin: "Spartacus, gladiātor",
        exampleEnglish: "Spartacus, a gladiator",
        tip: "Spartacus was a Thracian who had been sold into slavery and trained as a gladiator — his revolt began in a gladiator school." },
      { title: "From Manumission to Revolt",
        explanation: "Unit 5 has traced slavery and freedom: manumission (cu59), the familia (cu60), the lībertus (cu65). The Unit 5 passage Pāx ā Caesare — 'peace by Caesar' — closes the arc in the passive perfect: servātus est ('was saved'), superātī sunt ('were overcome'). Spartacus' war was the violent end of that story: the servī and gladiātōrēs whom Rome could free — or crush — took up arma, the weapons of lesson 41.",
        exampleLatin: "Servī arma sūmpsērunt.",
        exampleEnglish: "The slaves took up arms.",
        tip: "The passive voice of Unit 5 — being saved, being overcome, being freed — is exactly how Roman history treats the slaves: as the ones acted upon." }
    ],
    check: { question: "Spartacus, the leader of the great slave revolt, had been trained as what?",
             options: ["a gladiator", "a senator", "a priest", "a merchant"],
             correctIndex: 0,
             explanation: "Spartacus was a Thracian slave trained as a gladiator — the revolt he led (73–71 BC) began among gladiators." },
    sources: ["OCD s.v. Spartacus: leader of the Third Servile War (73–71 BC), defeated by Crassus.",
              "Appian, Civil Wars 1.116–120 (the revolt and its end)."]
  }
};

// Dev-mode validation — console.warn only, never throw (absent bundles render quiz-only at runtime).
// Mirrors the pattern in src/lib/bookshelfModel.ts.
function validateCultureTeaching(): void {
  const known = new Set<string>(KNOWN_CULTURE_IDS);
  const keys = Object.keys(CULTURE_TEACHING);
  if (keys.length !== known.size) {
    console.warn(`[cultureTeaching] expected ${known.size} bundles, found ${keys.length}`);
  }
  for (const id of known) {
    if (!CULTURE_TEACHING[id]) {
      console.warn(`[cultureTeaching] missing bundle for ${id} — this question renders quiz-only`);
    }
  }
  for (const [key, bundle] of Object.entries(CULTURE_TEACHING)) {
    if (!known.has(key)) {
      console.warn(`[cultureTeaching] orphan bundle ${key} — no such culture exercise in latinLessons.ts`);
    }
    if (bundle.exerciseId !== key) {
      console.warn(`[cultureTeaching] ${key}: exerciseId '${bundle.exerciseId}' does not match its key`);
    }
    if (bundle.steps.length < 1) {
      console.warn(`[cultureTeaching] ${key}: steps must have length >= 1`);
    }
    for (const step of bundle.steps) {
      if (!step.title || !step.explanation) {
        console.warn(`[cultureTeaching] ${key}: every step needs title + explanation`);
      }
    }
    if (bundle.sources.length < 1) {
      console.warn(`[cultureTeaching] ${key}: sources must have length >= 1`);
    }
    if (bundle.check) {
      if (!bundle.check.options || bundle.check.options.length !== 4) {
        console.warn(`[cultureTeaching] ${key}: check needs exactly 4 options`);
      }
      if (typeof bundle.check.correctIndex !== "number" || bundle.check.correctIndex < 0 || bundle.check.correctIndex > 3) {
        console.warn(`[cultureTeaching] ${key}: check correctIndex must be 0–3`);
      }
      if (!bundle.check.explanation) {
        console.warn(`[cultureTeaching] ${key}: check needs an explanation`);
      }
    }
  }
}
validateCultureTeaching();
