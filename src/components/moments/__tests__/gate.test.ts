import raw from "@/data/cities/san-francisco.json";
import { buildCity } from "@/data/cities";
import type { RawCity } from "@/data/types";
import { clipsFor, shortAgo } from "../clips";
import { distanceText, openForPosting, postingGate } from "../gate";

const city = buildCity(raw as unknown as RawCity);
const peaks = city.places.find((p) => p.name === "Twin Peaks")!; // open 5 AM to midnight
const bridge = city.places.find((p) => p.name === "Golden Gate Bridge")!; // free, no listed hours

test("posting needs the phone within 150 m while it's open", () => {
  expect(postingGate(peaks, { lat: peaks.lat, lng: peaks.lng }, "granted", 6, 12 * 60, false)).toEqual({ kind: "ok", demo: false });
  const far = postingGate(peaks, { lat: peaks.lat + 0.02, lng: peaks.lng }, "granted", 6, 12 * 60, false);
  expect(far.kind).toBe("blocked");
  const closed = postingGate(peaks, { lat: peaks.lat, lng: peaks.lng }, "granted", 6, 2 * 60, false);
  expect(closed).toMatchObject({ kind: "blocked", near: true, open: { ok: false } });
});

test("free places with no listed hours count as open; demo mode stamps clips", () => {
  expect(openForPosting(bridge, 6, 3 * 60).ok).toBe(true);
  expect(postingGate(peaks, { lat: 0, lng: 0 }, "granted", 6, 600, true)).toEqual({ kind: "ok", demo: true });
  expect(postingGate(peaks, null, "denied", 6, 600, false)).toEqual({ kind: "denied" });
  expect(postingGate(peaks, null, "unavailable", 6, 600, false)).toEqual({ kind: "unavailable" });
  expect(distanceText(120)).toBe("120 m");
  expect(distanceText(3200)).toBe("2.0 mi");
});

test("reels: highlights sort by likes and skip hidden clips; right now is the last day", () => {
  const now = Date.parse("2026-10-24T12:00:00Z");
  const mine = [
    { id: "a", source: "faves" as const, creator: "me", views: 0, likes: 0, postedAt: "2026-10-24T11:00:00Z", caption: "", duration: 7 },
    { id: "b", source: "faves" as const, creator: "me", views: 0, likes: 0, postedAt: "2026-10-20T11:00:00Z", caption: "", duration: 7 },
  ];
  const hl = clipsFor(bridge, mine, [bridge.moments[0].id], "highlights", now);
  expect(hl.find((m) => m.id === bridge.moments[0].id)).toBeUndefined();
  expect(hl.length).toBe(bridge.moments.length - 1 + 2);
  expect(clipsFor(bridge, mine, [], "now", now).map((m) => m.id)).toEqual(["a"]);
  expect(shortAgo("2026-10-24T10:00:00Z", now)).toBe("2h");
  expect(shortAgo("2026-10-10T12:00:00Z", now)).toBe("2w");
});
