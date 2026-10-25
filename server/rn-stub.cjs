// The two bits of react-native the planner's shared modules touch, for Node.
module.exports = { Platform: { OS: "node", select: (o) => (o && ("default" in o ? o.default : o.native)) } };
