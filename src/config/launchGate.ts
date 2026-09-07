/**
 * ── Launch Gate configuration ──────────────────────────────────────────
 * Sep 9 beta is password-protected until the Loyola licensing decision.
 *
 * HOW TO LIFT THE GATE (post-Loyola): set LAUNCH_GATE_ENABLED to false.
 * That is the entire removal — no code surgery, no other file to touch.
 *
 * HOW TO CHANGE THE PASSCODE: edit LAUNCH_GATE_PASSCODE below and
 * redeploy. Remember-device flags already set in browsers are unaffected
 * (they unlock regardless of passcode value); a changed passcode only
 * affects browsers that have not yet unlocked.
 *
 * NOTE: this is a client-side gate, checked against a build-time constant.
 * It is a courtesy lock for beta classmates, not security — like a screen
 * lock on the front door. Anyone with the bundle could extract the value.
 * That is accepted for the beta phase.
 */

// PLACEHOLDER — the owner supplies the real passcode before Sep 9.
export const LAUNCH_GATE_PASSCODE = "ELOQUI2026";

// One-line flip: false = gate removed everywhere, app fully public.
export const LAUNCH_GATE_ENABLED = true;

/** localStorage remember-device flag (per browser, never expires). */
export const LAUNCH_GATE_STORAGE_KEY = "verbum-gate-unlocked";

export function isGateUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LAUNCH_GATE_STORAGE_KEY) === "1";
  } catch {
    // Private-mode / storage-disabled browsers: treat as locked.
    return false;
  }
}

export function markGateUnlocked(): void {
  try {
    window.localStorage.setItem(LAUNCH_GATE_STORAGE_KEY, "1");
  } catch {
    // Storage write failed (quota/private mode) — session still unlocks
    // in memory; the gate just re-asks on the next visit.
  }
}
