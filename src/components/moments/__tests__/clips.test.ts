import raw from "@/data/cities/san-francisco.json";
import { buildCity, spotMoments } from "@/data/cities";
import type { Moment, RawCity } from "@/data/types";
import { CLIPS, MORE_CLIPS } from "@/data/videos";
import { pagesFor, playCount } from "../clips";

const city = buildCity(raw as unknown as RawCity);
const bridge = city.places.find((p) => p.name === "Golden Gate Bridge")!;
const noClip = city.places.find((p) => !CLIPS[p.id] && !p.court && p.image)!;

test("a spot's clips are Faves posts: a username, a play count, taken there", () => {
  const posts = spotMoments(bridge.id);
  expect(posts.length).toBe(1 + (MORE_CLIPS[bridge.id]?.length ?? 0));
  for (const m of posts) {
    expect(m.source).toBe("faves");
    expect(m.creator).not.toMatch(/^@/);
    expect(m.asset?.video).toBeDefined();
    expect(m.takenHere).toBe(true);
  }
  expect(bridge.moments.map((m) => m.id)).toEqual(posts.map((m) => m.id));
  // Clip entries carry no link back to where a clip came from.
  expect(Object.keys(CLIPS[bridge.id])).not.toContain("sourceUrl");
});

test("the player plays the spot's clips, then yours, then its photos; a spot with nothing still has a page", () => {
  const mine: Moment[] = [{ id: "mine-1", source: "faves", creator: "me", views: 0, likes: 0, postedAt: new Date().toISOString(), caption: "", duration: 5, uri: "file:///clip.mp4", kind: "video", takenHere: true }];
  const pages = pagesFor(bridge, mine, []);
  const clips = pages.filter((p) => p.kind === "clip");
  expect(clips.length).toBe(bridge.moments.length + 1);
  expect(clips[0].kind === "clip" && clips[0].moment.id).toBe(bridge.moments[0].id);
  expect(clips[clips.length - 1].kind === "clip" && clips[clips.length - 1].moment.mine).toBe(true);
  expect(pages[pages.length - 1].kind).toBe("photo");
  // Hidden posts drop out; Right now only shows your posts from the last day.
  expect(pagesFor(bridge, mine, [bridge.moments[0].id]).filter((p) => p.kind === "clip").length).toBe(bridge.moments.length);
  expect(pagesFor(bridge, mine, [], "now").map((p) => p.key)).toEqual(["mine-1"]);

  const photoOnly = pagesFor(noClip, [], []);
  expect(photoOnly.length).toBeGreaterThan(0);
  expect(photoOnly.every((p) => p.kind === "photo")).toBe(true);
  expect(pagesFor({ ...noClip, image: null, photos: [] }, [], [])).toEqual([{ key: "photo-0", kind: "photo", uri: null }]);
});

test("play counts read like TikTok's grid", () => {
  expect(playCount(582)).toBe("582");
  expect(playCount(1787)).toBe("1,787");
  expect(playCount(10_400)).toBe("10.4K");
  expect(playCount(556_000)).toBe("556K");
  expect(playCount(2_800_000)).toBe("2.8M");
  expect(playCount(3_000_000)).toBe("3M");
});
