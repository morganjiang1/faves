// Group info: the group's sticker and name (tap the sticker for another emoji), who's in
// (add, remove) with the invite link under them (code, copy, share, QR in a sheet), one row
// for where you start from (a sheet: your live location rounded to the neighborhood, only in
// this group, or a home neighborhood, and how you get around), the agent's name, mute, leave.
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chat, useChat } from "@/chat/store";
import { Sheet } from "@/components/Sheet";
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
  const [startOpen, setStartOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
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
        <View style={{ alignItems: "center", gap: 8 }}>
          <Pressable testID="info-emoji" accessibilityRole="button" accessibilityLabel="Change the group's emoji" onPress={() => setEmojiOpen(true)} style={styles.sticker}><Text style={{ fontSize: 40 }}>{group.emoji}</Text></Pressable>
          <TextInput testID="info-name" value={name} onChangeText={setName} onBlur={saveName} onSubmitEditing={saveName} returnKeyType="done" style={styles.nameInput} maxLength={40} accessibilityLabel="Group name" />
        </View>

        <Section title={`${group.members.length} ${group.members.length === 1 ? "PERSON" : "PEOPLE"}`}>
          {group.members.map((m) => {
            const start = group.starts?.[m.id];
            return (
              <View key={m.id} style={styles.member} testID={`member-${m.handle}`}>
                <Avatar name={m.name} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.id === me.id ? `${m.name} (you)` : m.name}</Text>
                  <Text style={styles.sub}>{start ? `from ${start.hood ?? "nearby"} · ${start.mode}` : `@${m.handle}`}</Text>
                </View>
                {m.sample ? <SampleTag /> : null}
                {m.id !== me.id ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${m.name}`} hitSlop={10} onPress={() => chat.removeMember(groupId, m.id)}><Icon name="remove-circle-outline" size={22} tint={palette.inkMuted} /></Pressable> : null}
              </View>
            );
          })}
          <View style={styles.addRow}>
            <TextInput testID="info-add-handle" autoFocus={add === "1"} value={handle} onChangeText={setHandle} placeholder="Add by @username" placeholderTextColor={palette.inkMuted} autoCapitalize="none" autoCorrect={false} style={styles.input} onSubmitEditing={addByHandle} />
            <Pressable testID="info-add-go" accessibilityRole="button" onPress={addByHandle} style={styles.go}><Text style={styles.goText}>Add</Text></Pressable>
          </View>
          {hint ? <Text style={styles.sub}>{hint}</Text> : null}
          <View style={styles.invite}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sub}>Invite code</Text>
              <Text style={styles.code} testID="info-code">{group.inviteCode}</Text>
            </View>
            <Pressable testID="info-copy" accessibilityRole="button" accessibilityLabel="Copy the invite link" onPress={async () => { await Clipboard.setStringAsync(webLink); setToast("Link copied"); }} style={styles.round}><Icon name="copy-outline" size={18} tint={palette.ink} /></Pressable>
            <Pressable testID="info-qr-open" accessibilityRole="button" accessibilityLabel="Show the QR code" onPress={() => setQrOpen(true)} style={styles.round}><Icon name="qr-code-outline" size={18} tint={palette.ink} /></Pressable>
            <Pressable testID="info-share" accessibilityRole="button" accessibilityLabel="Share the invite" onPress={() => Share.share({ message: inviteText }).catch(() => {})} style={[styles.round, styles.roundDark]}><Icon name="share-outline" size={18} tint={palette.cream} /></Pressable>
          </View>
          {Platform.OS !== "web" ? <Row icon="people-circle-outline" label="Invite from contacts" onPress={fromContacts} testID="info-contacts" /> : null}
        </Section>

        <Section title="FOR FAIR PLANS">
          <Pressable testID="info-start" accessibilityRole="button" onPress={() => setStartOpen(true)} style={styles.liveRow}>
            <Icon name="navigate-circle-outline" size={22} tint={palette.ink} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{mine?.hood ? `Starting from ${mine.hood}` : "Where do you start from?"}</Text>
              <Text style={styles.sub}>{live ? "Your location, as your neighborhood" : mine?.hood ? `By ${MODES.find((x) => x.id === mode)?.label.toLowerCase() ?? mode}` : "Pick a neighborhood"}</Text>
            </View>
            <Icon name="chevron-forward" size={18} tint={palette.inkMuted} />
          </Pressable>
        </Section>

        <Section title="THE GROUP'S AGENT">
          <View style={styles.member}>
            <View style={styles.butlerDisc}><Icon name="heart" size={18} tint={palette.cream} /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <TextInput testID="info-butler-name" value={butler} onChangeText={setButler} onBlur={saveButler} onSubmitEditing={saveButler} returnKeyType="done" style={styles.butlerInput} maxLength={20} autoCorrect={false} accessibilityLabel="The agent's name" />
              <Text style={styles.sub}>Ask with @{(butler.trim() || "Fave").split(/\s+/)[0].toLowerCase()}. It's an AI.</Text>
            </View>
          </View>
        </Section>

        <View style={{ gap: 4 }}>
          <View style={styles.liveRow}>
            <Text style={[styles.memberName, { flex: 1 }]}>Mute this chat</Text>
            <Switch testID="info-mute" value={Boolean(v.muted[groupId])} onValueChange={() => chat.toggleMute(groupId)} trackColor={{ true: palette.rose, false: palette.line }} />
          </View>
          <Row icon="exit-outline" label="Leave the group" danger testID="info-leave" onPress={async () => { await chat.leave(groupId); router.replace("/chats"); }} />
        </View>
      </ScrollView>
      <Sheet open={startOpen} onClose={() => setStartOpen(false)} title="Where you start from" subtitle="Others only see your neighborhood" testID="start-sheet" background={palette.paper}>
        <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}>
          <View style={styles.liveRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>Use my location</Text>
              <Text style={styles.sub}>{locating ? "Finding your neighborhood…" : live ? `On, as ${mine?.hood ?? "your neighborhood"}` : "Only for this group"}</Text>
            </View>
            <Switch testID="info-live" value={live} onValueChange={toggleLive} trackColor={{ true: palette.rose, false: palette.line }} />
          </View>
          {!live ? (
            <>
              <TextInput testID="info-hood-search" value={hoodQuery} onChangeText={setHoodQuery} placeholder={mine?.hood ? `Home: ${mine.hood}` : "Search neighborhoods"} placeholderTextColor={palette.inkMuted} style={[styles.input, { flex: 0 }]} />
              <View style={styles.chips}>{hoods.map((h) => <Chip key={h} testID={`hood-${h}`} label={h} on={mine?.hood === h} onPress={() => setHood(h)} />)}</View>
            </>
          ) : null}
          <Text style={[styles.section, { marginTop: 4 }]}>HOW YOU GET AROUND</Text>
          <View style={styles.chips}>{MODES.map((m) => <Chip key={m.id} testID={`mode-${m.id}`} label={m.label} on={mode === m.id} onPress={() => setMode(m.id)} />)}</View>
        </View>
      </Sheet>
      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title="Scan to join" subtitle={group.name} testID="qr-sheet">
        <View style={{ alignItems: "center", gap: 12, paddingBottom: 12 }}>
          <View style={styles.qr} testID="info-qr"><QRCode value={appLink} size={200} color={palette.ink} backgroundColor={palette.card} /></View>
          <Text style={styles.code}>{group.inviteCode}</Text>
          <Text style={styles.sub} numberOfLines={2}>{webLink}</Text>
        </View>
      </Sheet>
      <Sheet open={emojiOpen} onClose={() => setEmojiOpen(false)} title="Pick an emoji" testID="emoji-sheet">
        <View style={[styles.emojis, { paddingHorizontal: 16, paddingBottom: 12 }]}>
          {EMOJIS.map((e) => <Pressable key={e} accessibilityRole="button" onPress={() => { chat.rename(groupId, group.name, e); setEmojiOpen(false); }} style={[styles.emoji, group.emoji === e && styles.emojiOn]}><Text style={{ fontSize: 24 }}>{e}</Text></Pressable>)}
        </View>
      </Sheet>
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
  emoji: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line },
  emojiOn: { borderColor: palette.roseInk, borderWidth: 2 },
  section: { fontFamily: font.sans, fontSize: 11.5, fontWeight: "800", letterSpacing: 0.8, color: palette.inkMuted },
  member: { flexDirection: "row", alignItems: "center", gap: 10 },
  memberName: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.ink },
  sub: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted },
  addRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, height: 44, borderRadius: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, fontFamily: font.sans, fontSize: 15, color: palette.ink },
  go: { height: 44, borderRadius: 12, backgroundColor: palette.ink, paddingHorizontal: 16, justifyContent: "center" },
  goText: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.cream },
  invite: { flexDirection: "row", gap: 8, backgroundColor: palette.card, borderRadius: 14, borderWidth: 1, borderColor: palette.line, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center" },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", backgroundColor: palette.card },
  roundDark: { backgroundColor: palette.ink, borderColor: palette.ink },
  qr: { padding: 6, borderRadius: 10, backgroundColor: palette.card },
  code: { fontFamily: font.displayHeavy, fontSize: 22, color: palette.ink, letterSpacing: 3 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, borderColor: palette.line, padding: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rowButton: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
});
