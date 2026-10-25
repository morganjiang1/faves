// A group chat: messages, spots dropped in as postcards, plans as tickets everyone answers
// In / Maybe / Out, the next locked-in hangout pinned under the header with a countdown,
// a "plan" button in the composer and @faves for quick asks.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { answer, currentTicket, mentionsFaves } from "@/chat/agent";
import { countdown } from "@/chat/calendar";
import { groupRequestText, groupStarts, planForGroup } from "@/chat/plan";
import { FAVES_ID, type Message, type Ticket as TicketT } from "@/chat/reduce.mjs";
import { chat, present, serverButler, useChat } from "@/chat/store";
import { hush, say, transcribe, voiceStatus } from "@/chat/voice";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { ChatTicket } from "@/components/chat/ChatTicket";
import { Postcard } from "@/components/postcard/Postcard";
import { Sheet } from "@/components/Sheet";
import { Ticket } from "@/components/ticket/Ticket";
import { Chip, EmptyState, Icon, PrimaryButton, UserDisc } from "@/components/ui";
import type { City } from "@/data/types";
import { findDay } from "@/lib/community";
import { callNumber } from "@/lib/links";
import type { Plan } from "@/lib/planner";
import { formatClock } from "@/lib/time";
import { useCityBySlug } from "@/state/city";
import { useStore } from "@/state/store";
import { font, palette } from "@/theme/tokens";

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id);
  const insets = useSafeAreaInsets();
  const v = useChat((x) => x);
  const group = v.data.groups[groupId];
  const messages = v.data.messages[groupId];
  const city = useCityBySlug(group?.city);
  const interests = useStore((s) => s.profile.interests);
  const [text, setText] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  // Voice: the butler's replies read aloud, and voice notes typed out (Cartesia when set up).
  const [voiceOn, setVoiceOn] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [hearing, setHearing] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const spoken = useRef<string | null>(null);
  useEffect(() => { voiceStatus().then((v) => setCanListen(v.ready)).catch(() => {}); }, []);
  useEffect(() => {
    if (!voiceOn) return;
    const last = [...(messages ?? [])].reverse().find((m) => m.authorId === FAVES_ID && m.kind === "agent" && m.text);
    if (!last || last.id === spoken.current) return;
    if (spoken.current !== null) say(last.text!).catch(() => {});
    spoken.current = last.id;
  }, [voiceOn, messages]);
  useEffect(() => () => hush(), []);

  useEffect(() => { if (group) chat.markRead(groupId); }, [groupId, group, messages?.length]);
  const [here, setHere] = useState<string[]>([]);
  useEffect(() => present(groupId, setHere), [groupId]);
  const list = useMemo(() => [...(messages ?? [])].reverse(), [messages]);
  const tickets = useMemo(() => Object.values(v.data.tickets).filter((t) => t.groupId === groupId), [v.data.tickets, groupId]);
  const pinned = useMemo(() => tickets.filter((t) => t.status === "locked").sort((a, b) => ((a.plan as Plan).dateISO + String((a.plan as Plan).start).padStart(4, "0")).localeCompare((b.plan as Plan).dateISO + String((b.plan as Plan).start).padStart(4, "0")))[0] ?? null, [tickets]);
  const me = v.me;

  if (!group || !me) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 40 }]} testID="chat-missing">
        <EmptyState icon="chatbubbles-outline" title="Chat not found" body="You may have left it, or it was made on another phone." cta="Back to chats" onCta={() => router.replace("/chats")} />
      </View>
    );
  }

  const butler = group.butlerName || "Fave";
  const at = `@${butler.split(/\s+/)[0].toLowerCase()}`;
  const current = currentTicket(v.data.tickets, groupId);
  const send = async (raw?: string) => {
    const t = (raw ?? text).trim();
    if (!t) return;
    if (raw == null) setText("");
    await chat.sendText(groupId, t);
    // With Convex the group's butler answers from the server; otherwise this phone answers.
    if (mentionsFaves(t, group.butlerName) && city && !serverButler()) {
      setThinking(true);
      try { await answer({ city, group, users: v.data.users, tickets: v.data.tickets, text: t }); } finally { setThinking(false); }
    }
  };

  const listen = async () => {
    try {
      if (!recording) {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) return;
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setRecording(true);
        return;
      }
      await recorder.stop();
      setRecording(false);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) return;
      setHearing(true);
      const words = await transcribe(recorder.uri, Platform.OS === "web" ? "audio/webm" : "audio/m4a");
      if (words) setText((t) => (t ? `${t} ${words}` : words));
    } catch {
      setRecording(false);
    } finally {
      setHearing(false);
    }
  };

  const live = v.status === "live";
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} testID="chat-screen">
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable testID="chat-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={() => (router.canGoBack() ? router.back() : router.replace("/chats"))}>
          <Icon name="chevron-back" size={26} tint={palette.ink} />
        </Pressable>
        <Pressable testID="chat-info" accessibilityRole="button" accessibilityLabel="Group info" onPress={() => router.push(`/chat/info/${groupId}`)} style={styles.headerMain}>
          <View style={styles.emoji}><Text style={{ fontSize: 20 }}>{group.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1} testID="chat-title">{group.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {group.members.length} {group.members.length === 1 ? "person" : "people"} · <Text style={{ color: live ? palette.open : palette.sunsetInk }}>{live ? (here.length > 1 ? `${here.length} here now` : "live") : "only on this phone"}</Text>
            </Text>
          </View>
        </Pressable>
        <Pressable testID="chat-voice" accessibilityRole="switch" accessibilityState={{ checked: voiceOn }} accessibilityLabel={voiceOn ? `${butler} reads replies aloud. Tap to stop.` : `Have ${butler} read replies aloud`} hitSlop={8} onPress={() => { if (voiceOn) hush(); else spoken.current = [...(messages ?? [])].reverse().find((m) => m.authorId === FAVES_ID && m.kind === "agent")?.id ?? ""; setVoiceOn(!voiceOn); }} style={[styles.voice, voiceOn && styles.voiceOn]}>
          <Icon name={voiceOn ? "volume-high" : "volume-mute-outline"} size={19} tint={voiceOn ? palette.cream : palette.ink} />
        </Pressable>
        <Pressable testID="chat-add" accessibilityRole="button" accessibilityLabel="Add people" hitSlop={8} onPress={() => router.push(`/chat/info/${groupId}?add=1`)}>
          <Icon name="person-add-outline" size={22} tint={palette.ink} />
        </Pressable>
      </View>
      {pinned && city ? <Pinned ticket={pinned} city={city} groupSize={group.members.length} /> : null}
      {!live ? (
        <View style={styles.localNote} testID="chat-local-note">
          <Icon name="phone-portrait-outline" size={14} tint={palette.sunsetInk} />
          <Text style={styles.localText}>Only on this phone for now. It syncs with everyone when the connection is back.</Text>
        </View>
      ) : null}

      <FlatList
        testID="chat-messages"
        inverted
        data={list}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={thinking ? <Text style={styles.thinking}>{butler} is thinking…</Text> : undefined}
        ListFooterComponent={<Intro groupName={group.name} butler={at} />}
        renderItem={({ item, index }) => {
          const older = list[index + 1];
          const showName = item.authorId !== me.id && (!older || older.authorId !== item.authorId || older.kind === "note");
          return <MessageRow m={item} mine={item.authorId === me.id} showName={showName} city={city} tickets={v.data.tickets} groupSize={group.members.length} render={(t) => <ChatTicket ticket={t} group={group} users={v.data.users} me={me} city={city} testID={`ticket-${t.id}`} />} />;
        }}
      />

      {!text ? (
        // Quick asks for the group's butler.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.asks} contentContainerStyle={styles.asksRow} testID="butler-chips">
          <View style={styles.asksLabel}><Icon name="heart" size={12} tint={palette.rose} /><Text style={styles.asksName}>{butler}</Text></View>
          <Chip testID="butler-plan" label="Plan something" onPress={() => { setText(`${at} plan `); inputRef.current?.focus(); }} />
          <Chip testID="butler-find" label="Find a spot" onPress={() => { setText(`${at} find `); inputRef.current?.focus(); }} />
          <Chip testID="butler-options" label="Two options to vote on" onPress={() => { setText(`${at} give us options for `); inputRef.current?.focus(); }} />
          {current ? <Chip testID="butler-book" label="Book it" onPress={() => send(`${at} book it`)} /> : null}
          {current?.status === "locked" ? <Chip testID="butler-remind" label="Remind us" onPress={() => send(`${at} remind us`)} /> : null}
          {current?.status === "locked" ? <Chip testID="butler-late" label="Running late" onPress={() => { setText(`${at} running 15 min late`); inputRef.current?.focus(); }} /> : null}
          {(messages?.length ?? 0) > 3 ? <Chip testID="butler-tldr" label="tl;dr" onPress={() => send(`${at} tl;dr`)} /> : null}
        </ScrollView>
      ) : null}
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable testID="composer-plan" accessibilityRole="button" accessibilityLabel="Plan a hangout" onPress={() => setPlanOpen(true)} style={styles.planButton}>
          <Icon name="ticket" size={20} tint={palette.ink} />
        </Pressable>
        <TextInput
          ref={inputRef}
          testID="composer-input"
          value={text}
          onChangeText={setText}
          placeholder={`Message, or ask ${at}`}
          placeholderTextColor={palette.inkMuted}
          style={styles.input}
          multiline
          numberOfLines={1}
          maxLength={1000}
          onSubmitEditing={() => send()}
          blurOnSubmit={false}
          returnKeyType="send"
          submitBehavior="submit"
        />
        {canListen && !text.trim() ? (
          <Pressable testID="composer-mic" accessibilityRole="button" accessibilityLabel={recording ? "Stop and type it out" : "Voice note"} onPress={listen} disabled={hearing} style={[styles.send, { backgroundColor: recording ? palette.rose : palette.ink }, hearing && { opacity: 0.5 }]}>
            <Icon name={recording ? "stop" : "mic"} size={20} tint={palette.cream} />
          </Pressable>
        ) : (
          <Pressable testID="composer-send" accessibilityRole="button" accessibilityLabel="Send" disabled={!text.trim()} onPress={() => send()} style={[styles.send, !text.trim() && { opacity: 0.4 }]}>
            <Icon name="arrow-up" size={20} tint={palette.cream} />
          </Pressable>
        )}
      </View>

      {city ? <PlanSheet open={planOpen} onClose={() => setPlanOpen(false)} defaultText={groupRequestText(group, v.data.users, interests)} canBalance={groupStarts(group, v.data.users).length >= 2}
        onMake={async (requestText, middle) => {
          const plan = planForGroup(city, group, v.data.users, requestText, { meetInMiddle: middle });
          setPlanOpen(false);
          if (plan.stops.length) await chat.postTicket(groupId, plan);
        }} /> : null}
    </KeyboardAvoidingView>
  );
}

function Intro({ groupName, butler }: { groupName: string; butler: string }) {
  return (
    <View style={styles.intro}>
      <Text style={styles.introTitle}>{groupName}</Text>
      <Text style={styles.introBody}>Tap the ticket to plan a hangout for everyone, or ask {butler}: it plans, books, reminds and sums up.</Text>
    </View>
  );
}

function Pinned({ ticket, city, groupSize }: { ticket: TicketT; city: City; groupSize: number }) {
  const plan = ticket.plan as Plan;
  const first = city.byId.get(plan.stops[0]?.placeId ?? "");
  const going = Object.values(ticket.rsvps).filter((x) => x === "in").length;
  const d = new Date(`${plan.dateISO}T12:00:00Z`);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  return (
    <Pressable testID="chat-pinned" accessibilityRole="button" onPress={() => router.push(`/plan/${plan.id}`)} style={styles.pinned}>
      <View style={styles.pinnedStub}><Icon name="ticket" size={16} tint={palette.ink} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.pinnedText} numberOfLines={1}>{day} {formatClock(plan.start, { compact: true })} · {first?.name ?? plan.title} · {going} going{groupSize ? "" : ""}</Text>
        <Text style={styles.pinnedSub}>{countdown(plan, city)} · tap for directions</Text>
      </View>
      <Icon name="chevron-forward" size={16} tint={palette.inkMuted} />
    </Pressable>
  );
}

function MessageRow({ m, mine, showName, city, tickets, render }: { m: Message; mine: boolean; showName: boolean; city: City | null; tickets: Record<string, TicketT>; groupSize: number; render: (t: TicketT) => React.ReactNode }) {
  if (m.kind === "note") return <Text style={styles.noteRow} testID="chat-note">{m.text}</Text>;
  if (m.kind === "change") {
    return (
      <View style={styles.change} testID="chat-change">
        <Icon name="swap-horizontal" size={14} tint={palette.lavInk} />
        <Text style={styles.changeText}>{m.text}</Text>
      </View>
    );
  }
  if (m.kind === "ticket") {
    const t = m.ticketId ? tickets[m.ticketId] : null;
    return t ? <View>{showName ? <Text style={styles.name}>{m.authorName} planned</Text> : null}{render(t)}</View> : null;
  }
  const isFaves = m.authorId === FAVES_ID;
  const place = m.placeId && city ? city.byId.get(m.placeId) ?? null : null;
  const day = m.dayId && city ? findDay(city, m.dayId) : null;
  return (
    <View style={{ alignItems: mine ? "flex-end" : "flex-start" }} testID={`msg-${m.kind}`}>
      {showName ? (
        <View style={styles.nameRow}>
          {isFaves ? <View style={styles.favesDisc}><Icon name="heart" size={11} tint={palette.cream} /></View> : <UserDisc name={m.authorName} size={16} />}
          <Text style={styles.name}>{isFaves ? m.authorName || "Fave" : m.authorName}</Text>
        </View>
      ) : null}
      {place ? <View style={{ marginVertical: 4, marginRight: mine ? 6 : 0, marginLeft: mine ? 0 : 6 }}><Postcard place={place} active={false} size="row" tilt={mine ? 2 : -2} testID="msg-postcard" /></View> : null}
      {day && city ? <View style={{ width: "100%", marginVertical: 4 }}><Ticket plan={day.plan} city={city} compact sample onPress={() => router.push(`/day/${encodeURIComponent(day.id)}`)} /></View> : null}
      {m.text ? (
        <View style={[styles.bubble, mine ? styles.mine : isFaves ? styles.faves : styles.theirs, m.pending && { opacity: 0.7 }]}>
          <Text style={[styles.text, mine && { color: palette.cream }]}>{isFaves ? withPhoneLinks(m.text) : m.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

// Phone numbers in the butler's messages ("books by phone only, call them at (415) 555-0101")
// are tappable, so anyone can call the place themselves.
const PHONE = /(\(?\d{3}\)?[ .-]\d{3}-\d{4})/g;
function withPhoneLinks(text: string) {
  const parts = text.split(PHONE);
  if (parts.length === 1) return text;
  return parts.map((x, i) => (i % 2 ? <Text key={i} style={styles.phoneLink} accessibilityRole="link" onPress={() => callNumber(x)}>{x}</Text> : x));
}

const DAYS = [
  { id: "today", label: "Today", words: "today" },
  { id: "tomorrow", label: "Tomorrow", words: "tomorrow" },
  { id: "sat", label: "Sat", words: "saturday" },
  { id: "sun", label: "Sun", words: "sunday" },
];
const TIMES = [
  { id: "morning", label: "Morning", words: "10am to 2pm" },
  { id: "afternoon", label: "Afternoon", words: "1pm to 6pm" },
  { id: "evening", label: "Evening", words: "6pm to 11pm" },
  { id: "day", label: "All day", words: "10am to 9pm" },
];

function PlanSheet({ open, onClose, defaultText, canBalance, onMake }: { open: boolean; onClose: () => void; defaultText: string; canBalance: boolean; onMake: (text: string, meetInMiddle: boolean) => void }) {
  const [day, setDay] = useState("sat");
  const [time, setTime] = useState("afternoon");
  const [what, setWhat] = useState(defaultText);
  const [middle, setMiddle] = useState(true);
  useEffect(() => { if (open) setWhat(defaultText); }, [open, defaultText]);
  const text = `${what}, ${DAYS.find((d) => d.id === day)!.words}, ${TIMES.find((t) => t.id === time)!.words}`;
  return (
    <Sheet open={open} onClose={onClose} title="Plan a hangout" testID="plan-sheet" background={palette.paper}>
      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 8 }}>
        <View style={{ gap: 8 }}>
          <Text style={styles.sheetLabel}>WHEN</Text>
          <View style={styles.chips}>{DAYS.map((d) => <Chip key={d.id} testID={`plan-day-${d.id}`} label={d.label} on={day === d.id} onPress={() => setDay(d.id)} />)}</View>
          <View style={styles.chips}>{TIMES.map((t) => <Chip key={t.id} testID={`plan-time-${t.id}`} label={t.label} on={time === t.id} onPress={() => setTime(t.id)} />)}</View>
        </View>
        <View style={{ gap: 8 }}>
          <Text style={styles.sheetLabel}>WHAT</Text>
          <TextInput testID="plan-what" value={what} onChangeText={setWhat} style={styles.sheetInput} placeholder="pickleball then hot pot" placeholderTextColor={palette.inkMuted} />
        </View>
        <View style={styles.middleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.middleTitle}>Meet in the middle</Text>
            <Text style={styles.middleSub}>{canBalance ? "The first stop is fair to everyone's starting point." : "Works once two people set where they start (group info)."}</Text>
          </View>
          <Switch testID="plan-middle" value={middle && canBalance} disabled={!canBalance} onValueChange={setMiddle} trackColor={{ true: palette.rose, false: palette.line }} />
        </View>
        <PrimaryButton testID="plan-make" label="Make the ticket" icon="ticket" onPress={() => onMake(text, middle && canBalance)} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: palette.paper },
  headerMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  emoji: { width: 38, height: 38, borderRadius: 11, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-5deg" }] },
  title: { fontFamily: font.display, fontSize: 18, color: palette.ink },
  sub: { fontFamily: font.sans, fontSize: 12.5, color: palette.inkMuted },
  pinned: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 12, marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: palette.sunsetTint, borderWidth: 1, borderColor: "#F6CBA8" },
  pinnedStub: { width: 30, height: 30, borderRadius: 8, backgroundColor: palette.sunset, alignItems: "center", justifyContent: "center" },
  pinnedText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.ink },
  pinnedSub: { fontFamily: font.sans, fontSize: 12, color: palette.sunsetInk, fontWeight: "600" },
  localNote: { flexDirection: "row", gap: 6, alignItems: "center", marginHorizontal: 12, marginTop: 8, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: palette.sunsetTint },
  localText: { flex: 1, fontFamily: font.sans, fontSize: 12.5, color: palette.sunsetInk },
  intro: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 30, gap: 6 },
  introTitle: { fontFamily: font.display, fontSize: 22, color: palette.ink, textAlign: "center" },
  introBody: { fontFamily: font.sans, fontSize: 14, color: palette.inkSoft, textAlign: "center" },
  thinking: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, fontStyle: "italic", paddingLeft: 6 },
  noteRow: { alignSelf: "center", fontFamily: font.sans, fontSize: 12.5, color: palette.inkMuted, textAlign: "center", paddingVertical: 4, paddingHorizontal: 20 },
  change: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.lavTint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, maxWidth: "92%" },
  changeText: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: palette.lavInk, flexShrink: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3, marginLeft: 4 },
  name: { fontFamily: font.sans, fontSize: 12, fontWeight: "700", color: palette.inkSoft, marginBottom: 3 },
  favesDisc: { width: 16, height: 16, borderRadius: 8, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  mine: { backgroundColor: palette.ink, borderBottomRightRadius: 5 },
  theirs: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderBottomLeftRadius: 5 },
  faves: { backgroundColor: palette.roseTint, borderBottomLeftRadius: 5 },
  text: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: palette.ink },
  phoneLink: { fontWeight: "700", textDecorationLine: "underline" },
  voice: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginRight: 10, borderWidth: 1, borderColor: palette.line },
  voiceOn: { backgroundColor: palette.roseInk, borderColor: palette.roseInk },
  // Never squeezed by a long chat: the message list shrinks, the chips keep their height.
  asks: { flexGrow: 0, flexShrink: 0, backgroundColor: palette.paper },
  asksRow: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2, gap: 6, alignItems: "center" },
  asksLabel: { flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 2 },
  asksName: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.roseInk },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.paper },
  planButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.sunset, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] },
  input: { flex: 1, minHeight: 40, maxHeight: 120, borderRadius: 20, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontFamily: font.sans, fontSize: 16, color: palette.ink },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center" },
  sheetLabel: { fontFamily: font.sans, fontSize: 11.5, fontWeight: "800", letterSpacing: 0.8, color: palette.inkMuted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetInput: { height: 46, borderRadius: 12, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, fontFamily: font.sans, fontSize: 16, color: palette.ink },
  middleRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.lavTint, borderRadius: 12, padding: 12 },
  middleTitle: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.ink },
  middleSub: { fontFamily: font.sans, fontSize: 12.5, color: palette.inkSoft, marginTop: 2 },
});

export { currentTicket };
