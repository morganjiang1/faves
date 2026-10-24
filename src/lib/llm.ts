// Optional model for the planner agent. With EXPO_PUBLIC_LLM_BASE_URL, EXPO_PUBLIC_LLM_API_KEY
// and EXPO_PUBLIC_LLM_MODEL set (any OpenAI-compatible chat completions endpoint), the model
// reads the request and writes the reasons; on any error or timeout the deterministic parser
// and explanations are used instead. Keys in EXPO_PUBLIC_ variables ship inside the app, so
// for a public build put the model behind your own proxy.
import type { City } from "@/data/types";
import type { CategoryId } from "@/theme/tokens";
import { CATEGORIES } from "@/theme/tokens";
import type { Activity, PlanRequest, Who } from "./parser";
import type { Plan } from "./planner";
import { formatClock } from "./time";

const BASE = process.env.EXPO_PUBLIC_LLM_BASE_URL;
const KEY = process.env.EXPO_PUBLIC_LLM_API_KEY;
const MODEL = process.env.EXPO_PUBLIC_LLM_MODEL;

export const llmEnabled = Boolean(BASE && KEY && MODEL);

async function chat(system: string, user: string, timeoutMs = 12000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE!.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`model ${res.status}`);
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("empty model reply");
    return text;
  } finally {
    clearTimeout(t);
  }
}

const CAT_IDS = CATEGORIES.map((c) => c.id);
const WHOS: Who[] = ["date", "friends", "family", "solo", "catch-up"];

// The model fills the same shape as the parser. Anything missing or invalid keeps the
// deterministic value.
export async function llmParse(text: string, base: PlanRequest, hoods: string[]): Promise<PlanRequest> {
  const system = `You turn a request for a day out into JSON. Fields: who (one of ${WHOS.join(", ")} or null), groupSize (number or null), budget (dollars per person or null), start and end (minutes after midnight, or null), transport ("walk", "transit", "drive", "bike" or null), hood (one of the given neighborhoods or null), rain (boolean), mustDos (array of {label, category, keywords} in the order they should happen; category one of ${CAT_IDS.join(", ")}), interests (array of {word, category, keywords} for niche things someone loves, like Gundam). Keywords are short words a place's name or type would contain. Reply with JSON only.`;
  const user = `Neighborhoods: ${hoods.slice(0, 120).join("; ")}\nRequest: ${text}`;
  const out = JSON.parse(await chat(system, user)) as Record<string, unknown>;
  const req: PlanRequest = { ...base };
  if (WHOS.includes(out.who as Who)) req.who = out.who as Who;
  if (typeof out.groupSize === "number" && out.groupSize > 0 && out.groupSize < 50) req.groupSize = Math.round(out.groupSize);
  if (typeof out.budget === "number" && out.budget >= 0) req.budget = Math.round(out.budget);
  if (typeof out.start === "number" && out.start >= 0 && out.start < 1440) req.start = Math.round(out.start);
  if (typeof out.end === "number" && out.end > (req.start ?? 0) && out.end < 1800) req.end = Math.round(out.end);
  if (["walk", "transit", "drive", "bike"].includes(out.transport as string)) req.transport = out.transport as PlanRequest["transport"];
  if (typeof out.hood === "string" && hoods.includes(out.hood)) req.hood = out.hood;
  if (typeof out.rain === "boolean") req.rain = req.rain || out.rain;
  const acts = (xs: unknown): Activity[] => (Array.isArray(xs) ? xs : [])
    .filter((x): x is { label: string; category: string; keywords?: string[] } => Boolean(x) && typeof (x as { label?: unknown }).label === "string" && CAT_IDS.includes((x as { category?: string }).category as CategoryId))
    .map((x) => ({ label: x.label.toLowerCase(), category: x.category as CategoryId, keywords: (x.keywords ?? []).filter((k) => typeof k === "string").slice(0, 8) }));
  const mustDos = acts(out.mustDos);
  if (mustDos.length) {
    req.mustDos = mustDos.map((m, i) => ({ ...m, at: i, sport: base.mustDos.find((b) => b.label === m.label)?.sport }));
    req.then = mustDos.slice(1).map((m, i) => [mustDos[i].label, m.label]);
  }
  const interests = Array.isArray(out.interests) ? (out.interests as { word?: string; category?: string; keywords?: string[] }[]) : [];
  const parsedInterests = interests
    .filter((i) => typeof i.word === "string" && CAT_IDS.includes(i.category as CategoryId))
    .map((i) => ({ word: i.word!, activities: [{ label: i.word!, category: i.category as CategoryId, keywords: (i.keywords ?? [i.word!]).slice(0, 8) }] }));
  if (parsedInterests.length) req.interests = parsedInterests;
  return req;
}

// One plain sentence per stop, written only from the facts we pass in.
export async function llmExplain(plan: Plan, city: City): Promise<string[] | null> {
  const facts = plan.stops.map((s, i) => {
    const p = city.byId.get(s.placeId);
    return { stop: i + 1, role: s.slot.label, name: p?.name, kind: p?.kind, localsScore: p ? (p.locals / 10).toFixed(1) : null, redditMentions: p?.reddit.mentions, tiktokPosts: p?.tiktok.mentions, googleRating: p?.google?.rating, hiddenGem: p?.hiddenGem, arrive: formatClock(s.start), travel: s.leg ? `${s.leg.minutes} min ${s.leg.mode}` : null };
  });
  const system = "Write one short, plain sentence per stop saying why it was picked, using only the facts given. No em dashes, no hype words. Reply as JSON {\"reasons\": [string, ...]} in stop order.";
  const out = JSON.parse(await chat(system, `Request: ${plan.request.raw}\nStops: ${JSON.stringify(facts)}`)) as { reasons?: unknown };
  if (!Array.isArray(out.reasons) || out.reasons.length !== plan.stops.length) return null;
  return out.reasons.map((r) => String(r).replace(/[—–]/g, ","));
}
