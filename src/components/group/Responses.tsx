// Partiful's responses list and invite block.
// - Responses (plans/partiful/appstore_10_find_a_time_poll_responses.png): "Responses" white
//   semibold with "🏆 Most Popular" in muted lavender (#9999B5) at the right, a 1 px lighter
//   divider, then rows: 51 pt round avatar with the vote emoji badge at the bottom right,
//   name ~17 pt semibold white, and a 37 pt button with a 1 px translucent ring at the right.
// - Invite (plans/partiful/ios_video_invite_share_link_dark.png): 🐣, "Invite Contacts or Share
//   Link" bold white, a grey line, and a white full-width button with a people glyph.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, Icon, SampleTag } from "@/components/ui";
import { mood, type Vote } from "@/lib/group";
import { font } from "@/theme/tokens";

const BADGE: Record<Vote, string> = { going: "👍", maybe: "🤔", cant: "😢" };
const AVATAR_TINTS = ["#C2185B", "#7B1FA2", "#1976D2", "#00897B", "#F57C00", "#5D4037"];

export interface ResponseRow { name: string; votes: Record<string, Vote>; picks: string; me: boolean; test: boolean }

export function Responses({ rows, onEditMine, testID = "responses" }: { rows: ResponseRow[]; onEditMine: () => void; testID?: string }) {
  return (
    <View testID={testID}>
      <View style={s.header}>
        <Text style={s.title}>Responses</Text>
        <Text style={s.sort}>🏆 Most Popular</Text>
      </View>
      <View style={s.divider} />
      {rows.map((r, i) => (
        <View key={r.name} style={s.row} testID={`${testID}-${i}`}>
          <View>
            <Avatar name={r.name} size={51} tint={AVATAR_TINTS[hash(r.name) % AVATAR_TINTS.length]} />
            <Text style={s.badge}>{BADGE[mood(r.votes)]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={s.name} numberOfLines={1}>{r.name}</Text>
              {r.me ? <Text style={s.plus}>you</Text> : null}
              {r.test ? <SampleTag text="Test data" /> : null}
            </View>
            <Text style={s.picks} numberOfLines={2}>{r.picks}</Text>
          </View>
          {r.me ? (
            <Pressable testID="responses-edit-mine" accessibilityRole="button" accessibilityLabel="Change your votes" onPress={onEditMine} style={s.ringButton}>
              <Icon name="pencil" size={16} tint="#fff" />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function InviteBlock({ onShare, title = "Invite friends to vote", body = "Share the link with anyone. They can vote without the app." }: { onShare: () => void; title?: string; body?: string }) {
  return (
    <View style={s.invite} testID="invite-block">
      <Text style={{ fontSize: 44 }}>🐣</Text>
      <Text style={s.inviteTitle}>{title}</Text>
      <Text style={s.inviteBody}>{body}</Text>
      <Pressable testID="invite-share" accessibilityRole="button" onPress={onShare} style={({ pressed }) => [s.inviteButton, pressed && { opacity: 0.85 }]}>
        <Icon name="people" size={20} tint="#000" />
        <Text style={s.inviteLabel}>Share invite link</Text>
      </Pressable>
    </View>
  );
}

function hash(t: string) {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 22, paddingBottom: 16 },
  title: { fontFamily: font.sans, color: "#fff", fontSize: 20, fontWeight: "600" },
  sort: { fontFamily: font.sans, color: "#9999B5", fontSize: 17 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 11, minHeight: 74 },
  badge: { position: "absolute", right: -6, bottom: -4, fontSize: 20 },
  name: { fontFamily: font.sans, color: "#fff", fontSize: 17, fontWeight: "600", flexShrink: 1 },
  plus: { fontFamily: font.sans, color: "rgba(255,255,255,0.6)", fontSize: 16 },
  picks: { fontFamily: font.sans, color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 19, marginTop: 2 },
  ringButton: { width: 37, height: 37, borderRadius: 18.5, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  invite: { alignItems: "center", paddingHorizontal: 28, paddingTop: 30, paddingBottom: 12 },
  inviteTitle: { fontFamily: font.sans, color: "#fff", fontSize: 20, fontWeight: "600", marginTop: 10, textAlign: "center" },
  inviteBody: { fontFamily: font.sans, color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 22, textAlign: "center", marginTop: 8 },
  inviteButton: { alignSelf: "stretch", height: 47, borderRadius: 3, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 22 },
  inviteLabel: { fontFamily: font.sans, color: "#000", fontSize: 17, fontWeight: "600" },
});
