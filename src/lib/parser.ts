// Turns a plain request ("first date in williamsburg, pickleball then hot pot, under $50,
// 2pm to 9pm, by subway, she loves Gundam") into planning constraints. Fully deterministic:
// no API key needed. An optional model (lib/llm.ts) can fill the same shape instead.
import type { CategoryId } from "@/theme/tokens";
import type { Mode } from "./geo";

export type Who = "date" | "friends" | "family" | "solo" | "catch-up";
export type Sport = "tennis" | "basketball" | "pickleball";

export interface Activity {
  label: string; // what the person said, tidied ("hot pot")
  category: CategoryId;
  keywords: string[]; // matched against place names, kinds, descriptions and quotes
  sport?: Sport;
  at?: number; // where it appeared in the text (keeps "X then Y" in order)
}

export interface Interest { word: string; activities: Activity[] }

export interface PlanRequest {
  raw: string;
  who: Who | null;
  groupSize: number | null;
  vibes: string[];
  budget: number | null; // dollars per person
  budgetWord: "free" | "cheap" | "splurge" | null;
  start: number | null; // wall-clock minutes
  end: number | null;
  durationHours: number | null;
  day: { offsetDays?: number; weekday?: number; label: string } | null;
  transport: Mode | null;
  mustDos: Activity[];
  interests: Interest[];
  hood: string | null;
  rain: boolean;
  nearMe: boolean;
  ordered: boolean; // the request used "then" somewhere
  then: [string, string][]; // pairs joined by "then": the first must come before the second
}

export const GENERIC_FOOD = new Set(["food", "dinner", "lunch"]);

const a = (label: string, category: CategoryId, keywords: string[], sport?: Sport): Activity => ({ label, category, keywords, sport });

// Words people use for things to do, longest first so "korean bbq" wins over "bbq".
const LEXICON: [RegExp, Activity][] = [
  [/\bpickle\s?ball\b/, a("pickleball", "courts", ["pickleball"], "pickleball")],
  [/\btennis\b/, a("tennis", "courts", ["tennis"], "tennis")],
  [/\b(basketball|hoops|shoot ?around|pickup game)\b/, a("basketball", "courts", ["basketball"], "basketball")],
  [/\bhot ?pot\b|\bshabu\b/, a("hot pot", "food", ["hot pot", "hotpot", "shabu"])],
  [/\bkorean (bbq|barbecue)\b|\bkbbq\b/, a("korean bbq", "food", ["korean barbecue", "korean bbq", "korean"])],
  [/\bdim sum\b/, a("dim sum", "food", ["dim sum", "dumpling", "cantonese"])],
  [/\b(sushi|omakase)\b/, a("sushi", "food", ["sushi", "omakase"])],
  [/\bramen\b/, a("ramen", "food", ["ramen"])],
  [/\btacos?\b|\btaqueria\b/, a("tacos", "food", ["taco", "taqueria", "mexican"])],
  [/\bpizza\b/, a("pizza", "food", ["pizza", "pizzeria"])],
  [/\bbrunch\b/, a("brunch", "food", ["brunch", "breakfast"])],
  [/\bdumplings?\b/, a("dumplings", "food", ["dumpling"])],
  [/\bpho\b/, a("pho", "food", ["pho", "vietnamese"])],
  [/\b(bbq|barbecue)\b/, a("bbq", "food", ["barbecue", "bbq"])],
  [/\bburgers?\b/, a("burgers", "food", ["burger", "hamburger"])],
  [/\bnoodles?\b/, a("noodles", "food", ["noodle", "ramen", "pho"])],
  [/\b(oysters|seafood)\b/, a("seafood", "food", ["seafood", "oyster"])],
  [/\b(thai food|thai)\b/, a("thai food", "food", ["thai"])],
  [/\b(indian food)\b/, a("indian food", "food", ["indian"])],
  [/\bfood hall\b/, a("food hall", "food", ["food hall", "food court", "market"])],
  [/\b(dinner|lunch|eat|food|bite)\b/, a("food", "food", [])],
  [/\b(ice cream|gelato|froyo)\b/, a("ice cream", "sweets", ["ice cream", "gelato", "creamery"])],
  [/\b(boba|bubble tea|milk tea)\b/, a("boba", "sweets", ["boba", "bubble tea", "tea"])],
  [/\b(dessert|sweets|something sweet)\b/, a("dessert", "sweets", ["dessert", "ice cream", "bakery", "chocolate"])],
  [/\b(coffee|cafe|latte|matcha)\b/, a("coffee", "sweets", ["coffee", "cafe", "espresso", "matcha"])],
  [/\b(bakery|pastries|pastry|croissants?)\b/, a("bakery", "sweets", ["bakery", "pastry", "patisserie"])],
  [/\bkaraoke\b/, a("karaoke", "night", ["karaoke"])],
  [/\b(comedy|stand ?up)\b/, a("comedy", "night", ["comedy"])],
  [/\b(jazz)\b/, a("jazz", "night", ["jazz"])],
  [/\b(live music|concert|gig)\b/, a("live music", "night", ["live music", "music venue", "concert"])],
  [/\bspeakeasy\b/, a("speakeasy", "night", ["speakeasy"])],
  [/\brooftop\b/, a("rooftop drinks", "night", ["rooftop"])],
  [/\b(wine bar|wine)\b/, a("wine", "night", ["wine"])],
  [/\b(brewery|beers?)\b/, a("beer", "night", ["brewery", "beer", "pub"])],
  [/\b(dancing|club|clubbing)\b/, a("dancing", "night", ["night club", "dance club", "club"])],
  [/\b(drinks|cocktails?|bar|bars|nightcap)\b/, a("drinks", "night", ["cocktail", "bar", "lounge"])],
  [/\bbowling\b/, a("bowling", "games", ["bowling"])],
  [/\barcade\b/, a("arcade", "games", ["arcade"])],
  [/\bescape room\b/, a("escape room", "games", ["escape room", "escape"])],
  [/\bmini ?golf\b|\bputt putt\b/, a("mini golf", "games", ["mini golf", "miniature golf", "putt"])],
  [/\bgo ?karts?\b/, a("go karts", "games", ["go kart", "go-kart", "karting"])],
  [/\baxe throwing\b/, a("axe throwing", "games", ["axe"])],
  [/\b(billiards|pool hall|shoot pool)\b/, a("pool", "games", ["billiard", "pool hall"])],
  [/\bboard games?\b/, a("board games", "games", ["board game"])],
  [/\btrampoline\b/, a("trampoline park", "games", ["trampoline"])],
  [/\bbatting cages?\b/, a("batting cages", "games", ["batting"])],
  [/\b(roller ?skating|ice ?skating|skating)\b/, a("skating", "games", ["skating", "rink"])],
  [/\b(climbing|bouldering)\b/, a("climbing", "active", ["climbing", "bouldering"])],
  [/\b(hike|hiking|trail)\b/, a("hike", "active", ["hiking", "trail"])],
  [/\b(kayak|kayaking|paddle ?board)\b/, a("kayaking", "active", ["kayak", "paddle", "boat"])],
  [/\b(bike ride|biking|cycling)\b/, a("bike ride", "active", ["bike", "bicycle"])],
  [/\b(sunset|skyline|lookout|viewpoint|views?)\b/, a("a view", "views", ["scenic", "view", "lookout", "observation", "overlook", "park"])],
  [/\bbeach\b/, a("beach", "views", ["beach"])],
  [/\b(picnic|park)\b/, a("park", "views", ["park", "garden"])],
  [/\b(botanical garden|garden)\b/, a("garden", "views", ["garden", "botanical"])],
  [/\baquarium\b/, a("aquarium", "culture", ["aquarium"])],
  [/\bzoo\b/, a("zoo", "culture", ["zoo"])],
  [/\bplanetarium\b/, a("planetarium", "culture", ["planetarium", "science"])],
  [/\b(museum|museums|exhibit)\b/, a("museum", "culture", ["museum"])],
  [/\b(art gallery|gallery|galleries|art)\b/, a("art", "culture", ["art", "gallery", "museum"])],
  [/\b(movie|movies|cinema|film)\b/, a("a movie", "culture", ["movie theater", "cinema", "theater", "film"])],
  [/\b(theater|theatre|a show|broadway|musical)\b/, a("a show", "culture", ["theater", "theatre", "performing arts"])],
  [/\b(bookstore|book store|books)\b/, a("bookstore", "shops", ["book"])],
  [/\b(vintage|thrift|thrifting)\b/, a("vintage shopping", "shops", ["vintage", "thrift", "consignment"])],
  [/\b(record store|vinyl|records)\b/, a("record store", "shops", ["record", "vinyl"])],
  [/\b(farmers market|flea market|night market|market)\b/, a("market", "shops", ["market", "flea"])],
  [/\b(shopping|shops)\b/, a("shopping", "shops", ["store", "shop", "boutique"])],
  [/\b(pottery|ceramics|wheel throwing)\b/, a("pottery class", "classes", ["pottery", "ceramic"])],
  [/\b(paint and sip|painting class|paint night)\b/, a("paint and sip", "classes", ["paint"])],
  [/\bcooking class\b/, a("cooking class", "classes", ["cooking"])],
  [/\bdance class\b/, a("dance class", "classes", ["dance"])],
];

// Niche interests ("she loves Gundam") and where each one leads.
const INTERESTS: [RegExp, string, Activity[]][] = [
  [/gundam|gunpla|mecha/, "Gundam", [a("Gundam and model kits", "shops", ["gundam", "gunpla", "model kit", "model shop", "hobby", "hobbies", "anime", "figure", "toy", "manga"])]],
  [/anime|manga|otaku/, "anime", [a("anime and manga", "shops", ["anime", "manga", "figure", "hobby", "hobbies", "comic", "japanese"])]],
  [/comics?|marvel|dc comics/, "comics", [a("comics", "shops", ["comic", "hobby"])]],
  [/lego/, "Lego", [a("Lego and toys", "shops", ["lego", "toy", "hobby"])]],
  [/video games?|gaming|nintendo|pokemon|pok[eé]mon/, "games", [a("video games", "shops", ["video game", "nintendo", "game", "arcade"]), a("an arcade", "games", ["arcade"])]],
  [/board games?|d&d|dnd|dungeons/, "board games", [a("board games", "games", ["board game"])]],
  [/vinyl|records|music/, "music", [a("records", "shops", ["record", "vinyl"]), a("live music", "night", ["live music", "jazz"])]],
  [/jazz/, "jazz", [a("jazz", "night", ["jazz"])]],
  [/books?|reading|poetry/, "books", [a("bookstore", "shops", ["book"])]],
  [/art|painting|design/, "art", [a("art", "culture", ["art", "gallery", "museum"])]],
  [/plants?|gardening|flowers/, "plants", [a("a garden", "views", ["garden", "botanical", "conservatory"]), a("plant shop", "shops", ["plant", "florist", "nursery"])]],
  [/cats?/, "cats", [a("a cat cafe", "sweets", ["cat cafe", "cat"])]],
  [/dogs?|puppies/, "dogs", [a("a dog park", "views", ["dog park", "park"])]],
  [/history|historic/, "history", [a("history", "culture", ["historical", "history", "museum", "landmark"])]],
  [/science|space|astronomy|stars/, "science", [a("science", "culture", ["science", "planetarium", "observatory", "museum"])]],
  [/fish|ocean|sea life|sharks/, "the ocean", [a("an aquarium", "culture", ["aquarium"])]],
  [/fashion|thrifting|vintage/, "vintage", [a("vintage", "shops", ["vintage", "thrift"])]],
  [/sneakers?|kicks/, "sneakers", [a("sneakers", "shops", ["sneaker", "shoe"])]],
  [/photography|photos|instagram/, "photography", [a("a photo spot", "views", ["scenic", "view", "mural", "lookout"])]],
  [/coffee/, "coffee", [a("specialty coffee", "sweets", ["coffee", "espresso", "roaster"])]],
  [/wine/, "wine", [a("wine", "night", ["wine"])]],
  [/climbing|bouldering/, "climbing", [a("climbing", "active", ["climbing", "bouldering"])]],
  [/movies|film|cinema/, "movies", [a("a movie", "culture", ["movie theater", "cinema", "film"])]],
  [/food|eating|foodie/, "food", [a("a local favorite", "food", [])]],
];

const WHO: [RegExp, Who, number | null][] = [
  [/\b(first date|date night|date|girlfriend|boyfriend|my gf|my bf|partner|wife|husband|anniversary|romantic)\b/, "date", 2],
  [/\b(old friend|college friend|catch ?up|catching up|haven'?t seen)\b/, "catch-up", 2],
  [/\b(family|kids|parents|my mom|my dad|grandma|nephew|niece)\b/, "family", null],
  [/\b(solo|by myself|alone|just me|me time)\b/, "solo", 1],
  [/\b(friends|the boys|the girls|crew|squad|roommates|coworkers|team|group)\b/, "friends", null],
];

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2, few: 3 };
const num = (s: string) => (/^\d+$/.test(s) ? Number(s) : NUMBER_WORDS[s] ?? null);

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// "2pm", "2:30 pm", "14:00", "2" (meridiem from context). Returns minutes or null.
function clock(h: string, m?: string, mer?: string, fallbackMer?: "am" | "pm"): number | null {
  let hour = Number(h);
  if (Number.isNaN(hour) || hour > 24) return null;
  const minute = m ? Number(m) : 0;
  const mm = (mer ?? fallbackMer ?? "").toLowerCase();
  if (mm.startsWith("p") && hour < 12) hour += 12;
  if (mm.startsWith("a") && hour === 12) hour = 0;
  if (!mm && hour < 8) hour += 12; // "from 2 to 9" means afternoon
  return hour * 60 + minute;
}

function parseWindow(t: string): { start: number | null; end: number | null; durationHours: number | null } {
  let start: number | null = null, end: number | null = null, durationHours: number | null = null;
  const range = t.match(/(?<![$\d])\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:-|to|until|till|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?(?!\s*(?:hours?|hrs?|people|ppl|of us|friends|stops|bucks|dollars))/);
  if (range && (range[3] || range[6] || /from|to|until|till/.test(range[0]))) {
    const endMer = range[6]?.[0] as "a" | "p" | undefined;
    end = clock(range[4], range[5], range[6]);
    const startNum = Number(range[1]) % 12;
    const fallback = endMer === "p" && startNum <= Number(range[4]) % 12 ? "pm" : endMer === "a" ? "am" : undefined;
    start = clock(range[1], range[2], range[3], fallback);
    if (start != null && end != null && end <= start) {
      // "from 2 to 9" is 2 PM to 9 PM; "8pm to 1am" ends after midnight.
      if (!range[6] && end < 720 && end + 720 > start) end += 720;
      else end += 1440;
    }
  } else {
    const at = t.match(/\b(?:at|around|from|after|starting(?: at)?)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
    if (at) start = clock(at[1], at[2], at[3]);
    const until = t.match(/\b(?:until|till|by|back by|home by|done by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
    if (until) end = clock(until[1], until[2], until[3]);
  }
  if (start == null) {
    if (/\bafter work\b/.test(t)) start = 18 * 60;
    else if (/\b(tonight|this evening|evening)\b/.test(t)) start = 18 * 60;
    else if (/\b(this afternoon|afternoon)\b/.test(t)) start = 13 * 60;
    else if (/\b(this morning|morning|early)\b/.test(t)) start = 9 * 60 + 30;
    else if (/\blate night\b/.test(t)) start = 21 * 60;
    else if (/\ball day\b/.test(t)) start = 10 * 60;
  }
  if (end == null) {
    if (/\ball day\b/.test(t)) end = 21 * 60;
    else if (/\blate night\b/.test(t)) end = 25 * 60;
  }
  const dur = t.match(/\b(?:for\s+)?(\d{1,2}|a couple(?: of)?|a few|two|three|four|five|six)\s*(?:hours?|hrs?|h)\b/);
  if (dur) durationHours = /couple/.test(dur[1]) ? 2 : /few/.test(dur[1]) ? 3 : num(dur[1]);
  else if (/\bhalf (a )?day\b/.test(t)) durationHours = 4;
  else if (/\b(quick|short)\b/.test(t)) durationHours = 2;
  return { start, end, durationHours };
}

function parseDay(t: string): PlanRequest["day"] {
  if (/\btomorrow\b/.test(t)) return { offsetDays: 1, label: "Tomorrow" };
  if (/\b(today|tonight|now|right now|this afternoon|this evening)\b/.test(t)) return { offsetDays: 0, label: "Today" };
  if (/\bthis weekend\b|\bweekend\b/.test(t)) return { weekday: 6, label: "Saturday" };
  for (let i = 0; i < 7; i++) if (new RegExp(`\\b${WEEKDAYS[i]}s?\\b|\\b${WEEKDAYS[i].slice(0, 3)}\\b`).test(t)) return { weekday: i, label: WEEKDAYS[i][0].toUpperCase() + WEEKDAYS[i].slice(1) };
  return null;
}

function parseBudget(t: string, groupSize: number | null): { budget: number | null; budgetWord: PlanRequest["budgetWord"] } {
  const m = t.match(/\$\s?(\d{1,4})|(\d{1,4})\s*(?:dollars|bucks)\b/);
  let budget = m ? Number(m[1] ?? m[2]) : null;
  if (budget != null && /\b(total|altogether|for (?:all|both|everyone)|combined)\b/.test(t) && groupSize && groupSize > 1) budget = Math.round(budget / groupSize);
  let budgetWord: PlanRequest["budgetWord"] = null;
  if (/\b(free|no money|zero dollars)\b/.test(t) && !/\bfree time\b/.test(t)) budgetWord = "free";
  else if (/\b(cheap|budget|broke|affordable|low ?key on money|inexpensive|not expensive)\b/.test(t)) budgetWord = "cheap";
  else if (/\b(splurge|fancy|bougie|treat (?:ourselves|myself)|special occasion|upscale)\b/.test(t)) budgetWord = "splurge";
  if (budget == null && budgetWord === "free") budget = 0;
  if (budget == null && budgetWord === "cheap") budget = 25;
  return { budget, budgetWord };
}

function parseTransport(t: string): Mode | null {
  if (/\b(walk|walking|on foot|walkable)\b/.test(t)) return "walk";
  if (/\b(subway|metro|bus|train|transit|bart|muni|the l\b|cta|mbta|light rail|public transport)/.test(t)) return "transit";
  if (/\b(bike|biking|citi ?bike|cycling|scooter)\b/.test(t)) return "bike";
  if (/\b(car|drive|driving|uber|lyft|taxi|rideshare)\b/.test(t)) return "drive";
  return null;
}

function parseGroup(t: string, who: Who | null, whoSize: number | null): number | null {
  const meAnd = t.match(/\bme and (\d+|one|two|three|four|five|six|seven|eight|nine|ten|a few|a couple)\b/);
  if (meAnd) { const n = num(meAnd[1].replace(/^a /, "")); if (n) return n + 1; }
  const of = t.match(/\b(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+(?:of us|people|friends|ppl|guys|girls)\b/);
  if (of) { const n = num(of[1]); if (n) return /friends/.test(of[0]) ? n + 1 : n; }
  const groupOf = t.match(/\bgroup of (\d+|two|three|four|five|six|seven|eight|nine|ten)\b|\bfor (\d+|two|three|four|five|six|seven|eight)\b(?!\s*(?:hours|hrs|pm|am|dollars|bucks|\$))/);
  if (groupOf) { const n = num(groupOf[1] ?? groupOf[2]); if (n) return n; }
  if (who === "date" || who === "catch-up" || who === "solo") return whoSize;
  return null;
}

const VIBES: [RegExp, string][] = [
  [/\b(chill|relaxed|low ?key|lowkey|laid back|easy)\b/, "chill"],
  [/\b(active|sporty|energetic|move around)\b/, "active"],
  [/\b(romantic|cute|cozy)\b/, "romantic"],
  [/\b(fun|silly|playful)\b/, "fun"],
  [/\b(adventurous|something new|different|unique|weird|quirky)\b/, "new"],
  [/\b(outdoors?|outside|fresh air|nature)\b/, "outdoors"],
  [/\b(indoors?|inside)\b/, "indoors"],
  [/\b(non[- ]?touristy|not touristy|hidden gems?|local|locals|underrated|off the beaten)\b/, "local"],
  [/\b(fancy|upscale|bougie|classy)\b/, "fancy"],
  [/\b(artsy|creative)\b/, "artsy"],
  [/\b(late night|night owl)\b/, "late"],
];

export function findHood(t: string, hoods: string[]): string | null {
  const sorted = [...hoods].sort((x, y) => y.length - x.length);
  for (const h of sorted) {
    const k = h.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (k.length < 4) continue;
    if (new RegExp(`\\b${k.replace(/ /g, "\\s+")}\\b`).test(t)) return h;
  }
  return null;
}

export function parseRequest(raw: string, opts: { hoods?: string[] } = {}): PlanRequest {
  const t = ` ${raw.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ")} `;

  let who: Who | null = null, whoSize: number | null = null;
  for (const [re, w, n] of WHO) if (re.test(t)) { who = w; whoSize = n; break; }

  // Interests: "loves Gundam", "she's into anime", "big fan of jazz", "obsessed with plants".
  const interests: Interest[] = [];
  const takenSpans: [number, number][] = [];
  const interestRe = /\b(?:loves?|is into|into|obsessed with|(?:a )?(?:big |huge )?fan of|is a|nerds? out (?:about|over)|really likes|likes|collects)\s+([a-z0-9&' ]{2,30}?)(?=[,.;!?]| and | then | but |$| \d)/g;
  for (const m of t.matchAll(interestRe)) {
    const phrase = m[1].trim().replace(/\b(nerd|fan|lover|head)\b/g, "").trim();
    if (!phrase) continue;
    const known = INTERESTS.find(([re]) => re.test(phrase));
    if (known) {
      interests.push({ word: known[1], activities: known[2].map((x) => ({ ...x })) });
    } else {
      const word = phrase.split(" ").filter((w) => !["the", "a", "an", "all", "things", "stuff"].includes(w)).join(" ");
      if (word.length >= 3) interests.push({ word, activities: [a(word, "shops", [word])] });
    }
    takenSpans.push([m.index!, m.index! + m[0].length]);
  }

  // Must-dos: every activity named outside an interest phrase, in the order mentioned.
  const mustDos: Activity[] = [];
  for (const [re, act] of LEXICON) {
    const g = new RegExp(re.source, "g");
    for (const m of t.matchAll(g)) {
      const at = m.index!;
      if (takenSpans.some(([s, e]) => at >= s && at < e)) continue;
      // Generic words ("food", "drinks", "view") only count once and never beat a specific one.
      const overlaps = mustDos.some((x) => x.at != null && Math.abs(x.at - at) < 2);
      if (overlaps) continue;
      if (mustDos.some((x) => x.label === act.label)) continue;
      if (act.label === "food" && mustDos.some((x) => x.category === "food")) continue;
      if (act.category === "food" && act.label !== "food" && mustDos.some((x) => x.category === "food" && GENERIC_FOOD.has(x.label))) {
        // "dinner, hot pot": the dish wins over the generic meal word.
        const i = mustDos.findIndex((x) => x.category === "food" && GENERIC_FOOD.has(x.label));
        mustDos.splice(i, 1);
      }
      const label = act.label === "food" ? (m[0].trim() === "eat" || m[0].trim() === "bite" ? "food" : m[0].trim()) : act.label;
      mustDos.push({ ...act, label, at });
      takenSpans.push([at, at + m[0].length]);
    }
  }
  // A generic "dinner" next to a specific dish is the same stop.
  const specificFood = mustDos.some((x) => x.category === "food" && !GENERIC_FOOD.has(x.label));
  const cleaned = mustDos.filter((x) => !(specificFood && GENERIC_FOOD.has(x.label))).sort((x, y) => (x.at ?? 0) - (y.at ?? 0));

  const { start, end, durationHours } = parseWindow(t);
  const groupSize = parseGroup(t, who, whoSize);
  const { budget, budgetWord } = parseBudget(t, groupSize);
  const vibes = VIBES.filter(([re]) => re.test(t)).map(([, v]) => v);
  const rain = /\b(rain|raining|rainy|storm|stormy|wet|indoors only)\b/.test(t);

  return {
    raw,
    who,
    groupSize,
    vibes,
    budget,
    budgetWord,
    start,
    end,
    durationHours,
    day: parseDay(t),
    transport: parseTransport(t),
    mustDos: cleaned,
    ordered: THEN.test(t),
    then: thenPairs(t, cleaned),
    interests,
    hood: opts.hoods ? findHood(t, opts.hoods) : null,
    rain,
    nearMe: /\b(near me|nearby|close by|around here)\b/.test(t),
  };
}

// The request read back as short chips ("2 people", "$50 each", "2 PM to 9 PM", ...).
export function requestChips(r: PlanRequest, fmt: (m: number) => string): string[] {
  const chips: string[] = [];
  if (r.who) chips.push({ date: "Date", friends: "Friends", family: "Family", solo: "Solo", "catch-up": "Catch-up" }[r.who]);
  if (r.groupSize) chips.push(`${r.groupSize} ${r.groupSize === 1 ? "person" : "people"}`);
  if (r.day) chips.push(r.day.label);
  if (r.start != null && r.end != null) chips.push(`${fmt(r.start)} to ${fmt(r.end)}`);
  else if (r.start != null) chips.push(`From ${fmt(r.start)}`);
  if (r.durationHours) chips.push(`${r.durationHours} hours`);
  if (r.budget != null) chips.push(r.budget === 0 ? "Free" : `$${r.budget} each`);
  else if (r.budgetWord) chips.push(r.budgetWord[0].toUpperCase() + r.budgetWord.slice(1));
  if (r.transport) chips.push({ walk: "Walking", transit: "Transit", drive: "Driving", bike: "Biking" }[r.transport]);
  if (r.hood) chips.push(r.hood);
  if (r.rain) chips.push("Rainy day");
  for (const m of r.mustDos) chips.push(m.label);
  for (const i of r.interests) chips.push(`Loves ${i.word}`);
  return chips;
}

const THEN = /\bthen\b|\bafter that\b|\bfollowed by\b|\bafterwards?\b|->|→/;

// "pickleball then hot pot": the activities on either side of a "then" keep that order.
function thenPairs(t: string, acts: Activity[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i + 1 < acts.length; i++) {
    const between = t.slice(acts[i].at ?? 0, acts[i + 1].at ?? 0);
    if (THEN.test(between)) pairs.push([acts[i].label, acts[i + 1].label]);
  }
  return pairs;
}

// Just the activities named in a bit of text ("add dessert" -> dessert), for re-planning.
export const activitiesIn = (text: string): Activity[] => parseRequest(text).mustDos;
