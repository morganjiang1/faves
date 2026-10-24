// Pin artwork shared by the native map (as marker views) and described again in CSS for the
// web map. Values: Corner pins (corner_map_emoji_pins_categories_search.png) and Wanderlog
// numbered teardrops (appstore_04_road_trip_route_map_numbered_stops.png).
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { color, font } from "@/theme/tokens";
import type { MapPin } from "./types";

export function SpotPin({ pin, showLabel }: { pin: MapPin; showLabel: boolean }) {
  return (
    <View style={styles.spot} pointerEvents="box-none">
      <View style={[styles.disc, pin.selected && styles.discOn]}>
        <Text style={{ fontSize: 15 }}>{pin.emoji ?? "📍"}</Text>
      </View>
      {showLabel && pin.label ? (
        <View style={styles.labels}>
          <Text style={styles.label} numberOfLines={1}>{pin.label}</Text>
          {pin.sub ? <Text style={styles.sub} numberOfLines={1}>{pin.sub}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export function NumberPin({ pin }: { pin: MapPin }) {
  const c = pin.color ?? color.dayColor;
  return (
    <View style={{ width: 26, height: 37, alignItems: "center" }}>
      <Ionicons name="location" size={37} color={c} style={{ position: "absolute", top: -2 }} />
      <View style={[styles.numberHole, { backgroundColor: c }]}>
        <Text style={styles.number}>{pin.number}</Text>
      </View>
    </View>
  );
}

export function YouPin() {
  return <View style={styles.you} />;
}

const styles = StyleSheet.create({
  spot: { flexDirection: "row", alignItems: "center" },
  disc: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  discOn: { borderWidth: 2, borderColor: color.cornerSearchHere, transform: [{ scale: 1.15 }] },
  labels: { marginLeft: 5, maxWidth: 130 },
  label: { fontFamily: font.sans, fontSize: 12, fontWeight: "600", color: "#191919", textShadowColor: "#fff", textShadowRadius: 3 },
  sub: { fontFamily: font.sans, fontSize: 11, fontStyle: "italic", color: "#666", textShadowColor: "#fff", textShadowRadius: 3 },
  numberHole: { position: "absolute", top: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  number: { fontFamily: font.sans, color: "#fff", fontSize: 12, fontWeight: "800" },
  you: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#1A73E8", borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 3, elevation: 2 },
});
