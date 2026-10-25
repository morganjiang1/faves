// One-time Cartesia setup for the booking call: makes the "Faves Booker" managed agent (it says
// it's an AI) and lists your phone numbers. Prints the .env lines to add.
//   npm run cartesia:setup        (needs CARTESIA_API_KEY in .env)
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createBooker, phoneNumbers } from "../server/cartesia";

for (const f of [".env", ".env.local"]) {
  const p = join(__dirname, "..", f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] && process.env[m[1]] == null) process.env[m[1]] = m[2];
  }
}

(async () => {
  const lines: string[] = [];
  if (process.env.CARTESIA_AGENT_ID) console.log(`Booker agent already set: ${process.env.CARTESIA_AGENT_ID}`);
  else {
    const agent = await createBooker();
    console.log(`Made the Faves Booker agent: ${agent.id}`);
    lines.push(`CARTESIA_AGENT_ID=${agent.id}`);
  }
  const numbers = await phoneNumbers();
  if (!numbers.length) console.log("No phone numbers on the account yet: get one in the Cartesia dashboard (Phone numbers), then run this again.");
  for (const n of numbers) console.log(`Phone number ${n.number ?? n.phone_number ?? "?"}: id ${n.id}`);
  if (numbers[0] && !process.env.CARTESIA_FROM_NUMBER_ID) lines.push(`CARTESIA_FROM_NUMBER_ID=${numbers[0].id}`);
  if (lines.length) console.log(`\nAdd to .env:\n${lines.join("\n")}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
