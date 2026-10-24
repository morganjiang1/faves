// What a spot's page plays and its Spot Moments grid shows, in one order: the spot's own clips
// first (Faves posts taken there), then the ones you posted, newest first. Right now = your
// posts from the last 24 hours. Photos of the spot follow the clips, so every spot has
// something to swipe through.
import type { Moment, Place } from "@/data/types";

export type MomentTab = "highlights" | "now";

export const DEFAULT_CLIP_SECONDS = 12;

export function clipsFor(place: Place, mine: Moment[], hidden: string[], tab: MomentTab, now = Date.now()): Moment[] {
  const own = mine.filter((m) => !hidden.includes(m.id)).map((m) => ({ ...m, mine: true }));
  if (tab === "now") return own.filter((m) => m.postedAt && new Date(m.postedAt).getTime() > now - 24 * 3600_000);
  const theirs = place.moments.filter((m) => !hidden.includes(m.id));
  return [...theirs, ...own];
}

// One page of a spot's vertical player (and one tile of its grid).
export type SpotPage =
  | { key: string; kind: "clip"; moment: Moment }
  | { key: string; kind: "photo"; uri: string | null };

export function pagesFor(place: Place, mine: Moment[], hidden: string[], tab: MomentTab = "highlights", now = Date.now()): SpotPage[] {
  const pages: SpotPage[] = clipsFor(place, mine, hidden, tab, now).map((m) => ({ key: m.id, kind: "clip", moment: m }));
  if (tab === "now") return pages;
  const photos = [...new Set([place.image, ...place.photos].filter(Boolean) as string[])].slice(0, 4);
  photos.forEach((uri, i) => pages.push({ key: `photo-${i}`, kind: "photo", uri }));
  if (!pages.length) pages.push({ key: "photo-0", kind: "photo", uri: null });
  return pages;
}

export const clipSeconds = (m: Moment) => (m.duration && m.duration > 0 ? Math.min(m.duration, 90) : DEFAULT_CLIP_SECONDS);

// Instagram's story time: "now", "12m", "2h", "3d", "5w", "1y".
export function shortAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return "";
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  if (s < 365 * 86400) return `${Math.floor(s / (7 * 86400))}w`;
  return `${Math.floor(s / (365 * 86400))}y`;
}

// TikTok's play count on grid tiles: 582, 1,787, 10.4K, 556K, 2.8M.
export function playCount(n: number): string {
  if (n < 10_000) return n.toLocaleString("en-US");
  if (n < 1_000_000) return `${n < 100_000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") : Math.round(n / 1000)}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}
