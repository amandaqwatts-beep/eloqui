/**
 * CrossLanguageScreen.test.ts — smoke test for the per-language unlock gate.
 *
 * Verifies C2: 1007/1008 are gated by per-language progress read via
 * loadProgress (NOT the CROSS-scoped hasCompletedThrough). Tests the pure
 * `isRequirementMet` helper and the authored `requires[]` arrays.
 *
 * Self-contained (no bun:test import) so `tsc --noEmit` stays at its
 * 7-error baseline. Run with:
 *   bun src/screens/CrossLanguageScreen.test.ts
 */
import { isRequirementMet } from "~/screens/CrossLanguageScreen";
import { crossLanguageLessons } from "~/data/crossLanguageLessons";
import type { CrossLanguageRequirement } from "~/data/crossLanguageLessons";

type Progress = {
  lessonId: number;
  completed: boolean;
  bestScore: number;
  lastAttemptedAt: string | null;
  timesCompleted: number;
};

let pass = 0;
let fail = 0;
function check(cond: boolean, label: string): void {
  if (cond) { pass++; console.log(`(pass) ${label}`); }
  else { fail++; console.log(`(FAIL) ${label}`); }
}

const progress = (
  items: { lessonId: number; completed?: boolean }[],
): Progress[] =>
  items.map((i) => ({
    lessonId: i.lessonId,
    completed: i.completed ?? true,
    bestScore: 100,
    lastAttemptedAt: new Date().toISOString(),
    timesCompleted: 1,
  }));

const latin10: CrossLanguageRequirement = { language: "latin", minLessonId: 10 };
const english2004: CrossLanguageRequirement = { language: "english", minLessonId: 2004 };

// fresh profile: nothing completed
check(!isRequirementMet(latin10, progress([])), "fresh: latin 10 unmet");
check(!isRequirementMet(english2004, progress([])), "fresh: english 2004 unmet");

// latin through lesson 10 meets the latin side only
const latin = progress(Array.from({ length: 10 }, (_, i) => ({ lessonId: i + 1 })));
check(isRequirementMet(latin10, latin), "latin thru 10: latin gate met");
check(!isRequirementMet(english2004, progress([])), "latin thru 10: english gate still unmet");

// boundary
check(!isRequirementMet(latin10, progress([{ lessonId: 9 }])), "boundary: latin 9 < 10 unmet");
check(isRequirementMet(latin10, progress([{ lessonId: 10 }])), "boundary: latin 10 met");

// uncompleted entries never satisfy
check(
  !isRequirementMet(latin10, progress([{ lessonId: 14, completed: false }])),
  "uncompleted latin 14 does not satisfy the gate",
);

// authored requires[] arrays
const l1007 = crossLanguageLessons.find((l) => l.id === 1007)!;
check(
  l1007.requires.map((r) => r.minLessonId).join(",") === "10,2004",
  "1007 requires latin 10 + english 2004",
);
check(
  l1007.requires.every((r) => isRequirementMet(r, progress([{ lessonId: r.minLessonId }]))),
  "1007 gates met at exact mins",
);

const l1008 = crossLanguageLessons.find((l) => l.id === 1008)!;
check(
  l1008.requires.map((r) => r.minLessonId).join(",") === "10,2002",
  "1008 requires latin 10 + english 2002",
);
check(
  l1008.requires.every((r) => isRequirementMet(r, progress([{ lessonId: r.minLessonId }]))),
  "1008 gates met at exact mins",
);

// partial: latin only -> 1007 still locked (english 2004 missing)
check(
  !l1007.requires.every((r) => isRequirementMet(r, r.language === "latin" ? latin : progress([]))),
  "1007 locked when only latin thru 10 (english 2004 missing)",
);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
