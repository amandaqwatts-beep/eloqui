/**
 * drillUtils.ts — re-export shim.
 *
 * Drill card generation + session logic moved to the Engine department —
 * src/engine/drill.ts (card types, buildDrillCards, Fisher–Yates shuffle,
 * DrillSession / createDrillSession / rateCard). Existing importers
 * (e.g. src/routes/lessons/latin.tsx, src/screens/DrillView.tsx) keep
 * working unchanged.
 */
export {
  buildDrillCards,
  shuffle,
  type DrillCard,
  type DrillKind,
} from "~/engine/drill";
