import { bestQuote } from "../score";

test("a local quote has to say something: never just the place's name", () => {
  const place = { name: "Golden Gate Park", quotes: [{ text: "Golden Gate Park" }, { text: "GGP!" }, { text: "Go early and walk to the bison paddock in Golden Gate Park, it's quiet before noon." }] };
  expect(bestQuote(place)?.text).toMatch(/bison/);
  expect(bestQuote({ name: "X", quotes: [{ text: "X" }] })).toBeNull();
});

test("a tourist checklist or a trip plan is never a spot's local take: no quote beats a bad one", () => {
  const bridge = {
    name: "Golden Gate Bridge",
    kind: "Bridge",
    quotes: [
      { text: "...already done most of the classic tourist stuff in the past (Alcatraz, Golden Gate Bridge, cable cars, Painted Ladies, Lombard Street, etc.), so this time I'm really trying to" },
      { text: "walking/ biking/ or even take a big bus tour (the hop on/hop off bus) across the Golden Gate Bridge." },
      { text: "Day 2: Golden Gate Bridge, Presidio, Crissy Field" },
      { text: "Is the Golden Gate Bridge worth walking across?" },
    ],
  };
  expect(bestQuote(bridge)).toBeNull();
});

test("a list of other places, or a spot named only in an aside, doesn't count", () => {
  expect(bestQuote({ name: "Green Apple Books", kind: "Book store", quotes: [{ text: "Look at local museums, the library, Green Apple Books, The Internet Archive, The Long Now, etc." }] })).toBeNull();
  expect(bestQuote({ name: "Garden Creamery", kind: "Ice cream shop", quotes: [{ text: "Go to Tartine and get stuff to bring to Dolores Park, but don't forget your picnic blanket (also get ice cream at Garden Creamery nearby)." }] })).toBeNull();
  // A quote that doesn't name the spot is usually about something else in the thread.
  expect(bestQuote({ name: "b. patisserie", kind: "Patisserie", quotes: [{ text: "Your list is solid but it's four attraction days with almost no city in it." }] })).toBeNull();
});

test("real praise for the spot wins, cleaned of list bullets and markdown", () => {
  const park = { name: "Ina Coolbrith Park", kind: "City park", quotes: [{ text: "The goal was to go to Ina Coolbrith park and get a nice view of the city." }, { text: "Ina Coolbrith Park in North Beach is another great place for a view, once you climb to the top of the steps." }] };
  expect(bestQuote(park)?.text).toMatch(/great place for a view/);
  const pizza = { name: "Golden Boy Pizza", kind: "Pizza restaurant", quotes: [{ text: "-   **Golden Boy Pizza:** North Beach institution serving thick, focaccia-style pizza." }] };
  expect(bestQuote(pizza)?.text).toBe("Golden Boy Pizza: North Beach institution serving thick, focaccia-style pizza.");
});
