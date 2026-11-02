/**
 * Search stable location (2026-10-23): identical back-to-back searches from the same
 * spot must send the same coordinates, and the page must not fire a location-less
 * /search while the browser location is still pending.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  SEARCH_GEO_KEY,
  SEARCH_GEO_TTL_MS,
  nextStableSearchGeo,
  readRecentSearchGeo,
  roundSearchCoord,
  saveSearchGeo,
  searchGeoGate,
} from "../src/lib/searchStableGeo.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("coordinates round to ~100 m", () => {
  assert.equal(roundSearchCoord(34.022437), 34.022);
  assert.equal(roundSearchCoord(-118.28513), -118.285);
  assert.equal(roundSearchCoord("x"), null);
});

test("GPS jitter keeps the previous point; a real move replaces it", () => {
  const prev = { lat: 34.022, lng: -118.285 };
  assert.deepEqual(nextStableSearchGeo(prev, { lat: 34.02251, lng: -118.28497 }), prev);
  assert.deepEqual(nextStableSearchGeo(prev, { lat: 34.0221, lng: -118.2853 }), prev);
  const moved = nextStableSearchGeo(prev, { lat: 34.0455, lng: -118.2571 });
  assert.deepEqual(moved, { lat: 34.046, lng: -118.257 });
  assert.deepEqual(nextStableSearchGeo(null, { lat: 34.02251, lng: -118.28497 }), { lat: 34.023, lng: -118.285 });
});

test("last fix is reused within the TTL and expires after it", () => {
  const s = storage();
  const t0 = 1_000_000;
  assert.equal(saveSearchGeo(s, { lat: 34.02251, lng: -118.28497 }, t0), true);
  assert.deepEqual(readRecentSearchGeo(s, t0 + 60_000), { lat: 34.023, lng: -118.285 });
  assert.equal(readRecentSearchGeo(s, t0 + SEARCH_GEO_TTL_MS + 1), null);
  s.setItem(SEARCH_GEO_KEY, "not json");
  assert.equal(readRecentSearchGeo(s, t0), null);
});

test("auto-location search waits for the browser location, with a timeout", () => {
  assert.equal(searchGeoGate({ geoStatus: "pending", hasExplicitLocation: false, hasRouteCoords: false, waitExpired: false }), "wait");
  assert.equal(searchGeoGate({ geoStatus: "pending", hasExplicitLocation: false, hasRouteCoords: false, waitExpired: true }), "go");
  assert.equal(searchGeoGate({ geoStatus: "granted", hasExplicitLocation: false, hasRouteCoords: false, waitExpired: false }), "go");
  assert.equal(searchGeoGate({ geoStatus: "denied", hasExplicitLocation: false, hasRouteCoords: false, waitExpired: false }), "go");
  assert.equal(searchGeoGate({ geoStatus: "pending", hasExplicitLocation: true, hasRouteCoords: false, waitExpired: false }), "go");
  assert.equal(searchGeoGate({ geoStatus: "pending", hasExplicitLocation: false, hasRouteCoords: true, waitExpired: false }), "go");
});

test("search page uses the stable location and the wait gate", () => {
  const page = read("src/pages/GrubbidSearchResults.jsx");
  assert.match(page, /from "\.\.\/lib\/searchStableGeo\.js"/);
  assert.match(page, /readRecentSearchGeo\(/);
  assert.match(page, /nextStableSearchGeo\(/);
  assert.match(page, /searchGeoGate\(/);
  assert.match(page, /geoGate === "wait"/);
});
