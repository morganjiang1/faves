// A plan ticket inside a group chat: the ticket, then In / Maybe / Out, "Lock it in" (or
// "Add to calendar" once it's locked) and a "..." for the rest (swap a stop, the full day).
// Option tickets carry a thumbs up for the vote. A nudge to re-balance shows when someone's
// starting point changed since the plan was made.
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { addToCalendar } from "@/chat/calendar";
import { needsRebalance, planForGroup } from "@/chat/plan";
import type { Group, Member, Rsvp, Ticket as TicketT } from "@/chat/reduce.mjs";
import { chat } from "@/chat/store";
import type { City } from "@/data/types";
import { alternativesFor, swapStop, type Plan } from "@/lib/planner";
import { font, palette } from "@/theme/tokens";
import { Sheet } from "../Sheet";
import { Ticket } from "../ticket/Ticket";
import { Avatar, Icon, MenuRow, PlaceImage } from "../ui";

const ANSWERS: { id: Rsvp; label: string; icon: "checkmark-circle" | "help-circle" | "close-circle" }[] = [
  { id: "in", label: "In", icon: "checkmark-circle" },
  { id: "maybe", label: "Maybe", icon: "help-circle" },
  { id: "out", label: "Out", icon: "close-circle" },
];

export function ChatTicket({ ticket, group, users, me, city, testID }: { ticket: TicketT; group: Group; users: Record<string, Member>; me: Member; city: City | null; testID?: string }) {
  const plan = ticket.plan as Plan;
  const [swapOpen, setSwapOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const people = group.members.map((m) => ({ id: m.id, name: (users[m.id] ?? m).name, answer: ticket.rsvps[m.id] }));
  const mine = ticket.rsvps[me.id];
  const thumbs = Object.values(ticket.thumbs).filter(Boolean).length;
  // The thumbs up is for voting between options, so it shows on option tickets (or once used).
  const voting = /^Option [A-Z]:/.test(plan.title) || thumbs > 0;
  const rebalance = useMemo(() => needsRebalance(plan, group, users), [plan, group, users]);
  const name = me.name.split(/\s+/)[0];

  const addCal = async () => { if (city) { const r = await addToCalendar(plan, city); setNote(r === "failed" ? "Couldn't add it. Try again." : r === "added" ? "Added to your calendar" : "Calendar file ready"); } };
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
        {voting ? (
          <Pressable testID={`${testID}-thumb`} accessibilityRole="button" accessibilityLabel="Thumbs up" onPress={() => chat.vote(ticket.id, !ticket.thumbs[me.id])} style={[styles.thumb, ticket.thumbs[me.id] && styles.answerOn]}>
            <Icon name="thumbs-up" size={15} tint={ticket.thumbs[me.id] ? palette.cream : palette.ink} />
            {thumbs ? <Text style={[styles.answerText, ticket.thumbs[me.id] && { color: palette.cream }]}>{thumbs}</Text> : null}
          </Pressable>
        ) : null}
      </View>
      {rebalance ? (
        <Pressable testID={`${testID}-rebalance`} accessibilityRole="button" onPress={doRebalance} style={styles.rebalance}>
          <Icon name="git-compare-outline" size={16} tint={palette.lavInk} />
          <Text style={styles.rebalanceText}>Starting points changed. Re-balance?</Text>
        </Pressable>
      ) : null}
      <View style={styles.actions}>
        {ticket.status === "locked" ? (
          <Small testID={`${testID}-calendar`} icon="calendar-outline" label="Add to calendar" onPress={addCal} />
        ) : (
          <Small testID={`${testID}-lock`} icon="lock-closed-outline" label="Lock it in" onPress={() => chat.updateTicket(ticket.id, { status: "locked" }, `${name} locked in the plan`)} />
        )}
        {note ? <Text style={styles.note} numberOfLines={1}>{note}</Text> : <View style={{ flex: 1 }} />}
        <Pressable testID={`${testID}-more`} accessibilityRole="button" accessibilityLabel="Plan options" hitSlop={6} onPress={() => setMoreOpen(true)} style={styles.more}>
          <Icon name="ellipsis-horizontal" size={18} tint={palette.ink} />
        </Pressable>
      </View>
    </>
  );

  return (
    <>
      <Ticket testID={testID} plan={plan} city={city} people={people} footer={footer} label={ticket.status === "locked" ? "locked in" : "proposed plan"} />
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Plan options" testID="plan-options">
        <MenuRow testID={`${testID}-swap`} icon="swap-horizontal" label="Swap a stop" onPress={() => { setMoreOpen(false); setSwapOpen(true); }} />
        <MenuRow testID={`${testID}-itinerary`} icon="map-outline" label="See the full day" sub="Map, travel times, Plan B" onPress={() => { setMoreOpen(false); router.push(`/plan/${plan.id}`); }} />
      </Sheet>
      {city ? <SwapSheet open={swapOpen} onClose={() => setSwapOpen(false)} plan={plan} city={city} onSwap={async (index, placeId) => {
        const before = city.byId.get(plan.stops[index].placeId)?.name ?? "a stop";
        const after = city.byId.get(placeId)?.name ?? "another spot";
        setSwapOpen(false);
        await chat.updateTicket(ticket.id, { plan: swapStop(plan, city, index, placeId) }, `${name} swapped ${before} for ${after}`);
      }} /> : null}
    </>
  );
}

function Small({ icon, label, onPress, testID }: { icon: "calendar-outline" | "lock-closed-outline"; label: string; onPress: () => void; testID?: string }) {
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
  answers: { flexDirection: "row", gap: 6, alignItems: "center" },
  answer: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: palette.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  answerOn: { backgroundColor: palette.ink },
  answerText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.ink },
  thumb: { height: 40, minWidth: 44, borderRadius: 10, borderWidth: 1.5, borderColor: palette.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 8 },
  rebalance: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.lavTint, borderRadius: 10, padding: 10 },
  rebalanceText: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.lavInk, flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  small: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.roseTint, borderRadius: 999, paddingHorizontal: 14, height: 36 },
  smallText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.roseInk },
  more: { width: 40, height: 36, borderRadius: 18, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  note: { flex: 1, fontFamily: font.sans, fontSize: 12.5, color: palette.inkSoft },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  sheetThumb: { width: 44, height: 44, borderRadius: 10 },
  sheetName: { flex: 1, fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: palette.ink },
  sheetSub: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted },
});
