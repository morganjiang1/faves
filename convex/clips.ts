// Spot clips in Convex file storage: the app's bundled clips (npm run convex:clips) and
// the moments people post at a spot, which then show on that spot's postcard wall for everyone.
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

// A moment someone posted at a spot (the file is uploaded first with uploadUrl).
export const post = mutation({
  args: { placeId: v.string(), city: v.string(), file: v.id("_storage"), kind: v.string(), caption: v.string(), creator: v.string(), postedBy: v.string(), takenHere: v.boolean(), demo: v.boolean(), duration: v.optional(v.number()) },
  handler: async (ctx, a) => {
    const now = Date.now();
    await ctx.db.insert("clips", { placeId: a.placeId, city: a.city, order: now, video: a.file, creator: a.creator, plays: 0, postedBy: a.postedBy, kind: a.kind, caption: a.caption.slice(0, 300), takenHere: a.takenHere, demo: a.demo, duration: a.duration, postedAt: now });
  },
});

// What people posted at a spot, newest first.
export const forPlace = query({
  args: { placeId: v.string() },
  handler: async (ctx, { placeId }) => {
    const rows = (await ctx.db.query("clips").withIndex("by_place", (q) => q.eq("placeId", placeId)).order("desc").take(60)).filter((r) => r.postedBy);
    return Promise.all(rows.slice(0, 30).map(async (r) => ({ id: String(r._id), url: await ctx.storage.getUrl(r.video), kind: r.kind ?? "video", caption: r.caption ?? "", creator: r.creator ?? "someone", postedBy: r.postedBy!, takenHere: Boolean(r.takenHere), demo: Boolean(r.demo), duration: r.duration ?? null, postedAt: r.postedAt ?? r._creationTime })));
  },
});
