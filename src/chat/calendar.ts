// "Add to calendar" for a plan: the phone's own add-event form when the calendar module is
// there, otherwise an .ics file (shared on a phone, downloaded on the web).
import { Platform } from "react-native";
import type { City } from "@/data/types";
import type { Plan } from "@/lib/planner";
import { endsAt, offsetHours, startsAt } from "@/lib/time";

export function when(plan: Plan, city: City, minutes: number): Date {
  // Wall-clock minutes on the plan's date in the city's time zone, as a real instant.
  const [y, m, d] = plan.dateISO.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, 12));
  const off = offsetHours(city.utcOffset, guess);
  return new Date(Date.UTC(y, m - 1, d, 0, minutes) - off * 3600_000);
}

export function planEvent(plan: Plan, city: City) {
  const first = city.byId.get(plan.stops[0]?.placeId ?? "");
  const notes = plan.stops.map((s) => {
    const p = city.byId.get(s.placeId);
    const t = `${Math.floor(s.start / 60) % 24}:${String(s.start % 60).padStart(2, "0")}`;
    return `${t} ${p?.name ?? s.slot.label}${p?.address ? `, ${p.address}` : ""}`;
  }).join("\n");
  return { title: plan.title, startDate: when(plan, city, startsAt(plan)), endDate: when(plan, city, endsAt(plan)), location: first ? `${first.name}${first.address ? `, ${first.address}` : ""}` : "", notes };
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export function icsFor(plan: Plan, city: City): string {
  const e = planEvent(plan, city);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Faves//Plans//EN", "BEGIN:VEVENT",
    `UID:${plan.id}@faves`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(e.startDate)}`, `DTEND:${stamp(e.endDate)}`,
    `SUMMARY:${esc(e.title)}`, `LOCATION:${esc(e.location)}`, `DESCRIPTION:${esc(e.notes)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

export async function addToCalendar(plan: Plan, city: City): Promise<"added" | "file" | "failed"> {
  const ics = icsFor(plan, city);
  if (Platform.OS === "web") {
    try {
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${plan.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return "file";
    } catch { return "failed"; }
  }
  try {
    const Cal = await import("expo-calendar/legacy");
    await Cal.createEventInCalendarAsync(planEvent(plan, city));
    return "added";
  } catch { /* no calendar module here: share a file instead */ }
  try {
    const { File, Paths } = await import("expo-file-system");
    const Sharing = await import("expo-sharing");
    const f = new File(Paths.cache, `${plan.id}.ics`);
    f.write(ics);
    await Sharing.shareAsync(f.uri, { mimeType: "text/calendar", UTI: "com.apple.ical.ics" });
    return "file";
  } catch { return "failed"; }
}

// "in 2 days", "in 3 hrs", "in 20 min", "now", "done" for a plan's start.
export function countdown(plan: Plan, city: City, now = Date.now()): string {
  const start = when(plan, city, startsAt(plan)).getTime();
  const end = when(plan, city, endsAt(plan)).getTime();
  if (now > end) return "done";
  if (now >= start) return "happening now";
  const min = Math.round((start - now) / 60_000);
  if (min < 60) return `in ${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 36) return `in ${hrs} ${hrs === 1 ? "hr" : "hrs"}`;
  const days = Math.round(hrs / 24);
  return `in ${days} days`;
}
