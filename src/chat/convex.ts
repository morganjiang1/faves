// The Convex transport: group chats live in Convex (convex/chat.ts). One live query keeps
// everything a person can see up to date on every phone; changes go through one mutation that
// applies the same rules as the relay. Presence (who's in a chat now) comes from Convex too.
import Constants from "expo-constants";
import { ConvexClient } from "convex/browser";
import { anyApi } from "convex/server";
import { Platform } from "react-native";
import type { ChatEvent, ChatOp, Member, Snapshot } from "./reduce.mjs";
import { BaseTransport, newId, type TransportStatus } from "./transport";

// EXPO_PUBLIC_CONVEX_URL, with a local backend's 127.0.0.1 swapped for the computer's address
// when the app runs on a phone (the same host Expo Go loaded the app from).
export function convexUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (!raw) return null;
  if (Platform.OS === "web" || !/127\.0\.0\.1|localhost/.test(raw)) return raw;
  const host = (Constants.expoConfig?.hostUri ?? "").split(":")[0];
  return host ? raw.replace(/127\.0\.0\.1|localhost/, host) : raw;
}

export class ConvexTransport extends BaseTransport {
  readonly kind = "relay" as const; // a shared backend, like the relay
  readonly backend = "convex" as const;
  private client: ConvexClient;
  private me: Member | null = null;
  private onSnapshot: (s: Snapshot) => void = () => {};
  private onStatus: (s: TransportStatus) => void = () => {};
  private unsub: (() => void) | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private live = false;

  constructor(url: string) {
    super();
    this.client = new ConvexClient(url);
  }

  setSnapshotHandler(fn: (s: Snapshot) => void) { this.onSnapshot = fn; }

  async connect(me: Member, _onEvent: (e: ChatEvent) => void, onStatus: (s: TransportStatus) => void): Promise<Snapshot | null> {
    this.me = me;
    this.onStatus = onStatus;
    onStatus("connecting");
    const watchState = () => {
      const st = this.client.connectionState();
      const now = st.isWebSocketConnected;
      if (now !== this.live) { this.live = now; this.onStatus(now ? "live" : "offline"); }
    };
    this.timer = setInterval(watchState, 1500);
    try {
      await this.request({ op: "hello", member: me });
    } catch {
      this.onStatus("offline");
    }
    let first: Snapshot | null = null;
    await new Promise<void>((resolve) => {
      const done = setTimeout(resolve, 4000);
      this.unsub = this.client.onUpdate(anyApi.chat.snapshot, { userId: me.id }, (snap: Snapshot) => {
        first = first ?? snap;
        this.onSnapshot(snap);
        clearTimeout(done);
        resolve();
      });
    });
    watchState();
    return first;
  }

  get connected() { return this.live; }
  wake() { /* the Convex client reconnects by itself */ }

  close() {
    this.unsub?.();
    if (this.timer) clearInterval(this.timer);
    this.client.close();
  }

  async request(op: ChatOp): Promise<unknown> {
    if (op.op === "findUser") return this.client.query(anyApi.chat.findUser, { handle: op.handle });
    const actorId = op.op === "hello" ? op.member.id : this.me?.id;
    if (!actorId) throw new Error("offline");
    const out = (await this.client.mutation(anyApi.chat.apply, { actorId, op })) as { ok: boolean; result?: unknown; error?: string };
    if (!out.ok) throw new Error(out.error ?? "failed");
    return out.result;
  }

  // Presence: say "I'm here" every 10 s while a chat is open; returns how to stop and a way
  // to follow who's there.
  present(roomId: string, onPeople: (ids: string[]) => void): () => void {
    const sessionId = newId("s");
    let stopList: (() => void) | null = null;
    let sessionToken: string | null = null;
    const beat = async () => {
      try {
        const r = (await this.client.mutation(anyApi.presence.heartbeat, { roomId, userId: this.me?.id ?? "someone", sessionId, interval: 10_000 })) as { roomToken: string; sessionToken: string };
        sessionToken = r.sessionToken;
        if (!stopList) stopList = this.client.onUpdate(anyApi.presence.list, { roomToken: r.roomToken }, (list: { userId: string; online: boolean }[]) => onPeople(list.filter((x) => x.online).map((x) => x.userId)));
      } catch { /* offline: try again on the next beat */ }
    };
    beat();
    const t = setInterval(beat, 10_000);
    return () => {
      clearInterval(t);
      stopList?.();
      if (sessionToken) this.client.mutation(anyApi.presence.disconnect, { sessionToken }).catch(() => {});
    };
  }
}
