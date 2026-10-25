// Partiful's share sheet (appstore_04_share_link_sheet.png): pastel gradient top, grabber,
// "Share Link" 22 pt bold, grey subtitle, a link-preview card (cover + title + domain),
// then four 48 pt circles: Copy Link (#171D1D), Messages (#38E754), WhatsApp (#32D852),
// More (white with a ring), grey labels under them.
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Modal, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, font, palette } from "@/theme/tokens";
import { Grabber, Icon, PlaceImage, type IconName } from "./ui";

export function ShareSheet({ open, onClose, title = "Share Link", subtitle, url, cardTitle, image, category = "views", message }: { open: boolean; onClose: () => void; title?: string; subtitle: string; url: string; cardTitle: string; image?: string | null; category?: string; message?: string }) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const text = `${message ?? cardTitle} ${url}`;
  const domain = url.replace(/^https?:\/\//, "").split("/")[0] || "faves";
  const copy = async () => { await Clipboard.setStringAsync(url); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const sms = () => Linking.openURL(Platform.OS === "ios" ? `sms:&body=${encodeURIComponent(text)}` : `sms:?body=${encodeURIComponent(text)}`).catch(() => {});
  const whatsapp = () => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {});
  const more = async () => {
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && "share" in navigator) await (navigator as Navigator).share({ title: cardTitle, text: message ?? cardTitle, url });
      else if (Platform.OS === "web") await copy();
      else await Share.share({ message: text, url });
    } catch { /* closed */ }
  };
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable accessibilityLabel="Close" style={styles.scrim} onPress={onClose} />
        <View testID="share-sheet" style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <LinearGradient colors={["#F5F0F6", "#FFFFFF"]} style={StyleSheet.absoluteFill} />
          <Grabber />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.card}>
            <PlaceImage uri={image} category={category} style={{ width: "100%", height: 170 }} emojiSize={56} />
            <View style={{ padding: 12 }}>
              <Text style={styles.cardTitle} numberOfLines={2}>{cardTitle}</Text>
              <Text style={styles.cardDomain}>{domain}</Text>
            </View>
          </View>
          <View style={styles.targets}>
            <Target testID="share-copy" icon={copied ? "checkmark" : "link"} label={copied ? "Copied" : "Copy Link"} bg={color.copyLink} tint="#fff" onPress={copy} />
            <Target testID="share-messages" icon="chatbubble" label="Messages" bg={color.messages} tint="#fff" onPress={sms} />
            <Target testID="share-whatsapp" icon="logo-whatsapp" label="WhatsApp" bg={color.whatsapp} tint="#fff" onPress={whatsapp} />
            <Target testID="share-more" icon="share-outline" label="More" bg="#fff" tint={palette.ink} ring onPress={more} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Target({ icon, label, bg, tint, ring, onPress, testID }: { icon: IconName; label: string; bg: string; tint: string; ring?: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ alignItems: "center", width: 80, gap: 8 }}>
      <View style={[styles.circle, { backgroundColor: bg }, ring && { borderWidth: 1, borderColor: palette.line }]}><Icon name={icon} size={22} tint={tint} /></View>
      <Text style={styles.targetLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.scrim },
  sheet: { width: "100%", maxWidth: Platform.OS === "web" ? 520 : undefined, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", alignItems: "center", paddingHorizontal: 20 },
  title: { fontFamily: font.sans, fontSize: 22, fontWeight: "700", color: palette.ink, marginTop: 14 },
  subtitle: { fontFamily: font.sans, fontSize: 15, color: color.shareSub, marginTop: 6, textAlign: "center" },
  card: { width: 236, borderRadius: 9.5, backgroundColor: palette.card, overflow: "hidden", marginTop: 24, shadowColor: palette.ink, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: palette.ink },
  cardDomain: { fontFamily: font.sans, fontSize: 14, color: color.shareLabel, marginTop: 2 },
  targets: { flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch", marginTop: 28, paddingHorizontal: 4 },
  circle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  targetLabel: { fontFamily: font.sans, fontSize: 13, color: color.shareLabel },
});
