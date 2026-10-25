// Spot clips in Convex file storage (uploaded by scripts/convex-upload-clips.mjs); the app
// streams them from here when Convex is set up and falls back to the clips in the app.
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const uploadUrl = mutation({ args: {}, handler: async (ctx) => ctx.storage.generateUploadUrl() });

export const save = mutation({
  args: { placeId: v.string(), city: v.string(), order: v.number(), video: v.id("_storage"), poster: v.optional(v.id("_storage")), creator: v.optional(v.string()), plays: v.optional(v.number()) },
  handler: async (ctx, row) => {
    const old = (await ctx.db.query("clips").withIndex("by_place", (q) => q.eq("placeId", row.placeId).eq("order", row.order)).collect())[0];
    if (old) await ctx.db.patch(old._id, row); else await ctx.db.insert("clips", row);
  },
});

export const forCity = query({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    const rows = await ctx.db.query("clips").withIndex("by_city", (q) => q.eq("city", city)).collect();
    return Promise.all(rows.map(async (r) => ({ placeId: r.placeId, order: r.order, video: await ctx.storage.getUrl(r.video), poster: r.poster ? await ctx.storage.getUrl(r.poster) : null, creator: r.creator ?? null, plays: r.plays ?? null })));
  },
});
