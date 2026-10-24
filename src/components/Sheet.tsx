// Bottom sheet: Apple Maps' grouped sheet (appstore_03_nearby_transit_sheet_chips.png):
// grabber, centered ~17 pt semibold title, round close button, large top radius, over a
// dimmed scrim. Used for share, swap, leg modes, and other pickers.
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, font } from "@/theme/tokens";
import { Grabber, Icon } from "./ui";

export function Sheet({ open, onClose, title, subtitle, children, background = "#fff", testID, scroll = true, maxHeight = "86%" }: { open: boolean; onClose: () => void; title?: string; subtitle?: string; children: ReactNode; background?: string; testID?: string; scroll?: boolean; maxHeight?: `${number}%` | number }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable accessibilityLabel="Close" style={styles.scrim} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.column}>
          <View testID={testID} style={[styles.sheet, { backgroundColor: background, paddingBottom: Math.max(insets.bottom, 16), maxHeight }]}>
            <Grabber />
            {title ? (
              <View style={styles.header}>
                <View style={{ width: 30 }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={styles.title} numberOfLines={1}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <Pressable testID={testID ? `${testID}-close` : undefined} accessibilityLabel="Close" onPress={onClose} style={styles.close}><Icon name="close" size={18} tint="#000" /></Pressable>
              </View>
            ) : null}
            {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>{children}</ScrollView> : children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.scrim },
  column: { width: "100%", maxWidth: Platform.OS === "web" ? 520 : undefined },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, paddingTop: 2 },
  title: { fontFamily: font.sans, fontSize: 17, fontWeight: "600", color: "#000" },
  subtitle: { fontFamily: font.sans, fontSize: 14, color: "#7C7C81", marginTop: 2 },
  close: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#E5E5EA", alignItems: "center", justifyContent: "center" },
});
