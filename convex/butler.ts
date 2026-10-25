// Each group's agent ("Fave" unless the group renames it), built on the Convex Agent
// component: one thread per group, tools that plan, re-plan, find spots by vibe and sum up
// the chat. It reasons with ASI:One (asi1-mini) when ASI_ONE_API_KEY is set; without a key it
// answers with plain rules and the same tools, so it always works. Every change it makes to
// a plan is posted as a change note that says who asked.
import { createOpenAI } from "@ai-sdk/openai";
import { Agent, createThread, createTool, stepCountIs } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod/v3";
import * as lines from "../src/chat/lines";
import { chatterFor, FAVES_ID } from "../src/chat/reduce.mjs";
import { api, components, internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { cityToday } from "./flow";

const FAVES_API = () => (process.env.FAVES_API_URL ?? "http://localhost:8787").replace(/\/$/, "");
const asi = () => createOpenAI({ apiKey: process.env.ASI_ONE_API_KEY ?? "", baseURL: "https://api.asi1.ai/v1" });

async function call<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${FAVES_API()}/api/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? `Faves API ${r.status}`);
  return data as T;
}

type GroupView = {
  groupId: string; name: string; city: string; butlerName: string; threadId: string | null;
  members: { id: string; name: string }[];
  starts: { id: string; name: string; hood: string | null; lat: number; lng: number; mode: string }[];
  ticket: { ticketId: string; plan: { id: string; title: string; dateISO?: string; start?: number; end?: number; stops: { placeId: string; start?: number; end?: number }[]; request?: { raw?: string } }; status: string; going: string[] } | null;
  recent: { author: string; text: string }[];
};

// Proposed option tickets in a group, with their thumbs.
export const openOptions = internalQuery({
  args: { groupId: v.string() },
  handler: async (ctx, { groupId }) => {
    const plans = (await ctx.db.query("plans").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect()).filter((p) => p.status === "proposed" && /^Option [A-Z]:/.test((p.plan as { title?: string })?.title ?? ""));
    return Promise.all(plans.map(async (p) => ({ ticketId: p.ticketId, title: (p.plan as { title: string }).title, createdAt: p.createdAt, thumbs: (await ctx.db.query("votes").withIndex("by_ticket", (q) => q.eq("ticketId", p.ticketId)).collect()).filter((x) => x.up).length })));
  },
});

export const view = internalQuery({
  args: { groupId: v.string() },
  handler: async (ctx, { groupId }): Promise<GroupView | null> => {
    const g = await ctx.db.query("groups").withIndex("by_groupId", (q) => q.eq("groupId", groupId)).unique();
    if (!g) return null;
    const members = await ctx.db.query("members").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    const locs = await ctx.db.query("locations").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    const plans = await ctx.db.query("plans").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    const t = plans.sort((a, b) => (b.status === "locked" ? 1 : 0) - (a.status === "locked" ? 1 : 0) || b.updatedAt - a.updatedAt)[0] ?? null;
    // Who's in, by name (the tl;dr says it).
    const going = t ? (await ctx.db.query("rsvps").withIndex("by_ticket", (q) => q.eq("ticketId", t.ticketId)).collect()).filter((r) => r.answer === "in").map((r) => members.find((m) => m.userId === r.userId)?.name ?? "Someone") : [];
    const recent = (await ctx.db.query("messages").withIndex("by_group", (q) => q.eq("groupId", groupId)).order("desc").take(40)).reverse();
    return {
      groupId, name: g.name, city: g.city, butlerName: g.butlerName ?? "Fave", threadId: g.butlerThread ?? null,
      members: members.map((m) => ({ id: m.userId, name: m.name })),
      starts: locs.map((l) => ({ id: l.userId, name: members.find((m) => m.userId === l.userId)?.name ?? "Someone", hood: l.hood, lat: l.lat, lng: l.lng, mode: l.mode })),
      ticket: t ? { ticketId: t.ticketId, plan: t.plan, status: t.status, going } : null,
      // tl;dr's "Lately": what people said to each other, not the asks to the agent.
      recent: chatterFor(recent, g.butlerName ?? "Fave").map((m) => ({ author: m.authorName, text: m.text! })),
    };
  },
});

export const logRun = internalMutation({
  args: { groupId: v.string(), kind: v.string(), askedBy: v.optional(v.string()), input: v.string(), output: v.optional(v.string()), status: v.string() },
  handler: async (ctx, row) => ctx.db.insert("agentRuns", { ...row, startedAt: Date.now(), finishedAt: row.status === "running" ? undefined : Date.now() }),
});

export const setThread = internalMutation({
  args: { groupId: v.string(), threadId: v.string() },
  handler: async (ctx, { groupId, threadId }) => {
    const g = await ctx.db.query("groups").withIndex("by_groupId", (q) => q.eq("groupId", groupId)).unique();
    if (g) await ctx.db.patch(g._id, { butlerThread: threadId });
  },
});

// ---- What the agent can do (shared by the model's tools and the rules) --------------------

async function planDay(ctx: ActionCtx, g: GroupView, text: string, askedBy: string, opts: { exclude?: string[]; label?: string; quiet?: boolean } = {}) {
  const friends = g.starts.map((s) => ({ id: s.id, name: s.name, from: s.hood ?? undefined, lat: s.lat, lng: s.lng, mode: s.mode }));
  const res = await call<{ raw: { title: string; dateISO?: string; stops: { placeId: string }[] }; title: string; fairLine: string | null; travel: { name: string; minutes: number; mode: string }[] }>("plan", { city: g.city, text: `${text}${/\b(friends|of us|people)\b/.test(text) ? "" : `, ${g.members.length} of us`}`, friends, exclude: opts.exclude ?? [] });
  if (!res.raw || !res.raw.stops?.length) return lines.COULDNT_PLAN;
  if (opts.label) res.raw.title = `${opts.label}: ${res.raw.title}`;
  const ticketId = `t-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await ctx.runMutation(api.chat.apply, { actorId: FAVES_ID, op: { op: "postTicket", ticket: { id: ticketId, groupId: g.groupId, plan: res.raw, status: "proposed", createdBy: FAVES_ID, rsvps: {} }, message: { id: `m-${ticketId}`, groupId: g.groupId, authorId: FAVES_ID, authorName: g.butlerName, kind: "ticket", ticketId } } });
  if (opts.quiet) return res.raw.stops.map((s) => s.placeId).join(",");
  // Each person's travel time is on the ticket; the message only says it's fair.
  return lines.planLine({ title: res.title, day: lines.dayWord(res.raw.dateISO, cityToday(g.city)), fairLine: res.travel.length > 1 ? res.fairLine : null });
}

// Two different plans to choose from: Option A and Option B, then everyone votes with a thumbs up.
async function planOptions(ctx: ActionCtx, g: GroupView, text: string, askedBy: string) {
  const ask = text.replace(/\b(give us|some|a few|two|2|three|3|options?|choices|ideas|to vote on|vote)\b/gi, " ").replace(/\s+/g, " ").trim() || "something fun and food";
  const a = await planDay(ctx, g, ask, askedBy, { label: "Option A", quiet: true });
  if (a === lines.COULDNT_PLAN) return a;
  const b = await planDay(ctx, g, ask, askedBy, { label: "Option B", quiet: true, exclude: a.split(",") });
  if (b === lines.COULDNT_PLAN) return lines.ONE_OPTION;
  return lines.optionsLine(g.butlerName);
}

// Count the thumbs on the open options and lock in the one with the most.
async function pickWinner(ctx: ActionCtx, g: GroupView): Promise<string> {
  const open = await ctx.runQuery(internal.butler.openOptions, { groupId: g.groupId });
  if (open.length < 2) return lines.NO_VOTE;
  const best = [...open].sort((x, y) => y.thumbs - x.thumbs || x.createdAt - y.createdAt);
  if (best[0].thumbs === 0) return lines.NO_VOTES_YET;
  if (best[0].thumbs === best[1].thumbs) return lines.tieLine(best[0].thumbs);
  const label = best[0].title.split(":")[0];
  await ctx.runMutation(api.chat.apply, { actorId: FAVES_ID, op: { op: "updateTicket", ticketId: best[0].ticketId, patch: { status: "locked" }, note: `${g.butlerName} locked in ${label}` } });
  // Locking it books it: the booking message right after says "Locked in!" and how to book.
  return lines.winnerLine(label, best[0].thumbs);
}

async function changePlan(ctx: ActionCtx, g: GroupView, text: string, askedBy: string) {
  if (!g.ticket) return lines.NO_PLAN;
  const res = await call<{ raw: unknown; message: string; changed: number[] }>("replan", { plan: g.ticket.plan, text });
  if (!res.changed.length && !/late/i.test(text)) return res.message;
  // The note on the ticket says who asked for what; the message says what changed.
  await ctx.runMutation(api.chat.apply, { actorId: FAVES_ID, op: { op: "updateTicket", ticketId: g.ticket.ticketId, patch: { plan: res.raw }, note: lines.changeNote(askedBy, lines.changeGist(text, res.message)) } });
  if (g.ticket.status !== "locked") return res.message;
  // Locked in: say what changed first, then the reminders move (and say so).
  await ctx.runMutation(internal.flow.say, { groupId: g.groupId, text: res.message, ticketId: g.ticket.ticketId });
  await ctx.runMutation(internal.flow.rescheduleReminders, { ticketId: g.ticket.ticketId });
  return "";
}

async function swap(ctx: ActionCtx, g: GroupView, stop: string, want: string, askedBy: string) {
  if (!g.ticket) return lines.NO_PLAN;
  const res = await call<{ raw: unknown; changed: { stop: number; from: string; to: string; asked: string | null; matched: boolean } }>("swap", { plan: g.ticket.plan, stop: /^\d+$/.test(stop) ? Number(stop) : stop, want });
  const c = res.changed;
  await ctx.runMutation(api.chat.apply, { actorId: FAVES_ID, op: { op: "updateTicket", ticketId: g.ticket.ticketId, patch: { plan: res.raw }, note: lines.changeNote(askedBy, `swap ${c.from}`) } });
  // Say which stop changed; when nothing matched what they named, say that too.
  return lines.swapLine(c.from, c.to, c.matched === false ? c.asked : null);
}

async function findByVibe(ctx: ActionCtx, g: GroupView, vibe: string) {
  const hits = await ctx.runAction(api.places.byVibe, { city: g.city, vibe, limit: 3 });
  if (!hits.length) {
    // Nothing in our data: scout it live (Apify) through the Faves server.
    const s = await call<{ spots: { name: string; hood: string | null }[] }>("scout", { city: g.city, query: vibe }).catch(() => ({ spots: [] }));
    return s.spots.length ? lines.spotsLine(s.spots.map((x) => (x.hood ? `${x.name} in ${x.hood}` : x.name))) : lines.SPOT_NOT_FOUND;
  }
  // The best two as postcards; a third, if there is one, as a line (never the same names twice).
  for (const h of hits.slice(0, 2)) await ctx.runMutation(internal.flow.say, { groupId: g.groupId, placeId: h.placeId, text: `${h.name}${h.hood ? `, ${h.hood}` : ""}` });
  return hits[2] ? `Or try ${hits[2].name}.` : "";
}

// Book: post how to book each stop (links, the number to call, walk-in). The flow posts the message itself.
async function bookIt(ctx: ActionCtx, g: GroupView): Promise<string> {
  if (!g.ticket) return lines.NO_PLAN_TO_BOOK;
  await ctx.runAction(internal.flow.book, { ticketId: g.ticket.ticketId });
  return "";
}

// Remind us: say which reminders are set, or what it takes to set them.
async function remindUs(ctx: ActionCtx, g: GroupView): Promise<string> {
  if (!g.ticket) return lines.NO_PLAN;
  if (g.ticket.status !== "locked") return lines.LOCK_FOR_REMINDERS;
  let rs = await ctx.runQuery(internal.flow.remindersFor, { ticketId: g.ticket.ticketId });
  if (!rs.length) {
    await ctx.runMutation(internal.flow.scheduleReminders, { ticketId: g.ticket.ticketId });
    rs = await ctx.runQuery(internal.flow.remindersFor, { ticketId: g.ticket.ticketId });
  }
  const left = rs.filter((r) => !r.sent);
  if (!left.length) return lines.REMINDERS_SENT;
  return lines.remindersListLine(left);
}

function summary(g: GroupView) {
  const p = g.ticket?.plan;
  // The first stop's time, so a plan that moved (running late) reads right.
  const at = p?.stops[0]?.start ?? p?.start ?? null;
  return lines.tldrLine({
    plan: g.ticket && p ? { title: p.title, day: lines.dayWord(p.dateISO, cityToday(g.city)), at } : null,
    locked: g.ticket?.status === "locked",
    going: g.ticket?.going ?? [],
    chatter: g.recent,
  });
}

// ---- The agent ------------------------------------------------------------------------------

type ButlerAgent = { generateText: (ctx: ActionCtx, thread: { threadId: string }, args: { prompt: string }) => Promise<{ text: string }> };

function butlerAgent(g: GroupView, askedBy: string): ButlerAgent {
  // Typed loosely: the tools' combined type is too deep for TypeScript to spell out.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    name: g.butlerName,
    languageModel: asi().chat("asi1-mini"),
    instructions: lines.agentInstructions({ butlerName: g.butlerName, name: g.name, people: g.members.length }),
    tools: {
      planDay: createTool({ description: "Plan a day or hangout for the group and post it as a ticket.", inputSchema: z.object({ request: z.string().describe("what, when, budget, e.g. 'saturday 1pm to 6pm, pickleball then hot pot'") }), execute: async (ctx, { request }): Promise<string> => planDay(ctx, g, request, askedBy) }),
      changePlan: createTool({ description: "Change the current plan: rain, running late, cheaper, remove or add something.", inputSchema: z.object({ request: z.string() }), execute: async (ctx, { request }): Promise<string> => (await changePlan(ctx, g, request, askedBy)) || "Posted what changed and moved the reminders." }),
      swapStop: createTool({ description: "Swap one stop of the current plan for another kind of spot.", inputSchema: z.object({ stop: z.string().describe("stop number or name"), want: z.string().describe("what instead, e.g. ramen") }), execute: async (ctx, { stop, want }): Promise<string> => swap(ctx, g, stop, want, askedBy) }),
      findSpot: createTool({ description: "Find spots in the city that match a vibe or a niche ask and drop them in the chat.", inputSchema: z.object({ vibe: z.string() }), execute: async (ctx, { vibe }): Promise<string> => (await findByVibe(ctx, g, vibe)) || "Posted the spots as postcards." }),
      planOptions: createTool({ description: "Post two different plans (Option A and Option B) for the group to vote on with thumbs up.", inputSchema: z.object({ request: z.string() }), execute: async (ctx, { request }): Promise<string> => planOptions(ctx, g, request, askedBy) }),
      pickWinner: createTool({ description: "Count the thumbs on Option A and Option B and lock in the winner.", inputSchema: z.object({}), execute: async (ctx): Promise<string> => pickWinner(ctx, g) }),
      summarize: createTool({ description: "Sum up the chat (tl;dr).", inputSchema: z.object({}), execute: async (): Promise<string> => summary(g) }),
      book: createTool({ description: "Book the current plan: post how to book each stop (reservation links, the phone number for places that only book by phone, walk-in). You never phone anyone yourself; if someone asks you to call a place, use this so they get its number.", inputSchema: z.object({}), execute: async (ctx): Promise<string> => (await bookIt(ctx, g)) || "Posted the booking details." }),
      remind: createTool({ description: "Set or list reminders for the locked-in plan (the evening before, and leave-now for each person).", inputSchema: z.object({}), execute: async (ctx): Promise<string> => remindUs(ctx, g) }),
    },
    stopWhen: stepCountIs(4),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AgentClass: any = Agent;
  return new AgentClass(components.agent, options) as ButlerAgent;
}

async function rules(ctx: ActionCtx, g: GroupView, text: string, askedBy: string): Promise<string> {
  const t = text.replace(/@\w+/g, "").trim();
  if (/^(help|hi|hey|hello|what can you do)\b/i.test(t) && t.length < 40) return lines.helpLine(g.butlerName);
  if (/\b(tl;?dr|summary|sum up|recap)\b/i.test(t)) return summary(g);
  if (/\b(which one|who won|winner|count the votes|tally)\b/i.test(t)) return pickWinner(ctx, g);
  if (/\b(options?|choices|to vote on)\b/i.test(t)) return planOptions(ctx, g, t, askedBy);
  // Asked to call a place: the booking details, with the number for anyone to call.
  if (/\b(book|call|phone)\b/i.test(t) && !/\b(book ?store|books)\b/i.test(t)) return bookIt(ctx, g);
  if (/\bremind\b/i.test(t)) return remindUs(ctx, g);
  if (g.ticket && /\b(rain|raining|late|cheaper|remove|skip)\b/i.test(t)) return changePlan(ctx, g, t, askedBy);
  const sw = t.match(/\b(?:swap|replace|switch)\s+(?:the\s+)?(?:stop\s+)?(.+?)\s+(?:for|with)\s+(.+)$/i);
  if (g.ticket && sw) return swap(ctx, g, sw[1], sw[2], askedBy);
  if (/\b(find|somewhere|near|nearby|any|cozy|quiet|spot)\b/i.test(t) && !/\b(plan|day|night|hangout|saturday|sunday)\b/i.test(t)) return findByVibe(ctx, g, t);
  return planDay(ctx, g, t || "something fun and food", askedBy);
}

export const reply = internalAction({
  args: { groupId: v.string(), text: v.string(), askedBy: v.string() },
  handler: async (ctx, { groupId, text, askedBy }) => {
    const g = await ctx.runQuery(internal.butler.view, { groupId });
    if (!g) return;
    let answer: string;
    let how = "rules";
    try {
      if (process.env.ASI_ONE_API_KEY) {
        how = "asi1";
        let threadId = g.threadId;
        if (!threadId) {
          threadId = await createThread(ctx, components.agent, { title: g.name });
          await ctx.runMutation(internal.butler.setThread, { groupId, threadId });
        }
        const res = await butlerAgent(g, askedBy).generateText(ctx, { threadId }, { prompt: `${askedBy}: ${text}` });
        answer = res.text?.trim() || "Done.";
      } else {
        answer = await rules(ctx, g, text, askedBy);
      }
    } catch (e) {
      // The model or a tool failed: fall back to the rules once.
      try { answer = await rules(ctx, g, text, askedBy); how = "rules (fallback)"; } catch (e2) { answer = lines.ASK_AGAIN; how = `failed: ${(e2 as Error).message}`; void e; }
    }
    if (answer.trim()) await ctx.runMutation(internal.flow.say, { groupId, text: answer });
    await ctx.runMutation(internal.butler.logRun, { groupId, kind: how, askedBy, input: text, output: answer, status: "done" });
  },
});
