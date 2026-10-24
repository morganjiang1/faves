import { parseRequest, requestChips } from "../parser";
import { formatClock } from "../time";

const HOODS = ["Mission District", "Williamsburg", "North Beach", "SoMa", "Hayes Valley"];

describe("parseRequest", () => {
  test("reads a full date request", () => {
    const r = parseRequest("First date in Williamsburg, pickleball then hot pot, under $50, 2pm to 9pm, by subway, she loves Gundam", { hoods: HOODS });
    expect(r.who).toBe("date");
    expect(r.groupSize).toBe(2);
    expect(r.hood).toBe("Williamsburg");
    expect(r.budget).toBe(50);
    expect(r.start).toBe(14 * 60);
    expect(r.end).toBe(21 * 60);
    expect(r.transport).toBe("transit");
    expect(r.mustDos.map((m) => m.label)).toEqual(["pickleball", "hot pot"]);
    expect(r.mustDos[0].sport).toBe("pickleball");
    expect(r.interests.map((i) => i.word)).toEqual(["Gundam"]);
    expect(r.interests[0].activities[0].keywords).toContain("gundam");
  });

  test("keeps must-dos in the order they were said", () => {
    const r = parseRequest("hot pot then basketball then karaoke");
    expect(r.mustDos.map((m) => m.label)).toEqual(["hot pot", "basketball", "karaoke"]);
  });

  test("group size from 'me and 3 friends'", () => {
    const r = parseRequest("me and 3 friends want to do something tonight");
    expect(r.who).toBe("friends");
    expect(r.groupSize).toBe(4);
    expect(r.start).toBe(18 * 60);
    expect(r.day?.label).toBe("Today");
  });

  test("time ranges without am/pm", () => {
    expect(parseRequest("from 2 to 9").start).toBe(14 * 60);
    expect(parseRequest("from 2 to 9").end).toBe(21 * 60);
    expect(parseRequest("2-6pm").start).toBe(14 * 60);
    expect(parseRequest("8pm to 1am").end).toBe(25 * 60);
    expect(parseRequest("11 to 2pm").start).toBe(11 * 60);
  });

  test("durations are not mistaken for times", () => {
    const r = parseRequest("something for 2 to 3 hours");
    expect(r.start).toBeNull();
    expect(r.durationHours).toBe(3);
  });

  test("budget words and totals", () => {
    expect(parseRequest("cheap day out").budget).toBe(25);
    expect(parseRequest("a free afternoon").budget).toBe(0);
    expect(parseRequest("$120 total for the two of us on a date").budget).toBe(60);
    expect(parseRequest("let's splurge").budgetWord).toBe("splurge");
  });

  test("transport and weather", () => {
    expect(parseRequest("we're walking").transport).toBe("walk");
    expect(parseRequest("taking an uber").transport).toBe("drive");
    expect(parseRequest("it's raining, indoor stuff").rain).toBe(true);
  });

  test("catch-up with an old friend who loves anime", () => {
    const r = parseRequest("catching up with my college friend saturday, he's into anime");
    expect(r.who).toBe("catch-up");
    expect(r.day?.weekday).toBe(6);
    expect(r.interests[0].word).toBe("anime");
  });

  test("unknown niche interests become keyword searches", () => {
    const r = parseRequest("my sister loves origami");
    expect(r.interests[0].word).toBe("origami");
    expect(r.interests[0].activities[0].keywords).toEqual(["origami"]);
  });

  test("chips read the request back", () => {
    const r = parseRequest("date night, sushi and a view, $80 each", { hoods: HOODS });
    const chips = requestChips(r, (m) => formatClock(m, { compact: true }));
    expect(chips).toEqual(expect.arrayContaining(["Date", "2 people", "$80 each", "sushi", "a view"]));
  });
});
