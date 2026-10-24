import type { Group } from "@/state/store";
import { decodeGroup, encodeGroup, groupFromPlan, leader, mergeGroups, optionKey, optionsByStop, tally, tallyLine, type GroupLink } from "../group";
import { encodePayload } from "../payload";
import type { Plan, PlanStop } from "../planner";

const stop = (placeId: string, planB: string[], label: string): PlanStop => ({
  key: `k-${placeId}`, placeId, planB, start: 600, end: 660, leg: null, why: "x", warnings: [],
  slot: { label, categories: ["food"], keywords: [], mustDo: false, duration: 60 },
});

const plan = {
  id: "plan-1", citySlug: "san-francisco", cityName: "San Francisco", title: "Date in the Mission 💘",
  stops: [stop("A", ["B", "C"], "something to do"), stop("D", ["E"], "dinner"), stop("F", [], "a view")],
} as unknown as Plan;

const names = { A: "Café Ñandú", B: "Bowl", C: "Arcade", D: "Tacos", E: "Ramen", F: "Bernal Hill", Z: "Unused" };

function link(): GroupLink {
  return groupFromPlan(plan, "Morgan", names, "g-1");
}

describe("group links", () => {
  test("a group from a plan has each stop's place plus its Plan B places", () => {
    const { group, city, names: kept } = link();
    expect(city).toBe("san-francisco");
    expect(group.options.map((o) => o.key)).toEqual(["0:A", "0:B", "0:C", "1:D", "1:E", "2:F"]);
    expect(optionsByStop(group).map((r) => [r.label, r.options.length])).toEqual([["something to do", 3], ["dinner", 2], ["a view", 1]]);
    expect(kept.Z).toBeUndefined();
  });

  test("encode then decode round-trips the group, names and votes", () => {
    const l = link();
    l.group.votes = { Morgan: { "0:A": "going", "1:E": "maybe" }, "Zoë": { "0:B": "cant", "2:F": "going" } };
    l.group.picked = ["1:E"];
    const enc = encodeGroup(l);
    expect(enc).toMatch(/^[A-Za-z0-9\-_]+$/);
    const back = decodeGroup(enc)!;
    expect(back.group).toEqual(l.group);
    expect(back.city).toBe("san-francisco");
    expect(back.names.A).toBe("Café Ñandú");
  });

  test("links stay short enough to text", () => {
    const l = link();
    l.group.votes = { Morgan: { "0:A": "going" }, Sam: { "0:B": "going", "1:D": "maybe" } };
    expect(shareLength(encodeGroup(l))).toBeLessThan(1200);
  });

  test("broken or foreign payloads decode to null", () => {
    expect(decodeGroup(null)).toBeNull();
    expect(decodeGroup("")).toBeNull();
    expect(decodeGroup("@@@")).toBeNull();
    expect(decodeGroup("bm90IGpzb24")).toBeNull();
    expect(decodeGroup(encodePayload({ v: 2, i: "x" }))).toBeNull();
    expect(decodeGroup(encodePayload({ v: 1, i: "x", p: "p", t: "t", c: "c", h: "h", o: [] }))).toBeNull();
    expect(decodeGroup(encodePayload({ v: 1, i: "x", p: "p", t: "t", c: "c", h: "h", o: [["0", "A", "x", ""]] }))).toBeNull();
    // A cut-off link (pasted halfway) is rejected, not half-read.
    const enc = encodeGroup(link());
    expect(decodeGroup(enc.slice(0, Math.floor(enc.length / 2)))).toBeNull();
  });

  test("unknown vote values and options are dropped", () => {
    const enc = encodePayload({ v: 1, i: "g", p: "p", t: "t", c: "c", h: "h", a: "2026-10-24T00:00:00.000Z", o: [[0, "A", "x", "A"]], x: { Sam: { 0: "g", 5: "g" }, Lee: { 0: "z" } } });
    const g = decodeGroup(enc)!.group;
    expect(g.votes).toEqual({ Sam: { "0:A": "going" } });
  });

  test("merging votes sent back keeps everyone and the newest answer per voter wins", () => {
    const host = link().group;
    host.votes = { Morgan: { "0:A": "going" }, Sam: { "0:A": "maybe" } };
    host.picked = ["0:A"];
    const friend: Group = { ...link().group, votes: { Sam: { "0:A": "going", "1:D": "cant" }, Lee: { "2:F": "going" } }, picked: [] };
    const merged = mergeGroups(host, friend);
    expect(merged.votes).toEqual({ Morgan: { "0:A": "going" }, Sam: { "0:A": "going", "1:D": "cant" }, Lee: { "2:F": "going" } });
    expect(merged.picked).toEqual(["0:A"]);
    // Merging the same link twice changes nothing.
    expect(mergeGroups(merged, friend)).toEqual(merged);
  });

  test("tally, tally line and the leader per stop", () => {
    const g = link().group;
    g.votes = { a: { "0:B": "going", "0:A": "maybe" }, b: { "0:B": "going" }, c: { "0:A": "going", "0:C": "cant" } };
    expect(tally(g, "0:B")).toEqual({ going: 2, maybe: 0, cant: 0 });
    expect(tallyLine(tally(g, "0:A"))).toBe("1 Going · 1 Maybe");
    expect(tallyLine(tally(g, "0:C"))).toBe("1 Can't");
    expect(tallyLine(tally(g, "1:D"))).toBe("No votes yet");
    expect(leader(g, optionsByStop(g)[0].options)).toBe(optionKey(0, "B"));
    // With no votes the planned place leads.
    expect(leader(g, optionsByStop(g)[1].options)).toBe("1:D");
  });
});

function shareLength(payload: string) {
  return `https://faves.example/group/g-1?d=${payload}`.length;
}
