// Faves chat relay: a tiny WebSocket server so phones on the same Wi-Fi (and the web app)
// share group chats live, with no accounts or keys. It keeps everything in memory and in
// server/data/chat.json, so chats survive a restart.
//
//   npm run chat-server            (port 8787, or CHAT_PORT)
//
// The rules (who can do what, what each change does) are in src/chat/reduce.mjs, shared
// with the phone. Protocol: the phone sends {id, op, ...}; the server answers {re: id, ok,
// result | error} and pushes {event} to every member of the group a change touched.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { applyOp, audienceFor, emptyState } from "../src/chat/reduce.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.CHAT_PORT || 8787);
const FILE = process.env.CHAT_FILE || join(here, "data", "chat.json");

let state = emptyState();
try {
  state = { ...emptyState(), ...JSON.parse(readFileSync(FILE, "utf8")) };
  console.log(`loaded ${Object.keys(state.groups).length} groups from ${FILE}`);
} catch { /* first run */ }

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(`${FILE}.tmp`, JSON.stringify(state));
    renameSync(`${FILE}.tmp`, FILE);
  }, 300);
}

const http = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/health") { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true, groups: Object.keys(state.groups).length })); return; }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Faves chat relay. Connect with a WebSocket.\n");
});
const wss = new WebSocketServer({ server: http });
const sockets = new Map(); // ws -> member id

function push(e) {
  const who = audienceFor(state, e);
  const text = JSON.stringify({ event: e });
  for (const [ws, id] of sockets) if (who.has(id) && ws.readyState === 1) ws.send(text);
}

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    const { id, ...op } = msg;
    if (op.op === "hello" && op.member?.id) sockets.set(ws, op.member.id);
    const actorId = sockets.get(ws);
    if (!actorId) { ws.send(JSON.stringify({ re: id, ok: false, error: "say-hello-first" })); return; }
    let out;
    try { out = applyOp(state, op, { now: Date.now(), actorId }); } catch (e) { out = { events: [], error: String(e.message || e) }; }
    ws.send(JSON.stringify(out.error ? { re: id, ok: false, error: out.error } : { re: id, ok: true, result: out.result ?? null }));
    for (const e of out.events) push(e);
    if (out.events.length) save();
  });
  ws.on("close", () => sockets.delete(ws));
});

http.listen(PORT, "0.0.0.0", () => {
  const lan = Object.values(networkInterfaces()).flat().filter((n) => n && n.family === "IPv4" && !n.internal).map((n) => n.address);
  console.log(`Faves chat relay on ws://localhost:${PORT}${lan.length ? ` and ${lan.map((a) => `ws://${a}:${PORT}`).join(", ")}` : ""}`);
  console.log("Phones in Expo Go on the same Wi-Fi find it on their own (the same computer that serves the app).");
});
