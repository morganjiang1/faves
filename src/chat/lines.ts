// What the group's agent says in the chat: one or two short lines in plain spoken words, since
// replies can be read aloud. The ticket already shows the title, day, times, every stop, the map,
// the fairness line and each person's travel time, so these lines never repeat it; they keep
// only what people need to decide or act (who's in, how to book, when reminders go out).
// Pure functions with relative imports: Convex (convex/butler.ts, convex/flow.ts), the on-phone
// agent (src/chat/agent.ts) and the Faves server all use them, so every agent sounds the same.
import { reserveLink } from "../lib/linktext";
import { formatClock } from "../lib/time";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const clock = (minutes: number) => formatClock(minutes, { compact: true });
const first = (name: string) => name.trim().split(/\s+/)[0] || name;
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// "A, B or C" / "A and B".
export function listOf(xs: string[], last = "and"): string {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${last} ${xs[xs.length - 1]}`;
}

// A message cut at a word, for quoting it back: "who's bringing the paddles..."
export function clip(text: string, max = 48): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, "").replace(/[,;:]$/, "")}...`;
}

// The handle people type to ask the agent: "@fave", or "@jarvis" once it's renamed.
export const handleOf = (butlerName = "Fave") => `@${first(butlerName).toLowerCase()}`;

// "today", "tomorrow" or the weekday ("Saturday"); the date itself is on the ticket.
export function dayWord(dateISO: string | undefined | null, todayISO?: string | null): string | null {
  if (!dateISO) return null;
  if (todayISO) {
    if (dateISO === todayISO) return "today";
    const next = new Date(Date.parse(`${todayISO}T12:00:00Z`) + 24 * 3600_000).toISOString().slice(0, 10);
    if (dateISO === next) return "tomorrow";
  }
  return DAYS[new Date(`${dateISO}T12:00:00Z`).getUTCDay()];
}

// "Option A: Pickleball and hot pot in Richmond District" -> "pickleball and hot pot".
// The option label and the neighborhood are on the ticket already.
export function shortTitle(title: string): string {
  let t = title.trim().replace(/^[^:]{1,20}:\s+/, "");
  const at = t.lastIndexOf(" in ");
  if (at > 0) t = t.slice(0, at);
  t = t.trim();
  if (!t) return title;
  // Titles start with a capital ("Pickleball and..."); mid-sentence they shouldn't.
  return /^(A\s|[A-Z][a-z])/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

// ---- Plans -----------------------------------------------------------------------------------

export const NO_STARTS = "Set where you're starting in group info and I'll make it fair.";
export const COULDNT_PLAN = "I couldn't fit a day into that. Try more time, or something else.";
export const NO_PLAN = "There's no plan yet. Ask me to plan one.";
export const NO_PLAN_TO_BOOK = "There's no plan to book yet. Ask me to plan one.";

// "Here's a plan for Saturday: pickleball and hot pot. Everyone's within 25 min. In?"
// fairLine only when two or more people have set a starting point.
export function planLine(p: { title: string; day: string | null; fairLine?: string | null }): string {
  const lead = `Here's a plan${p.day ? ` for ${p.day}` : ""}: ${shortTitle(p.title)}.`;
  return p.fairLine ? `${lead} ${cap(p.fairLine)}. In?` : `${lead} ${NO_STARTS}`;
}

// ---- Options and the vote ---------------------------------------------------------------------

export const optionsLine = (butlerName?: string) => `Option A or Option B, no stop in common. Thumbs up the one you want, then ask ${handleOf(butlerName)} which one.`;
export const ONE_OPTION = "I could only find one plan for that. In?";
export const NO_VOTE = "No vote going. Ask me for two options first.";
export const NO_VOTES_YET = "No votes yet. Thumbs up the one you want.";
export const tieLine = (n: number) => `It's a tie, ${n} each. One more vote decides it.`;
// The booking message that follows says "Locked in!", so this doesn't.
export const winnerLine = (label: string, votes: number) => `${label} wins with ${votes} ${votes === 1 ? "vote" : "votes"}.`;

// ---- Changes ----------------------------------------------------------------------------------

export const swapLine = (from: string, to: string, asked?: string | null) => (asked ? `Couldn't find "${asked}", so I swapped ${from} for ${to}.` : `Swapped ${from} for ${to}.`);

// The few words after "Morgan asked:" on the ticket's change note. The agent's own message
// says the details, so the note only says what kind of change it was.
export function changeGist(text: string, message: string): string {
  const late = message.match(/back (\d+) min/);
  if (late) return `push it back ${late[1]} min`;
  if (/\b(rain|raining|rainy|storm|pouring)\b/i.test(text)) return "a rain plan";
  if (/\bcheap|expensive|budget\b/i.test(text)) return "make it cheaper";
  const m = message.match(/^(Removed|Added|Swapped) (.+?)(?: for [^.]+)?\./);
  if (m) return `${m[1] === "Removed" ? "skip" : m[1] === "Added" ? "add" : "swap"} ${m[2]}`;
  return `"${clip(text.replace(/@\w+/g, ""), 32)}"`;
}

export const changeNote = (askedBy: string, gist: string) => `${first(askedBy)} asked: ${gist}`;

// ---- Spots ------------------------------------------------------------------------------------

export const SPOT_NOT_FOUND = "I couldn't find that yet. Try other words.";
// "Try Green Apple Books, Dog Eared Books or Borderlands."
export const spotsLine = (names: string[]) => `Try ${listOf(names.slice(0, 3), "or")}.`;

// ---- Booking ----------------------------------------------------------------------------------

export const bookLead = (locked: boolean, going: number) => (locked ? `Locked in!${going ? ` ${going} going.` : ""} Here's how to book it:` : "Here's how to book it:");

// One stop's booking: "• 7 PM Foo: Reserve on Google" (a short tappable label, never the URL),
// "• 6:26 PM M Pot: call (415) 571-8076" (phone-only places; anyone taps it and calls),
// "• 1 PM Randall Museum: walk in".
export function bookLine(b: { at: number; name?: string | null; url?: string | null; phone?: string | null }): string {
  const at = clock(b.at);
  if (!b.name) return `• ${at}: walk in`;
  if (b.url) return `• ${at} ${b.name}: ${reserveLink(b.url)}`;
  if (b.phone) return `• ${at} ${b.name}: call ${b.phone}`;
  return `• ${at} ${b.name}: walk in`;
}

export const bookMessage = (lead: string, lines: string[]) => `${lead}\n${lines.join("\n")}`;

// ---- Reminders --------------------------------------------------------------------------------

const BY: Record<string, string> = { walk: "on foot", transit: "by transit", drive: "by car", bike: "by bike" };

// The reminders themselves.
export const nightBeforeLine = (title: string, firstStop: string, at: number) => `Tomorrow: ${shortTitle(title)}, ${clock(at)} at ${firstStop}.`;
export const leaveLine = (name: string, minutes: number, mode: string) => `${first(name)}, leave in 10: ${minutes} min ${BY[mode] ?? `by ${mode}`}.`;
export const headsUpLine = (firstStop: string) => `Heads up: ${firstStop} in 45 min.`;

// What the agent says once they're set: only the reminders that will really go out.
export function remindersSetLine(r: { nightBefore: boolean; leave: "each" | "heads-up" | null }): string {
  const when = r.leave === "each" ? "when it's time to leave" : r.leave === "heads-up" ? "45 min before it starts" : "";
  if (r.nightBefore && when) return `I'll remind everyone the night before, and ${r.leave === "each" ? `each of you ${when}` : when}.`;
  if (r.nightBefore) return "I'll remind everyone the night before.";
  if (when) return `I'll remind everyone ${when}.`;
  return "It's too close for reminders. See you there!";
}

export const remindersMovedLine = (firstAt: number) => `Moved the reminders: first stop at ${clock(firstAt)}.`;
export const remindersListLine = (rs: { when: string; text: string }[]) => `Reminders are set:\n${rs.map((r) => `• ${r.when}: ${r.text}`).join("\n")}`;
export const LOCK_FOR_REMINDERS = "Lock the plan in and I'll remind everyone.";
export const REMINDERS_SENT = "All the reminders have gone out.";

// ---- tl;dr, hello, help -----------------------------------------------------------------------

// "tl;dr: Pickleball and hot pot on Saturday at 1 PM, locked in. Morgan and Maya are in.
//  Lately, Jay: "who's bringing the paddles...""  Chatter is what people said to each other
// (never the asks to the agent): the latest line from each of the last two people who spoke.
export function tldrLine(o: { plan: { title: string; day: string | null; at: number | null } | null; locked: boolean; going: string[]; chatter: { author: string; text: string }[] }): string {
  let plan = "No plan yet.";
  if (o.plan) {
    const day = o.plan.day ? (/^(today|tomorrow)$/.test(o.plan.day) ? ` ${o.plan.day}` : ` on ${o.plan.day}`) : "";
    const when = `${day}${o.plan.at != null ? ` at ${clock(o.plan.at)}` : ""}`;
    const who = o.going.length === 0 ? "Nobody's in yet." : o.going.length <= 3 ? `${listOf(o.going.map(first))} ${o.going.length === 1 ? "is" : "are"} in.` : `${o.going.length} are in.`;
    plan = `${cap(shortTitle(o.plan.title))}${when}, ${o.locked ? "locked in" : "not locked yet"}. ${who}`;
  }
  const latest: { author: string; text: string }[] = [];
  for (let i = o.chatter.length - 1; i >= 0 && latest.length < 2; i--) {
    const m = o.chatter[i];
    if (!latest.some((x) => x.author === m.author)) latest.unshift(m);
  }
  const said = latest.map((m) => `${first(m.author)}: "${clip(m.text)}"`).join("; ");
  return `tl;dr: ${plan}${said ? ` Lately, ${said}` : ""}`;
}

export const helloLine = (butlerName = "Fave") => `Hi, I'm ${butlerName}, this group's agent. Ask ${handleOf(butlerName)} to plan, swap a stop, book or remind.`;
export const helpLine = (butlerName = "Fave") => `Ask ${handleOf(butlerName)} to plan, give two options, swap a stop, book, remind, or say tl;dr.`;
export const ASK_AGAIN = "I couldn't do that just now. Try again in a minute.";

// The model's instructions (when the agent reasons with a model).
export function agentInstructions(g: { butlerName: string; name: string; people: number }): string {
  return `You are ${g.butlerName}, the agent in the Faves group chat "${g.name}" (${g.people} people). You plan days out that are fair for everyone's starting point, change plans (rain, running late, cheaper, swap a stop), find spots by vibe, book, set reminders and sum up the chat. Use the tools to act. Then answer in one or two short, plain sentences, the way you'd say it out loud. The chat shows each plan as a ticket with its title, day, times, stops, map and everyone's travel time, so never repeat any of that. When a tool returns a list (bookings, reminders), pass it on as is. No markdown, no emoji.`;
}
