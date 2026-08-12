import type { ReactNode } from "react";
import type { DailyWorstLesson } from "~/engine/dailyLesson";
import type { ImprovementStreakResult } from "~/engine/improvementStreak";
import { IMPROVEMENT_ACTIVE_DAYS } from "~/data/settings";

/**
 * ProficiencyCards — screens-owned presentational cards that mount into the
 * LessonMenu `menuCards` slot (Bookshelf v2). The route computes all data and
 * passes plain props; these components never import engine logic.
 *
 * 1. DailyLessonCard — today's one remediation lesson (getDailyWorstLesson).
 * 2. BonusLessonCard — the improvement-streak bonus drill entitlement
 *    (getImprovementStreak + claimBonusDrill).
 *
 * Copy follows the build brief (§2) and the ratified specs verbatim.
 */

export function DailyLessonCard({
  dailyLesson,
  completed,
  onOpen,
}: {
  dailyLesson: DailyWorstLesson | null;
  completed: boolean;
  onOpen: () => void;
}) {
  if (!dailyLesson) {
    // Muted empty state — effectively unreachable (both routes floor
    // unlockedLessons at 1), but required by contract (brief §1.1).
    return (
      <div className="rounded-2xl border border-burgundy-100 bg-cream-50 p-4 opacity-60">
        <p className="text-sm font-bold text-burgundy-800">📈 Today's Lesson</p>
        <p className="mt-1 text-sm text-gray-500">
          Complete a few lessons and we'll pick today's target automatically.
        </p>
      </div>
    );
  }
  return (
    <button
      onClick={onOpen}
      className="rounded-2xl border-2 border-burgundy-200 bg-white p-4 text-left shadow-sm transition hover:border-burgundy-400 hover:bg-cream-50"
    >
      <p className="text-sm font-bold text-burgundy-800">🎯 Today's Lesson</p>
      <p className="mt-1 text-sm text-gray-600">
        {dailyLesson.reason}
        {completed
          ? " You've completed this one — review it to lock it in."
          : ""}
      </p>
    </button>
  );
}

export function BonusLessonCard({
  streak,
  claimable,
  onClaim,
}: {
  streak: ImprovementStreakResult;
  claimable: boolean;
  onClaim: () => void;
}) {
  const { state, streakDays, nextMilestone, bonusClaimedToday } = streak;

  let body: ReactNode;
  if (bonusClaimedToday) {
    body = (
      <p className="mt-1 text-sm text-gray-600">
        ✓ Bonus lesson claimed today — come back tomorrow.
      </p>
    );
  } else if (state === "none") {
    body = (
      <p className="mt-1 text-sm text-gray-600">
        Complete lessons daily and improve to earn bonus lessons.
      </p>
    );
  } else if (state === "building") {
    body = (
      <p className="mt-1 text-sm text-gray-600">
        📈 {IMPROVEMENT_ACTIVE_DAYS - streakDays} more improved day(s) until
        your bonus lesson.
      </p>
    );
  } else {
    body = (
      <>
        <p className="mt-1 text-sm text-gray-600">
          ⭐ Bonus lesson: {streakDays}-day improvement streak — review your
          weakest words.
        </p>
        {nextMilestone !== null && nextMilestone > IMPROVEMENT_ACTIVE_DAYS && (
          <p className="mt-1 text-xs font-semibold text-gold-700">
            {nextMilestone}-day streak = tougher drills.{" "}
            {nextMilestone - streakDays} more days.
          </p>
        )}
        {claimable && (
          <button
            onClick={onClaim}
            className="mt-3 rounded-xl bg-burgundy-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-burgundy-800"
          >
            Start
          </button>
        )}
      </>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-gold-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-burgundy-800">⭐ Bonus Lesson</p>
      {body}
    </div>
  );
}
