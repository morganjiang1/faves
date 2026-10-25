// Types for reduce.mjs: the plain-JSON shapes every chat transport carries.

export interface Member { id: string; name: string; handle: string; sample?: boolean; interests?: string[]; mode?: "walk" | "transit" | "drive" | "bike" }

export type Rsvp = "in" | "maybe" | "out";

// Where a member starts from for plans in a group: a neighborhood-level point (never their
// exact location) and how they get around. `live` means it came from their phone's location.
export interface StartPoint { hood: string | null; lat: number; lng: number; mode: "walk" | "transit" | "drive" | "bike"; live: boolean; at?: number }

export interface Group {
  id: string;
  name: string;
  emoji: string;
  city: string;
  members: Member[];
  inviteCode: string;
  starts?: Record<string, StartPoint>; // by member id
  createdBy: string;
  createdAt: number; // set by whoever applied the op (the server when one is reachable)
  updatedAt: number;
}

// text: a plain message; ticket: a plan ticket; postcard: a spot; day: a community day;
// note: Faves says who joined or renamed; change: a ticket was swapped or re-planned;
// agent: @faves answering.
export type MessageKind = "text" | "ticket" | "postcard" | "day" | "note" | "change" | "agent";

export interface Message {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  kind: MessageKind;
  text?: string;
  ticketId?: string;
  placeId?: string;
  dayId?: string;
  createdAt: number;
  pending?: boolean; // shown before the server has it
}

export interface Ticket {
  id: string;
  groupId: string;
  plan: unknown; // a Plan (src/lib/planner.ts), as JSON
  status: "proposed" | "locked";
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  rsvps: Record<string, Rsvp>;
  thumbs: Record<string, boolean>;
  revision: number;
}

export interface ChatState {
  groups: Record<string, Group>;
  messages: Record<string, Message[]>;
  tickets: Record<string, Ticket>;
  users: Record<string, Member>;
  me?: string;
}

export type ChatOp =
  | { op: "hello"; member: Member }
  | { op: "findUser"; handle: string }
  | { op: "createGroup"; group: Omit<Group, "createdAt" | "updatedAt" | "createdBy"> }
  | { op: "updateGroup"; groupId: string; patch: Partial<Pick<Group, "name" | "emoji">> }
  | { op: "addMember"; groupId: string; member: Member }
  | { op: "join"; code: string; member: Member }
  | { op: "removeMember"; groupId: string; memberId: string }
  | { op: "setStart"; groupId: string; start: StartPoint | null }
  | { op: "send"; message: Omit<Message, "createdAt"> & { createdAt?: number } }
  | { op: "postTicket"; ticket: Omit<Ticket, "createdAt" | "updatedAt" | "revision" | "rsvps" | "thumbs"> & Partial<Pick<Ticket, "rsvps" | "thumbs">>; message: Omit<Message, "createdAt"> & { createdAt?: number } }
  | { op: "rsvp"; ticketId: string; answer: Rsvp }
  | { op: "vote"; ticketId: string; up: boolean }
  | { op: "updateTicket"; ticketId: string; patch: Partial<Pick<Ticket, "plan" | "status">>; note?: string };

export type ChatEvent =
  | { type: "group"; group: Group }
  | { type: "message"; message: Message }
  | { type: "ticket"; ticket: Ticket }
  | { type: "user"; member: Member }
  | { type: "left"; groupId: string; memberId: string };

export interface Snapshot { groups: Group[]; messages: Record<string, Message[]>; tickets: Record<string, Ticket>; users: Record<string, Member> }

export const FAVES_ID: "faves";
export function emptyState(): ChatState;
export function applyOp(state: ChatState, op: ChatOp, ctx: { now: number; actorId: string }): { events: ChatEvent[]; result?: unknown; error?: string };
export function applyEvent(state: ChatState, e: ChatEvent): ChatState;
export function snapshotFor(state: ChatState, memberId: string, limit?: number): Snapshot;
export function audienceFor(state: ChatState, e: ChatEvent): Set<string>;
export function inviteCode(rand?: () => number): string;
