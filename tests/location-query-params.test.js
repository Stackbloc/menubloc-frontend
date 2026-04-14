import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBrowseLocationParams,
  buildSearchLocationParams,
  normalizeLocationLabel,
} from "../src/lib/locationUtils.js";

test("normalizeLocationLabel normalizes city/state labels", () => {
  assert.equal(normalizeLocationLabel("los angeles ca"), "Los Angeles, CA");
  assert.equal(normalizeLocationLabel("dothan, al"), "Dothan, AL");
  assert.equal(normalizeLocationLabel("36301"), "36301");
});

test("buildSearchLocationParams preserves explicit city/state without geo fallback", () => {
  const params = buildSearchLocationParams({
    query: "chicken",
    explicitLocationValue: "Los Angeles, CA",
    autoLocation: { city: "Dothan", state: "AL", lat: 31.2, lng: -85.4, label: "Dothan, AL" },
    radiusMiles: 8,
  });

  assert.equal(params.get("q"), "chicken");
  assert.equal(params.get("city"), "Los Angeles");
  assert.equal(params.get("state"), "CA");
  assert.equal(params.get("lat"), null);
  assert.equal(params.get("lng"), null);
  assert.equal(params.get("radius_miles"), null);
});

test("buildSearchLocationParams emits geo contract when no explicit location exists", () => {
  const params = buildSearchLocationParams({
    query: "chicken",
    explicitLocationValue: "",
    autoLocation: { city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437, label: "Los Angeles, CA" },
    radiusMiles: 8,
  });

  assert.equal(params.get("city"), "Los Angeles");
  assert.equal(params.get("state"), "CA");
  assert.equal(params.get("lat"), "34.0522");
  assert.equal(params.get("lng"), "-118.2437");
  assert.equal(params.get("radius_miles"), "8");
});

test("buildBrowseLocationParams keeps explicit city/state authoritative", () => {
  const params = buildBrowseLocationParams({
    urlCity: "Los Angeles",
    urlState: "CA",
    coords: { lat: 31.2232, lng: -85.3905 },
    radiusMiles: 5,
  });

  assert.deepEqual(params, {
    city: "Los Angeles",
    state: "CA",
    lat: 31.2232,
    lng: -85.3905,
    radius: 5,
  });
});

test("buildBrowseLocationParams emits geo mode when URL city/state absent", () => {
  const params = buildBrowseLocationParams({
    coords: { lat: 34.0522, lng: -118.2437 },
    radiusMiles: 10,
  });

  assert.deepEqual(params, {
    lat: 34.0522,
    lng: -118.2437,
    radius: 10,
  });
});
