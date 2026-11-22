/**
 * Book2SectionSession.tsx — one captured Book 2 section, opened: the
 * four-phase loop (PR-B of the Book-2 four-phase wrap).
 *
 * OWNER DIRECTIVE (2026-11-21): the four-phase system — taught → memorized →
 * quizzed → incorporated — over live-generated instances; captured spine items
 * are SPECS ONLY. The section therefore no longer runs its captured exercise
 * list verbatim (the old single-pass ExerciseScreen flow). It opens through
 * the SAME four-phase loop Book 1 runs, with the SAME mastery gates, bounce
 * rule (2 consecutive fails OR <70% over the last 5) and return-to-previous-
 * phase behavior — one engine, same state machine (engine/fourPhase.ts):
 *
 *   taught       — the quiet opener, now the taught phase: the section's
 *                  printed vocabulary universe (LATIN2_SECTION_VOCAB) and its
 *                  grammar-index topics are presented — what the book itself
 *                  teaches before its exercises. Begin = PHASE_TEACH_COMPLETE.
 *   drill phases — PhaseDrillScreen (the shared loop screen), batched from
 *                  the PR-A spec registry via latin2BatchForDrill: memorized
 *                  drills the section's vocab universe; quizzed draws
 *                  translate/parse specs; incorporated draws the production
 *                  specs. Exercises generate fresh each session — never the
 *                  textbook's own items.
 *   complete     — the quiet close (phase tallies, Run it again, Back to the
 *                  book). Deliberately NOT LessonCompleteScreen: that panel's
 *                  course framing belongs to Book 1's ladder (Minimalist
 *                  Scholarly, plan rev 72 — no manufactured celebration).
 *
 * The shell (Book2Shell) owns the FourPhaseRun state and the recording; this
 * component is presentational. On a memorized→taught bounce the opener re-
 * presents with a review note (no teachingSteps exist here — the vocab page
 * IS the teach; re-reading it is the re-teach).
 */
import { useCallback } from "react";
import type { Latin2Part, Latin2Section } from "~/data/latin2";
import type { Lesson } from "~/data/latinLessons";
import type { GrammarTopic } from "~/data/grammarIndex";
import type { FourPhaseRun } from "~/engine/types";
import { latin2BatchForDrill } from "~/engine/latin2SectionFourPhase";
import { latin2SpineVocabThrough } from "~/engine/latin2SectionSpecs";
import { sumPhaseTallies } from "~/screens/phaseDrillUtil";
import NavBar from "~/components/NavBar";
import PhaseDrillScreen from "~/screens/PhaseDrillScreen";
import type { PronMode } from "~/lib/pronunciation";

interface Props {
  section: Latin2Section;
  part: Latin2Part;
  /** The composed Lesson (lib/latin2Sections) — passed through to the loop
   *  screen; its exercises are SPECS and are never rendered verbatim. */
  lesson: Lesson;
  /** The section's Henle Lesson number (1–16 on the review spine). */
  lessonNumber: number;
  /** The live four-phase run — its `phase` picks the surface below. */
  run: FourPhaseRun;
  /** True once incorporated passed and the completion was recorded. */
  complete: boolean;
  /** Grammar-index topics this section trains, resolved and in section order. */
  grammarTopics: GrammarTopic[];
  /** Open the grammar index on a topic (the shell hosts the drawer). */
  onOpenGrammarTopic: (topicId: string) => void;
  pronMode: PronMode;
  /** taught → memorized (PHASE_TEACH_COMPLETE — the shell calls
   *  completeTaughtPhase). */
  onBegin: () => void;
  /** One drill answer (same detail shape Book 1's route records:
   *  applyPhaseAttempt + completion when the outcome is "complete"). */
  onAttempt: (
    correct: boolean,
    reTeachStepIndex?: number | null,
    passingConcepts?: string[],
  ) => void;
  /** Abandon the run — back to the book page (mid-run too). */
  onExit: () => void;
  /** Restart the section from the taught phase (fresh run). */
  onRestart: () => void;
  /** Beta bug-report affordance: 🪲 on every session surface — the shell
   *  renders the one BugReportDialog. Optional; absent → no affordance. */
  onReportBug?: () => void;
}

/** The printed gloss readably displayed on the taught page: alternates' curly
 *  braces are capture artifacts (the book prints plain glosses). */
function displayGloss(english: string): string {
  return english.replace(/[{}]/g, "").trim();
}

export default function Book2SectionSession({
  section,
  part,
  lesson,
  lessonNumber,
  run,
  complete,
  grammarTopics,
  onOpenGrammarTopic,
  pronMode,
  onBegin,
  onAttempt,
  onExit,
  onRestart,
  onReportBug,
}: Props) {
  const sectionId = section.id;

  // The loop's batch source: the PR-A spec registry over this section's
  // specs + vocab universe (engine/latin2SectionFourPhase). The drill screen
  // re-seeds per batch (batchSeed = `${run.seed}|batch:n`); the adapter maps
  // that onto the registry chain `phase|sectionId|date|batch:n|spec:<id>`.
  const generateBatch = useCallback(
    (phaseRun: FourPhaseRun, batchSeed: string, count: number) =>
      latin2BatchForDrill(sectionId, phaseRun, batchSeed, count),
    [sectionId],
  );

  // ── complete — the quiet close ──────────────────────────────────────────
  if (complete) {
    const tally = sumPhaseTallies(run);
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
              {tally.correct}{" "}
              <span className="text-2xl text-gray-400">of</span> {tally.attempts}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {tally.attempts > 0 && tally.correct === tally.attempts
                ? "Every answer right — the section is yours."
                : "Section mastered — run it again any time; the exercises generate fresh from the section's specifications each run."}
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
            {onReportBug && (
              <button
                type="button"
                onClick={onReportBug}
                className="mt-4 text-xs text-wood-800 transition hover:text-burgundy-700"
              >
                🪲 Report a problem
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── drill phases — the shared four-phase loop screen ────────────────────
  if (run.phase !== "taught") {
    return (
      <PhaseDrillScreen
        key={run.phase}
        phase={run.phase}
        lesson={lesson}
        run={run}
        pronMode={pronMode}
        generateBatch={generateBatch}
        lessonLabel={`Exercise ${lessonNumber}`}
        onAttempt={onAttempt}
        onQuit={onExit}
        onReportBug={onReportBug}
      />
    );
  }

  // ── taught — the opener: the section's vocab universe, presented ────────
  const { sectionVocab } = latin2SpineVocabThrough(sectionId);
  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <main className="paper-desk flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <div className="paper-page mx-auto max-w-2xl p-6 sm:p-10">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onExit}
              className="text-sm font-semibold text-burgundy-800 transition hover:text-burgundy-600"
            >
              ← Back to the book
            </button>
            {onReportBug && (
              <button
                type="button"
                onClick={onReportBug}
                className="text-sm text-wood-800 transition hover:text-burgundy-700"
              >
                🪲 Report
              </button>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-wood-700 mt-6">
            {part.title}
            {section.folio != null ? ` · p. ${section.folio}` : ""}
          </p>
          <h1 className="paper-title mt-1 text-3xl">{section.title}</h1>
          <div className="paper-rule mt-4" />
          <p className="mt-4 text-sm leading-relaxed text-gray-700">
            Exercises are generated fresh each session from the book's own
            specifications — this section's vocabulary, forms, and
            constructions; never the textbook's printed answer key. The
            section runs in four phases: study the vocabulary below, drill it
            from memory, quiz the translation and parsing, then produce the
            forms and constructions yourself.
          </p>
          {run.reviewMode && (
            <p className="mt-3 rounded-lg border border-burgundy-200 bg-cream-100 px-3 py-2 text-xs text-wood-800">
              Review — the drill loop returned you here. Re-read the section's
              vocabulary, then begin again when ready.
            </p>
          )}

          {sectionVocab.length > 0 && (
            <section className="mt-6" aria-label="This section's vocabulary">
              <h2 className="font-book text-sm font-bold text-burgundy-900">
                This section's vocabulary
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                The printed vocabulary the section teaches — the pool the
                drills draw from.
              </p>
              <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {sectionVocab.map((v) => (
                  <div
                    key={v.latin}
                    className="flex flex-wrap items-baseline gap-x-2 border-b border-wood-100 pb-1.5"
                  >
                    <dt className="font-book text-sm font-semibold text-burgundy-950">
                      {v.latin}
                    </dt>
                    <dd className="text-xs text-gray-600">
                      {displayGloss(v.english)}
                      {v.type ? ` · ${v.type}` : ""}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {grammarTopics.length > 0 && (
            <section className="mt-6" aria-label="Grammar in this section">
              <h2 className="font-book text-sm font-bold text-burgundy-900">
                Grammar in this section
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                The grammar-index topics this section draws on — open any topic
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
            {run.reviewMode ? "Begin the drills again" : "Begin the section"}
          </button>
        </div>
      </main>
    </div>
  );
}
