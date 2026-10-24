// Weekend streak (Beli's "Current Streak" card, counted in weekends): how many weekends in a
// row, up to the latest one, had a day out. A weekend that hasn't finished yet doesn't
// break the streak.
import type { Plan } from "@/lib/planner";

const DAY = 86_400_000;

// The Saturday (as a UTC midnight timestamp) of the weekend a date belongs to, or null on weekdays.
function weekendOf(iso: string): number | null {
  const t = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  const wd = new Date(t).getUTCDay();
  if (wd === 6) return t;
  if (wd === 0) return t - DAY;
  return null;
}

export function weekendStreak(plans: Plan[], todayISO: string): number {
  const today = Date.parse(`${todayISO.slice(0, 10)}T00:00:00Z`);
  const done = new Set<number>();
  for (const p of plans) {
    const t = Date.parse(`${p.dateISO}T00:00:00Z`);
    if (Number.isNaN(t) || t > today) continue;
    const w = weekendOf(p.dateISO);
    if (w != null) done.add(w);
  }
  const wd = new Date(today).getUTCDay();
  // The most recent Saturday on or before today.
  let sat = today - ((wd + 1) % 7) * DAY;
  if (!done.has(sat)) sat -= 7 * DAY; // this weekend may still be ahead
  let n = 0;
  while (done.has(sat)) { n += 1; sat -= 7 * DAY; }
  return n;
}
