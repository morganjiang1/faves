// Opening hours: is a place open at a given wall-clock time, and how to say it the way
// Google Maps ("Open · Closes 11 PM") and Corner ("closed  Tuesday: 8:00 PM to 3:00 AM") do.
import type { Hours, Place } from "@/data/types";
import { DAY_NAMES, formatClock } from "./time";

export function isOpenAt(hours: Hours | null, day: number, minute: number): boolean | null {
  if (!hours) return null;
  for (const [o, c] of hours[day] ?? []) if (minute >= o && minute < c) return true;
  // Late ranges from the night before ("5 PM to 2 AM" yesterday still open at 1 AM).
  const prev = hours[(day + 6) % 7] ?? [];
  for (const [, c] of prev) if (c > 1440 && minute < c - 1440) return true;
  return false;
}

// Is it open for the whole visit (arrive at `start`, stay `duration` minutes)?
export function openForVisit(hours: Hours | null, day: number, start: number, duration: number): boolean | null {
  if (!hours) return null;
  const end = start + duration;
  for (const [o, c] of hours[day] ?? []) if (start >= o && end <= c) return true;
  const prev = hours[(day + 6) % 7] ?? [];
  for (const [, c] of prev) if (c > 1440 && end <= c - 1440) return true;
  return false;
}

// When it closes, if it's open now (minutes on today's clock, may exceed 1440).
export function closesAt(hours: Hours | null, day: number, minute: number): number | null {
  if (!hours) return null;
  for (const [o, c] of hours[day] ?? []) if (minute >= o && minute < c) return c;
  const prev = hours[(day + 6) % 7] ?? [];
  for (const [, c] of prev) if (c > 1440 && minute < c - 1440) return c - 1440;
  return null;
}

// Next opening at or after `minute` within the coming week: { dayOffset, minute }.
export function nextOpen(hours: Hours | null, day: number, minute: number): { dayOffset: number; minute: number } | null {
  if (!hours) return null;
  for (let k = 0; k < 7; k++) {
    const ranges = hours[(day + k) % 7] ?? [];
    for (const [o] of ranges) if (k > 0 || o >= minute) return { dayOffset: k, minute: o };
  }
  return null;
}

export const is24h = (hours: Hours | null) => Boolean(hours && hours.every((d) => d.length === 1 && d[0][0] === 0 && d[0][1] >= 1440));

export interface Status { state: "open" | "closed" | "unknown"; word: string; detail: string }

export function statusAt(place: Pick<Place, "hours" | "temporarilyClosed">, day: number, minute: number): Status {
  if (place.temporarilyClosed) return { state: "closed", word: "Closed", detail: "Temporarily closed" };
  const h = place.hours;
  if (!h) return { state: "unknown", word: "Hours", detail: "not listed" };
  if (is24h(h)) return { state: "open", word: "Open", detail: "24 hours" };
  if (isOpenAt(h, day, minute)) {
    const c = closesAt(h, day, minute)!;
    return { state: "open", word: "Open", detail: `Closes ${formatClock(c, { compact: true })}` };
  }
  const next = nextOpen(h, day, minute);
  if (!next) return { state: "closed", word: "Closed", detail: "" };
  const when = next.dayOffset === 0 ? "" : next.dayOffset === 1 ? " tomorrow" : ` ${DAY_NAMES[(day + next.dayOffset) % 7].slice(0, 3)}`;
  return { state: "closed", word: "Closed", detail: `Opens ${formatClock(next.minute, { compact: true })}${when}` };
}

// One day's hours in words: "8:00 PM to 3:00 AM", "Closed", "Open 24 hours".
export function dayHoursText(hours: Hours | null, day: number): string {
  if (!hours) return "Hours not listed";
  const ranges = hours[day] ?? [];
  if (!ranges.length) return "Closed";
  if (ranges.length === 1 && ranges[0][0] === 0 && ranges[0][1] >= 1440) return "Open 24 hours";
  return ranges.map(([o, c]) => `${formatClock(o)} to ${formatClock(c)}`).join(", ");
}

export function weekLines(hours: Hours | null): { day: string; text: string }[] {
  return DAY_NAMES.map((d, i) => ({ day: d, text: dayHoursText(hours, i) }));
}
