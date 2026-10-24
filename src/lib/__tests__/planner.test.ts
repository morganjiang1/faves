import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { openForVisit } from "../hours";
import { activitiesIn, parseRequest } from "../parser";
import { makePlan, matchesKeywords, planCost, replan, swapStop, alternativesFor, type Plan } from "../planner";
import { costOf } from "../score";
import { formatClock } from "../time";

const city = buildCity(raw as unknown as RawCity);
// Saturday, Oct 24, 2026, 10:00 AM in San Francisco (17:00 UTC, PDT).
const NOW = new Date(Date.UTC(2026, 9, 24, 17, 0));
const ctx = { city, now: NOW };
const plan = (text: string) => makePlan(parseRequest(text, { hoods: city.hoods }), ctx);
const place = (id: string) => city.byId.get(id)!;

function describePlan(p: Plan) {
  return p.stops.map((s) => `${formatClock(s.start)} ${s.slot.label}: ${place(s.placeId).name} (${place(s.placeId).kind})${s.leg ? ` <- ${s.leg.minutes} min ${s.leg.mode}` : ""}`).join("\n");
}

function expectCoherent(p: Plan) {
  expect(p.stops.length).toBeGreaterThan(0);
  p.stops.forEach((s, i) => {
    const pl = place(s.placeId);
    expect(pl).toBeDefined();
    // Never sends you somewhere that is closed when you get there.
    expect(openForVisit(pl.hours, p.weekday, s.start, Math.min(30, s.end - s.start))).not.toBe(false);
    expect(s.end).toBeGreaterThan(s.start);
    if (i > 0) {
      expect(s.leg).not.toBeNull();
      expect(s.start).toBeGreaterThanOrEqual(p.stops[i - 1].end);
    }
    expect(s.why.length).toBeGreaterThan(10);
  });
  // No place twice.
  expect(new Set(p.stops.map((s) => s.placeId)).size).toBe(p.stops.length);
}

describe("planner on San Francisco data", () => {
  test("pickleball, then hot pot, in that order", () => {
    const p = plan("me and 3 friends, pickleball then hot pot, 2pm to 9pm, by bus");
    expectCoherent(p);
    const labels = p.stops.map((s) => s.slot.label);
    expect(labels.indexOf("pickleball")).toBeGreaterThanOrEqual(0);
    expect(labels.indexOf("hot pot")).toBeGreaterThan(labels.indexOf("pickleball"));
    const court = place(p.stops[labels.indexOf("pickleball")].placeId);
    expect(court.court?.sport === "pickleball" || /pickleball/i.test(`${court.name} ${court.kind}`)).toBe(true);
    const hotpot = place(p.stops[labels.indexOf("hot pot")].placeId);
    expect(matchesKeywords(hotpot, ["hot pot", "hotpot", "shabu"])).toBe(true);
    expect(p.stops[0].start).toBeGreaterThanOrEqual(14 * 60);
    expect(p.title).toMatch(/Pickleball and hot pot/);
  });

  test("first date: something to do, dinner, a view timed to sunset", () => {
    const p = plan("first date saturday, something fun then dinner and a view");
    expectCoherent(p);
    const view = p.stops.find((s) => s.slot.categories.includes("views"));
    expect(view).toBeDefined();
    expect(p.sunset).not.toBeNull();
    // The view stop lands in the hour before sunset.
    expect(Math.abs(view!.start - (p.sunset! - 40))).toBeLessThanOrEqual(60);
  });

  test("niche interest: a Gundam fan gets a hobby or anime shop", () => {
    const p = plan("catching up with an old friend sunday afternoon, he loves Gundam");
    expectCoherent(p);
    const stop = p.stops.find((s) => s.slot.interest === "Gundam");
    expect(stop).toBeDefined();
    const shop = place(stop!.placeId);
    expect(matchesKeywords(shop, ["gundam", "gunpla", "hobby", "model", "anime", "toy", "figure"], true)).toBe(true);
  });

  test("rainy day plans stay indoors", () => {
    const p = plan("rainy day with friends, something to do and food");
    expectCoherent(p);
    for (const s of p.stops) expect(["views", "courts"]).not.toContain(place(s.placeId).category);
  });

  test("a free day only picks free spots", () => {
    const p = plan("broke, free stuff only, a view and a park this afternoon");
    expectCoherent(p);
    for (const s of p.stops) expect(costOf(place(s.placeId)).perPerson).toBe(0);
  });

  test("every stop has a Plan B", () => {
    const p = plan("friends day, bowling then tacos then drinks");
    expectCoherent(p);
    for (const s of p.stops) expect(s.planB.length).toBeGreaterThan(0);
    expect(planCost(p, city).perPerson).toBeGreaterThan(0);
  });

  test("respects a neighborhood", () => {
    const p = plan("date in the Mission District, coffee, a bookstore and dinner");
    expectCoherent(p);
    const inHood = p.stops.filter((s) => /mission/i.test(place(s.placeId).hood ?? "")).length;
    expect(inHood).toBeGreaterThanOrEqual(Math.ceil(p.stops.length / 2));
  });
});

describe("live re-plan", () => {
  const lexicon = activitiesIn;
  const base = plan("date saturday 1pm to 8pm, a hike then sushi then a view, by car");

  test("it's raining: outdoor stops become indoor ones, the rest stays", () => {
    const outdoorBefore = base.stops.filter((s) => ["views", "active", "courts"].includes(place(s.placeId).category)).length;
    expect(outdoorBefore).toBeGreaterThan(0);
    const r = replan(base, city, "it's raining", { lexicon, now: NOW });
    expectCoherent(r.plan);
    expect(r.changed.length).toBeGreaterThan(0);
    expect(r.message).toMatch(/takes its place/);
    const sushiBefore = base.stops.find((s) => s.slot.label === "sushi")!.placeId;
    expect(r.plan.stops.some((s) => s.placeId === sushiBefore)).toBe(true);
  });

  test("we're running late: the rest of the day shifts", () => {
    const r = replan(base, city, "we're running 45 min late", { lexicon, now: NOW });
    expectCoherent(r.plan);
    expect(r.plan.stops[0].start).toBeGreaterThan(base.stops[0].start);
    expect(r.message).toMatch(/45 min/);
  });

  test("swap the sushi spot", () => {
    const r = replan(base, city, "swap the sushi spot", { lexicon, now: NOW });
    expectCoherent(r.plan);
    const i = base.stops.findIndex((s) => s.slot.label === "sushi");
    expect(r.plan.stops[i].placeId).not.toBe(base.stops[i].placeId);
    expect(matchesKeywords(place(r.plan.stops[i].placeId), ["sushi", "omakase"])).toBe(true);
    // The other stops are kept.
    base.stops.forEach((s, k) => { if (k !== i) expect(r.plan.stops[k].placeId).toBe(s.placeId); });
  });

  test("add dessert and make it cheaper", () => {
    const added = replan(base, city, "add dessert", { lexicon, now: NOW });
    expect(added.plan.stops.length).toBe(base.stops.length + 1);
    expect(added.plan.stops[added.plan.stops.length - 1].slot.categories).toContain("sweets");
    const cheaper = replan(base, city, "make it cheaper", { lexicon, now: NOW });
    expect(planCost(cheaper.plan, city).perPerson).toBeLessThanOrEqual(planCost(base, city).perPerson);
  });

  test("swap sheet alternatives and a manual swap", () => {
    const alts = alternativesFor(base, city, 1);
    expect(alts.length).toBeGreaterThan(1);
    const swapped = swapStop(base, city, 1, alts[0].place.id);
    expect(swapped.stops[1].placeId).toBe(alts[0].place.id);
    expect(swapped.stops[1].planB[0]).toBe(base.stops[1].placeId);
  });

  test("prints a sample day", () => {
    // Visible in the test log for a quick read of what the agent picks.
    console.log(`${base.title}\n${describePlan(base)}`);
    expect(base.title.length).toBeGreaterThan(0);
  });
});
