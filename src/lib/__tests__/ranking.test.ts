import type { Ranked, Sentiment } from "@/state/store";
import { answer, insertRanked, mergeRecap, probe, skip, sortAnswer, sortDone, sortPair, sortTooTough, sortUndo, startInsertion, startSort, tooTough, undo } from "../ranking";

const r = (placeId: string, sentiment: Sentiment): Ranked => ({ placeId, city: "sf", name: placeId, hood: null, kind: null, sentiment, at: "2026-10-24T00:00:00.000Z" });
const ids = (l: Ranked[]) => l.map((x) => `${x.placeId}:${x.sentiment}`);

describe("binary insertion", () => {
  test("finds the spot in at most ceil(log2(n + 1)) questions", () => {
    // True order: 0 is best ... 9 is worst; the new spot belongs at position 6.
    let st = startInsertion(10);
    let asked = 0;
    while (st.index === null) {
      const m = probe(st)!;
      st = answer(st, 6 <= m);
      asked += 1;
    }
    expect(st.index).toBe(6);
    expect(asked).toBeLessThanOrEqual(4);
  });

  test("an empty bucket needs no questions", () => {
    expect(startInsertion(0).index).toBe(0);
    expect(probe(startInsertion(0))).toBeNull();
  });

  test("caps at 4 questions on long lists", () => {
    let st = startInsertion(100);
    for (let i = 0; i < 4; i++) st = answer(st, false);
    expect(st.index).not.toBeNull();
    expect(st.steps).toBe(4);
  });

  test("too tough ties right after the compared spot, skip uses the middle, undo goes back", () => {
    const st = startInsertion(5);
    expect(probe(st)).toBe(2);
    expect(tooTough(st).index).toBe(3);
    expect(skip(st).index).toBe(2);
    const after = answer(st, true);
    expect(undo(after)).toMatchObject({ lo: 0, hi: 5, steps: 0, index: null });
  });
});

describe("lists", () => {
  test("insert keeps buckets in order and moves a re-ranked spot", () => {
    let l = [r("a", "great"), r("b", "great"), r("c", "ok"), r("d", "bad")];
    l = insertRanked(l, r("e", "great"), 1);
    expect(ids(l)).toEqual(["a:great", "e:great", "b:great", "c:ok", "d:bad"]);
    l = insertRanked(l, r("a", "bad"), 0);
    expect(ids(l)).toEqual(["e:great", "b:great", "c:ok", "a:bad", "d:bad"]);
  });

  test("a recap adds liked stops after your greats and dislikes after your bads, once", () => {
    const l = [r("a", "great"), r("x", "ok"), r("z", "bad")];
    const merged = mergeRecap(l, [r("p", "great"), r("q", "great"), r("a", "great")], [r("y", "bad")]);
    expect(ids(merged)).toEqual(["a:great", "p:great", "q:great", "x:ok", "z:bad", "y:bad"]);
    expect(ids(mergeRecap(merged, [r("p", "great"), r("q", "great")], [r("y", "bad")]))).toEqual(ids(merged));
    // A stop you now dislike moves to the bad bucket.
    expect(ids(mergeRecap(merged, [], [r("p", "bad")]))).toEqual(["a:great", "q:great", "x:ok", "z:bad", "y:bad", "p:bad"]);
  });
});

describe("sorting the day's liked stops", () => {
  test("asks pairs until the order is known", () => {
    const truth = ["c", "a", "d", "b"]; // best first
    let st = startSort(["a", "b", "c", "d"]);
    let asked = 0;
    while (!sortDone(st)) {
      const [x, y] = sortPair(st)!;
      st = sortAnswer(st, truth.indexOf(x) < truth.indexOf(y));
      asked += 1;
    }
    expect(st.sorted).toEqual(truth);
    expect(asked).toBeLessThanOrEqual(5);
  });

  test("one or zero items need no questions; undo and too tough work", () => {
    expect(sortDone(startSort(["a"]))).toBe(true);
    expect(sortDone(startSort([]))).toBe(true);
    let st = startSort(["a", "b", "c"]);
    expect(sortPair(st)).toEqual(["b", "a"]);
    st = sortAnswer(st, true); // b beats a
    expect(st.sorted).toEqual(["b", "a"]);
    st = sortUndo(st);
    expect(st.sorted).toEqual(["a"]);
    expect(sortPair(st)).toEqual(["b", "a"]);
    st = sortTooTough(st);
    expect(st.sorted).toEqual(["a", "b"]);
  });
});
