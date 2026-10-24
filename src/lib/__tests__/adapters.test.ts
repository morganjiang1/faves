import { decodePolyline } from "../adapters/routes";
import { services } from "../adapters";
import { llmEnabled } from "../llm";

test("decodes Google's encoded polylines", () => {
  // Google's documented example.
  const pts = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
  expect(pts).toEqual([
    { lat: 38.5, lng: -120.2 },
    { lat: 40.7, lng: -120.95 },
    { lat: 43.252, lng: -126.453 },
  ]);
});

test("with no keys every optional service is off", () => {
  expect(llmEnabled).toBe(false);
  expect(Object.values(services).every((v) => v === false)).toBe(true);
});
