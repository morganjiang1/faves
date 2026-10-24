// Live Yelp rating from the Yelp Fusion API, used only when EXPO_PUBLIC_YELP_KEY is set.
// Yelp's API does not allow browser calls (no CORS), so this runs on the iPhone app only.
import { Platform } from "react-native";

const KEY = process.env.EXPO_PUBLIC_YELP_KEY;

export interface LiveYelp { rating: number; count: number; url: string; price: string | null }

export async function liveYelp(name: string, lat: number, lng: number): Promise<LiveYelp | null> {
  if (!KEY || Platform.OS === "web") return null;
  try {
    const q = new URLSearchParams({ term: name, latitude: String(lat), longitude: String(lng), radius: "300", limit: "1" });
    const res = await fetch(`https://api.yelp.com/v3/businesses/search?${q}`, { headers: { Authorization: `Bearer ${KEY}` } });
    if (!res.ok) return null;
    const b = (await res.json())?.businesses?.[0];
    if (!b) return null;
    return { rating: b.rating, count: b.review_count, url: b.url, price: b.price ?? null };
  } catch {
    return null;
  }
}
