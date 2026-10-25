import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { metersBetween } from "../geo";
import { parseRequest } from "../parser";
import { makePlan, planCost, sameOuting } from "../planner";
import { costOf } from "../score";

const city = buildCity(raw as unknown as RawCity);
const NOW = new Date(Date.UTC(2026, 9, 24, 17, 0));
const REQUESTS = [
  "pickleball then hot pot",
  "the two of us: courts, food and views, saturday, 1pm to 6pm",
  "me and 3 friends, something fun then dinner, 2pm to 10pm",
  "date night: dinner and drinks with a view",
  "a museum, coffee and a park",
  "tennis, tacos and a sunset",
];

test("a day never has two stops at the same place, address or within 150 m", () => {
  for (const text of REQUESTS) {
    const plan = makePlan(parseRequest(text, { hoods: city.hoods }), { city, now: NOW });
    const places = plan.stops.map((s) => city.byId.get(s.placeId)!);
    for (let i = 0; i < places.length; i++) for (let j = i + 1; j < places.length; j++) {
      expect({ text, a: places[i].name, b: places[j].name, close: sameOuting(places[i], places[j]) }).toEqual({ text, a: places[i].name, b: places[j].name, close: false });
      expect(metersBetween(places[i], places[j])).toBeGreaterThanOrEqual(150);
    }
  }
});

test("per-person costs are realistic: free places are $0 and a cafe is a coffee, not a meal", () => {
  const park = city.places.find((p) => /park/i.test(p.kind ?? "") && !p.priceLevel)!;
  expect(costOf(park).perPerson).toBe(0);
  const court = city.places.find((p) => p.court)!;
  expect(costOf(court).perPerson).toBe(0);
  const cafe = city.places.find((p) => p.category === "sweets" && p.priceLevel === 2);
  if (cafe) expect(costOf(cafe).perPerson).toBeLessThanOrEqual(8);
  const plan = makePlan(parseRequest("the two of us: pickleball then hot pot, saturday 1pm to 6pm", { hoods: city.hoods }), { city, now: NOW });
  expect(planCost(plan, city).perPerson).toBeLessThan(60);
});
