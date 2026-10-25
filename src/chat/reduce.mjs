// The group chat's rules, shared by the relay server (server/chat-server.mjs) and the phone
// (src/chat/*). Plain JavaScript so Node runs it as is; types are in reduce.d.mts.
//
// State is plain JSON: groups, messages by group, plan tickets and the people we know.
// `applyOp` takes one operation from a member, checks it, changes the state and returns the
// events every member should receive. Timestamps come from whoever applies the op (the server,
// or the phone when no server is reachable). `applyEvent` folds a received event into a copy
// of the state on a phone. Both are idempotent: the same message or ticket twice is one.

export const FAVES_ID = "faves";

export function emptyState() {
  return { groups: {}, messages: {}, tickets: {}, users: {} };
}

const isMember = (g, id) => Boolean(g && g.members.some((m) => m.id === id));
const firstName = (m) => (m && m.name ? m.name.split(/\s+/)[0] : "Someone");

function note(state, groupId, text, now, idSeed) {
  const message = { id: `note-${idSeed}`, groupId, authorId: FAVES_ID, authorName: "Faves", kind: "note", text, createdAt: now };
  pushMessage(state, message);
  return { type: "message", message };
}

// Copy on write, so a phone's screens see a new list whenever it changes.
function pushMessage(state, message) {
  const list = state.messages[message.groupId] || [];
  const at = list.findIndex((m) => m.id === message.id);
  const next = at >= 0 ? list.map((m, i) => (i === at ? message : m)) : [...list, message].sort((a, b) => a.createdAt - b.createdAt);
  state.messages[message.groupId] = next;
}

export function applyOp(state, op, ctx) {
  const now = ctx.now;
  const actor = state.users[ctx.actorId] || (op.member && op.member.id === ctx.actorId ? op.member : null);
  const seed = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  switch (op.op) {
    case "hello": {
      state.users[op.member.id] = { ...state.users[op.member.id], ...op.member, seenAt: now };
      return { events: [{ type: "user", member: state.users[op.member.id] }], result: snapshotFor(state, op.member.id) };
    }
    case "findUser": {
      const h = String(op.handle || "").replace(/^@/, "").toLowerCase();
      // The most recently seen person with that username (a reinstall makes a new id).
      const found = Object.values(state.users).filter((u) => u.handle.toLowerCase() === h).sort((a, b) => (b.seenAt || 0) - (a.seenAt || 0))[0] || null;
      return { events: [], result: found };
    }
    case "createGroup": {
      const g = op.group;
      if (state.groups[g.id]) return { events: [{ type: "group", group: state.groups[g.id] }], result: state.groups[g.id] };
      const members = g.members.some((m) => m.id === ctx.actorId) || !actor ? g.members : [actor, ...g.members];
      const group = { ...g, members, createdBy: ctx.actorId, createdAt: now, updatedAt: now };
      state.groups[g.id] = group;
      const events = [{ type: "group", group }];
      events.push(note(state, g.id, `${firstName(actor)} made the group`, now, seed));
      return { events, result: group };
    }
    case "updateGroup": {
      const g = state.groups[op.groupId];
      if (!isMember(g, ctx.actorId)) return { events: [], error: "not-a-member" };
      const group = { ...g, ...pick(op.patch, ["name", "emoji"]), updatedAt: now };
      state.groups[g.id] = group;
      const events = [{ type: "group", group }];
      if (op.patch.name && op.patch.name !== g.name) events.push(note(state, g.id, `${firstName(actor)} renamed the group to ${op.patch.name}`, now, seed));
      return { events, result: group };
    }
    case "setStart": {
      // A member's starting point for plans in this group. Only a neighborhood-level point
      // (the phone rounds it to the neighborhood's center) and the way they get around.
      const g = state.groups[op.groupId];
      if (!isMember(g, ctx.actorId)) return { events: [], error: "not-a-member" };
      const starts = { ...(g.starts || {}) };
      const before = starts[ctx.actorId];
      if (op.start) starts[ctx.actorId] = { ...op.start, at: now };
      else delete starts[ctx.actorId];
      const group = { ...g, starts, updatedAt: now };
      state.groups[g.id] = group;
      const events = [{ type: "group", group }];
      const where = op.start ? (op.start.hood || "somewhere nearby") : null;
      if (where && (!before || before.hood !== op.start.hood || before.mode !== op.start.mode)) events.push(note(state, g.id, `${firstName(actor)} is starting from ${where} (${op.start.mode})`, now, seed));
      return { events, result: group };
    }
    case "addMember":
    case "join": {
      const g = op.op === "join" ? Object.values(state.groups).find((x) => x.inviteCode === op.code) : state.groups[op.groupId];
      if (!g) return { events: [], error: "no-group" };
      if (op.op === "addMember" && !isMember(g, ctx.actorId)) return { events: [], error: "not-a-member" };
      if (op.member.id && !op.member.sample) state.users[op.member.id] = { ...state.users[op.member.id], ...op.member };
      if (isMember(g, op.member.id)) return { events: [{ type: "group", group: g }], result: g };
      const group = { ...g, members: [...g.members, op.member], updatedAt: now };
      state.groups[g.id] = group;
      const text = op.op === "join" ? `${firstName(op.member)} joined with the invite link` : `${firstName(actor)} added ${firstName(op.member)}`;
      return { events: [{ type: "group", group }, note(state, g.id, text, now, seed)], result: group };
    }
    case "removeMember": {
      const g = state.groups[op.groupId];
      if (!isMember(g, ctx.actorId)) return { events: [], error: "not-a-member" };
      const gone = g.members.find((m) => m.id === op.memberId);
      if (!gone) return { events: [], result: g };
      const group = { ...g, members: g.members.filter((m) => m.id !== op.memberId), updatedAt: now };
      state.groups[g.id] = group;
      const text = op.memberId === ctx.actorId ? `${firstName(gone)} left the group` : `${firstName(actor)} removed ${firstName(gone)}`;
      return { events: [{ type: "group", group }, { type: "left", groupId: g.id, memberId: op.memberId }, note(state, g.id, text, now, seed)], result: group };
    }
    case "send": {
      const g = state.groups[op.message.groupId];
      if (!g || (!isMember(g, ctx.actorId) && op.message.authorId !== FAVES_ID)) return { events: [], error: "not-a-member" };
      const existing = (state.messages[g.id] || []).find((m) => m.id === op.message.id);
      if (existing) return { events: [{ type: "message", message: existing }], result: existing };
      const message = { ...op.message, createdAt: now };
      delete message.pending;
      pushMessage(state, message);
      return { events: [{ type: "message", message }], result: message };
    }
    case "postTicket": {
      const g = state.groups[op.ticket.groupId];
      if (!isMember(g, ctx.actorId)) return { events: [], error: "not-a-member" };
      // Whoever proposes a plan is in, unless the proposer says otherwise (the butler proposes for everyone).
      const ticket = state.tickets[op.ticket.id] || { ...op.ticket, rsvps: op.ticket.rsvps || { [ctx.actorId]: "in" }, thumbs: op.ticket.thumbs || {}, createdAt: now, updatedAt: now, revision: 1 };
      state.tickets[ticket.id] = ticket;
      const message = { ...op.message, createdAt: now };
      delete message.pending;
      pushMessage(state, message);
      return { events: [{ type: "ticket", ticket }, { type: "message", message }], result: ticket };
    }
    case "rsvp":
    case "vote": {
      const t = state.tickets[op.ticketId];
      if (!t || !isMember(state.groups[t.groupId], ctx.actorId)) return { events: [], error: "no-ticket" };
      const ticket = op.op === "rsvp"
        ? { ...t, rsvps: { ...t.rsvps, [ctx.actorId]: op.answer }, updatedAt: now }
        : { ...t, thumbs: { ...t.thumbs, [ctx.actorId]: Boolean(op.up) }, updatedAt: now };
      state.tickets[t.id] = ticket;
      return { events: [{ type: "ticket", ticket }], result: ticket };
    }
    case "updateTicket": {
      const t = state.tickets[op.ticketId];
      if (!t || !isMember(state.groups[t.groupId], ctx.actorId)) return { events: [], error: "no-ticket" };
      const ticket = { ...t, ...pick(op.patch, ["plan", "status"]), revision: (t.revision || 1) + 1, updatedAt: now };
      state.tickets[t.id] = ticket;
      const events = [{ type: "ticket", ticket }];
      if (op.note) {
        const message = { id: `change-${t.id}-${ticket.revision}`, groupId: t.groupId, authorId: ctx.actorId, authorName: actor ? actor.name : "Someone", kind: "change", text: op.note, ticketId: t.id, createdAt: now };
        pushMessage(state, message);
        events.push({ type: "message", message });
      }
      return { events, result: ticket };
    }
    default:
      return { events: [], error: "unknown-op" };
  }
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

// Fold one event into a phone's copy of the state.
export function applyEvent(state, e) {
  if (e.type === "group") state.groups[e.group.id] = e.group;
  else if (e.type === "message") pushMessage(state, e.message);
  else if (e.type === "ticket") state.tickets[e.ticket.id] = e.ticket;
  else if (e.type === "user") state.users[e.member.id] = e.member;
  else if (e.type === "left" && e.memberId === state.me) {
    delete state.groups[e.groupId];
  }
  return state;
}

// Everything one member can see: their groups, the last messages of each and their tickets.
export function snapshotFor(state, memberId, limit = 200) {
  const groups = Object.values(state.groups).filter((g) => isMember(g, memberId));
  const ids = new Set(groups.map((g) => g.id));
  const messages = {};
  for (const g of groups) messages[g.id] = (state.messages[g.id] || []).slice(-limit);
  const tickets = {};
  for (const t of Object.values(state.tickets)) if (ids.has(t.groupId)) tickets[t.id] = t;
  const users = {};
  for (const g of groups) for (const m of g.members) if (state.users[m.id]) users[m.id] = state.users[m.id];
  return { groups, messages, tickets, users };
}

// Who should hear about an event: the members of its group (and whoever just left).
export function audienceFor(state, e) {
  const groupId = e.group ? e.group.id : e.message ? e.message.groupId : e.ticket ? e.ticket.groupId : e.groupId;
  const g = groupId ? state.groups[groupId] : null;
  const ids = new Set(g ? g.members.map((m) => m.id) : []);
  if (e.type === "left") ids.add(e.memberId);
  return ids;
}

// Six letters, no look-alikes (no 0/O, 1/I/L).
export function inviteCode(rand = Math.random) {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += abc[Math.floor(rand() * abc.length)];
  return s;
}
