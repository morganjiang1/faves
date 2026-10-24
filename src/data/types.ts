// Shapes of the bundled city data (written by data/scripts/export.mjs) and the friendlier
// objects the app works with after loading.
import type { CategoryId } from "@/theme/tokens";

export type Hours = [number, number][][]; // 7 days (0 = Sunday) of [open, close] minutes from midnight

export interface RawPlace {
  id: string;
  n: string;
  c: CategoryId;
  k: string | null;
  kw: string | null;
  la: number;
  lo: number;
  a: string | null;
  h: string | null;
  p: 1 | 2 | 3 | 4 | null;
  f: boolean;
  img: string | null;
  ph: string[];
  hr: Hours | null;
  rs: string | null;
  w: string | null;
  t: string | null;
  g: string | null;
  tc?: boolean;
  rt: { g?: [number, number]; y?: [number, number, string | null]; ta?: [number, number] };
  me: [number, number, number, number];
  q: { s: "reddit" | "tiktok"; t: string; u: string }[];
  sc: [number, number, number, number];
  gem?: boolean;
  lp?: boolean;
  d: string | null;
  mo?: { id: string; u: string; v: number; l: number; at: string | null; cap: string; dur: number | null; cv?: string }[];
}

export interface RawCourt { id: string; s: "tennis" | "basketball" | "pickleball"; la: number; lo: number; n: number; nm: string | null; sf: string | null; lit?: boolean; ac: string | null; pid?: string }
export interface RawView { id: string; nm: string; la: number; lo: number; pid?: string }

export interface RawCity {
  v: number;
  slug: string;
  name: string;
  subreddit: string;
  utcOffset: number;
  builtAt: string;
  center: [number, number];
  hoods: string[];
  places: RawPlace[];
  courts: RawCourt[];
  views: RawView[];
}

export interface Moment {
  id: string; // TikTok video id, or a local id for clips posted in the app
  source: "tiktok" | "faves";
  creator: string;
  views: number;
  likes: number;
  postedAt: string | null;
  caption: string;
  duration: number | null;
  uri?: string; // local clip file for moments posted in the app
  cover?: string | null; // TikTok cover image (signed link, may expire; the tile falls back to the place photo)
  kind?: "video" | "photo";
  takenHere?: boolean;
  demo?: boolean; // posted in demo mode: location not verified
}

export interface Quote { source: "reddit" | "tiktok"; text: string; url: string }

export interface Place {
  id: string;
  name: string;
  category: CategoryId;
  kind: string | null;
  kinds: string[];
  lat: number;
  lng: number;
  address: string | null;
  hood: string | null;
  priceLevel: 1 | 2 | 3 | 4 | null;
  free: boolean;
  image: string | null;
  photos: string[];
  hours: Hours | null;
  reserveUrl: string | null;
  website: string | null;
  phone: string | null;
  googleUrl: string | null;
  temporarilyClosed: boolean;
  google: { rating: number; count: number } | null;
  yelp: { rating: number; count: number; url: string | null } | null;
  tripadvisor: { rating: number; count: number } | null;
  reddit: { mentions: number; votes: number };
  tiktok: { mentions: number; views: number };
  quotes: Quote[];
  locals: number; // Locals Score 0 to 100
  quality: number;
  localLove: number;
  exposure: number;
  hiddenGem: boolean;
  localPick: boolean;
  description: string | null;
  moments: Moment[];
  unrated?: boolean; // OpenStreetMap courts and viewpoints with no ratings anywhere
  // Courts carry their OpenStreetMap details.
  court?: { sport: RawCourt["s"]; count: number; surface: string | null; lit: boolean; access: string | null };
}

export interface City {
  slug: string;
  name: string;
  subreddit: string;
  utcOffset: number;
  builtAt: string;
  center: { lat: number; lng: number };
  hoods: string[];
  places: Place[];
  byId: Map<string, Place>;
}

export interface CityIndexRow { slug: string; name: string; center: [number, number]; places: number; courts: number; utcOffset: number }
