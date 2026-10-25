// A hand-drawn mini map: the day's stops as numbered dots joined by a dashed rose line, and
// (for group plans) where everyone starts as small open circles. No map tiles, so it is
// light enough to sit in a chat bubble.
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import type { LatLng } from "@/lib/geo";
import { palette } from "@/theme/tokens";

export function RouteSketch({ stops, starts = [], width = 120, height = 96, testID }: { stops: LatLng[]; starts?: LatLng[]; width?: number; height?: number; testID?: string }) {
  const all = [...stops, ...starts];
  if (!all.length) return null;
  const pad = 12;
  const lats = all.map((p) => p.lat), lngs = all.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 0.004), spanLng = Math.max(maxLng - minLng, 0.004);
  // Keep the real shape: one scale for both axes (longitude shrinks with latitude).
  const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const scale = Math.min((width - pad * 2) / (spanLng * kx), (height - pad * 2) / spanLat);
  const cx = (minLng + maxLng) / 2, cy = (minLat + maxLat) / 2;
  const xy = (p: LatLng) => ({ x: width / 2 + (p.lng - cx) * kx * scale, y: height / 2 - (p.lat - cy) * scale });
  const pts = stops.map(xy);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <Svg width={width} height={height} testID={testID}>
      <Path d={`M4 ${height - 10} Q ${width / 3} ${height - 18} ${width / 2} ${height - 8} T ${width - 4} ${height - 14}`} stroke={palette.paperDeep} strokeWidth={6} fill="none" strokeLinecap="round" />
      {starts.map((s, i) => {
        const p = xy(s);
        return <Circle key={`s${i}`} cx={p.x} cy={p.y} r={4} stroke={palette.inkMuted} strokeWidth={1.5} fill={palette.card} />;
      })}
      {pts.length > 1 ? <Path d={d} stroke={palette.rose} strokeWidth={2} strokeDasharray="4 4" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={8} fill={palette.ink} />
          <SvgText x={p.x} y={p.y + 3.5} fontSize={10} fontWeight="700" fill={palette.cream} textAnchor="middle">{String(i + 1)}</SvgText>
        </G>
      ))}
    </Svg>
  );
}
