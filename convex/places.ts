// The cities' spots in Convex: loaded once by scripts/convex-seed.mjs, then used for "find a
// spot by vibe" (vector search) and for booking details (reservation links, phone numbers).
import { v } from "convex/values";
import { vibeVector } from "../src/lib/vibe";
import { internal } from "./_generated/api";
import { action, internalQuery, mutation, query } from "./_generated/server";

export const insertBatch = mutation({
  args: { rows: v.array(v.object({ placeId: v.string(), city: v.string(), name: v.string(), kind: v.union(v.string(), v.null()), hood: v.union(v.string(), v.null()), locals: v.number(), reserveUrl: v.union(v.string(), v.null()), phone: v.union(v.string(), v.null()), lat: v.number(), lng: v.number(), embedding: v.array(v.float64()) })) },
  handler: async (ctx, { rows }) => {
    for (const r of rows) {
      const old = await ctx.db.query("places").withIndex("by_placeId", (q) => q.eq("placeId", r.placeId)).unique();
      if (old) await ctx.db.patch(old._id, r); else await ctx.db.insert("places", r);
    }
    return rows.length;
  },
});

export const count = query({ args: {}, handler: async (ctx) => (await ctx.db.query("places").take(5000)).length });

export const byIds = internalQuery({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    const out = [];
    for (const id of ids) {
      const p = await ctx.db.query("places").withIndex("by_placeId", (q) => q.eq("placeId", id)).unique();
      if (p) out.push({ placeId: p.placeId, name: p.name, reserveUrl: p.reserveUrl, phone: p.phone, kind: p.kind, hood: p.hood, lat: p.lat, lng: p.lng });
    }
    return out;
  },
});

// "somewhere cozy for a rainy afternoon" -> the closest spots by their words, best-loved first.
export const byVibe = action({
  args: { city: v.string(), vibe: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { city, vibe, limit = 5 }): Promise<{ placeId: string; name: string; kind: string | null; hood: string | null; locals: number; score: number }[]> => {
    const hits = await ctx.vectorSearch("places", "by_vibe", { vector: vibeVector(vibe), limit: 24, filter: (q) => q.eq("city", city) });
    const docs = await ctx.runQuery(internal.places.docs, { ids: hits.map((h) => h._id) });
    return docs
      .map((d, i) => ({ placeId: d.placeId, name: d.name, kind: d.kind, hood: d.hood, locals: d.locals, score: hits[i]._score + d.locals / 2500 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
});

export const docs = internalQuery({
  args: { ids: v.array(v.id("places")) },
  handler: async (ctx, { ids }) => (await Promise.all(ids.map((id) => ctx.db.get(id)))).filter((d) => d !== null),
});
