// Faves server: the chat relay (WebSocket) plus the Faves API that the Fetch.ai agents call.
//   npm run chat-server        (port 8787, or CHAT_PORT)
// The API runs the app's own planner (Locals Score, fair meet-in-the-middle, opening hours,
// sunset, travel legs) on the bundled city data, so agents and the app plan the same way.
//
//   POST /api/plan   { city?, text, friends?: [{ name, from?, mode? }] }      -> a day plan
//   POST /api/swap   { planId, stop?: 1-based number or name, want? }         -> the plan, one stop swapped
//   POST /api/book   { planId }                                               -> how each stop is booked
//   POST /api/group  { planId, name? }                                        -> a Faves group chat with the plan pinned
//   POST /api/scout  { city?, query }                                         -> spots for a niche ask
//   POST /api/replan { plan | planId, text }                                  -> "it's raining", "running late"...
// swap, book and replan also take a whole plan (a group chat's ticket) instead of a planId.
//   GET  /api/plan/:id
import "./node-shim.cjs";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { CITY_INDEX, loadCity } from "../src/data/cities";
import type { City, Place } from "../src/data/types";
import { fairLine, hoodPoint, type Start } from "../src/lib/fair";
import { bestLeg, formatLeg, type Mode } from "../src/lib/geo";
import { activitiesIn, parseRequest } from "../src/lib/parser";
import { alternativesFor, makePlan, planCost, replan, swapStop, type Plan } from "../src/lib/planner";
import { costOf, scoreOutOf10 } from "../src/lib/score";
import { formatClock } from "../src/lib/time";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { FAVES_ID, inviteCode, type ChatOp } from "../src/chat/reduce.mjs";
import { createRelay } from "./relay.mjs";

// .env and .env.local (never overriding what the shell already set).
for (const f of [".env", ".env.local"]) {
  const path = join(__dirname, "..", f);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] && process.env[m[1]] == null) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PORT = Number(process.env.CHAT_PORT || 8787);
const relay = createRelay({ file: process.env.CHAT_FILE || join(__dirname, "data", "chat.json") });
const lan = Object.values(networkInterfaces()).flat().find((n) => n && n.family === "IPv4" && !n.internal)?.address ?? "localhost";
const WEB = (process.env.FAVES_WEB_URL || `http://${lan}:8090`).replace(/\/$/, "");
const BUTLER = { id: "butler-fave", name: "Fave", handle: "fave" };
const EXPO_PORT = process.env.EXPO_PORT || "8081";
// Group chats live in Convex when it's configured (the app uses it then too), else in the relay.
const CONVEX_URL = process.env.CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL || "";
const convex = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null;
async function chatApply(actorId: string, op: ChatOp): Promise<unknown> {
  if (!convex) {
    const out = relay.apply(actorId, op) as { error?: string; result?: unknown };
    if (out?.error) throw new Error(out.error);
    return out?.result;
  }
  const out = (await convex.mutation(anyApi.chat.apply, { actorId, op })) as { ok: boolean; error?: string; result?: unknown };
  if (!out.ok) throw new Error(out.error ?? "chat failed");
  return out.result;
}

// Places outside a city's own neighborhoods that friends often live in.
const NEARBY: Record<string, Record<string, [number, number]>> = {
  "san-francisco": { oakland: [37.8044, -122.2712], berkeley: [37.8715, -122.273], emeryville: [37.8313, -122.2852], alameda: [37.7652, -122.2416], "daly city": [37.6879, -122.4702], "south san francisco": [37.6547, -122.4077], sausalito: [37.8591, -122.4853], "san mateo": [37.563, -122.3255], "palo alto": [37.4419, -122.143] },
  "new-york": { "jersey city": [40.7178, -74.0431], hoboken: [40.744, -74.0324] },
  "los-angeles": { pasadena: [34.1478, -118.1445], "santa monica": [34.0195, -118.4912], burbank: [34.1808, -118.309] },
};
const ALIASES: Record<string, string> = { "the mission": "mission district", mission: "mission district", "the richmond": "richmond district", richmond: "richmond district", "inner richmond": "richmond district", "outer richmond": "richmond district", "the sunset": "sunset district", sunset: "sunset district", "outer sunset": "sunset district", "inner sunset": "sunset district", soma: "south of market", "the castro": "castro", "the haight": "haight-ashbury", haight: "haight-ashbury" };

type Friend = { name: string; from?: string; mode?: Mode; lat?: number; lng?: number; id?: string };
type Stored = { plan: Plan; city: City; friends: Friend[]; starts: Start[]; text: string };
const plans = new Map<string, Stored>();

function citySlug(name?: string): string {
  if (!name) return "san-francisco";
  const n = name.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (["sf", "san fran", "the city"].includes(n)) return "san-francisco";
  if (["nyc", "ny", "new york city", "manhattan", "brooklyn"].includes(n)) return "new-york";
  if (["la", "l a"].includes(n)) return "los-angeles";
  return CITY_INDEX.find((c) => c.slug === n.replace(/ /g, "-") || c.name.toLowerCase() === n)?.slug ?? "san-francisco";
}

function startFor(city: City, f: Friend, i: number): Start | null {
  // A group chat's starting points arrive as neighborhood-level points already.
  if (typeof f.lat === "number" && typeof f.lng === "number") return { memberId: f.id ?? `f${i}`, name: f.name, hood: f.from ?? null, lat: f.lat, lng: f.lng, mode: f.mode ?? "transit" };
  if (!f.from) return null;
  const q = (ALIASES[f.from.toLowerCase().trim()] ?? f.from).toLowerCase().replace(/^the /, "").trim();
  const near = NEARBY[city.slug]?.[q];
  const mode: Mode = f.mode ?? (near ? "drive" : "transit");
  if (near) return { memberId: `f${i}`, name: f.name, hood: titleCase(q), lat: near[0], lng: near[1], mode };
  const hood = city.hoods.find((h) => h.toLowerCase() === q) ?? city.hoods.find((h) => h.toLowerCase().includes(q) || q.includes(h.toLowerCase()));
  const pt = hood ? hoodPoint(city, hood) : null;
  return pt ? { memberId: `f${i}`, name: f.name, hood: pt.hood, lat: pt.lat, lng: pt.lng, mode } : null;
}
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function summarize(id: string, st: Stored) {
  const { plan, city } = st;
  const cost = planCost(plan, city);
  return {
    planId: id,
    city: city.name,
    title: plan.title,
    day: plan.dayLabel,
    date: plan.dateISO,
    start: formatClock(plan.start),
    end: formatClock(plan.end),
    costPerPerson: cost.perPerson,
    stops: plan.stops.map((s, i) => {
      const p = city.byId.get(s.placeId)!;
      const c = costOf(p);
      return {
        n: i + 1, time: formatClock(s.start), until: formatClock(s.end), name: p.name, kind: p.kind, hood: p.hood, address: p.address,
        localsScore: p.unrated ? null : Number(scoreOutOf10(p.locals)), why: s.why, leg: s.leg ? formatLeg(s.leg) : null,
        cost: c.perPerson === 0 ? "free" : c.dollars ?? (c.estimated ? `about $${c.perPerson}` : c.label),
        reserveUrl: p.reserveUrl, phone: p.phone, website: p.website, image: p.image,
        mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
      };
    }),
    travel: plan.fairness?.toFirst.map((l) => ({ name: l.name, from: l.hood, minutes: l.minutes, mode: l.mode })) ?? [],
    home: plan.fairness?.home.map((l) => ({ name: l.name, minutes: l.minutes, mode: l.mode })) ?? [],
    fairLine: plan.fairness ? fairLine(plan.fairness) : null,
    unplacedFriends: st.friends.filter((f, i) => !st.starts.some((s) => s.memberId === `f${i}`)).map((f) => f.name),
    notes: plan.notes,
  };
}

async function plan(body: { city?: string; text?: string; friends?: Friend[] }) {
  const city = await loadCity(citySlug(body.city));
  const friends = (body.friends ?? []).slice(0, 12);
  const starts = friends.map((f, i) => startFor(city, f, i)).filter(Boolean) as Start[];
  const req = parseRequest(body.text || "something fun and food", { hoods: city.hoods });
  if (friends.length && (!req.groupSize || req.groupSize < friends.length)) req.groupSize = friends.length;
  if (!req.who && friends.length > 1) req.who = "friends";
  const made = makePlan(req, { city, starts, idSeed: "agent" });
  const stored: Stored = { plan: made, city, friends, starts, text: body.text ?? "" };
  plans.set(made.id, stored);
  return { ...summarize(made.id, stored), raw: made };
}

// A plan made elsewhere (a group chat's ticket) becomes known to the API for swaps and booking.
async function adopt(body: { plan?: Plan; planId?: string }): Promise<string> {
  if (body.planId && plans.has(body.planId)) return body.planId;
  if (!body.plan) throw new Error("No plan with that id. Plan again first.");
  const city = await loadCity(body.plan.citySlug);
  const starts = (body.plan.fairness?.toFirst ?? []).map((l) => ({ memberId: l.memberId, name: l.name, hood: l.hood, lat: 0, lng: 0, mode: l.mode }));
  plans.set(body.plan.id, { plan: body.plan, city, friends: [], starts: starts as Start[], text: body.plan.request?.raw ?? "" });
  return body.plan.id;
}

async function replanApi(body: { plan?: Plan; planId?: string; text: string }) {
  const id = await adopt(body);
  const st = plans.get(id)!;
  const r = replan(st.plan, st.city, body.text, { lexicon: activitiesIn });
  const stored = { ...st, plan: { ...r.plan, fairness: r.plan.fairness ?? st.plan.fairness } };
  plans.set(id, stored);
  return { ...summarize(id, stored), raw: stored.plan, message: r.message, changed: r.changed };
}

async function swap(body: { planId?: string; plan?: Plan; stop?: number | string; want?: string }) {
  body.planId = await adopt(body);
  const st = plans.get(body.planId);
  if (!st) throw new Error("No plan with that id. Plan again first.");
  const { plan: p, city } = st;
  let index = typeof body.stop === "number" ? body.stop - 1 : -1;
  if (typeof body.stop === "string") {
    const q = body.stop.toLowerCase();
    index = p.stops.findIndex((s) => (city.byId.get(s.placeId)?.name ?? "").toLowerCase().includes(q) || s.slot.label.toLowerCase().includes(q));
    if (index < 0 && /^\d+$/.test(q)) index = Number(q) - 1;
  }
  if (index < 0 || index >= p.stops.length) index = 0;
  const before = city.byId.get(p.stops[index].placeId)!;
  const alts = alternativesFor(p, city, index, 10);
  const want = (body.want ?? "").toLowerCase().replace(/\b(something|somewhere|a|an|the|place|spot)\b/g, " ").trim();
  const kws = activitiesIn(want).flatMap((a) => a.keywords);
  // A specific wish ("ramen") can be any spot of that kind near the stops around it.
  const prev = index > 0 ? city.byId.get(p.stops[index - 1].placeId) : null;
  const near = prev ?? before;
  const inPlan = new Set(p.stops.map((x) => x.placeId));
  const wished = kws.length
    ? city.places
        .filter((x) => !inPlan.has(x.id) && !x.temporarilyClosed && !x.unrated && kws.some((k) => `${x.name} ${x.kind ?? ""} ${x.kinds.join(" ")}`.toLowerCase().includes(k)))
        .map((x) => ({ place: x, score: x.locals - bestLeg(near, x, "transit").minutes * 1.2 }))
        .sort((a, b) => b.score - a.score)[0] ?? null
    : null;
  const pick = (want.includes("cheap") ? [...alts].sort((a, b) => costOf(a.place).perPerson - costOf(b.place).perPerson)[0] : null)
    ?? wished
    ?? alts.find((c) => want && `${c.place.name} ${c.place.kind ?? ""}`.toLowerCase().includes(want))
    ?? alts[0];
  if (!pick) throw new Error("Nothing nearby fits instead. Try another stop.");
  const next = swapStop(p, city, index, pick.place.id);
  const stored = { ...st, plan: { ...next, fairness: st.starts.length ? next.fairness ?? p.fairness : null } };
  plans.set(p.id, stored);
  return { ...summarize(p.id, stored), raw: stored.plan, changed: { stop: index + 1, from: before.name, to: pick.place.name } };
}

async function book(body: { planId?: string; plan?: Plan }) {
  body.planId = await adopt(body);
  const st = plans.get(body.planId);
  if (!st) throw new Error("No plan with that id. Plan again first.");
  const bookings = st.plan.stops.map((s, i) => {
    const p = st.city.byId.get(s.placeId) as Place;
    const how = p.reserveUrl ? "online" : (p.category === "food" || p.category === "night" || p.category === "classes") && p.phone ? "call" : "walk-in";
    return { n: i + 1, name: p.name, time: formatClock(s.start), how, url: p.reserveUrl, phone: how === "call" ? p.phone : null };
  });
  return { planId: body.planId, bookings, fee: { amount: "0.5", currency: "FET", why: "Faves booking fee for the whole group's day" } };
}

// A group chat for a plan, with the butler in it and the plan pinned as a ticket. On Convex the
// butler isn't a member (it's the group's butler); on the relay it joins as a member.
async function group(body: { planId: string; name?: string }) {
  const st = plans.get(body.planId);
  if (!st) throw new Error("No plan with that id. Plan again first.");
  const actor = convex ? FAVES_ID : BUTLER.id;
  if (!convex) await chatApply(BUTLER.id, { op: "hello", member: BUTLER });
  const id = `g-${Date.now().toString(36)}`;
  const code = inviteCode();
  const title = st.plan.title.length > 28 ? st.plan.title.replace(/ in [^,]+$/, "") : st.plan.title;
  const name = (body.name || title).length > 40 ? (body.name || title).slice(0, 40).replace(/\s+\S*$/, "") : body.name || title;
  await chatApply(actor, { op: "createGroup", group: { id, name, emoji: "🎟️", city: st.city.slug, members: convex ? [] : [BUTLER], inviteCode: code } } as ChatOp);
  const ticketId = `t-${Date.now().toString(36)}`;
  await chatApply(actor, { op: "postTicket", ticket: { id: ticketId, groupId: id, plan: st.plan, status: "proposed", createdBy: actor, rsvps: {} }, message: { id: `m-${ticketId}`, groupId: id, authorId: FAVES_ID, authorName: BUTLER.name, kind: "ticket", ticketId } } as ChatOp);
  await chatApply(actor, { op: "send", message: { id: `m-hi-${id}`, groupId: id, authorId: FAVES_ID, authorName: BUTLER.name, kind: "agent", text: `Hi! I'm Fave, this group's butler. Here's the plan for ${st.plan.dayLabel}. Tap In, Maybe or Out, and set where you're starting from in group info so I can keep the first stop fair for everyone.` } } as ChatOp);
  return { groupId: id, name, code, web: `${WEB}/join/${code}`, app: `faves://join/${code}`, expoGo: `exp://${lan}:${EXPO_PORT}/--/join/${code}`, backend: convex ? "convex" : "relay" };
}

async function scout(body: { city?: string; query: string }) {
  const city = await loadCity(citySlug(body.city));
  const q = (body.query || "").toLowerCase();
  const hood = city.hoods.find((h) => q.includes(h.toLowerCase()));
  const req = parseRequest(q, { hoods: city.hoods });
  const asked = [...req.interests.flatMap((i) => i.activities.flatMap((a) => a.keywords)), ...activitiesIn(q).flatMap((a) => a.keywords)];
  const STOP = new Set(["near", "nearby", "store", "stores", "shop", "shops", "spot", "spots", "place", "places", "good", "best", "with", "around", "some", "find", "where", "want", "that", "this", "there", "here", ...(hood ? hood.toLowerCase().split(/\s+/) : [])]);
  const kws = [...new Set(asked.length ? asked : q.split(/\W+/).filter((w) => w.length > 3 && !STOP.has(w)))];
  const center = hood ? hoodPoint(city, hood) : null;
  const hits = city.places
    .map((p) => ({ p, k: kws.filter((k) => `${p.name} ${p.kind ?? ""} ${p.kinds.join(" ")} ${p.description ?? ""}`.toLowerCase().includes(k)).length }))
    .filter((x) => x.k > 0 && !x.p.temporarilyClosed)
    .sort((a, b) => b.k - a.k || (center ? bestLeg(center, a.p, "transit").minutes - bestLeg(center, b.p, "transit").minutes : 0) || b.p.locals - a.p.locals)
    .slice(0, 5)
    .map(({ p }) => ({ name: p.name, kind: p.kind, hood: p.hood, address: p.address, localsScore: p.unrated ? null : Number(scoreOutOf10(p.locals)), hiddenGem: p.hiddenGem, source: "faves" }));
  return { city: city.name, query: body.query, spots: hits };
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(data));
}
const readBody = (req: IncomingMessage) => new Promise<Record<string, unknown>>((resolve) => {
  let raw = "";
  req.on("data", (c) => { raw += c; });
  req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
});

const http = createServer(async (req, res) => {
  const url = req.url ?? "/";
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET,POST" }); res.end(); return; }
  if (url === "/health" || url === "/api/health") return send(res, 200, { ok: true, groups: Object.keys(relay.state.groups).length, api: true });
  try {
    if (url.startsWith("/api/plan/") && req.method === "GET") {
      const st = plans.get(decodeURIComponent(url.slice("/api/plan/".length)));
      return st ? send(res, 200, summarize(st.plan.id, st)) : send(res, 404, { error: "No plan with that id." });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      if (url === "/api/plan") return send(res, 200, await plan(body as never));
      if (url === "/api/swap") return send(res, 200, await swap(body as never));
      if (url === "/api/book") return send(res, 200, await book(body as never));
      if (url === "/api/replan") return send(res, 200, await replanApi(body as never));
      if (url === "/api/group") return send(res, 200, await group(body as never));
      if (url === "/api/scout") return send(res, 200, await scout(body as never));
    }
  } catch (e) {
    return send(res, 400, { error: (e as Error).message });
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Faves server: chat relay (WebSocket) and /api for the agents.\n");
});
relay.attach(http);
http.listen(PORT, "0.0.0.0", () => {
  console.log(`Faves server on http://localhost:${PORT} (chat relay + /api), on the LAN at http://${lan}:${PORT}`);
});
