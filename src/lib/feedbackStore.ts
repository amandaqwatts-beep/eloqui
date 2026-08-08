/**
 * feedbackStore.ts — re-export shim.
 *
 * saveFeedback (and the FeedbackEntry type) moved to the Engine department —
 * src/engine/storage.ts (logic) and src/engine/types.ts (type) — as part of
 * the single localStorage abstraction layer. Existing importers
 * (e.g. components/LessonComplete.tsx) keep working unchanged.
 */
export { saveFeedback } from "~/engine/storage";
export type { FeedbackEntry } from "~/engine/types";
