// Lets the app's planner code run in Node (the Faves API): bundled media files load as
// placeholders and react-native's Platform answers "node".
const Module = require("node:module");
const path = require("node:path");
for (const ext of [".mp4", ".jpg", ".jpeg", ".png", ".ttf"]) require.extensions[ext] = (m) => { m.exports = 0; };
const stub = path.join(__dirname, "rn-stub.cjs");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "react-native") return stub;
  return resolve.call(this, request, ...rest);
};
