import { createFileRoute, useSearch } from "@tanstack/react-router";
import CharacterQuizzer from "~/screens/CharacterQuizzer";

export const Route = createFileRoute("/quizzer")({
  validateSearch: (search: Record<string, unknown>) => ({
    language: search.language === "hebrew" ? "hebrew" as const : search.language === "greek" ? "greek" as const : undefined,
  }),
  component: QuizzerRoute,
});

function QuizzerRoute() {
  const search = useSearch({ from: "/quizzer" }) as { language?: "greek" | "hebrew" };
  return <CharacterQuizzer initialLanguage={search.language} />;
}
