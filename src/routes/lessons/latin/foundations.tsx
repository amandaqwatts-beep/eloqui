/**
 * foundations.tsx — Grammar-basics Foundations module (beta deliverable #3).
 *
 * Presents src/data/grammarFoundations.ts (5 standard Lesson objects:
 * Alphabet / Vowels & Diphthongs / Consonants / Syllables & Division /
 * Quantity & Accent — Henle Grammar §§1–13) in order through the EXISTING
 * four-phase lesson flow. No new engine: the flow composes the engine's PURE
 * four-phase functions (applyPhaseAttempt / completeTaughtPhase /
 * resumePhaseFor / phaseScreen from engine/fourPhase) plus the existing
 * Screens-department screens (TeachingScreen, PhaseDrillScreen, LessonIntro,
 * LessonCompleteScreen). The route owns route-local UI state only — same
 * thin-orchestrator contract as latin/index.tsx.
 *
 * ⚠️ STORAGE ISOLATION (screens decision): Foundations lesson ids are 401–405
 * (lead hard gate: four-phase progress keys by String(lessonId) per language —
 * src/engine/storage.ts — so the original 1–5 would have collided with Latin 1).
 * Even with unique ids, this module persists under its own "verbum-foundations"
 * namespace and never touches progress.ts / storage.savePhaseState: Foundations
 * is a side module whose progress must not surface in the Latin course's
 * progress UI or unlock frontier. When Engine later generalizes the storage
 * layer (lead's "one write lane" plan), this file's local helpers are the
 * drop-in seam.
 *
 * Entry point: the thin-spine book on the Latin bookshelf
 * (src/components/FoundationsEntry.tsx → LessonMenu.foundationsEntry).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { grammarFoundationsLessons as lessons } from "~/data/grammarFoundations";
import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { PronMode } from "~/lib/pronunciation";
import {
  applyPhaseAttempt,
  completeTaughtPhase,
  phaseScreen,
  resumePhaseFor,
} from "~/engine/fourPhase";
import type { BugContext, FourPhaseRun, PhaseName, PhaseState } from "~/engine/types";
import { flushBugReports } from "~/lib/bugReport";
import BugReportDialog from "~/components/BugReportDialog";
import NavBar from "~/components/NavBar";

import TeachingScreen from "~/screens/TeachingScreen";
import PhaseDrillScreen from "~/screens/PhaseDrillScreen";
import LessonIntro from "~/screens/LessonIntro";
import LessonCompleteScreen from "~/screens/LessonCompleteScreen";

export const Route = createFileRoute("/lessons/latin/foundations")({
  component: FoundationsCourse,
});

/* ── Foundations-namespaced storage (see header ⚠️) ─────────────────────── */

const NS = "verbum-foundations";

function nsLoad<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${NS}:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function nsSave(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
  } catch {
    /* storage unavailable — progress simply doesn't persist */
  }
}

/** Same shape as engine/progress.ts LessonProgress (keeps components happy). */
interface GFProgress {
  lessonId: number;
  completed: boolean;
  bestScore: number;
  lastAttemptedAt: string | null;
  timesCompleted: number;
}

function loadFoundationsProgress(): GFProgress[] {
  return nsLoad<GFProgress[]>("progress", []);
}

function recordFoundationsProgress(lessonId: number, correct: number, attempts: number): void {
  const list = loadFoundationsProgress();
  const i = list.findIndex((p) => p.lessonId === lessonId);
  const best = attempts > 0 ? Math.max(0, Math.min(100, Math.round((correct / attempts) * 100))) : 0;
  if (i >= 0) {
    list[i] = {
      ...list[i],
      completed: true,
      bestScore: Math.max(list[i].bestScore, best),
      lastAttemptedAt: new Date().toISOString(),
      timesCompleted: list[i].timesCompleted + 1,
    };
  } else {
    list.push({
      lessonId,
      completed: true,
      bestScore: best,
      lastAttemptedAt: new Date().toISOString(),
      timesCompleted: 1,
    });
  }
  nsSave("progress", list);
}

function loadPhaseFor(lessonId: number): PhaseState {
  const all = nsLoad<Record<string, PhaseState>>("phase-state", {});
  return all[String(lessonId)] ?? { phases: {}, accuracyWindow: [], incorporatedConcepts: [] };
}

function savePhaseFor(lessonId: number, phaseState: PhaseState): void {
  const all = nsLoad<Record<string, PhaseState>>("phase-state", {});
  all[String(lessonId)] = phaseState;
  nsSave("phase-state", all);
}

/* ── Route-local four-phase flow (pure engine fns + namespaced storage) ─── */

type FlowScreen = "menu" | "intro" | "teaching" | "memorized" | "quizzed" | "incorporated" | "complete";

function useFoundationsFlow() {
  const total = lessons.length;
  const [screen, setScreen] = useState<FlowScreen>("menu");
  const [idx, setIdx] = useState(0);
  const [run, setRun] = useState<FourPhaseRun | null>(null);
  // Unlock frontier: each completed Foundations lesson unlocks the next.
  const [unlocked, setUnlocked] = useState<number>(() =>
    Math.min(Math.max(loadFoundationsProgress().length + 1, 1), total),
  );

  const current = lessons[Math.min(idx, total - 1)];

  /** Start (or resume) the four-phase run for lessons[i]. */
  const start = useCallback((i: number) => {
    const lesson = lessons[i];
    if (!lesson) return;
    const persisted = loadPhaseFor(lesson.id);
    const resume = resumePhaseFor(persisted);
    setIdx(i);
    setRun({
      lessonId: lesson.id,
      phase: resume,
      reviewMode: false,
      reTeachStepIndex: null,
      phaseState: persisted,
      seed: `gf|${lesson.id}|${new Date().toISOString().slice(0, 10)}`,
    });
    setScreen(resume === "taught" ? "teaching" : (phaseScreen(resume) as FlowScreen));
  }, []);

  const completeTeaching = useCallback(() => {
    if (!run || run.phase !== "taught") return;
    const next = completeTaughtPhase(run);
    savePhaseFor(next.lessonId, next.phaseState);
    setRun(next);
    setScreen("memorized");
  }, [run]);

  /** One drill-phase answer — mirrors useLessonEngine.recordPhaseAttempt. */
  const recordAttempt = useCallback(
    (correct: boolean, passingConcepts?: string[], reTeachStepIndex?: number | null) => {
      if (!run || run.phase === "taught") return;
      const { run: next, outcome } = applyPhaseAttempt(run, correct, {
        passingConcepts,
        reTeachStepIndex,
      });
      savePhaseFor(next.lessonId, next.phaseState);
      setRun(next);
      if (outcome === "complete") {
        // Lifetime drill tallies → namespaced progress; unlock the next lesson.
        const drill: readonly PhaseName[] = ["memorized", "quizzed", "incorporated"];
        let c = 0;
        let a = 0;
        for (const p of drill) {
          const rec = next.phaseState.phases[p];
          if (rec) {
            c += rec.correct;
            a += rec.attempts;
          }
        }
        recordFoundationsProgress(next.lessonId, c, a);
        if (idx + 1 < total) setUnlocked((u) => Math.max(u, idx + 2));
        setScreen("complete");
      } else if (outcome === "bounce") {
        // Re-teach-first ordering (design §1): a bounce to "taught" lands on
        // the teaching screen in reviewMode BEFORE re-entering the drills.
        setScreen(next.phase === "taught" ? "teaching" : (phaseScreen(next.phase) as FlowScreen));
      } else {
        setScreen(phaseScreen(next.phase) as FlowScreen);
      }
    },
    [run, idx, total],
  );

  const reset = useCallback(() => {
    setRun(null);
    setScreen("menu");
  }, []);

  const nextLesson = useCallback(() => {
    if (idx + 1 < total) start(idx + 1);
    else reset();
  }, [idx, total, start, reset]);

  return {
    screen,
    idx,
    current,
    lessonNumber: idx + 1,
    total,
    unlocked,
    run,
    start,
    completeTeaching,
    recordAttempt,
    reset,
    nextLesson,
    restart: () => start(idx),
  };
}

/* ── Component ──────────────────────────────────────────────────────────── */

function FoundationsCourse() {
  const flow = useFoundationsFlow();
  // Bug-report affordance (PR #78 pattern): this route owns its one dialog —
  // same BugReportDialog component, contexts reflect the phase being studied.
  const [bugContext, setBugContext] = useState<BugContext | null>(null);
  const openBugReport = useCallback((ctx: BugContext) => setBugContext(ctx), []);
  useEffect(() => {
    flushBugReports();
  }, []);
  const language: Language = "latin";
  const pronMode: PronMode = "ecclesiastical";

  switch (flow.screen) {
    case "menu":
      return (
        <div className="min-h-dvh flex flex-col">
          <NavBar />
          <main className="paper-desk flex-1 px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 text-center">
                <span className="text-5xl mb-3 block">✒️</span>
                <h1 className="text-3xl font-extrabold text-burgundy-900">
                  Foundations
                </h1>
                <p className="mt-2 text-gray-600">
                  Pronunciation basics from the Henle Grammar — alphabet,
                  vowels, consonants, syllables, and accent (§§1–13). Five
                  short lessons, in order.
                </p>
              </div>
              <div className="space-y-3">
                {lessons.map((l, i) => {
                  const locked = i >= flow.unlocked;
                  const done =
                    loadFoundationsProgress().find((p) => p.lessonId === l.id)?.completed ?? false;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => flow.start(i)}
                      disabled={locked}
                      className={`w-full text-left rounded-2xl border-2 p-5 transition ${
                        locked
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-burgundy-200 bg-white hover:border-burgundy-400 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                            locked
                              ? "bg-gray-200 text-gray-400"
                              : "bg-burgundy-100 text-burgundy-700"
                          }`}
                        >
                          {locked ? "🔒" : done ? "✓" : i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-base font-bold ${
                              locked ? "text-gray-400" : "text-burgundy-900"
                            }`}
                          >
                            {i + 1}. {l.title}
                          </h3>
                          {l.subtitle && (
                            <p className="mt-0.5 text-sm text-gray-500">{l.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-10 text-center">
                <a
                  href="/lessons/latin"
                  className="text-sm text-gray-400 transition hover:text-burgundy-600"
                >
                  ← Back to the Bookshelf
                </a>
              </div>
            </div>
          </main>
          {bugContext && (
            <BugReportDialog
              context={bugContext}
              language={language}
              onBack={() => setBugContext(null)}
            />
          )}
        </div>
      );

    case "teaching":
      return (
        <TeachingScreen
          lesson={flow.current as Lesson}
          lessonNumber={flow.lessonNumber}
          reviewMode={flow.run?.reviewMode}
          reTeachStepIndex={flow.run?.reTeachStepIndex}
          onComplete={flow.completeTeaching}
          onSkip={flow.reset}
          onExit={flow.reset}
          onReportBug={() =>
            openBugReport({
              screen: "teaching",
              lessonId: flow.current.id,
              lessonNumber: flow.lessonNumber,
              phase: "taught",
            })
          }
        />
      );

    case "intro":
      return (
        <LessonIntro
          lesson={flow.current as Lesson}
          totalLessons={flow.total}
          lessonNumber={flow.lessonNumber}
          pronMode={pronMode}
          onStart={() => flow.start(flow.idx)}
          onBack={flow.reset}
          onOpenAIPractice={() => {}}
          showAIPractice={false}
          onReportBug={() =>
            openBugReport({
              screen: "intro",
              lessonId: flow.current.id,
              lessonNumber: flow.lessonNumber,
            })
          }
        />
      );

    case "memorized":
    case "quizzed":
    case "incorporated": {
      const run = flow.run;
      if (!run || run.phase === "taught") return null;
      return (
        <PhaseDrillScreen
          key={`${flow.current.id}-${run.phase}`}
          phase={run.phase}
          lesson={flow.current as Lesson}
          run={run}
          pronMode={pronMode}
          onAttempt={(correct, reTeachStepIndex, passingConcepts) =>
            flow.recordAttempt(correct, passingConcepts, reTeachStepIndex)
          }
          onQuit={flow.reset}
          onReportBug={() =>
            openBugReport({
              screen: run.phase,
              lessonId: flow.current.id,
              lessonNumber: flow.lessonNumber,
              phase: run.phase,
            })
          }
        />
      );
    }

    case "complete":
      return (
        <LessonCompleteScreen
          lesson={flow.current as Lesson}
          totalLessons={flow.total}
          lessonNumber={flow.lessonNumber}
          isLastLesson={flow.idx >= flow.total - 1}
          correct={
            flow.run
              ? ["memorized", "quizzed", "incorporated"].reduce(
                  (s, p) => s + (flow.run!.phaseState.phases[p as PhaseName]?.correct ?? 0),
                  0,
                )
              : 0
          }
          total={
            flow.run
              ? ["memorized", "quizzed", "incorporated"].reduce(
                  (s, p) => s + (flow.run!.phaseState.phases[p as PhaseName]?.attempts ?? 0),
                  0,
                )
              : 0
          }
          onNext={flow.nextLesson}
          onRestart={() => flow.start(flow.idx)}
          onBack={flow.reset}
          onOpenAIPractice={() => {}}
          onOpenDrill={() => {}}
          showAIPractice={false}
          onReportBug={() =>
            openBugReport({
              screen: "complete",
              lessonId: flow.current.id,
              lessonNumber: flow.lessonNumber,
            })
          }
        />
      );
  }
}
