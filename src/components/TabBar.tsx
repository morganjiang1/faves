// The Faves tab bar: cream paper, plum ink icons, and in the middle a rose postage-stamp
// "+" that starts a plan. Chats carry an unread count.
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { unreadCount, useChat } from "@/chat/store";
import { font, palette } from "@/theme/tokens";
import { useStore } from "@/state/store";
import { useOnline } from "@/state/device";
import { Avatar, Icon, OfflineBanner, type IconName } from "./ui";

const TABS: Record<string, { label: string; icon: IconName; iconOn: IconName }> = {
  index: { label: "Home", icon: "home-outline", iconOn: "home" },
  explore: { label: "Explore", icon: "map-outline", iconOn: "map" },
  plan: { label: "Plan", icon: "add", iconOn: "add" },
  chats: { label: "Chats", icon: "chatbubbles-outline", iconOn: "chatbubbles" },
  profile: { label: "You", icon: "person-outline", iconOn: "person" },
};

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const name = useStore((s) => s.profile.name);
  const online = useOnline();
  const chatView = useChat((v) => v);
  const unread = useMemo(() => Object.keys(chatView.data.groups).filter((id) => !chatView.muted[id]).reduce((t, id) => t + unreadCount(chatView, id), 0), [chatView]);
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
            <Pressable key={route.key} testID={`tab-${route.name}`} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={route.name === "plan" ? "Plan something" : tab.label} onPress={onPress} style={styles.item}>
              {route.name === "plan" ? (
                <View style={styles.plus}><View style={styles.plusInner}><Icon name="add" size={26} tint={palette.cream} /></View></View>
              ) : route.name === "profile" ? (
                <View style={[styles.avatarRing, focused && { borderColor: palette.roseInk }]}><Avatar name={name || "You"} size={26} /></View>
              ) : (
                <View>
                  <Icon name={focused ? tab.iconOn : tab.icon} size={25} tint={focused ? palette.roseInk : palette.inkSoft} />
                  {route.name === "chats" && unread > 0 ? <View style={styles.badge} testID="chats-unread"><Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text></View> : null}
                </View>
              )}
              <Text style={[styles.label, focused && styles.labelOn]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: palette.paper, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 6 },
  item: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 3, minHeight: 50 },
  label: { fontFamily: font.sans, fontSize: 11, fontWeight: "600", color: palette.inkSoft },
  labelOn: { color: palette.roseInk, fontWeight: "800" },
  plus: { width: 46, height: 46, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: palette.rose, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }], marginTop: -12, backgroundColor: palette.paper },
  plusInner: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center" },
  avatarRing: { borderRadius: 16, borderWidth: 2, borderColor: "transparent", padding: 1 },
  badge: { position: "absolute", right: -9, top: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: palette.paper },
  badgeText: { fontFamily: font.sans, fontSize: 10, fontWeight: "800", color: palette.cream },
});
