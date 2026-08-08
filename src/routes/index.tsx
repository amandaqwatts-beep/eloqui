import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-burgundy-200/60 bg-cream-50/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-burgundy-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-700 text-cream-50 text-lg">
            V
          </span>
          Verbum
        </Link>
        <a
          href="/lessons/latin"
          className="rounded-lg bg-burgundy-700 px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-burgundy-800 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2"
        >
          Try Free
        </a>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50 px-4 py-20 sm:py-28">
      {/* Decorative accent */}
      <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-burgundy-100/30 blur-3xl" />
      <div className="absolute -bottom-16 left-0 h-64 w-64 rounded-full bg-gold-200/30 blur-3xl" />
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="mb-4 inline-block rounded-full border border-burgundy-300 bg-burgundy-50 px-4 py-1.5 text-sm font-medium text-burgundy-700">
          Ancient languages for modern learners
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-burgundy-900 sm:text-5xl lg:text-6xl">
          Verbum — Ancient Languages,{" "}
          <span className="text-gold-700">Alive</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          A Duolingo-style learning experience for Latin, Biblical Hebrew, and
          Biblical Greek. Bite-sized lessons, gamified review, and audio
          pronunciation — designed for high school students who want to read
          the classics in the original.
        </p>
        <div className="mt-10">
          <a
            href="/lessons/latin"
            className="inline-flex items-center gap-2 rounded-xl bg-burgundy-700 px-8 py-4 text-lg font-semibold text-cream-50 shadow-lg transition hover:bg-burgundy-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2"
          >
            Try Latin 101 Free
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

const languages = [
  {
    name: "Latin",
    description:
      "The language of Caesar, Virgil, and Aquinas. Master the foundation of the Romance languages, unlock classical literature, and build vocabulary that powers law, medicine, and science.",
    whoFor: "Perfect for future lawyers, doctors, historians, and anyone who loves Roman civilization.",
    emoji: "🏛️",
    accent: "bg-burgundy-100 text-burgundy-800",
    border: "border-burgundy-300",
  },
  {
    name: "Biblical Hebrew",
    description:
      "Read the Old Testament in its original tongue. Learn the alphabet, grammar, and vocabulary of the Hebrew Bible — the language of Genesis, Psalms, and the Prophets.",
    whoFor: "Ideal for theology students, aspiring pastors, and anyone passionate about the ancient Near East.",
    emoji: "📜",
    accent: "bg-gold-100 text-gold-800",
    border: "border-gold-300",
  },
  {
    name: "Biblical Greek",
    description:
      "The language of the New Testament and the Septuagint. Dive into the Gospels and Pauline epistles as they were first written, and explore early Christian thought in Koine Greek.",
    whoFor: "For students of the New Testament, early church history, and classical philosophy.",
    emoji: "🏺",
    accent: "bg-blue-100 text-blue-800",
    border: "border-blue-300",
  },
];

function LanguagesSection() {
  return (
    <section id="languages" className="bg-white px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-burgundy-900 sm:text-4xl">
            What We Teach
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-600">
            Three ancient languages. One powerful method. Start reading real
            texts — faster than you'd think.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((lang) => (
            <div
              key={lang.name}
              className={`rounded-2xl border ${lang.border} bg-white p-8 shadow-sm transition hover:shadow-md`}
            >
              <span className="text-4xl">{lang.emoji}</span>
              <h3 className="mt-4 text-2xl font-bold text-burgundy-900">
                {lang.name}
              </h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                {lang.description}
              </p>
              <div
                className={`mt-5 rounded-lg ${lang.accent} px-4 py-2.5 text-sm font-medium`}
              >
                {lang.whoFor}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    emoji: "📝",
    title: "Bite-Sized Lessons",
    description:
      "Learn in 5–10 minute sessions. Each lesson focuses on one concept — a declension, a tense, a set of vocabulary — so you never feel overwhelmed.",
  },
  {
    emoji: "🏆",
    title: "Gamification",
    description:
      "Earn points, unlock achievements, and maintain your streak. Friendly competition keeps you motivated to learn every day.",
  },
  {
    emoji: "🧠",
    title: "Spaced Repetition",
    description:
      "Words and forms come back just before you'd forget them. Our system adapts to what you find easy and what you find hard.",
  },
  {
    emoji: "🔊",
    title: "Audio Pronunciation",
    description:
      "Hear every word spoken aloud. Build your ear for ancient languages with reconstructed pronunciation — so they feel like real, living tongues.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-cream-100 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-burgundy-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-600">
            The science of language learning, wrapped in a delightful
            experience.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-burgundy-200/60 bg-white p-7 text-center shadow-sm transition hover:shadow-md"
            >
              <span className="text-5xl">{step.emoji}</span>
              <h3 className="mt-4 text-lg font-bold text-burgundy-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudiencesSection() {
  return (
    <section id="audiences" className="bg-white px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-10 sm:grid-cols-2">
          {/* For Students */}
          <div className="rounded-2xl border border-burgundy-200/60 bg-cream-50 p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-burgundy-100 text-2xl">
              🎓
            </div>
            <h3 className="mt-4 text-2xl font-bold text-burgundy-900">
              For Students
            </h3>
            <p className="mt-3 leading-relaxed text-gray-600">
              Learn at your own pace, earn points and streaks, and actually
              enjoy studying ancient languages. Whether you're preparing for AP
              Latin, exploring theology, or just curious about the classics —
              Verbum makes it fun.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-burgundy-600">✓</span>
                Self-paced lessons that fit your schedule
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-burgundy-600">✓</span>
                Real-time feedback on every answer
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-burgundy-600">✓</span>
                Track your progress with detailed stats
              </li>
            </ul>
          </div>

          {/* For Teachers */}
          <div className="rounded-2xl border border-burgundy-200/60 bg-cream-50 p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-2xl">
              📚
            </div>
            <h3 className="mt-4 text-2xl font-bold text-burgundy-900">
              For Teachers
            </h3>
            <p className="mt-3 leading-relaxed text-gray-600">
              Bring ancient languages to life in your classroom. Assign lessons
              as homework, track student progress, and supplement your
              curriculum with interactive practice that students actually want
              to do.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gold-700">✓</span>
                Assign specific lessons and track completion
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gold-700">✓</span>
                View class-wide and per-student progress
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gold-700">✓</span>
                Aligned with common textbook curricula
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-burgundy-800 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-cream-50 sm:text-4xl">
          Ready to read the classics?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-burgundy-200">
          Start learning Latin today with our free introductory module. No
          account required.
        </p>
        <div className="mt-8">
          <a
            href="/lessons/latin"
            className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-8 py-4 text-lg font-semibold text-burgundy-950 shadow-lg transition hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-300 focus:ring-offset-2 focus:ring-offset-burgundy-800"
          >
            Try Latin 101 Free
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
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
        <div className="flex items-center gap-2 font-semibold text-burgundy-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-burgundy-700 text-cream-50 text-sm font-bold">
            V
          </span>
          Verbum
        </div>
        <p>
          &copy; 2026 Verbum &middot; More languages coming soon
        </p>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <HeroSection />
      <LanguagesSection />
      <HowItWorksSection />
      <AudiencesSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
