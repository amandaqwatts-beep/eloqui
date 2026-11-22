/**
 * GradedFeedback.tsx — the tiered feedback box for the graded-answer system
 * (owner ruling 2026-11-22; engine/answerGrades builds the verdict).
 *
 * Three tiers, one quiet scholarly voice:
 *   perfect  — the canonical form confirmed + trivia (an enrichment fact);
 *              never remediation. Trivia omitted gracefully when the captured
 *              pool has nothing for the item.
 *   accepted — technically correct, passed: helpful info (why it works /
 *              the captured entry note) + the most-correct form. Never a bare
 *              "Correct!".
 *   rejected — helpful info (mandatory) + the most-correct answer.
 *
 * Consumed by the shared answer-checker components when the phase-drill seam
 * supplies a graded checker; absent → the components render their legacy
 * feedback unchanged.
 */
import type { GradedAnswer } from "~/engine/answerGrades";

export default function GradedFeedback({ grade }: { grade: GradedAnswer }) {
  const boxClass = grade.correct
    ? "bg-green-50 border border-green-300 text-green-800"
    : "bg-red-50 border border-red-300 text-red-700";

  return (
    <div className={`rounded-xl p-4 text-sm font-medium leading-relaxed ${boxClass}`}>
      {grade.tier === "perfect" && (
        <p>
          ✅ <span className="font-bold">{grade.mostCorrect}</span> — correct.
        </p>
      )}
      {grade.tier === "accepted" && (
        <>
          <p>✓ Accepted.</p>
          {grade.helpfulInfo && <p>{grade.helpfulInfo}</p>}
          <p>
            Most correct form:{" "}
            <em className="font-bold">{grade.mostCorrect}</em>.
          </p>
        </>
      )}
      {grade.tier === "rejected" && (
        <>
          <p>✗ Not quite.</p>
          {grade.helpfulInfo && <p>{grade.helpfulInfo}</p>}
          {grade.mostCorrect && (
            <p>
              Most correct answer:{" "}
              <em className="font-bold">{grade.mostCorrect}</em>.
            </p>
          )}
        </>
      )}
      {grade.trivia && (
        <p className="mt-2 border-t border-green-200 pt-2 font-book text-xs italic leading-relaxed text-green-900/80">
          Aside: {grade.trivia}
        </p>
      )}
    </div>
  );
}
