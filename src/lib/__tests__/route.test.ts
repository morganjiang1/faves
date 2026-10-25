// A day's route moves forward: no stop sends you back to where you already were.
import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import type { Start } from "../fair";
import { metersBetween } from "../geo";
import { parseRequest } from "../parser";
import { makePlan, planWindow, type Plan } from "../planner";

const city = buildCity(raw as unknown as RawCity);
const NOW = new Date(Date.UTC(2026, 9, 24, 17, 0)); // Sat 10:00 AM in San Francisco

// Every later stop that comes back within 1 km of an earlier stop (not the one just before
// it). With `away`, only when the route went more than that far from the earlier stop in
// between (a day inside one walkable neighborhood isn't doubling back).
function backtracks(plan: Plan, away = 0): string[] {
  const pts = plan.stops.map((s) => city.byId.get(s.placeId)!);
  const out: string[] = [];
  for (let i = 2; i < pts.length; i++) for (let j = 0; j < i - 1; j++) {
    const d = metersBetween(pts[i], pts[j]);
    const went = Math.max(...pts.slice(j + 1, i).map((q) => metersBetween(q, pts[j])));
    if (d < 1000 && went > away) out.push(`stop ${i + 1} (${pts[i].name}) is ${Math.round(d)} m from stop ${j + 1} (${pts[j].name})`);
  }
  return out;
}

const plan = (text: string, starts?: Start[]) => makePlan(parseRequest(text, { hoods: city.hoods }), { city, now: NOW, starts });

test("4 friends, pickleball then hot pot: no leg returns within 1 km of an earlier stop, and the order holds", () => {
  const p = plan("me and 3 friends, pickleball then hot pot, 2pm to 9pm, by bus");
  expect(backtracks(p)).toEqual([]);
  const labels = p.stops.map((s) => s.slot.label);
  expect(labels.indexOf("pickleball")).toBeGreaterThanOrEqual(0);
  expect(labels.indexOf("pickleball")).toBeLessThan(labels.indexOf("hot pot"));
  // Every stop is open when the group gets there, and the times run forward.
  for (let i = 1; i < p.stops.length; i++) expect(p.stops[i].start).toBeGreaterThanOrEqual(p.stops[i - 1].end);
});

test("the same day for a group starting in the Richmond and the Mission doesn't double back either", () => {
  const starts: Start[] = [
    { memberId: "a", name: "Ana", hood: "Inner Richmond", lat: 37.78, lng: -122.465, mode: "transit" },
    { memberId: "b", name: "Ben", hood: "Mission District", lat: 37.76, lng: -122.418, mode: "transit" },
  ];
  expect(backtracks(plan("pickleball then hot pot on saturday afternoon, 2 of us", starts))).toEqual([]);
});

test.each([
  "date saturday 1pm to 8pm, a hike then sushi then a view, by car",
  "me and 2 friends, bouldering then tacos then drinks, 3pm to 11pm",
  "family day, 10am to 5pm, a museum then pizza then the park",
  "solo day, coffee then a bookstore then ramen, 11am to 6pm, walking",
])("no doubling back: %s", (text) => {
  expect(backtracks(plan(text), 1500)).toEqual([]);
});

test("'Saturday afternoon' asked on Saturday evening plans next Saturday", () => {
  const evening = new Date(Date.UTC(2026, 9, 25, 1, 30)); // Sat Oct 24, 6:30 PM in San Francisco
  const win = planWindow(parseRequest("pickleball then hot pot on saturday afternoon", { hoods: city.hoods }), { city, now: evening });
  expect(win.date.toISOString().slice(0, 10)).toBe("2026-10-31");
  const morning = planWindow(parseRequest("pickleball then hot pot on saturday afternoon", { hoods: city.hoods }), { city, now: NOW });
  expect(morning.date.toISOString().slice(0, 10)).toBe("2026-10-24");
});
