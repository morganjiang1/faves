// Beli-style ranking: your list is ordered best first, in three buckets ("I liked it!",
// "It was fine", "I didn't like it"). A new spot finds its place in its bucket by a short
// binary search of "which do you prefer?" questions (at most 4), the way Beli's rank flow
// does. Pure functions, so the rank sheet and the day recap share them and they are tested.
import type { Ranked, Sentiment } from "@/state/store";

export const BUCKETS: Sentiment[] = ["great", "ok", "bad"];
export const MAX_COMPARISONS = 4;

export const bucketOf = (list: Ranked[], s: Sentiment) => list.filter((r) => r.sentiment === s);

// Put the buckets back in order (great, ok, bad), keeping each bucket's own order.
export function ordered(list: Ranked[]): Ranked[] {
  return BUCKETS.flatMap((b) => bucketOf(list, b));
}

// Insert one spot at a position inside its bucket. Any older entry for the same place is
// removed first, so re-ranking moves it instead of listing it twice.
export function insertRanked(list: Ranked[], item: Ranked, indexInBucket: number): Ranked[] {
  const rest = list.filter((r) => r.placeId !== item.placeId);
  const bucket = bucketOf(rest, item.sentiment);
  const i = Math.max(0, Math.min(bucket.length, indexInBucket));
  bucket.splice(i, 0, item);
  return BUCKETS.flatMap((b) => (b === item.sentiment ? bucket : bucketOf(rest, b)));
}

// The day recap's merge: liked stops go to the end of "great" in the order you picked
// them (favorite first), thumbs-down stops to the end of "bad". Spots already on your list
// keep their place when the sentiment is unchanged (you ranked them with more care before).
export function mergeRecap(list: Ranked[], liked: Ranked[], disliked: Ranked[]): Ranked[] {
  let out = [...list];
  for (const [items, s] of [[liked, "great"], [disliked, "bad"]] as const) {
    for (const item of items) {
      const prev = out.find((r) => r.placeId === item.placeId);
      if (prev && prev.sentiment === s) continue;
      out = insertRanked(out, { ...item, sentiment: s }, Number.MAX_SAFE_INTEGER);
    }
  }
  return ordered(out);
}

// ---- binary insertion, one question at a time ----------------------------------------

// Insert position is somewhere in [lo, hi] of a list of n items ranked best first.
export interface Insertion {
  n: number;
  lo: number;
  hi: number;
  steps: number;
  max: number;
  history: { lo: number; hi: number; steps: number }[];
  index: number | null; // final position once decided
}

export function startInsertion(n: number, max = MAX_COMPARISONS): Insertion {
  return { n, lo: 0, hi: n, steps: 0, max, history: [], index: n === 0 ? 0 : null };
}

// The list item to compare the new spot against next (null once decided).
export function probe(st: Insertion): number | null {
  if (st.index !== null) return null;
  return Math.floor((st.lo + st.hi) / 2);
}

const decide = (st: Insertion, lo: number, hi: number, steps: number): Insertion => {
  const next = { ...st, lo, hi, steps, history: [...st.history, { lo: st.lo, hi: st.hi, steps: st.steps }] };
  if (lo >= hi) return { ...next, index: lo };
  if (steps >= st.max) return { ...next, index: Math.floor((lo + hi) / 2) };
  return next;
};

// The new spot beat (true) or lost to (false) the probed item.
export function answer(st: Insertion, newIsBetter: boolean): Insertion {
  const m = probe(st);
  if (m === null) return st;
  return newIsBetter ? decide(st, st.lo, m, st.steps + 1) : decide(st, m + 1, st.hi, st.steps + 1);
}

// "Too tough": a tie, so it goes right after the spot it was compared with.
export function tooTough(st: Insertion): Insertion {
  const m = probe(st);
  if (m === null) return st;
  return { ...st, history: [...st.history, { lo: st.lo, hi: st.hi, steps: st.steps }], lo: m + 1, hi: m + 1, steps: st.steps + 1, index: m + 1 };
}

// "Skip": stop asking and use the middle of what is still possible.
export function skip(st: Insertion): Insertion {
  if (st.index !== null) return st;
  const at = Math.floor((st.lo + st.hi) / 2);
  return { ...st, history: [...st.history, { lo: st.lo, hi: st.hi, steps: st.steps }], index: at };
}

export function undo(st: Insertion): Insertion {
  const last = st.history[st.history.length - 1];
  if (!last) return st;
  return { ...st, ...last, history: st.history.slice(0, -1), index: null };
}

// Sort a few items best first by asking the user, one binary insertion per item.
// Drives the day recap's "Which did you like more?" across the stops you liked.
export interface SortState<T> {
  items: T[];
  sorted: T[];
  next: number; // index in items being inserted
  ins: Insertion | null;
  past: { sorted: T[]; next: number; ins: Insertion | null }[];
}

export function startSort<T>(items: T[]): SortState<T> {
  if (items.length < 2) return { items, sorted: [...items], next: items.length, ins: null, past: [] };
  return { items, sorted: [items[0]], next: 1, ins: startInsertion(1), past: [] };
}

export const sortDone = <T,>(st: SortState<T>) => st.next >= st.items.length;

// The current question: [the new item, the item it is compared with].
export function sortPair<T>(st: SortState<T>): [T, T] | null {
  if (sortDone(st) || !st.ins) return null;
  const m = probe(st.ins);
  return m === null ? null : [st.items[st.next], st.sorted[m]];
}

function settle<T>(st: SortState<T>, ins: Insertion): SortState<T> {
  const past = [...st.past, { sorted: st.sorted, next: st.next, ins: st.ins }];
  if (ins.index === null) return { ...st, ins, past };
  const sorted = [...st.sorted];
  sorted.splice(ins.index, 0, st.items[st.next]);
  const next = st.next + 1;
  return { ...st, sorted, next, ins: next < st.items.length ? startInsertion(sorted.length) : null, past };
}

export function sortAnswer<T>(st: SortState<T>, newIsBetter: boolean): SortState<T> {
  return st.ins ? settle(st, answer(st.ins, newIsBetter)) : st;
}
export function sortTooTough<T>(st: SortState<T>): SortState<T> {
  return st.ins ? settle(st, tooTough(st.ins)) : st;
}
export function sortSkip<T>(st: SortState<T>): SortState<T> {
  return st.ins ? settle(st, skip(st.ins)) : st;
}
export function sortUndo<T>(st: SortState<T>): SortState<T> {
  const last = st.past[st.past.length - 1];
  if (!last) return st;
  return { ...st, ...last, past: st.past.slice(0, -1) };
}
