// The demo group behind /group/demo (screenshots and the web demo): the demo plan's real
// options with three test voters. Their names are test data and the screen labels each of
// them "Test data"; real groups only ever hold votes people cast.
import type { City } from "@/data/types";
import { groupFromPlan, optionsByStop } from "@/lib/group";
import { ensureDemoPlan, DEMO_ID } from "@/components/recap/demo";
import { actions, getState, groupActions, type Group } from "@/state/store";

export const DEMO_VOTERS = ["Alex", "Sam", "Jordan"];

export function ensureDemoGroup(city: City): Group {
  const have = getState().groups[DEMO_ID];
  if (have) return have;
  const plan = ensureDemoPlan(city);
  const names = Object.fromEntries(plan.stops.flatMap((s) => [s.placeId, ...s.planB]).map((id) => [id, city.byId.get(id)?.name ?? ""]));
  const { group, names: kept } = groupFromPlan(plan, getState().profile.name || "Host", names, DEMO_ID);
  const rows = optionsByStop(group);
  const pick = (stop: number, opt: number) => rows[stop]?.options[opt]?.key;
  const votes: Group["votes"] = {};
  const put = (voter: string, stop: number, opt: number, v: "going" | "maybe" | "cant") => {
    const key = pick(stop, opt);
    if (key) votes[voter] = { ...(votes[voter] ?? {}), [key]: v };
  };
  put("Alex", 0, 0, "going"); put("Alex", 1, 0, "going"); put("Alex", 2, 0, "maybe");
  put("Sam", 0, 1, "going"); put("Sam", 0, 0, "maybe"); put("Sam", 1, 0, "going");
  put("Jordan", 0, 0, "going"); put("Jordan", 1, 1, "maybe"); put("Jordan", 2, 0, "cant");
  const g = { ...group, votes };
  actions.saveGroup(g);
  groupActions.setGroupMeta(DEMO_ID, { city: plan.citySlug, names: kept, mine: true });
  return g;
}
