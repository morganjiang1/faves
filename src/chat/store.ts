// The group chat on this phone: what it knows (groups, messages, tickets), how it is
// connected, and the actions screens call. Screens use useChat() and chat.*; only this file
// talks to a transport. Everything is kept on the phone (AsyncStorage) so chats open
// instantly and still work offline; changes made offline wait in an outbox and go to the
// relay when it is back.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { AppState as RNAppState } from "react-native";
import type { Plan } from "@/lib/planner";
import { actions, getState } from "@/state/store";
import { LocalTransport } from "./local";
import { applyEvent, emptyState, FAVES_ID, inviteCode, type ChatEvent, type ChatOp, type ChatState, type Group, type Member, type Message, type Rsvp, type Snapshot, type StartPoint, type Ticket } from "./reduce.mjs";
import { ConvexTransport, convexUrl } from "./convex";
import { RelayTransport } from "./relay";
import { newId, relayUrl, type TransportStatus } from "./transport";

const KEY = "faves:chat:v1";

export interface ChatView {
  hydrated: boolean;
  me: Member | null;
  data: ChatState;
  status: TransportStatus; // live = shared through the relay; offline = only on this phone
  relay: string | null;
  backend: "convex" | "relay" | "none"; // where chats are shared
  outbox: ChatOp[];
  read: Record<string, number>; // group id -> newest message time I've seen
  muted: Record<string, boolean>;
  live: Record<string, boolean>; // group id -> share my live (approximate) location
  rev: number;
}

let view: ChatView = { hydrated: false, me: null, data: emptyState(), status: "connecting", relay: null, backend: "none", outbox: [], read: {}, muted: {}, live: {}, rev: 0 };
const listeners = new Set<() => void>();
// Each change hands screens fresh maps (lists inside are copied on write by reduce.mjs).
const emit = () => {
  const d = view.data;
  view = { ...view, data: { ...d, groups: { ...d.groups }, messages: { ...d.messages }, tickets: { ...d.tickets }, users: { ...d.users } }, rev: view.rev + 1 };
  listeners.forEach((l) => l());
  schedulePersist();
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (!view.hydrated) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const { data, outbox, read, muted, live, me } = view;
    AsyncStorage.setItem(KEY, JSON.stringify({ data, outbox, read, muted, live, me })).catch(() => {});
  }, 250);
}

export function useChat<T>(select: (v: ChatView) => T): T {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => select(view), () => select(view));
}
export const chatView = () => view;

// The shared backend: Convex when EXPO_PUBLIC_CONVEX_URL is set, otherwise the WebSocket relay.
let relay: RelayTransport | ConvexTransport | null = null;

// Moments shared through Convex file storage (only when chats run on Convex).
export function sharedMoments(): ConvexTransport | null {
  return relay instanceof ConvexTransport ? relay : null;
}
let local: LocalTransport | null = null;
let starting: Promise<void> | null = null;

// Start once the profile exists (after onboarding). Safe to call again.
export function startChat(): Promise<void> {
  if (starting) return starting;
  starting = (async () => {
    const profile = getState().profile;
    let userId = profile.userId;
    if (!userId) { userId = newId("u"); actions.updateProfile({ userId }); }
    const me: Member = { id: userId, name: profile.name || "You", handle: profile.handle || (profile.name || "you").toLowerCase().replace(/[^a-z0-9]/g, "") };
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<ChatView>;
        view = { ...view, data: { ...emptyState(), ...(saved.data ?? {}) }, outbox: saved.outbox ?? [], read: saved.read ?? {}, muted: saved.muted ?? {}, live: saved.live ?? {} };
      }
    } catch { /* start fresh */ }
    view.data.me = me.id;
    view.data.users[me.id] = me;
    const cvx = convexUrl();
    view = { ...view, me, hydrated: true, relay: cvx ?? relayUrl(), backend: cvx ? "convex" : relayUrl() ? "relay" : "none" };
    local = new LocalTransport(() => view.data);
    await local.connect(me, onEvent, () => {});
    emit();
    const url = view.relay;
    if (url) {
      relay = cvx ? new ConvexTransport(cvx) : new RelayTransport(url);
      relay.setSnapshotHandler((snap) => { mergeSnapshot(snap); flushOutbox(); });
      await relay.connect(me, onEvent, (s) => { view = { ...view, status: s }; emit(); });
      RNAppState.addEventListener("change", (st) => { if (st === "active") relay?.wake(); });
    } else {
      view = { ...view, status: "offline" };
      emit();
    }
  })();
  return starting;
}

// Profile changes (name, handle) reach the relay on the next hello.
export function refreshMe() {
  const p = getState().profile;
  if (!view.me) return;
  const me = { ...view.me, name: p.name || view.me.name, handle: p.handle || view.me.handle };
  view = { ...view, me };
  view.data.users[me.id] = me;
  emit();
  if (relay?.connected) relay.request({ op: "hello", member: me }).catch(() => {});
}

function onEvent(e: ChatEvent) {
  applyEvent(view.data, e);
  if (e.type === "ticket") savePlanFrom(e.ticket);
  emit();
}

function mergeSnapshot(snap: Snapshot) {
  for (const g of snap.groups) view.data.groups[g.id] = g;
  // The server's list wins; messages still on their way from this phone stay at the end.
  for (const [gid, msgs] of Object.entries(snap.messages)) {
    const have = new Set(msgs.map((m) => m.id));
    const pending = (view.data.messages[gid] ?? []).filter((m) => m.pending && !have.has(m.id));
    view.data.messages[gid] = [...msgs, ...pending];
  }
  for (const t of Object.values(snap.tickets)) { view.data.tickets[t.id] = t; savePlanFrom(t); }
  for (const u of Object.values(snap.users)) view.data.users[u.id] = u;
  emit();
}

// A group's plan also lives with my plans, so its full itinerary opens like any other.
function savePlanFrom(t: Ticket) {
  const plan = t.plan as Plan | null;
  if (plan?.id && view.data.groups[t.groupId]) actions.savePlan(plan);
}

let flushing = false;
async function flushOutbox() {
  if (flushing || !relay?.connected) return;
  flushing = true;
  try {
    while (view.outbox.length && relay?.connected) {
      const op = view.outbox[0];
      try { await relay.request(op); } catch (e) {
        const msg = (e as Error).message;
        if (msg === "offline" || msg === "timeout" || msg === "closed") break; // try again later
      }
      view = { ...view, outbox: view.outbox.slice(1) };
      emit();
    }
  } finally { flushing = false; }
}

// Run one change: through the relay when it's live, otherwise on this phone (queued for later).
async function run(op: ChatOp): Promise<unknown> {
  await startChat();
  if (relay?.connected) {
    try { return await relay.request(op); } catch (e) {
      const msg = (e as Error).message;
      if (msg !== "offline" && msg !== "timeout" && msg !== "closed") throw e;
    }
  }
  const result = await local!.request(op);
  if (op.op !== "findUser" && op.op !== "hello") { view = { ...view, outbox: [...view.outbox, op] }; emit(); }
  return result;
}

const me = () => view.me!;
const groupOf = (id: string) => view.data.groups[id];

export const SAMPLE_FRIENDS: Member[] = [
  { id: "sample-maya", name: "Maya (sample)", handle: "maya.sample", sample: true },
  { id: "sample-jay", name: "Jay (sample)", handle: "jay.sample", sample: true },
  { id: "sample-ren", name: "Ren (sample)", handle: "ren.sample", sample: true },
];

export const chat = {
  async createGroup(input: { name: string; emoji: string; members: Member[]; city: string }): Promise<Group> {
    await startChat();
    const group = { id: newId("g"), name: input.name.trim() || "New group", emoji: input.emoji || "💗", city: input.city, members: [me(), ...input.members.filter((m) => m.id !== me().id)], inviteCode: inviteCode() };
    const g = (await run({ op: "createGroup", group })) as Group;
    const home = getState().profile.homeHood;
    if (home) await chat.setStartFromHood(g.id, home).catch(() => {});
    return g;
  },
  rename: (groupId: string, name: string, emoji?: string) => run({ op: "updateGroup", groupId, patch: emoji ? { name, emoji } : { name } }),
  addMember: (groupId: string, member: Member) => run({ op: "addMember", groupId, member }),
  removeMember: (groupId: string, memberId: string) => run({ op: "removeMember", groupId, memberId }),
  async leave(groupId: string) {
    await run({ op: "removeMember", groupId, memberId: me().id });
    delete view.data.groups[groupId];
    emit();
  },
  async join(code: string): Promise<Group | null> {
    await startChat();
    const clean = code.trim().toUpperCase();
    const known = Object.values(view.data.groups).find((g) => g.inviteCode === clean);
    if (known) return known;
    if (!relay?.connected) return null;
    try { return ((await relay.request({ op: "join", code: clean, member: me() })) as Group) ?? null; } catch { return null; }
  },
  async findUser(handle: string): Promise<Member | null> {
    await startChat();
    const h = handle.trim().replace(/^@/, "").toLowerCase();
    const known = Object.values(view.data.users).find((u) => u.handle.toLowerCase() === h && u.id !== me().id);
    if (known) return known;
    if (!relay?.connected) return null;
    try { return ((await relay.request({ op: "findUser", handle: h })) as Member | null) ?? null; } catch { return null; }
  },
  async send(groupId: string, input: { kind: Message["kind"]; text?: string; placeId?: string; dayId?: string; ticketId?: string; author?: Member }) {
    await startChat();
    const author = input.author ?? me();
    const message: Message = { id: newId("m"), groupId, authorId: author.id, authorName: author.name, kind: input.kind, text: input.text, placeId: input.placeId, dayId: input.dayId, ticketId: input.ticketId, createdAt: Date.now(), pending: true };
    // Show it right away; the server's copy replaces it.
    applyEvent(view.data, { type: "message", message });
    emit();
    markRead(groupId);
    const { pending: _p, createdAt: _c, ...wire } = message;
    void _p; void _c;
    await run({ op: "send", message: wire });
    return message;
  },
  sendText: (groupId: string, text: string) => chat.send(groupId, { kind: "text", text }),
  sendPostcard: (groupId: string, placeId: string, text?: string) => chat.send(groupId, { kind: "postcard", placeId, text }),
  sendDay: (groupId: string, dayId: string) => chat.send(groupId, { kind: "day", dayId }),
  sayAsFaves: (groupId: string, input: { text?: string; placeId?: string; ticketId?: string }) => chat.send(groupId, { kind: "agent", ...input, author: { id: FAVES_ID, name: groupOf(groupId)?.butlerName || "Fave", handle: "faves" } }),
  renameButler: (groupId: string, butlerName: string) => run({ op: "updateGroup", groupId, patch: { butlerName } }),
  async postTicket(groupId: string, plan: Plan): Promise<string> {
    await startChat();
    const ticketId = newId("t");
    actions.savePlan(plan);
    await run({ op: "postTicket", ticket: { id: ticketId, groupId, plan, status: "proposed", createdBy: me().id }, message: { id: newId("m"), groupId, authorId: me().id, authorName: me().name, kind: "ticket", ticketId } });
    markRead(groupId);
    return ticketId;
  },
  rsvp: (ticketId: string, answer: Rsvp) => run({ op: "rsvp", ticketId, answer }),
  vote: (ticketId: string, up: boolean) => run({ op: "vote", ticketId, up }),
  async updateTicket(ticketId: string, patch: { plan?: Plan; status?: Ticket["status"] }, note?: string) {
    if (patch.plan) actions.savePlan(patch.plan);
    await run({ op: "updateTicket", ticketId, patch, note });
  },
  setStart: (groupId: string, start: StartPoint | null) => run({ op: "setStart", groupId, start }),
  async setStartFromHood(groupId: string, hood: string) {
    const { loadCity } = await import("@/data/cities");
    const { hoodPoint } = await import("@/lib/fair");
    const g = groupOf(groupId);
    const city = await loadCity(g?.city ?? getState().profile.city);
    const pt = hoodPoint(city, hood);
    if (!pt) return;
    await chat.setStart(groupId, { ...pt, mode: getState().profile.transport, live: false });
  },
  setLive(groupId: string, on: boolean) { view = { ...view, live: { ...view.live, [groupId]: on } }; emit(); },
  toggleMute(groupId: string) { view = { ...view, muted: { ...view.muted, [groupId]: !view.muted[groupId] } }; emit(); },
  markRead,
};

// With Convex, each group's agent runs on the server; with the relay, @faves runs here.
export const serverButler = () => view.backend === "convex" && view.status === "live";

// Who's in a chat right now (Convex presence). Returns how to stop.
export function present(groupId: string, onPeople: (ids: string[]) => void): () => void {
  if (relay instanceof ConvexTransport) return relay.present(groupId, onPeople);
  return () => {};
}

function markRead(groupId: string) {
  const list = view.data.messages[groupId] ?? [];
  const newest = list[list.length - 1]?.createdAt ?? Date.now();
  if ((view.read[groupId] ?? 0) >= newest) return;
  view = { ...view, read: { ...view.read, [groupId]: newest } };
  emit();
}

export function unreadCount(v: ChatView, groupId: string): number {
  const since = v.read[groupId] ?? 0;
  return (v.data.messages[groupId] ?? []).filter((m) => m.createdAt > since && m.authorId !== v.me?.id && m.kind !== "note").length;
}

// For tests: forget everything (the relay keeps its copy).
export async function resetChat() {
  relay?.close();
  relay = null; local = null; starting = null;
  view = { hydrated: false, me: null, data: emptyState(), status: "connecting", relay: null, backend: "none", outbox: [], read: {}, muted: {}, live: {}, rev: 0 };
  await AsyncStorage.removeItem(KEY).catch(() => {});
  emit();
}

export type { Group, Member, Message, Ticket, Rsvp, StartPoint };
