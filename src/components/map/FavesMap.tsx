// iPhone map: react-native-maps (runs in Expo Go) drawing the Faves basemap (basemap.ts) as
// raster tiles in place of Apple's map, custom pin views, and the day's route as a polyline.
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polygon, Polyline, UrlTile } from "react-native-maps";
import { color, palette } from "@/theme/tokens";
import { APPLE_TILES as apple, ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL, WASH } from "./basemap";
import { NumberPin, SpotPin, YouPin } from "./Pins";
import { declutter, type FavesMapProps } from "./types";

export default function FavesMap({ pins, routes = [], center, span = 0.06, fitToPins, fitKey, onPinPress, onMove, style, showLabels = true, testID, creditBottom = 4 }: FavesMapProps) {
  const ref = useRef<MapView>(null);
  const [size, setSize] = useState({ w: 390, h: 700 });
  const [region, setRegion] = useState({ latitude: center.lat, longitude: center.lng, latitudeDelta: span, longitudeDelta: span });
  // Which pins keep their label at this zoom (screen positions from the visible region).
  const labelled = useMemo(() => declutter(pins.filter((p) => p.kind === "spot" && p.label && !p.hideLabel).map((p) => ({
    id: p.id,
    x: ((p.lng - (region.longitude - region.longitudeDelta / 2)) / region.longitudeDelta) * size.w,
    y: (((region.latitude + region.latitudeDelta / 2) - p.lat) / region.latitudeDelta) * size.h,
    priority: p.priority ?? 0,
    selected: p.selected,
  }))), [pins, region, size]);
  const key = pins.map((p) => p.id).join("|");
  useEffect(() => {
    if (!fitToPins || pins.length < 2) return;
    const t = setTimeout(() => ref.current?.fitToCoordinates(pins.map((p) => ({ latitude: p.lat, longitude: p.lng })), { edgePadding: { top: 60, right: 50, bottom: 60, left: 50 }, animated: false }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fitToPins]);
  useEffect(() => {
    const pts = pins.filter((p) => p.kind !== "you");
    if (!fitKey || pts.length < 2) return;
    const t = setTimeout(() => ref.current?.fitToCoordinates(pts.map((p) => ({ latitude: p.lat, longitude: p.lng })), { edgePadding: { top: 110, right: 40, bottom: 260, left: 40 }, animated: true }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  return (
    <View testID={testID} style={[styles.wrap, style]}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        mapType={apple ? "mutedStandard" : "satellite"}
        showsPointsOfInterests={false}
        showsUserLocation
        initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: span, longitudeDelta: span }}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        onRegionChangeComplete={(r) => { setRegion(r); onMove?.({ lat: r.latitude, lng: r.longitude }); }}
      >
        {apple ? null : <UrlTile urlTemplate={TILE_URL} shouldReplaceMapContent maximumZ={TILE_MAX_ZOOM} tileSize={256} zIndex={-2} />}
        {apple ? null : <Polygon coordinates={washBox(center)} fillColor={WASH} strokeWidth={0} strokeColor="transparent" zIndex={-1} tappable={false} />}
        {routes.map((r, i) => (
          <Polyline
            key={`r${i}`}
            coordinates={r.points.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={r.walk ? color.walkDots : "rgba(112,68,172,0.6)"}
            strokeWidth={r.walk ? 4 : 6}
            lineDashPattern={r.walk ? [1, 8] : undefined}
            lineCap="round"
          />
        ))}
        {pins.map((p) => (
          <Marker
            key={`${p.id}${labelled.has(p.id) ? "L" : ""}${p.selected ? "S" : ""}`}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            anchor={p.kind === "number" ? { x: 0.5, y: 1 } : { x: 0.1, y: 0.5 }}
            onPress={() => onPinPress?.(p.id)}
            tracksViewChanges={false}
            zIndex={p.selected ? 10 : p.kind === "number" ? 5 : 1}
          >
            {p.kind === "number" ? <NumberPin pin={p} /> : p.kind === "you" ? <YouPin /> : <SpotPin pin={p} showLabel={showLabels && labelled.has(p.id)} />}
          </Marker>
        ))}
      </MapView>
      {apple ? null : <Text style={[styles.credit, { bottom: creditBottom }]} accessibilityElementsHidden>{ATTRIBUTION}</Text>}
    </View>
  );
}

// A paper-colored sheet over the tiles, a few degrees around the city (under routes and pins).
function washBox(c: { lat: number; lng: number }) {
  const d = 3;
  return [
    { latitude: c.lat - d, longitude: c.lng - d },
    { latitude: c.lat - d, longitude: c.lng + d },
    { latitude: c.lat + d, longitude: c.lng + d },
    { latitude: c.lat + d, longitude: c.lng - d },
  ];
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: palette.paperDeep as string },
  credit: { position: "absolute", pointerEvents: "none", right: 6, fontSize: 9, color: palette.inkMuted as string, backgroundColor: "rgba(255,248,241,0.75)", paddingHorizontal: 4, borderRadius: 3, overflow: "hidden" },
});
