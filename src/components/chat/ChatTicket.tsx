// A plan ticket inside a group chat: the ticket, then who's in (In / Maybe / Out), a thumbs
// up, "swap a stop", "lock it in", add to calendar, and a nudge to re-balance when someone's
// starting point changed since the plan was made.
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { addToCalendar } from "@/chat/calendar";
import { needsRebalance, planForGroup } from "@/chat/plan";
import type { Group, Member, Rsvp, Ticket as TicketT } from "@/chat/reduce.mjs";
import { chat } from "@/chat/store";
import { apiBase, voiceStatus } from "@/chat/voice";
import { formatClock } from "@/lib/time";
import type { City } from "@/data/types";
import { alternativesFor, swapStop, type Plan } from "@/lib/planner";
import { font, palette } from "@/theme/tokens";
import { Sheet } from "../Sheet";
import { Ticket } from "../ticket/Ticket";
import { Avatar, Icon, PlaceImage } from "../ui";

const ANSWERS: { id: Rsvp; label: string; icon: "checkmark-circle" | "help-circle" | "close-circle" }[] = [
  { id: "in", label: "In", icon: "checkmark-circle" },
  { id: "maybe", label: "Maybe", icon: "help-circle" },
  { id: "out", label: "Out", icon: "close-circle" },
];

export function ChatTicket({ ticket, group, users, me, city, testID }: { ticket: TicketT; group: Group; users: Record<string, Member>; me: Member; city: City | null; testID?: string }) {
  const plan = ticket.plan as Plan;
  const [swapOpen, setSwapOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  // Stops that only book by phone: the butler can call them, after someone here confirms.
  const phoneStops = useMemo(() => (city ? plan.stops.map((s, i) => ({ s, i, p: city.byId.get(s.placeId) })).filter((x) => x.p && x.p.phone && !x.p.reserveUrl && ["food", "night", "classes"].includes(x.p.category)) : []), [plan, city]);
  const people = group.members.map((m) => ({ id: m.id, name: (users[m.id] ?? m).name, answer: ticket.rsvps[m.id] }));
  const mine = ticket.rsvps[me.id];
  const thumbs = Object.values(ticket.thumbs).filter(Boolean).length;
  const rebalance = useMemo(() => needsRebalance(plan, group, users), [plan, group, users]);
  const name = me.name.split(/\s+/)[0];

  const doRebalance = async () => {
    if (!city) return;
    const next = planForGroup(city, group, users, plan.request.raw || "something fun", { meetInMiddle: true });
    await chat.updateTicket(ticket.id, { plan: { ...next, id: plan.id } }, `${name} re-balanced the plan for everyone's starting points`);
  };

  const footer = (
    <>
      <View style={styles.answers}>
        {ANSWERS.map((a) => {
          const count = Object.values(ticket.rsvps).filter((x) => x === a.id).length;
          const on = mine === a.id;
          return (
            <Pressable key={a.id} testID={`${testID}-rsvp-${a.id}`} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => chat.rsvp(ticket.id, a.id)} style={[styles.answer, on && styles.answerOn]}>
              <Icon name={a.icon} size={16} tint={on ? palette.cream : palette.ink} />
              <Text style={[styles.answerText, on && { color: palette.cream }]}>{a.label}{count ? ` ${count}` : ""}</Text>
            </Pressable>
          );
        })}
        <Pressable testID={`${testID}-thumb`} accessibilityRole="button" accessibilityLabel="Thumbs up" onPress={() => chat.vote(ticket.id, !ticket.thumbs[me.id])} style={[styles.thumb, ticket.thumbs[me.id] && styles.answerOn]}>
          <Icon name="thumbs-up" size={15} tint={ticket.thumbs[me.id] ? palette.cream : palette.ink} />
          {thumbs ? <Text style={[styles.answerText, ticket.thumbs[me.id] && { color: palette.cream }]}>{thumbs}</Text> : null}
        </Pressable>
      </View>
      {rebalance ? (
        <Pressable testID={`${testID}-rebalance`} accessibilityRole="button" onPress={doRebalance} style={styles.rebalance}>
          <Icon name="git-compare-outline" size={16} tint={palette.lavInk} />
          <Text style={styles.rebalanceText}>Starting points changed. Re-balance for everyone?</Text>
        </Pressable>
      ) : null}
      <View style={styles.actions}>
        <Small testID={`${testID}-swap`} icon="swap-horizontal" label="Swap a stop" onPress={() => setSwapOpen(true)} />
        {ticket.status === "locked" ? (
          <Small testID={`${testID}-calendar`} icon="calendar-outline" label="Add to calendar" onPress={async () => { if (city) { const r = await addToCalendar(plan, city); setNote(r === "failed" ? "Couldn't add it. Try again." : r === "added" ? "Added to your calendar" : "Calendar file ready"); } }} />
        ) : (
          <Small testID={`${testID}-lock`} icon="lock-closed-outline" label="Lock it in" onPress={() => chat.updateTicket(ticket.id, { status: "locked" }, `${name} locked in the plan`)} />
        )}
        <Small testID={`${testID}-open`} icon="map-outline" label="Itinerary" onPress={() => router.push(`/plan/${plan.id}`)} />
        {phoneStops.length ? <Small testID={`${testID}-call`} icon="call-outline" label="Call to book" onPress={() => setCallOpen(true)} /> : null}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </>
  );

  return (
    <>
      <Ticket testID={testID} plan={plan} city={city} people={people} footer={footer} label={ticket.status === "locked" ? "locked in" : "proposed plan"} />
      {city ? <SwapSheet open={swapOpen} onClose={() => setSwapOpen(false)} plan={plan} city={city} onSwap={async (index, placeId) => {
        const before = city.byId.get(plan.stops[index].placeId)?.name ?? "a stop";
        const after = city.byId.get(placeId)?.name ?? "another spot";
        setSwapOpen(false);
        await chat.updateTicket(ticket.id, { plan: swapStop(plan, city, index, placeId) }, `${name} swapped ${before} for ${after}`);
      }} /> : null}
      {phoneStops.length ? <CallSheet open={callOpen} onClose={() => setCallOpen(false)} stops={phoneStops.map((x) => ({ name: x.p!.name, phone: x.p!.phone!, time: formatClock(x.s.start) }))} day={plan.dayLabel} party={Math.max(Object.values(ticket.rsvps).filter((a) => a === "in").length, 2)} who={name} butler={group.butlerName || "Fave"}
        onCall={async (stop) => {
          setCallOpen(false);
          const base = apiBase();
          if (!base) { setNote("Can't reach the Faves server for calls."); return; }
          try {
            const r = await fetch(`${base}/api/call`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId: group.id, placeName: stop.name, phone: stop.phone, day: plan.dayLabel, time: stop.time, partySize: Math.max(Object.values(ticket.rsvps).filter((a) => a === "in").length, 2), confirmedBy: { id: me.id, name: me.name } }) });
            const data = (await r.json()) as { error?: string; dialing?: string };
            setNote(r.ok ? `Calling ${stop.name} (${data.dialing ?? "the place"}).` : data.error ?? "The call didn't start.");
          } catch {
            setNote("Can't reach the Faves server for calls.");
          }
        }} /> : null}
    </>
  );
}

// The confirm step before the butler phones a place: who it calls, what it asks for, and that
// the voice says it's an AI. Nothing is dialed until someone taps Call now.
function CallSheet({ open, onClose, stops, day, party, who, butler, onCall }: { open: boolean; onClose: () => void; stops: { name: string; phone: string; time: string }[]; day: string; party: number; who: string; butler: string; onCall: (s: { name: string; phone: string; time: string }) => void }) {
  const [pick, setPick] = useState(0);
  const [dials, setDials] = useState<string | null>(null);
  useEffect(() => { if (open) voiceStatus().then((v) => setDials(v.dials)).catch(() => {}); }, [open]);
  const s = stops[Math.min(pick, stops.length - 1)];
  return (
    <Sheet open={open} onClose={onClose} title="Call to book?" subtitle={`${butler} makes the call`} testID="call-sheet">
      <View style={{ paddingHorizontal: 18, gap: 10, paddingBottom: 12 }}>
        {stops.length > 1 ? stops.map((x, i) => (
          <Pressable key={x.name} testID={`call-pick-${i}`} onPress={() => setPick(i)} style={[styles.sheetRow, i === pick && { borderColor: palette.rose }]}>
            <Text style={styles.callName}>{x.name}</Text><Text style={styles.callSub}>{x.time}</Text>
          </Pressable>
        )) : null}
        <Text style={styles.callBody} testID="call-what">{butler} calls {s.name}{dials === "the demo phone" ? " (in this demo it rings the demo phone)" : ` at ${s.phone}`} to book for {party} on {day} at {s.time}, under {who}. The voice says it's an AI assistant, and it never gives card details.</Text>
        <Pressable testID="call-confirm" accessibilityRole="button" onPress={() => onCall(s)} style={styles.callGo}>
          <Icon name="call" size={17} tint={palette.cream} />
          <Text style={styles.callGoText}>Call now</Text>
        </Pressable>
        <Pressable testID="call-cancel" accessibilityRole="button" onPress={onClose} style={{ alignSelf: "center", padding: 8 }}><Text style={styles.callSub}>Not now</Text></Pressable>
      </View>
    </Sheet>
  );
}

function Small({ icon, label, onPress, testID }: { icon: "swap-horizontal" | "calendar-outline" | "lock-closed-outline" | "map-outline" | "call-outline"; label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={styles.small}>
      <Icon name={icon} size={15} tint={palette.roseInk} />
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

function SwapSheet({ open, onClose, plan, city, onSwap }: { open: boolean; onClose: () => void; plan: Plan; city: City; onSwap: (index: number, placeId: string) => void }) {
  const [index, setIndex] = useState<number | null>(null);
  const alts = index == null ? [] : alternativesFor(plan, city, index, 6);
  return (
    <Sheet open={open} onClose={() => { setIndex(null); onClose(); }} title={index == null ? "Swap which stop?" : `Instead of ${city.byId.get(plan.stops[index].placeId)?.name ?? "this"}`} testID="swap-stop-sheet">
      {index == null ? plan.stops.map((s, i) => {
        const p = city.byId.get(s.placeId);
        return (
          <Pressable key={s.key} testID={`swap-pick-${i}`} onPress={() => setIndex(i)} style={styles.sheetRow}>
            <PlaceImage uri={p?.image} category={p?.category ?? "food"} style={styles.sheetThumb} />
            <Text style={styles.sheetName} numberOfLines={1}>{p?.name ?? s.slot.label}</Text>
            <Icon name="chevron-forward" size={16} tint={palette.inkMuted} />
          </Pressable>
        );
      }) : alts.map((c, i) => (
        <Pressable key={c.place.id} testID={`swap-alt-${i}`} onPress={() => onSwap(index, c.place.id)} style={styles.sheetRow}>
          <PlaceImage uri={c.place.image} category={c.place.category} style={styles.sheetThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetName} numberOfLines={1}>{c.place.name}</Text>
            <Text style={styles.sheetSub} numberOfLines={1}>{c.reasons[0] ?? c.place.hood ?? ""}</Text>
          </View>
        </Pressable>
      ))}
    </Sheet>
  );
}

export function GoingFaces({ names }: { names: string[] }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {names.slice(0, 4).map((n, i) => <View key={n + i} style={{ marginLeft: i ? -7 : 0 }}><Avatar name={n} size={20} /></View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  callName: { flex: 1, fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.ink },
  callSub: { fontFamily: font.sans, fontSize: 13.5, color: palette.inkMuted },
  callBody: { fontFamily: font.sans, fontSize: 15, lineHeight: 21, color: palette.ink },
  callGo: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: palette.roseInk, borderRadius: 14, paddingVertical: 13, marginTop: 4 },
  callGoText: { fontFamily: font.sans, fontSize: 16, fontWeight: "800", color: palette.cream },
  answers: { flexDirection: "row", gap: 6, alignItems: "center" },
  answer: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: palette.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  answerOn: { backgroundColor: palette.ink },
  answerText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.ink },
  thumb: { height: 36, minWidth: 44, borderRadius: 10, borderWidth: 1.5, borderColor: palette.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 8 },
  rebalance: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.lavTint, borderRadius: 10, padding: 10 },
  rebalanceText: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.lavInk, flex: 1 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  small: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.roseTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  smallText: { fontFamily: font.sans, fontSize: 12.5, fontWeight: "700", color: palette.roseInk },
  note: { fontFamily: font.sans, fontSize: 12.5, color: palette.inkSoft },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  sheetThumb: { width: 44, height: 44, borderRadius: 10 },
  sheetName: { flex: 1, fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: palette.ink },
  sheetSub: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted },
});
