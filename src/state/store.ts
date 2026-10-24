// App state kept on the device (AsyncStorage): profile, saves, plans, recaps, rankings,
// posts, moments, groups, wallet and Plus. Supabase can sync it later (lib/adapters.ts);
// with no keys everything works locally.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { CategoryId } from "@/theme/tokens";
import type { Mode } from "@/lib/geo";
import type { Who } from "@/lib/parser";
import type { Plan } from "@/lib/planner";
import type { Moment } from "@/data/types";

export interface Profile {
  name: string;
  handle: string;
  city: string;
  interests: CategoryId[];
  crew: Who | null;
  transport: Mode;
  onboarded: boolean;
  memberSince: string;
}

export type Sentiment = "great" | "ok" | "bad";
export interface Ranked { placeId: string; city: string; name: string; hood: string | null; kind: string | null; sentiment: Sentiment; at: string }

export interface Recap {
  planId: string;
  ratings: Record<string, "up" | "down">; // by stop key
  reasons: Record<string, string[]>;
  favorite: string | null; // stop key that won "which did you like more?"
  finishedAt: string | null;
  posted: boolean;
}

export interface MyPost { id: string; planId: string; city: string; title: string; note: string; at: string }

export interface Group {
  id: string;
  planId: string;
  title: string;
  host: string;
  options: { key: string; placeId: string; label: string }[];
  votes: Record<string, Record<string, "going" | "maybe" | "cant">>; // voter -> option key -> vote
  picked: string[];
  createdAt: string;
}

export interface WalletEntry { id: string; kind: "save" | "did-day" | "trending" | "booking" | "payout"; amount: number; text: string; at: string }
export interface Wallet { entries: WalletEntry[]; payouts: { id: string; amount: number; method: string; at: string; status: "pending" | "sent" }[] }

export interface AppState {
  hydrated: boolean;
  profile: Profile;
  saved: string[]; // place ids
  plans: Record<string, Plan>;
  planOrder: string[]; // newest first
  likes: string[]; // community day ids
  doneDays: string[]; // community day ids copied with "Do this day"
  recaps: Record<string, Recap>;
  rankings: Ranked[]; // best first
  posts: MyPost[];
  moments: Record<string, Moment[]>; // by place id
  hidden: string[]; // moment ids hidden or reported
  groups: Record<string, Group>;
  wallet: Wallet;
  plus: { active: boolean; plan: "monthly" | "annual" | null; since: string | null };
  replans: { day: string; count: number };
  recentSearches: string[];
}

const KEY = "faves:v1";

export const initialState: AppState = {
  hydrated: false,
  profile: { name: "", handle: "", city: "san-francisco", interests: [], crew: null, transport: "transit", onboarded: false, memberSince: new Date().toISOString() },
  saved: [],
  plans: {},
  planOrder: [],
  likes: [],
  doneDays: [],
  recaps: {},
  rankings: [],
  posts: [],
  moments: {},
  hidden: [],
  groups: {},
  wallet: { entries: [], payouts: [] },
  plus: { active: false, plan: null, since: null },
  replans: { day: "", count: 0 },
  recentSearches: [],
};

let state: AppState = initialState;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { hydrated: _h, ...rest } = state;
    AsyncStorage.setItem(KEY, JSON.stringify(rest)).catch(() => {});
  }, 250);
}

export function getState() {
  return state;
}

export function setState(update: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  emit();
  if (state.hydrated) persist();
}

export async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<AppState>) : {};
    state = { ...initialState, ...saved, profile: { ...initialState.profile, ...(saved.profile ?? {}) }, hydrated: true };
  } catch {
    state = { ...initialState, hydrated: true };
  }
  emit();
}

export async function resetAll() {
  await AsyncStorage.removeItem(KEY).catch(() => {});
  state = { ...initialState, hydrated: true, profile: { ...initialState.profile, memberSince: new Date().toISOString() } };
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}

// ---- actions -------------------------------------------------------------------------

export const actions = {
  updateProfile(p: Partial<Profile>) {
    setState((s) => ({ profile: { ...s.profile, ...p } }));
  },
  toggleSave(placeId: string) {
    setState((s) => ({ saved: s.saved.includes(placeId) ? s.saved.filter((x) => x !== placeId) : [placeId, ...s.saved] }));
  },
  savePlan(plan: Plan) {
    setState((s) => ({ plans: { ...s.plans, [plan.id]: plan }, planOrder: [plan.id, ...s.planOrder.filter((x) => x !== plan.id)] }));
  },
  deletePlan(id: string) {
    setState((s) => {
      const { [id]: _gone, ...rest } = s.plans;
      return { plans: rest, planOrder: s.planOrder.filter((x) => x !== id) };
    });
  },
  toggleLike(dayId: string) {
    setState((s) => ({ likes: s.likes.includes(dayId) ? s.likes.filter((x) => x !== dayId) : [dayId, ...s.likes] }));
  },
  markDoneDay(dayId: string) {
    setState((s) => ({ doneDays: s.doneDays.includes(dayId) ? s.doneDays : [dayId, ...s.doneDays] }));
  },
  setRecap(planId: string, patch: Partial<Recap>) {
    setState((s) => {
      const prev: Recap = s.recaps[planId] ?? { planId, ratings: {}, reasons: {}, favorite: null, finishedAt: null, posted: false };
      return { recaps: { ...s.recaps, [planId]: { ...prev, ...patch } } };
    });
  },
  setRankings(rankings: Ranked[]) {
    setState({ rankings });
  },
  addPost(post: MyPost) {
    setState((s) => ({ posts: [post, ...s.posts.filter((p) => p.planId !== post.planId)] }));
  },
  addMoment(placeId: string, m: Moment) {
    setState((s) => ({ moments: { ...s.moments, [placeId]: [m, ...(s.moments[placeId] ?? [])] } }));
  },
  hideMoment(id: string) {
    setState((s) => ({ hidden: [...new Set([id, ...s.hidden])] }));
  },
  saveGroup(g: Group) {
    setState((s) => ({ groups: { ...s.groups, [g.id]: g } }));
  },
  setWallet(w: Wallet) {
    setState({ wallet: w });
  },
  setPlus(active: boolean, plan: "monthly" | "annual" | null) {
    setState({ plus: { active, plan, since: active ? new Date().toISOString() : null } });
  },
  useReplan(day: string) {
    setState((s) => ({ replans: s.replans.day === day ? { day, count: s.replans.count + 1 } : { day, count: 1 } }));
  },
  addSearch(q: string) {
    const t = q.trim();
    if (!t) return;
    setState((s) => ({ recentSearches: [t, ...s.recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8) }));
  },
  clearSearches() {
    setState({ recentSearches: [] });
  },
};
