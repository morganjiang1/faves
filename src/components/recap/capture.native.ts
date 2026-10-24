// iPhone: capture the share card as a PNG (react-native-view-shot) and hand it to the
// system share sheet (expo-sharing), the way Spotify's Wrapped "Share" button does.
import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import { captureRef } from "react-native-view-shot";

export type ShareResult = "shared" | "sheet" | "error";

export async function shareCardImage(ref: RefObject<unknown>, info: { title: string; text: string; url: string }): Promise<ShareResult> {
  try {
    if (!ref.current || !(await Sharing.isAvailableAsync())) return "sheet";
    const uri = await captureRef(ref as never, { format: "png", quality: 1, result: "tmpfile" });
    await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: info.title });
    return "shared";
  } catch {
    return "error";
  }
}
