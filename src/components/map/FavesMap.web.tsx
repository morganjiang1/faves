// Web map with no API key: Leaflet drawing the Faves basemap (basemap.ts: OpenStreetMap tiles
// with a paper wash), the same tiles as the iPhone. Same pins and route styles too.
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { color, palette } from "@/theme/tokens";
import { ATTRIBUTION_HTML, TILE_MAX_ZOOM, TILE_URL, WEB_TILE_FILTER } from "./basemap";
import { declutter, type FavesMapProps, type MapPin } from "./types";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const SANS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Inter, system-ui, sans-serif";

function iconFor(p: MapPin, showLabel: boolean): L.DivIcon {
  if (p.kind === "you") {
    return L.divIcon({ className: "", iconSize: [18, 18], iconAnchor: [9, 9], html: `<div style="width:18px;height:18px;border-radius:9px;background:#1A73E8;border:3px solid #fff;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>` });
  }
  if (p.kind === "number") {
    const c = p.color ?? color.dayColor;
    return L.divIcon({
      className: "",
      iconSize: [26, 37],
      iconAnchor: [13, 37],
      html: `<svg width="26" height="37" viewBox="0 0 26 37" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))"><path d="M13 0C5.8 0 0 5.6 0 12.6 0 22 13 37 13 37s13-15 13-24.4C26 5.6 20.2 0 13 0z" fill="${c}"/><text x="13" y="17.5" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="13" fill="#fff">${p.number ?? ""}</text></svg>`,
    });
  }
  const ring = p.selected ? `border:2px solid ${color.cornerSearchHere};transform:scale(1.15);` : "";
  const label = showLabel && p.label
    ? `<div style="margin-left:5px;max-width:130px;font-family:${SANS};text-shadow:0 0 3px #fff,0 0 3px #fff"><div style="font-size:12px;font-weight:600;color:#191919;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.label)}</div>${p.sub ? `<div style="font-size:11px;font-style:italic;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.sub)}</div>` : ""}</div>`
    : "";
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="display:flex;align-items:center;width:max-content"><div style="width:28px;height:28px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.18);box-sizing:border-box;${ring}">${p.emoji ?? "📍"}</div>${label}</div>`,
  });
}

export default function FavesMap({ pins, routes = [], center, span = 0.06, fitToPins, fitKey, onPinPress, onMove, style, showLabels = true, testID, creditBottom = 0 }: FavesMapProps) {
  const host = useRef<unknown>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const handlers = useRef({ onPinPress, onMove });
  handlers.current = { onPinPress, onMove };

  useEffect(() => {
    const el = host.current as HTMLElement;
    if (!el || map.current) return;
    const zoom = Math.round(Math.log2(360 / span));
    const m = L.map(el, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], zoom);
    L.tileLayer(TILE_URL, { maxZoom: TILE_MAX_ZOOM, className: "faves-tiles", attribution: ATTRIBUTION_HTML }).addTo(m);
    if (!document.getElementById("faves-map-style")) {
      const st = document.createElement("style");
      st.id = "faves-map-style";
      st.textContent = `.faves-tiles{filter:${WEB_TILE_FILTER}}.leaflet-container{font-family:inherit;background:${palette.paperDeep}}.leaflet-control-attribution{font:9px/1.4 ${SANS}!important;background:rgba(255,248,241,.75)!important;color:${palette.inkMuted}!important;border-radius:3px}.leaflet-control-attribution a{color:${palette.inkMuted}!important}`;
      document.head.appendChild(st);
    }
    const credit = m.attributionControl?.getContainer();
    if (credit) credit.style.marginBottom = `${creditBottom}px`;
    m.on("moveend", () => { const c = m.getCenter(); handlers.current.onMove?.({ lat: c.lat, lng: c.lng }); });
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    // The container may size itself after mount.
    setTimeout(() => m.invalidateSize(), 50);
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = useRef<() => void>(() => {});
  draw.current = () => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    for (const r of routes) {
      L.polyline(r.points.map((p) => [p.lat, p.lng] as [number, number]), r.walk
        ? { color: color.walkDots, weight: 4, dashArray: "1 8", lineCap: "round" }
        : { color: color.dayColor, opacity: 0.6, weight: 6, lineCap: "round" }).addTo(g);
    }
    const labelled = declutter(pins.filter((p) => p.kind === "spot" && p.label && !p.hideLabel).map((p) => {
      const pt = m.latLngToContainerPoint([p.lat, p.lng]);
      return { id: p.id, x: pt.x, y: pt.y, priority: p.priority ?? 0, selected: p.selected };
    }));
    for (const p of pins) {
      const mk = L.marker([p.lat, p.lng], { icon: iconFor(p, showLabels && labelled.has(p.id)), zIndexOffset: p.selected ? 1000 : p.kind === "number" ? 500 : labelled.has(p.id) ? 100 : 0, keyboard: false });
      mk.on("click", () => handlers.current.onPinPress?.(p.id));
      mk.addTo(g);
    }
  };

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    draw.current();
    if (fitToPins && pins.length >= 2) m.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), { padding: [50, 50] });
  }, [pins, routes, fitToPins, showLabels]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const redraw = () => draw.current();
    m.on("zoomend", redraw);
    return () => { m.off("zoomend", redraw); };
  }, []);

  // Re-frame the map when the set of results changes (a new category or filter).
  useEffect(() => {
    const m = map.current;
    const pts = pins.filter((p) => p.kind !== "you");
    if (!m || !fitKey || pts.length < 2) return;
    m.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])), { paddingTopLeft: [40, 90], paddingBottomRight: [40, 230], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  return <View ref={host as never} testID={testID} style={[{ backgroundColor: color.cornerLand }, style]} />;
}
