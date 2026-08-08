import { createServerFn } from "@tanstack/react-start";
import latinLessons from "~/data/latinLessons";

export type GeneratedExerciseType = "multiple-choice" | "fill-in-blank" | "matching";

export interface GeneratedExercise {
  type: GeneratedExerciseType;
  id: string;
  prompt: string;
  _generated: true;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  answer?: string;
  acceptableAnswers?: string[];
  pairs?: [string, string][];
}

export interface CultureCard {
  title: string;
  fact: string;
  icon: string;
}

export interface PracticeResult {
  exercises: GeneratedExercise[];
  culture: CultureCard | null;
  error?: string;
}

// ── Shared OpenAI call ───────────────────────────────────────

const OPENAI_MODEL = "gpt-4o-mini";

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

function buildLessonContext(lessonId: number): string {
  const lesson = latinLessons.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`Lesson ${lessonId} not found`);

  const parts: string[] = [];
  parts.push(`Lesson title: "${lesson.title}"`);
  parts.push(`Concept: ${lesson.concept.replace(/<[^>]+>/g, "")}`);

  if (lesson.vocabulary && lesson.vocabulary.length > 0) {
    parts.push("Vocabulary:");
    for (const v of lesson.vocabulary) {
      const gender = v.gender ? ` (${v.gender})` : "";
      parts.push(`  - ${v.latin}: ${v.english}${gender}`);
    }
  }

  if (lesson.vocabularyTable) {
    parts.push("Reference table: " + lesson.vocabularyTable.title);
    for (const row of lesson.vocabularyTable.rows) {
      parts.push(`  ${row.join(" | ")}`);
    }
  }

  if (lesson.referenceTable) {
    parts.push("Grammar reference: " + lesson.referenceTable.title);
    for (const row of lesson.referenceTable.rows) {
      parts.push(`  ${row.join(" | ")}`);
    }
  }

  return parts.join("\n");
}

// ── Server function: generate exercises ──────────────────────

export const generatePractice = createServerFn()
  .validator(
    (data: unknown): { lessonId: number; count?: number } => {
      const d = data as Record<string, unknown>;
      const lessonId = Number(d.lessonId);
      const count = d.count ? Math.min(Math.max(Number(d.count), 3), 10) : 5;
      if (!Number.isFinite(lessonId) || lessonId < 1)
        throw new Error("Invalid lessonId");
      return { lessonId, count };
    },
  )
  .handler(async ({ data }): Promise<PracticeResult> => {
    const lessonContext = buildLessonContext(data.lessonId);

    const systemPrompt = `You are a Latin teacher creating exercises for high school students.
Generate exactly ${data.count} Latin language exercises based on the lesson content provided.
Vary the exercise types: multiple-choice, fill-in-blank, and matching.
Every exercise MUST use ONLY vocabulary and grammar from the provided lesson — do not introduce new words or concepts.

Return ONLY valid JSON in this exact shape (no markdown, no explanation):
{
  "exercises": [
    { "type": "multiple-choice", "prompt": "question", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "hint" },
    { "type": "fill-in-blank", "prompt": "question", "answer": "answer", "acceptableAnswers": ["alt"] },
    { "type": "matching", "prompt": "Match...", "pairs": [["left","right"],["left2","right2"]] }
  ],
  "culture": { "title": "Short title", "fact": "1-2 sentences about Roman culture", "icon": "🏛️" }
}

Rules:
- correctIndex is 0-based for multiple-choice
- Include acceptableAnswers array for fill-in-blank
- All prompts in English; Latin words with macrons
- Keep sentences simple for first-year students`;

    const raw = await callOpenAI(systemPrompt, lessonContext);

    let parsed: Record<string, unknown>;
    try {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return { exercises: [], culture: null, error: "Failed to parse AI response" };
    }

    const exercises: GeneratedExercise[] = (
      Array.isArray(parsed.exercises) ? parsed.exercises : []
    )
      .slice(0, data.count)
      .map((ex: Record<string, unknown>, i: number) => ({
        type: (String(ex.type ?? "multiple-choice")) as GeneratedExerciseType,
        id: `ai-${data.lessonId}-${Date.now()}-${i}`,
        prompt: String(ex.prompt ?? ""),
        _generated: true as const,
        ...(ex.type === "multiple-choice"
          ? { options: Array.isArray(ex.options) ? ex.options as string[] : [], correctIndex: Number(ex.correctIndex ?? 0), explanation: String(ex.explanation ?? "") }
          : {}),
        ...(ex.type === "fill-in-blank"
          ? { answer: String(ex.answer ?? ""), acceptableAnswers: Array.isArray(ex.acceptableAnswers) ? ex.acceptableAnswers as string[] : [] }
          : {}),
        ...(ex.type === "matching"
          ? { pairs: Array.isArray(ex.pairs) ? ex.pairs as [string, string][] : [] }
          : {}),
      }));

    return {
      exercises,
      culture: parsed.culture
        ? (parsed.culture as CultureCard)
        : null,
    };
  });

// ── Server function: culture card only ───────────────────────

export const generateCultureCard = createServerFn()
  .validator(
    (data: unknown): { lessonId: number } => {
      const d = data as Record<string, unknown>;
      const lessonId = Number(d.lessonId);
      if (!Number.isFinite(lessonId) || lessonId < 1)
        throw new Error("Invalid lessonId");
      return { lessonId };
    },
  )
  .handler(async ({ data }): Promise<CultureCard> => {
    const lesson = latinLessons.find((l) => l.id === data.lessonId);
    if (!lesson) {
      return { title: "Did You Know?", fact: "The Romans left us thousands of Latin inscriptions.", icon: "🏛️" };
    }

    const vocabSample = (lesson.vocabulary ?? [])
      .slice(0, 5)
      .map((v) => v.latin)
      .join(", ");

    const systemPrompt = `You are a Roman historian sharing fascinating facts with high school Latin students.
Based on the lesson topic and vocabulary, share ONE interesting, historically accurate fact about ancient Roman culture, daily life, history, or language.
Return ONLY valid JSON: { "title": "Short title", "fact": "1-2 engaging sentences", "icon": "emoji representing the topic" }`;

    const raw = await callOpenAI(
      systemPrompt,
      `Lesson: "${lesson.title}". Vocabulary includes: ${vocabSample}. Provide a culture fact tied to these words or concepts.`,
    );

    try {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();
      return JSON.parse(cleaned) as CultureCard;
    } catch {
      return {
        title: "Did You Know?",
        fact: "The Romans left us thousands of Latin inscriptions — many visible today in Rome's ancient ruins.",
        icon: "🏛️",
      };
    }
  });
