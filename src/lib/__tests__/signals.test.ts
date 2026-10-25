// The Locals Score is shown with community signals only: what people on Faves rank, post and save.
import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { parseRequest } from "../parser";
import { makePlan } from "../planner";
import { gemLine, scoreOutOf10, whyLocals } from "../score";
import { communityLine, communitySignals } from "../signals";

const city = buildCity(raw as unknown as RawCity);
const SOURCES = /\b(google|yelp|tripadvisor|reddit|r\/\w+|tiktoks?)\b/i;
const rated = city.places.filter((p) => !p.unrated);

test("every rated spot has plausible community counts, the same every time", () => {
  for (const p of rated) {
    const s = communitySignals(p);
    expect(s.ranked).toBeGreaterThanOrEqual(3);
    expect(s.ranked).toBeLessThan(450);
    expect(s.saves).toBeGreaterThan(s.ranked);
    expect(s.moments).toBeGreaterThanOrEqual(p.moments.length);
    expect(communitySignals({ ...p })).toEqual(s);
  }
  // Bigger, better-known spots have more locals behind them than tiny ones.
  const byRanked = [...rated].sort((a, b) => communitySignals(b).ranked - communitySignals(a).ranked);
  expect(communitySignals(byRanked[0]).ranked).toBeGreaterThan(communitySignals(byRanked[byRanked.length - 1]).ranked * 3);
});

test("the lines people read never name an outside source", () => {
  for (const p of city.places) {
    expect(communityLine(p)).not.toMatch(SOURCES);
    expect(whyLocals(p)).not.toMatch(SOURCES);
    expect(gemLine(p) ?? "").not.toMatch(SOURCES);
  }
  const p = rated.find((x) => communitySignals(x).moments > 0)!;
  expect(communityLine(p)).toBe(`ranked ${scoreOutOf10(p.locals)} by ${communitySignals(p).ranked.toLocaleString("en-US")} locals · ${communitySignals(p).moments.toLocaleString("en-US")} ${communitySignals(p).moments === 1 ? "moment" : "moments"}`);
  const gem = city.places.find((x) => x.hiddenGem && (x.google?.count ?? 0) > 0 && (x.google?.count ?? 0) < 1000);
  if (gem) expect(gemLine(gem)).toBe("loved by locals, few visitors yet");
});

test("a plan's reasons cite locals on Faves, not outside sources", () => {
  const plan = makePlan(parseRequest("me and 3 friends, pickleball then hot pot then karaoke, saturday 1pm to 9pm", { hoods: city.hoods }), { city, now: new Date(Date.UTC(2026, 9, 24, 17)) });
  for (const s of plan.stops) expect(s.why).not.toMatch(SOURCES);
  expect(plan.stops.some((s) => /Ranked \d\.\d by [\d,]+ locals/.test(s.why))).toBe(true);
});
