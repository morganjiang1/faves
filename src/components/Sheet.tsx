// Bottom sheet on card stock: a grabber, a friendly centered title, a round close button,
// a big top radius, over a plum-tinted scrim. Used for share, swap, leg modes and pickers.
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, font, palette } from "@/theme/tokens";
import { Grabber, Icon } from "./ui";

export function Sheet({ open, onClose, title, subtitle, children, background = palette.card as string, testID, scroll = true, maxHeight = "86%" }: { open: boolean; onClose: () => void; title?: string; subtitle?: string; children: ReactNode; background?: string; testID?: string; scroll?: boolean; maxHeight?: `${number}%` | number }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const max = typeof maxHeight === "number" ? maxHeight : (height * parseFloat(maxHeight)) / 100;
  // iPhone lifts the sheet over the keyboard; the web needs no keyboard handling.
  const Column = Platform.OS === "ios" ? KeyboardAvoidingView : View;
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable accessibilityLabel="Close" style={styles.scrim} onPress={onClose} />
        <Column behavior="padding" style={styles.column}>
          <View testID={testID} style={[styles.sheet, { backgroundColor: background, paddingBottom: Math.max(insets.bottom, 16), maxHeight: max }]}>
            <Grabber />
            {title ? (
              <View style={styles.header}>
                <View style={{ width: 30 }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={styles.title} numberOfLines={1}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <Pressable testID={testID ? `${testID}-close` : undefined} accessibilityLabel="Close" onPress={onClose} style={styles.close}><Icon name="close" size={18} tint={palette.ink} /></Pressable>
              </View>
            ) : null}
            {scroll ? <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>{children}</ScrollView> : children}
          </View>
        </Column>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.scrim },
  column: { width: "100%", maxWidth: Platform.OS === "web" ? 520 : undefined },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, paddingTop: 2 },
  title: { fontFamily: font.display, fontSize: 19, color: palette.ink },
  subtitle: { fontFamily: font.sans, fontSize: 14, color: palette.inkMuted, marginTop: 2 },
  close: { width: 30, height: 30, borderRadius: 15, backgroundColor: palette.paperDeep, alignItems: "center", justifyContent: "center" },
});
