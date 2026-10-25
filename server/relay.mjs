// The chat relay as a module: state (in memory and in a JSON file), the WebSocket protocol,
// and apply(), which the Faves API uses to act as the butler. See chat-server.mjs.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { WebSocketServer } from "ws";
import { applyOp, audienceFor, emptyState } from "../src/chat/reduce.mjs";

export function createRelay({ file }) {
  let state = emptyState();
  try {
    state = { ...emptyState(), ...JSON.parse(readFileSync(file, "utf8")) };
    console.log(`loaded ${Object.keys(state.groups).length} groups from ${file}`);
  } catch { /* first run */ }

  let saveTimer = null;
  const save = () => {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(`${file}.tmp`, JSON.stringify(state));
      renameSync(`${file}.tmp`, file);
    }, 300);
  };

  const sockets = new Map(); // ws -> member id
  const push = (e) => {
    const who = audienceFor(state, e);
    const text = JSON.stringify({ event: e });
    for (const [ws, id] of sockets) if (who.has(id) && ws.readyState === 1) ws.send(text);
  };

  // Apply one op as a member (the WebSocket clients, or the butler through the API).
  const apply = (actorId, op) => {
    let out;
    try { out = applyOp(state, op, { now: Date.now(), actorId }); } catch (e) { out = { events: [], error: String(e?.message || e) }; }
    for (const e of out.events) push(e);
    if (out.events.length) save();
    return out;
  };

  const attach = (server) => {
    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws) => {
      ws.on("message", (raw) => {
        let msg;
        try { msg = JSON.parse(String(raw)); } catch { return; }
        const { id, ...op } = msg;
        if (op.op === "hello" && op.member?.id) sockets.set(ws, op.member.id);
        const actorId = sockets.get(ws);
        if (!actorId) { ws.send(JSON.stringify({ re: id, ok: false, error: "say-hello-first" })); return; }
        const out = apply(actorId, op);
        ws.send(JSON.stringify(out.error ? { re: id, ok: false, error: out.error } : { re: id, ok: true, result: out.result ?? null }));
      });
      ws.on("close", () => sockets.delete(ws));
    });
    return wss;
  };

  return { get state() { return state; }, apply, attach, online: () => new Set(sockets.values()) };
}
