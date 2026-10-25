// "Find a spot by vibe" without an embedding service: a spot's words (name, kind, what it is,
// what locals say) hashed into a 128-number vector, so similar words land near each other.
// The same function embeds a query ("cozy rainy day bookstore") for Convex vector search.
const DIMS = 128;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const STOP = new Set(["the", "and", "a", "an", "of", "in", "on", "for", "to", "with", "at", "is", "it", "my", "our", "we", "i", "you", "some", "place", "spot", "somewhere", "something", "good", "great", "best", "find", "near", "nearby", "around", "us", "me", "want", "looking", "day", "afternoon", "morning", "night", "evening", "today", "tonight"]);

// A few words people use for the same kind of place.
const SAME: Record<string, string> = {
  bookstore: "book store books bookshop", bookshop: "book store books", books: "book store",
  cafe: "coffee cafe", coffee: "coffee cafe espresso", rooftop: "rooftop roof terrace view", bar: "bar cocktail pub drinks",
  drinks: "bar cocktail wine", cozy: "cozy cosy quiet warm", quiet: "quiet calm cozy", view: "view views scenic lookout vista",
  museum: "museum gallery exhibit", hike: "hike trail hiking", dessert: "dessert ice cream bakery sweets", pizza: "pizza pizzeria",
};

export function vibeVector(text: string): number[] {
  const v = new Array<number>(DIMS).fill(0);
  const base = text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/);
  const words = base.flatMap((w) => [w, ...(SAME[w]?.split(" ") ?? [])]).filter((w) => w.length > 1 && !STOP.has(w));
  for (const w of words) {
    const h = hash(w);
    v[h % DIMS] += h & 1 ? 1 : -1;
    // Word pieces too, so "cozy" meets "cosy" and "bookstore" meets "books".
    for (let i = 0; i + 3 <= w.length; i++) {
      const g = hash(`#${w.slice(i, i + 3)}`);
      v[g % DIMS] += (g & 1 ? 1 : -1) * 0.35;
    }
  }
  const norm = Math.sqrt(v.reduce((t, x) => t + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export const VIBE_DIMS = DIMS;
