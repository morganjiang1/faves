// City wall-clock time without Intl time zones: every Faves city is in the US, so the
// city's standard UTC offset plus the US daylight saving rule gives its local time.
// A "wall" Date stores the city's local time in its UTC fields (read it with getUTC*).

const HOUR = 3600_000;

function nthSunday(year: number, month: number, n: number): number {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return 1 + ((7 - first) % 7) + (n - 1) * 7;
}

// US DST: from the second Sunday in March at 2:00 AM to the first Sunday in November at 2:00 AM.
export function isUsDst(standardWall: Date): boolean {
  const y = standardWall.getUTCFullYear();
  const start = Date.UTC(y, 2, nthSunday(y, 2, 2), 2);
  const end = Date.UTC(y, 10, nthSunday(y, 10, 1), 1); // 2:00 daylight = 1:00 standard
  const t = standardWall.getTime();
  return t >= start && t < end;
}

export function offsetHours(utcOffset: number, at: Date = new Date()): number {
  const standard = new Date(at.getTime() + utcOffset * HOUR);
  return utcOffset + (isUsDst(standard) ? 1 : 0);
}

export function toWall(at: Date, utcOffset: number): Date {
  return new Date(at.getTime() + offsetHours(utcOffset, at) * HOUR);
}

// From a wall time back to the real instant.
export function fromWall(wall: Date, utcOffset: number): Date {
  const guess = new Date(wall.getTime() - utcOffset * HOUR);
  return new Date(wall.getTime() - offsetHours(utcOffset, guess) * HOUR);
}

export interface CityClock { day: number; minutes: number; wall: Date }

export function cityClock(utcOffset: number, at: Date = new Date()): CityClock {
  const wall = toWall(at, utcOffset);
  return { day: wall.getUTCDay(), minutes: wall.getUTCHours() * 60 + wall.getUTCMinutes(), wall };
}

// 1170 -> "7:30 PM"; 1440 -> "12 AM"; minutes past midnight wrap to the next day.
export function formatClock(minutes: number, opts: { compact?: boolean } = {}): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60), mm = m % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  if (opts.compact && mm === 0) return `${h} ${suffix}`;
  return `${h}:${String(mm).padStart(2, "0")} ${suffix}`;
}

// Wanderlog's time pill: "7:00am".
export function formatPillTime(minutes: number): string {
  return formatClock(minutes).replace(" AM", "am").replace(" PM", "pm");
}

// When a plan really starts and ends: from its stops, so a plan whose times moved ("running
// late") shows the new times everywhere. Falls back to the planned window.
type Timed = { start: number; end: number; stops: { start: number; end: number }[] };
export const startsAt = (plan: Timed): number => plan.stops[0]?.start ?? plan.start;
export const endsAt = (plan: Timed): number => Math.max(plan.end, plan.stops[plan.stops.length - 1]?.end ?? plan.end);

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function formatDate(wall: Date): string {
  return `${DAY_SHORT[wall.getUTCDay()]}, ${MONTHS[wall.getUTCMonth()].slice(0, 3)} ${wall.getUTCDate()}`;
}

// A wall-clock date (midnight) for "today", "tomorrow" or a weekday, in the city.
export function wallDateFor(utcOffset: number, when: { offsetDays?: number; weekday?: number }, at: Date = new Date()): Date {
  const now = toWall(at, utcOffset);
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let add = when.offsetDays ?? 0;
  if (when.weekday != null) add = (when.weekday - now.getUTCDay() + 7) % 7;
  return new Date(base + add * 24 * HOUR);
}

export function timeAgo(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "";
  const s = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86400);
  if (d < 30) return `${d} ${d === 1 ? "day" : "days"} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} ${mo === 1 ? "month" : "months"} ago`;
  const y = Math.floor(d / 365);
  return `${y} ${y === 1 ? "year" : "years"} ago`;
}
