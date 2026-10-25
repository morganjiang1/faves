import { bestQuote } from "../score";

test("a local quote has to say something: never just the place's name", () => {
  const place = { name: "Golden Gate Park", quotes: [{ text: "Golden Gate Park" }, { text: "GGP!" }, { text: "Go early and walk to the bison paddock, it's quiet before noon." }] };
  expect(bestQuote(place)?.text).toMatch(/bison/);
  expect(bestQuote({ name: "X", quotes: [{ text: "X" }] })).toBeNull();
});
