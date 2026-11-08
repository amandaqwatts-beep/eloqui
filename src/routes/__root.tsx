import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { LaunchGate } from "~/components/LaunchGate";
import {
  LAUNCH_GATE_ENABLED,
  isGateUnlocked,
} from "~/config/launchGate";
import appCss from "~/styles/app.css?url";

/**
 * useLayoutEffect on the client (runs before paint), useEffect on the server
 * (where layout effects don't run — avoids React's SSR warning).
 */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Eloqui — Learn to think in Latin" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});
/**
 * Launch gate (Sep 9 beta): when LAUNCH_GATE_ENABLED is true, every route —
 * including /lessons and the Foundations module — renders only after the
 * passcode is entered. Remembered devices (localStorage flag set on a
 * successful unlock) skip straight through. Bug-report queueing and account
 * sync live under the gate and work normally once unlocked.
 *
 * SSR/first-render shows the gate by default (when enabled) so no gated
 * content flashes; the localStorage check then opens it for known devices.
 * Flip LAUNCH_GATE_ENABLED to false in src/config/launchGate.ts to lift the
 * gate entirely.
 */
function RootComponent() {
  const [gateState, setGateState] = useState<"locked" | "open">(
    LAUNCH_GATE_ENABLED ? "locked" : "open",
  );

  // Gate open check (FIX-0, 2026-11-07): isomorphic layout effect so the
  // unlock flip happens BEFORE the browser paints. On a remembered device
  // the locked gate must never become visible — not on a full page load
  // (the pre-paint flip erases the SSR gate before first paint) and never
  // on a route transition (this root component stays mounted across client
  // navigation, so the open state persists; verified live 2026-11-07). If
  // hydration fails and React falls back to client rendering, this effect
  // still runs and the gate still opens — a failure cannot leave the gate
  // stuck on screen.
  useIsoLayoutEffect(() => {
    if (LAUNCH_GATE_ENABLED && isGateUnlocked()) {
      setGateState("open");
    }
  }, []);

  if (gateState === "locked") {
    return (
      <RootDocument>
        <LaunchGate onUnlock={() => setGateState("open")} />
      </RootDocument>
    );
  }

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}
function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
