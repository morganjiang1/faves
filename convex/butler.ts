// Each group's butler ("Fave" unless the group renames it), built on the Convex Agent
// component: one thread per group, tools that plan, re-plan, find spots by vibe and sum up
// the chat. It reasons with ASI:One (asi1-mini) when ASI_ONE_API_KEY is set; without a key it
// answers with plain rules and the same tools, so it always works. Every change it makes to
// a plan is posted as a change note that says who asked.
import { createOpenAI } from "@ai-sdk/openai";
import { Agent, createThread, createTool, stepCountIs } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod/v3";
import { FAVES_ID } from "../src/chat/reduce.mjs";
import { api, components, internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";

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
  ticket: { ticketId: string; plan: { id: string; title: string; stops: { placeId: string }[]; request?: { raw?: string } }; status: string; going: number } | null;
  recent: { author: string; text: string }[];
};

export const view = internalQuery({
  args: { groupId: v.string() },
  handler: async (ctx, { groupId }): Promise<GroupView | null> => {
    const g = await ctx.db.query("groups").withIndex("by_groupId", (q) => q.eq("groupId", groupId)).unique();
    if (!g) return null;
    const members = await ctx.db.query("members").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    const locs = await ctx.db.query("locations").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    const plans = await ctx.db.query("plans").withIndex("by_group", (q) => q.eq("groupId", groupId)).collect();
    const t = plans.sort((a, b) => (b.status === "locked" ? 1 : 0) - (a.status === "locked" ? 1 : 0) || b.updatedAt - a.updatedAt)[0] ?? null;
    const going = t ? (await ctx.db.query("rsvps").withIndex("by_ticket", (q) => q.eq("ticketId", t.ticketId)).collect()).filter((r) => r.answer === "in").length : 0;
    const recent = (await ctx.db.query("messages").withIndex("by_group", (q) => q.eq("groupId", groupId)).order("desc").take(40)).reverse();
    return {
      groupId, name: g.name, city: g.city, butlerName: g.butlerName ?? "Fave", threadId: g.butlerThread ?? null,
      members: members.map((m) => ({ id: m.userId, name: m.name })),
      starts: locs.map((l) => ({ id: l.userId, name: members.find((m) => m.userId === l.userId)?.name ?? "Someone", hood: l.hood, lat: l.lat, lng: l.lng, mode: l.mode })),
      ticket: t ? { ticketId: t.ticketId, plan: t.plan, status: t.status, going } : null,
      recent: recent.filter((m) => m.text).map((m) => ({ author: m.authorName, text: m.text! })),
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

// ---- What the butler can do (shared by the model's tools and the rules) --------------------

async function planDay(ctx: ActionCtx, g: GroupView, text: string, askedBy: string) {
  const friends = g.starts.map((s) => ({ id: s.id, name: s.name, from: s.hood ?? undefined, lat: s.lat, lng: s.lng, mode: s.mode }));
  const res = await call<{ raw: unknown; title: string; fairLine: string | null; travel: { name: string; minutes: number; mode: string }[] }>("plan", { city: g.city, text: `${text}${/\b(friends|of us|people)\b/.test(text) ? "" : `, ${g.members.length} of us`}`, friends });
  if (!res.raw || !(res.raw as { stops?: unknown[] }).stops?.length) return "I couldn't fit a day into that. Try a longer stretch of time, or other activities.";
  const ticketId = `t-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await ctx.runMutation(api.chat.apply, { actorId: FAVES_ID, op: { op: "postTicket", ticket: { id: ticketId, groupId: g.groupId, plan: res.raw, status: "proposed", createdBy: FAVES_ID, rsvps: {} }, message: { id: `m-${ticketId}`, groupId: g.groupId, authorId: FAVES_ID, authorName: g.butlerName, kind: "ticket", ticketId } } });
  const trips = res.travel.map((t) => `${t.name.split(" ")[0]} ${t.minutes} min ${t.mode}`).join(" · ");
  return `Here's a plan${askedBy ? ` (${askedBy} asked)` : ""}: ${res.title}.${res.fairLine ? ` Getting there, ${res.fairLine}${trips ? `: ${trips}` : ""}.` : " Set where you're starting from in group info and I'll make the first stop fair for everyone."} Tap In, Maybe or Out.`;
}

async function changePlan(ctx: ActionCtx, g: GroupView, text: string, askedBy: string) {
  if (!g.ticket) return "There's no plan yet. Ask me to plan something first.";
  const res = await call<{ raw: unknown; message: string; changed: number[] }>("replan", { plan: g.ticket.plan, text });
  if (!res.changed.length && !/late/i.test(text)) return res.message;
  await ctx.runMutation(api.chat.apply, { actorId: FAVES_ID, op: { op: "updateTicket", ticketId: g.ticket.ticketId, patch: { plan: res.raw }, note: `${askedBy} asked: ${res.message}` } });
  return res.message;
}

async function swap(ctx: ActionCtx, g: GroupView, stop: string, want: string, askedBy: string) {
  if (!g.ticket) return "There's no plan yet. Ask me to plan something first.";
  const res = await call<{ raw: unknown; changed: { from: string; to: string } }>("swap", { plan: g.ticket.plan, stop: /^\d+$/.test(stop) ? Number(stop) : stop, want });
  await ctx.runMutation(api.chat.apply, { actorId: FAVES_ID, op: { op: "updateTicket", ticketId: g.ticket.ticketId, patch: { plan: res.raw }, note: `${askedBy} asked: swapped ${res.changed.from} for ${res.changed.to}` } });
  return `Swapped ${res.changed.from} for ${res.changed.to}.`;
}

async function findByVibe(ctx: ActionCtx, g: GroupView, vibe: string) {
  const hits = await ctx.runAction(api.places.byVibe, { city: g.city, vibe, limit: 3 });
  if (!hits.length) {
    // Nothing in our data: scout it live (Apify) through the Faves server.
    const s = await call<{ spots: { name: string; hood: string | null }[] }>("scout", { city: g.city, query: vibe }).catch(() => ({ spots: [] }));
    return s.spots.length ? `Here's what I found: ${s.spots.map((x) => `${x.name}${x.hood ? ` (${x.hood})` : ""}`).join(", ")}.` : "I couldn't find that yet. Try other words.";
  }
  for (const h of hits.slice(0, 2)) await ctx.runMutation(internal.flow.say, { groupId: g.groupId, placeId: h.placeId, text: `${h.name}${h.hood ? `, ${h.hood}` : ""}` });
  return `A few spots that match "${vibe}": ${hits.map((h) => h.name).join(", ")}.`;
}

function summary(g: GroupView) {
  const people = g.recent.filter((m) => m.author !== g.butlerName);
  const who = [...new Set(people.map((m) => m.author.split(" ")[0]))];
  const plan = g.ticket ? `The plan is ${g.ticket.plan.title} (${g.ticket.status === "locked" ? "locked in" : "not locked yet"}), ${g.ticket.going} going.` : "No plan yet.";
  const last = people.slice(-3).map((m) => `${m.author.split(" ")[0]}: "${m.text.slice(0, 60)}"`).join("; ");
  return `tl;dr: ${who.length ? `${who.join(", ")} talked.` : "Quiet so far."} ${plan}${last ? ` Lately: ${last}.` : ""}`;
}

// ---- The agent ------------------------------------------------------------------------------

type ButlerAgent = { generateText: (ctx: ActionCtx, thread: { threadId: string }, args: { prompt: string }) => Promise<{ text: string }> };

function butlerAgent(g: GroupView, askedBy: string): ButlerAgent {
  // Typed loosely: the tools' combined type is too deep for TypeScript to spell out.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    name: g.butlerName,
    languageModel: asi().chat("asi1-mini"),
    instructions: `You are ${g.butlerName}, the butler in the Faves group chat "${g.name}" (${g.members.length} people). You plan hangouts that are fair for everyone's starting point, change plans when asked (rain, running late, cheaper, swap a stop), find spots by vibe, and sum up the chat. Use the tools to act; then answer in one or two short, warm sentences. No markdown.`,
    tools: {
      planDay: createTool({ description: "Plan a day or hangout for the group and post it as a ticket.", inputSchema: z.object({ request: z.string().describe("what, when, budget, e.g. 'saturday 1pm to 6pm, pickleball then hot pot'") }), execute: async (ctx, { request }): Promise<string> => planDay(ctx, g, request, askedBy) }),
      changePlan: createTool({ description: "Change the current plan: rain, running late, cheaper, remove or add something.", inputSchema: z.object({ request: z.string() }), execute: async (ctx, { request }): Promise<string> => changePlan(ctx, g, request, askedBy) }),
      swapStop: createTool({ description: "Swap one stop of the current plan for another kind of spot.", inputSchema: z.object({ stop: z.string().describe("stop number or name"), want: z.string().describe("what instead, e.g. ramen") }), execute: async (ctx, { stop, want }): Promise<string> => swap(ctx, g, stop, want, askedBy) }),
      findSpot: createTool({ description: "Find spots in the city that match a vibe or a niche ask and drop them in the chat.", inputSchema: z.object({ vibe: z.string() }), execute: async (ctx, { vibe }): Promise<string> => findByVibe(ctx, g, vibe) }),
      summarize: createTool({ description: "Sum up the chat (tl;dr).", inputSchema: z.object({}), execute: async (): Promise<string> => summary(g) }),
    },
    stopWhen: stepCountIs(4),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AgentClass: any = Agent;
  return new AgentClass(components.agent, options) as ButlerAgent;
}

async function rules(ctx: ActionCtx, g: GroupView, text: string, askedBy: string): Promise<string> {
  const t = text.replace(/@\w+/g, "").trim();
  if (/\b(tl;?dr|summary|sum up|recap)\b/i.test(t)) return summary(g);
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
      try { answer = await rules(ctx, g, text, askedBy); how = "rules (fallback)"; } catch (e2) { answer = `I couldn't do that just now (${(e2 as Error).message}).`; void e; }
    }
    await ctx.runMutation(internal.flow.say, { groupId, text: answer });
    await ctx.runMutation(internal.butler.logRun, { groupId, kind: how, askedBy, input: text, output: answer, status: "done" });
  },
});
