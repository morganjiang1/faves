// @faves in a group chat. Deterministic and keyless, like the plan builder:
// - "@faves it's raining" / "running 30 min late" / "make it cheaper" / "swap the pizza"
//   re-plans the group's current ticket and posts what changed;
// - "@faves somewhere cheap near here after this" finds a spot near the ticket's last stop
//   (or near everyone) and answers with its postcard;
// - anything else plans a day for the group and posts a ticket.
import type { City, Place } from "@/data/types";
import { fairLine } from "@/lib/fair";
import { metersBetween, bestLeg, formatDuration, type LatLng } from "@/lib/geo";
import { isOpenAt } from "@/lib/hours";
import { activitiesIn, parseRequest } from "@/lib/parser";
import { parseReplan, replan, type Plan } from "@/lib/planner";
import { costOf } from "@/lib/score";
import { cityClock, startsAt, wallDateFor } from "@/lib/time";
import { getState } from "@/state/store";
import * as say from "./lines";
import { groupStarts, planForGroup } from "./plan";
import { chatterFor, type Group, type Member, type Ticket } from "./reduce.mjs";
import { chat, chatView } from "./store";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// "@fave", "@faves", "@agent", or the agent's own name when the group renamed it.
export const mentionRe = (name?: string) => new RegExp(`(^|\\s)@(faves?|agent|butler${name ? `|${esc(name.split(/\s+/)[0])}` : ""})\\b`, "i");
export const mentionsFaves = (text: string, name?: string) => mentionRe(name).test(text);

export function currentTicket(tickets: Record<string, Ticket>, groupId: string): Ticket | null {
  const list = Object.values(tickets).filter((t) => t.groupId === groupId);
  return list.sort((a, b) => (b.status === "locked" ? 1 : 0) - (a.status === "locked" ? 1 : 0) || b.updatedAt - a.updatedAt)[0] ?? null;
}

// A spot near `at` that fits the words ("cheap", "dessert", "drinks"), open now if we can tell.
export function nearbyPick(city: City, text: string, at: LatLng, exclude: Set<string>, now = new Date()): Place | null {
  const req = parseRequest(text, { hoods: city.hoods });
  const acts = activitiesIn(text.toLowerCase());
  const cats = new Set(acts.map((a) => a.category));
  const keywords = acts.flatMap((a) => a.keywords);
  const clock = cityClock(city.utcOffset, now);
  const pool = city.places.filter((p) => {
    if (exclude.has(p.id) || p.temporarilyClosed || p.court) return false;
    if (cats.size && !cats.has(p.category)) return false;
    if (!cats.size && !["food", "sweets", "night", "games", "views"].includes(p.category)) return false;
    if (req.budgetWord === "cheap" || req.budgetWord === "free") { const c = costOf(p); if (!(p.free || p.priceLevel === 1 || (c.estimated && c.perPerson <= 10))) return false; }
    return metersBetween(at, p) < 2500;
  });
  const score = (p: Place) => {
    const kw = keywords.some((k) => `${p.name} ${p.kind ?? ""} ${p.kinds.join(" ")}`.toLowerCase().includes(k)) ? 15 : 0;
    const open = isOpenAt(p.hours, clock.day, clock.minutes) === true ? 8 : 0;
    return p.locals + kw + open - metersBetween(at, p) / 120;
  };
  return pool.sort((a, b) => score(b) - score(a))[0] ?? null;
}

export async function answer(input: { city: City; group: Group; users: Record<string, Member>; tickets: Record<string, Ticket>; text: string }): Promise<void> {
  const { city, group, users, tickets } = input;
  const text = input.text.replace(new RegExp(mentionRe(group.butlerName).source.replace("(^|\\s)", ""), "gi"), "").trim();
  const ticket = currentTicket(tickets, group.id);
  const plan = ticket ? (ticket.plan as Plan) : null;
  const intent = parseReplan(text, activitiesIn);
  const today = wallDateFor(city.utcOffset, { offsetDays: 0 }).toISOString().slice(0, 10);

  // Help, tl;dr, booking and reminders.
  if (/^(help|hi|hey|hello|what can you do)\b/i.test(text) && text.length < 40) {
    await chat.sayAsFaves(group.id, { text: say.helpLine(group.butlerName) });
    return;
  }
  if (/\b(tl;?dr|sum up|summary|recap)\b/i.test(text)) {
    const going = Object.entries(ticket?.rsvps ?? {}).filter(([, a]) => a === "in").map(([id]) => (users[id] ?? group.members.find((m) => m.id === id))?.name ?? "Someone");
    const chatter = chatterFor(chatView().data.messages[group.id] ?? [], group.butlerName).map((m) => ({ author: m.authorName, text: m.text! }));
    await chat.sayAsFaves(group.id, { text: say.tldrLine({ plan: plan ? { title: plan.title, day: say.dayWord(plan.dateISO, today), at: startsAt(plan) } : null, locked: ticket?.status === "locked", going, chatter }) });
    return;
  }
  if (/\bbook\b/i.test(text)) {
    if (!plan || !ticket) { await chat.sayAsFaves(group.id, { text: say.NO_PLAN_TO_BOOK }); return; }
    const lines = plan.stops.map((s) => {
      const p = city.byId.get(s.placeId);
      if (!p) return null;
      // A short label for reservation links; the number to call for phone-only places.
      return say.bookLine({ at: s.start, name: p.name, url: p.reserveUrl, phone: p.phone && /restaurant|bar|food|class/i.test(p.kind ?? "") ? p.phone : null });
    }).filter((x): x is string => Boolean(x));
    await chat.sayAsFaves(group.id, { ticketId: ticket.id, text: say.bookMessage(say.bookLead(false, 0), lines) });
    return;
  }
  if (/\bremind\b/i.test(text)) {
    // Reminders for everyone run on the live chat (Convex); here the phone's calendar does it.
    await chat.sayAsFaves(group.id, { text: !ticket ? say.NO_PLAN : ticket.status === "locked" ? "I can't send reminders here. Tap Add to calendar on the ticket." : "Lock the plan in, then tap Add to calendar on the ticket." });
    return;
  }

  // Re-plan the current ticket.
  if (plan && ticket && intent.kind !== "unknown" && intent.kind !== "add") {
    const r = replan(plan, city, text, { lexicon: activitiesIn });
    if (r.changed.length || intent.kind === "late") {
      // The note on the ticket says who asked for what; the message says what changed.
      await chat.updateTicket(ticket.id, { plan: r.plan }, say.changeNote(chatView().me?.name ?? "Someone", say.changeGist(text, r.message)));
      await chat.sayAsFaves(group.id, { text: r.message, ticketId: ticket.id });
      return;
    }
  }

  // Something near here (after the plan's last stop, or in the middle of everyone).
  if (/\b(near|nearby|close|around|after (this|that)|next|somewhere)\b/i.test(text) || (plan && /\b(after|then)\b/i.test(text))) {
    const last = plan ? city.byId.get(plan.stops[plan.stops.length - 1]?.placeId ?? "") : null;
    const starts = groupStarts(group, users);
    const at: LatLng | null = last ?? (starts.length ? { lat: starts.reduce((t, s) => t + s.lat, 0) / starts.length, lng: starts.reduce((t, s) => t + s.lng, 0) / starts.length } : city.center);
    const used = new Set(plan?.stops.map((s) => s.placeId) ?? []);
    const pick = at ? nearbyPick(city, text, at, used) : null;
    if (pick && at) {
      // The postcard shows the score and the price; the line says how far it is.
      const leg = bestLeg(at, pick, getState().profile.transport);
      const how = leg.mode === "walk" ? "walk" : leg.mode === "drive" ? "drive" : leg.mode === "bike" ? "ride" : "by transit";
      const where = last ? `from ${last.name}` : "from the middle of everyone";
      await chat.sayAsFaves(group.id, { placeId: pick.id, text: `Try ${pick.name}, ${formatDuration(leg.minutes)} ${how} ${where}.` });
      return;
    }
    await chat.sayAsFaves(group.id, { text: "Nothing nearby fits. Try dessert, drinks or tacos." });
    return;
  }

  // Otherwise: plan the day for everyone.
  const made = planForGroup(city, group, users, text || "something fun and food", { meetInMiddle: true });
  if (!made.stops.length) {
    await chat.sayAsFaves(group.id, { text: say.COULDNT_PLAN });
    return;
  }
  const ticketId = await chat.postTicket(group.id, made);
  const f = made.fairness;
  await chat.sayAsFaves(group.id, { ticketId, text: say.planLine({ title: made.title, day: say.dayWord(made.dateISO, today), fairLine: f && f.toFirst.length > 1 ? fairLine(f) : null }) });
}
