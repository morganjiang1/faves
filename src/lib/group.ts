// Group voting with no backend: the whole poll (title, city, the options for each stop and
// everyone's votes so far) travels in the invite link as a compact base64url payload. A
// friend opens the link (the website works without the app), votes, and sends a link with
// their votes back; opening that link merges the votes into the host's group.
import type { Group } from "@/state/store";
import type { Plan } from "./planner";
import { decodePayload, encodePayload } from "./payload";

export type Vote = "going" | "maybe" | "cant";
export const VOTES: Vote[] = ["going", "maybe", "cant"];
const SHORT: Record<Vote, string> = { going: "g", maybe: "m", cant: "c" };
const LONG: Record<string, Vote> = { g: "going", m: "maybe", c: "cant" };

// Wire format (short keys keep links short).
interface Wire {
  v: 1;
  i: string; // group id
  p: string; // plan id (on the host's phone)
  t: string; // title
  c: string; // city slug
  h: string; // host's first name
  a: string; // created at
  o: [number, string, string, string][]; // [stop index, place id, stop label, place name]
  x: Record<string, Record<string, string>>; // voter -> option index -> g / m / c
  k?: number[]; // picked option indexes
}

export interface GroupLink { group: Group; city: string; names: Record<string, string> }

export const optionKey = (stopIndex: number, placeId: string) => `${stopIndex}:${placeId}`;
export const stopIndexOf = (key: string) => Number(key.split(":")[0]);
export const placeIdOf = (key: string) => key.slice(key.indexOf(":") + 1);

// A group made from a plan: for each stop, the planned place plus its Plan B places.
export function groupFromPlan(plan: Plan, host: string, names: Record<string, string>, id: string): GroupLink {
  const options: Group["options"] = [];
  plan.stops.forEach((s, i) => {
    for (const placeId of [s.placeId, ...s.planB]) {
      if (options.some((o) => o.key === optionKey(i, placeId))) continue;
      options.push({ key: optionKey(i, placeId), placeId, label: s.slot.label });
    }
  });
  const used = new Set(options.map((o) => o.placeId));
  const keep = Object.fromEntries(Object.entries(names).filter(([k]) => used.has(k)));
  return {
    group: { id, planId: plan.id, title: plan.title, host, options, votes: {}, picked: [], createdAt: new Date().toISOString() },
    city: plan.citySlug,
    names: keep,
  };
}

export function encodeGroup(link: GroupLink): string {
  const { group: g } = link;
  const index = new Map(g.options.map((o, i) => [o.key, i]));
  const x: Wire["x"] = {};
  for (const [voter, votes] of Object.entries(g.votes)) {
    const row: Record<string, string> = {};
    for (const [key, v] of Object.entries(votes)) {
      const i = index.get(key);
      if (i !== undefined && SHORT[v]) row[i] = SHORT[v];
    }
    if (Object.keys(row).length) x[voter] = row;
  }
  const wire: Wire = {
    v: 1, i: g.id, p: g.planId, t: g.title, c: link.city, h: g.host, a: g.createdAt,
    o: g.options.map((o) => [stopIndexOf(o.key), o.placeId, o.label, link.names[o.placeId] ?? ""]),
    x,
  };
  const k = g.picked.map((key) => index.get(key)).filter((i): i is number => i !== undefined);
  if (k.length) wire.k = k;
  return encodePayload(wire);
}

const isStr = (v: unknown): v is string => typeof v === "string";

// Returns null for anything that is not a well-formed group link.
export function decodeGroup(text: string | null | undefined): GroupLink | null {
  if (!text) return null;
  const w = decodePayload<Wire>(text);
  if (!w || typeof w !== "object" || w.v !== 1) return null;
  if (![w.i, w.p, w.t, w.c, w.h].every(isStr) || !w.i || !Array.isArray(w.o) || !w.o.length) return null;
  const options: Group["options"] = [];
  const names: Record<string, string> = {};
  for (const o of w.o) {
    if (!Array.isArray(o) || typeof o[0] !== "number" || !isStr(o[1]) || !o[1] || !isStr(o[2])) return null;
    options.push({ key: optionKey(o[0], o[1]), placeId: o[1], label: o[2] });
    if (isStr(o[3]) && o[3]) names[o[1]] = o[3];
  }
  const votes: Group["votes"] = {};
  for (const [voter, row] of Object.entries(w.x && typeof w.x === "object" ? w.x : {})) {
    const name = voter.trim().slice(0, 40);
    if (!name || !row || typeof row !== "object") continue;
    const out: Record<string, Vote> = {};
    for (const [i, v] of Object.entries(row)) {
      const opt = options[Number(i)];
      if (opt && LONG[v]) out[opt.key] = LONG[v];
    }
    if (Object.keys(out).length) votes[name] = out;
  }
  const picked = (Array.isArray(w.k) ? w.k : []).map((i) => options[i]?.key).filter(isStr);
  return {
    group: { id: w.i, planId: w.p, title: w.t, host: w.h, options, votes, picked, createdAt: isStr(w.a) ? w.a : new Date().toISOString() },
    city: w.c,
    names,
  };
}

// Merge votes that came back in a link into the group we have. Each voter's latest
// answers win per option; nobody else's votes change. The host's picks stay the host's.
export function mergeGroups(mine: Group, incoming: Group): Group {
  const keys = new Set(mine.options.map((o) => o.key));
  const options = [...mine.options, ...incoming.options.filter((o) => !keys.has(o.key))];
  const votes: Group["votes"] = { ...mine.votes };
  for (const [voter, row] of Object.entries(incoming.votes)) votes[voter] = { ...(votes[voter] ?? {}), ...row };
  return { ...mine, options, votes, picked: mine.picked.length ? mine.picked : incoming.picked };
}

export interface Tally { going: number; maybe: number; cant: number }

export function tally(g: Group, key: string): Tally {
  const t: Tally = { going: 0, maybe: 0, cant: 0 };
  for (const row of Object.values(g.votes)) {
    const v = row[key];
    if (v) t[v] += 1;
  }
  return t;
}

// Partiful's tally line: "3 Going · 1 Maybe" (Can't only when it is all there is).
export function tallyLine(t: Tally): string {
  const parts: string[] = [];
  if (t.going) parts.push(`${t.going} Going`);
  if (t.maybe) parts.push(`${t.maybe} Maybe`);
  if (t.cant && !parts.length) parts.push(`${t.cant} Can't`);
  return parts.length ? parts.join(" · ") : "No votes yet";
}

// The options for one stop, in plan order.
export function optionsByStop(g: Group): { stop: number; label: string; options: Group["options"] }[] {
  const rows = new Map<number, { stop: number; label: string; options: Group["options"] }>();
  for (const o of g.options) {
    const i = stopIndexOf(o.key);
    const row = rows.get(i) ?? { stop: i, label: o.label, options: [] };
    row.options.push(o);
    rows.set(i, row);
  }
  return [...rows.values()].sort((a, b) => a.stop - b.stop);
}

// The winner of a stop: most Going, then most Maybe, then fewest Can't, then plan order.
export function leader(g: Group, options: Group["options"]): string | null {
  let best: string | null = null, bestScore = -Infinity;
  options.forEach((o, i) => {
    const t = tally(g, o.key);
    const score = t.going * 100 + t.maybe * 10 - t.cant * 5 - i * 0.01;
    if (score > bestScore) { bestScore = score; best = o.key; }
  });
  return best;
}

// The voter's overall mood for the badge on their avatar.
export function mood(row: Record<string, Vote>): Vote {
  const v = Object.values(row);
  const n = (k: Vote) => v.filter((x) => x === k).length;
  return n("going") >= n("maybe") && n("going") >= n("cant") ? "going" : n("maybe") >= n("cant") ? "maybe" : "cant";
}
