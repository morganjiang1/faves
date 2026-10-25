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

// Sat Oct 24, 10:00 PM in San Francisco: the demo run that planned "Saturday" for 10:15 PM tonight.
const SAT_10PM = new Date(Date.UTC(2026, 9, 25, 5, 0));

test("'a Saturday' asked late on Saturday night plans next Saturday, a whole day with several stops", () => {
  const req = parseRequest("plan a Saturday in SF for me and 3 friends, we like pickleball and hot pot, under $40 each", { hoods: city.hoods });
  const win = planWindow(req, { city, now: SAT_10PM });
  expect(win.date.toISOString().slice(0, 10)).toBe("2026-10-31");
  expect(win.start).toBe(12 * 60);
  const p = makePlan(req, { city, now: SAT_10PM });
  expect(p.dateISO).toBe("2026-10-31");
  expect(p.stops.length).toBeGreaterThanOrEqual(2);
});

test("no day and the time has gone: the next sensible time, never tonight in the past", () => {
  const noDay = planWindow(parseRequest("me and 3 friends, pickleball then hot pot", { hoods: city.hoods }), { city, now: SAT_10PM });
  expect(noDay.date.toISOString().slice(0, 10)).toBe("2026-10-25");
  expect(noDay.start).toBe(12 * 60);
  const window = planWindow(parseRequest("pickleball then hot pot, 2pm to 6pm", { hoods: city.hoods }), { city, now: SAT_10PM });
  expect(window.date.toISOString().slice(0, 10)).toBe("2026-10-25");
  expect(window.start).toBe(14 * 60);
  // A night out still fits tonight.
  const drinks = planWindow(parseRequest("drinks and karaoke with friends", { hoods: city.hoods }), { city, now: SAT_10PM });
  expect(drinks.date.toISOString().slice(0, 10)).toBe("2026-10-24");
  expect(drinks.start).toBe(22 * 60 + 15);
});

test("'tonight' stays tonight but starts from now; a window still under way starts from now too", () => {
  const tonight = planWindow(parseRequest("dinner and drinks tonight", { hoods: city.hoods }), { city, now: SAT_10PM });
  expect(tonight.date.toISOString().slice(0, 10)).toBe("2026-10-24");
  expect(tonight.start).toBe(22 * 60 + 15);
  const afternoon = new Date(Date.UTC(2026, 9, 24, 22, 0)); // Sat 3:00 PM
  const under = planWindow(parseRequest("saturday 1pm to 9pm, pickleball then hot pot", { hoods: city.hoods }), { city, now: afternoon });
  expect(under.date.toISOString().slice(0, 10)).toBe("2026-10-24");
  expect(under.start).toBe(15 * 60 + 15);
  expect(under.end).toBe(21 * 60);
});

test.each([
  "plan a Saturday for me and 3 friends",
  "saturday afternoon, pickleball then hot pot",
  "pickleball then hot pot",
  "2pm to 6pm, tacos then a view",
  "date night, sushi then drinks",
  "dinner tonight",
  "today, 1pm to 6pm",
  "family day, a museum then pizza",
  "late night karaoke",
])("never starts in the past, at any hour: %s", (text) => {
  for (const hour of [10, 15, 18, 20, 22, 23.85]) {
    const now = new Date(Date.UTC(2026, 9, 24, 7) + hour * 3600_000); // Sat Oct 24 in San Francisco (PDT)
    const win = planWindow(parseRequest(text, { hoods: city.hoods }), { city, now });
    const startsAt = win.date.getTime() + win.start * 60_000; // wall time, like the clock below
    const wallNow = now.getTime() - 7 * 3600_000;
    expect(startsAt).toBeGreaterThan(wallNow);
    expect(win.end).toBeGreaterThan(win.start);
  }
});
