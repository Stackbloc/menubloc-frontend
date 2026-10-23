import test from "node:test";
import assert from "node:assert/strict";
import {
  DETECTED_LOCATION_KEY,
  readDetectedLocation,
  saveDetectedLocation,
  shouldRequestGeolocation,
  resolveLocationPreference,
} from "../src/lib/discoveryLocationPersistence.js";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("A/B: first visit requests geolocation and detected coordinates can drive the feed", () => {
  assert.equal(shouldRequestGeolocation(null), true);
  const detected = { status: "ready", label: "Mobile, AL", city: "Mobile", state: "AL", lat: 30.69, lng: -88.04 };
  assert.equal(resolveLocationPreference({ detectedLocation: detected }).label, "Mobile, AL");
  assert.equal(resolveLocationPreference({ detectedLocation: detected }).lat, 30.69);
});

test("C: detected location survives refresh and suppresses another permission prompt", () => {
  const store = storage();
  assert.equal(saveDetectedLocation(store, { label: "Mobile, AL", city: "Mobile", state: "AL", lat: 30.69, lng: -88.04 }), true);
  const cached = readDetectedLocation(store);
  assert.equal(cached.label, "Mobile, AL");
  assert.equal(shouldRequestGeolocation(cached), false);
  assert.ok(store.getItem(DETECTED_LOCATION_KEY));
});

test("D: denied or unavailable geolocation falls back without throwing", () => {
  assert.deepEqual(resolveLocationPreference({ fallbackLabel: "Previously selected" }), {
    source: "fallback", label: "Previously selected",
  });
});

test("E: manual location overrides cached detection", () => {
  const preference = resolveLocationPreference({
    manualLabel: "Seattle, WA",
    detectedLocation: { label: "Mobile, AL", lat: 30.69, lng: -88.04 },
  });
  assert.deepEqual(preference, { source: "manual", label: "Seattle, WA" });
});

test("F: coordinates-only save nearby keeps the detected city (Find closest location)", () => {
  const store = storage();
  saveDetectedLocation(store, { label: "Los Angeles, CA", city: "Los Angeles", state: "CA", lat: 34.0224, lng: -118.2851 });
  saveDetectedLocation(store, { lat: 34.03, lng: -118.29 });
  const cached = readDetectedLocation(store);
  assert.equal(cached.city, "Los Angeles");
  assert.equal(cached.label, "Los Angeles, CA");
  assert.equal(cached.lat, 34.03);
  assert.equal(shouldRequestGeolocation(cached), false);
});

test("G: coordinates-only cache (no city) re-requests detection on the next visit", () => {
  const store = storage();
  saveDetectedLocation(store, { label: "Mobile, AL", city: "Mobile", state: "AL", lat: 30.69, lng: -88.04 });
  saveDetectedLocation(store, { lat: 34.03, lng: -118.29 });
  const cached = readDetectedLocation(store);
  assert.equal(cached.city, "");
  assert.equal(shouldRequestGeolocation(cached), true);
});
