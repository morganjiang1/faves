// Brand colors for the icon and splash come from assets/brand/brand.json (one place to swap the logo).
const brand = require("./assets/brand/brand.json");

module.exports = ({ config }) => ({
  ...config,
  plugins: config.plugins.map((p) =>
    Array.isArray(p) && p[0] === "expo-splash-screen"
      ? ["expo-splash-screen", { ...p[1], backgroundColor: brand.color, image: "./assets/images/splash-icon.png", imageWidth: 120 }]
      : p
  ),
  android: {
    ...config.android,
    adaptiveIcon: { foregroundImage: "./assets/images/adaptive-icon.png", backgroundColor: brand.color },
  },
});
