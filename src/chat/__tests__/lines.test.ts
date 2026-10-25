// The group agent's lines: short, plain, never repeating what the ticket shows.
import { messagePieces, plainText } from "../../lib/linktext";
import * as say from "../lines";

const words = (s: string) => plainText(s).split(/\s+/).filter(Boolean).length;

test("a plan is one short line: the day, a short title, fair or not, In?", () => {
  expect(say.shortTitle("Pickleball and hot pot in Richmond District")).toBe("pickleball and hot pot");
  expect(say.shortTitle("Option A: Pickleball and hot pot in Richmond District")).toBe("pickleball and hot pot");
  expect(say.shortTitle("Rainy day: museum and ramen in Mission District")).toBe("museum and ramen");
  expect(say.shortTitle("A day with friends in Sunset District")).toBe("a day with friends");
  const line = say.planLine({ title: "Pickleball and hot pot in Richmond District", day: say.dayWord("2026-10-31", "2026-10-25"), fairLine: "everyone's within 25 min" });
  expect(line).toBe("Here's a plan for Saturday: pickleball and hot pot. Everyone's within 25 min. In?");
  expect(say.planLine({ title: "Pickleball and hot pot in Richmond District", day: "Saturday", fairLine: null })).toBe(`Here's a plan for Saturday: pickleball and hot pot. ${say.NO_STARTS}`);
  expect(say.dayWord("2026-10-25", "2026-10-25")).toBe("today");
  expect(say.dayWord("2026-10-26", "2026-10-25")).toBe("tomorrow");
  expect(say.dayWord("2026-11-01", null)).toBe("Sunday");
});

test("options, the vote and swaps keep the words people look for", () => {
  const opts = say.optionsLine("Jarvis Bot");
  expect(opts).toContain("Option A");
  expect(opts).toContain("Option B");
  expect(opts).toContain("no stop in common");
  expect(opts).toContain("@jarvis which one");
  expect(say.winnerLine("Option A", 1)).toBe("Option A wins with 1 vote.");
  expect(say.winnerLine("Option B", 2)).toBe("Option B wins with 2 votes.");
  expect(say.swapLine("Twin Peaks", "Coit Tower")).toBe("Swapped Twin Peaks for Coit Tower.");
  expect(say.swapLine("M Pot", "HINODEYA Ramen", "karaoke")).toBe('Couldn\'t find "karaoke", so I swapped M Pot for HINODEYA Ramen.');
  expect(say.changeNote("Morgan Jiang", say.changeGist("@fave we're running 15 min late", "Pushed everything back 15 min. Twin Peaks is out so the day still ends on time."))).toBe("Morgan asked: push it back 15 min");
  expect(say.changeGist("it's raining", "Randall Museum is outdoors, so Legion of Honor takes its place.")).toBe("a rain plan");
  expect(say.changeGist("skip the bookstore", "Removed Green Apple Books.")).toBe("skip Green Apple Books");
});

test("booking: one short line per stop, a label for links, the number for phone-only places", () => {
  const url = "https://www.google.com/maps/reserve/v/dine/c/abc?source=pa";
  const text = say.bookMessage(say.bookLead(true, 3), [
    say.bookLine({ at: 13 * 60, name: "Randall Museum" }),
    say.bookLine({ at: 18 * 60 + 26, name: "M Pot", phone: "(415) 571-8076" }),
    say.bookLine({ at: 19 * 60, name: "Foo", url }),
  ]);
  // Spaces inside "1 PM", "walk-in" and "call (415) 571-8076" don't break (U+00A0, U+2011).
  const readable = plainText(text).replace(/\u00A0/g, " ").replace(/\u2011/g, "-");
  expect(readable).toBe("Locked in! 3 going. Here's how to book it:\n• 1 PM Randall Museum · walk-in\n• 6:26 PM M Pot · call (415) 571-8076\n• 7 PM Foo · Reserve on Google");
  expect(text).toContain("walk\u2011in");
  expect(text).toContain("call\u00A0(415)\u00A0571\u20118076");
  // The kept-together number is still one tappable phone number.
  expect(messagePieces(say.bookLine({ at: 18 * 60, name: "M Pot", phone: "(415) 571-8076" })).filter((p) => p.kind === "phone")).toHaveLength(1);
  expect(say.bookLead(false, 0)).toBe("Here's how to book it:");
  expect(say.bookLead(true, 0)).toBe("Locked in! Here's how to book it:");
});

test("reminders say only what will really go out", () => {
  expect(say.nightBeforeLine("Pickleball and hot pot in Richmond District", "Randall Museum", 13 * 60)).toBe("Tomorrow: pickleball and hot pot, 1 PM at Randall Museum.");
  expect(say.leaveLine("Morgan Jiang", 14, "transit")).toBe("Morgan, leave in 10: 14 min by transit.");
  expect(say.leaveLine("Maya", 9, "walk")).toBe("Maya, leave in 10: 9 min on foot.");
  expect(say.remindersSetLine({ nightBefore: true, leave: "each" })).toBe("I'll remind everyone the night before, and each of you when it's time to leave.");
  expect(say.remindersSetLine({ nightBefore: false, leave: "each" })).toMatch(/remind everyone/);
  expect(say.remindersSetLine({ nightBefore: true, leave: "heads-up" })).toMatch(/remind everyone/);
  expect(say.remindersMovedLine(13 * 60 + 15)).toBe("Moved the reminders: first stop at 1:15 PM.");
});

test("tl;dr: the plan, locked or not, who's in, and the latest chatter, in two short lines", () => {
  const chatter = Array.from({ length: 24 }, (_, i) => ({ author: "Morgan Jiang", text: `message ${i + 1}: who's bringing the paddles, and are we doing hot pot after?` }));
  const line = say.tldrLine({ plan: { title: "Pickleball and hot pot in Richmond District", day: "Saturday", at: 13 * 60 }, locked: true, going: ["Morgan Jiang", "Maya"], chatter: [{ author: "Maya", text: "I'm in" }, ...chatter] });
  expect(line).toMatch(/^tl;dr: Pickleball and hot pot on Saturday at 1 PM, locked in\. Morgan and Maya are in\. Lately, /);
  expect(line).toContain("message 24:");
  expect(line).not.toContain("message 23:");
  expect(line).toContain('Maya: "I\'m in"');
  expect(words(line)).toBeLessThanOrEqual(32);
  expect(say.tldrLine({ plan: null, locked: false, going: [], chatter: [] })).toBe("tl;dr: No plan yet.");
});

test("the hello keeps the agent's name, and nothing has an em dash", () => {
  expect(say.helloLine("Fave")).toContain("I'm Fave, this group's agent");
  expect(say.helloLine("Jarvis")).toContain("Ask @jarvis to plan");
  const all = [say.helloLine(), say.helpLine(), say.optionsLine(), say.NO_PLAN, say.COULDNT_PLAN, say.agentInstructions({ butlerName: "Fave", name: "Crew", people: 3 })].join(" ");
  expect(all).not.toMatch(/\u2014/);
  expect(say.agentInstructions({ butlerName: "Fave", name: "Crew", people: 3 })).toMatch(/one or two short, plain sentences/);
});
