import { bestLeg, formatLeg, legFor, metersBetween, modeFor } from "../geo";
import { closesAt, dayHoursText, isOpenAt, nextOpen, openForVisit, statusAt } from "../hours";
import { sunTimes } from "../sunset";
import { cityClock, formatClock, isUsDst, offsetHours, wallDateFor } from "../time";
import type { Hours } from "@/data/types";

describe("time", () => {
  test("US daylight saving boundaries", () => {
    // 2026: DST runs from Mar 8 to Nov 1.
    expect(isUsDst(new Date(Date.UTC(2026, 2, 8, 1, 59)))).toBe(false);
    expect(isUsDst(new Date(Date.UTC(2026, 2, 8, 2, 0)))).toBe(true);
    expect(isUsDst(new Date(Date.UTC(2026, 9, 31, 12)))).toBe(true);
    expect(isUsDst(new Date(Date.UTC(2026, 10, 2, 12)))).toBe(false);
    expect(offsetHours(-8, new Date(Date.UTC(2026, 6, 1)))).toBe(-7);
    expect(offsetHours(-8, new Date(Date.UTC(2026, 0, 1)))).toBe(-8);
  });

  test("city clock reads local time", () => {
    // 2026-10-24 19:30 UTC = 12:30 PM in San Francisco (PDT, UTC-7), a Saturday.
    const c = cityClock(-8, new Date(Date.UTC(2026, 9, 24, 19, 30)));
    expect(c.day).toBe(6);
    expect(c.minutes).toBe(12 * 60 + 30);
  });

  test("formats clock times", () => {
    expect(formatClock(0)).toBe("12:00 AM");
    expect(formatClock(1170)).toBe("7:30 PM");
    expect(formatClock(1500)).toBe("1:00 AM");
    expect(formatClock(720, { compact: true })).toBe("12 PM");
  });

  test("wall date for a weekday", () => {
    const d = wallDateFor(-8, { weekday: 1 }, new Date(Date.UTC(2026, 9, 24, 19)));
    expect(d.getUTCDay()).toBe(1);
    expect(d.getUTCDate()).toBe(26);
  });
});

describe("geo", () => {
  const ferry = { lat: 37.7955, lng: -122.3937 };
  const coit = { lat: 37.8024, lng: -122.4058 };
  const twinPeaks = { lat: 37.7544, lng: -122.4477 };

  test("haversine distance", () => {
    expect(Math.round(metersBetween(ferry, coit))).toBeGreaterThan(1200);
    expect(Math.round(metersBetween(ferry, coit))).toBeLessThan(1400);
  });

  test("picks a sensible mode per hop", () => {
    expect(modeFor("transit", 400)).toBe("walk");
    expect(modeFor("walk", 1200)).toBe("walk");
    expect(modeFor("walk", 5000)).toBe("transit");
    expect(modeFor("drive", 5000)).toBe("drive");
  });

  test("legs read like Wanderlog", () => {
    const leg = legFor(ferry, coit, "walk");
    expect(leg.minutes).toBeGreaterThan(15);
    expect(leg.minutes).toBeLessThan(25);
    expect(formatLeg(leg)).toMatch(/^\d+ min walk • \d\.\d mi$/);
    expect(bestLeg(ferry, twinPeaks, "walk").mode).toBe("transit");
  });
});

describe("hours", () => {
  // Mon-Sat 11 AM to 2:30 PM and 5 to 10 PM; Fri and Sat 5 PM to 2 AM; Sunday closed.
  const lunchDinner: [number, number][] = [[660, 870], [1020, 1320]];
  const late: [number, number][] = [[660, 870], [1020, 1560]];
  const h: Hours = [[], lunchDinner, lunchDinner, lunchDinner, lunchDinner, late, late];

  test("open and closed", () => {
    expect(isOpenAt(h, 1, 12 * 60)).toBe(true);
    expect(isOpenAt(h, 1, 15 * 60)).toBe(false);
    expect(isOpenAt(h, 0, 12 * 60)).toBe(false);
    expect(isOpenAt(null, 1, 12 * 60)).toBeNull();
  });

  test("late nights carry into the next morning", () => {
    expect(isOpenAt(h, 0, 60)).toBe(true); // Saturday's 5 PM to 2 AM, at 1 AM Sunday
    expect(closesAt(h, 0, 60)).toBe(120);
  });

  test("visits must fit inside the opening", () => {
    expect(openForVisit(h, 1, 13 * 60, 60)).toBe(true);
    expect(openForVisit(h, 1, 14 * 60, 60)).toBe(false);
  });

  test("next opening and status lines", () => {
    expect(nextOpen(h, 1, 15 * 60)).toEqual({ dayOffset: 0, minute: 1020 });
    expect(statusAt({ hours: h, temporarilyClosed: false }, 1, 12 * 60)).toEqual({ state: "open", word: "Open", detail: "Closes 2:30 PM" });
    expect(statusAt({ hours: h, temporarilyClosed: false }, 0, 12 * 60).detail).toBe("Opens 11 AM tomorrow");
    expect(dayHoursText(h, 5)).toBe("11:00 AM to 2:30 PM, 5:00 PM to 2:00 AM");
    expect(dayHoursText(h, 0)).toBe("Closed");
  });
});

describe("sunset", () => {
  test("San Francisco on Oct 24, 2026", () => {
    // Solar noon about 12:53 PM PDT and about 10 hr 55 min of daylight: 7:26 AM to 6:20 PM.
    const s = sunTimes(37.7749, -122.4194, new Date(Date.UTC(2026, 9, 24)), -7)!;
    expect(Math.abs(s.sunset - (18 * 60 + 20))).toBeLessThanOrEqual(4);
    expect(Math.abs(s.sunrise - (7 * 60 + 26))).toBeLessThanOrEqual(4);
  });

  test("London at the March equinox", () => {
    // Greenwich, March 20: sunrise about 6:03 AM, sunset about 6:13 PM GMT.
    const s = sunTimes(51.4769, 0, new Date(Date.UTC(2026, 2, 20)), 0)!;
    expect(Math.abs(s.sunrise - (6 * 60 + 3))).toBeLessThanOrEqual(4);
    expect(Math.abs(s.sunset - (18 * 60 + 13))).toBeLessThanOrEqual(4);
  });

  test("New York in June", () => {
    // NOAA: sunset about 8:31 PM EDT on June 21.
    const s = sunTimes(40.7128, -74.006, new Date(Date.UTC(2026, 5, 21)), -4)!;
    expect(Math.abs(s.sunset - (20 * 60 + 31))).toBeLessThanOrEqual(4);
  });
});
