// Search: spots and days. Live suggestions as little postcards with their Locals Score, quick
// add to a plan, save (a heart) and hide; submitted results call out hidden gems; no results
// suggests other words, adding a spot, or planning a day instead.
// Calling out hidden gems with the reason is inspired by Corner; recovering from no results
// with suggestions is inspired by Yelp.
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CornerCard } from "@/components/cards";
import { answerLine, arrangeHits, browse, refinements, searchDays, searchSpots, type BrowseChip, type ResultTab } from "@/components/search/match";
import { Sheet } from "@/components/Sheet";
import { ErrorState, Icon, OfflineBanner, PlaceImage, PrimaryButton, SampleTag, SkeletonRows, Toast, type IconName } from "@/components/ui";
import { scoreOutOf10 } from "@/lib/score";
import type { Place } from "@/data/types";
import { communityDays, type CommunityDay } from "@/lib/community";
import { useCity } from "@/state/city";
import { useCityClock, useOnline } from "@/state/device";
import { actions, momentsMoneyActions, setState, useStore } from "@/state/store";
import { categoryInfo, color, font, palette, shadow } from "@/theme/tokens";

type Kind = "spots" | "days";
const CHIPS: { id: BrowseChip; label: string; icon: IconName; title: string; tab: ResultTab }[] = [
  { id: "recs", label: "Recs", icon: "heart", title: "Recs for you", tab: "foryou" },
  { id: "trending", label: "Trending", icon: "trending-up", title: "Trending", tab: "popular" },
  { id: "gems", label: "Hidden gems", icon: "diamond", title: "Hidden gems", tab: "gems" },
  { id: "open", label: "Open now", icon: "time", title: "Open now", tab: "open" },
];
const TABS: { id: ResultTab; label: string }[] = [
  { id: "foryou", label: "for you" },
  { id: "popular", label: "popular" },
  { id: "gems", label: "hidden gems" },
  { id: "open", label: "open now" },
];
const ALSO = ["Hot pot", "Pickleball", "Sunset views", "Coffee", "Date night", "Museums"];
const noOutline = Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null;

export default function Search() {
  const params = useLocalSearchParams<{ q?: string; tab?: string }>();
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const interests = useStore((s) => s.profile.interests);
  const recent = useStore((s) => s.recentSearches);
  const [kind, setKind] = useState<Kind>(params.tab === "days" ? "days" : "spots");
  const [q, setQ] = useState(params.q ?? "");
  const [submitted, setSubmitted] = useState<string | null>(params.q ? params.q : null);
  const [chip, setChip] = useState<BrowseChip | null>(null);
  const [tab, setTab] = useState<ResultTab>("foryou");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [days, setDays] = useState<CommunityDay[] | null>(null);
  const [note, setNote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  // Community days are built by the planner; do it after first paint.
  useEffect(() => {
    if (!city || kind !== "days") return;
    const t = setTimeout(() => setDays(communityDays(city)), 30);
    return () => clearTimeout(t);
  }, [city, kind]);

  const live = useMemo(() => (city && q.trim() && kind === "spots" ? searchSpots(city, q) : null), [city, q, kind]);
  const result = useMemo(() => (city && submitted ? searchSpots(city, submitted) : null), [city, submitted]);
  const shown = useMemo(() => (result ? arrangeHits(result, tab, interests, clock.day, clock.minutes) : []), [result, tab, interests, clock.day, clock.minutes]);
  const browsing = useMemo(() => (city && chip ? browse(city, chip, interests, clock.day, clock.minutes) : null), [city, chip, interests, clock.day, clock.minutes]);
  const suggested = useMemo(() => (city ? browse(city, "recs", interests, clock.day, clock.minutes).filter((p) => !dismissed.includes(p.id)).slice(0, 12) : []), [city, interests, clock.day, clock.minutes, dismissed]);
  const dayHits = useMemo(() => (city && days ? searchDays(days, city, q) : null), [city, days, q]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    actions.addSearch(t);
    setQ(t);
    setTab(chip ? CHIPS.find((c) => c.id === chip)!.tab : "foryou");
    setSubmitted(t);
  };
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const removeRecent = (t: string) => setState((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== t) }));
  const planIt = (t: string) => router.push(`/builder?q=${encodeURIComponent(t)}`);

  if (status === "loading" || !city) {
    return (
      <SafeAreaView style={styles.screen} testID="search-loading">
        {status === "error" ? <View style={{ flex: 1, justifyContent: "center" }}><ErrorState body={error ?? "Check your connection and try again."} onRetry={retry} /></View> : <SkeletonRows rows={6} />}
      </SafeAreaView>
    );
  }
  if (status === "error") {
    return <SafeAreaView style={[styles.screen, { justifyContent: "center" }]} testID="search-error"><ErrorState body={error ?? "Check your connection and try again."} onRetry={retry} /></SafeAreaView>;
  }

  // ---- Corner results ---------------------------------------------------------------
  if (submitted && result && kind === "spots") {
    const more = refinements(result, submitted);
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]} testID="search-results">
        <LinearGradient colors={["#FFFFFF", "#EEF3F9"]} style={StyleSheet.absoluteFill} />
        <View style={styles.resultsTop}>
          <Pressable testID="results-back" accessibilityRole="button" accessibilityLabel="Edit search" hitSlop={10} onPress={() => { setSubmitted(null); setTimeout(() => input.current?.focus(), 50); }}>
            <Icon name="chevron-back" size={28} tint={palette.ink} />
          </Pressable>
          <Pressable testID="results-query" accessibilityRole="button" accessibilityLabel={`Search: ${submitted}. Edit`} onPress={() => { setSubmitted(null); setTimeout(() => input.current?.focus(), 50); }} style={[styles.bubble, shadow.soft]}>
            <Text style={styles.bubbleText}>{submitted}</Text>
          </Pressable>
        </View>
        {result.hits.length ? (
          <>
            <Text testID="results-answer" style={styles.answer}>{answerLine(result.hits.length, result, submitted)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cTabs} style={{ flexGrow: 0, flexShrink: 0 }}>
              {TABS.map((t) => (
                <Pressable key={t.id} testID={`results-tab-${t.id}`} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} onPress={() => setTab(t.id)} style={styles.cTab}>
                  <Text style={[styles.cTabText, tab === t.id && styles.cTabOn]}>{t.label}</Text>
                  {tab === t.id ? <View style={styles.cTabLine} /> : null}
                </Pressable>
              ))}
            </ScrollView>
            <FlatList
              data={shown}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 150 + insets.bottom }}
              ListHeaderComponent={
                <Pressable testID="search-plan-day" accessibilityRole="button" onPress={() => planIt(submitted)} style={[styles.planPill, shadow.soft]}>
                  <Icon name="sparkles" size={16} tint={color.brand} />
                  <Text style={styles.planPillText}>Plan a day for this</Text>
                  <Icon name="chevron-forward" size={16} tint={color.brand} />
                </Pressable>
              }
              ListEmptyComponent={<Text testID="results-tab-empty" style={styles.tabEmpty}>{tab === "gems" ? "None of these are hidden gems. Try for you or popular." : tab === "open" ? "None of these are open right now." : "Nothing here."}</Text>}
              renderItem={({ item, index }) => <CornerCard testID={`result-card-${index}`} place={item} />}
            />
            <View style={[styles.specific, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.specificHead}>
                <Icon name="chatbubble-ellipses-outline" size={22} tint={palette.inkMuted} />
                <Text style={styles.specificText}>get more specific</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 4 }}>
                {more.map((m, i) => (
                  <Pressable key={m.label} testID={`more-chip-${i}`} accessibilityRole="button" onPress={() => submit(m.query)} style={[styles.moreChip, shadow.soft]}>
                    <Text style={styles.moreChipText}>{m.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </>
        ) : (
          <NoResults query={submitted} onPick={(t) => submit(t)} onAdd={() => setNote(true)} onPlan={() => planIt(submitted)} />
        )}
        {!online ? <OfflineBanner /> : null}
        <AddSpotSheet open={note} onClose={() => setNote(false)} query={submitted} city={city.slug} onSaved={() => { setNote(false); setToast("Saved on this phone. It reaches us once accounts launch."); }} />
        <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 8} />
      </View>
    );
  }

  // ---- Beli search home + live suggestions --------------------------------------------
  const typing = q.trim().length > 0;
  const filterByChip = (ps: Place[]) => (chip && browsing ? ps.filter((p) => browsing.some((b) => b.id === p.id)) : ps);
  const liveRows = live ? filterByChip(live.hits).slice(0, 8) : [];
  const listTitle = chip ? `${CHIPS.find((c) => c.id === chip)!.title} in ${city.name}` : `Spots you may like in ${city.name}`;
  const listRows = chip ? browsing ?? [] : suggested;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="search-screen">
      <View style={styles.head}>
        <Text style={styles.wordmark}>search</Text>
        <Pressable testID="search-close" accessibilityRole="button" accessibilityLabel="Close search" hitSlop={8} onPress={close} style={styles.closeCircle}>
          <Icon name="close" size={20} tint={palette.inkMuted} />
        </Pressable>
      </View>
      <View style={styles.kinds}>
        {(["spots", "days"] as const).map((k) => (
          <Pressable key={k} testID={`search-tab-${k}`} accessibilityRole="tab" accessibilityState={{ selected: kind === k }} onPress={() => setKind(k)} style={[styles.kind, kind === k && styles.kindOn]}>
            <Icon name={k === "spots" ? "location-outline" : "map-outline"} size={20} tint={kind === k ? color.brand : "#3A3A3C"} />
            <Text style={[styles.kindText, kind === k && { color: color.brand }]}>{k === "spots" ? "Spots" : "Days"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.field}>
        <Icon name="search" size={22} tint={palette.inkSoft} />
        <TextInput
          ref={input}
          testID="search-input"
          accessibilityLabel={kind === "spots" ? "Search spots" : "Search days"}
          value={q}
          onChangeText={setQ}
          autoFocus={!params.q}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => (kind === "spots" ? submit(q) : undefined)}
          placeholder={kind === "spots" ? "Search spots, food, activities" : "Search days by name or stop"}
          placeholderTextColor={palette.inkMuted}
          style={[styles.fieldInput, noOutline]}
        />
        {typing ? <Pressable testID="search-clear" accessibilityLabel="Clear" hitSlop={8} onPress={() => setQ("")}><Icon name="close" size={20} tint={palette.inkMuted} /></Pressable> : null}
      </View>
      <Pressable testID="search-city" accessibilityRole="button" accessibilityLabel={`City: ${city.name}. Change`} onPress={() => router.push("/city")} style={[styles.field, { marginTop: 10 }]}>
        <Icon name="location" size={20} tint={palette.inkSoft} />
        <Text style={[styles.fieldInput, { color: palette.ink }]}>{city.name}</Text>
        <Icon name="chevron-down" size={18} tint={palette.inkMuted} />
      </Pressable>

      {kind === "spots" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0, flexShrink: 0 }}>
          {CHIPS.map((c) => {
            const on = chip === c.id;
            return (
              <Pressable key={c.id} testID={`search-chip-${c.id}`} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setChip(on ? null : c.id)} style={[styles.chip, { backgroundColor: on ? color.brand : color.chipBeliOff }]}>
                <Icon name={c.icon} size={15} tint="#fff" />
                <Text style={styles.chipText}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        {kind === "days" ? (
          dayHits == null ? <SkeletonRows rows={4} testID="days-loading" /> : (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.section}>{typing ? `Days matching "${q.trim()}"` : `Popular days in ${city.name}`}</Text>
                <SampleTag text="Sample people" />
              </View>
              {dayHits.length ? dayHits.map((d, i) => (
                <Pressable key={d.id} testID={`day-row-${i}`} accessibilityRole="button" accessibilityLabel={d.plan.title} onPress={() => router.push(`/day/${encodeURIComponent(d.id)}`)} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName} numberOfLines={1}>{d.plan.title}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>{d.plan.stops.map((s) => city.byId.get(s.placeId)?.name).filter(Boolean).join(", ")}</Text>
                  </View>
                  <Text style={styles.rowMeta}>{d.plan.stops.length} stops</Text>
                  <Icon name="chevron-forward" size={18} tint={palette.inkMuted} />
                </Pressable>
              )) : (
                <View style={styles.noDays} testID="days-empty">
                  <Text style={styles.noDaysTitle}>No days match "{q.trim()}"</Text>
                  <Text style={styles.noDaysBody}>Try a stop's name, or plan this day yourself.</Text>
                  <PrimaryButton testID="days-plan" label="Plan a day for this" icon="sparkles" onPress={() => planIt(q)} style={{ marginTop: 16 }} />
                </View>
              )}
            </>
          )
        ) : typing ? (
          <>
            <Pressable testID="search-submit-row" accessibilityRole="button" onPress={() => submit(q)} style={styles.row}>
              <View style={styles.rowIcon}><Icon name="search" size={18} tint={color.brand} /></View>
              <Text style={[styles.rowName, { flex: 1 }]} numberOfLines={1}>Search "{q.trim()}"</Text>
              <Icon name="arrow-forward" size={18} tint={palette.inkMuted} />
            </Pressable>
            <Pressable testID="search-plan-row" accessibilityRole="button" onPress={() => planIt(q)} style={styles.row}>
              <View style={styles.rowIcon}><Icon name="sparkles" size={18} tint={color.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>Plan a day for this</Text>
                <Text style={styles.rowSub} numberOfLines={1}>The planner builds a whole day around "{q.trim()}"</Text>
              </View>
              <Icon name="arrow-forward" size={18} tint={palette.inkMuted} />
            </Pressable>
            {liveRows.map((p, i) => <SpotRow key={p.id} place={p} index={i} />)}
            {live && !liveRows.length ? <Text testID="search-no-live" style={styles.hint}>No spot names match yet. Press search to look through what locals say too.</Text> : null}
          </>
        ) : (
          <>
            {recent.length && !chip ? (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.section}>Recent searches</Text>
                  <Pressable testID="recent-clear" accessibilityRole="button" hitSlop={8} onPress={actions.clearSearches}><Text style={styles.clear}>Clear</Text></Pressable>
                </View>
                {recent.map((t, i) => (
                  <Pressable key={t} testID={`recent-${i}`} accessibilityRole="button" accessibilityLabel={`Search ${t}`} onPress={() => submit(t)} style={styles.row}>
                    <View style={styles.rowIcon}><Icon name="time-outline" size={18} tint={palette.inkMuted} /></View>
                    <Text style={[styles.rowName, { flex: 1 }]} numberOfLines={1}>{t}</Text>
                    <Pressable testID={`recent-remove-${i}`} accessibilityLabel={`Remove ${t}`} hitSlop={10} onPress={() => removeRecent(t)}><Icon name="close" size={20} tint={palette.inkMuted} /></Pressable>
                  </Pressable>
                ))}
              </>
            ) : null}
            <Text style={[styles.section, { marginTop: 18 }]}>{listTitle}</Text>
            {listRows.length ? listRows.map((p, i) => <SpotRow key={p.id} place={p} index={i} onDismiss={chip ? undefined : () => setDismissed((d) => [...d, p.id])} />) : (
              <Text testID="search-list-empty" style={styles.hint}>{chip === "open" ? "Nothing with listed hours is open right now." : "Nothing to show yet."}</Text>
            )}
          </>
        )}
      </ScrollView>
      {!online ? <OfflineBanner /> : null}
    </SafeAreaView>
  );
}

// A result: a little postcard of the spot, its name and where it is, its Locals Score stamp,
// then add to a plan, save (a heart) and hide.
function SpotRow({ place, index, onDismiss }: { place: Place; index: number; onDismiss?: () => void }) {
  const saved = useStore((s) => s.saved.includes(place.id));
  const sub = [place.hood, place.kind ?? categoryInfo(place.category).label].filter(Boolean).join(", ");
  return (
    <Pressable testID={`search-row-${index}`} accessibilityRole="button" accessibilityLabel={place.name} onPress={() => router.push(`/place/${encodeURIComponent(place.id)}`)} style={styles.row}>
      <View style={[styles.rowCard, { transform: [{ rotate: `${index % 2 ? 3 : -3}deg` }] }]}>
        <PlaceImage uri={place.image} category={place.category} style={styles.rowPhoto} emojiSize={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{place.unrated ? sub : `${scoreOutOf10(place.locals)} locals · ${sub}`}</Text>
      </View>
      <Pressable testID={`search-row-add-${index}`} accessibilityLabel={`Add ${place.name} to a day`} hitSlop={6} onPress={() => router.push(`/builder?place=${encodeURIComponent(place.id)}`)} style={styles.rowBtn}>
        <Icon name="add" size={18} tint={palette.ink} />
      </Pressable>
      <Pressable testID={`search-row-save-${index}`} accessibilityLabel={saved ? `Unsave ${place.name}` : `Save ${place.name}`} hitSlop={6} onPress={() => actions.toggleSave(place.id)} style={[styles.rowBtn, saved && { backgroundColor: palette.roseTint }]}>
        <Icon name={saved ? "heart" : "heart-outline"} size={17} tint={palette.roseInk} />
      </Pressable>
      {onDismiss ? (
        <Pressable testID={`search-row-dismiss-${index}`} accessibilityLabel={`Hide ${place.name}`} hitSlop={6} onPress={onDismiss}>
          <Icon name="close" size={18} tint={palette.inkMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

// Yelp's no-results recovery.
function NoResults({ query, onPick, onAdd, onPlan }: { query: string; onPick: (t: string) => void; onAdd: () => void; onPlan: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.none} testID="no-results">
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.noneTitle}>Sorry, we couldn't find any spots for "{query}"</Text>
          <Text style={styles.noneHelp}>Try a different word, a whole neighborhood, or plan a day around it.</Text>
        </View>
        <Icon name="storefront-outline" size={34} tint="#D32323" />
      </View>
      <Text style={styles.noneHead}>People also search for</Text>
      <View style={styles.noneChips}>
        {ALSO.map((t, i) => (
          <Pressable key={t} testID={`also-${i}`} accessibilityRole="button" onPress={() => onPick(t)} style={styles.noneChip}><Text style={styles.noneChipText}>{t}</Text></Pressable>
        ))}
      </View>
      <Pressable testID="no-results-plan" accessibilityRole="button" onPress={onPlan} style={[styles.planPill, shadow.soft, { marginTop: 18 }]}>
        <Icon name="sparkles" size={16} tint={color.brand} />
        <Text style={styles.planPillText}>Plan a day for this</Text>
        <Icon name="chevron-forward" size={16} tint={color.brand} />
      </Pressable>
      <View style={styles.noneLine} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.missing}>Notice something missing here?</Text>
          <Pressable testID="add-spot" accessibilityRole="button" onPress={onAdd} style={styles.addSpot}><Text style={styles.addSpotText}>Add a spot</Text></Pressable>
        </View>
        <View style={styles.addTile}><Text style={{ fontSize: 44 }}>📍</Text></View>
      </View>
    </ScrollView>
  );
}

function AddSpotSheet({ open, onClose, query, city, onSaved }: { open: boolean; onClose: () => void; query: string; city: string; onSaved: () => void }) {
  const [text, setText] = useState(query);
  useEffect(() => { if (open) setText(query); }, [open, query]);
  return (
    <Sheet open={open} onClose={onClose} title="Add a spot" testID="add-spot-sheet">
      <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}>
        <Text style={styles.sheetBody}>Faves lists the spots locals share. Tell us the name and neighborhood of what's missing and we'll add it.</Text>
        <TextInput testID="add-spot-input" value={text} onChangeText={setText} placeholder="Name and neighborhood" placeholderTextColor={palette.inkMuted} multiline style={[styles.sheetInput, noOutline]} />
        <PrimaryButton testID="add-spot-save" label="Save note" disabled={!text.trim()} onPress={() => { momentsMoneyActions.addSpotNote({ id: `note-${Date.now().toString(36)}`, city, query, text: text.trim(), at: new Date().toISOString() }); onSaved(); }} />
        <Text style={styles.sheetFine}>Notes stay on this phone until accounts launch.</Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  head: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  wordmark: { fontFamily: font.displayHeavy, fontSize: 34, color: palette.ink, letterSpacing: -1 },
  closeCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: palette.paperDeep, alignItems: "center", justifyContent: "center" },
  kinds: { flexDirection: "row", marginTop: 8 },
  kind: { flex: 1, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderBottomWidth: 2.5, borderBottomColor: "transparent" },
  kindOn: { borderBottomColor: color.brand },
  kindText: { fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: palette.inkSoft },
  field: { marginHorizontal: 12, marginTop: 16, height: 49, borderRadius: 4, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 14 },
  fieldInput: { flex: 1, fontFamily: font.sans, fontSize: 17, color: palette.ink, paddingVertical: 0 },
  chips: { paddingHorizontal: 16, gap: 8, paddingTop: 14, paddingBottom: 4 },
  chip: { height: 32, borderRadius: 16, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 6 },
  chipText: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "500" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 16, marginTop: 18 },
  section: { fontFamily: font.sans, fontSize: 18, fontWeight: "700", color: palette.ink, paddingHorizontal: 16, flexShrink: 1 },
  clear: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: color.brand },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line },
  rowCard: { width: 46, height: 56, backgroundColor: palette.card, borderRadius: 5, padding: 3, paddingBottom: 9, borderWidth: 1, borderColor: palette.line, shadowColor: palette.ink, shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
  rowPhoto: { flex: 1, borderRadius: 3, overflow: "hidden" },
  rowBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: palette.paperDeep, alignItems: "center", justifyContent: "center" },
  rowIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: palette.paperDeep, alignItems: "center", justifyContent: "center", marginRight: -4 },
  rowName: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: palette.ink },
  rowSub: { fontFamily: font.sans, fontSize: 14, color: palette.inkMuted, marginTop: 3 },
  rowMeta: { fontFamily: font.sans, fontSize: 14, color: palette.inkMuted },
  hint: { fontFamily: font.sans, fontSize: 14, color: palette.inkMuted, paddingHorizontal: 16, paddingTop: 14 },
  noDays: { paddingHorizontal: 16, paddingTop: 22 },
  noDaysTitle: { fontFamily: font.sans, fontSize: 18, fontWeight: "700", color: palette.ink },
  noDaysBody: { fontFamily: font.sans, fontSize: 15, color: palette.inkMuted, marginTop: 6 },
  resultsTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 12, paddingTop: 10 },
  bubble: { flex: 1, marginLeft: 24, backgroundColor: palette.paper, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleText: { fontFamily: font.sans, fontSize: 18, lineHeight: 24, color: palette.ink },
  answer: { fontFamily: font.sans, fontSize: 17, lineHeight: 23, color: palette.inkSoft, paddingHorizontal: 16, marginTop: 18 },
  cTabs: { paddingHorizontal: 16, gap: 22, marginTop: 14 },
  cTab: { paddingBottom: 8 },
  cTabText: { fontFamily: font.sans, fontSize: 18, color: palette.ink },
  cTabOn: { fontWeight: "800" },
  cTabLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 2.5, backgroundColor: "#000", borderRadius: 1 },
  tabEmpty: { fontFamily: font.sans, fontSize: 15, color: palette.inkSoft, paddingVertical: 20 },
  planPill: { alignSelf: "flex-start", height: 34, borderRadius: 17, backgroundColor: palette.card, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13 },
  planPillText: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: color.brand },
  specific: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: palette.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 14, ...(shadow.card as object) },
  specificHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, marginBottom: 10 },
  specificText: { fontFamily: font.sans, fontSize: 18, color: palette.inkMuted },
  moreChip: { height: 34, borderRadius: 17, backgroundColor: palette.card, paddingHorizontal: 14, justifyContent: "center" },
  moreChipText: { fontFamily: font.sans, fontSize: 16, color: palette.ink },
  none: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  noneTitle: { fontFamily: font.sans, fontSize: 21, lineHeight: 27, fontWeight: "800", color: palette.ink },
  noneHelp: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: palette.inkMuted, marginTop: 8 },
  noneHead: { fontFamily: font.sans, fontSize: 19, fontWeight: "800", color: palette.ink, marginTop: 28 },
  noneChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  noneChip: { height: 34, borderRadius: 17, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, paddingHorizontal: 14, justifyContent: "center" },
  noneChipText: { fontFamily: font.sans, fontSize: 14, fontWeight: "600", color: palette.ink },
  noneLine: { height: 1, backgroundColor: palette.paperDeep, marginVertical: 24 },
  missing: { fontFamily: font.sans, fontSize: 17, lineHeight: 22, fontWeight: "800", color: palette.ink },
  addSpot: { alignSelf: "flex-start", marginTop: 14, height: 40, borderRadius: 4, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 16, justifyContent: "center" },
  addSpotText: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: palette.ink },
  addTile: { width: 110, height: 96, borderRadius: 4, backgroundColor: palette.paperDeep, alignItems: "center", justifyContent: "center" },
  sheetBody: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: palette.inkSoft },
  sheetInput: { minHeight: 80, borderRadius: 8, borderWidth: 1, borderColor: palette.line, padding: 12, fontFamily: font.sans, fontSize: 16, color: palette.ink, textAlignVertical: "top" },
  sheetFine: { fontFamily: font.sans, fontSize: 12, color: palette.inkMuted, textAlign: "center" },
});
