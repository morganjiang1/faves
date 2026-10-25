// Plans are tickets: every planned hangout or day is a paper ticket with a perforated
// tear-off stub (the date and the start time), the stops listed with their times, and who's
// in. The same ticket sits on Home, in a group chat and on top of the itinerary.
import { router } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { City } from "@/data/types";
import { fairLine } from "@/lib/fair";
import { formatLeg } from "@/lib/geo";
import { openUrl } from "@/lib/links";
import { planCost, type Plan } from "@/lib/planner";
import { formatClock, MONTHS } from "@/lib/time";
import { font, palette, shadow } from "@/theme/tokens";
import { Avatar, Icon, SampleTag } from "../ui";
import { RouteSketch } from "./RouteSketch";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MODE_WORD = { walk: "walk", transit: "transit", drive: "drive", bike: "bike" } as const;

export interface TicketPerson { id: string; name: string; answer?: "in" | "maybe" | "out" }

function stubParts(plan: Plan) {
  const d = new Date(`${plan.dateISO}T12:00:00Z`);
  const [time, ampm] = formatClock(plan.start, { compact: false }).split(" ");
  return { day: DAYS[d.getUTCDay()], date: `${MONTHS[d.getUTCMonth()].slice(0, 3).toUpperCase()} ${d.getUTCDate()}`, time, ampm: ampm ?? "" };
}

// The perforation: a dotted line with a half-circle bite at each end.
function Perforation({ bg }: { bg: string }) {
  return (
    <View style={{ width: 14, alignSelf: "stretch", alignItems: "center" }} pointerEvents="none">
      <View style={[styles.bite, { top: -7, backgroundColor: bg }]} />
      <View style={{ flex: 1, justifyContent: "space-evenly", paddingVertical: 12 }}>
        {Array.from({ length: 14 }, (_, i) => <View key={i} style={styles.hole} />)}
      </View>
      <View style={[styles.bite, { bottom: -7, backgroundColor: bg }]} />
    </View>
  );
}

export function Ticket({ plan, city, compact, people = [], sample, testID, onPress, bg = palette.paper, footer, label }: {
  plan: Plan; city: City | null; compact?: boolean; people?: TicketPerson[]; sample?: boolean; testID?: string;
  onPress?: () => void; bg?: string; footer?: ReactNode; label?: string;
}) {
  const stub = stubParts(plan);
  const places = plan.stops.map((s) => city?.byId.get(s.placeId) ?? null);
  const cost = city ? planCost(plan, city) : null;
  const shownStops = compact ? plan.stops.slice(0, 3) : plan.stops;
  const going = people.filter((p) => p.answer === "in");
  const reserve = places.filter((p) => p?.reserveUrl);
  const fair = plan.fairness;
  const open = onPress ?? (() => router.push(`/plan/${plan.id}`));
  return (
    <View testID={testID} style={[styles.ticket, shadow.card]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${plan.title}`} onPress={open} style={styles.row}>
        <View style={styles.body}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            {label ? <Text style={styles.label}>{label.toUpperCase()}</Text> : null}
            {sample ? <SampleTag /> : null}
          </View>
          <Text style={styles.title} numberOfLines={2}>{plan.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {plan.stops.length} {plan.stops.length === 1 ? "stop" : "stops"} · until {formatClock(plan.end, { compact: true })}{cost ? ` · ${cost.perPerson ? `about $${cost.perPerson} each` : "free"}` : ""}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1, gap: compact ? 6 : 8 }}>
              {shownStops.map((s, i) => {
                const p = places[i];
                return (
                  <View key={s.key}>
                    {!compact && i > 0 && s.leg ? <Text style={styles.leg}>↓ {formatLeg(s.leg)}</Text> : null}
                    <View style={styles.stop}>
                      <Text style={styles.time}>{formatClock(s.start, { compact: true })}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stopName} numberOfLines={1}>{p?.name ?? s.slot.label}</Text>
                        {!compact && p ? <Text style={styles.addr} numberOfLines={1}>{p.address ?? p.hood ?? ""}</Text> : null}
                      </View>
                    </View>
                  </View>
                );
              })}
              {compact && plan.stops.length > 3 ? <Text style={styles.more}>+ {plan.stops.length - 3} more</Text> : null}
            </View>
          </View>
          {!compact && city && places.filter(Boolean).length > 1 ? (
            <View style={styles.sketch}>
              <RouteSketch testID="ticket-sketch" stops={places.filter(Boolean) as { lat: number; lng: number }[]} starts={[]} width={220} height={86} />
            </View>
          ) : null}
          {!compact && fair?.toFirst.length ? (
            <View style={styles.fair} testID="ticket-fairness">
              <Text style={styles.fairHead}>getting to {places[0]?.name ?? "the first stop"}: {fairLine(fair)}</Text>
              <View style={styles.fairRow}>
                {fair.toFirst.map((l) => (
                  <View key={l.memberId} style={styles.fairChip}>
                    <Avatar name={l.name} size={18} />
                    <Text style={styles.fairText}>{l.name.split(/\s+/)[0]} {l.minutes} min {MODE_WORD[l.mode]}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {!compact && reserve.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {reserve.map((p) => (
                <Pressable key={p!.id} accessibilityRole="link" onPress={() => openUrl(p!.reserveUrl)} style={styles.reserve}>
                  <Icon name="calendar-outline" size={13} tint={palette.roseInk} />
                  <Text style={styles.reserveText} numberOfLines={1}>Reserve {p!.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {people.length ? (
            <View style={styles.people}>
              <View style={{ flexDirection: "row" }}>
                {(going.length ? going : people).slice(0, 5).map((p, i) => (
                  <View key={p.id} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={p.name} size={24} /></View>
                ))}
              </View>
              <Text style={styles.peopleText}>{going.length ? `${going.length} going` : `${people.length} invited`}</Text>
            </View>
          ) : null}
        </View>
        <Perforation bg={bg} />
        <View style={styles.stub}>
          <Text style={styles.stubDay}>{stub.day}</Text>
          <Text style={styles.stubDate}>{stub.date}</Text>
          <Text style={styles.stubTime}>{stub.time}</Text>
          <Text style={styles.stubAmpm}>{stub.ampm}</Text>
          <Text style={styles.stubAdmit}>admit {plan.groupSize}</Text>
        </View>
      </Pressable>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: { backgroundColor: palette.card, borderRadius: 16, borderWidth: 1, borderColor: palette.line, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "stretch" },
  body: { flex: 1, padding: 14, paddingRight: 6 },
  label: { fontFamily: font.sans, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.8, color: palette.roseInk },
  title: { fontFamily: font.display, fontSize: 19, lineHeight: 22, color: palette.ink, letterSpacing: -0.3 },
  meta: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 3 },
  stop: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  time: { fontFamily: font.displaySemi, fontSize: 13, color: palette.roseInk, width: 52, marginTop: 1 },
  stopName: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: palette.ink },
  addr: { fontFamily: font.sans, fontSize: 12, color: palette.inkMuted, marginTop: 1 },
  leg: { fontFamily: font.sans, fontSize: 11.5, color: palette.inkMuted, marginLeft: 60, marginBottom: 4 },
  more: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: palette.inkSoft, marginLeft: 60 },
  sketch: { marginTop: 10, alignItems: "center", backgroundColor: palette.paper, borderRadius: 10 },
  fair: { marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: palette.paper, gap: 6 },
  fairHead: { fontFamily: font.sans, fontSize: 12.5, fontWeight: "700", color: palette.ink },
  fairRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  fairChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.card, borderRadius: 999, paddingRight: 8, paddingLeft: 2, paddingVertical: 2, borderWidth: 1, borderColor: palette.line },
  fairText: { fontFamily: font.sans, fontSize: 12, color: palette.inkSoft },
  reserve: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.roseTint, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, maxWidth: "100%" },
  reserveText: { fontFamily: font.sans, fontSize: 12, fontWeight: "700", color: palette.roseInk },
  people: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  peopleText: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: palette.inkSoft },
  stub: { width: 82, backgroundColor: palette.sunset, alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 1 },
  stubDay: { fontFamily: font.displayHeavy, fontSize: 17, color: palette.ink, letterSpacing: 0.5 },
  stubDate: { fontFamily: font.sans, fontSize: 11, fontWeight: "800", color: palette.ink, letterSpacing: 0.6 },
  stubTime: { fontFamily: font.displayHeavy, fontSize: 26, lineHeight: 30, color: palette.ink, marginTop: 8, letterSpacing: -0.5 },
  stubAmpm: { fontFamily: font.sans, fontSize: 11, fontWeight: "800", color: palette.ink },
  stubAdmit: { fontFamily: font.sans, fontSize: 10, fontWeight: "700", color: palette.ink, opacity: 0.75, marginTop: 10, letterSpacing: 0.5 },
  bite: { position: "absolute", width: 14, height: 14, borderRadius: 7, zIndex: 2 },
  hole: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#D9C8B5" },
  footer: { borderTopWidth: 1, borderTopColor: palette.line, borderStyle: "dashed", padding: 12, gap: 10 },
});
