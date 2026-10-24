// Which clips should play: only on a focused screen, only in rows that are on screen, and
// only for the cards a horizontal row currently shows.
import { useIsFocused } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useWindowDimensions } from "react-native";
import type { LayoutChangeEvent, ListViewToken, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

interface Viewport { top: number; height: number; focused: boolean }
const Ctx = createContext<Viewport>({ top: 0, height: 10_000, focused: true });

// Wrap a vertical ScrollView's content; pass the returned handlers to the ScrollView.
export function useViewport(initialHeight = 800) {
  const [vp, setVp] = useState({ top: 0, height: initialHeight });
  const last = useRef(0);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    // Re-render rows only every 40 pt of scrolling.
    if (Math.abs(y - last.current) < 40) return;
    last.current = y;
    setVp((v) => ({ ...v, top: y }));
  }, []);
  const onLayout = useCallback((e: LayoutChangeEvent) => setVp((v) => ({ ...v, height: e.nativeEvent.layout.height })), []);
  return { vp, onScroll, onLayout };
}

export function ViewportProvider({ vp, children }: { vp: { top: number; height: number }; children: ReactNode }) {
  const focused = useIsFocused();
  return <Ctx.Provider value={{ ...vp, focused }}>{children}</Ctx.Provider>;
}

// A row inside the viewport: is it (mostly) on screen right now?
export function useRowVisible() {
  const vp = useContext(Ctx);
  const [box, setBox] = useState<{ y: number; h: number } | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setBox({ y, h: height });
  }, []);
  const visible = vp.focused && box != null && box.y + box.h * 0.6 > vp.top && box.y + box.h * 0.4 < vp.top + vp.height;
  return { visible, onLayout };
}

// Cards a horizontal list shows (at least 60% visible).
export function useVisibleItems() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    setIds(new Set(viewableItems.map((v) => String(v.key))));
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  return { ids, onViewableItemsChanged, viewabilityConfig };
}

export const useScreenFocused = () => useContext(Ctx).focused;

// Any nested view: is its middle on screen? Measured in window coordinates each time the
// surrounding scroll view moves, so it works however deep the view sits.
export function useOnScreen() {
  const vp = useContext(Ctx);
  const ref = useRef<{ measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null>(null);
  const [visible, setVisible] = useState(false);
  const { height, width } = useWindowDimensions();
  const check = useCallback(() => {
    ref.current?.measureInWindow?.((x, y, w, h) => {
      const midY = y + h / 2, midX = x + w / 2;
      setVisible(h > 0 && midY > 0 && midY < height && midX > 0 && midX < width);
    });
  }, [height, width]);
  useEffect(() => {
    const t = setTimeout(check, 60);
    return () => clearTimeout(t);
  }, [vp.top, check]);
  return { ref, visible: visible && vp.focused, onLayout: check };
}
