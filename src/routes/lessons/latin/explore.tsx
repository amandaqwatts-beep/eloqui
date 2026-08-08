/**
 * explore.tsx — thin route for the Latin Explore section.
 *
 * Renders the ExploreScreen (Screens department), which owns the small
 * route-local state for browsing side lessons. Side lessons are optional
 * enrichment — they never gate core progression and nothing is persisted.
 */
import { createFileRoute } from "@tanstack/react-router";

import ExploreScreen from "~/screens/ExploreScreen";

export const Route = createFileRoute("/lessons/latin/explore")({
  component: ExploreScreen,
});
