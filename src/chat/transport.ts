// Every byte the group chat sends or receives goes through one ChatTransport. Screens never
// know which one is in use: they call src/chat/store.ts, which calls the transport.
//
// Implementations:
// - RelayTransport (src/chat/relay.ts): the small WebSocket relay in server/ (npm run chat-server).
// - LocalTransport (src/chat/local.ts): this phone only, when no relay is reachable.
// A hosted backend (Convex, Supabase) can be added as another implementation of this interface;
// the shapes it carries are the plain JSON in reduce.d.mts (ids from the phone, timestamps
// from whoever applies the change).
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { ChatEvent, ChatOp, Group, Member, Message, Rsvp, Snapshot, StartPoint, Ticket } from "./reduce.mjs";

export type TransportStatus = "connecting" | "live" | "offline";

export interface ChatTransport {
  readonly kind: "relay" | "local";
  // Open the connection as `me`; events from any of my groups arrive through onEvent.
  connect(me: Member, onEvent: (e: ChatEvent) => void, onStatus: (s: TransportStatus) => void): Promise<Snapshot | null>;
  close(): void;
  // One generic call, and the named ones below built on it.
  request(op: ChatOp): Promise<unknown>;
  createGroup(group: Omit<Group, "createdAt" | "updatedAt" | "createdBy">): Promise<Group>;
  join(code: string, me: Member): Promise<Group | null>;
  addMember(groupId: string, member: Member): Promise<void>;
  send(message: Omit<Message, "createdAt">): Promise<void>;
  postTicket(ticket: Omit<Ticket, "createdAt" | "updatedAt" | "revision" | "rsvps" | "thumbs">, message: Omit<Message, "createdAt">): Promise<void>;
  rsvp(ticketId: string, answer: Rsvp): Promise<void>;
  vote(ticketId: string, up: boolean): Promise<void>;
  setStart(groupId: string, start: StartPoint | null): Promise<void>;
  findUser(handle: string): Promise<Member | null>;
}

// The named calls, written once on top of `request`.
export abstract class BaseTransport implements ChatTransport {
  abstract readonly kind: "relay" | "local";
  abstract connect(me: Member, onEvent: (e: ChatEvent) => void, onStatus: (s: TransportStatus) => void): Promise<Snapshot | null>;
  abstract close(): void;
  abstract request(op: ChatOp): Promise<unknown>;
  async createGroup(group: Omit<Group, "createdAt" | "updatedAt" | "createdBy">) { return (await this.request({ op: "createGroup", group })) as Group; }
  async join(code: string, me: Member) { return ((await this.request({ op: "join", code, member: me })) as Group | undefined) ?? null; }
  async addMember(groupId: string, member: Member) { await this.request({ op: "addMember", groupId, member }); }
  async send(message: Omit<Message, "createdAt">) { await this.request({ op: "send", message }); }
  async postTicket(ticket: Omit<Ticket, "createdAt" | "updatedAt" | "revision" | "rsvps" | "thumbs">, message: Omit<Message, "createdAt">) { await this.request({ op: "postTicket", ticket, message }); }
  async rsvp(ticketId: string, answer: Rsvp) { await this.request({ op: "rsvp", ticketId, answer }); }
  async vote(ticketId: string, up: boolean) { await this.request({ op: "vote", ticketId, up }); }
  async setStart(groupId: string, start: StartPoint | null) { await this.request({ op: "setStart", groupId, start }); }
  async findUser(handle: string) { return ((await this.request({ op: "findUser", handle })) as Member | null) ?? null; }
}

export const CHAT_PORT = 8787;

// Where the relay lives: EXPO_PUBLIC_CHAT_URL, else the computer that serves this app (the
// same host Expo Go loaded the bundle from, or the web page's host) on port 8787.
export function relayUrl(): string | null {
  const env = process.env.EXPO_PUBLIC_CHAT_URL;
  if (env) return env.replace(/^http/, "ws");
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.location?.hostname) return null;
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${CHAT_PORT}`;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ?? null;
  const host = hostUri?.split(":")[0];
  return host ? `ws://${host}:${CHAT_PORT}` : null;
}

let counter = 0;
export function newId(prefix: string): string {
  counter = (counter + 1) % 1e6;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
