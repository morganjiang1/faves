// Beli-style scores from your own ranking: every spot sits in a sentiment bucket ("I liked
// it" 6.7 to 10, "It was fine" 3.4 to 6.6, "I didn't like it" 0 to 3.3) and is spread by
// its position inside the bucket, best first. The score only reflects your own order.
import type { Ranked, Sentiment } from "@/state/store";

export const BUCKETS: Record<Sentiment, [number, number]> = { great: [6.7, 10], ok: [3.4, 6.6], bad: [0, 3.3] };

export function rankScores(rankings: Ranked[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of ["great", "ok", "bad"] as Sentiment[]) {
    const list = rankings.filter((r) => r.sentiment === s);
    const [lo, hi] = BUCKETS[s];
    list.forEach((r, i) => {
      out.set(r.placeId, Math.round((hi - ((hi - lo) * i) / list.length) * 10) / 10);
    });
  }
  return out;
}

// Beli's score colors by bucket, sampled from its map pins (beli_appstore_ipad_list_map_toggle):
// green #329966, yellow #F2C34A (darkened to #B8901F so the number stays readable on a white
// circle), red #D2605E.
export const SENTIMENT_TINT: Record<Sentiment, string> = { great: "#329966", ok: "#B8901F", bad: "#D2605E" };
