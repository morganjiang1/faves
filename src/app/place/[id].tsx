// A spot's page, on cream paper: a big postcard at the top playing the spot's clips (swipe
// sideways for its other clips and photos), the Locals Score stamp on its corner, then the
// name, a one-line vibe, open now and cost, the best thing a local said, the logistics, the
// spot's postcard wall, where the score comes from, and a sticky bar: Add to a plan, Send to
// a chat.
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ListViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pagesFor, playCount } from "@/components/moments/clips";
import { useSharedMoments } from "@/chat/moments";
import { SendToChat, type SendItem } from "@/components/chat/SendToChat";
import { Postmark } from "@/components/postcard/Postcard";
import { ShareSheet } from "@/components/ShareSheet";
import { PageMedia, PageThumb } from "@/components/spot/media";
import { EmptyState, ErrorState, Icon, OfflineBanner, PrimaryButton, SecondaryButton, Skeleton, Stamp, Toast, UserDisc, type IconName } from "@/components/ui";
import { services } from "@/lib/adapters";
import { livePlace, type LivePlace } from "@/lib/adapters/places";
import { dayHoursText, statusAt, weekLines } from "@/lib/hours";
import { callNumber, openDirections, openUrl, shareUrl } from "@/lib/links";
import { compact, costOf, gemLine, scoreOutOf10, signalCount, vibeLine, bestQuote } from "@/lib/score";
import { DAY_NAMES } from "@/lib/time";
import { useCity } from "@/state/city";
import { useCityClock, useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { font, palette, shadow } from "@/theme/tokens";

export default function PlacePage() {
  const { id, reserve, i } = useLocalSearchParams<{ id: string; reserve?: string; i?: string }>();
  const placeId = decodeURIComponent(String(id));
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const focused = useIsFocused();
  const saved = useStore((s) => s.saved.includes(placeId));
  const mine = useStore((s) => s.moments[placeId]);
  const shared = useSharedMoments(placeId);
  const hidden = useStore((s) => s.hidden);
  const transport = useStore((s) => s.profile.transport);
  const [page, setPage] = useState(Math.max(0, Number(i) || 0));
  const [share, setShare] = useState(false);
  const [send, setSend] = useState<SendItem | null>(null);
  const [week, setWeek] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [live, setLive] = useState<LivePlace | null>(null);

  const place = city?.byId.get(placeId) ?? null;
  useEffect(() => { if (reserve === "1" && place?.reserveUrl) openUrl(place.reserveUrl); }, [reserve, place]);
  useEffect(() => {
    if (!place || !online || !services.googlePlaces) return;
    let on = true;
    livePlace(place.id).then((g) => { if (on) setLive(g); });
    return () => { on = false; };
  }, [place, online]);
  const pages = useMemo(() => (place ? pagesFor(place, [...(mine ?? []), ...shared], hidden) : []), [place, mine, shared, hidden]);
  const onViewable = useMemo(() => ({ viewableItems }: { viewableItems: ListViewToken[] }) => { const f = viewableItems[0]; if (f?.index != null) setPage(f.index); }, []);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  if (status === "loading") {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60, alignItems: "center", gap: 16 }]} testID="place-loading">
        <Skeleton style={{ width: width - 36, height: (width - 36) * 1.2, borderRadius: 20 }} />
        <Skeleton style={{ width: "70%", height: 26 }} />
      </View>
    );
  }
  if (status === "error") return <View style={[styles.screen, { justifyContent: "center" }]}><ErrorState body={error ?? "Check your connection and try again."} onRetry={retry} /></View>;
  if (!place || !city) {
    return <View style={[styles.screen, { justifyContent: "center" }]} testID="place-missing"><EmptyState icon="location-outline" title="Spot not found" body={`We couldn't find this spot in ${city?.name ?? "this city"}. It may be in another city you've switched away from.`} cta="Back to Home" onCta={() => router.replace("/")} /></View>;
  }

  const cardW = Math.min(width, 520) - 36;
  const mediaW = cardW - 16;
  const st = statusAt(place, clock.day, clock.minutes);
  const cost = costOf(place);
  const gem = gemLine(place);
  const quote = bestQuote(place);
  const clipPages = pages.filter((p) => p.kind === "clip");
  const current = pages[Math.min(page, pages.length - 1)];
  const poster = current?.kind === "clip" ? current.moment : null;
  const directions = () => openDirections({ ...place }, transport);
  const toggleSave = () => { actions.toggleSave(place.id); setToast(saved ? "Removed from Saved" : `${place.name} saved`); };

  return (
    <View style={styles.screen} testID="place-page">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        {!online ? <OfflineBanner /> : null}
        {/* The postcard */}
        <View style={{ alignItems: "center" }}>
          <View style={[styles.card, { width: cardW }, shadow.card]}>
            <View style={{ width: mediaW, height: Math.round(mediaW * 1.25), borderRadius: 14, overflow: "hidden" }}>
              <FlatList
                data={pages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(p) => p.key}
                initialScrollIndex={Math.min(page, Math.max(0, pages.length - 1))}
                getItemLayout={(_, index) => ({ length: mediaW, offset: mediaW * index, index })}
                onViewableItemsChanged={onViewable}
                viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                renderItem={({ item, index }) => (
                  <View style={{ width: mediaW, height: Math.round(mediaW * 1.25) }} testID={`place-media-${index}`}>
                    <PageMedia page={item} place={place} active={focused && index === page && !share && !send} />
                  </View>
                )}
              />
              {poster ? (
                <View style={styles.poster} pointerEvents="none">
                  <UserDisc name={poster.mine ? "you" : poster.creator} size={20} />
                  <Text style={styles.posterText}>{poster.mine ? "You" : `@${poster.creator}`}</Text>
                  {poster.views ? <Text style={styles.posterMeta}>· {playCount(poster.views)} plays</Text> : null}
                </View>
              ) : null}
            </View>
            <View style={styles.cardFoot}>
              <Postmark text={[place.hood, place.kind].filter(Boolean).join(" · ")} />
              {pages.length > 1 ? (
                <View style={styles.dots} testID="place-dots">
                  {pages.map((p, k) => <View key={p.key} style={[styles.dot, k === page && styles.dotOn]} />)}
                </View>
              ) : null}
            </View>
          </View>
          {place.unrated ? null : (
            <View style={[styles.stamp, { right: 4 }]} testID="locals-score-row">
              <Stamp score={scoreOutOf10(place.locals)} count={compact(signalCount(place))} size={70} tilt={9} />
            </View>
          )}
        </View>

        {/* The name and the essentials */}
        <View style={styles.head}>
          <Text testID="place-name" style={styles.name}>{place.name}</Text>
          <Text style={styles.vibe}>{vibeLine(place)}{gem ? ` · ${gem}` : ""}</Text>
          <View style={styles.facts}>
            <Fact icon="time-outline" testID="open-status" tint={st.state === "open" ? palette.open : st.state === "closed" ? palette.sunsetInk : palette.inkSoft}
              text={st.state === "unknown" ? (place.court ? (place.court.lit ? "Lit at night" : "Daylight only") : "Hours not listed") : `${st.word}${st.detail ? ` · ${st.detail}` : ""}`} />
            <Fact icon="cash-outline" text={cost.dollars ?? (cost.perPerson === 0 && !cost.estimated ? "Free" : cost.estimated ? `About $${cost.perPerson} each` : cost.label)} />
            {clipPages.length ? <Fact icon="film-outline" text={`${clipPages.length} ${clipPages.length === 1 ? "clip" : "clips"}`} /> : null}
          </View>
        </View>

        {quote ? (
          <View style={styles.quote} testID="quotes-section">
            <Text style={styles.quoteMark}>“</Text>
            <Text style={styles.quoteText} testID="quote-0">{quote.text}</Text>
            <Pressable accessibilityRole="link" onPress={() => openUrl(quote.url)} hitSlop={6}>
              <Text style={styles.quoteSource}>r/{city.subreddit} · read the thread</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Logistics */}
        <View style={styles.block} testID="details-section">
          <Text style={styles.blockTitle}>getting there</Text>
          <Pressable testID="hours-row" onPress={() => setWeek((w) => !w)} style={styles.row}>
            <Icon name="time-outline" size={20} tint={palette.inkSoft} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>
                {st.state !== "unknown" ? <Text style={{ fontWeight: "800", color: st.state === "open" ? palette.open : palette.sunsetInk }}>{st.state === "open" ? "Open" : "Closed"}  </Text> : null}
                {place.hours ? `${DAY_NAMES[clock.day]}: ${dayHoursText(place.hours, clock.day)}` : place.court ? "No posted hours. Public courts are usually open dawn to dusk." : "Hours not listed. Call ahead."}
              </Text>
              {live?.openNow != null ? <Text style={styles.rowSub} testID="live-hours">Live from Google: {live.openNow ? "open now" : "closed now"}</Text> : null}
              {week && place.hours ? (
                <View style={{ marginTop: 8, gap: 3 }}>
                  {weekLines(place.hours).map((l, k) => (
                    <View key={l.day} style={{ flexDirection: "row" }}>
                      <Text style={[styles.week, { width: 96 }, k === clock.day && styles.weekToday]}>{l.day}</Text>
                      <Text style={[styles.week, { flex: 1 }, k === clock.day && styles.weekToday]}>{l.text}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
            {place.hours ? <Icon name={week ? "chevron-up" : "chevron-down"} size={16} tint={palette.inkMuted} /> : null}
          </Pressable>
          {place.court ? <Row icon="tennisball-outline" text={`${place.court.count} ${place.court.sport} ${place.court.count === 1 ? "court" : "courts"}${place.court.surface ? `, ${place.court.surface}` : ""}${place.court.lit ? ", lit at night" : ", no lights"}`} /> : null}
          <Row icon="cash-outline" text={cost.label} sub={cost.estimated ? `We plan on about $${cost.perPerson} per person.` : undefined} />
          <Row icon="location-outline" text={place.address ?? place.hood ?? `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`} action="Directions" onPress={directions} testID="address-row" />
          {place.phone ? <Row icon="call-outline" text={place.phone} action="Call" onPress={() => callNumber(place.phone)} testID="phone-row" /> : null}
          {place.website ? <Row icon="globe-outline" text={place.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} action="Open" onPress={() => openUrl(place.website)} testID="website-row" /> : null}
          {place.reserveUrl ? <Row icon="calendar-outline" text="Book a table" action="Reserve" onPress={() => openUrl(place.reserveUrl)} testID="reserve-row" /> : null}
          {place.description ? <Text style={styles.description}>{place.description}</Text> : null}
        </View>

        {/* The postcard wall */}
        <View style={styles.block}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[styles.blockTitle, { flex: 1 }]}>postcard wall</Text>
            <Pressable testID="moments-anchor" accessibilityRole="button" onPress={() => router.push(`/moments/${encodeURIComponent(place.id)}`)} hitSlop={8} style={styles.seeAll}>
              <Text style={styles.seeAllText}>see all</Text>
              <Icon name="arrow-forward" size={15} tint={palette.roseInk} />
            </Pressable>
          </View>
          <View style={styles.wall}>
            {pages.slice(0, 3).map((p, k) => (
              <Pressable key={p.key} testID={`wall-${k}`} accessibilityRole="button" onPress={() => router.push(`/moments/${encodeURIComponent(place.id)}`)} style={[styles.wallCard, { transform: [{ rotate: `${[-4, 3, -2][k]}deg` }] }]}>
                <View style={{ flex: 1, borderRadius: 7, overflow: "hidden" }}><PageThumb page={p} place={place} /></View>
              </Pressable>
            ))}
            <Pressable testID="post-moment" accessibilityRole="button" onPress={() => router.push(`/post-moment/${encodeURIComponent(place.id)}`)} style={[styles.wallCard, styles.wallPost]}>
              <View style={styles.record}><View style={styles.recordDot} /></View>
              <Text style={styles.wallPostText}>post one</Text>
            </Pressable>
          </View>
          <Text style={styles.rowSub}>Only from here, while it's open.</Text>
        </View>

        {/* Where the score comes from */}
        {place.unrated ? null : (
          <View style={styles.block} testID="scores-section">
            <Text style={styles.blockTitle}>where the score comes from</Text>
            <View style={styles.sources}>
              <Source testID="src-google" label="Google" value={place.google ? `★ ${place.google.rating.toFixed(1)}` : "-"} sub={place.google ? `${compact(place.google.count)} reviews` : "not rated"} />
              <Source testID="src-yelp" label="Yelp" value={place.yelp ? `★ ${place.yelp.rating.toFixed(1)}` : "-"} sub={place.yelp ? `${compact(place.yelp.count)} reviews` : "not listed"} />
              <Source testID="src-reddit" label="Reddit" value={place.reddit.mentions ? String(place.reddit.mentions) : "-"} sub={place.reddit.mentions ? "mentions" : "no mentions"} />
              <Source testID="src-tiktok" label="TikTok" value={place.tiktok.views ? compact(place.tiktok.views) : "-"} sub={place.tiktok.mentions ? "views" : "no posts"} />
            </View>
            <Text style={styles.rowSub}>Ratings from Google, Yelp and TripAdvisor; local mentions from r/{city.subreddit} and TikTok.</Text>
          </View>
        )}
        <Pressable testID="action-rank" accessibilityRole="button" onPress={() => router.push(`/rank?place=${encodeURIComponent(place.id)}`)} style={styles.rank}>
          <Icon name="ribbon-outline" size={20} tint={palette.lavInk} />
          <Text style={styles.rankText}>Been here? Rank it</Text>
          <Icon name="chevron-forward" size={16} tint={palette.lavInk} />
        </Pressable>
      </ScrollView>

      {/* Top buttons over the paper */}
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <Round testID="place-back" icon="chevron-back" label="Back" onPress={back} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Round testID="action-save" icon={saved ? "bookmark" : "bookmark-outline"} label={saved ? "Remove from Saved" : "Save"} onPress={toggleSave} tint={saved ? palette.roseInk : palette.ink} />
          <Round testID="action-share" icon="share-outline" label="Share" onPress={() => setShare(true)} />
          <Round testID="action-directions" icon="navigate-outline" label="Directions" onPress={directions} />
        </View>
      </View>

      {/* The sticky bar */}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PrimaryButton testID="add-to-day" label="Add to a plan" icon="ticket" onPress={() => router.push(`/builder?place=${encodeURIComponent(place.id)}`)} style={{ flex: 1 }} />
        <SecondaryButton testID="send-to-chat" compact label="Send to a chat" icon="paper-plane-outline" onPress={() => setSend({ kind: "place", placeId: place.id, name: place.name })} style={{ flex: 1, height: 52 }} />
      </View>

      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 54} />
      <SendToChat open={send != null} item={send} onClose={() => setSend(null)} onSent={setToast} />
      <ShareSheet open={share} onClose={() => setShare(false)} subtitle="Anyone with the link can see this spot" url={shareUrl(`/place/${encodeURIComponent(place.id)}`)} cardTitle={place.name} image={place.image} category={place.category} message={`${place.name} has a Locals Score of ${scoreOutOf10(place.locals)} on Faves`} />
    </View>
  );
}

function Round({ icon, label, onPress, testID, tint = palette.ink }: { icon: IconName; label: string; onPress: () => void; testID: string; tint?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={[styles.round, shadow.soft]}>
      <Icon name={icon} size={20} tint={tint} />
    </Pressable>
  );
}

function Fact({ icon, text, tint = palette.inkSoft, testID }: { icon: IconName; text: string; tint?: string; testID?: string }) {
  return (
    <View style={styles.fact} testID={testID}>
      <Icon name={icon} size={15} tint={tint} />
      <Text style={[styles.factText, { color: tint }]}>{text}</Text>
    </View>
  );
}

function Row({ icon, text, sub, action, onPress, testID }: { icon: IconName; text: string; sub?: string; action?: string; onPress?: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} disabled={!onPress} onPress={onPress} style={styles.row}>
      <Icon name={icon} size={20} tint={palette.inkSoft} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowText}>{text}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {action ? <Text style={styles.rowAction}>{action}</Text> : null}
    </Pressable>
  );
}

function Source({ label, value, sub, testID }: { label: string; value: string; sub: string; testID: string }) {
  return (
    <View style={styles.source} testID={testID}>
      <Text style={styles.sourceLabel}>{label}</Text>
      <Text style={[styles.sourceValue, value === "-" && { color: palette.inkMuted }]}>{value}</Text>
      <Text style={styles.sourceSub} numberOfLines={1}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 6 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: palette.card, borderRadius: 22, borderWidth: 1, borderColor: palette.line, padding: 8, transform: [{ rotate: "-1deg" }] },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4 },
  dots: { flexDirection: "row", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.line },
  dotOn: { backgroundColor: palette.roseInk, width: 16 },
  stamp: { position: "absolute", top: -14 },
  poster: { position: "absolute", left: 10, bottom: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(30,21,48,0.6)", borderRadius: 999, paddingLeft: 3, paddingRight: 10, paddingVertical: 3 },
  posterText: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.cream },
  posterMeta: { fontFamily: font.sans, fontSize: 12, color: palette.creamSoft },
  head: { paddingHorizontal: 20, paddingTop: 22, gap: 6 },
  name: { fontFamily: font.displayHeavy, fontSize: 32, lineHeight: 36, color: palette.ink, letterSpacing: -0.8 },
  vibe: { fontFamily: font.sans, fontSize: 16, color: palette.inkSoft },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  fact: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: palette.card, borderRadius: 999, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 10, paddingVertical: 6 },
  factText: { fontFamily: font.sans, fontSize: 13.5, fontWeight: "700" },
  quote: { marginHorizontal: 18, marginTop: 20, padding: 16, paddingTop: 10, borderRadius: 16, backgroundColor: palette.sunsetTint, transform: [{ rotate: "0.6deg" }] },
  quoteMark: { fontFamily: font.displayHeavy, fontSize: 44, lineHeight: 44, color: palette.sunset },
  quoteText: { fontFamily: font.display, fontSize: 18, lineHeight: 24, color: palette.ink, marginTop: -8 },
  quoteSource: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.sunsetInk, marginTop: 10 },
  block: { marginHorizontal: 18, marginTop: 20, padding: 14, borderRadius: 16, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, gap: 4 },
  blockTitle: { fontFamily: font.display, fontSize: 19, color: palette.ink, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  rowText: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: palette.ink },
  rowSub: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 2 },
  rowAction: { fontFamily: font.sans, fontSize: 15, fontWeight: "800", color: palette.roseInk },
  week: { fontFamily: font.sans, fontSize: 14, color: palette.inkSoft },
  weekToday: { color: palette.ink, fontWeight: "800" },
  description: { fontFamily: font.sans, fontSize: 15, lineHeight: 21, color: palette.inkSoft, paddingTop: 8 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 3 },
  seeAllText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.roseInk },
  wall: { flexDirection: "row", gap: 10, paddingVertical: 10 },
  wallCard: { flex: 1, aspectRatio: 0.78, backgroundColor: palette.card, borderRadius: 9, borderWidth: 1, borderColor: palette.line, padding: 4 },
  wallPost: { alignItems: "center", justifyContent: "center", gap: 6, borderStyle: "dashed", borderColor: palette.rose, backgroundColor: palette.roseTint },
  wallPostText: { fontFamily: font.sans, fontSize: 12.5, fontWeight: "800", color: palette.roseInk },
  record: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(201,42,79,0.25)", alignItems: "center", justifyContent: "center" },
  recordDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.roseInk },
  sources: { flexDirection: "row", gap: 8, paddingVertical: 6 },
  source: { flex: 1, backgroundColor: palette.paper, borderRadius: 12, padding: 8, gap: 1 },
  sourceLabel: { fontFamily: font.sans, fontSize: 11.5, fontWeight: "800", color: palette.inkMuted, letterSpacing: 0.3 },
  sourceValue: { fontFamily: font.display, fontSize: 18, color: palette.ink },
  sourceSub: { fontFamily: font.sans, fontSize: 11, color: palette.inkMuted },
  rank: { marginHorizontal: 18, marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, backgroundColor: palette.lavTint },
  rankText: { flex: 1, fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.lavInk },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: palette.paper, borderTopWidth: 1, borderTopColor: palette.line },
});
