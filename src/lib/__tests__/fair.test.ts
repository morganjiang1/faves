import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { fairLine, fairPick, hoodPoint, neighborhoodPoint, travelLines, type Start } from "../fair";
import { parseRequest } from "../parser";
import { makePlan } from "../planner";

const city = buildCity(raw as unknown as RawCity);
const NOW = new Date(Date.UTC(2026, 9, 24, 17, 0)); // Sat 10:00 AM in San Francisco

// Three friends: the Inner Richmond, the Mission, and downtown Oakland (across the bay).
const starts: Start[] = [
  { memberId: "a", name: "Ana", hood: "Inner Richmond", lat: 37.78, lng: -122.465, mode: "transit" },
  { memberId: "b", name: "Ben", hood: "Mission District", lat: 37.76, lng: -122.418, mode: "transit" },
  { memberId: "c", name: "Cal", hood: "Oakland", lat: 37.805, lng: -122.272, mode: "drive" },
];
const outerSunset = (p: { lat: number; lng: number }) => p.lng < -122.48 && p.lat < 37.77;

test("three friends in the Richmond, the Mission and Oakland don't get a first stop in the Outer Sunset", () => {
  const req = parseRequest("me and 2 friends, something fun then dinner, 1pm to 7pm", { hoods: city.hoods });
  const fair = makePlan(req, { city, now: NOW, starts });
  const first = city.byId.get(fair.stops[0].placeId)!;
  expect(outerSunset(first)).toBe(false);
  expect(fair.fairness).toBeTruthy();
  expect(fair.fairness!.toFirst.map((l) => l.memberId)).toEqual(["a", "b", "c"]);
  // Fairer than a day planned without anyone's starting point.
  const solo = makePlan(req, { city, now: NOW });
  const soloFirst = city.byId.get(solo.stops[0].placeId)!;
  const worst = (p: { lat: number; lng: number }) => Math.max(...travelLines(starts, p).map((l) => l.minutes));
  expect(worst(first)).toBeLessThanOrEqual(worst(soloFirst));
  // Everyone gets a trip home from the last stop.
  expect(fair.fairness!.home).toHaveLength(3);
});

test("the fair pick minimizes the longest trip first, then the total, within good spots", () => {
  const near = { id: "near", lat: 37.785, lng: -122.4, score: 70 }; // SoMa: between everyone
  const far = { id: "far", lat: 37.755, lng: -122.505, score: 90 }; // Outer Sunset: great but far for two
  const awful = { id: "awful", lat: 37.79, lng: -122.39, score: 10 }; // central but not good
  const pick = fairPick([far, near, awful].map((p) => ({ place: p, score: p.score })), starts);
  expect(pick?.place.id).toBe("near");
  // With one person there is nothing to balance: the best spot wins.
  expect(fairPick([far, near].map((p) => ({ place: p, score: p.score })), starts.slice(0, 1))?.place.id).toBe("far");
});

test("starting points are shared only as a neighborhood", () => {
  const mission = hoodPoint(city, city.hoods.find((h) => /mission district/i.test(h)) ?? city.hoods[0])!;
  expect(mission.lat.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  const snapped = neighborhoodPoint(city, { lat: 37.75993, lng: -122.41481 });
  expect(snapped.hood).toBeTruthy();
  expect(Math.round(snapped.lat * 100)).toBe(snapped.lat * 100);
  expect(fairLine({ toFirst: [], home: [], maxMinutes: 17, startsKey: "" })).toBe("everyone's within 20 min");
});
