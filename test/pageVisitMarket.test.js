"use strict";

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePageVisitMarket } from "../src/lib/analyticsPageVisitMarket.js";

function store(entries = {}) {
  const map = new Map(Object.entries(entries));
  return { getItem: (k) => (map.has(k) ? map.get(k) : null) };
}

const DETECTED = JSON.stringify({ lat: 34.02, lng: -118.28, city: "Los Angeles", state: "CA", label: "Near USC" });

test("chosen session location wins over detected city", () => {
  const out = resolvePageVisitMarket({
    sessionStorage: store({ "grubbid.discovery.location": "Dothan, AL" }),
    localStorage: store({ "grubbid.discovery.detected_location.v1": DETECTED }),
  });
  assert.deepEqual(out, { market: "Dothan, AL", source: "manual" });
});

test("falls back to detected city/state, never coordinates", () => {
  const out = resolvePageVisitMarket({
    sessionStorage: store(),
    localStorage: store({ "grubbid.discovery.detected_location.v1": DETECTED }),
  });
  assert.deepEqual(out, { market: "Los Angeles, CA", source: "detected" });
  assert.doesNotMatch(out.market, /34\.02|118/);
});

test("returns null when the app knows no location or storage throws", () => {
  assert.equal(resolvePageVisitMarket({ sessionStorage: store(), localStorage: store() }), null);
  const throwing = { getItem: () => { throw new Error("blocked"); } };
  assert.equal(resolvePageVisitMarket({ sessionStorage: throwing, localStorage: throwing }), null);
});
