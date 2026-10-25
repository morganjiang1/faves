// The plan flow, as a durable Convex workflow: a plan is proposed in a chat, everyone answers,
// it gets locked in, then the agent books it and schedules reminders (the day before, and a
// leave-now nudge for each person with their own travel time). Survives restarts.
import { WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import * as lines from "../src/chat/lines";
import { FAVES_ID } from "../src/chat/reduce.mjs";
import { formatClock, offsetHours } from "../src/lib/time";
import { components, internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";

export const workflow = new WorkflowManager(components.workflow);

// Standard UTC offsets of the Faves cities (daylight saving is added by offsetHours).
const STD_OFFSET: Record<string, number> = { "new-york": -5, boston: -5, miami: -5, "washington-dc": -5, chicago: -6, austin: -6, seattle: -8, "san-francisco": -8, "los-angeles": -8, "san-diego": -8 };

type PlanJson = { id: string; title: string; dateISO: string; start: number; citySlug: string; stops: { placeId: string; start: number }[]; fairness?: { toFirst: { memberId: string; name: string; minutes: number; mode: string }[] } | null };

// Wall-clock minutes on the plan's day, in the plan's city, as a timestamp.
export function planTime(plan: PlanJson, minutes: number): number {
  const [y, m, d] = plan.dateISO.split("-").map(Number);
  const std = STD_OFFSET[plan.citySlug] ?? -8;
  const off = offsetHours(std, new Date(Date.UTC(y, m - 1, d, 12)));
  return Date.UTC(y, m - 1, d, 0, minutes) - off * 3600_000;
}

// Today's date in the city ("2026-10-25"), so the agent can say "today" or "tomorrow".
export function cityToday(citySlug: string, at = Date.now()): string {
  const off = offsetHours(STD_OFFSET[citySlug] ?? -8, new Date(at));
  return new Date(at + off * 3600_000).toISOString().slice(0, 10);
}

export const planFlow = workflow
  .define({ args: { ticketId: v.string() } })
  .handler(async (step, { ticketId }): Promise<void> => {
    // 1. Wait until someone in the group locks the plan in.
    await step.awaitEvent({ name: "locked" });
    // 2. Book what can be booked and say how in the chat.
    await step.runAction(internal.flow.book, { ticketId }, { retry: true });
    // 3. Schedule the reminders.
    await step.runMutation(internal.flow.scheduleReminders, { ticketId });
  });

export const ticket = internalQuery({
  args: { ticketId: v.string() },
  handler: async (ctx, { ticketId }) => {
    const t = await ctx.db.query("plans").withIndex("by_ticketId", (q) => q.eq("ticketId", ticketId)).unique();
    if (!t) return null;
    const g = await ctx.db.query("groups").withIndex("by_groupId", (q) => q.eq("groupId", t.groupId)).unique();
    const going = (await ctx.db.query("rsvps").withIndex("by_ticket", (q) => q.eq("ticketId", ticketId)).collect()).filter((r) => r.answer === "in").length;
    return { groupId: t.groupId, plan: t.plan as PlanJson, status: t.status, butlerName: g?.butlerName ?? "Fave", going };
  },
});

export async function butlerSays(ctx: MutationCtx, groupId: string, text: string, extra: { ticketId?: string; placeId?: string } = {}) {
  const g = await ctx.db.query("groups").withIndex("by_groupId", (q) => q.eq("groupId", groupId)).unique();
  await ctx.db.insert("messages", { messageId: `fave-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, groupId, authorId: FAVES_ID, authorName: g?.butlerName ?? "Fave", kind: "agent", text, createdAt: Date.now(), ...extra });
}

export const say = internalMutation({
  args: { groupId: v.string(), text: v.string(), ticketId: v.optional(v.string()), placeId: v.optional(v.string()) },
  handler: async (ctx, { groupId, text, ticketId, placeId }) => butlerSays(ctx, groupId, text, { ticketId, placeId }),
});

export const book = internalAction({
  args: { ticketId: v.string() },
  handler: async (ctx, { ticketId }) => {
    const t = await ctx.runQuery(internal.flow.ticket, { ticketId });
    if (!t) return;
    const places = await ctx.runQuery(internal.places.byIds, { ids: t.plan.stops.map((s) => s.placeId) });
    const rows = t.plan.stops.map((s) => {
      const p = places.find((x) => x.placeId === s.placeId);
      // A short tappable label ("Reserve on Google"), never the long reservation URL; the
      // number to call for places that only book by phone; else walk in.
      const phone = p?.phone && /restaurant|bar|food|class/i.test(p.kind ?? "") ? p.phone : null;
      return lines.bookLine({ at: s.start, name: p?.name, url: p?.reserveUrl, phone });
    });
    await ctx.runMutation(internal.flow.say, { groupId: t.groupId, ticketId, text: lines.bookMessage(lines.bookLead(t.status === "locked", t.going), rows) });
  },
});

async function schedule(ctx: MutationCtx, ticketId: string, moved: boolean) {
  const t = await ctx.db.query("plans").withIndex("by_ticketId", (q) => q.eq("ticketId", ticketId)).unique();
  if (!t) return;
  const plan = t.plan as PlanJson;
  const first = await ctx.db.query("places").withIndex("by_placeId", (q) => q.eq("placeId", plan.stops[0]?.placeId ?? "")).unique();
  const firstName = first?.name ?? "the first stop";
  const firstAt = plan.stops[0]?.start ?? plan.start;
  const start = planTime(plan, firstAt);
  const now = Date.now();
  const wanted: { at: number; text: string; kind: "night" | "leave" | "heads-up" }[] = [];
  // The day before, at 7 PM in the city.
  wanted.push({ at: planTime(plan, -5 * 60), text: lines.nightBeforeLine(plan.title, firstName, firstAt), kind: "night" });
  // Leave now, for each person, from their own starting point.
  const firstTime = planTime(plan, firstAt);
  for (const l of plan.fairness?.toFirst ?? []) wanted.push({ at: firstTime - (l.minutes + 10) * 60_000, text: lines.leaveLine(l.name, l.minutes, l.mode), kind: "leave" });
  if (!plan.fairness?.toFirst?.length) wanted.push({ at: start - 45 * 60_000, text: lines.headsUpLine(firstName), kind: "heads-up" });
  const set = new Set<string>();
  for (const w of wanted) {
    if (w.at < now - 60_000) continue; // already past
    const id = await ctx.db.insert("reminders", { groupId: t.groupId, ticketId, at: w.at, text: w.text, sent: false });
    await ctx.scheduler.runAt(Math.max(w.at, now + 1000), internal.flow.sendReminder, { reminderId: id });
    set.add(w.kind);
  }
  // Say only the reminders that will really go out.
  const leave = set.has("leave") ? "each" : set.has("heads-up") ? "heads-up" : null;
  await butlerSays(ctx, t.groupId, moved ? lines.remindersMovedLine(firstAt) : lines.remindersSetLine({ nightBefore: set.has("night"), leave }), { ticketId });
}

export const scheduleReminders = internalMutation({
  args: { ticketId: v.string() },
  handler: async (ctx, { ticketId }) => schedule(ctx, ticketId, false),
});

// The plan changed after it was locked in (running late, rain): drop the reminders that haven't
// gone out and set new ones for the new times. A dropped reminder's scheduled send finds nothing.
export const rescheduleReminders = internalMutation({
  args: { ticketId: v.string() },
  handler: async (ctx, { ticketId }) => {
    for (const r of await ctx.db.query("reminders").withIndex("by_ticket", (q) => q.eq("ticketId", ticketId)).collect()) if (!r.sent) await ctx.db.delete(r._id);
    await schedule(ctx, ticketId, true);
  },
});

// A reminder's time on the city's clock: "Fri 7 PM".
export function wallTime(at: number, citySlug: string): string {
  const off = offsetHours(STD_OFFSET[citySlug] ?? -8, new Date(at));
  const d = new Date(at + off * 3600_000);
  return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]} ${formatClock(d.getUTCHours() * 60 + d.getUTCMinutes(), { compact: true })}`;
}

export const remindersFor = internalQuery({
  args: { ticketId: v.string() },
  handler: async (ctx, { ticketId }) => {
    const t = await ctx.db.query("plans").withIndex("by_ticketId", (q) => q.eq("ticketId", ticketId)).unique();
    const rs = await ctx.db.query("reminders").withIndex("by_ticket", (q) => q.eq("ticketId", ticketId)).collect();
    return rs.sort((a, b) => a.at - b.at).map((r) => ({ at: r.at, when: wallTime(r.at, (t?.plan as PlanJson | undefined)?.citySlug ?? "san-francisco"), text: r.text, sent: r.sent }));
  },
});

export const sendReminder = internalMutation({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const r = await ctx.db.get(reminderId);
    if (!r || r.sent) return;
    await ctx.db.patch(reminderId, { sent: true });
    await butlerSays(ctx, r.groupId, r.text, { ticketId: r.ticketId });
  },
});

// Safety net for the scheduler (crons.ts): send anything due that hasn't gone out.
export const sweepReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const due = await ctx.db.query("reminders").withIndex("by_due", (q) => q.eq("sent", false).lte("at", Date.now())).take(50);
    for (const r of due) {
      await ctx.db.patch(r._id, { sent: true });
      await butlerSays(ctx, r.groupId, r.text, { ticketId: r.ticketId });
    }
  },
});
