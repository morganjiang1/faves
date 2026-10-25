// "Send to a chat": drop a spot's postcard, a day or a plan's ticket into one of your group
// chats, or start a new group for it.
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { chat, useChat } from "@/chat/store";
import type { Plan } from "@/lib/planner";
import { useStore } from "@/state/store";
import { font, palette } from "@/theme/tokens";
import { Sheet } from "../Sheet";
import { Icon } from "../ui";

export type SendItem = { kind: "place"; placeId: string; name: string } | { kind: "day"; dayId: string; name: string } | { kind: "plan"; plan: Plan };

export function SendToChat({ open, item, onClose, onSent }: { open: boolean; item: SendItem | null; onClose: () => void; onSent?: (text: string) => void }) {
  const groups = useChat((v) => v.data.groups);
  const city = useStore((s) => s.profile.city);
  const list = Object.values(groups);
  const title = item ? (item.kind === "plan" ? item.plan.title : item.name) : "";
  const send = async (groupId: string) => {
    if (!item) return;
    if (item.kind === "place") await chat.sendPostcard(groupId, item.placeId);
    else if (item.kind === "day") await chat.sendDay(groupId, item.dayId);
    else await chat.postTicket(groupId, item.plan);
    onClose();
    onSent?.(`Sent to ${groups[groupId]?.name ?? "the chat"}`);
    router.push(`/chat/${groupId}`);
  };
  const newGroup = async () => {
    if (!item) return;
    const g = await chat.createGroup({ name: title.slice(0, 40) || "New plan", emoji: item.kind === "place" ? "📍" : "🎟️", members: [], city });
    await send(g.id);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Send to a chat" subtitle={title} testID="send-sheet" background={palette.paper}>
      <View style={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}>
        <Pressable testID="send-new-group" accessibilityRole="button" onPress={newGroup} style={[styles.row, styles.newRow]}>
          <View style={[styles.sticker, { backgroundColor: palette.roseInk, borderColor: palette.roseInk }]}><Icon name="add" size={22} tint={palette.cream} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>New group for this</Text>
            <Text style={styles.sub}>Then invite friends with a link</Text>
          </View>
        </Pressable>
        {list.map((g, i) => (
          <Pressable key={g.id} testID={`send-to-${i}`} accessibilityRole="button" onPress={() => send(g.id)} style={styles.row}>
            <View style={styles.sticker}><Text style={{ fontSize: 20 }}>{g.emoji}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{g.name}</Text>
              <Text style={styles.sub}>{g.members.length} {g.members.length === 1 ? "person" : "people"}</Text>
            </View>
            <Icon name="paper-plane-outline" size={18} tint={palette.roseInk} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.card, borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 10 },
  newRow: { borderStyle: "dashed", borderColor: palette.rose, backgroundColor: palette.roseTint },
  sticker: { width: 40, height: 40, borderRadius: 11, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: font.sans, fontSize: 15.5, fontWeight: "700", color: palette.ink },
  sub: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted },
});
