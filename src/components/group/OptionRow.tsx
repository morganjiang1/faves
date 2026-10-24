// One stop's options as Partiful's "Find a Time" cards (plans/partiful/appstore_10_find_a_time_poll_responses.png,
// 2.44 px/pt): a horizontal scroll where the focused card is ~220x117 pt, white, radius ~6,
// a 2-line title (~20 pt semibold black) and the tally "3 Going · 1 Maybe" in #666666
// (~17 pt); the cards beside it are ~163x98 pt, #F1F7F7, 10 pt away, peeking in from the edges.
import { useRef, useState, type ComponentRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Icon } from "@/components/ui";
import { tally, tallyLine } from "@/lib/group";
import type { Group } from "@/state/store";
import { color, font } from "@/theme/tokens";

const FW = 220, FH = 117, SW = 163, SH = 98, GAP = 10, SLOT = FW + GAP;

export interface OptionInfo { name: string; sub: string | null }

export function OptionRow({ group, stop, label, options, info, onOpen, testID }: { group: Group; stop: number; label: string; options: Group["options"]; info: (placeId: string) => OptionInfo; onOpen: (key: string) => void; testID: string }) {
  const { width } = useWindowDimensions();
  const W = Math.min(width, 520);
  const pad = (W - FW) / 2;
  const [focus, setFocus] = useState(0);
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(options.length - 1, Math.round(e.nativeEvent.contentOffset.x / SLOT)));
    if (i !== focus) setFocus(i);
  };
  return (
    <View testID={testID}>
      <Text style={s.rowLabel}>STOP {stop + 1} · {label.toUpperCase()}</Text>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLOT}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingLeft: pad, paddingRight: pad - GAP }}
      >
        {options.map((o, i) => {
          const on = i === focus;
          const t = tally(group, o.key);
          const meta = info(o.placeId);
          const picked = group.picked.includes(o.key);
          return (
            <View key={o.key} style={{ width: SLOT, paddingRight: GAP, height: FH, justifyContent: "center", alignItems: on ? "stretch" : i < focus ? "flex-end" : "flex-start" }}>
              <Pressable
                testID={`${testID}-opt-${i}`}
                accessibilityRole="button"
                accessibilityLabel={on ? `Vote on ${meta.name}` : `Show ${meta.name}`}
                onPress={() => {
                  if (on) return onOpen(o.key);
                  setFocus(i);
                  ref.current?.scrollTo({ x: i * SLOT, animated: true });
                }}
                style={({ pressed }) => [on ? s.focused : s.side, pressed && { opacity: 0.85 }]}
              >
                <Text style={on ? s.title : s.sideTitle} numberOfLines={1}>{meta.name}</Text>
                {meta.sub ? <Text style={on ? s.title : s.sideTitle} numberOfLines={1}>{meta.sub}</Text> : null}
                <View style={s.tallyRow}>
                  {picked ? <Icon name="checkmark-circle" size={on ? 17 : 14} tint={color.open} /> : null}
                  <Text style={on ? s.tally : s.sideTally} numberOfLines={1}>{picked ? "Picked · " : ""}{tallyLine(t)}</Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  rowLabel: { fontFamily: font.sans, color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textAlign: "center", marginTop: 16, marginBottom: 8 },
  focused: { width: FW, height: FH, borderRadius: 6, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  side: { width: SW, height: SH, borderRadius: 6, backgroundColor: color.partifulSide, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  title: { fontFamily: font.sans, fontSize: 19, lineHeight: 24, fontWeight: "600", color: "#000", textAlign: "center" },
  sideTitle: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, fontWeight: "600", color: "#000", textAlign: "center" },
  tallyRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  tally: { fontFamily: font.sans, fontSize: 16, color: color.pollText },
  sideTally: { fontFamily: font.sans, fontSize: 13, color: color.pollText },
});
