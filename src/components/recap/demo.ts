// The demo plan behind /recap/demo and /group/demo (screenshots and the web demo). It is a
// real plan the planner builds from the city's real places; only the route id is fixed.
// Real recaps and groups come from the itinerary screen with real plan ids.
import type { City } from "@/data/types";
import { parseRequest } from "@/lib/parser";
import { makePlan, type Plan } from "@/lib/planner";
import { actions, getState } from "@/state/store";

export const DEMO_ID = "demo";
export const DEMO_REQUEST = "date saturday: something fun, dinner and a view";

export function ensureDemoPlan(city: City): Plan {
  const have = getState().plans[DEMO_ID];
  if (have && have.citySlug === city.slug) return have;
  const plan = makePlan(parseRequest(DEMO_REQUEST, { hoods: city.hoods }), { city, idSeed: DEMO_ID });
  plan.id = DEMO_ID;
  // Fixed stop keys so test seeds can point at a stop ("demo-s0", "demo-s1", ...).
  plan.stops = plan.stops.map((s, i) => ({ ...s, key: `${DEMO_ID}-s${i}` }));
  actions.savePlan(plan);
  return plan;
}
