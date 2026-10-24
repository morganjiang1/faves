// The center "+" opens the plan builder; this tab never shows a screen of its own.
import { Redirect } from "expo-router";

export default function PlanTab() {
  return <Redirect href="/builder" />;
}
