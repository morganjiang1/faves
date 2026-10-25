// New group: a name, an emoji sticker, and the people (by username, or invite them with a
// link once the group exists). Sample friends are there for trying it alone, labeled sample.
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chat, SAMPLE_FRIENDS, useChat, type Member } from "@/chat/store";
import { Avatar, Icon, PrimaryButton, SampleTag } from "@/components/ui";
import { useStore } from "@/state/store";
import { font, palette } from "@/theme/tokens";

export const EMOJIS = ["🌉", "🍜", "🎾", "🌅", "🍸", "🎳", "🧋", "🏖️", "🎶", "🌮", "🧗", "💗"];

export default function NewGroup() {
  const insets = useSafeAreaInsets();
  const city = useStore((s) => s.profile.city);
  const status = useChat((v) => v.status);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [handle, setHandle] = useState("");
  const [people, setPeople] = useState<Member[]>([]);
  const [lookup, setLookup] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const find = async () => {
    const h = handle.trim();
    if (!h) return;
    setLookup("Looking…");
    const m = await chat.findUser(h);
    if (m) { if (!people.some((p) => p.id === m.id)) setPeople((p) => [...p, m]); setHandle(""); setLookup(null); }
    else setLookup(status === "live" ? `No one called @${h.replace(/^@/, "")} yet. Make the group, then send them the invite link.` : "Finding people needs the connection. Make the group and share its invite link instead.");
  };
  const toggleSamples = () => setPeople((p) => (p.some((m) => m.sample) ? p.filter((m) => !m.sample) : [...p, ...SAMPLE_FRIENDS]));
  const create = async () => {
    setBusy(true);
    try {
      const g = await chat.createGroup({ name: name || "Hangout crew", emoji, members: people, city });
      router.replace(`/chat/${g.id}`);
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} testID="new-group">
      <View style={[styles.top, { paddingTop: Platform.OS === "ios" ? 14 : insets.top + 10 }]}>
        <Pressable testID="new-group-close" accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={() => (router.canGoBack() ? router.back() : router.replace("/chats"))}><Icon name="close" size={24} tint={palette.ink} /></Pressable>
        <Text style={styles.topTitle}>new group</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.nameRow}>
          <View style={styles.sticker}><Text style={{ fontSize: 34 }}>{emoji}</Text></View>
          <TextInput testID="group-name" value={name} onChangeText={setName} placeholder="Name it (Saturday crew)" placeholderTextColor={palette.inkMuted} style={styles.nameInput} maxLength={40} />
        </View>
        <View style={styles.emojis}>
          {EMOJIS.map((e) => (
            <Pressable key={e} testID={`emoji-${e}`} accessibilityRole="button" accessibilityState={{ selected: emoji === e }} onPress={() => setEmoji(e)} style={[styles.emoji, emoji === e && styles.emojiOn]}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 10 }}>
          <Text style={styles.label}>ADD PEOPLE</Text>
          <View style={styles.addRow}>
            <TextInput testID="add-handle" value={handle} onChangeText={setHandle} placeholder="@username" placeholderTextColor={palette.inkMuted} autoCapitalize="none" autoCorrect={false} style={styles.handleInput} onSubmitEditing={find} returnKeyType="search" />
            <Pressable testID="add-handle-go" accessibilityRole="button" onPress={find} style={styles.addGo}><Text style={styles.addGoText}>Add</Text></Pressable>
          </View>
          {lookup ? <Text style={styles.hint}>{lookup}</Text> : null}
          {people.map((m) => (
            <View key={m.id} style={styles.person}>
              <Avatar name={m.name} size={34} />
              <View style={{ flex: 1 }}><Text style={styles.personName}>{m.name}</Text><Text style={styles.hint}>@{m.handle}</Text></View>
              {m.sample ? <SampleTag /> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${m.name}`} hitSlop={8} onPress={() => setPeople((p) => p.filter((x) => x.id !== m.id))}><Icon name="close-circle" size={20} tint={palette.inkMuted} /></Pressable>
            </View>
          ))}
          <Pressable testID="add-samples" accessibilityRole="button" onPress={toggleSamples} style={styles.samples}>
            <Icon name={people.some((m) => m.sample) ? "checkbox" : "square-outline"} size={20} tint={palette.ink} />
            <Text style={styles.samplesText}>Add three sample friends to try it alone</Text>
          </Pressable>
          <Text style={styles.hint}>You'll get an invite link and a QR code for everyone else once the group exists.</Text>
        </View>
        <PrimaryButton testID="create-group" label="Make the group" icon="chatbubbles" loading={busy} onPress={create} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  topTitle: { fontFamily: font.display, fontSize: 19, color: palette.ink },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  sticker: { width: 66, height: 66, borderRadius: 18, backgroundColor: palette.card, borderWidth: 2, borderStyle: "dashed", borderColor: palette.rose, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] },
  nameInput: { flex: 1, height: 52, borderRadius: 14, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, fontFamily: font.sans, fontSize: 18, fontWeight: "600", color: palette.ink },
  emojis: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emoji: { width: 46, height: 46, borderRadius: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  emojiOn: { borderColor: palette.roseInk, borderWidth: 2, backgroundColor: palette.roseTint },
  label: { fontFamily: font.sans, fontSize: 11.5, fontWeight: "800", letterSpacing: 0.8, color: palette.inkMuted },
  addRow: { flexDirection: "row", gap: 8 },
  handleInput: { flex: 1, height: 46, borderRadius: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, fontFamily: font.sans, fontSize: 16, color: palette.ink },
  addGo: { height: 46, borderRadius: 12, backgroundColor: palette.ink, paddingHorizontal: 18, justifyContent: "center" },
  addGoText: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.cream },
  hint: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted },
  person: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: palette.line },
  personName: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.ink },
  samples: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  samplesText: { fontFamily: font.sans, fontSize: 14, color: palette.ink },
});
