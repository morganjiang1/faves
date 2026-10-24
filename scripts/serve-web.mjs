// Serves the exported web build (dist/) with a fallback to index.html for app routes.
//   npx expo export --platform web && node scripts/serve-web.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(fileURLToPath(new URL("..", import.meta.url)), "dist");
const port = Number(process.argv[2] ?? process.env.PORT ?? 8090);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".ico": "image/x-icon", ".map": "application/json" };

createServer(async (req, res) => {
  // An empty page on the same origin, so tests can set saved state before the app loads.
  if (req.url === "/__blank") { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<!doctype html><title>blank</title>"); return; }
  const path = normalize(decodeURIComponent((req.url ?? "/").split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  let file = join(dist, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    file = join(dist, "index.html"); // client-side route
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => console.log(`Faves web build on http://localhost:${port}`));
