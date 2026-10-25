import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { communityDays, doThisDay } from "../community";
import { formatClock } from "../time";

const city = buildCity(raw as unknown as RawCity);

test("San Francisco's most-done days lead with the featured Saturday in SF", () => {
  const days = communityDays(city);
  expect(days.length).toBeGreaterThan(5);
  const top = days[0];
  expect(top.plan.title).toBe("Saturday in SF");
  expect(top.sample).toBe(true);
  expect(top.doneCount).toBeGreaterThan(days[1].doneCount);
  const names = top.plan.stops.map((s) => city.byId.get(s.placeId)!.name);
  expect(names).toEqual(["Arsicault Bakery", "Presidio Wall Pickleball Courts", "Golden Boy Pizza", "Musée Mécanique", "Ina Coolbrith Park", "The Interval at Long Now"]);
  top.plan.stops.forEach((s, i) => {
    if (i > 0) {
      expect(s.leg).not.toBeNull();
      expect(s.start).toBeGreaterThanOrEqual(top.plan.stops[i - 1].end);
    }
    expect(s.why.length).toBeGreaterThan(10);
  });
  // Sunset at the park: the sunset falls inside the park stop.
  const park = top.plan.stops[4];
  expect(top.plan.sunset).not.toBeNull();
  expect(park.start).toBeLessThanOrEqual(top.plan.sunset!);
  expect(park.end).toBeGreaterThanOrEqual(top.plan.sunset!);
  console.log(top.plan.stops.map((s) => `${formatClock(s.start)} ${city.byId.get(s.placeId)!.name}${s.leg ? ` (${s.leg.minutes} min ${s.leg.mode})` : ""}`).join("\n"));
});

test("Do this day copies the same stops", () => {
  const top = communityDays(city)[0];
  const mine = doThisDay(top, city, new Date(Date.UTC(2026, 9, 24, 15)));
  expect(mine.id).not.toBe(top.id);
  expect(mine.stops.map((s) => s.placeId)).toEqual(top.plan.stops.map((s) => s.placeId));
});

test("'Do this day' never copies a day into the past: after its first stop's time it's tomorrow", () => {
  const top = communityDays(city)[0];
  const first = top.plan.stops[0].start; // 9:00 AM
  const before = doThisDay(top, city, new Date(Date.UTC(2026, 9, 24, 15))); // Sat 8:00 AM in SF
  expect(before.dateISO).toBe("2026-10-24");
  const after = doThisDay(top, city, new Date(Date.UTC(2026, 9, 24, 16, 30))); // Sat 9:30 AM
  expect(after.dateISO).toBe("2026-10-25");
  expect(first).toBe(9 * 60);
});
