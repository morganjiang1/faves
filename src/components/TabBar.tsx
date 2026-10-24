// Beli's tab bar (yt_GlMma4eXe18_t174): five tabs, outline icons with labels under them,
// the selected one filled with a bold black label, and a filled teal circle "+" in the center.
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, font } from "@/theme/tokens";
import { useStore } from "@/state/store";
import { useOnline } from "@/state/device";
import { Avatar, Icon, OfflineBanner, type IconName } from "./ui";

const TABS: Record<string, { label: string; icon: IconName; iconOn: IconName }> = {
  index: { label: "Home", icon: "home-outline", iconOn: "home" },
  feed: { label: "Feed", icon: "newspaper-outline", iconOn: "newspaper" },
  plan: { label: "Plan", icon: "add", iconOn: "add" },
  saved: { label: "Saved", icon: "bookmark-outline", iconOn: "bookmark" },
  profile: { label: "Profile", icon: "person-outline", iconOn: "person" },
};

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const name = useStore((s) => s.profile.name);
  const online = useOnline();
  return (
    <View>
    {!online ? <OfflineBanner /> : null}
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const onPress = () => {
          if (route.name === "plan") { router.push("/builder"); return; }
          if (!focused) navigateToTab(route.key);
        };
        return (
          <Pressable key={route.key} testID={`tab-${route.name}`} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={route.name === "plan" ? "Plan a day" : tab.label} onPress={onPress} style={styles.item}>
            {route.name === "plan" ? (
              <View style={styles.plus}><Icon name="add" size={28} tint="#fff" /></View>
            ) : route.name === "profile" ? (
              <View style={[styles.avatarRing, focused && { borderColor: "#000" }]}><Avatar name={name || "You"} size={28} /></View>
            ) : (
              <Icon name={focused ? tab.iconOn : tab.icon} size={26} tint={focused ? "#000" : "#393939"} />
            )}
            <Text style={[styles.label, focused && styles.labelOn]}>{route.name === "plan" ? "Plan" : tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 0.5, borderTopColor: "#CCCCCC", paddingTop: 6 },
  item: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 3, minHeight: 50 },
  label: { fontFamily: font.sans, fontSize: 11, color: "#393939" },
  labelOn: { fontWeight: "700", color: "#000" },
  plus: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#12424D", alignItems: "center", justifyContent: "center" },
  avatarRing: { borderRadius: 16, borderWidth: 1.5, borderColor: "transparent", padding: 1 },
});
