import type { StyleProp, ViewStyle } from "react-native";
import type { LatLng } from "@/lib/geo";

// Pins: Corner's emoji pin with a name and an italic descriptor (Explore), Wanderlog's
// numbered teardrop in the day color (itinerary), and a blue dot for you.
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  kind: "spot" | "number" | "you";
  emoji?: string;
  label?: string;
  sub?: string;
  number?: number;
  color?: string;
  selected?: boolean;
  saved?: boolean;
  hideLabel?: boolean;
  priority?: number; // higher gets its label first when labels would overlap
}

// Corner's labels never collide: keep a label only if its box (about 130 x 34 pt, to the
// right of the pin) clears every label already placed, best pins first.
export function declutter<T extends { id: string; x: number; y: number; priority: number; selected?: boolean }>(items: T[]): Set<string> {
  const keep = new Set<string>();
  const placed: { x: number; y: number }[] = [];
  const order = [...items].sort((a, b) => Number(b.selected ?? 0) - Number(a.selected ?? 0) || b.priority - a.priority);
  for (const it of order) {
    if (placed.some((p) => Math.abs(p.x - it.x) < 140 && Math.abs(p.y - it.y) < 36)) continue;
    placed.push(it);
    keep.add(it.id);
  }
  return keep;
}

export interface RouteSegment { points: LatLng[]; walk: boolean }

export interface FavesMapProps {
  pins: MapPin[];
  routes?: RouteSegment[];
  center: LatLng;
  span?: number; // degrees of latitude visible
  fitToPins?: boolean;
  fitKey?: string; // fit the view to the pins whenever this changes
  onPinPress?: (id: string) => void;
  onMove?: (center: LatLng) => void;
  style?: StyleProp<ViewStyle>;
  showLabels?: boolean;
  testID?: string;
  creditBottom?: number; // lift the map credit above a sheet that overlaps the map's bottom edge
}
