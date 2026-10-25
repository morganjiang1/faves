import assert from "node:assert/strict";
import { test } from "node:test";
import { hiddenGem, kindFor, localsScore, mentions, nameVariants, overpassQuery, rank, vibeTags } from "../src/rank.js";

test("plain words become OpenStreetMap tags", () => {
  assert.deepEqual(vibeTags("a cozy bookstore").groups.map((g) => g.kind), ["bookstore"]);
  assert.equal(vibeTags("lit pickleball courts").lit, true);
  assert.deepEqual(vibeTags("hot pot").groups.map((g) => g.kind), ["hot pot"]);
  const q = overpassQuery(vibeTags("ramen").groups, [37.7, -122.5, 37.8, -122.4]);
  assert.match(q, /\["cuisine"~"\(\^\|;\)ramen\(\$\|;\)"\]/);
});

test("locals write names short: Green Apple Books is also Green Apple", () => {
  assert.deepEqual(nameVariants("Green Apple Books").sort(), ["green apple", "green apple books"]);
  assert.deepEqual(nameVariants("The Park"), []);
});

test("the Locals Score rises with warm mentions, and an unnamed place stays under 5", () => {
  const els = [
    { type: "node", id: 1, lat: 37.78, lon: -122.46, tags: { name: "Green Apple Books", shop: "books", opening_hours: "Mo-Su 10:00-22:00" } },
    { type: "node", id: 2, lat: 37.76, lon: -122.42, tags: { name: "Dog Eared Books", shop: "books" } },
    { type: "node", id: 3, lat: 37.79, lon: -122.41, tags: { name: "Book Chain", shop: "books", brand: "Book Chain" } },
  ];
  const texts = [
    { text: "Green Apple is the best, get lost in there for hours", upvotes: 120, thread: "a", url: "u1" },
    { text: "+1 for green apple books on Clement", upvotes: 40, thread: "b", url: "u2" },
    { text: "Dog Eared Books in the Mission, tiny and perfect", upvotes: 30, thread: "a", url: "u3" },
  ];
  const out = rank(els, texts, { max: 3, kindOf: kindFor(vibeTags("bookstore").groups) });
  assert.equal(out[0].name, "Green Apple Books");
  assert.equal(out[0].redditMentions, 2);
  assert.equal(out[0].hiddenGem, false); // the famous one
  assert.ok(out[0].localsScore > out[1].localsScore);
  assert.equal(out[1].name, "Dog Eared Books");
  assert.equal(out[1].hiddenGem, true);
  assert.equal(out[2].name, "Book Chain");
  assert.ok(out[2].localsScore < 5);
  assert.equal(out[0].kind, "bookstore");
  const m = mentions([{ key: "k", name: "Book Chain" }], texts);
  assert.equal(m.size, 0);
  assert.equal(hiddenGem(undefined, {}), false);
  assert.ok(localsScore({ weight: 10 }) > localsScore({ weight: 1 }));
});

test("unnamed courts take their park's name, and lit courts get a nudge", () => {
  const groups = vibeTags("lit pickleball").groups;
  const els = [
    { type: "way", id: 10, center: { lat: 37.7637, lon: -122.4383 }, tags: { leisure: "park", name: "Corona Heights Park" } },
    { type: "way", id: 11, center: { lat: 37.7640, lon: -122.4380 }, tags: { leisure: "pitch", sport: "pickleball;tennis", lit: "yes" } },
    { type: "way", id: 12, center: { lat: 37.80, lon: -122.40 }, tags: { leisure: "pitch", sport: "pickleball" } }, // no park nearby: dropped
  ];
  const out = rank(els, [{ text: "Corona Heights has the best courts", upvotes: 9, thread: "t", url: "u" }], { groups, lit: true, kindOf: kindFor(groups) });
  assert.equal(out.length, 1);
  assert.equal(out[0].name, "Corona Heights Park pickleball courts");
  assert.equal(out[0].redditMentions, 1);
  assert.equal(out[0].lit, true);
});
