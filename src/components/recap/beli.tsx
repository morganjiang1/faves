// Beli's rank flow, shared by the rank sheet and the day recap. Copies the frames of
// discovery/beli/beli_rank_1_how_was_it_vid.jpg, beli_rank_3/4_which_do_you_prefer_vid.jpg,
// social/beli/yt_GlMma4eXe18_t144_how_was_it_rating_sheet.png, ..._t208_which_do_you_prefer_compare.png
// and the success modal beli_rank_first_spot_modal_vid.jpg / yt_GlMma4eXe18_t146 (1.5 px/pt):
// - stacked white cards over an ~81% black scrim, 10 pt side margins, radius 17, 7 pt gaps;
// - header card: Playfair bold name ~16 pt, grey type line ~13 pt, a ✕ at the right;
// - "How was it?" bold 16 pt, three 58 pt circles 117 pt apart (#8CC3A7 / #F6CB68 /
//   #EFABAD), grey labels until picked, then black with a white check in the circle;
// - "Which do you prefer?": two 167x168 pt cards, 1 pt dark teal border, radius 7, serif
//   bold name + grey place line, the 29 pt "OR" disc (#19444A) on the 12 pt gap, then
//   "Undo" (teal arrow) / outlined "Too tough" pill 109x35 / "Skip" (teal arrow);
// - success modal: 340 pt white card, the art as in the shared EmptyState (an Ionicons
//   glyph in a teal ring on the sage blob), Playfair ~30 pt title, grey body,
//   50 pt teal pill.
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { color, font, palette } from "@/theme/tokens";
import { Icon, type IconName } from "../ui";

export const SCRIM = "rgba(0,0,0,0.81)"; // measured #302E31 over Beli's white list

export function BeliCard({ children, style, testID }: { children: ReactNode; style?: object; testID?: string }) {
  return <View testID={testID} style={[s.card, style]}>{children}</View>;
}

// Card 1: the spot (or the day) being rated.
export function HeaderCard({ title, sub, onClose, closeLabel = "Close", testID }: { title: string; sub?: string | null; onClose: () => void; closeLabel?: string; testID?: string }) {
  return (
    <BeliCard testID={testID} style={s.header}>
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle} numberOfLines={2}>{title}</Text>
        {sub ? <Text style={s.headerSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <Pressable testID={testID ? `${testID}-close` : undefined} accessibilityRole="button" accessibilityLabel={closeLabel} hitSlop={10} onPress={onClose} style={s.close}>
        <Icon name="close" size={24} tint={palette.ink} />
      </Pressable>
    </BeliCard>
  );
}

export type Sentiment3 = "great" | "ok" | "bad";
const CIRCLES: { id: Sentiment3; label: string; fill: string }[] = [
  { id: "great", label: "I liked it!", fill: color.rateGreat },
  { id: "ok", label: "It was fine", fill: color.rateOk },
  { id: "bad", label: "I didn't like it", fill: color.rateBad },
];

// Card 2: "How was it?" with the three circles.
export function HowWasIt({ value, onPick, testID = "how-was-it" }: { value: Sentiment3 | null; onPick: (s: Sentiment3) => void; testID?: string }) {
  return (
    <BeliCard testID={testID} style={{ paddingTop: 14, paddingBottom: 16 }}>
      <Text style={s.cardTitle}>How was it?</Text>
      <View style={s.circles}>
        {CIRCLES.map((c) => {
          const on = value === c.id;
          return (
            <Pressable key={c.id} testID={`rate-${c.id}`} accessibilityRole="button" accessibilityLabel={c.label} accessibilityState={{ selected: on }} onPress={() => onPick(c.id)} style={s.circleCol}>
              <View style={[s.circle, { backgroundColor: c.fill }]}>{on ? <Icon name="checkmark" size={34} tint="#fff" /> : null}</View>
              <Text style={[s.circleLabel, on && { color: palette.ink }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </BeliCard>
  );
}

export interface CompareSide { key: string; name: string; sub: string | null }

// Card 3: "Which do you prefer?".
export function CompareCard({ title = "Which do you prefer?", a, b, onPick, onUndo, onTooTough, onSkip, canUndo, testID = "compare" }: { title?: string; a: CompareSide; b: CompareSide; onPick: (key: string) => void; onUndo: () => void; onTooTough: () => void; onSkip: () => void; canUndo: boolean; testID?: string }) {
  return (
    <BeliCard testID={testID} style={{ paddingTop: 14, paddingBottom: 16 }}>
      <Text style={s.cardTitle}>{title}</Text>
      <View style={s.pair}>
        <Option side={a} onPick={onPick} testID={`${testID}-a`} />
        <Option side={b} onPick={onPick} testID={`${testID}-b`} />
        <View pointerEvents="none" style={s.or}><Text style={s.orText}>OR</Text></View>
      </View>
      <View style={s.actions}>
        <Pressable testID={`${testID}-undo`} accessibilityRole="button" accessibilityLabel="Undo" accessibilityState={{ disabled: !canUndo }} disabled={!canUndo} onPress={onUndo} style={[s.textAction, !canUndo && { opacity: 0.35 }]}>
          <Icon name="arrow-undo" size={20} tint={color.orDisc} />
          <Text style={s.textActionLabel}>Undo</Text>
        </Pressable>
        <Pressable testID={`${testID}-tough`} accessibilityRole="button" accessibilityLabel="Too tough" onPress={onTooTough} style={({ pressed }) => [s.tough, pressed && { opacity: 0.7 }]}>
          <Text style={s.toughLabel}>Too tough</Text>
        </Pressable>
        <Pressable testID={`${testID}-skip`} accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} style={s.textAction}>
          <Text style={s.textActionLabel}>Skip</Text>
          <Icon name="arrow-redo" size={20} tint={color.orDisc} />
        </Pressable>
      </View>
    </BeliCard>
  );
}

function Option({ side, onPick, testID }: { side: CompareSide; onPick: (key: string) => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`I prefer ${side.name}`} onPress={() => onPick(side.key)} style={({ pressed }) => [s.option, pressed && { backgroundColor: "#EEF5F4" }]}>
      <Text style={s.optionName} numberOfLines={3}>{side.name}</Text>
      {side.sub ? <Text style={s.optionSub} numberOfLines={2}>{side.sub}</Text> : null}
    </Pressable>
  );
}

// Beli's "Wooo! You ranked your first spot!" modal: white card, art on a sage blob,
// Playfair title, grey body, teal pill.
export function BeliModal({ open, icon, title, body, cta, onCta, secondary, onSecondary, onClose, testID = "beli-modal" }: { open: boolean; icon: IconName; title: string; body: string; cta: string; onCta: () => void; secondary?: string; onSecondary?: () => void; onClose: () => void; testID?: string }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM }]} onPress={onClose} />
        <View testID={testID} style={s.modal}>
          <View style={s.art}>
            <View style={s.blob} />
            <View style={s.artIcon}><Icon name={icon} size={64} tint={color.brand} /></View>
          </View>
          <Text style={s.modalTitle}>{title}</Text>
          <Text style={s.modalBody}>{body}</Text>
          <Pressable testID={`${testID}-cta`} accessibilityRole="button" onPress={onCta} style={({ pressed }) => [s.modalCta, pressed && { opacity: 0.8 }]}>
            <Text style={s.modalCtaLabel}>{cta}</Text>
          </Pressable>
          {secondary && onSecondary ? (
            <Pressable testID={`${testID}-secondary`} accessibilityRole="button" hitSlop={8} onPress={onSecondary} style={{ marginTop: 14 }}>
              <Text style={s.modalSecondary}>{secondary}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: palette.card, borderRadius: 17, marginHorizontal: 10, marginBottom: 7, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", paddingLeft: 20, paddingRight: 12, paddingVertical: 10, minHeight: 55 },
  headerTitle: { fontFamily: font.serif, fontSize: 17, lineHeight: 21, color: palette.ink },
  headerSub: { fontFamily: font.sans, fontSize: 13, lineHeight: 17, fontWeight: "600", color: color.textMuted, marginTop: 1 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: font.sans, fontSize: 16, lineHeight: 20, fontWeight: "700", color: palette.ink, textAlign: "center" },
  circles: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  circleCol: { width: 117, alignItems: "center" },
  circle: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  circleLabel: { fontFamily: font.sans, fontSize: 15, lineHeight: 19, color: palette.inkMuted, marginTop: 9 },
  pair: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 18, paddingHorizontal: 12 },
  option: { flex: 1, maxWidth: 168, aspectRatio: 1, borderRadius: 7, borderWidth: 1, borderColor: color.orDisc, backgroundColor: palette.paper, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  optionName: { fontFamily: font.serif, fontSize: 16, lineHeight: 20, color: palette.ink, textAlign: "center" },
  optionSub: { fontFamily: font.sans, fontSize: 13, lineHeight: 17, color: palette.ink, textAlign: "center", marginTop: 4 },
  or: { position: "absolute", alignSelf: "center", top: "50%", marginTop: -14.5, width: 29, height: 29, borderRadius: 14.5, backgroundColor: color.orDisc, alignItems: "center", justifyContent: "center" },
  orText: { fontFamily: font.sans, color: "#fff", fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 26, paddingHorizontal: 24 },
  textAction: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 70, height: 35 },
  textActionLabel: { fontFamily: font.sans, fontSize: 15, color: color.orDisc, letterSpacing: 0.5 },
  tough: { width: 109, height: 35, borderRadius: 8, borderWidth: 1, borderColor: color.orDisc, alignItems: "center", justifyContent: "center" },
  toughLabel: { fontFamily: font.sans, fontSize: 15, color: color.orDisc, letterSpacing: 0.5 },
  modalWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 26 },
  modal: { width: "100%", maxWidth: 340, backgroundColor: palette.card, borderRadius: 7, alignItems: "center", paddingHorizontal: 24, paddingBottom: 32, overflow: "hidden" },
  art: { width: "120%", height: 230, alignItems: "center", justifyContent: "center" },
  blob: { position: "absolute", width: "100%", height: 170, top: 30, borderRadius: 90, backgroundColor: color.sage, transform: [{ rotate: "-8deg" }] },
  artIcon: { width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: color.brand, backgroundColor: palette.card, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontFamily: font.serif, fontSize: 30, lineHeight: 38, color: palette.ink, textAlign: "center" },
  modalBody: { fontFamily: font.sans, fontSize: 17, lineHeight: 22, color: color.emptyBody, textAlign: "center", marginTop: 10 },
  modalCta: { alignSelf: "stretch", height: 50, borderRadius: 25, backgroundColor: color.brand, alignItems: "center", justifyContent: "center", marginTop: 26 },
  modalCtaLabel: { fontFamily: font.sans, color: "#fff", fontSize: 18, fontWeight: "600" },
  modalSecondary: { fontFamily: font.sans, color: color.brand, fontSize: 16, fontWeight: "600" },
});
