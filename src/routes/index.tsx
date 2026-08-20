import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-burgundy-200/60 bg-cream-50/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-700 font-book text-lg text-cream-50">
            E
          </span>
          <span className="font-book text-2xl font-extrabold tracking-tight text-burgundy-900">
            Eloqui
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 sm:flex">
            <Link
              to="/languages"
              className="text-sm font-medium text-burgundy-700 transition hover:text-burgundy-900"
            >
              Courses
            </Link>
            <a
              href="/quizzer"
              className="hidden text-sm font-medium text-burgundy-700 transition hover:text-burgundy-900 md:inline"
            >
              Quizzers
            </a>
          </div>
          <Link
            to="/lessons/latin"
            className="rounded-lg bg-burgundy-700 px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-burgundy-800 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2"
          >
            Start Learning
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section id="top" className="library-wall relative overflow-hidden px-4 py-20 sm:py-28">
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="mb-4 inline-block rounded-full border border-burgundy-300 bg-cream-50/80 px-4 py-1.5 text-sm font-medium text-burgundy-700">
          🏛️ Latin 101 is live — 138 lessons · 14 units
        </span>
        <h1 className="font-book mt-4 text-4xl font-extrabold tracking-tight text-burgundy-900 sm:text-5xl lg:text-6xl">
          Learn to <span className="text-gold-600">think</span> in Latin.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-700 sm:text-xl">
          Eloqui is a grammar-first Latin course built on Henle's First Year
          Latin — 138 bite-sized lessons that take you from the first
          declension to reading real Latin. You won't just translate: you'll
          learn to think in the language.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/lessons/latin"
            className="inline-flex items-center gap-2 rounded-xl bg-burgundy-700 px-8 py-4 text-lg font-semibold text-cream-50 shadow-lg transition hover:bg-burgundy-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2"
          >
            Start Latin 101 Free
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a
            href="/lessons/english"
            className="inline-flex items-center gap-2 rounded-xl border border-burgundy-300 bg-cream-50/90 px-8 py-4 text-lg font-semibold text-burgundy-800 shadow-sm transition hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2"
          >
            Try the English course
          </a>
        </div>
        <p className="mt-6 text-sm text-gray-600">
          Free · No account required · Your progress stays on your device
        </p>
      </div>
    </section>
  );
}

const features = [
  {
    emoji: "🏛️",
    title: "Latin 101, complete",
    description:
      "138 lessons across 14 units, following Henle's First Year Latin — from the first declension to indirect statement.",
  },
  {
    emoji: "✍️",
    title: "English for formal writing",
    description:
      "A ten-lesson course in formal register and academic vocabulary — the words your essays and applications need.",
  },
  {
    emoji: "🤖",
    title: "AI Practice",
    description:
      "Fresh exercises generated from what you've learned, in every lesson — your reps never run out.",
  },
  {
    emoji: "🗡️",
    title: "Drills, placement & progress",
    description:
      "Find your level with a 268-question placement test, drill words and forms at speed, and track every weak spot.",
  },
  {
    emoji: "🔉",
    title: "Pronounced, not just printed",
    description:
      "Every word spoken aloud in Ecclesiastical or Classical Latin, with macrons and IPA to match.",
  },
  {
    emoji: "🏺",
    title: "Roman culture, taught",
    description:
      "Culture lessons on Roman life and history sit beside the grammar — taught first, then quizzed.",
  },
  {
    emoji: "🌙",
    title: "Sleep audio",
    description:
      "A night mode that reads your vocabulary and forms aloud while you drift off — passive review.",
  },
  {
    emoji: "📚",
    title: "A bookshelf, search & grammar",
    description:
      "Your progress becomes a library of Henle volumes; search the course and a 67-topic grammar index in seconds.",
  },
];

function InsideSection() {
  return (
    <section id="inside" className="bg-white px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-book text-3xl font-bold tracking-tight text-burgundy-900 sm:text-4xl">
            What's inside
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-600">
            Everything here is live today — nothing on this page is coming
            soon.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="book-panel p-7 transition hover:shadow-md"
            >
              <span className="text-4xl">{feature.emoji}</span>
              <h3 className="mt-4 text-lg font-bold text-burgundy-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const tracks = [
  {
    name: "Latin",
    emoji: "🏛️",
    chip: "Live",
    chipClass: "bg-gold-100 text-gold-800",
    href: "/lessons/latin",
    description:
      "The full 138-lesson Latin 101 course, Units 1–14, following Henle.",
  },
  {
    name: "English",
    emoji: "✍️",
    chip: "Live",
    chipClass: "bg-gold-100 text-gold-800",
    href: "/lessons/english",
    description:
      "A ten-lesson course in formal register and academic vocabulary.",
  },
  {
    name: "Biblical Greek",
    emoji: "🏺",
    chip: "Alphabet live · Course in development",
    chipClass: "bg-gray-100 text-gray-700",
    href: "/quizzer?language=greek",
    description:
      "A 52-character quizzer in Erasmian and Koine while the course is built.",
  },
  {
    name: "Biblical Hebrew",
    emoji: "📜",
    chip: "Alphabet live · Course in development",
    chipClass: "bg-gray-100 text-gray-700",
    href: "/quizzer?language=hebrew",
    description:
      "A 50-character quizzer in Traditional and Modern while the course is built.",
  },
];

function LanguageTracksSection() {
  return (
    <section id="languages" className="bg-cream-100 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-book text-3xl font-bold tracking-tight text-burgundy-900 sm:text-4xl">
            What you can learn today
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-600">
            Two live courses — and the alphabets of what's next.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tracks.map((track) => (
            <a
              key={track.name}
              href={track.href}
              className="book-panel p-7 transition hover:shadow-md"
            >
              <span className="text-4xl">{track.emoji}</span>
              <div className="mt-4 flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-burgundy-900">
                  {track.name}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${track.chipClass}`}
                >
                  {track.chip}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {track.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    emoji: "📖",
    title: "Learn",
    description:
      "Each lesson opens with one grammar concept taught in plain language with real examples — and every step is gated by a comprehension check before you move on.",
  },
  {
    emoji: "✏️",
    title: "Practice",
    description:
      "Seven to nine exercises per lesson across five formats: multiple choice, fill-in-the-blank, matching, reading passages, and culture questions.",
  },
  {
    emoji: "🎯",
    title: "Review that knows you",
    description:
      "Your mistakes build a personal model: review drills target the exact words and forms you get wrong, plus a daily worst-area lesson and an improvement streak.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how" className="bg-white px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-book text-3xl font-bold tracking-tight text-burgundy-900 sm:text-4xl">
            How Eloqui works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-600">
            Learn, practice, and review in a loop that adapts to you.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-burgundy-200/60 bg-cream-50 p-8 text-center shadow-sm transition hover:shadow-md"
            >
              <span className="text-5xl">{step.emoji}</span>
              <h3 className="mt-4 text-xl font-bold text-burgundy-900">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PedagogyBand() {
  return (
    <section className="bg-burgundy-800 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-book text-3xl font-bold tracking-tight text-cream-50 sm:text-4xl">
          Think in the language — don't just translate.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-burgundy-200">
          Most apps drill translation back and forth. Eloqui trains
          comprehension first: you learn to read Latin as Latin, from the very
          first declension — recognizing meaning first, then producing the
          language yourself, the way you'd learn a living language.
        </p>
      </div>
    </section>
  );
}

function WhoSection() {
  return (
    <section id="who" className="bg-cream-100 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="book-panel p-8 sm:p-12">
          <h2 className="font-book text-3xl font-bold tracking-tight text-burgundy-900 sm:text-4xl">
            Built for students of Latin.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">
            Eloqui follows Henle's First Year Latin, the classic classroom
            sequence, so it works alongside school Latin — or on its own, for
            high school, college, and self-taught readers. Work at your own
            pace; everything is free.
          </p>
          <ul className="mt-6 space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-burgundy-600">✓</span>
              Self-paced 5–10 min lessons
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-burgundy-600">✓</span>
              Real-time feedback on every answer
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-burgundy-600">✓</span>
              Progress and weak-spot stats on your device
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-burgundy-800 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-book text-3xl font-bold tracking-tight text-cream-50 sm:text-4xl">
          Start reading Latin today.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-burgundy-200">
          Free · No account required · Your progress stays on your device.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/lessons/latin"
            className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-8 py-4 text-lg font-semibold text-burgundy-950 shadow-lg transition hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-300 focus:ring-offset-2 focus:ring-offset-burgundy-800"
          >
            Start Latin 101 Free
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a
            href="/lessons/english"
            className="inline-flex items-center gap-2 rounded-xl border border-gold-400 px-8 py-4 text-lg font-semibold text-cream-50 transition hover:bg-burgundy-700 focus:outline-none focus:ring-2 focus:ring-gold-300 focus:ring-offset-2 focus:ring-offset-burgundy-800"
          >
            Try the English course
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-burgundy-200/60 bg-cream-50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-burgundy-700 font-book text-sm font-bold text-cream-50">
            E
          </span>
          <span className="font-book font-bold text-burgundy-800">Eloqui</span>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <nav className="flex items-center gap-4">
            <a href="/languages" className="transition hover:text-burgundy-800">
              Courses
            </a>
            <a href="/quizzer" className="transition hover:text-burgundy-800">
              Character Quizzers
            </a>
            <a href="/lessons/latin" className="transition hover:text-burgundy-800">
              Latin 101
            </a>
          </nav>
          <p>
            &copy; 2026 Eloqui &middot; Latin 101 &amp; English 101 live &middot; Biblical Greek &amp; Hebrew in development
          </p>
        </div>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <HeroSection />
      <InsideSection />
      <LanguageTracksSection />
      <HowItWorksSection />
      <PedagogyBand />
      <WhoSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
