// Metro: keep the scraped data and reference screenshots out of the bundler's file map.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const ignored = [/\/data\/raw\/.*/, /\/data\/out\/.*/, /\/references\/.*/, /\/test-results\/.*/, /\/playwright-report\/.*/, /\/docs\/screens\/.*/];
const existing = config.resolver.blockList;
config.resolver.blockList = existing ? [].concat(existing, ignored) : ignored;

module.exports = config;
