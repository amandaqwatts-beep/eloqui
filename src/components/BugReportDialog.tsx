/**
 * BugReportDialog.tsx — the one bug-report dialog (beta, owner directive
 * 2026-08-23). Two entry points render it with the context they know:
 *
 *  - SettingsScreen ("Report a problem" in a Feedback card), and
 *  - LessonMenu's desk-bar affordance (🪲) — 1 tap from the bookshelf.
 *
 * UX contract: auto-captured context shown compactly ("Lesson 34 · quizzed
 * phase"), optional short description, submit → quiet confirmation. The
 * report is queued locally BEFORE any network attempt (lib/bugReport.ts), so
 * a failed POST still leaves the report saved — the confirmation is honest
 * about local persistence either way (delivery retries in the background).
 */
import { useEffect, useRef, useState } from "react";
import { submitBugReport } from "~/lib/bugReport";
import type { BugContext } from "~/engine/types";
import type { Language } from "~/data/languages";
import WindowFrame from "~/components/WindowFrame";

interface Props {
  context: BugContext;
  language: Language;
  onBack: () => void;
}

/** Compact human summary of the auto-captured context. */
function contextLabel(ctx: Required<BugContext>): string {
  const bits: string[] = [];
  if (ctx.lessonNumber != null) bits.push(`Lesson ${ctx.lessonNumber}`);
  if (ctx.phase) bits.push(`${ctx.phase} phase`);
  if (ctx.exerciseId) bits.push(`exercise ${ctx.exerciseId}`);
  if (bits.length === 0 && ctx.screen) bits.push(ctx.screen);
  return bits.join(" · ");
}

export default function BugReportDialog({ context, language, onBack }: Props) {
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  const captured: Required<BugContext> = {
    screen: context.screen ?? null,
    lessonId: context.lessonId ?? null,
    lessonNumber: context.lessonNumber ?? null,
    phase: context.phase ?? null,
    exerciseId: context.exerciseId ?? null,
  };

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    // Queues locally first; server POST is fire-and-forget with retries —
    // the dialog never blocks on ( or lies about ) the network.
    submitBugReport(captured, description, language);
    setDone(true);
  };

  return (
    <WindowFrame title="Report a problem" onBack={onBack} variant="overlay">
      <main className="flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-xl">
          {done ? (
            <div className="rounded-3xl border border-burgundy-200 bg-white p-8 text-center shadow-lg">
              <div className="text-4xl">✅</div>
              <h2 className="mt-3 text-xl font-extrabold text-burgundy-900">
                Thanks — report filed
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Saved on this device and queued for delivery automatically.
              </p>
              <button
                type="button"
                onClick={onBack}
                className="mt-6 rounded-xl bg-burgundy-700 px-6 py-2.5 text-sm font-bold text-cream-50 shadow transition hover:bg-burgundy-800"
              >
                Back
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-burgundy-200 bg-white p-6 shadow-lg sm:p-8">
              <h2 className="text-xl font-extrabold text-burgundy-900">
                Something went wrong?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Tell us what happened — a short note helps, but it's optional.
              </p>
              {/* Auto-captured context, compact — no student effort required. */}
              <div className="mt-4 rounded-xl border border-wood-200 bg-cream-50 px-4 py-3 text-xs text-burgundy-800">
                <span className="font-bold uppercase tracking-widest text-gold-700">
                  Attached
                </span>
                <span className="ml-2">
                  {contextLabel(captured) || "current screen"}
                  {" · "}
                  {new Date().toLocaleString()}
                </span>
              </div>
              <textarea
                ref={textRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="What happened? (optional)"
                className="mt-4 w-full rounded-xl border-2 border-burgundy-200 bg-white px-4 py-3 text-sm text-burgundy-900 placeholder:text-gray-400 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20"
              />
              <div className="mt-2 text-right text-xs text-gray-400">
                {description.length}/500
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-xl border-2 border-burgundy-200 px-5 py-2.5 text-sm font-bold text-burgundy-700 transition hover:bg-burgundy-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-burgundy-700 px-6 py-2.5 text-sm font-bold text-cream-50 shadow transition hover:bg-burgundy-800"
                >
                  Send report
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </WindowFrame>
  );
}
