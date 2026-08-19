import { Link, createFileRoute } from "@tanstack/react-router";
import { LANGUAGES } from "~/data/languages";
import { crossLanguageLessons } from "~/data/crossLanguageLessons";
import { loadProgress } from "~/engine/progress";

export const Route = createFileRoute("/languages/")({ component: LanguagesPage });

function LanguagesPage() {
  return (
    <main className="min-h-screen bg-cream-50 px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="text-sm font-semibold text-burgundy-800">← Eloqui</Link>
        <h1 className="mt-8 text-4xl font-bold text-burgundy-900">Choose your language</h1>
        <p className="mt-3 max-w-xl text-lg text-gray-600">Learn formal and academic languages through focused, interactive practice.</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {Object.values(LANGUAGES).map((language) => (
            <Link
              key={language.id}
              to={language.hasPlacement ? `/lessons/${language.id}` as "/lessons/latin" | "/lessons/english" : "/languages"}
              className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-burgundy-900">{language.name}</h2>
                {language.rtl && <span className="rounded-full bg-cream-100 px-3 py-1 text-xs">RTL</span>}
              </div>
              <p className="mt-3 text-gray-600">{language.description}</p>
              <span className="mt-6 inline-block text-sm font-semibold text-burgundy-700">
                {language.hasPlacement ? "Start learning →" : "Coming soon"}
              </span>
              {language.hasCharacterQuizzer && (
                <span className="mt-4 block rounded-lg bg-gold-100 px-3 py-2 text-sm font-bold text-burgundy-800" onClick={(event) => event.preventDefault()}>
                  <Link to="/quizzer" search={{ language: language.id as "greek" | "hebrew" }}>📝 Character Quizzer</Link>
                </span>
              )}
            </Link>
          ))}

          {/* 🔗 Cross-Language Connections hub card (cross lessons 1007/1008) */}
          <Link
            to="/languages/connections"
            className="rounded-2xl border border-burgundy-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-burgundy-900">🔗 Cross-Language Connections</h2>
              <span className="rounded-full bg-burgundy-100 px-3 py-1 text-xs font-semibold text-burgundy-700">
                {unlockedCount()} of {crossLanguageLessons.length} unlocked
              </span>
            </div>
            <p className="mt-3 text-gray-600">Latin meets English: roots and grammar across the two courses.</p>
            <span className="mt-6 inline-block text-sm font-semibold text-burgundy-700">Open connections →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

/** Count cross-language lessons whose per-language gates are met (read-only). */
function unlockedCount(): number {
  return crossLanguageLessons.filter((lesson) =>
    lesson.requires.every((req) =>
      loadProgress(req.language).some((p) => p.completed && p.lessonId >= req.minLessonId),
    ),
  ).length;
}
