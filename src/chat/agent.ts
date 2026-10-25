// @faves in a group chat. Deterministic and keyless, like the plan builder:
// - "@faves it's raining" / "running 30 min late" / "make it cheaper" / "swap the pizza"
//   re-plans the group's current ticket and posts what changed;
// - "@faves somewhere cheap near here after this" finds a spot near the ticket's last stop
//   (or near everyone) and answers with its postcard;
// - anything else plans a day for the group and posts a ticket.
import type { City, Place } from "@/data/types";
import { metersBetween, bestLeg, formatLeg, type LatLng } from "@/lib/geo";
import { isOpenAt } from "@/lib/hours";
import { activitiesIn, parseRequest } from "@/lib/parser";
import { parseReplan, replan, type Plan } from "@/lib/planner";
import { reserveLink } from "@/lib/linktext";
import { costOf, scoreOutOf10 } from "@/lib/score";
import { cityClock, formatClock, startsAt } from "@/lib/time";
import { getState } from "@/state/store";
import { groupStarts, planForGroup } from "./plan";
import type { Group, Member, Ticket } from "./reduce.mjs";
import { chat } from "./store";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// "@fave", "@faves", "@butler", or the butler's own name when the group renamed it.
export const mentionRe = (name?: string) => new RegExp(`(^|\\s)@(faves?|butler${name ? `|${esc(name.split(/\s+/)[0])}` : ""})\\b`, "i");
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

  // tl;dr, booking and reminders.
  if (/\b(tl;?dr|sum up|summary|recap)\b/i.test(text)) {
    const p = plan ? `Plan: ${plan.title}, ${plan.dayLabel} at ${formatClock(startsAt(plan))}, ${ticket?.status === "locked" ? "locked in" : "not locked yet"}, ${Object.values(ticket?.rsvps ?? {}).filter((a) => a === "in").length} going.` : "No plan yet.";
    await chat.sayAsFaves(group.id, { text: `tl;dr: ${p}` });
    return;
  }
  if (/\bbook\b/i.test(text)) {
    if (!plan || !ticket) { await chat.sayAsFaves(group.id, { text: "There's no plan to book yet. Ask me to plan something first." }); return; }
    const lines = plan.stops.map((s) => {
      const p = city.byId.get(s.placeId);
      if (!p) return null;
      const at = formatClock(s.start, { compact: true });
      return p.reserveUrl ? `• ${at} ${p.name}: ${reserveLink(p.reserveUrl)}` : p.phone && /restaurant|bar|food|class/i.test(p.kind ?? "") ? `• ${at} ${p.name}: books by phone only, call them at ${p.phone}` : `• ${at} ${p.name}: walk in, nothing to book`;
    }).filter(Boolean);
    await chat.sayAsFaves(group.id, { ticketId: ticket.id, text: `Here's the booking:\n${lines.join("\n")}` });
    return;
  }
  if (/\bremind\b/i.test(text)) {
    await chat.sayAsFaves(group.id, { text: ticket?.status === "locked" ? "Reminders for everyone need the live chat, so for now tap Add to calendar on the ticket and your phone will remind you." : "Lock the plan in first, then I'll set reminders." });
    return;
  }

  // Re-plan the current ticket.
  if (plan && ticket && intent.kind !== "unknown" && intent.kind !== "add") {
    const r = replan(plan, city, text, { lexicon: activitiesIn });
    if (r.changed.length || intent.kind === "late") {
      const tag = intent.kind === "rain" ? "rain" : intent.kind === "late" ? "running late" : intent.kind === "cheaper" ? "cheaper" : "change";
      await chat.updateTicket(ticket.id, { plan: r.plan }, `${tag}: ${r.message}`);
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
      const leg = bestLeg(at, pick, getState().profile.transport);
      const where = last ? `from ${last.name}` : "from the middle of everyone";
      const cost = costOf(pick);
      await chat.sayAsFaves(group.id, { placeId: pick.id, text: `${pick.name}: ${formatLeg(leg)} ${where}. Locals Score ${scoreOutOf10(pick.locals)}${cost.dollars ? `, ${cost.dollars}` : cost.perPerson === 0 && !cost.estimated ? ", free" : ""}.` });
      return;
    }
    await chat.sayAsFaves(group.id, { text: "Nothing nearby fits that. Try another word, like dessert, drinks or tacos." });
    return;
  }

  // Otherwise: plan the day for everyone.
  const made = planForGroup(city, group, users, text || "something fun and food", { meetInMiddle: true });
  if (!made.stops.length) {
    await chat.sayAsFaves(group.id, { text: "I couldn't fit a day into that window. Try a longer stretch of time." });
    return;
  }
  const ticketId = await chat.postTicket(group.id, made);
  const f = made.fairness;
  await chat.sayAsFaves(group.id, { ticketId, text: f && f.toFirst.length > 1 ? `Here's a plan for ${group.members.length}. The first stop is the fairest one for everyone's starting point.` : `Here's a plan for ${group.members.length}. Tap In, Maybe or Out.` });
}
