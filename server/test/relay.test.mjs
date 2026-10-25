// Two phones talking through the relay: node --test server/test/relay.test.mjs
// (starts its own relay on a spare port with a throwaway data file).
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import WebSocket from "ws";
import { chatterFor, FAVES_ID, mentionsButler } from "../../src/chat/reduce.mjs";

const PORT = 8790 + Math.floor(Math.random() * 100);
const dir = mkdtempSync(join(tmpdir(), "faves-relay-"));
const server = spawn(process.execPath, ["server/chat-server.mjs"], { env: { ...process.env, CHAT_PORT: String(PORT), CHAT_FILE: join(dir, "chat.json") }, stdio: "pipe" });
after(() => server.kill());
await new Promise((r) => server.stdout.on("data", (d) => { if (String(d).includes("relay on")) r(); }));

function phone(member) {
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  const events = [];
  const waiting = new Map();
  let n = 0;
  ws.on("message", (raw) => {
    const m = JSON.parse(String(raw));
    if (m.re) { const w = waiting.get(m.re); waiting.delete(m.re); w?.(m); } else events.push(m.event);
  });
  const req = (op) => new Promise((resolve) => { const id = `r${++n}`; waiting.set(id, resolve); ws.send(JSON.stringify({ id, ...op })); });
  const ready = new Promise((r) => ws.on("open", r)).then(() => req({ op: "hello", member }));
  return { ws, events, req, ready, close: () => ws.close() };
}
const until = async (fn) => { for (let i = 0; i < 50; i++) { if (fn()) return; await new Promise((r) => setTimeout(r, 40)); } throw new Error("timed out"); };

test("a group made on one phone shows up live on the other, messages and RSVPs too", async () => {
  const morgan = { id: "u-morgan", name: "Morgan", handle: "morgan" };
  const maya = { id: "u-maya", name: "Maya", handle: "maya" };
  const a = phone(morgan), b = phone(maya);
  await a.ready; await b.ready;
  const found = await a.req({ op: "findUser", handle: "@Maya" });
  assert.equal(found.result.id, "u-maya");
  const made = await a.req({ op: "createGroup", group: { id: "g1", name: "Sat crew", emoji: "🌉", city: "san-francisco", members: [morgan, found.result], inviteCode: "ABC234" } });
  assert.ok(made.ok);
  await until(() => b.events.some((e) => e.type === "group" && e.group.id === "g1"));
  await a.req({ op: "send", message: { id: "m1", groupId: "g1", authorId: "u-morgan", authorName: "Morgan", kind: "text", text: "pickleball sat?" } });
  await until(() => b.events.some((e) => e.type === "message" && e.message.id === "m1"));
  const msg = b.events.find((e) => e.type === "message" && e.message.id === "m1").message;
  assert.equal(typeof msg.createdAt, "number"); // the server's clock
  await a.req({ op: "postTicket", ticket: { id: "t1", groupId: "g1", plan: { id: "p1", stops: [] }, status: "proposed", createdBy: "u-morgan" }, message: { id: "m2", groupId: "g1", authorId: "u-morgan", authorName: "Morgan", kind: "ticket", ticketId: "t1" } });
  await b.req({ op: "rsvp", ticketId: "t1", answer: "in" });
  await until(() => a.events.some((e) => e.type === "ticket" && e.ticket.rsvps["u-maya"] === "in"));
  // Starting points travel as a neighborhood-level point only.
  await b.req({ op: "setStart", groupId: "g1", start: { hood: "Mission District", lat: 37.76, lng: -122.42, mode: "transit", live: false } });
  await until(() => a.events.some((e) => e.type === "group" && e.group.starts?.["u-maya"]?.hood === "Mission District"));
  // Someone outside the group hears nothing and can't post.
  const ren = phone({ id: "u-ren", name: "Ren", handle: "ren" });
  await ren.ready;
  const denied = await ren.req({ op: "send", message: { id: "m9", groupId: "g1", authorId: "u-ren", authorName: "Ren", kind: "text", text: "hi" } });
  assert.equal(denied.ok, false);
  // ...until they join with the invite code.
  const joined = await ren.req({ op: "join", code: "ABC234", member: { id: "u-ren", name: "Ren", handle: "ren" } });
  assert.equal(joined.result.members.length, 3);
  await until(() => a.events.some((e) => e.type === "message" && /Ren joined/.test(e.message.text ?? "")));
  a.close(); b.close(); ren.close();
});

// The butler's tl;dr ("Lately, ...") sums up what people said to each other: never the asks
// addressed to the butler, by any of its names, and never its own messages.
test("tl;dr chatter leaves out @fave commands and the butler's own messages", () => {
  assert.equal(mentionsButler("@fave book it", "Fave"), true);
  assert.equal(mentionsButler("ok @faves plan saturday", "Fave"), true);
  assert.equal(mentionsButler("@Jarvis running 15 min late", "Jarvis"), true);
  assert.equal(mentionsButler("email me at maya@fave.com", "Fave"), false);
  assert.equal(mentionsButler("who's bringing paddles?", "Jarvis"), false);
  const msg = (authorId, text, kind = "text") => ({ id: text, groupId: "g", authorId, authorName: authorId, kind, text, createdAt: 0 });
  const list = [
    msg("maya", "who's bringing paddles?"),
    msg("morgan", "@fave plan pickleball then hot pot on saturday"),
    msg(FAVES_ID, "Here's a plan (Morgan asked): Pickleball and hot pot.", "agent"),
    msg("ben", "I can, see you at 1"),
    msg("morgan", "@jarvis book it"),
    msg("morgan", "@fave tl;dr"),
  ];
  assert.deepEqual(chatterFor(list, "Jarvis").map((m) => m.text), ["who's bringing paddles?", "I can, see you at 1"]);
});
