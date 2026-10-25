// A real little map for a ticket: OpenStreetMap tiles under the day's route, framed to fit every
// stop, with the numbered stops and the route line drawn on top. No map library: the tiles are
// plain images in a clipped box, placed with Web Mercator math, so it renders the same on the
// web and on the iPhone and is light enough to sit inside a scrolling chat. It doesn't take
// touches, so tapping it opens the ticket like the rest of the ticket does.
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import type { LatLng } from "@/lib/geo";
import { hasCoords, miniMapLayout, spreadPins } from "@/lib/minimap";
import { font, palette } from "@/theme/tokens";
import { WASH } from "../map/basemap";
import { RouteSketch } from "./RouteSketch";

export function MiniMap({ stops, starts = [], height = 120, testID }: { stops: (LatLng | null | undefined)[]; starts?: LatLng[]; height?: number; testID?: string }) {
  const [width, setWidth] = useState(0);
  const known = stops.filter(hasCoords);
  // A stop without a location can't go on a real map: the hand-drawn sketch instead.
  if (!stops.length || known.length < stops.length) {
    return known.length ? <View style={styles.sketch}><RouteSketch testID={testID} stops={known} starts={starts.filter(hasCoords)} width={220} height={86} /></View> : null;
  }
  const layout = width > 0 ? miniMapLayout(known, starts.filter(hasCoords), width, height) : null;
  const d = layout ? layout.stops.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") : "";
  return (
    <View testID={testID} pointerEvents="none" style={[styles.frame, { height }]} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))} accessibilityLabel={`Map of the ${stops.length} ${stops.length === 1 ? "stop" : "stops"}`}>
      {layout ? (
        <>
          {layout.tiles.map((t) => (
            <Image key={t.key} testID="minimap-tile" source={{ uri: t.uri }} cachePolicy="memory-disk" recyclingKey={t.key} transition={120} style={{ position: "absolute", left: t.left, top: t.top, width: t.size, height: t.size }} />
          ))}
          {/* The paper wash, so the map sits in the cream look like the Explore map. */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: WASH }]} />
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            {layout.starts.map((p, i) => <Circle key={`s${i}`} cx={p.x} cy={p.y} r={4.5} stroke={palette.inkMuted} strokeWidth={1.5} fill={palette.card} />)}
            {layout.stops.length > 1 ? (
              <>
                <Path d={d} stroke={palette.card} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <Path d={d} stroke={palette.rose} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </>
            ) : null}
            {spreadPins(layout.stops, width).map((p, i) => (
              <G key={i}>
                <Circle cx={p.x} cy={p.y} r={10} fill={palette.ink} stroke={palette.card} strokeWidth={2} />
                <SvgText x={p.x} y={p.y + 3.8} fontSize={11} fontWeight="700" fill={palette.cream} textAnchor="middle">{String(i + 1)}</SvgText>
              </G>
            ))}
          </Svg>
          <Text style={styles.credit}>© OpenStreetMap</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paperDeep },
  sketch: { alignItems: "center", backgroundColor: palette.paper, borderRadius: 10 },
  credit: { position: "absolute", right: 0, bottom: 0, paddingHorizontal: 5, paddingVertical: 1, borderTopLeftRadius: 6, backgroundColor: "rgba(255,248,241,0.85)", fontFamily: font.sans, fontSize: 9, color: palette.inkSoft },
});
