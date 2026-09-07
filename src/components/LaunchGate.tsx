import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  LAUNCH_GATE_PASSCODE,
  markGateUnlocked,
} from "~/config/launchGate";

const MAX_INPUT_LENGTH = 64;

/**
 * Minimal full-screen lock shown before any route renders.
 * Bookshelf v2.1 theme: wood/cream backdrop, burgundy panel, gold accent.
 * Correct passcode → remember-device flag + unlock; wrong → inline error +
 * shake animation. No rate limiting (per brief).
 */
export function LaunchGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim() === LAUNCH_GATE_PASSCODE) {
      markGateUnlocked();
      onUnlock();
    } else {
      setError(true);
    }
  }

  return (
    <div className="library-wall flex min-h-screen flex-col items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm rounded-2xl border border-wood-300 bg-cream-50 p-8 text-center shadow-book-panel ${
          error ? "gate-shake" : ""
        }`}
      >
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-burgundy-700 font-book text-2xl text-cream-50 shadow-spine">
          E
        </span>
        <h1 className="font-book text-2xl font-extrabold tracking-tight text-burgundy-900">
          Eloqui
        </h1>
        <p className="mt-1 text-sm text-wood-800">
          🔒 Private beta — passcode required
        </p>

        <input
          ref={inputRef}
          type="password"
          value={value}
          maxLength={MAX_INPUT_LENGTH}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(false);
          }}
          placeholder="Passcode"
          aria-label="Passcode"
          autoComplete="off"
          className={`mt-6 w-full rounded-lg border px-4 py-2.5 text-center font-book text-lg tracking-widest text-burgundy-900 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 ${
            error
              ? "border-burgundy-600 bg-burgundy-50 focus:ring-burgundy-500"
              : "border-wood-300 bg-white focus:ring-gold-500"
          }`}
        />

        <p
          className={`mt-2 text-sm font-medium text-burgundy-700 ${
            error ? "" : "invisible"
          }`}
          aria-live="polite"
        >
          Incorrect passcode — try again.
        </p>

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-burgundy-700 px-5 py-2.5 font-semibold text-cream-50 shadow-sm transition hover:bg-burgundy-800 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={value.trim().length === 0}
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
