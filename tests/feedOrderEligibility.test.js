import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveFeedOrderMarketState,
  resolveFeedViewerLocation,
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
