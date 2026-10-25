// Design tokens: the Faves "warm postcard" identity (docs/design_system.md). Cream paper,
// plum ink, the Heart Pin rose, a sunset orange and a gem lavender; Bricolage Grotesque for
// display type and the system face for body text. Every text color here passes 4.5:1 on the
// surface it is used on (checked in docs/design_system.md).
import { Platform } from "react-native";
import brand from "../../assets/brand/brand.json";

// The logo's colors live in assets/brand/brand.json with the logo file itself.
export const logo = { color: brand.color, glyph: brand.glyph } as const;

export const palette = {
  paper: "#FFF8F1", // the page
  card: "#FFFFFF", // postcard stock, tickets, sheets
  paperDeep: "#F5E6D6", // sunken areas, chips, inputs
  line: "#E9DCCD", // hairlines and card borders
  ink: "#1E1530", // plum ink: text, dark buttons
  inkSoft: "#55486A", // secondary text (7.9:1 on paper)
  inkMuted: "#6E6280", // meta text (5.4:1 on paper)
  rose: "#FF4F6D", // the Heart Pin: fills, stamps, hearts (ink text on it: 5.5:1)
  roseInk: "#C92A4F", // rose as text and as a button fill with cream text (5.1:1)
  roseTint: "#FFE3E8",
  sunset: "#FF9A4D", // second accent: tickets, highlights (ink text on it: 8.3:1)
  sunsetInk: "#B4501C", // "closed", warnings as text (4.9:1)
  sunsetTint: "#FFE7D4",
  lavender: "#8E6BE8", // hidden gems
  lavInk: "#5A3FB0", // gem text (6.4:1 on its tint)
  lavTint: "#EFE8FB",
  open: "#2B7A4B", // "open now" (5.0:1)
  // Dark mode: deep plum, never black.
  plum: "#1A1226",
  plumRaised: "#271B35",
  plumLine: "#3A2C4A",
  cream: "#FFF3E8", // text on plum (16.6:1)
  creamSoft: "#CBBBD6", // secondary text on plum (10:1)
  creamMuted: "#A898B8", // meta text on plum (6.8:1)
  roseOnPlum: "#FF6F88",
  openOnPlum: "#6FD69B",
  sunsetOnPlum: "#FFAA6B",
} as const;

// Older screens name colors after where they first came from; every name now points at the
// palette above, so the whole app wears the same identity.
export const color = {
  bg: palette.paper,
  brand: palette.roseInk,
  brandDeep: palette.ink,
  score: palette.roseInk,
  scoreList: palette.roseInk,
  text: palette.ink,
  textStrong: palette.ink,
  textMuted: palette.inkMuted,
  textSub: palette.inkSoft,
  border: palette.line,
  hairline: palette.line,
  divider: "#F1E4D5",
  field: palette.paperDeep,
  chipOff: palette.paperDeep,
  chipOn: palette.ink,
  chipBeliOff: "#D9C8B5",
  like: palette.rose,
  gem: palette.lavender,
  gemText: palette.inkMuted,
  open: palette.open,
  closed: palette.sunsetInk,
  rateGreat: "#8FC97A",
  rateOk: "#F6CB68",
  rateBad: "#F2A7B4",
  sectionBand: palette.paperDeep,
  arrowCircle: palette.paperDeep,
  tonal: palette.roseTint,
  tonalText: palette.roseInk,
  gmapsPrimary: palette.roseInk,
  sheetGrabber: "#D9C8B5",
  circleButton: palette.paperDeep,
  gmapsText: palette.ink,
  gmapsSub: palette.inkSoft,
  appleLabel: palette.inkMuted,
  appleOrange: palette.sunset,
  appleGreen: palette.open,
  appleBlue: palette.lavInk,
  appleTile: palette.paperDeep,
  wanderBlue: palette.roseInk,
  wanderMuted: palette.inkMuted,
  wanderDash: palette.line,
  wanderPill: palette.roseTint,
  dayColor: palette.ink, // numbered pins
  dayRoute: palette.rose, // route lines
  walkDots: palette.inkMuted,
  airbnbText: palette.ink,
  airbnbSub: palette.inkSoft,
  airbnbRail: palette.line,
  airbnbDot: palette.paperDeep,
  airbnbBorder: "#D9C8B5",
  airbnbBadgeA: palette.rose,
  airbnbBadgeB: palette.roseInk,
  airbnbSecondary: palette.paperDeep,
  cornerSearch: palette.ink,
  cornerBlue: palette.roseInk,
  cornerSearchHere: palette.ink,
  cornerLand: "#EFE4D6",
  quoteBubble: palette.card,
  quoteRing: palette.roseTint,
  reactionBorder: palette.line,
  orDisc: palette.ink,
  toast: palette.ink,
  sage: palette.roseTint,
  emptyBody: palette.inkSoft,
  strava: palette.sunset,
  stravaBand: "#FFB27A",
  stravaCard: palette.plumRaised,
  partifulPurple: palette.lavender,
  partifulDeep: palette.plumRaised,
  partifulNight: palette.plum,
  partifulSide: palette.paperDeep,
  pollText: palette.inkSoft,
  messages: "#38E754",
  whatsapp: "#32D852",
  copyLink: palette.ink,
  shareSub: palette.inkMuted,
  shareLabel: palette.inkSoft,
  askMapsBlue: palette.roseInk,
  askMapsTail: palette.rose,
  askMapsFade: palette.roseTint,
  askMapsGlow: palette.sunsetTint,
  askMapsStrokeA: palette.sunset,
  askMapsStrokeB: palette.rose,
  loadingRow: palette.inkMuted,
  scrim: "rgba(30,21,48,0.38)",
  wrapped: [palette.sunset, palette.lavender, palette.rose, "#8FC97A"] as const,
  wrappedInk: palette.ink,
  wrappedPaper: palette.paper,
  dashTag: palette.roseInk,
  dashHeart: palette.rose,
  reorderPill: palette.paperDeep,
  reorderText: palette.ink,
} as const;

// Display type is Bricolage Grotesque (friendly, a little quirky, made for big lowercase
// headlines); body text is the system face (SF Pro on iPhone) for legibility at small sizes.
export const font = {
  display: "BricolageGrotesque_700Bold",
  displayHeavy: "BricolageGrotesque_800ExtraBold",
  displaySemi: "BricolageGrotesque_600SemiBold",
  // Older screens call the display face "serif".
  serif: "BricolageGrotesque_700Bold",
  serifBlack: "BricolageGrotesque_800ExtraBold",
  sans: Platform.select({ web: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Inter, system-ui, sans-serif", default: undefined }),
} as const;

export const size = { xs: 10, s: 12, m: 14, b: 16, l: 18, xl: 20, xxl: 22, h2: 24, h1: 28, d: 32 } as const;

export const radius = { s: 4, m: 8, l: 12, xl: 16, xxl: 24, card: 18, pill: 999 } as const;

// Paper casts a warm plum shadow, never grey.
export const shadow = {
  soft: Platform.select({
    web: { boxShadow: "0 2px 10px rgba(30,21,48,0.12)" },
    default: { shadowColor: "#1E1530", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  }) as object,
  card: Platform.select({
    web: { boxShadow: "0 6px 18px rgba(30,21,48,0.14)" },
    default: { shadowColor: "#1E1530", shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  }) as object,
} as const;

// Categories, each with an emoji as its little sticker.
export const CATEGORIES = [
  { id: "courts", label: "Courts", short: "courts", emoji: "🎾" },
  { id: "food", label: "Food", short: "eat", emoji: "🍜" },
  { id: "sweets", label: "Cafes and sweets", short: "cafes", emoji: "🧋" },
  { id: "night", label: "Night out", short: "go out", emoji: "🍸" },
  { id: "games", label: "Games and fun", short: "games", emoji: "🎳" },
  { id: "active", label: "Get active", short: "active", emoji: "🧗" },
  { id: "views", label: "Views and outdoors", short: "views", emoji: "🌅" },
  { id: "culture", label: "Culture", short: "culture", emoji: "🖼️" },
  { id: "shops", label: "Shops and markets", short: "shops", emoji: "🛍️" },
  { id: "classes", label: "Classes", short: "classes", emoji: "🏺" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const categoryInfo = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[1];
