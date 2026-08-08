import { Link, createFileRoute } from "@tanstack/react-router";
import { LANGUAGES } from "~/data/languages";

export const Route = createFileRoute("/languages/")({ component: LanguagesPage });

function LanguagesPage() {
  return <main className="min-h-screen bg-cream-50 px-6 py-16 text-gray-900"><div className="mx-auto max-w-4xl"><Link to="/" className="text-sm font-semibold text-burgundy-800">← Eloqui</Link><h1 className="mt-8 text-4xl font-bold text-burgundy-900">Choose your language</h1><p className="mt-3 max-w-xl text-lg text-gray-600">Learn formal and academic languages through focused, interactive practice.</p><div className="mt-10 grid gap-5 sm:grid-cols-2">{Object.values(LANGUAGES).map((language) => <Link key={language.id} to={language.id === "latin" ? "/lessons/latin" : "/languages"} className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-burgundy-900">{language.name}</h2>{language.rtl && <span className="rounded-full bg-cream-100 px-3 py-1 text-xs">RTL</span>}</div><p className="mt-3 text-gray-600">{language.description}</p><span className="mt-6 inline-block text-sm font-semibold text-burgundy-700">{language.id === "latin" ? "Start learning →" : "Coming soon"}</span></Link>)}</div></div></main>;
}
