// Group info: who's in (add, remove), the invite link and its QR code, where you start from
// for plans (a home neighborhood, or your live location rounded to the neighborhood, only
// in this group), mute, and leave.
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chat, useChat } from "@/chat/store";
import { Avatar, Chip, EmptyState, Icon, SampleTag, Toast } from "@/components/ui";
import { hoodPoint, neighborhoodPoint } from "@/lib/fair";
import type { Mode } from "@/lib/geo";
import { shareUrl } from "@/lib/links";
import { useCityBySlug } from "@/state/city";
import { currentLocation } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { font, palette } from "@/theme/tokens";
import { EMOJIS } from "../new";

const MODES: { id: Mode; label: string }[] = [{ id: "walk", label: "Walk" }, { id: "transit", label: "Transit" }, { id: "drive", label: "Car" }, { id: "bike", label: "Bike" }];

export default function GroupInfo() {
  const { id, add } = useLocalSearchParams<{ id: string; add?: string }>();
  const groupId = String(id);
  const insets = useSafeAreaInsets();
  const v = useChat((x) => x);
  const group = v.data.groups[groupId];
  const city = useCityBySlug(group?.city);
  const profile = useStore((s) => s.profile);
  const [handle, setHandle] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [name, setName] = useState(group?.name ?? "");
  const [butler, setButler] = useState(group?.butlerName ?? "Fave");
  const [hoodQuery, setHoodQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const me = v.me;
  const mine = me && group ? group.starts?.[me.id] : undefined;
  const live = v.live[groupId] ?? false;

  const hoods = useMemo(() => {
    const q = hoodQuery.trim().toLowerCase();
    return (city?.hoods ?? []).filter((h) => !q || h.toLowerCase().includes(q)).slice(0, q ? 8 : 6);
  }, [city, hoodQuery]);

  const saveName = () => {
    if (group && name.trim() && name.trim() !== group.name) chat.rename(groupId, name.trim());
  };
  const saveButler = () => {
    const b = butler.trim();
    if (group && b && b !== (group.butlerName ?? "Fave")) chat.renameButler(groupId, b);
  };

  if (!group || !me) {
    return <View style={[styles.screen, { paddingTop: insets.top + 40 }]}><EmptyState icon="people-outline" title="Group not found" body="You may have left it." cta="Back to chats" onCta={() => router.replace("/chats")} /></View>;
  }

  const appLink = Linking.createURL(`/join/${group.inviteCode}`);
  const webLink = shareUrl(`/join/${group.inviteCode}`);
  const inviteText = `Join "${group.name}" on Faves to plan hangouts together: ${webLink}${appLink !== webLink ? ` (or in the app: ${appLink})` : ""}. Code: ${group.inviteCode}`;
  const mode: Mode = mine?.mode ?? profile.transport;

  const addByHandle = async () => {
    const h = handle.trim();
    if (!h) return;
    const m = await chat.findUser(h);
    if (m) { await chat.addMember(groupId, m); setHandle(""); setHint(null); setToast(`${m.name} added`); }
    else setHint(`No one called @${h.replace(/^@/, "")} yet. Send them the invite link below.`);
  };
  const fromContacts = async () => {
    try {
      const C = await import("expo-contacts/legacy");
      const c = await C.presentContactPickerAsync();
      const phone = c?.phoneNumbers?.[0]?.number;
      if (!phone) return;
      const sep = Platform.OS === "ios" ? "&" : "?";
      await Linking.openURL(`sms:${phone.replace(/[^\d+]/g, "")}${sep}body=${encodeURIComponent(inviteText)}`);
    } catch { setToast("Couldn't open your contacts. Share the link instead."); }
  };
  const setHood = async (hood: string) => {
    if (!city) return;
    const pt = hoodPoint(city, hood);
    if (!pt) return;
    chat.setLive(groupId, false);
    await chat.setStart(groupId, { ...pt, mode, live: false });
    if (!profile.homeHood) actions.updateProfile({ homeHood: hood });
    setHoodQuery("");
    setToast(`Starting from ${hood}`);
  };
  const toggleLive = async (on: boolean) => {
    chat.setLive(groupId, on);
    if (!on) { if (profile.homeHood) await setHood(profile.homeHood); else await chat.setStart(groupId, null); return; }
    if (!city) return;
    setLocating(true);
    const { fix } = await currentLocation(true);
    setLocating(false);
    if (!fix) { chat.setLive(groupId, false); setToast("Location is off. Pick a neighborhood instead."); return; }
    const pt = neighborhoodPoint(city, fix);
    await chat.setStart(groupId, { ...pt, mode, live: true });
    setToast(`Sharing your neighborhood: ${pt.hood ?? "nearby"}`);
  };
  const setMode = async (m: Mode) => {
    actions.updateProfile({ transport: m });
    if (mine) await chat.setStart(groupId, { ...mine, mode: m });
  };

  return (
    <View style={styles.screen} testID="group-info">
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <Pressable testID="info-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={() => (router.canGoBack() ? router.back() : router.replace(`/chat/${groupId}`))}><Icon name="chevron-back" size={26} tint={palette.ink} /></Pressable>
        <Text style={styles.topTitle}>group info</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 22, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", gap: 10 }}>
          <View style={styles.sticker}><Text style={{ fontSize: 40 }}>{group.emoji}</Text></View>
          <TextInput testID="info-name" value={name} onChangeText={setName} onBlur={saveName} onSubmitEditing={saveName} returnKeyType="done" style={styles.nameInput} maxLength={40} />
          <View style={styles.emojis}>
            {EMOJIS.map((e) => <Pressable key={e} accessibilityRole="button" onPress={() => chat.rename(groupId, group.name, e)} style={[styles.emoji, group.emoji === e && styles.emojiOn]}><Text style={{ fontSize: 18 }}>{e}</Text></Pressable>)}
          </View>
        </View>

        <Section title={`${group.members.length} ${group.members.length === 1 ? "PERSON" : "PEOPLE"}`}>
          {group.members.map((m) => {
            const start = group.starts?.[m.id];
            return (
              <View key={m.id} style={styles.member} testID={`member-${m.handle}`}>
                <Avatar name={m.name} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.id === me.id ? `${m.name} (you)` : m.name}</Text>
                  <Text style={styles.sub}>{start ? `starts from ${start.hood ?? "nearby"} · ${start.mode}` : `@${m.handle}`}</Text>
                </View>
                {m.sample ? <SampleTag /> : null}
                {m.id !== me.id ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${m.name}`} hitSlop={8} onPress={() => chat.removeMember(groupId, m.id)}><Icon name="remove-circle-outline" size={20} tint={palette.inkMuted} /></Pressable> : null}
              </View>
            );
          })}
          <View style={styles.addRow}>
            <TextInput testID="info-add-handle" autoFocus={add === "1"} value={handle} onChangeText={setHandle} placeholder="Add by @username" placeholderTextColor={palette.inkMuted} autoCapitalize="none" autoCorrect={false} style={styles.input} onSubmitEditing={addByHandle} />
            <Pressable testID="info-add-go" accessibilityRole="button" onPress={addByHandle} style={styles.go}><Text style={styles.goText}>Add</Text></Pressable>
          </View>
          {hint ? <Text style={styles.sub}>{hint}</Text> : null}
          {Platform.OS !== "web" ? <Row icon="people-circle-outline" label="Invite from contacts" onPress={fromContacts} testID="info-contacts" /> : null}
        </Section>

        <Section title="THE GROUP'S AGENT">
          <View style={styles.member}>
            <View style={styles.butlerDisc}><Icon name="heart" size={18} tint={palette.cream} /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <TextInput testID="info-butler-name" value={butler} onChangeText={setButler} onBlur={saveButler} onSubmitEditing={saveButler} returnKeyType="done" style={styles.butlerInput} maxLength={20} autoCorrect={false} accessibilityLabel="The agent's name" />
              <Text style={styles.sub}>Plans, books, reminds and sums up. Ask with @{(butler.trim() || "Fave").split(/\s+/)[0].toLowerCase()}. It's an AI.</Text>
            </View>
          </View>
        </Section>

        <Section title="INVITE LINK">
          <View style={styles.invite}>
            <View style={styles.qr} testID="info-qr"><QRCode value={appLink} size={128} color={palette.ink} backgroundColor={palette.card} /></View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.code} testID="info-code">{group.inviteCode}</Text>
              <Text style={styles.sub} numberOfLines={3}>{webLink}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable testID="info-copy" accessibilityRole="button" onPress={async () => { await Clipboard.setStringAsync(webLink); setToast("Link copied"); }} style={styles.smallButton}><Icon name="copy-outline" size={15} tint={palette.ink} /><Text style={styles.smallText}>Copy</Text></Pressable>
                <Pressable testID="info-share" accessibilityRole="button" onPress={() => Share.share({ message: inviteText }).catch(() => {})} style={styles.smallButton}><Icon name="share-outline" size={15} tint={palette.ink} /><Text style={styles.smallText}>Share</Text></Pressable>
              </View>
            </View>
          </View>
        </Section>

        <Section title="WHERE YOU START FROM">
          <Text style={styles.sub}>Plans in this group pick a first stop that's fair for everyone. Others only see your neighborhood and travel times, never where you are exactly.</Text>
          <View style={styles.liveRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>Use my location</Text>
              <Text style={styles.sub}>{locating ? "Finding your neighborhood…" : live ? `On, as ${mine?.hood ?? "your neighborhood"}` : "Off. Only for this group."}</Text>
            </View>
            <Switch testID="info-live" value={live} onValueChange={toggleLive} trackColor={{ true: palette.rose, false: palette.line }} />
          </View>
          {!live ? (
            <>
              <Text style={styles.memberName}>{mine?.hood ? `Home neighborhood: ${mine.hood}` : "Pick your neighborhood"}</Text>
              <TextInput testID="info-hood-search" value={hoodQuery} onChangeText={setHoodQuery} placeholder="Search neighborhoods" placeholderTextColor={palette.inkMuted} style={styles.input} />
              <View style={styles.chips}>{hoods.map((h) => <Chip key={h} testID={`hood-${h}`} label={h} on={mine?.hood === h} onPress={() => setHood(h)} />)}</View>
            </>
          ) : null}
          <Text style={[styles.memberName, { marginTop: 4 }]}>How you get around</Text>
          <View style={styles.chips}>{MODES.map((m) => <Chip key={m.id} testID={`mode-${m.id}`} label={m.label} on={mode === m.id} onPress={() => setMode(m.id)} />)}</View>
        </Section>

        <Section title="SETTINGS">
          <View style={styles.liveRow}>
            <Text style={[styles.memberName, { flex: 1 }]}>Mute this chat</Text>
            <Switch testID="info-mute" value={Boolean(v.muted[groupId])} onValueChange={() => chat.toggleMute(groupId)} trackColor={{ true: palette.rose, false: palette.line }} />
          </View>
          <Row icon="exit-outline" label="Leave the group" danger testID="info-leave" onPress={async () => { await chat.leave(groupId); router.replace("/chats"); }} />
        </Section>
      </ScrollView>
      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 50} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={{ gap: 10 }}><Text style={styles.section}>{title}</Text>{children}</View>;
}

function Row({ icon, label, onPress, danger, testID }: { icon: "people-circle-outline" | "exit-outline"; label: string; onPress: () => void; danger?: boolean; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={styles.rowButton}>
      <Icon name={icon} size={20} tint={danger ? palette.sunsetInk : palette.ink} />
      <Text style={[styles.memberName, danger && { color: palette.sunsetInk }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  butlerDisc: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" },
  butlerInput: { fontFamily: font.display, fontSize: 18, color: palette.ink, paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: palette.line },
  screen: { flex: 1, backgroundColor: palette.paper },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
  topTitle: { fontFamily: font.display, fontSize: 19, color: palette.ink },
  sticker: { width: 84, height: 84, borderRadius: 22, backgroundColor: palette.card, borderWidth: 2, borderStyle: "dashed", borderColor: palette.rose, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] },
  nameInput: { fontFamily: font.display, fontSize: 24, color: palette.ink, textAlign: "center", minWidth: 200, paddingVertical: 4 },
  emojis: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  emoji: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line },
  emojiOn: { borderColor: palette.roseInk, borderWidth: 2 },
  section: { fontFamily: font.sans, fontSize: 11.5, fontWeight: "800", letterSpacing: 0.8, color: palette.inkMuted },
  member: { flexDirection: "row", alignItems: "center", gap: 10 },
  memberName: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.ink },
  sub: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted },
  addRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, height: 44, borderRadius: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, fontFamily: font.sans, fontSize: 15, color: palette.ink },
  go: { height: 44, borderRadius: 12, backgroundColor: palette.ink, paddingHorizontal: 16, justifyContent: "center" },
  goText: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.cream },
  invite: { flexDirection: "row", gap: 14, backgroundColor: palette.card, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14, alignItems: "center" },
  qr: { padding: 6, borderRadius: 10, backgroundColor: palette.card },
  code: { fontFamily: font.displayHeavy, fontSize: 26, color: palette.ink, letterSpacing: 3 },
  smallButton: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, borderWidth: 1.5, borderColor: palette.ink, paddingHorizontal: 10, paddingVertical: 6 },
  smallText: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.ink },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, borderColor: palette.line, padding: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rowButton: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
});
