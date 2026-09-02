import { useState } from "react";
import type { ReactNode } from "react";
import type { VerbumSettings } from "~/engine/types";
import { ensureUserIdentity } from "~/engine/storage";
import WindowFrame from "~/components/WindowFrame";

interface Props {
  settings: VerbumSettings; // from ~/engine/types
  onUpdateSettings: (partial: Partial<VerbumSettings>) => void;
  onClearData: () => void;
  onEnableDevMode: () => void;
  onBack: () => void;
  showPronunciation?: boolean;
  /** Beta bug-report flow (owner directive 2026-08-23): opens the one
   *  BugReportDialog (route-rendered). Omit → the Feedback card hides. */
  onReportBug?: () => void;
}

/** Simple on/off switch (track + sliding knob). */
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:ring-offset-2 ${
        on ? "bg-burgundy-700" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-burgundy-200 bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gold-700">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function SettingsScreen({
  settings,
  onUpdateSettings,
  onClearData,
  onEnableDevMode,
  onBack,
  showPronunciation = true,
  onReportBug,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  // Account identity (Phase 1): anonymous-only. The id lets a user attach a
  // second device (cross-device sync) before Phase 2 auth lands.
  const identity = typeof window !== "undefined" ? ensureUserIdentity() : null;

  const copyId = async () => {
    if (!identity) return;
    try {
      await navigator.clipboard.writeText(identity.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <WindowFrame title="Settings" onBack={onBack} variant="overlay">
      <main className="flex-1 px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="text-3xl font-extrabold text-burgundy-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tune how Eloqui works for you.
          </p>

          <div className="mt-8 space-y-6">
            {/* ── Account (Phase 1: anonymous id + cross-device sync) ── */}
            <SectionCard title="Account">
              {identity ? (
                <>
                  <p className="text-sm text-gray-600">
                    Your progress is saved on this device only. Sync lets you
                    pick up where you left off on another browser.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={copyId}
                      className="rounded-xl border-2 border-burgundy-300 bg-burgundy-50 px-4 py-2 text-sm font-bold text-burgundy-700 transition hover:bg-burgundy-100"
                    >
                      {copiedId ? "Copied ✓" : "Copy account id"}
                    </button>
                    <span className="text-xs text-gray-400">
                      Paste this id on another device to sync (then sign in to
                      link it to your account).
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    Sign in is coming soon — it will sync this account across
                    devices automatically.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Syncing is available in the browser.
                </p>
              )}
            </SectionCard>

            {/* ── Pronunciation ─────────────────────────────────────── */}
            {showPronunciation && (
            <SectionCard title="Pronunciation">
              <div className="inline-flex rounded-full border border-burgundy-200 bg-burgundy-50/60 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ pronMode: "ecclesiastical" })}
                  aria-pressed={settings.pronMode === "ecclesiastical"}
                  className={`rounded-full px-5 py-2 transition-all duration-200 ${
                    settings.pronMode === "ecclesiastical"
                      ? "bg-burgundy-700 text-cream-50 shadow-sm"
                      : "text-burgundy-600 hover:text-burgundy-800"
                  }`}
                >
                  Ecclesiastical
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ pronMode: "classical" })}
                  aria-pressed={settings.pronMode === "classical"}
                  className={`rounded-full px-5 py-2 transition-all duration-200 ${
                    settings.pronMode === "classical"
                      ? "bg-burgundy-700 text-cream-50 shadow-sm"
                      : "text-burgundy-600 hover:text-burgundy-800"
                  }`}
                >
                  Classical
                </button>
              </div>
            </SectionCard>
            )}

            {/* ── AI Features ───────────────────────────────────────── */}
            <SectionCard title="AI Features">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-burgundy-900">
                    AI Practice Mode
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {settings.aiEnabled
                      ? "AI generates custom exercises"
                      : "Template exercises only"}
                  </p>
                </div>
                <Toggle
                  on={settings.aiEnabled}
                  onClick={() =>
                    onUpdateSettings({ aiEnabled: !settings.aiEnabled })
                  }
                />
              </div>
            </SectionCard>

            {/* ── Feedback (beta bug-report flow, owner 2026-08-23) ── */}
            {onReportBug && (
              <SectionCard title="Feedback">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-burgundy-900">
                      Report a problem
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Spotted a bug? Tell us what happened — your report
                      includes what screen you were on.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onReportBug}
                    className="shrink-0 rounded-xl bg-burgundy-700 px-5 py-2.5 text-sm font-bold text-cream-50 shadow transition hover:bg-burgundy-800"
                  >
                    🪲 Report a problem
                  </button>
                </div>
              </SectionCard>
            )}
            {/* ── Developer ─────────────────────────────────────────── */}
            <SectionCard title="Developer">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-burgundy-900">Dev Mode</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {settings.devMode
                      ? "Testing mode is on"
                      : "Enable for testing"}
                  </p>
                </div>
                <Toggle
                  on={settings.devMode}
                  onClick={() =>
                    settings.devMode
                      ? onUpdateSettings({ devMode: false })
                      : onEnableDevMode()
                  }
                />
              </div>
              {settings.devMode && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  ⚠️ All lessons unlocked, progress not saved
                </div>
              )}
            </SectionCard>

            {/* ── Data ──────────────────────────────────────────────── */}
            <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-red-600">
                Data
              </h2>
              {!confirming ? (
                <button
                  onClick={() => setConfirming(true)}
                  className="w-full rounded-xl border-2 border-red-300 bg-red-50 py-3 font-bold text-red-700 transition hover:bg-red-100"
                >
                  🗑️ Clear All Data
                </button>
              ) : (
                <div>
                  <p className="text-sm leading-relaxed text-gray-700">
                    This will erase all progress, settings, and placement
                    results. Are you sure?
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setConfirming(false)}
                      className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onClearData}
                      className="flex-1 rounded-xl bg-red-600 py-2.5 font-semibold text-white shadow transition hover:bg-red-700"
                    >
                      Yes, Clear Everything
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </WindowFrame>
  );
}
