// The WebSocket relay transport (server/chat-server.mjs). Requests carry an id and get one
// reply; events arrive whenever anything changes in one of my groups. Reconnects on its own
// with a growing wait (1 s, 2 s, 4 s, up to 15 s).
import type { ChatEvent, ChatOp, Member, Snapshot } from "./reduce.mjs";
import { BaseTransport, newId, type TransportStatus } from "./transport";

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

export class RelayTransport extends BaseTransport {
  readonly kind = "relay" as const;
  private ws: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private me: Member | null = null;
  private onEvent: (e: ChatEvent) => void = () => {};
  private onStatus: (s: TransportStatus) => void = () => {};
  private onSnapshot: (s: Snapshot) => void = () => {};
  private retry = 0;
  private closed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private url: string, private timeoutMs = 2500) { super(); }

  setSnapshotHandler(fn: (s: Snapshot) => void) { this.onSnapshot = fn; }

  connect(me: Member, onEvent: (e: ChatEvent) => void, onStatus: (s: TransportStatus) => void): Promise<Snapshot | null> {
    this.me = me;
    this.onEvent = onEvent;
    this.onStatus = onStatus;
    this.closed = false;
    return this.open();
  }

  private open(): Promise<Snapshot | null> {
    return new Promise((resolve) => {
      let settled = false;
      const done = (snap: Snapshot | null) => { if (!settled) { settled = true; resolve(snap); } };
      this.onStatus("connecting");
      let ws: WebSocket;
      try { ws = new WebSocket(this.url); } catch { this.onStatus("offline"); this.scheduleReconnect(); done(null); return; }
      this.ws = ws;
      const giveUp = setTimeout(() => { if (ws.readyState !== 1) { try { ws.close(); } catch { /* closed */ } done(null); } }, this.timeoutMs);
      ws.onopen = async () => {
        clearTimeout(giveUp);
        this.retry = 0;
        try {
          const snap = (await this.request({ op: "hello", member: this.me! })) as Snapshot;
          this.onStatus("live");
          this.onSnapshot(snap);
          done(snap);
        } catch { done(null); }
      };
      ws.onmessage = (ev) => {
        let data: { re?: string; ok?: boolean; result?: unknown; error?: string; event?: ChatEvent };
        try { data = JSON.parse(String(ev.data)); } catch { return; }
        if (data.re) {
          const p = this.pending.get(data.re);
          if (!p) return;
          this.pending.delete(data.re);
          clearTimeout(p.timer);
          if (data.ok) p.resolve(data.result); else p.reject(new Error(data.error ?? "failed"));
        } else if (data.event) this.onEvent(data.event);
      };
      ws.onclose = () => {
        clearTimeout(giveUp);
        if (this.ws === ws) this.ws = null;
        for (const [, p] of this.pending) { clearTimeout(p.timer); p.reject(new Error("closed")); }
        this.pending.clear();
        this.onStatus("offline");
        done(null);
        this.scheduleReconnect();
      };
      ws.onerror = () => { /* onclose follows */ };
    });
  }

  private scheduleReconnect() {
    if (this.closed || this.reconnectTimer) return;
    const wait = Math.min(15_000, 1000 * 2 ** this.retry++);
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = null; if (!this.closed) this.open(); }, wait);
  }

  // Try again now (the app came back to the foreground).
  wake() {
    if (this.closed || (this.ws && this.ws.readyState <= 1)) return;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.retry = 0;
    this.open();
  }

  get connected() { return this.ws?.readyState === 1; }

  close() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try { this.ws?.close(); } catch { /* closed */ }
    this.ws = null;
  }

  request(op: ChatOp): Promise<unknown> {
    const ws = this.ws;
    if (!ws || ws.readyState !== 1) return Promise.reject(new Error("offline"));
    const id = newId("req");
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error("timeout")); }, 8000);
      this.pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, ...op }));
    });
  }
}
