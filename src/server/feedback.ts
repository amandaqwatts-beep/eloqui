import { createServerFn } from "@tanstack/react-start";
import { sql, ensureFeedbackTable } from "~/db";

export const submitFeedback = createServerFn()
  .validator(
    (data: unknown): { lessonId: number; rating: number; comment?: string } => {
      const d = data as Record<string, unknown>;
      const lessonId = Number(d.lessonId);
      const rating = Number(d.rating);

      if (!Number.isFinite(lessonId) || lessonId < 1)
        throw new Error("Invalid lessonId");
      if (!Number.isInteger(rating) || rating < 1 || rating > 5)
        throw new Error("Rating must be 1–5");

      const comment =
        typeof d.comment === "string" && d.comment.trim()
          ? d.comment.trim()
          : undefined;

      return { lessonId, rating, comment };
    },
  )
  .handler(async ({ data }) => {
    await ensureFeedbackTable();

    await sql()`
      INSERT INTO feedback (lesson_id, rating, comment)
      VALUES (${data.lessonId}, ${data.rating}, ${data.comment ?? null})
    `;

    return { success: true };
  });
