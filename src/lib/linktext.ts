// Links in the butler's messages. A reservation link is hundreds of characters long, so the
// butler writes it as a short label ("[Reserve on Google](https://...)") and the chat shows
// just the label, tappable. Bare links (older messages) are shortened the same way, and phone
// numbers become tappable too. Pure functions: the app, the server and Convex all use them.

export function reserveLabel(url: string): string {
  const u = url.toLowerCase();
  if (/\bgoogle\.[a-z.]+\/maps\/reserve\b/.test(u) || /\breserve\.google\./.test(u)) return "Reserve on Google";
  if (u.includes("opentable.")) return "Book on OpenTable";
  if (u.includes("resy.com")) return "Book on Resy";
  if (u.includes("exploretock.com")) return "Book on Tock";
  if (u.includes("yelp.")) return "Book on Yelp";
  return "Book a table";
}

// "[Reserve on Google](https://...)": the label the chat shows, with the link behind it.
export const reserveLink = (url: string): string => `[${reserveLabel(url)}](${url})`;

// A short name for a bare link: a reservation label, else the site's name ("pier39.com").
export function shortLink(url: string): string {
  if (/\/reserve\b|opentable\.|resy\.com|exploretock\.com/i.test(url)) return reserveLabel(url);
  const host = url.replace(/^https?:\/\//i, "").split(/[/?#]/)[0].replace(/^www\./i, "");
  return host || "Open link";
}

export type Piece =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; url: string }
  | { kind: "phone"; text: string };

const LINK = /\[([^\]\n]{1,60})\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]])/g;
const PHONE = /(\(?\d{3}\)?[ .-]\d{3}-\d{4})/g;

// A message split into plain text, links (shown by their label) and phone numbers.
export function messagePieces(text: string): Piece[] {
  const out: Piece[] = [];
  const pushText = (t: string) => {
    if (!t) return;
    t.split(PHONE).forEach((x, i) => {
      if (!x) return;
      if (i % 2) out.push({ kind: "phone", text: x });
      else if (out.length && out[out.length - 1].kind === "text") (out[out.length - 1] as { text: string }).text += x;
      else out.push({ kind: "text", text: x });
    });
  };
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    pushText(text.slice(last, m.index));
    const url = m[2] ?? m[3];
    out.push({ kind: "link", text: m[1] ?? shortLink(url), url });
    last = m.index! + m[0].length;
  }
  pushText(text.slice(last));
  return out;
}

// The words only, for reading aloud and for summaries: links become their label.
export function plainText(text: string): string {
  return messagePieces(text).map((p) => p.text).join("");
}
