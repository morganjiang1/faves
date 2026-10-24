// The vote input, copied from Partiful's RSVP sheet (plans/partiful/ios_video_rsvp_sheet_going_maybe_cant.png,
// 1.27 px/pt, and the dark version ios_video_rsvp_sheet_dark.png for the emoji 👍 🤔 😢):
// sheet #F0F4EC fading to #FBFBF9, "Cancel" top-left (#21271A), three ~96 pt choice circles
// with the emoji over a ~13 pt label (the picked one gets a ring and the green #CAFFC9
// center; Maybe #E5F9FF, Can't Go #ECFAFF), the 47 pt "RSVPING AS <name> ✎" band (caps
// label #575D51), and a full-width 46 pt black (#040005) "Continue", radius ~3.
// Partiful's attendee count, comment and GIF fields are left out: a vote is one tap.
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Icon } from "@/components/ui";
import type { Vote } from "@/lib/group";
import { font, shadow } from "@/theme/tokens";

// Each circle is a soft pastel, like Partiful's radial gradients (sampled centers).
const CHOICES: { id: Vote; emoji: string; label: string; fill: [string, string] }[] = [
  { id: "going", emoji: "👍", label: "Going", fill: ["#CAFFC9", "#E2F5D8"] },
  { id: "maybe", emoji: "🤔", label: "Maybe", fill: ["#E5F9FF", "#EAF6DE"] },
  { id: "cant", emoji: "😢", label: "Can't Go", fill: ["#B7E8F7", "#ECFAFF"] },
];

export function RsvpSheet({ open, title, sub, current, name, isHost, picked, onClose, onSubmit, onPick }: { open: boolean; title: string; sub: string | null; current: Vote | null; name: string; isHost: boolean; picked: boolean; onClose: () => void; onSubmit: (vote: Vote, name: string) => void; onPick?: () => void }) {
  const insets = useSafeAreaInsets();
  const [vote, setVote] = useState<Vote | null>(current);
  const [who, setWho] = useState(name);
  const [editing, setEditing] = useState(!name);
  useEffect(() => {
    if (!open) return;
    setVote(current);
    setWho(name);
    setEditing(!name);
  }, [open, current, name]);
  const ready = Boolean(vote && who.trim());
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.wrap}>
        <View testID="rsvp-sheet" style={[s.sheet, { paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <LinearGradient colors={["#F0F4EC", "#FBFBF9"]} style={StyleSheet.absoluteFill} />
          <Pressable testID="rsvp-cancel" accessibilityRole="button" hitSlop={10} onPress={onClose} style={{ alignSelf: "flex-start" }}>
            <Text style={s.cancel}>Cancel</Text>
          </Pressable>
          <Text style={s.title} numberOfLines={2}>{title}</Text>
          {sub ? <Text style={s.sub} numberOfLines={1}>{sub}</Text> : null}
          <View style={s.choices}>
            {CHOICES.map((c) => {
              const on = vote === c.id;
              return (
                <Pressable key={c.id} testID={`rsvp-${c.id}`} accessibilityRole="button" accessibilityLabel={c.label} accessibilityState={{ selected: on }} onPress={() => setVote(c.id)} style={[s.ring, on && s.ringOn]}>
                  <View style={[s.circle, shadow.soft]}>
                    <LinearGradient colors={c.fill} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
                    <Text style={s.emoji}>{c.emoji}</Text>
                    <Text style={s.choiceLabel}>{c.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={s.asRow}>
            <Text style={s.asLabel}>VOTING AS</Text>
            {editing ? (
              <TextInput testID="rsvp-name" accessibilityLabel="Your first name" autoFocus={!name} value={who} onChangeText={setWho} placeholder="Your first name" placeholderTextColor="#8A9086" maxLength={24} autoCapitalize="words" style={s.nameInput} returnKeyType="done" onSubmitEditing={() => who.trim() && setEditing(false)} />
            ) : (
              <>
                <Avatar name={who} size={28} tint="#7A8F6E" />
                <Text style={s.name} numberOfLines={1}>{who}</Text>
                <Pressable testID="rsvp-edit-name" accessibilityRole="button" accessibilityLabel="Change your name" hitSlop={10} onPress={() => setEditing(true)}>
                  <Icon name="pencil" size={18} tint="#000" />
                </Pressable>
              </>
            )}
          </View>
          <View style={{ flex: 1 }} />
          {isHost && onPick ? (
            <Pressable testID="rsvp-pick" accessibilityRole="button" disabled={picked} onPress={onPick} style={({ pressed }) => [s.pick, picked && { opacity: 0.5 }, pressed && { opacity: 0.7 }]}>
              <Text style={s.pickLabel}>{picked ? "Picked for the plan" : "Pick this for the plan"}</Text>
            </Pressable>
          ) : null}
          <Pressable testID="rsvp-continue" accessibilityRole="button" accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={() => vote && onSubmit(vote, who.trim())} style={({ pressed }) => [s.cta, !ready && { backgroundColor: "#68686B" }, pressed && { opacity: 0.85 }]}>
            <Text style={s.ctaLabel}>Continue</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center" },
  sheet: { flex: 1, width: "100%", maxWidth: Platform.OS === "web" ? 520 : undefined, marginTop: 24, borderTopLeftRadius: 14, borderTopRightRadius: 14, overflow: "hidden", paddingHorizontal: 16 },
  cancel: { fontFamily: font.sans, fontSize: 17, color: "#21271A" },
  title: { fontFamily: font.sans, fontSize: 22, lineHeight: 28, fontWeight: "700", color: "#21271A", marginTop: 18 },
  sub: { fontFamily: font.sans, fontSize: 15, color: "#575D51", marginTop: 2 },
  choices: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  ring: { width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  ringOn: { borderColor: "rgba(33,39,26,0.25)", backgroundColor: "rgba(255,255,255,0.6)" },
  circle: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" },
  emoji: { fontSize: 32, lineHeight: 38 },
  choiceLabel: { fontFamily: font.sans, fontSize: 13, color: "#21271A", marginTop: 2 },
  asRow: { flexDirection: "row", alignItems: "center", gap: 10, height: 47, borderRadius: 3, backgroundColor: "rgba(33,39,26,0.06)", paddingHorizontal: 12, marginTop: 24 },
  asLabel: { fontFamily: font.sans, fontSize: 14, color: "#575D51", letterSpacing: 0.4 },
  name: { flex: 1, fontFamily: font.sans, fontSize: 18, color: "#21271A" },
  nameInput: { flex: 1, fontFamily: font.sans, fontSize: 18, color: "#21271A", height: 40 },
  pick: { height: 46, borderRadius: 3, borderWidth: 1, borderColor: "#21271A", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  pickLabel: { fontFamily: font.sans, fontSize: 17, fontWeight: "600", color: "#21271A" },
  cta: { height: 46, borderRadius: 3, backgroundColor: "#040005", alignItems: "center", justifyContent: "center" },
  ctaLabel: { fontFamily: font.sans, fontSize: 17, fontWeight: "600", color: "#fff" },
});
