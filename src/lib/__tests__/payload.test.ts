import { decodePayload, encodePayload } from "../payload";

test("round-trips JSON with emoji and accents through a URL-safe string", () => {
  const v = { r: "date in the Mission 💘 café", s: ["ChIJw____96GhYARCVVwg5cT7c0"], n: 3, ok: true };
  const enc = encodePayload(v);
  expect(enc).toMatch(/^[A-Za-z0-9\-_]+$/);
  expect(decodePayload(enc)).toEqual(v);
});

test("rejects broken payloads", () => {
  expect(decodePayload("@@@")).toBeNull();
  expect(decodePayload("abc")).toBeNull();
});
