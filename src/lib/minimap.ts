// The math behind a ticket's mini map: Web Mercator pixels, the zoom that frames every stop, the
// OpenStreetMap tiles that cover the box, and pins nudged apart when two stops nearly touch.
import { TILE_MAX_ZOOM, TILE_URL } from "@/components/map/basemap";
import type { LatLng } from "./geo";

const TILE = 256;

// Web Mercator: a point's pixel position in the whole world at zoom z.
export function worldPx(p: LatLng, z: number): { x: number; y: number } {
  const n = TILE * 2 ** z;
  const s = Math.sin((Math.max(-85, Math.min(85, p.lat)) * Math.PI) / 180);
  return { x: ((p.lng + 180) / 360) * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
}

export const hasCoords = (p: LatLng | null | undefined): p is LatLng => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);

export interface MiniMapTile { key: string; uri: string; left: number; top: number; size: number }
export interface MiniMapLayout { zoom: number; tiles: MiniMapTile[]; stops: { x: number; y: number }[]; starts: { x: number; y: number }[] }

// The zoom (fractional) that fits every point inside the box with padding, the tiles that cover
// the box, and where each point lands. Tiles come from one zoom level deeper and are drawn at
// half size or a bit more, so they stay sharp on a retina screen.
export function miniMapLayout(stops: LatLng[], starts: LatLng[], width: number, height: number, pad = 22): MiniMapLayout {
  const all = [...stops, ...starts];
  const at0 = all.map((p) => worldPx(p, 0));
  const xs = at0.map((p) => p.x), ys = at0.map((p) => p.y);
  const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
  const fit = Math.min(bw > 0 ? Math.log2((width - pad * 2) / bw) : 99, bh > 0 ? Math.log2((height - pad * 2) / bh) : 99);
  const zoom = Math.max(2, Math.min(15.5, fit));
  const tz = Math.min(TILE_MAX_ZOOM, Math.floor(zoom) + 1);
  const scale = 2 ** (zoom - tz); // a tile's pixel, on screen
  const size = TILE * scale;
  const cx = ((Math.min(...xs) + Math.max(...xs)) / 2) * 2 ** zoom;
  const cy = ((Math.min(...ys) + Math.max(...ys)) / 2) * 2 ** zoom;
  const left = cx - width / 2, top = cy - height / 2;
  const n = 2 ** tz;
  const tiles: MiniMapTile[] = [];
  for (let ty = Math.floor(top / size); ty <= Math.floor((top + height) / size); ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor(left / size); tx <= Math.floor((left + width) / size); tx++) {
      const x = ((tx % n) + n) % n;
      tiles.push({
        key: `${tz}/${x}/${ty}`,
        uri: TILE_URL.replace("{z}", String(tz)).replace("{x}", String(x)).replace("{y}", String(ty)),
        left: Math.floor(tx * size - left),
        top: Math.floor(ty * size - top),
        size: Math.ceil(size) + 1, // a pixel of overlap: no hairline seams between tiles
      });
    }
  }
  const place = (p: LatLng) => { const w = worldPx(p, zoom); return { x: w.x - left, y: w.y - top }; };
  return { zoom, tiles, stops: stops.map(place), starts: starts.map(place) };
}

// Pins that would sit on top of each other (two stops a block apart) are nudged sideways so
// every number stays readable; the route line keeps the true positions.
export function spreadPins(pts: { x: number; y: number }[], width: number, gap = 19): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const p of pts) {
    let q = { ...p };
    for (let tries = 0; tries < 6 && out.some((o) => Math.hypot(o.x - q.x, o.y - q.y) < gap); tries++) {
      const dir = q.x + gap > width - 12 ? -1 : 1;
      q = { x: q.x + dir * gap * 0.75, y: q.y - gap * 0.35 };
    }
    out.push(q);
  }
  return out;
}

