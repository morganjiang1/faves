// This phone only: the same rules as the relay (reduce.mjs), applied on the phone, with the
// phone's clock. Used when no relay is reachable, so a chat still works (and says so).
import { applyOp, snapshotFor, type ChatEvent, type ChatOp, type ChatState, type Member, type Snapshot } from "./reduce.mjs";
import { BaseTransport, type TransportStatus } from "./transport";

export class LocalTransport extends BaseTransport {
  readonly kind = "local" as const;
  private me: Member | null = null;
  private onEvent: (e: ChatEvent) => void = () => {};

  // `state` is a working are inspired by the phone keeps of everything it knows.
  constructor(private state: () => ChatState) { super(); }

  async connect(me: Member, onEvent: (e: ChatEvent) => void, onStatus: (s: TransportStatus) => void): Promise<Snapshot | null> {
    this.me = me;
    this.onEvent = onEvent;
    onStatus("offline");
    return snapshotFor(this.state(), me.id);
  }

  close() {}

  async request(op: ChatOp): Promise<unknown> {
    if (!this.me) throw new Error("not connected");
    const st = this.state();
    if (op.op === "hello") st.users[op.member.id] = op.member;
    const { events, result, error } = applyOp(st, op, { now: Date.now(), actorId: this.me.id });
    if (error) throw new Error(error);
    for (const e of events) this.onEvent(e);
    return result;
  }
}
