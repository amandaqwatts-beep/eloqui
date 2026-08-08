import { useState, useEffect } from "react";
import type { PronMode } from "~/lib/pronunciation";
import { getStoredMode, setStoredMode } from "~/lib/pronunciation";

interface Props {
  /** Called when the mode changes (so parent can re-render). */
  onChange?: (mode: PronMode) => void;
}

export default function PronunciationToggle({ onChange }: Props) {
  const [mode, setMode] = useState<PronMode>("ecclesiastical");

  // Hydrate from localStorage on mount
  useEffect(() => {
    setMode(getStoredMode());
  }, []);

  const handleToggle = (newMode: PronMode) => {
    setMode(newMode);
    setStoredMode(newMode);
    onChange?.(newMode);
  };

  return (
    <div className="inline-flex rounded-full border border-burgundy-200 bg-burgundy-50/60 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => handleToggle("ecclesiastical")}
        className={`rounded-full px-3 py-1.5 transition-all duration-200 ${
          mode === "ecclesiastical"
            ? "bg-burgundy-700 text-cream-50 shadow-sm"
            : "text-burgundy-600 hover:text-burgundy-800"
        }`}
        aria-pressed={mode === "ecclesiastical"}
      >
        Ecclesiastical
      </button>
      <button
        type="button"
        onClick={() => handleToggle("classical")}
        className={`rounded-full px-3 py-1.5 transition-all duration-200 ${
          mode === "classical"
            ? "bg-burgundy-700 text-cream-50 shadow-sm"
            : "text-burgundy-600 hover:text-burgundy-800"
        }`}
        aria-pressed={mode === "classical"}
      >
        Classical
      </button>
    </div>
  );
}
