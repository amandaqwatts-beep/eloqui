import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LANGUAGES } from "~/data/languages";
import type { ReactNode } from "react";
import { greekCharacters } from "~/data/greekCharacters";
import { hebrewCharacters } from "~/data/hebrewCharacters";
import type { CharacterQuizItem as GreekCharacter } from "~/data/greekCharacters";
import type { CharacterQuizItem as HebrewCharacter } from "~/data/hebrewCharacters";

type Character = GreekCharacter | HebrewCharacter;
type Difficulty = "basic" | "advanced" | "all";
const datasets: Record<"greek" | "hebrew", Character[]> = { greek: greekCharacters, hebrew: hebrewCharacters };
const categoryNames: Record<string, string> = { letter: "Letters", vowel: "Vowels", diphthong: "Diphthongs", breathing: "Breathings", accent: "Accents", punctuation: "Punctuation", mark: "Marks", "final-form": "Final forms" };

export default function CharacterQuizzer({ initialLanguage }: { initialLanguage?: "greek" | "hebrew" }) {
  const [language, setLanguage] = useState<"greek" | "hebrew" | undefined>(initialLanguage);
  const [difficulty, setDifficulty] = useState<Difficulty>("basic");
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<Character[]>([]);
  const [phase, setPhase] = useState<"setup" | "quiz" | "results">("setup");
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [missed, setMissed] = useState<Character[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);

  const availableCategories = useMemo(() => language ? [...new Set(datasets[language].map((item) => item.category))] : [], [language]);
  const matching = useMemo(() => {
    if (!language) return [];
    return datasets[language].filter((item) => (difficulty === "all" || item.difficulty === difficulty) && (!categories.length || categories.includes(item.category)));
  }, [language, difficulty, categories]);
  const current = items[index];
  const options = useMemo(() => {
    if (!current) return [];
    const pool = datasets[language!].filter((item) => item.id !== current.id);
    const others = pool.sort((a, b) => a.id.localeCompare(b.id)).slice(index % Math.max(1, pool.length - 3), index % Math.max(1, pool.length - 3) + 3);
    return [current, ...others].sort((a, b) => a.name.localeCompare(b.name));
  }, [current, index, language]);

  function start(list = matching) {
    if (!list.length) return;
    setItems([...list].sort(() => Math.random() - 0.5)); setIndex(0); setCorrect(0); setStreak(0); setMaxStreak(0); setMissed([]); setChosen(null); setPhase("quiz");
  }
  function answer(option: Character) {
    if (!current || chosen) return;
    const right = option.id === current.id; setChosen(option.id);
    if (right) { setCorrect((value) => value + 1); setStreak((value) => { const next = value + 1; setMaxStreak((old) => Math.max(old, next)); return next; }); }
    else { setStreak(0); setMissed((value) => [...value, current]); }
    window.setTimeout(() => { if (index + 1 >= items.length) setPhase("results"); else { setIndex((value) => value + 1); setChosen(null); } }, 650);
  }
  function toggleCategory(category: string) { setCategories((value) => value.includes(category) ? value.filter((item) => item !== category) : [...value, category]); }
  const isHebrew = language === "hebrew";

  if (phase === "results") return <Page><div className="mx-auto max-w-xl rounded-3xl border border-burgundy-200 bg-white p-7 text-center shadow-lg"><div className="text-5xl">🏆</div><h1 className="mt-3 text-3xl font-black text-burgundy-900">Quiz complete!</h1><p className="mt-4 text-5xl font-black text-burgundy-700">{correct} / {items.length}</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-green-50 p-3 text-green-700"><b>{correct}</b><br/>Correct</div><div className="rounded-xl bg-red-50 p-3 text-red-700"><b>{missed.length}</b><br/>Needs work</div></div><p className="mt-4 text-sm text-gray-500">Best streak: {maxStreak}</p>{missed.length > 0 && <div className="mt-5 text-left rounded-xl bg-cream-50 p-4"><h2 className="font-bold text-burgundy-800">Review these characters</h2><p className="mt-2 text-sm text-gray-600">{missed.map((item) => `${item.form} — ${item.name}`).join(" · ")}</p></div>}<div className="mt-7 flex flex-col gap-3 sm:flex-row"><button onClick={() => start(missed)} disabled={!missed.length} className="flex-1 rounded-xl bg-burgundy-700 py-3 font-bold text-white disabled:opacity-40">Drill Missed Again</button><button onClick={() => setPhase("setup")} className="flex-1 rounded-xl border-2 border-burgundy-200 py-3 font-bold text-burgundy-700">Practice Again</button></div></div></Page>;

  if (phase === "quiz" && current) return <Page><div className="mx-auto w-full max-w-xl" dir={isHebrew ? "rtl" : "ltr"}><div className="mb-5 flex items-center justify-between text-sm font-semibold text-burgundy-700"><span>Character {index + 1} / {items.length}</span><span>🔥 {streak} streak</span></div><div className="rounded-3xl border-2 border-burgundy-300 bg-burgundy-50 p-8 text-center shadow-lg"><p className="text-xs font-bold uppercase tracking-widest text-burgundy-500">Identify this character</p><p className={`mt-7 text-8xl font-black leading-none text-burgundy-900 ${isHebrew ? "font-serif" : ""}`}>{current.form}</p>{current.forms?.length ? <p className="mt-4 text-lg text-burgundy-600">Also: {current.forms.join(" · ")}</p> : null}<p className="mt-3 text-sm text-gray-500">Choose its name or sound</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{options.map((option) => <button key={option.id} disabled={!!chosen} onClick={() => answer(option)} className={`rounded-xl border-2 bg-white p-4 text-left transition ${chosen === option.id ? (option.id === current.id ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50") : "border-burgundy-100 hover:border-gold-400"}`}><span className="font-bold text-burgundy-900">{option.name}</span><span className="block text-sm text-gray-500">{option.transliteration} · {"erasmian" in option.pronunciation ? option.pronunciation.erasmian : option.pronunciation.traditional}</span></button>)}</div><div className="mt-5 text-center"><button disabled className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-400" title="Greek and Hebrew browser speech is not reliable">🔊 Play sound <span className="text-xs">(unavailable)</span></button></div></div></Page>;

  return <Page><div className="mx-auto max-w-2xl"><h1 className="text-3xl font-black text-burgundy-900">📝 Character Quizzer</h1><p className="mt-2 text-gray-600">Master the forms, sounds, and names of each character.</p><section className="mt-6 rounded-3xl border border-burgundy-200 bg-white p-6 shadow-lg"><h2 className="font-bold text-burgundy-800">Choose a language</h2><div className="mt-3 grid grid-cols-2 gap-3">{(["greek", "hebrew"] as const).map((id) => <button key={id} onClick={() => { setLanguage(id); setCategories([]); }} className={`rounded-xl border-2 p-4 text-left ${language === id ? "border-burgundy-600 bg-burgundy-50" : "border-gray-200"}`}><span className="text-lg font-bold text-burgundy-900">{LANGUAGES[id].name}</span><span className="mt-1 block text-sm text-gray-500">{id === "greek" ? "α β γ" : "א ב ג"}</span></button>)}</div>{language && <><h2 className="mt-7 font-bold text-burgundy-800">Difficulty</h2><div className="mt-3 flex gap-2">{(["basic", "advanced", "all"] as const).map((value) => <button key={value} onClick={() => setDifficulty(value)} className={`flex-1 rounded-xl border-2 py-3 font-semibold capitalize ${difficulty === value ? "border-gold-500 bg-gold-100 text-burgundy-900" : "border-gray-200 text-gray-600"}`}>{value}</button>)}</div><h2 className="mt-7 font-bold text-burgundy-800">Categories <span className="font-normal text-gray-400">(optional)</span></h2><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{availableCategories.map((category) => <button key={category} onClick={() => toggleCategory(category)} className={`rounded-xl border-2 p-3 text-left text-sm ${categories.includes(category) ? "border-burgundy-600 bg-burgundy-50 font-bold text-burgundy-800" : "border-gray-200 text-gray-600"}`}>{categories.includes(category) ? "✓ " : ""}{categoryNames[category] ?? category}</button>)}</div><p className="mt-5 text-center text-sm text-gray-500">{matching.length} {matching.length === 1 ? "item" : "items"} match your choices</p><button onClick={() => start()} disabled={!matching.length} className="mt-5 w-full rounded-xl bg-burgundy-700 py-4 text-lg font-black text-white shadow-lg hover:bg-burgundy-800 disabled:opacity-40">Start Quiz</button></>}</section></div></Page>;
}
function Page({ children }: { children: ReactNode }) { return <main className="min-h-dvh bg-cream-50 px-4 py-8 text-gray-900 sm:px-6 sm:py-12"><div className="mx-auto mb-6 max-w-2xl"><Link to="/languages" className="text-sm font-semibold text-burgundy-800">← Language hub</Link></div>{children}</main>; }
