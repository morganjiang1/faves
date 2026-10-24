// Design tokens. Every value comes from a measured reference in docs/design_references.md
// (see docs/design_system.md for the source of each one). Beli wins where references disagree.
import { Platform } from "react-native";
import brand from "../../assets/brand/brand.json";

// The logo's colors live in assets/brand/brand.json with the logo file itself.
export const logo = { color: brand.color, glyph: brand.glyph } as const;

export const color = {
  bg: "#FFFFFF",
  brand: "#134452", // Beli teal: primary buttons, tab "+", selected toggles
  brandDeep: "#004F5E", // Beli stat values, links on light
  score: "#009C61", // Beli score circle number
  scoreList: "#329966", // Beli score circle in lists
  text: "#222427",
  textStrong: "#000000",
  textMuted: "#989AA3",
  textSub: "#606060", // DoorDash subdued text token
  border: "#D3D3D3", // Beli score ring / avatar ring
  hairline: "#E5E5E5",
  divider: "#F4F5F8", // Beli feed divider
  field: "#EBE8EC", // Beli search field fill
  chipOff: "#F3F3F3", // Uber Eats unselected chip
  chipOn: "#000000", // Uber Eats selected chip
  chipBeliOff: "#9DB3B7", // Beli unselected filled chip
  like: "#F90B0C", // Beli heart
  gem: "#A571ED", // Corner vibe dot
  gemText: "#868686", // Corner descriptor gray
  open: "#188438", // Google Maps "Open"
  closed: "#CE4E07", // Corner "closed"
  rateGreat: "#8CC3A7",
  rateOk: "#F6CB68",
  rateBad: "#EFABAD",
  sectionBand: "#F7F7F7", // DoorDash 6 pt band
  arrowCircle: "#E7E7E7", // DoorDash section arrow button
  tonal: "#D2F7FF", // Google Maps tonal pill fill
  tonalText: "#014F5B",
  gmapsPrimary: "#007B8B", // Google Maps filled "Directions"
  sheetGrabber: "#C7C7C7",
  circleButton: "#F2F2F2", // Google Maps share / close circles
  gmapsText: "#1F1F1F",
  gmapsSub: "#5E5E5E",
  appleLabel: "#7C7C7E", // Apple Maps stat strip label
  appleOrange: "#FC8C00",
  appleGreen: "#20BF3E",
  appleBlue: "#007AFF",
  appleTile: "#E4E6E3",
  wanderBlue: "#3F52E3", // Wanderlog links / "Directions"
  wanderMuted: "#6C757D", // Wanderlog leg text
  wanderDash: "#DEE2E6",
  wanderPill: "#EBEDFC", // Wanderlog time pill fill
  dayColor: "#7044AC", // Wanderlog purple day color (pins + route)
  dayRoute: "#B29DD2",
  walkDots: "#407090", // Citymapper walk leg dots
  airbnbText: "#222222",
  airbnbSub: "#6A6A6A",
  airbnbRail: "#DDDDDD",
  airbnbDot: "#EBEBEB",
  airbnbBorder: "#C1C1C1",
  airbnbBadgeA: "#E51F54",
  airbnbBadgeB: "#E21C5F",
  airbnbSecondary: "#F2F2F2",
  cornerSearch: "#1A1A1A",
  cornerBlue: "#1870FF",
  cornerSearchHere: "#1C64FC",
  cornerLand: "#ECECEC",
  quoteBubble: "#F7FBFE",
  quoteRing: "#B8D6F0",
  reactionBorder: "#B7BABF",
  orDisc: "#19444A",
  toast: "#212123",
  sage: "#DCE8E0", // Beli empty-state blob
  emptyBody: "#454545",
  strava: "#FC5200",
  stravaBand: "#FD7A3B",
  stravaCard: "#1A1A1A",
  partifulPurple: "#7E00F7",
  partifulDeep: "#2C0190",
  partifulNight: "#010039",
  partifulSide: "#F1F7F7",
  pollText: "#666666",
  messages: "#38E754",
  whatsapp: "#32D852",
  copyLink: "#171D1D",
  shareSub: "#807D81",
  shareLabel: "#656565",
  askMapsBlue: "#3C7ED8",
  askMapsTail: "#6C9FE2",
  askMapsFade: "#CFE0F5",
  askMapsGlow: "#D5E5FE",
  askMapsStrokeA: "#94A7B3",
  askMapsStrokeB: "#005FCB",
  loadingRow: "#747676", // Wanderlog "Loading driving info..."
  scrim: "rgba(0,0,0,0.33)",
  wrapped: ["#DAB503", "#9691FF", "#FF4834", "#95C90D"] as const,
  wrappedInk: "#272727",
  wrappedPaper: "#EFEFEA",
  dashTag: "#068089", // DoorDash promo tag teal
  dashHeart: "#EA2F1E",
  reorderPill: "#F1F1F1",
  reorderText: "#181818",
} as const;

// Type scale from DoorDash's type tokens: 10, 12, 14, 16, 18, 20, 22, 24, 28, 32.
export const font = {
  serif: "PlayfairDisplay_700Bold",
  serifBlack: "PlayfairDisplay_800ExtraBold",
  sans: Platform.select({ web: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Inter, system-ui, sans-serif", default: undefined }),
} as const;

export const size = { xs: 10, s: 12, m: 14, b: 16, l: 18, xl: 20, xxl: 22, h2: 24, h1: 28, d: 32 } as const;

export const radius = { s: 4, m: 8, l: 12, xl: 16, xxl: 24, pill: 999 } as const;

export const shadow = {
  // DoorDash search pill / Corner cards: soft drop shadow.
  soft: Platform.select({
    web: { boxShadow: "0 2px 8px rgba(0,0,0,0.12)" },
    default: { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  }) as object,
  card: Platform.select({
    web: { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
    default: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  }) as object,
} as const;

// Categories: emoji are Apple's own art (the same object-icon idea as Corner's category row).
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
