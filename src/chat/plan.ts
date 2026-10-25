// Planning for a group chat: who's coming, what they're into, where everyone starts, and
// the ticket's travel lines. Uses the same planner as the plan builder.
import type { City } from "@/data/types";
import type { Start } from "@/lib/fair";
import { startsKey } from "@/lib/fair";
import { parseRequest } from "@/lib/parser";
import { makePlan, type Plan } from "@/lib/planner";
import { CATEGORIES } from "@/theme/tokens";
import type { Group, Member } from "./reduce.mjs";

export function groupStarts(group: Group, users: Record<string, Member>): Start[] {
  const out: Start[] = [];
  for (const m of group.members) {
    const s = group.starts?.[m.id];
    if (!s) continue;
    out.push({ memberId: m.id, name: (users[m.id] ?? m).name, hood: s.hood, lat: s.lat, lng: s.lng, mode: s.mode });
  }
  return out;
}

// "4 friends: courts, food and views" from what members said they're into.
export function groupRequestText(group: Group, users: Record<string, Member>, myInterests: string[]): string {
  const counts = new Map<string, number>();
  for (const m of group.members) {
    const ints = m.id === group.members[0]?.id && !users[m.id]?.interests ? myInterests : users[m.id]?.interests ?? m.interests ?? [];
    for (const i of ints) counts.set(i, (counts.get(i) ?? 0) + 1);
  }
  for (const i of myInterests) counts.set(i, Math.max(counts.get(i) ?? 0, 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => CATEGORIES.find((c) => c.id === id)?.short ?? id);
  const n = group.members.length;
  const who = n <= 2 ? "the two of us" : `${n} friends`;
  return top.length ? `${who}: ${top.length > 1 ? `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]}` : top[0]}` : `${who}, something fun and food`;
}

export function planForGroup(city: City, group: Group, users: Record<string, Member>, text: string, opts: { meetInMiddle: boolean; now?: Date }): Plan {
  const req = parseRequest(text, { hoods: city.hoods });
  if (!req.groupSize || req.groupSize < group.members.length) req.groupSize = group.members.length;
  if (!req.who) req.who = group.members.length <= 2 ? "catch-up" : "friends";
  const starts = opts.meetInMiddle ? groupStarts(group, users) : [];
  return makePlan(req, { city, now: opts.now, starts, idSeed: `g-${group.id}` });
}

// Starting points changed since this plan was made (someone moved or joined).
export function needsRebalance(plan: Plan, group: Group, users: Record<string, Member>): boolean {
  const now = groupStarts(group, users);
  if (now.length < 2) return false;
  return (plan.fairness?.startsKey ?? "") !== startsKey(now);
}
