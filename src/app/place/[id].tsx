// A spot's page, on cream paper: a big postcard at the top playing the spot's clips (swipe
// sideways for its other clips and photos), the Locals Score stamp on its corner, then the
// name and a one-line vibe, one line of facts (open, cost, distance; tap for the details
// sheet: hours, address, phone, website, booking), one line for the score (tap for where it
// comes from), the best thing a local said, a small strip of moments, and a sticky bar:
// Add to a plan, and send it to a chat.
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ListViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pagesFor, playCount } from "@/components/moments/clips";
import { useSharedMoments } from "@/chat/moments";
import { SendToChat, type SendItem } from "@/components/chat/SendToChat";
import { Postmark } from "@/components/postcard/Postcard";
import { ShareSheet } from "@/components/ShareSheet";
import { Sheet } from "@/components/Sheet";
import { PageMedia, PageThumb } from "@/components/spot/media";
import { EmptyState, ErrorState, Icon, OfflineBanner, PrimaryButton, Skeleton, Stamp, Toast, UserDisc, type IconName } from "@/components/ui";
import { distanceLabel } from "@/lib/geo";
import { services } from "@/lib/adapters";
import { livePlace, type LivePlace } from "@/lib/adapters/places";
import { dayHoursText, statusAt, weekLines } from "@/lib/hours";
import { callNumber, openDirections, openUrl, shareUrl } from "@/lib/links";
import { compact, costOf, gemLine, rankedBy, scoreOutOf10, vibeLine, bestQuote } from "@/lib/score";
import { communitySignals } from "@/lib/signals";
import { DAY_NAMES } from "@/lib/time";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation, useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { font, palette, shadow } from "@/theme/tokens";

export default function PlacePage() {
  const { id, reserve, i, details: openAt } = useLocalSearchParams<{ id: string; reserve?: string; i?: string; details?: string }>();
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
  const [details, setDetails] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const here = useKnownLocation();
  const [toast, setToast] = useState<string | null>(null);
  const [live, setLive] = useState<LivePlace | null>(null);
  // Once the page scrolls, the floating buttons get a paper backdrop so text never shows between them.
  const [scrolled, setScrolled] = useState(false);

  const place = city?.byId.get(placeId) ?? null;
  useEffect(() => { if (reserve === "1" && place?.reserveUrl) openUrl(place.reserveUrl); }, [reserve, place]);
  // Links can open a sheet: ?details=details (hours, address, phone) or ?details=scores.
  useEffect(() => { if (openAt === "scores") setScoreOpen(true); else if (openAt) setDetails(true); }, [openAt]);
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
  const signals = communitySignals(place);
  const clipPages = pages.filter((p) => p.kind === "clip");
  const current = pages[Math.min(page, pages.length - 1)];
  const poster = current?.kind === "clip" ? current.moment : null;
  const directions = () => openDirections({ ...place }, transport);
  // The facts on one line: open now, cost, how far.
  const openWord = st.state === "unknown" ? (place.court ? (place.court.lit ? "Lit at night" : "Daylight only") : "Hours not listed")
    : st.detail === "Temporarily closed" ? st.detail
    : st.state === "open" ? `Open ${st.detail.replace(/^Closes /, "till ")}`.trim()
    : `Closed${st.detail ? `, ${st.detail.replace(/^Opens/, "opens")}` : ""}`;
  const costWord = cost.dollars ?? (cost.perPerson === 0 && !cost.estimated ? "Free" : cost.estimated ? `~$${cost.perPerson}` : cost.label);
  const far = distanceLabel(here, place);
  const factsTail = [costWord, far].filter(Boolean).join(" · ");
  const toggleSave = () => { actions.toggleSave(place.id); setToast(saved ? "Removed from Saved" : `${place.name} saved`); };

  return (
    <View style={styles.screen} testID="place-page">
      <StatusBar style="dark" />
      <ScrollView testID="place-scroll" contentContainerStyle={{ paddingTop: insets.top + 58, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false} scrollEventThrottle={16} onScroll={(e) => { const past = e.nativeEvent.contentOffset.y > 4; setScrolled((s) => (s === past ? s : past)); }}>
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
              <Stamp score={scoreOutOf10(place.locals)} count={compact(rankedBy(place))} size={70} tilt={9} />
            </View>
          )}
        </View>

        {/* The name, a one-line vibe, then the facts and the score as one tappable line each */}
        <View style={styles.head}>
          <Text testID="place-name" style={styles.name}>{place.name}</Text>
          <Text style={styles.vibe}>{vibeLine(place)}{gem ? ` · ${gem}` : ""}</Text>
        </View>

        <View style={styles.lines}>
          <Pressable testID="details-section" accessibilityRole="button" accessibilityLabel="Details: hours, address, phone" onPress={() => setDetails(true)} style={styles.line}>
            <Icon name="time-outline" size={18} tint={st.state === "open" ? palette.open : st.state === "closed" ? palette.sunsetInk : palette.inkSoft} />
            <Text style={styles.lineText} numberOfLines={1}>
              <Text testID="open-status" style={{ color: st.state === "open" ? palette.open : st.state === "closed" ? palette.sunsetInk : palette.ink, fontWeight: "700" }}>{openWord}</Text>
              {factsTail ? ` · ${factsTail}` : ""}
            </Text>
            <Text style={styles.lineAction}>Details</Text>
          </Pressable>
          {place.unrated ? null : (
            <Pressable testID="score-line" accessibilityRole="button" accessibilityLabel={`Locals Score ${scoreOutOf10(place.locals)}. Where it comes from`} onPress={() => setScoreOpen(true)} style={styles.line}>
              <Icon name="star" size={18} tint={palette.roseInk} />
              <Text style={styles.lineText} numberOfLines={1}><Text style={{ fontWeight: "800" }}>{scoreOutOf10(place.locals)}</Text> from {signals.ranked ? `${signals.ranked.toLocaleString("en-US")} ${signals.ranked === 1 ? "local" : "locals"}` : "locals"}</Text>
              <Icon name="chevron-forward" size={16} tint={palette.inkMuted} />
            </Pressable>
          )}
        </View>

        {quote ? (
          <Pressable style={styles.quote} testID="quotes-section" accessibilityRole="button" onPress={() => setQuoteOpen((v) => !v)}>
            <Text style={styles.quoteMark}>“</Text>
            <Text style={styles.quoteText} testID="quote-0" numberOfLines={quoteOpen ? undefined : 3}>{quote.text}</Text>
            <Text style={styles.quoteSource} testID="quote-who">{place.hood ? `a local · ${place.hood}` : "a local"}</Text>
          </Pressable>
        ) : null}

        {/* Moments: a small strip of the spot's postcard wall */}
        <View style={styles.wallBlock}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[styles.blockTitle, { flex: 1 }]}>moments</Text>
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
            <Pressable testID="post-moment" accessibilityRole="button" accessibilityLabel="Post a moment here" onPress={() => router.push(`/post-moment/${encodeURIComponent(place.id)}`)} style={[styles.wallCard, styles.wallPost]}>
              <View style={styles.record}><View style={styles.recordDot} /></View>
              <Text style={styles.wallPostText}>post one</Text>
            </Pressable>
          </View>
        </View>

        <Pressable testID="action-rank" accessibilityRole="button" onPress={() => router.push(`/rank?place=${encodeURIComponent(place.id)}`)} style={styles.rank}>
          <Icon name="ribbon-outline" size={20} tint={palette.lavInk} />
          <Text style={styles.rankText}>Been here? Rank it</Text>
          <Icon name="chevron-forward" size={16} tint={palette.lavInk} />
        </Pressable>
      </ScrollView>

      {/* Top buttons over the paper */}
      <View testID="place-top" style={[styles.top, scrolled && styles.topScrolled, { paddingTop: insets.top + 6 }]}>
        <Round testID="place-back" icon="chevron-back" label="Back" onPress={back} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Round testID="action-save" icon={saved ? "bookmark" : "bookmark-outline"} label={saved ? "Remove from Saved" : "Save"} onPress={toggleSave} tint={saved ? palette.roseInk : palette.ink} />
          <Round testID="action-share" icon="share-outline" label="Share" onPress={() => setShare(true)} />
        </View>
        {/* A soft fade under the paper, so the page slides away under the buttons. */}
        {scrolled ? <LinearGradient pointerEvents="none" colors={["rgba(255,248,241,0.98)", "rgba(255,248,241,0)"]} style={styles.topFade} /> : null}
      </View>

      {/* The sticky bar */}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PrimaryButton testID="add-to-day" label="Add to a plan" icon="ticket" onPress={() => router.push(`/builder?place=${encodeURIComponent(place.id)}`)} style={{ flex: 1 }} />
        <Pressable testID="send-to-chat" accessibilityRole="button" accessibilityLabel="Send to a chat" onPress={() => setSend({ kind: "place", placeId: place.id, name: place.name })} style={styles.sendButton}>
          <Icon name="paper-plane-outline" size={22} tint={palette.ink} />
        </Pressable>
      </View>

      <Sheet open={details} onClose={() => setDetails(false)} title={place.name} testID="place-details" background={palette.paper}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Pressable testID="hours-row" onPress={() => setWeek((w) => !w)} style={styles.row}>
            <Icon name="time-outline" size={20} tint={palette.inkSoft} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>
                {st.state !== "unknown" ? <Text style={{ fontWeight: "800", color: st.state === "open" ? palette.open : palette.sunsetInk }}>{st.state === "open" ? "Open" : "Closed"}  </Text> : null}
                {place.hours ? `${DAY_NAMES[clock.day]}: ${dayHoursText(place.hours, clock.day)}` : place.court ? "No posted hours. Public courts are usually open dawn to dusk." : "Hours not listed. Call ahead."}
              </Text>
              {live?.openNow != null ? <Text style={styles.rowSub} testID="live-hours">Live hours: {live.openNow ? "open now" : "closed now"}</Text> : null}
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
          {clipPages.length ? <Row icon="film-outline" text={`${clipPages.length} ${clipPages.length === 1 ? "clip" : "clips"} from locals`} /> : null}
          {place.description ? <Text style={styles.description}>{place.description}</Text> : null}
        </View>
      </Sheet>

      {place.unrated ? null : (
        <Sheet open={scoreOpen} onClose={() => setScoreOpen(false)} title="Where the score comes from" testID="scores-section" background={palette.paper}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 10 }}>
            <View style={styles.sources}>
              <Source testID="signal-ranked" label="Locals ranked it" value={signals.ranked ? `★ ${scoreOutOf10(place.locals)}` : "-"} sub={signals.ranked ? `${signals.ranked.toLocaleString("en-US")} ${signals.ranked === 1 ? "local" : "locals"}` : "no rankings yet"} />
              <Source testID="signal-moments" label="Moments" value={signals.moments ? compact(signals.moments) : "-"} sub={signals.moments ? "posted" : "none yet"} />
              <Source testID="signal-saves" label="Saves" value={signals.saves ? compact(signals.saves) : "-"} sub={signals.saves ? "saved it" : "none yet"} />
              <Source testID="signal-days" label="Shared days" value={signals.days ? String(signals.days) : "-"} sub={signals.days ? (signals.days === 1 ? "day it's in" : "days it's in") : "none yet"} />
            </View>
            <Text style={styles.rowSub} testID="signals-footnote">From people on Faves: rankings, moments and saves.</Text>
          </View>
        </Sheet>
      )}

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
  // Paper (#FFF8F1), just short of opaque, once the page has scrolled; a soft fade below it.
  topScrolled: { backgroundColor: "rgba(255,248,241,0.98)" },
  topFade: { position: "absolute", left: 0, right: 0, bottom: -16, height: 16 },
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
  lines: { marginHorizontal: 18, marginTop: 16, borderRadius: 16, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, overflow: "hidden" },
  line: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  lineText: { flex: 1, fontFamily: font.sans, fontSize: 15.5, color: palette.ink },
  lineAction: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.roseInk },
  wallBlock: { marginHorizontal: 18, marginTop: 22 },
  sendButton: { width: 56, height: 52, borderRadius: 16, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
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
  source: { flex: 1, backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, borderColor: palette.line, padding: 8, gap: 1 },
  sourceLabel: { fontFamily: font.sans, fontSize: 11.5, fontWeight: "800", color: palette.inkMuted, letterSpacing: 0.3 },
  sourceValue: { fontFamily: font.display, fontSize: 18, color: palette.ink },
  sourceSub: { fontFamily: font.sans, fontSize: 11, color: palette.inkMuted },
  rank: { marginHorizontal: 18, marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, backgroundColor: palette.lavTint },
  rankText: { flex: 1, fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.lavInk },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: palette.paper, borderTopWidth: 1, borderTopColor: palette.line },
});
