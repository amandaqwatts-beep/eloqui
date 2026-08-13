/**
 * WindowFrame.tsx — the one chrome pattern for every window the bookshelf
 * opens (bookshelf v2.1 design §1.2).
 *
 * Two tiers, one back contract:
 *  - page variant (modes — Drill / Placement / AI Practice): renders the
 *    existing NavBar + a slim breadcrumb bar below it
 *    (`‹ {backLabel} · {title}`) — one consistent back control, top-left.
 *  - overlay variant (utility windows — Settings / Progress / Review /
 *    Listen / Sleep): fixed inset-0 z-[60] above the still-mounted menu
 *    (NavBar is z-50, so the overlay covers it), with its own slim header
 *    (`‹ {backLabel} · {title}` + ✕), body scroll lock, focus moved into the
 *    frame on open, focus returned to the opener on close, Escape closes.
 *
 * Transitions: exactly one keyframe (`window-in`, 160ms ease-out, translateY
 * 8px) applied to both roots; `prefers-reduced-motion` disables it (app.css).
 * No exit animations — React unmounts, matching the design.
 */
import { useEffect, useRef, type ReactNode } from "react";
import NavBar from "~/components/NavBar";

export interface WindowFrameProps {
  title: string;
  onBack: () => void;
  /** Breadcrumb origin label — "Bookshelf" default; "Review" when a drill
   *  launched from Review exits back there (§1.3 back contract). */
  backLabel?: string;
  variant?: "page" | "overlay";
  children: ReactNode;
}

/** Tab key handling shared by the overlay root and the grammar drawer: cycles
 *  focus within `root` (first/last focusable), never escaping the dialog. */
function focusablesOf(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
}

export default function WindowFrame({
  title,
  onBack,
  backLabel = "Bookshelf",
  variant = "page",
  children,
}: WindowFrameProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef(onBack);
  backRef.current = onBack;
  const isOverlay = variant === "overlay";

  // Overlay behaviors: body scroll lock, focus into the frame, Tab trap,
  // focus returns to the opener (menu stays mounted underneath), Escape closes.
  useEffect(() => {
    if (!isOverlay) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        backRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      const focusables = focusablesOf(root);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      // Return focus to the element that opened the window — the menu is still
      // mounted beneath, so the opener button still exists.
      opener?.focus();
    };
  }, [isOverlay]);

  const breadcrumb = (
    <button
      type="button"
      onClick={onBack}
      className="text-sm font-semibold text-burgundy-700 transition hover:text-burgundy-900 hover:underline"
    >
      ‹ {backLabel} · {title}
    </button>
  );

  if (isOverlay) {
    return (
      <div
        ref={rootRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="window-in fixed inset-0 z-[60] overflow-y-auto bg-cream-50 outline-none"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-burgundy-200/70 bg-cream-50/95 px-4 py-2.5 backdrop-blur-sm sm:px-6">
          {breadcrumb}
          <button
            type="button"
            onClick={onBack}
            aria-label={`Close ${title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-burgundy-200 bg-white text-gray-500 transition hover:border-burgundy-400 hover:text-burgundy-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="window-in flex min-h-dvh flex-col">
      <NavBar />
      <div className="border-b border-burgundy-200/60 bg-cream-50/95">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-2 sm:px-6">
          {breadcrumb}
        </div>
      </div>
      {children}
    </div>
  );
}
