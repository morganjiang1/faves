// A ticket's mini map: framed to fit every stop, covered by tiles, pins readable.
import { hasCoords, miniMapLayout, spreadPins, worldPx } from "../minimap";

const SF = [
  { lat: 37.7647, lng: -122.4381 }, // Randall Museum
  { lat: 37.7829, lng: -122.4646 }, // Green Apple Books
  { lat: 37.7826, lng: -122.4625 }, // M Pot, a block away
];

test("Web Mercator puts 0,0 in the middle of the world", () => {
  expect(worldPx({ lat: 0, lng: 0 }, 0)).toEqual({ x: 128, y: 128 });
  expect(worldPx({ lat: 0, lng: 180 }, 1).x).toBe(512);
});

test("the map frames every stop inside the box with padding, and tiles cover the whole box", () => {
  const w = 300, h = 120, pad = 22;
  const m = miniMapLayout(SF, [], w, h, pad);
  for (const p of m.stops) {
    expect(p.x).toBeGreaterThanOrEqual(pad - 0.5);
    expect(p.x).toBeLessThanOrEqual(w - pad + 0.5);
    expect(p.y).toBeGreaterThanOrEqual(pad - 0.5);
    expect(p.y).toBeLessThanOrEqual(h - pad + 0.5);
  }
  expect(m.zoom).toBeGreaterThan(11);
  expect(m.zoom).toBeLessThan(15);
  // Every pixel of the box is under some tile.
  for (let x = 0; x < w; x += 10) for (let y = 0; y < h; y += 10) {
    expect(m.tiles.some((t) => x >= t.left && x < t.left + t.size && y >= t.top && y < t.top + t.size)).toBe(true);
  }
  expect(m.tiles.every((t) => /^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(t.uri))).toBe(true);
  expect(new Set(m.tiles.map((t) => t.key)).size).toBe(m.tiles.length);
});

test("one stop gets a street-level map; overlapping pins are nudged apart", () => {
  const one = miniMapLayout([SF[0]], [], 300, 120);
  expect(one.zoom).toBe(15.5);
  expect(one.stops[0].x).toBeCloseTo(150, 0);
  const pins = spreadPins([{ x: 100, y: 60 }, { x: 104, y: 61 }, { x: 290, y: 60 }, { x: 292, y: 60 }], 300);
  for (let i = 0; i < pins.length; i++) for (let j = 0; j < i; j++) expect(Math.hypot(pins[i].x - pins[j].x, pins[i].y - pins[j].y)).toBeGreaterThanOrEqual(18);
  expect(Math.max(...pins.map((p) => p.x))).toBeLessThanOrEqual(300);
});

test("a stop without a location can't go on the real map", () => {
  expect(hasCoords(SF[0])).toBe(true);
  expect(hasCoords(null)).toBe(false);
  expect(hasCoords({ lat: Number.NaN, lng: 1 })).toBe(false);
  expect(hasCoords({ lat: 0, lng: 0 })).toBe(false);
});
