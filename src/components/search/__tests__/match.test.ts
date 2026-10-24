import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { communityDays } from "@/lib/community";
import { answerLine, arrangeHits, browse, refinements, searchDays, searchSpots } from "../match";

const city = buildCity(raw as unknown as RawCity);

test("a spot's own name ranks it first", () => {
  const s = searchSpots(city, "twin peaks");
  expect(s.hits[0].name).toBe("Twin Peaks");
});

test("a dish finds places that serve it, and the answer names it", () => {
  const s = searchSpots(city, "hot pot");
  expect(s.hits.length).toBeGreaterThan(2);
  expect(s.hits.slice(0, 3).every((p) => /hot ?pot|shabu/i.test(`${p.name} ${p.kind ?? ""} ${p.kinds.join(" ")} ${p.description ?? ""}`))).toBe(true);
  expect(answerLine(s.hits.length, s, "hot pot")).toMatch(/^Found \d+ spots locals love for hot pot\.$/);
});

test("a neighborhood narrows results to it", () => {
  const hood = city.hoods.find((h) => h === "North Beach") ?? city.hoods[0];
  const s = searchSpots(city, `pizza in ${hood}`);
  expect(s.hood).toBe(hood);
  expect(s.hits.every((p) => p.hood === hood)).toBe(true);
});

test("a sport finds courts", () => {
  const s = searchSpots(city, "pickleball");
  expect(s.hits.length).toBeGreaterThan(0);
  expect(s.hits.some((p) => p.court?.sport === "pickleball")).toBe(true);
});

test("nonsense finds nothing", () => {
  const s = searchSpots(city, "zzqxv");
  expect(s.hits).toHaveLength(0);
  expect(answerLine(0, s, "zzqxv")).toBe('No spots matched "zzqxv".');
});

test("tabs: hidden gems only keeps gems; refinements suggest new words", () => {
  const s = searchSpots(city, "coffee");
  expect(arrangeHits(s, "gems", [], 6, 600).every((p) => p.hiddenGem)).toBe(true);
  const r = refinements(s, "coffee");
  expect(r.length).toBeGreaterThan(0);
  expect(r.every((x) => x.label.startsWith("+ "))).toBe(true);
});

test("browse chips return rated spots and days search by stop names", () => {
  expect(browse(city, "gems", [], 6, 600).every((p) => p.hiddenGem && !p.unrated)).toBe(true);
  expect(browse(city, "recs", ["food"], 6, 600).every((p) => p.category === "food")).toBe(true);
  const days = communityDays(city);
  const stop = city.byId.get(days[0].plan.stops[0].placeId)!.name;
  expect(searchDays(days, city, stop.split(" ")[0]).map((d) => d.id)).toContain(days[0].id);
});
