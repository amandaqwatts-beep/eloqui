/**
 * Book2SectionSession.tsx — one captured Book 2 section, opened.
 *
 * Screens department: PRESENTATIONAL. The shell (Book2Shell) owns the session
 * state and the recording; this component renders the three phases the same
 * way Book 1's route does — with the SAME screens over the SAME data shapes:
 *
 *   opener    — a quiet paper page: what the section is, which grammar-index
 *               topics it trains (the Book-1 lesson → grammar-index link
 *               pattern), and Begin. No fabricated vocabulary or teaching
 *               steps: the captured exercises ARE the content.
 *   running   — ExerciseScreen, the existing exercise renderer (all exercise
 *               types already built), driven exactly like Book 1's "exercise"
 *               screen: one exercise at a time, onComplete per answer.
 *   complete  — a quiet close: the section's score, Run it again, Back to the
 *               book. Deliberately NOT LessonCompleteScreen: that panel's
 *               course framing ("Lesson N of M", Latin-101 copy, trophy
 *               artifice) belongs to Book 1's ladder, not to a book section
 *               (Minimalist Scholarly, plan rev 72 — no manufactured
 *               celebration).
 */
import type { Lesson } from "~/data/latinLessons";
import type { Latin2Part, Latin2Section } from "~/data/latin2";
import type { GrammarTopic } from "~/data/grammarIndex";
import type { PronMode } from "~/lib/pronunciation";
import NavBar from "~/components/NavBar";
import ExerciseScreen from "~/screens/ExerciseScreen";

export type Book2SessionPhase = "opener" | "running" | "complete";

interface Props {
  phase: Book2SessionPhase;
  section: Latin2Section;
  part: Latin2Part;
  /** The composed Lesson (lib/latin2Sections) — exercises the engine renders. */
  lesson: Lesson;
  /** The section's Henle Lesson number (1–16 on the review spine). */
  lessonNumber: number;
  /** Grammar-index topics this section trains, resolved and in section order. */
  grammarTopics: GrammarTopic[];
  /** Open the grammar index on a topic (the shell hosts the drawer). */
  onOpenGrammarTopic: (topicId: string) => void;
  pronMode: PronMode;
  /** Results so far (booleans in exercise order) — drives the close panel. */
  results: boolean[];
  onBegin: () => void;
  /** One exercise answered (same detail shape Book 1's route records). */
  onExerciseComplete: (correct: boolean) => void;
  /** Abandon the run — back to the book page (mid-run too, via Quit). */
  onExit: () => void;
  /** Restart the same section from exercise 1. */
  onRestart: () => void;
}

export default function Book2SectionSession({
  phase,
  section,
  part,
  lesson,
  lessonNumber,
  grammarTopics,
  onOpenGrammarTopic,
  pronMode,
  results,
  onBegin,
  onExerciseComplete,
  onExit,
  onRestart,
}: Props) {
  if (phase === "running") {
    // Belt-and-suspenders: the shell flips the phase in the same state commit
    // that records the last answer, so this window should never render.
    if (results.length >= lesson.exercises.length) return null;
    return (
      <ExerciseScreen
        lesson={lesson}
        exerciseIdx={results.length}
        lessonNumber={lessonNumber}
        pronMode={pronMode}
        onComplete={(detail) => onExerciseComplete(detail.correct)}
        onQuit={onExit}
      />
    );
  }

  if (phase === "complete") {
    const correct = results.filter(Boolean).length;
    const total = lesson.exercises.length;
    return (
      <div className="min-h-dvh flex flex-col">
        <NavBar />
        <main className="paper-desk flex-1 px-4 py-10 sm:px-6 sm:py-16">
          <div className="paper-page mx-auto max-w-xl p-6 text-center sm:p-10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-wood-700">
              {part.title}
              {section.folio != null ? ` · p. ${section.folio}` : ""}
            </p>
            <h1 className="paper-title mt-1 text-2xl">{section.title}</h1>
            <div className="paper-rule mx-auto mt-4 w-24" />
            <p className="paper-reading mt-6 text-4xl font-bold text-burgundy-700">
              {correct} <span className="text-2xl text-gray-400">of</span>{" "}
              {total}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {correct === total
                ? "Every exercise right — the section is yours."
                : "Section worked through — run it again any time; the exercises stay as the book sets them."}
            </p>
            <p className="font-book mt-4 text-xs italic text-gray-400">
              Completion recorded on your path.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onRestart}
                className="flex-1 rounded-lg border border-burgundy-200 bg-white px-4 py-2.5 text-sm font-semibold text-burgundy-800 transition hover:border-burgundy-400"
              >
                Run it again
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex-1 rounded-lg bg-burgundy-700 px-4 py-2.5 text-sm font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
              >
                Back to the book
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── opener ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <main className="paper-desk flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <div className="paper-page mx-auto max-w-2xl p-6 sm:p-10">
          <button
            type="button"
            onClick={onExit}
            className="text-sm font-semibold text-burgundy-800 transition hover:text-burgundy-600"
          >
            ← Back to the book
          </button>
          <p className="text-[10px] font-bold uppercase tracking-wider text-wood-700 mt-6">
            {part.title}
            {section.folio != null ? ` · p. ${section.folio}` : ""}
          </p>
          <h1 className="paper-title mt-1 text-3xl">{section.title}</h1>
          <div className="paper-rule mt-4" />
          <p className="mt-4 text-sm leading-relaxed text-gray-700">
            {lesson.exercises.length} exercise
            {lesson.exercises.length === 1 ? "" : "s"} from the book's own
            review lesson — captured as printed. They run one at a time; a
            flashcard asks for an honest self-rating, a written item checks
            your answer against the key.
          </p>

          {grammarTopics.length > 0 && (
            <section className="mt-6" aria-label="Grammar in this section">
              <h2 className="font-book text-sm font-bold text-burgundy-900">
                Grammar in this section
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                The grammar-index topics this lesson draws on — open any topic
                for its definition and Grammar reference.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {grammarTopics.map((topic) => (
                  <li key={topic.id}>
                    <button
                      type="button"
                      onClick={() => onOpenGrammarTopic(topic.id)}
                      className="rounded-lg border border-burgundy-200 bg-cream-50 px-3 py-1.5 text-xs font-semibold text-burgundy-800 transition hover:border-burgundy-400 hover:bg-cream-100"
                    >
                      {topic.topic}
                      <span className="ml-2 font-book font-normal italic text-gray-400">
                        §{topic.henleGrammarRef}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button
            type="button"
            onClick={onBegin}
            className="mt-8 w-full rounded-lg bg-burgundy-700 px-4 py-3 text-base font-semibold text-cream-50 shadow transition hover:bg-burgundy-800"
          >
            Begin the exercises
          </button>
        </div>
      </main>
    </div>
  );
}
