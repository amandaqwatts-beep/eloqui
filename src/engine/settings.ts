/**
 * settings.ts — Engine department: app settings state and actions.
 * Pure settings hook with storage-backed persistence; no rendering.
 */

import { useState, useCallback } from "react";
import {
  clearAllData as clearStoredData,
  enableDevMode as enableStoredDevMode,
  loadSettings,
  saveSettings,
} from "~/engine/storage";
import type { VerbumSettings } from "~/engine/types";
import type { Language } from "~/data/languages";

export interface SettingsEngine {
  settings: VerbumSettings;
  updateSettings: (partial: Partial<VerbumSettings>) => void;
  clearAllData: () => void;
  enableDevMode: () => void;
}

export function useSettings(language: Language = "latin"): SettingsEngine {
  const [settings, setSettings] = useState<VerbumSettings>(() => loadSettings(language));

  const updateSettings = useCallback((partial: Partial<VerbumSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next, language);
      return next;
    });
  }, []);

  const enableDevMode = useCallback(() => {
    enableStoredDevMode(language);
    setSettings((prev) => ({ ...prev, devMode: true }));
  }, []);

  return {
    settings,
    updateSettings,
    clearAllData: () => clearStoredData(language),
    enableDevMode,
  };
}
