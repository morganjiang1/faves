// Faves chat relay, standalone (no planner API): node server/chat-server.mjs
// `npm run chat-server` runs server/main.ts instead, which adds the Faves API for the agents.
// Phones on the same Wi-Fi (and the web app) share group chats live through it, with no
// accounts or keys; chats are kept in server/data/chat.json across restarts.
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRelay } from "./relay.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.CHAT_PORT || 8787);
const relay = createRelay({ file: process.env.CHAT_FILE || join(here, "data", "chat.json") });

const http = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/health") { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true, groups: Object.keys(relay.state.groups).length })); return; }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Faves chat relay. Connect with a WebSocket.\n");
});
relay.attach(http);

export const lanAddresses = () => Object.values(networkInterfaces()).flat().filter((n) => n && n.family === "IPv4" && !n.internal).map((n) => n.address);

http.listen(PORT, "0.0.0.0", () => {
  const lan = lanAddresses();
  console.log(`Faves chat relay on ws://localhost:${PORT}${lan.length ? ` and ${lan.map((a) => `ws://${a}:${PORT}`).join(", ")}` : ""}`);
});
