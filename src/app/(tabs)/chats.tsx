// Chats: your group chats, newest first, each with its last message and, when a plan is
// locked in, a little ticket stub for the next hangout.
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { plainText } from "@/lib/linktext";
import type { Plan } from "@/lib/planner";
import { chat, SAMPLE_FRIENDS, unreadCount, useChat, type ChatView, type Group } from "@/chat/store";
import { EmptyState, Icon, SampleTag } from "@/components/ui";
import { formatClock, startsAt } from "@/lib/time";
import { useStore } from "@/state/store";
import { font, palette } from "@/theme/tokens";

function ago(ts: number): string {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function Chats() {
  const insets = useSafeAreaInsets();
  const v = useChat((x) => x);
  const city = useStore((s) => s.profile.city);
  const [code, setCode] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const groups = useMemo(() => Object.values(v.data.groups).sort((a, b) => lastAt(v, b) - lastAt(v, a)), [v]);

  const join = async () => {
    setJoinError(null);
    const g = await chat.join(code);
    if (g) { setCode(""); setJoinOpen(false); router.push(`/chat/${g.id}`); }
    else setJoinError(v.status === "live" ? "No group with that code." : "Offline. Try again in a moment.");
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]} testID="chats-screen">
      <View style={styles.head}>
        <Text style={styles.title}>chats</Text>
        <Pressable testID="chats-join" accessibilityRole="button" accessibilityLabel="Join with a code" onPress={() => setJoinOpen((o) => !o)} style={styles.headButton}>
          <Icon name="qr-code-outline" size={18} tint={palette.ink} />
        </Pressable>
        <Pressable testID="chats-new" accessibilityRole="button" onPress={() => router.push("/chat/new")} style={[styles.headButton, styles.newButton]}>
          <Icon name="add" size={20} tint={palette.cream} />
          <Text style={styles.newText}>New group</Text>
        </Pressable>
      </View>
      {joinOpen ? (
        <View style={styles.join}>
          <TextInput testID="join-code" value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="Invite code, like K7MPQ2" placeholderTextColor={palette.inkMuted} autoCapitalize="characters" style={styles.joinInput} onSubmitEditing={join} />
          <Pressable testID="join-go" accessibilityRole="button" onPress={join} style={styles.joinGo}><Text style={styles.joinGoText}>Join</Text></Pressable>
        </View>
      ) : null}
      {joinError ? <Text style={styles.error}>{joinError}</Text> : null}
      {v.hydrated && v.status !== "live" ? (
        <Text style={styles.status} testID="chats-local">{v.status === "connecting" ? "Connecting…" : "Offline. Chats sync when you're back."}</Text>
      ) : null}
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, gap: 10, flexGrow: groups.length ? 0 : 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: "center" }}>
            <EmptyState testID="chats-empty" icon="chatbubbles-outline" title="Plan it together" body="Make a group and the agent plans it with you, fair for everyone."
              cta="New group" onCta={() => router.push("/chat/new")} secondary="Try it with sample friends" onSecondary={async () => {
                const g = await chat.createGroup({ name: "Weekend crew", emoji: "🌉", members: SAMPLE_FRIENDS, city });
                router.push(`/chat/${g.id}`);
              }} />
          </View>
        }
        renderItem={({ item, index }) => <Row g={item} index={index} />}
      />
    </View>
  );
}

function lastAt(v: ChatView, g: Group) {
  const list = v.data.messages[g.id];
  return list?.[list.length - 1]?.createdAt ?? g.updatedAt ?? 0;
}

function Row({ g, index }: { g: Group; index: number }) {
  const v = useChat((x) => x);
  const list = v.data.messages[g.id] ?? [];
  const last = [...list].reverse().find((m) => m.kind !== "note") ?? list[list.length - 1];
  const unread = v.muted[g.id] ? 0 : unreadCount(v, g.id);
  const locked = Object.values(v.data.tickets).filter((t) => t.groupId === g.id && t.status === "locked").map((t) => t.plan as Plan).sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];
  const preview = !last ? "Say hi" : last.kind === "ticket" ? `${last.authorName.split(" ")[0]} planned something` : last.kind === "postcard" ? `${last.authorName.split(" ")[0]} sent a spot` : plainText(last.text ?? "");
  const hasSample = g.members.some((m) => m.sample);
  return (
    <Pressable testID={`chat-row-${index}`} accessibilityRole="button" onPress={() => router.push(`/chat/${g.id}`)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={[styles.sticker, { transform: [{ rotate: `${index % 2 ? 5 : -5}deg` }] }]}><Text style={{ fontSize: 24 }}>{g.emoji}</Text></View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.name} numberOfLines={1}>{g.name}</Text>
          {hasSample ? <SampleTag /> : null}
          {v.muted[g.id] ? <Icon name="notifications-off-outline" size={13} tint={palette.inkMuted} /> : null}
        </View>
        <Text style={[styles.preview, unread > 0 && { color: palette.ink, fontWeight: "700" }]} numberOfLines={1}>{preview}</Text>
        {locked ? (
          <View style={styles.stub}><Icon name="ticket" size={12} tint={palette.ink} /><Text style={styles.stubText} numberOfLines={1}>{locked.dayLabel.split(",")[0].slice(0, 3)} {formatClock(startsAt(locked), { compact: true })} · {locked.title}</Text></View>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        {last ? <Text style={styles.time}>{ago(last.createdAt)}</Text> : null}
        {unread ? <View style={styles.unread}><Text style={styles.unreadText}>{unread}</Text></View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  head: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
  title: { flex: 1, fontFamily: font.displayHeavy, fontSize: 34, color: palette.ink, letterSpacing: -0.8 },
  headButton: { height: 44, minWidth: 44, borderRadius: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 4, paddingHorizontal: 10 },
  newButton: { backgroundColor: palette.roseInk, borderColor: palette.roseInk },
  newText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.cream },
  join: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  joinInput: { flex: 1, height: 44, borderRadius: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, fontFamily: font.sans, fontSize: 16, color: palette.ink, letterSpacing: 1 },
  joinGo: { height: 44, borderRadius: 12, backgroundColor: palette.ink, paddingHorizontal: 18, justifyContent: "center" },
  joinGoText: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.cream },
  error: { fontFamily: font.sans, fontSize: 13, color: palette.sunsetInk, paddingHorizontal: 18, paddingBottom: 8 },
  status: { fontFamily: font.sans, fontSize: 12.5, color: palette.sunsetInk, paddingHorizontal: 18, paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.card, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 12 },
  sticker: { width: 48, height: 48, borderRadius: 13, backgroundColor: palette.paper, borderWidth: 1.5, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: font.display, fontSize: 17, color: palette.ink, flexShrink: 1 },
  preview: { fontFamily: font.sans, fontSize: 14, color: palette.inkMuted },
  stub: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: palette.sunsetTint, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 3, maxWidth: "100%" },
  stubText: { fontFamily: font.sans, fontSize: 12, fontWeight: "700", color: palette.ink, flexShrink: 1 },
  time: { fontFamily: font.sans, fontSize: 12, color: palette.inkMuted },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  unreadText: { fontFamily: font.sans, fontSize: 11, fontWeight: "800", color: palette.cream },
});
