// A clip fills its frame. StyleSheet.absoluteFill isn't enough on the web: a <video> is a
// replaced element, so top/left/right/bottom alone leave it at its own size and the frame shows
// only the clip's top corner (often just sky, which reads as a missing picture). Width and
// height 100% make it fill the frame; contentFit="cover" crops it.
export const VIDEO_FILL = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" } as const;
