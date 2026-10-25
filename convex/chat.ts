// Group chats on Convex. One mutation applies any change with the same rules the relay and
// the phone use (src/chat/reduce.mjs), then stores what changed in tables. One live query
// gives each person everything they can see, so every phone updates instantly.
import { start, sendEvent } from "@convex-dev/workflow";
import { v } from "convex/values";
import { applyOp } from "../src/chat/reduce.mjs";
import type { ChatEvent, ChatOp, ChatState, Group, Member, Message, Ticket } from "../src/chat/reduce.mjs";
import { components, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const MENTION = /(^|\s)@(faves?|butler)\b/i;

async function groupJson(ctx: QueryCtx, g: Doc<"groups">): Promise<Group> {
  const members = (await ctx.db.query("members").withIndex("by_group", (q) => q.eq("groupId", g.groupId)).collect()).sort((a, b) => a.order - b.order);
  const locs = await ctx.db.query("locations").withIndex("by_group", (q) => q.eq("groupId", g.groupId)).collect();
  return {
    id: g.groupId, name: g.name, emoji: g.emoji, city: g.city, inviteCode: g.inviteCode, createdBy: g.createdBy, createdAt: g.createdAt, updatedAt: g.updatedAt,
    members: members.map((m) => ({ id: m.userId, name: m.name, handle: m.handle, ...(m.sample ? { sample: true } : {}) })),
    starts: Object.fromEntries(locs.map((l) => [l.userId, { hood: l.hood, lat: l.lat, lng: l.lng, mode: l.mode as "transit", live: l.live, at: l.at }])),
  };
}

async function ticketJson(ctx: QueryCtx, t: Doc<"plans">): Promise<Ticket> {
  const rsvps = await ctx.db.query("rsvps").withIndex("by_ticket", (q) => q.eq("ticketId", t.ticketId)).collect();
  const votes = await ctx.db.query("votes").withIndex("by_ticket", (q) => q.eq("ticketId", t.ticketId)).collect();
  return {
    id: t.ticketId, groupId: t.groupId, plan: t.plan, status: t.status as Ticket["status"], createdBy: t.createdBy, createdAt: t.createdAt, updatedAt: t.updatedAt, revision: t.revision,
    rsvps: Object.fromEntries(rsvps.map((r) => [r.userId, r.answer as "in"])),
    thumbs: Object.fromEntries(votes.map((x) => [x.userId, x.up])),
  };
}

const messageJson = (m: Doc<"messages">): Message => ({
  id: m.messageId, groupId: m.groupId, authorId: m.authorId, authorName: m.authorName, kind: m.kind as Message["kind"], createdAt: m.createdAt,
  ...(m.text != null ? { text: m.text } : {}), ...(m.ticketId ? { ticketId: m.ticketId } : {}), ...(m.placeId ? { placeId: m.placeId } : {}), ...(m.dayId ? { dayId: m.dayId } : {}),
});

const userJson = (u: Doc<"users">): Member => ({ id: u.userId, name: u.name, handle: u.handle, ...(u.interests ? { interests: u.interests } : {}), ...(u.mode ? { mode: u.mode as "transit" } : {}) });

// Everything one person can see, live.
export const snapshot = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 200 }) => {
    const mine = await ctx.db.query("members").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const groups: Group[] = [];
    const messages: Record<string, Message[]> = {};
    const tickets: Record<string, Ticket> = {};
    const users: Record<string, Member> = {};
    for (const m of mine) {
      const g = await ctx.db.query("groups").withIndex("by_groupId", (q) => q.eq("groupId", m.groupId)).unique();
      if (!g) continue;
      const gj = await groupJson(ctx, g);
      groups.push(gj);
      const recent = await ctx.db.query("messages").withIndex("by_group", (q) => q.eq("groupId", g.groupId)).order("desc").take(limit);
      messages[g.groupId] = recent.reverse().map(messageJson);
      for (const t of await ctx.db.query("plans").withIndex("by_group", (q) => q.eq("groupId", g.groupId)).collect()) tickets[t.ticketId] = await ticketJson(ctx, t);
      for (const member of gj.members) {
        const u = await ctx.db.query("users").withIndex("by_userId", (q) => q.eq("userId", member.id)).unique();
        if (u) users[u.userId] = userJson(u);
      }
    }
    return { groups, messages, tickets, users };
  },
});

export const findUser = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const h = handle.replace(/^@/, "").toLowerCase();
    const found = (await ctx.db.query("users").withIndex("by_handle", (q) => q.eq("handle", h)).collect()).sort((a, b) => b.seenAt - a.seenAt)[0];
    return found ? userJson(found) : null;
  },
});

// Load just the part of the world an op touches, in reduce.mjs's shape.
async function stateFor(ctx: MutationCtx, actorId: string, op: ChatOp): Promise<ChatState> {
  const state: ChatState = { groups: {}, messages: {}, tickets: {}, users: {} };
  const actor = await ctx.db.query("users").withIndex("by_userId", (q) => q.eq("userId", actorId)).unique();
  if (actor) state.users[actorId] = userJson(actor);
  let groupId: string | null = null;
  if ("groupId" in op) groupId = op.groupId;
  if (op.op === "send") groupId = op.message.groupId;
  if (op.op === "postTicket") groupId = op.ticket.groupId;
  if (op.op === "createGroup") groupId = op.group.id;
  if (op.op === "rsvp" || op.op === "vote" || op.op === "updateTicket") {
    const t = await ctx.db.query("plans").withIndex("by_ticketId", (q) => q.eq("ticketId", op.ticketId)).unique();
    if (t) { state.tickets[t.ticketId] = await ticketJson(ctx, t); groupId = t.groupId; }
  }
  if (op.op === "postTicket") {
    const t = await ctx.db.query("plans").withIndex("by_ticketId", (q) => q.eq("ticketId", op.ticket.id)).unique();
    if (t) state.tickets[t.ticketId] = await ticketJson(ctx, t);
  }
  const g = op.op === "join"
    ? await ctx.db.query("groups").withIndex("by_code", (q) => q.eq("inviteCode", op.code)).unique()
    : groupId ? await ctx.db.query("groups").withIndex("by_groupId", (q) => q.eq("groupId", groupId!)).unique() : null;
  if (g) state.groups[g.groupId] = await groupJson(ctx, g);
  if (op.op === "send") {
    const dup = await ctx.db.query("messages").withIndex("by_messageId", (q) => q.eq("messageId", op.message.id)).unique();
    if (dup) state.messages[dup.groupId] = [messageJson(dup)];
  }
  return state;
}

async function persist(ctx: MutationCtx, e: ChatEvent) {
  if (e.type === "user") {
    const u = await ctx.db.query("users").withIndex("by_userId", (q) => q.eq("userId", e.member.id)).unique();
    const row = { userId: e.member.id, name: e.member.name, handle: e.member.handle.toLowerCase(), interests: e.member.interests, mode: e.member.mode, seenAt: Date.now() };
    if (u) await ctx.db.patch(u._id, row); else await ctx.db.insert("users", row);
  } else if (e.type === "group") {
    const g = e.group;
    const row = { groupId: g.id, name: g.name, emoji: g.emoji, city: g.city, inviteCode: g.inviteCode, createdBy: g.createdBy, createdAt: g.createdAt, updatedAt: g.updatedAt };
    const existing = await ctx.db.query("groups").withIndex("by_groupId", (q) => q.eq("groupId", g.id)).unique();
    if (existing) await ctx.db.patch(existing._id, row); else await ctx.db.insert("groups", row);
    const rows = await ctx.db.query("members").withIndex("by_group", (q) => q.eq("groupId", g.id)).collect();
    const keep = new Set(g.members.map((m) => m.id));
    for (const r of rows) if (!keep.has(r.userId)) await ctx.db.delete(r._id);
    for (const [i, m] of g.members.entries()) {
      const r = rows.find((x) => x.userId === m.id);
      if (!r) await ctx.db.insert("members", { groupId: g.id, userId: m.id, name: m.name, handle: m.handle.toLowerCase(), sample: m.sample, order: i });
    }
    const locs = await ctx.db.query("locations").withIndex("by_group", (q) => q.eq("groupId", g.id)).collect();
    const starts = g.starts ?? {};
    for (const l of locs) if (!starts[l.userId]) await ctx.db.delete(l._id);
    for (const [userId, s] of Object.entries(starts)) {
      const row = { groupId: g.id, userId, hood: s.hood, lat: s.lat, lng: s.lng, mode: s.mode, live: s.live, at: s.at ?? Date.now() };
      const l = locs.find((x) => x.userId === userId);
      if (l) await ctx.db.patch(l._id, row); else await ctx.db.insert("locations", row);
    }
  } else if (e.type === "message") {
    const m = e.message;
    const dup = await ctx.db.query("messages").withIndex("by_messageId", (q) => q.eq("messageId", m.id)).unique();
    if (!dup) await ctx.db.insert("messages", { messageId: m.id, groupId: m.groupId, authorId: m.authorId, authorName: m.authorName, kind: m.kind, text: m.text, ticketId: m.ticketId, placeId: m.placeId, dayId: m.dayId, createdAt: m.createdAt });
    if (m.kind === "text" && m.text && MENTION.test(m.text)) {
      await ctx.scheduler.runAfter(0, internal.butler.reply, { groupId: m.groupId, text: m.text, askedBy: m.authorName });
    }
  } else if (e.type === "ticket") {
    const t = e.ticket;
    const existing = await ctx.db.query("plans").withIndex("by_ticketId", (q) => q.eq("ticketId", t.id)).unique();
    const row = { ticketId: t.id, groupId: t.groupId, plan: t.plan, status: t.status, createdBy: t.createdBy, createdAt: t.createdAt, updatedAt: t.updatedAt, revision: t.revision };
    let workflowId = existing?.workflowId;
    if (existing) await ctx.db.patch(existing._id, row);
    else {
      // Every new plan runs the durable plan flow: wait for the lock-in, then book and remind.
      workflowId = String(await start(ctx, internal.flow.planFlow, { ticketId: t.id }));
      await ctx.db.insert("plans", { ...row, workflowId });
    }
    if (existing && existing.status !== "locked" && t.status === "locked" && workflowId) {
      await sendEvent(ctx, components.workflow, { name: "locked", workflowId: workflowId as never });
    }
    for (const r of await ctx.db.query("rsvps").withIndex("by_ticket", (q) => q.eq("ticketId", t.id)).collect()) await ctx.db.delete(r._id);
    for (const [userId, answer] of Object.entries(t.rsvps)) await ctx.db.insert("rsvps", { ticketId: t.id, userId, answer });
    for (const r of await ctx.db.query("votes").withIndex("by_ticket", (q) => q.eq("ticketId", t.id)).collect()) await ctx.db.delete(r._id);
    for (const [userId, up] of Object.entries(t.thumbs)) await ctx.db.insert("votes", { ticketId: t.id, userId, up });
    for (const r of await ctx.db.query("stops").withIndex("by_ticket", (q) => q.eq("ticketId", t.id)).collect()) await ctx.db.delete(r._id);
    const stops = ((t.plan as { stops?: { placeId: string; start: number; end: number }[] })?.stops ?? []);
    for (const [index, s] of stops.entries()) await ctx.db.insert("stops", { ticketId: t.id, index, placeId: s.placeId, start: s.start, end: s.end });
  }
}

// Any change, from any member (or the butler).
export const apply = mutation({
  args: { actorId: v.string(), op: v.any() },
  handler: async (ctx, { actorId, op }) => {
    const state = await stateFor(ctx, actorId, op as ChatOp);
    const out = applyOp(state, op as ChatOp, { now: Date.now(), actorId });
    if (out.error) return { ok: false as const, error: out.error };
    for (const e of out.events) await persist(ctx, e);
    return { ok: true as const, result: out.result ?? null };
  },
});
