import type { TeachingStep } from "~/data/latinLessons";

/** One teaching step rendered as a card (used in teaching + review phases). */
export default function TeachingStepCard({
  step,
  index,
  total,
}: {
  step: TeachingStep;
  index: number;
  total: number;
}) {
  return (
    <div className="paper-page pt-6 pr-6 pb-6 pl-8 sm:pt-8 sm:pr-8 sm:pb-8 sm:pl-10">
      <span className="inline-block rounded-full bg-burgundy-100 px-3 py-1 text-xs font-semibold text-burgundy-700">
        Step {index} of {total}
      </span>
      <h2 className="paper-title mt-3 text-xl font-extrabold sm:text-2xl">
        {step.title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-700 sm:text-base">
        {step.explanation}
      </p>
      <blockquote className="mt-5 rounded-r-xl border-l-4 border-gold-500 bg-cream-100 px-4 py-3">
        <p className="paper-reading text-lg italic text-burgundy-900 sm:text-xl">
          {step.exampleLatin}
        </p>
      </blockquote>
      <p className="mt-2 text-sm italic text-gray-500">{step.exampleEnglish}</p>
      {step.tip && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          <span aria-hidden>💡</span>
          <p className="font-medium text-amber-900">{step.tip}</p>
        </div>
      )}
    </div>
  );
}
