/**
 * RecitationScreen.tsx — Screens department: 🗣️ Speak (listen-and-repeat).
 *
 * Phase 2 of the speech-recitation feature (research/speech-recitation-design.md
 * §2 / §8 — Q1–Q8 ratified by lead). FREE core curriculum. Consumes the
 * engine session machine from Phase 1 (PR #45) exactly as the engine-feature
 * audit requires ("screens must actually consume them"): the ONLY session
 * state is `session` produced by createRecitationSession/rateRecitation —
 * there is NO parallel local state machine. Self-ratings NEVER write
 * DiagnosticEvents (spec §3.2); the only storage write is the dedicated
 * recordRecitationSession payload, fired once per session from an event
 * handler (Done view or back-navigation) — StrictMode-safe.
 *
 * Honesty contract (spec §2.4/§4): no strokes, no score, no percentage, no
 * timer pressure; the student is the judge; the repetitions are the point.
 *
 * The evaluator seam (spec §5) ships typed but unimplemented for Latin: when
 * an `evaluator` is passed AND browser ASR exists, the buttons are pre-filled
 * with an "auto-rated" suggestion the student confirms or overrides. Without
 * an evaluator the buttons appear unprefilled (byte-identical Latin path). No
 * asr.ts in this phase — self-rating only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "~/data/latinLessons";
import type { LatinMode } from "~/engine/ipaConverter";
import { latinToSpeechText } from "~/engine/speechText";
import { isTTSAvailable, speakOnce, stopSpeech } from "~/engine/speech";
import {
  buildRecitationItems,
  createRecitationSession,
  rateRecitation,
  type RecitationEvaluator,
  type RecitationItem,
  type RecitationSession,
  type RecitationSource,
  type SelfRating,
} from "~/engine/recitation";
import { recordRecitationSession, type RecitationSessionSummary } from "~/engine/storage";
import { RECITATION_DEFAULT_RATE, RECITATION_ONEND_FALLBACK_MS } from "~/data/settings";
import { splitSentences } from "~/components/ReadingPassage";
import WindowFrame from "~/components/WindowFrame";

type Phase = "setup" | "session" | "done";

interface Props {
  lessons: Lesson[];
  unlockedLessons: number;
  defaultLessonId: number;
  pronMode: LatinMode;
  onBack: () => void;
  /** ASR seam (spec §5) — v1 (Latin) passes nothing → pure self-rating. */
  evaluator?: RecitationEvaluator;
}

/** Ordered source chips; label = button text. */
const SOURCES: { key: RecitationSource; label: string }[] = [
  { key: "vocab", label: "Vocabulary" },
  { key: "sentence", label: "Sentences" },
  { key: "passage", label: "Passage" },
];

const RATING_LABELS: { rating: SelfRating; icon: string; label: string }[] = [
  { rating: "solid", icon: "🎯", label: "Good match" },
  { rating: "close", icon: "👍", label: "Almost" },
  { rating: "again", icon: "🔁", label: "Try again" },
];

/** Global-browser ASR feature check (spec §5) — zero references today. */
function asrAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

export default function RecitationScreen({
  lessons,
  unlockedLessons,
  defaultLessonId,
  pronMode,
  onBack,
  evaluator,
}: Props) {
  const available = useMemo(
    () => lessons.slice(0, Math.max(0, Math.min(unlockedLessons, lessons.length))),
    [lessons, unlockedLessons],
  );
  const [lessonId, setLessonId] = useState(() =>
    available.some((l) => l.id === defaultLessonId) ? defaultLessonId : (available[0]?.id ?? 1),
  );
  const [source, setSource] = useState<RecitationSource>("vocab");
  const [phase, setPhase] = useState<Phase>("setup");
  /** Only the engine session machine — no parallel rating state. */
  const [session, setSession] = useState<RecitationSession | null>(null);
  const [items, setItems] = useState<RecitationItem[]>([]);
  const [playing, setPlaying] = useState(false);
  /** Evaluator suggestion ("auto-rated" pre-fill) for the current line. */
  const [auto, setAuto] = useState<SelfRating | null>(null);
  const [ttsOk] = useState(() => isTTSAvailable());
  const [asr] = useState(() => asrAvailable());
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const recordedRef = useRef(false);
  const sessionRef = useRef<RecitationSession | null>(null);
  sessionRef.current = session;

  const lesson = useMemo(() => available.find((l) => l.id === lessonId) ?? available[0], [available, lessonId]);

  /** Per-source line counts for the current lesson (0 → chip disabled+reason). */
  const counts = useMemo(() => {
    if (!lesson) return { vocab: 0, sentence: 0, passage: 0, hasPassage: false, passageReason: "" };
    const ex = lesson.exercises.find((e) => e.type === "reading-passage");
    const passageLines = ex
      ? ex.passageLines && ex.passageLines.length > 0
        ? ex.passageLines
        : splitSentences(ex.passage)
      : [];
    return {
      vocab: lesson.vocabulary?.length ?? 0,
      sentence: lesson.teachingSteps?.length ?? 0,
      passage: passageLines.length,
      hasPassage: Boolean(ex),
      passageReason: ex ? "" : "This lesson has no reading passage",
    };
  }, [lesson]);

  /** If the current lesson can't fill the selected source, hop to the first
   *  available one (never let a disabled source stay selected). */
  useEffect(() => {
    if (counts[source] > 0) return;
    const first = SOURCES.find((s) => counts[s.key] > 0);
    if (first) setSource(first.key);
  }, [source, counts]);

  /** Play the model line through the engine's speakOnce (mode-matched
   *  grapheme string, RECITATION_DEFAULT_RATE, onEnd) + a screen-level
   *  RECITATION_ONEND_FALLBACK_MS belt-and-braces. releasing `playing` once. */
  const playLine = useCallback(
    (text: string) => {
      if (!ttsOk) return;
      stopSpeech();
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = undefined;
      }
      setPlaying(true);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (fallbackTimer.current) {
          clearTimeout(fallbackTimer.current);
          fallbackTimer.current = undefined;
        }
        setPlaying(false);
      };
      fallbackTimer.current = setTimeout(finish, RECITATION_ONEND_FALLBACK_MS);
      speakOnce(latinToSpeechText(text, pronMode), {
        language: "latin",
        mode: pronMode,
        rate: RECITATION_DEFAULT_RATE,
        onEnd: finish,
      });
    },
    [pronMode, ttsOk],
  );

  /** Auto-play the current line whenever the session lands on one
   *  (start, advance, recite-again). The evaluator effect below resets the
   *  auto-suggestion on the same session transitions. */
  useEffect(() => {
    if (phase !== "session" || !session || session.done) return;
    const item = items[session.index];
    if (!item) return;
    playLine(item.text);
  }, [phase, session, items, playLine]);

  // Evaluator seam: when set AND ASR exists, pre-fill the rating buttons with
  // a suggestion tagged "auto-rated" (student confirms/overrides). Never runs
  // on the Latin v1 path (evaluator undefined → byte-identical self-rating).
  useEffect(() => {
    if (!evaluator || !asr || phase !== "session" || !session || session.done) return;
    const idx = session.index;
    const item = items[idx];
    if (!item) return;
    setAuto(null);
    let stale = false;
    evaluator(item).then((suggested) => {
      if (stale) return;
      const s = sessionRef.current;
      if (!s || s.done || s.index !== idx) return;
      setAuto(suggested);
    });
    return () => {
      stale = true;
    };
  }, [evaluator, asr, phase, session, items]);

  /** Fired once per session (recordedRef guard) from event handlers only. */
  const recordSummary = useCallback(
    (finalSession: RecitationSession) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      const summary: RecitationSessionSummary = {
        date: new Date().toISOString(),
        lessonId: lesson?.id ?? items[0]?.lessonId ?? 0,
        source,
        lineCount: items.length,
        solid: finalSession.results.filter((r) => r === "solid").length,
        close: finalSession.results.filter((r) => r === "close").length,
        again: finalSession.results.filter((r) => r === "again").length,
      };
      recordRecitationSession(summary, "latin");
    },
    [items, lesson, source],
  );

  const start = () => {
    if (!lesson || !ttsOk || counts[source] === 0) return;
    const built = buildRecitationItems({ lesson, source, mode: pronMode });
    if (built.length === 0) return; // never an empty session (chips gate it too)
    recordedRef.current = false;
    setItems(built);
    setSession(createRecitationSession(built));
    setPhase("session");
  };

  /** Almost / Good advance — record + advance via the engine machine. */
  const rate = (rating: SelfRating) => {
    if (!session || session.done) return;
    const next = rateRecitation(session, rating, items.length);
    setSession(next);
    if (next.done) {
      setAuto(null);
      recordSummary(next);
      setPhase("done");
    }
  };

  /** Try again — replay the line, no advance: the student re-speaks and
   *  re-rates (rateRecitation's index-assignment REPLACES the prior rating
   *  for that line when they commit — spec §2.3). Repetition is the point. */
  const tryAgain = () => {
    if (!session || session.done) return;
    const item = items[session.index];
    if (!item) return;
    setAuto(null);
    playLine(item.text);
  };

  /** Replay the current line — overlap-safe (speech.ts cancels first). */
  const replay = () => {
    if (!session || session.done) return;
    const item = items[session.index];
    if (item) playLine(item.text);
  };

  /** Re-run the ASR evaluator on the current line (🎙️ Listen). */
  const listen = () => {
    if (!evaluator || !asr || !session || session.done) return;
    const idx = session.index;
    const item = items[idx];
    if (!item) return;
    setAuto(null);
    evaluator(item).then((suggested) => {
      const s = sessionRef.current;
      if (!s || s.done || s.index !== idx) return;
      setAuto(suggested);
    });
  };

  const handleBack = () => {
    // Back mid-session: record a partial summary once (spec §6.2 — partial
    // summaries are fine; the honest signal is the repetitions attempted).
    if (phase === "session" && session && !session.done && !recordedRef.current) {
      recordSummary(session);
    }
    stopSpeech();
    onBack();
  };

  const reciteAgain = () => {
    if (items.length === 0) return;
    recordedRef.current = false;
    setSession(createRecitationSession(items));
    setPhase("session");
  };

  const current: RecitationItem | undefined = session && !session.done ? items[session.index] : undefined;

  return (
    <WindowFrame title="Speak" onBack={handleBack} variant="overlay">
      <main className="px-4 py-8 text-burgundy-900">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-black">🗣️ Recitation</h1>

          {phase === "setup" && (
            <div className="mt-5 space-y-4">
              <p className="rounded-xl bg-cream-50 p-3 text-sm leading-relaxed text-burgundy-800">
                Speak each line aloud — you're the judge. The point is the repetitions, not the score.
              </p>

              <label className="block font-bold">
                Lesson
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(+e.target.value)}
                  className="mt-1 w-full rounded-lg border border-burgundy-200 bg-white p-3"
                >
                  {available.map((l, i) => (
                    <option key={l.id} value={l.id}>
                      Lesson {i + 1}: {l.title}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="block font-bold">Lines</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SOURCES.map((s) => {
                    const n = counts[s.key];
                    const why = s.key === "passage" ? counts.passageReason
                      : s.key === "sentence" ? "This lesson has no example sentences"
                      : "This lesson has no vocabulary";
                    const disabled = n === 0;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSource(s.key)}
                        title={disabled ? why : `${n} line${n === 1 ? "" : "s"}`}
                        className={`rounded-xl border-2 px-4 py-2 font-semibold transition ${
                          source === s.key && !disabled
                            ? "border-gold-500 bg-gold-100 text-burgundy-900"
                            : disabled
                              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                              : "border-burgundy-200 bg-white text-burgundy-700 hover:border-gold-400"
                        }`}
                      >
                        {s.label}
                        {!disabled && <span className="ml-1.5 text-xs font-normal text-gray-500">({n})</span>}
                      </button>
                    );
                  })}
                </div>
                {SOURCES.filter((s) => counts[s.key] === 0).map((s) => (
                  <p key={s.key} className="mt-1 text-xs text-gray-400">
                    {s.label}: {s.key === "vocab" ? "this lesson has no vocabulary" : s.key === "sentence" ? "this lesson has no example sentences" : "this lesson has no reading passage"}
                  </p>
                ))}
              </div>

              <p className="text-sm text-gray-500">
                Pronunciation: <span className="font-bold">{pronMode === "classical" ? "Classical" : "Ecclesiastical"}</span>
              </p>

              {ttsOk ? (
                <button
                  type="button"
                  onClick={start}
                  disabled={!lesson || counts[source] === 0}
                  className="w-full rounded-xl bg-burgundy-700 py-4 text-lg font-black text-white shadow-lg transition hover:bg-burgundy-800 disabled:opacity-40"
                >
                  ▶ Start
                </button>
              ) : (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <span className="font-bold">🔇 Speech isn't available in this browser.</span>{" "}
                  Recitation needs text-to-speech to play the model lines. Try this lesson in Chrome, Edge, or Safari.
                </div>
              )}
            </div>
          )}

          {phase === "session" && current && session && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-burgundy-700">
                Line {session.index + 1} of {items.length}
              </p>
              <div className="mt-3 rounded-3xl border-2 border-burgundy-300 bg-burgundy-50 p-6 text-center shadow">
                <p className="text-3xl font-black leading-snug text-burgundy-900">{current.text}</p>
                {current.translation && (
                  <p className="mt-2 text-sm text-burgundy-600">{current.translation}</p>
                )}
                {current.ipa && (
                  <p className="mt-3 font-mono text-sm tracking-wide text-burgundy-500">/{current.ipa}/</p>
                )}
              </div>

              <p className="mt-4 text-center font-bold text-burgundy-800">
                {playing ? "🎧 Listening…" : "🗣️ Your turn — say it aloud"}
              </p>

              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={replay}
                  title="Hear the line again"
                  className="rounded-xl border-2 border-burgundy-200 bg-white px-4 py-2 font-semibold text-burgundy-700 transition hover:border-gold-400"
                >
                  🔁 Replay
                </button>
                <button
                  type="button"
                  onClick={replay}
                  title="Hear the model once more to compare with your attempt"
                  className="rounded-xl border-2 border-burgundy-200 bg-white px-4 py-2 font-semibold text-burgundy-700 transition hover:border-gold-400"
                >
                  🔊 Compare
                </button>
                {evaluator && asr && (
                  <button
                    type="button"
                    onClick={listen}
                    title="Have the speech engine suggest a rating"
                    className="rounded-xl border-2 border-purple-200 bg-purple-50 px-4 py-2 font-semibold text-purple-700 transition hover:border-purple-400"
                  >
                    🎙️ Listen
                  </button>
                )}
              </div>

              <p className="mt-6 text-center text-sm font-semibold text-burgundy-700">
                How did it match?
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {RATING_LABELS.map((r) => {
                  const suggested = auto === r.rating;
                  const advance = r.rating !== "again";
                  return (
                    <button
                      key={r.rating}
                      type="button"
                      disabled={playing}
                      onClick={() => (advance ? rate(r.rating) : tryAgain())}
                      title={
                        r.rating === "again"
                          ? "Hear the line again and try once more (no advance — the repetition is the practice)."
                          : "Rating recorded; the session moves on."
                      }
                      className={`rounded-xl border-2 p-3 font-semibold transition disabled:opacity-40 ${
                        suggested
                          ? "border-purple-300 bg-purple-100 text-purple-800"
                          : "border-burgundy-200 bg-white text-burgundy-800 hover:border-gold-400"
                      }`}
                    >
                      <span className="block text-xl">{r.icon}</span>
                      <span className="mt-1 block text-xs sm:text-sm">{r.label}</span>
                      {r.rating === "again" && (
                        <span className="mt-0.5 block text-[10px] font-normal text-gray-500">try once more</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {auto && (
                <p className="mt-2 text-center text-xs text-purple-600">
                  🎙️ Auto-rated suggestion — confirm it or pick your own; you're still the judge.
                </p>
              )}
            </div>
          )}

          {phase === "done" && session && (
            <div className="mt-5 rounded-3xl border border-burgundy-200 bg-white p-7 text-center shadow">
              <p className="text-lg leading-relaxed text-burgundy-900">{doneCopy(items.length, session)}</p>
              <p className="mt-2 text-xs text-gray-400">No score — the practice is the repetition.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={reciteAgain}
                  className="rounded-xl bg-burgundy-700 px-6 py-3 font-bold text-white transition hover:bg-burgundy-800"
                >
                  🔁 Recite again
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-xl border-2 border-burgundy-200 px-6 py-3 font-bold text-burgundy-700 transition hover:border-gold-400"
                >
                  Back to Lessons
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">
            Self-rating only in this phase — the app can't hear you; you hear yourself.
          </p>
        </div>
      </main>
    </WindowFrame>
  );
}

/** Descriptive done-view copy: counts, never a score (spec §2.4). */
function doneCopy(total: number, s: RecitationSession): string {
  if (total === 0) return "Nothing to recite in this lesson yet.";
  const solid = s.results.filter((r) => r === "solid").length;
  const close = s.results.filter((r) => r === "close").length;
  const again = s.results.filter((r) => r === "again").length;
  const chunks: string[] = [];
  if (solid > 0) chunks.push(`${solid} felt solid`);
  if (close > 0) chunks.push(`${close} felt close`);
  if (again > 0) chunks.push(`${again} to try again`);
  const detail = chunks.length
    ? chunks.length > 1
      ? `${chunks.slice(0, -1).join(", ")} and ${chunks[chunks.length - 1]}`
      : chunks[0]
    : "all of it rated";
  return `You recited ${total} ${total === 1 ? "line" : "lines"} — ${detail}. Repetition does the work.`;
}