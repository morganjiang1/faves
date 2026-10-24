// Live details from Google Places API (New), used only when EXPO_PUBLIC_GOOGLE_MAPS_KEY is
// set. Our place ids are Google place ids, so the place page can confirm today's hours and
// the current rating. Without a key the bundled data is shown as is.
const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

export interface LivePlace { openNow: boolean | null; rating: number | null; count: number | null; todayHours: string | null }

export async function livePlace(placeId: string): Promise<LivePlace | null> {
  if (!KEY || !placeId.startsWith("ChIJ")) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "currentOpeningHours.openNow,currentOpeningHours.weekdayDescriptions,rating,userRatingCount" },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const day = (new Date().getDay() + 6) % 7; // Google lists Monday first
    return {
      openNow: typeof j?.currentOpeningHours?.openNow === "boolean" ? j.currentOpeningHours.openNow : null,
      rating: j?.rating ?? null,
      count: j?.userRatingCount ?? null,
      todayHours: j?.currentOpeningHours?.weekdayDescriptions?.[day] ?? null,
    };
  } catch {
    return null;
  }
}
