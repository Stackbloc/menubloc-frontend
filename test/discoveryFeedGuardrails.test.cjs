"use strict";

const assert = require("assert");
const {
  appliedLocationMatchesGeoCityState,
  buildDiscoveryFeedScopeKey,
  buildDiscoveryLocationKey,
} = require("../src/lib/discoveryFeedGuardrails.js");

function testGeoCityMatch() {
  const auto = { city: "Los Angeles", state: "CA", lat: 34.05, lng: -118.24 };
  assert.strictEqual(
    appliedLocationMatchesGeoCityState("Los Angeles, CA", auto),
    true
  );
  assert.strictEqual(
    appliedLocationMatchesGeoCityState("Dothan, AL", auto),
    false
  );
}

function testScopeKeySeparatesGeoAndCity() {
  const key = buildDiscoveryLocationKey({
    shouldUseGeoBrowse: true,
    autoLocation: { lat: 34.05, lng: -118.24 },
    appliedLocation: "Los Angeles, CA",
  });
  assert.ok(key.startsWith("geo:"));
  const geoScope = buildDiscoveryFeedScopeKey({ locationKey: key, browseMode: "geo" });
  const cityScope = buildDiscoveryFeedScopeKey({ locationKey: key, browseMode: "city" });
  assert.notStrictEqual(geoScope, cityScope);
}

const { activeMarketsShareBrowseScope } = require("../src/lib/marketGate.js");

function testActiveMarketShareScope() {
  assert.strictEqual(
    activeMarketsShareBrowseScope(
      { city: "Los Angeles", state: "CA" },
      { city: "Santa Monica", state: "CA" }
    ),
    true
  );
  assert.strictEqual(
    activeMarketsShareBrowseScope(
      { city: "Los Angeles", state: "CA" },
      { city: "Dothan", state: "AL" }
    ),
    false
  );
}

testGeoCityMatch();
testScopeKeySeparatesGeoAndCity();
testActiveMarketShareScope();
console.log("✅ discoveryFeedGuardrails tests passed");
