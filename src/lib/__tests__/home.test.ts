import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { isOpenAt } from "../hours";
import { hiddenGems, thisWeekend, tonight, topTen } from "../home";
import { cityClock } from "../time";

const city = buildCity(raw as unknown as RawCity);
const NOW = new Date(Date.UTC(2026, 9, 24, 20, 0)); // Saturday 1 PM in San Francisco

test("Top 10 this week: ten different spots, no more than two of a kind", () => {
  const top = topTen(city);
  expect(top).toHaveLength(10);
  expect(new Set(top.map((p) => p.id)).size).toBe(10);
  const per = new Map<string, number>();
  for (const p of top) per.set(p.category, (per.get(p.category) ?? 0) + 1);
  expect(Math.max(...per.values())).toBeLessThanOrEqual(2);
  expect(top.every((p) => !p.unrated && !p.court)).toBe(true);
});

test("Tonight is open tonight", () => {
  const t = tonight(city, NOW);
  expect(t.places.length).toBeGreaterThan(4);
  const clock = cityClock(city.utcOffset, NOW);
  for (const p of t.places) {
    if (p.category === "views") continue;
    expect(isOpenAt(p.hours, clock.day, t.from)).toBe(true);
  }
});

test("This weekend and hidden gems skip what Home already shows", () => {
  const seen = new Set(topTen(city).map((p) => p.id));
  const w = thisWeekend(city, seen, NOW);
  expect(w.length).toBeGreaterThan(4);
  expect(w.some((p) => seen.has(p.id))).toBe(false);
  const g = hiddenGems(city, seen);
  expect(g.every((p) => p.hiddenGem)).toBe(true);
});
