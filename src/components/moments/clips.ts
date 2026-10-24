// Which clips a Spot Moments reel plays, in the same order the place page's grid shows them
// (components/place/sections.tsx MomentsSection): Highlights = your clips plus the place's TikTok
// clips, most liked first; Right now = your clips from the last 24 hours.
import type { Moment, Place } from "@/data/types";

export type MomentTab = "highlights" | "now";

export const DEFAULT_CLIP_SECONDS = 12;

export function clipsFor(place: Place, mine: Moment[], hidden: string[], tab: MomentTab, now = Date.now()): Moment[] {
  const own = mine.filter((m) => !hidden.includes(m.id));
  if (tab === "now") return own.filter((m) => m.postedAt && new Date(m.postedAt).getTime() > now - 24 * 3600_000);
  const theirs = place.moments.filter((m) => !hidden.includes(m.id));
  return [...own, ...theirs].sort((a, b) => b.likes - a.likes);
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

// TikTok's official embed player (developers.tiktok.com/doc/embed-player) and the video page.
export const tiktokPlayerUrl = (id: string) => `https://www.tiktok.com/player/v1/${encodeURIComponent(id)}?autoplay=1&music_info=1&description=1&rel=0`;
export const tiktokVideoUrl = (creator: string, id: string) => `https://www.tiktok.com/@${encodeURIComponent(creator)}/video/${encodeURIComponent(id)}`;
