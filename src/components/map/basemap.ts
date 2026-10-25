// The Faves basemap: OpenStreetMap's standard raster tiles, keyless, the same on the iPhone and
// the web, washed with the paper color so they sit in the warm postcard look. On the iPhone
// they replace Apple's map, because Apple's tiles can fail to load (a simulator on some networks
// shows only a blank grid) and the Apple map in react-native-maps reports neither "loaded" nor
// tile errors, so a fallback timer can't tell a good map from a blank one.
// EXPO_PUBLIC_MAP_TILES=apple brings Apple's map back. (CARTO's tiles now need an API key.)
// OpenStreetMap's tile policy: identify the app (iOS sends the app's own User-Agent, browsers
// send theirs), cache (the system URL cache does), and show the attribution on the map.
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_MAX_ZOOM = 19;
export const ATTRIBUTION = "© OpenStreetMap contributors";
export const ATTRIBUTION_HTML = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// The paper wash over the tiles: the native map lays a translucent paper polygon over them,
// the web map uses a CSS filter.
export const WASH = "rgba(255,248,241,0.45)";
export const WEB_TILE_FILTER = "saturate(0.6) sepia(0.12) brightness(1.03) contrast(0.95)";
export const APPLE_TILES = process.env.EXPO_PUBLIC_MAP_TILES === "apple";
