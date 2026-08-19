import { createFileRoute } from "@tanstack/react-router";
import CrossLanguageScreen from "~/screens/CrossLanguageScreen";

export const Route = createFileRoute("/languages/connections")({
  component: ConnectionsRoute,
});

function ConnectionsRoute() {
  return <CrossLanguageScreen />;
}
