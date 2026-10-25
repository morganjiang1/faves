// Moments people post at a spot, shared through Convex file storage so everyone sees them on the
// spot's postcard wall. Only when chats run on Convex; otherwise moments stay on the phone.
import { useEffect, useState } from "react";
import type { Moment } from "@/data/types";
import type { SharedMoment } from "./convex";
import { getState } from "@/state/store";
import { sharedMoments, startChat, useChat } from "./store";

const mimeFor = (uri: string, kind: "video" | "photo") =>
  kind === "photo" ? (/\.png$/i.test(uri) ? "image/png" : "image/jpeg") : /\.mov$/i.test(uri) ? "video/quicktime" : /\.webm$/i.test(uri) ? "video/webm" : "video/mp4";

export async function shareMoment(placeId: string, city: string, m: Moment): Promise<boolean> {
  const t = sharedMoments();
  if (!t || !m.uri) return false;
  try {
    await t.postMoment({ uri: m.uri, mime: mimeFor(m.uri, m.kind ?? "video"), placeId, city, kind: m.kind ?? "video", caption: m.caption, takenHere: Boolean(m.takenHere), demo: Boolean(m.demo), duration: m.duration ?? undefined });
    return true;
  } catch {
    return false;
  }
}

const toMoment = (r: SharedMoment): Moment => ({
  id: `shared-${r.id}`, source: "faves", creator: r.creator, views: 0, likes: 0, postedAt: new Date(r.postedAt).toISOString(),
  caption: r.caption, duration: r.duration, uri: r.url ?? undefined, kind: r.kind === "photo" ? "photo" : "video", takenHere: r.takenHere, demo: r.demo, mine: false,
});

// Everyone else's moments at this spot (yours are already on the phone).
export function useSharedMoments(placeId: string): Moment[] {
  const backend = useChat((v) => v.backend);
  const me = useChat((v) => v.me?.id);
  const [rows, setRows] = useState<Moment[]>([]);
  useEffect(() => {
    // A spot page can be the first screen opened (a shared link): start the chat backend.
    if (getState().profile.onboarded) startChat().catch(() => {});
  }, []);
  useEffect(() => {
    const t = sharedMoments();
    if (!t || !placeId) return;
    return t.watchPlace(placeId, (list) => setRows(list.filter((r) => r.url && r.postedBy !== me).map(toMoment)));
  }, [placeId, backend, me]);
  return rows;
}
