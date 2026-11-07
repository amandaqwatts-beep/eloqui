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
import {
  submitBugReport,
  loadBugReports,
  buildBugMailto,
  BUG_REPORT_EMAIL,
} from "~/lib/bugReport";
import type { BugReport } from "~/engine/types";
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
  // FIX-4 (owner directive 2026-11-07): DB-independent email path. delivery
  // status of the just-filed report — "sent" hides the fallback; "failed"
  // (the current DB-outage case) or still-unsent after the poll window shows
  // it. The queued report itself is unaffected and still retries on its own.
  const [delivery, setDelivery] = useState<"unknown" | "sent" | "failed">("unknown");
  const [filed, setFiled] = useState<BugReport | null>(null);
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
    const report = submitBugReport(captured, description, language);
    setFiled(report);
    setDone(true);
  };

  // Watch the filed report's delivery status for a short window. The server
  // attempt fails fast when the DB is unreachable (the current outage), so
  // the email fallback appears quickly; a slow-but-working network has the
  // full window to confirm "sent" before the fallback is offered.
  useEffect(() => {
    if (!done || !filed) return;
    const startedAt = Date.now();
    const POLL_MS = 1000;
    const WINDOW_MS = 8000;
    const timer = setInterval(() => {
      const status = loadBugReports().find((r) => r.id === filed.id)?.status;
      if (status === "sent") {
        setDelivery("sent");
        clearInterval(timer);
      } else if (status === "failed" || Date.now() - startedAt >= WINDOW_MS) {
        setDelivery("failed");
        clearInterval(timer);
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [done, filed]);

  const mailtoHref = filed ? buildBugMailto(filed) : "";

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
              {/* FIX-4 email fallback: when the server delivery failed (the
                  current database outage) or hasn't confirmed within the
                  watch window, offer the DB-independent path. The queued
                  report still retries on its own — this is an addition,
                  never a replacement. */}
              {delivery === "failed" && (
                <div className="mt-6 rounded-2xl border border-wood-200 bg-cream-50 p-5 text-left">
                  <p className="text-sm font-semibold text-burgundy-900">
                    Automatic delivery isn't getting through right now.
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    You can send this same report by email instead.
                  </p>
                  <a
                    href={mailtoHref}
                    className="mt-3 block w-full rounded-xl bg-burgundy-700 px-6 py-2.5 text-center text-sm font-bold text-cream-50 shadow transition hover:bg-burgundy-800"
                  >
                    Email this report instead
                  </a>
                  <p className="mt-2 text-center text-xs text-gray-500">
                    Prefer email anytime? Write to {BUG_REPORT_EMAIL}.
                  </p>
                </div>
              )}
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
