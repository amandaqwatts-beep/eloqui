/**
 * book2Progress.ts — Latin 2 (Book 2) per-path progress storage seam.
 *
 * Pure module: no React. Reads/writes ONE localStorage key per student for
 * the Book 2 path choice and a per-path progress record whose shape the
 * capture pipeline fills later. Storage is injectable so tests can run on an
 * in-memory stub (the repo keeps tsc at its baseline without @types/bun, so
 * tests avoid bun:test — see shelfPacking.test.ts for the house pattern).
 *
 * Honesty rule (Minimalist Scholarly, plan rev 72): this module records a
 * path CHOICE and, later, real progress. It never fabricates progress — the
 * shell renders an honest "nothing yet" until capture-pipeline content lands.
 */

import type { Latin2PathId } from "~/data/latin2";

/** localStorage key — namespaced like the other Eloqui storage keys. */
export const BOOK2_PROGRESS_KEY = "eloqui:latin2:progress";

/** The per-path progress record. Deliberately minimal; grows with content. */
export interface Latin2PathProgress {
  /** The path the student chose ("book" | "caesar"); null = not chosen yet. */
  path: Latin2PathId | null;
  /**
   * Completed section ids (from LATIN2_STRUCTURE), in no guaranteed order —
   * the capture pipeline's content modules own the semantics. Empty until
   * content exists.
   */
  completedSectionIds: string[];
  /** ISO timestamp of the last write; null until the first write. */
  updatedAt: string | null;
}

/** A minimal Storage surface (localStorage satisfies it; tests stub it). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const emptyProgress = (): Latin2PathProgress => ({
  path: null,
  completedSectionIds: [],
  updatedAt: null,
});

/** The browser localStorage, or null when unavailable (SSR, private mode). */
function defaultStorage(): StorageLike | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    /* storage unavailable */
  }
  return null;
}

/** Load the Book 2 progress record — never throws, never fabricates. */
export function loadBook2Progress(storage?: StorageLike): Latin2PathProgress {
  const store = storage ?? defaultStorage();
  if (!store) return emptyProgress();
  try {
    const raw = store.getItem(BOOK2_PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyProgress();
    const rec = parsed as Partial<Latin2PathProgress>;
    return {
      path: rec.path === "book" || rec.path === "caesar" ? rec.path : null,
      completedSectionIds: Array.isArray(rec.completedSectionIds)
        ? rec.completedSectionIds.filter((id): id is string => typeof id === "string")
        : [],
      updatedAt: typeof rec.updatedAt === "string" ? rec.updatedAt : null,
    };
  } catch {
    return emptyProgress();
  }
}

/** Record a completed SECTION (idempotent upsert by section id — the capture
 *  pipeline's content modules own the semantics; StrictMode-safe like the
 *  other record* helpers). No-op without storage; load-modify-save so it never
 *  clobbers a concurrent path choice. */
export function saveBook2SectionCompletion(
  sectionId: string,
  storage?: StorageLike,
): Latin2PathProgress {
  const store = storage ?? defaultStorage();
  const prev = loadBook2Progress(store ?? undefined);
  const completedSectionIds = prev.completedSectionIds.includes(sectionId)
    ? prev.completedSectionIds
    : [...prev.completedSectionIds, sectionId];
  const next: Latin2PathProgress = {
    ...prev,
    completedSectionIds,
    updatedAt: new Date().toISOString(),
  };
  if (store) {
    try {
      store.setItem(BOOK2_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — the completion stays in-session */
    }
  }
  return next;
}

/** Persist the student's path choice (idempotent). No-op without storage. */
export function saveBook2PathChoice(
  path: Latin2PathId,
  storage?: StorageLike,
): Latin2PathProgress {
  const store = storage ?? defaultStorage();
  const next: Latin2PathProgress = {
    ...loadBook2Progress(store ?? undefined),
    path,
    updatedAt: new Date().toISOString(),
  };
  if (store) {
    try {
      store.setItem(BOOK2_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — the choice stays in-session */
    }
  }
  return next;
}
