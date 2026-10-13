import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveFeedOrderMarketState,
  resolveFeedViewerLocation,
  withFeedOrderMarketGate,
} from "../src/lib/feedOrderEligibility.js";

const dothanDetected = { city: "Dothan", state: "AL", lat: 31.2232, lng: -85.3905 };
const laDetected = { city: "Los Angeles", state: "CA", lat: 34.05, lng: -118.25 };

test("no preference and no detected location → unknown_location", () => {
  const viewer = resolveFeedViewerLocation({});
  assert.equal(viewer, null);
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Dothan", state: "AL" } }), "unknown_location");
});

test("detected location: within 30 miles is in market, farther is out of market", () => {
  const viewer = resolveFeedViewerLocation({ detected: dothanDetected });
  assert.equal(viewer.source, "detected");
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Dothan", state: "AL" }, distanceMiles: 4.5 }), "in_market");
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Los Angeles", state: "CA" }, distanceMiles: 1940 }), "out_of_market");
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Enterprise", state: "AL" }, distanceMiles: 30 }), "in_market");
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Montgomery", state: "AL" }, distanceMiles: 90 }), "out_of_market");
});

test("location preference wins over detected location", () => {
  // Physically in LA but preference set to Dothan → Dothan is the viewer's market.
  const viewer = resolveFeedViewerLocation({ preferenceLabel: "Dothan, AL", detected: laDetected });
  assert.equal(viewer.source, "preference");
  assert.equal(viewer.lat, null);
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Dothan", state: "AL" } }), "in_market");
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Los Angeles", state: "CA" } }), "out_of_market");
});

test("preference matching detected market keeps coordinates (distance check)", () => {
  const viewer = resolveFeedViewerLocation({ preferenceLabel: "Dothan, AL", detected: dothanDetected });
  assert.equal(viewer.lat, dothanDetected.lat);
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Dothan", state: "AL" }, distanceMiles: 4.5 }), "in_market");
});

test("LA County cities share the LA market when no distance is available", () => {
  const viewer = resolveFeedViewerLocation({ preferenceLabel: "Los Angeles, CA" });
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Santa Monica", state: "CA" } }), "in_market");
  assert.equal(resolveFeedOrderMarketState({ viewer, restaurant: { city: "Dothan", state: "AL" } }), "out_of_market");
});

test("withFeedOrderMarketGate: only in-market viewers can order from the Feed menu", () => {
  const menu = { city: "Dothan", state: "AL", ordering_availability: { available: true, message: "x" } };
  const dothan = resolveFeedViewerLocation({ detected: dothanDetected });
  const la = resolveFeedViewerLocation({ detected: laDetected });

  const off = withFeedOrderMarketGate(menu, { enabled: false, viewer: null });
  assert.equal(off.data, menu);
  assert.equal(off.orderMarketState, null);

  const inMarket = withFeedOrderMarketGate(menu, { enabled: true, viewer: dothan, distanceMiles: 3 });
  assert.equal(inMarket.data, menu);
  assert.equal(inMarket.orderMarketState, "in_market");

  const away = withFeedOrderMarketGate(menu, { enabled: true, viewer: la, distanceMiles: 1940 });
  assert.equal(away.orderMarketState, "out_of_market");
  assert.equal(away.data.ordering_availability.available, false);
  assert.equal(menu.ordering_availability.available, true, "source payload untouched");

  const unknown = withFeedOrderMarketGate(menu, { enabled: true, viewer: null });
  assert.equal(unknown.orderMarketState, "unknown_location");
  assert.equal(unknown.data.ordering_availability.available, false);
});

test("withFeedOrderMarketGate: restaurants stored at 0,0 fall back to city/state", () => {
  const vistango = { city: "Los Angeles", state: "CA", lat: 0, lng: 0, ordering_availability: { available: true } };
  const la = resolveFeedViewerLocation({ detected: laDetected });
  const dothan = resolveFeedViewerLocation({ detected: dothanDetected });
  assert.equal(withFeedOrderMarketGate(vistango, { enabled: true, viewer: la, distanceMiles: 7813.8 }).orderMarketState, "in_market");
  assert.equal(withFeedOrderMarketGate(vistango, { enabled: true, viewer: dothan, distanceMiles: 7813.8 }).orderMarketState, "out_of_market");
});
