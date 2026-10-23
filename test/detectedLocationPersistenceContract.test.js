/**
 * Detected diner location (2026-10-23): feed pages only read the saved city, so a
 * coordinates-only save must never wipe it, and a cache with no city must re-detect.
 * Regression: FE 863cc365 "Find closest location" saved {lat,lng} and diners had to
 * set their location by hand on every visit.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  DETECTED_LOCATION_KEY,
  readDetectedLocation,
  saveDetectedLocation,
  shouldRequestGeolocation,
} from "../src/lib/discoveryLocationPersistence.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const PERSISTENCE = "src/lib/discoveryLocationPersistence.js";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(relative(root, full));
  }
  return out;
}

const LA = { label: "Los Angeles, CA", city: "Los Angeles", state: "CA", lat: 34.0224, lng: -118.2851 };

test("coordinates-only save nearby keeps the saved city", () => {
  const store = storage();
  saveDetectedLocation(store, LA);
  saveDetectedLocation(store, { lat: 34.03, lng: -118.29 });
  const cached = readDetectedLocation(store);
  assert.equal(cached.city, "Los Angeles");
  assert.equal(cached.state, "CA");
  assert.equal(cached.label, "Los Angeles, CA");
  assert.equal(cached.lat, 34.03, "fresh coordinates still win");
  assert.equal(shouldRequestGeolocation(cached), false);
});

test("coordinates-only save far away drops the stale city and re-detects", () => {
  const store = storage();
  saveDetectedLocation(store, LA);
  saveDetectedLocation(store, { lat: 30.69, lng: -88.04 });
  const cached = readDetectedLocation(store);
  assert.equal(cached.city, "");
  assert.equal(shouldRequestGeolocation(cached), true);
});

test("a cache without city or state always re-detects; a full one does not", () => {
  assert.equal(shouldRequestGeolocation(null), true);
  assert.equal(shouldRequestGeolocation({ lat: 34, lng: -118, city: "", state: "" }), true);
  assert.equal(shouldRequestGeolocation({ lat: 34, lng: -118, city: "Los Angeles", state: "" }), true);
  assert.equal(shouldRequestGeolocation({ lat: 34, lng: -118, city: "Los Angeles", state: "CA" }), false);
});

test("only the persistence lib writes the detected-location key", () => {
  const offenders = walk(join(root, "src")).filter((rel) => {
    if (rel === PERSISTENCE) return false;
    const src = read(rel);
    return src.includes(DETECTED_LOCATION_KEY) || /setItem\(\s*DETECTED_LOCATION_KEY/.test(src);
  });
  assert.deepEqual(offenders, [], "save through saveDetectedLocation() so the city merge applies");
});

test("every auto-detector gates on shouldRequestGeolocation", () => {
  for (const rel of ["src/hooks/useDiscoveryAutoLocation.js", "src/hooks/useHomeBrowseFeed.js", "src/pages/GrubbidDiscovery.jsx"]) {
    assert.match(read(rel), /if \(!shouldRequestGeolocation\(cached\)\) return/, rel);
  }
});

test("feed shell repairs a coordinates-only cache without prompting new visitors", () => {
  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shell, /useDiscoveryAutoLocation\(\{ repairOnly: true \}\)/);
  const hook = read("src/hooks/useDiscoveryAutoLocation.js");
  assert.match(hook, /export default function useDiscoveryAutoLocation\(\{ repairOnly = false \} = \{\}\)/);
  assert.match(hook, /if \(repairOnly && !cached\) return undefined;/);
  assert.match(hook, /async function ipFallback\(\) \{\s*if \(repairOnly\) return;/);
});
