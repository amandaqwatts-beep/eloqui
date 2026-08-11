/**
 * DiagnosticsEmptyState — variant-driven empty state (UI-spec §9). Dashed
 * border deliberately distinguishes it from data cards.
 */
interface Props {
  variant: "no-data" | "no-pairs" | "no-weak";
  /** Only used by no-data: "You've answered {n} questions so far." */
  answerCount?: number;
}

const COPY: Record<Props["variant"], { title: string; body: string }> = {
  "no-data": {
    title: "📈 We're learning your patterns",
    body: "Answer a few questions in lessons or drills, and this becomes your personal error map. Come back after your next session.",
  },
  "no-pairs": {
    title: "🎉 No confusion pairs yet",
    body: "You're keeping your words straight.",
  },
  "no-weak": {
    title: "🎉 No weak words right now",
    body: "Great job!",
  },
};

export default function DiagnosticsEmptyState({ variant, answerCount }: Props) {
  const { title, body } = COPY[variant];
  return (
    <div className="rounded-2xl border-2 border-dashed border-burgundy-200 bg-cream-50 p-6 text-center">
      <p className="font-bold text-burgundy-800">{title}</p>
      <p className="mt-1 text-sm text-gray-600">
        {body}
        {variant === "no-data" && typeof answerCount === "number" && answerCount > 0
          ? ` You've answered ${answerCount} question${answerCount === 1 ? "" : "s"} so far.`
          : ""}
      </p>
    </div>
  );
}
