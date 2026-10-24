// Every city loads, plans a day and builds its community feed.
import { buildCity, CITY_INDEX } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { communityDays } from "../community";
import { parseRequest } from "../parser";
import { makePlan } from "../planner";

const NOW = new Date(Date.UTC(2026, 9, 24, 18, 0));

describe.each(CITY_INDEX.map((c) => [c.slug]))("%s", (slug) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const city = buildCity(require(`@/data/cities/${slug}.json`) as RawCity);

  test("has places, courts and hours", () => {
    expect(city.places.length).toBeGreaterThan(800);
    expect(city.places.some((p) => p.court)).toBe(true);
    expect(city.places.filter((p) => p.hours).length).toBeGreaterThan(300);
  });

  test("plans a friends day and a date", () => {
    for (const text of ["me and 3 friends saturday, something fun then food then drinks", "date saturday 3pm: something fun, dinner and a view"]) {
      const p = makePlan(parseRequest(text, { hoods: city.hoods }), { city, now: NOW });
      expect(p.stops.length).toBeGreaterThanOrEqual(2);
      expect(new Set(p.stops.map((s) => s.placeId)).size).toBe(p.stops.length);
    }
  });

  test("builds most-done days", () => {
    expect(communityDays(city).length).toBeGreaterThanOrEqual(6);
  });
});
