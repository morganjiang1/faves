// The agent's links: short labels in the chat, never a raw reservation URL.
import { messagePieces, plainText, reserveLabel, reserveLink } from "../linktext";

const GOOGLE = "https://www.google.com/maps/reserve/v/dine/c/nqP8Fyd4GUQ?source=pa&opi=79508299&hl=en-US&sourceurl=https://www.google.com/search?q%3DEPIC%2BSteak%2B(Embarcadero)%26psi%3D" + "x".repeat(600);

test("a reservation link is a short label with the whole URL behind it", () => {
  expect(reserveLabel(GOOGLE)).toBe("Reserve on Google");
  expect(reserveLabel("https://www.opentable.com/r/foo")).toBe("Book on OpenTable");
  expect(reserveLabel("https://example.com/book")).toBe("Book a table");
  const text = `Here's how to book it:\n• 6 PM EPIC Steak: ${reserveLink(GOOGLE)}\n• 8 PM Bar: books by phone only, call them at (415) 555-0101`;
  const pieces = messagePieces(text);
  const link = pieces.find((p) => p.kind === "link");
  expect(link).toEqual({ kind: "link", text: "Reserve on Google", url: GOOGLE.replace("(", "%28").replace(")", "%29") });
  expect(pieces.find((p) => p.kind === "phone")?.text).toBe("(415) 555-0101");
  // What people see and hear: no URL anywhere.
  expect(plainText(text)).not.toMatch(/https?:/);
  expect(plainText(text)).toContain("EPIC Steak: Reserve on Google");
  expect(pieces.filter((p) => p.kind === "text").map((p) => p.text).join("")).not.toMatch(/https?:|%29/);
});

test("a bare URL from an older message shows short too", () => {
  const pieces = messagePieces(`• 1 PM Nan hot pot SF: reserve here ${GOOGLE}`);
  expect(pieces).toHaveLength(2);
  expect(pieces[1]).toMatchObject({ kind: "link", text: "Reserve on Google" });
  expect(messagePieces("menu at https://www.pier39.com/dining.").at(-2)).toMatchObject({ kind: "link", text: "pier39.com", url: "https://www.pier39.com/dining" });
  expect(messagePieces("no links here")).toEqual([{ kind: "text", text: "no links here" }]);
});
