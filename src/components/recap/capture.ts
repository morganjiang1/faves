// Web: no image capture (it would need an extra canvas library). Use the browser's own share
// sheet with the text and the link when there is one; otherwise the caller opens our
// Partiful-style share sheet with the link.
import type { RefObject } from "react";

export type ShareResult = "shared" | "sheet" | "error";

export async function shareCardImage(_ref: RefObject<unknown>, info: { title: string; text: string; url: string }): Promise<ShareResult> {
  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : null;
  if (!nav?.share) return "sheet";
  try {
    await nav.share({ title: info.title, text: info.text, url: info.url });
    return "shared";
  } catch (e) {
    // Closing the browser's sheet is not an error.
    return e instanceof Error && e.name === "AbortError" ? "shared" : "sheet";
  }
}
