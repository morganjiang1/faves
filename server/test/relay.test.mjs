// Two phones talking through the relay: node --test server/test/relay.test.mjs
// (starts its own relay on a spare port with a throwaway data file).
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import WebSocket from "ws";

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
