import { rankScores } from "../rankScore";
import { weekendStreak } from "../streak";
import type { Ranked } from "@/state/store";
import type { Plan } from "@/lib/planner";

const r = (placeId: string, sentiment: Ranked["sentiment"]): Ranked => ({ placeId, city: "san-francisco", name: placeId, hood: null, kind: null, sentiment, at: "2026-10-20T10:00:00Z" });

describe("rankScores", () => {
  test("spreads each bucket by position, best first", () => {
    const s = rankScores([r("a", "great"), r("b", "great"), r("c", "ok"), r("d", "bad"), r("e", "great")]);
    expect(s.get("a")).toBe(10);
    expect(s.get("b")).toBeCloseTo(8.9, 5);
    expect(s.get("e")).toBeCloseTo(7.8, 5);
    expect(s.get("c")).toBe(6.6);
    expect(s.get("d")).toBe(3.3);
  });
  test("scores stay inside their bucket", () => {
    const list = Array.from({ length: 30 }, (_, i) => r(`p${i}`, i % 3 === 0 ? "great" : i % 3 === 1 ? "ok" : "bad"));
    const s = rankScores(list);
    for (const x of list) {
      const v = s.get(x.placeId)!;
      if (x.sentiment === "great") expect(v).toBeGreaterThanOrEqual(6.7);
      if (x.sentiment === "ok") { expect(v).toBeGreaterThanOrEqual(3.4); expect(v).toBeLessThanOrEqual(6.6); }
      if (x.sentiment === "bad") expect(v).toBeLessThanOrEqual(3.3);
    }
  });
});

const plan = (dateISO: string) => ({ dateISO } as Plan);

describe("weekendStreak", () => {
  test("counts weekends in a row up to the latest one", () => {
    // 2026-10-24 is a Saturday.
    expect(weekendStreak([plan("2026-10-24"), plan("2026-10-18"), plan("2026-10-10")], "2026-10-24")).toBe(3);
  });
  test("this weekend not done yet does not break the streak", () => {
    expect(weekendStreak([plan("2026-10-18"), plan("2026-10-11")], "2026-10-24")).toBe(2);
  });
  test("weekdays and future days don't count", () => {
    expect(weekendStreak([plan("2026-10-21"), plan("2026-10-31")], "2026-10-24")).toBe(0);
  });
  test("a gap ends it", () => {
    expect(weekendStreak([plan("2026-10-17"), plan("2026-10-03")], "2026-10-22")).toBe(1);
  });
});
