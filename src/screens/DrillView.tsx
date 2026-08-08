import { useState } from "react";
import { getPronunciation, type PronMode } from "~/lib/pronunciation";
import type { DrillCard, DrillKind } from "~/lib/drillUtils";

export default function DrillView({
  cards,
  onExit,
  onRestartMissed,
  pronMode,
}: {
  cards: DrillCard[];
  onExit: () => void;
  onRestartMissed: (cards: DrillCard[]) => void;
  pronMode: PronMode;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [gotIt, setGotIt] = useState<DrillCard[]>([]);
  const [missed, setMissed] = useState<DrillCard[]>([]);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const card = cards[index];

  if (done)
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-burgundy-200 bg-white p-6 sm:p-10 text-center shadow-lg">
        <div className="text-5xl">🏆</div>
        <h1 className="mt-3 text-3xl font-black text-burgundy-900">
          Drill Complete!
        </h1>
        <p className="mt-4 text-5xl font-black text-burgundy-700">
          {gotIt.length} / {cards.length}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-green-50 p-3 text-green-700">
            <b>{gotIt.length}</b>
            <br />
            Mastered
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-red-700">
            <b>{missed.length}</b>
            <br />
            Needs Work
          </div>
        </div>
        {missed.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className="font-bold text-burgundy-800">Review these next:</h2>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {missed.map((c) => (
                <li key={c.id}>
                  • {c.prompt} — {c.answer}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => onRestartMissed(missed)}
            disabled={!missed.length}
            className="flex-1 rounded-xl bg-burgundy-700 py-3 font-bold text-white disabled:opacity-40"
          >
            Drill Missed Again
          </button>
          <button
            onClick={onExit}
            className="flex-1 rounded-xl border-2 border-burgundy-200 py-3 font-bold text-burgundy-700"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );

  if (!card) return null;

  // Prompts are always presented with the mental task the student should do first.
  const instructionByKind: Record<DrillKind, string> = {
    "vocab-latin": "Translate to English:",
    "vocab-english": "Translate to Latin:",
    conjugation: "Identify the person and number:",
    declension: "Identify the case and number:",
  };
  const instruction = instructionByKind[card.kind];

  // Only Latin prompts should include pronunciation (English → Latin prompts do not).
  const isLatinPrompt =
    card.kind === "vocab-latin" ||
    card.kind === "conjugation" ||
    card.kind === "declension";
  const cardPron = isLatinPrompt
    ? (card.pronunciation ?? getPronunciation(card.prompt, pronMode))
    : null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-5 flex items-center justify-between text-sm font-semibold text-burgundy-700">
        <span>
          Card {index + 1} / {cards.length}
        </span>
        <span className={streak > 1 ? "animate-pulse" : ""}>
          🔥 {streak} in a row
        </span>
      </div>
      <div
        onClick={() => setRevealed(true)}
        className={`min-h-[240px] cursor-pointer select-none rounded-3xl border-2 p-8 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 ${
          revealed
            ? "border-gold-400 bg-cream-50"
            : "border-burgundy-400 bg-burgundy-50 hover:scale-[1.01]"
        }`}
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-burgundy-500">
          Think of your answer, then tap to reveal
        </p>
        <p className="mb-2 text-sm font-semibold text-burgundy-600">{instruction}</p>
        <p className="text-3xl font-black text-burgundy-900">{card.prompt}</p>
        {cardPron && (
          <p className="mt-2 text-sm italic text-gray-400">{cardPron}</p>
        )}
        {revealed && (
          <div className="mt-8">
            <p className="text-2xl font-extrabold text-burgundy-900">
              {card.answer}
            </p>
            {card.bonusInfo && (
              <>
                <div className="mx-auto mt-3 w-12 border-t border-burgundy-200" />
                <p className="mt-2 text-sm italic text-gray-400">
                  {card.bonusInfo}
                </p>
              </>
            )}
          </div>
        )}
      </div>
      {revealed ? (
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => rate(false)}
            className="flex-1 rounded-xl border-2 border-red-300 bg-red-50 py-4 text-base font-bold text-red-700"
          >
            Still Learning ❌
          </button>
          <button
            onClick={() => rate(true)}
            className="flex-1 rounded-xl border-2 border-green-300 bg-green-50 py-4 text-base font-bold text-green-700"
          >
            Got It ✅
          </button>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-gray-400">
          Tap the card when you're ready to check.
        </p>
      )}
    </div>
  );

  function rate(correct: boolean) {
    if (correct) {
      setGotIt((v) => [...v, card]);
      setStreak((v) => v + 1);
    } else {
      setMissed((v) => [...v, card]);
      setStreak(0);
    }
    if (index + 1 >= cards.length) setDone(true);
    else {
      setIndex((v) => v + 1);
      setRevealed(false);
    }
  }
}
