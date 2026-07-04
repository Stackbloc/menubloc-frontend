import assert from "node:assert/strict";
import {
  buildAllergenExclusionSessionToastMessage,
  hasActiveAllergenExclusions,
  maybeBuildAllergenExclusionSessionToast,
  clearAllergenExclusionSessionToastMarker,
} from "../src/lib/allergenExclusionSessionToast.js";

const storage = new Map();
global.window = {
  sessionStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

function testNoMessageWhenNoneSelected() {
  assert.equal(
    hasActiveAllergenExclusions({ status: "off", configured: true, should_filter: false }, []),
    false
  );
  assert.equal(
    buildAllergenExclusionSessionToastMessage(
      { first_name: "Andre" },
      { status: "off", configured: true, should_filter: false },
      [{ allergen_key: "peanuts", is_enabled: false }]
    ),
    ""
  );
}

function testNoMessageWhenNotConfigured() {
  assert.equal(hasActiveAllergenExclusions({ status: "not_set" }, []), false);
  assert.equal(buildAllergenExclusionSessionToastMessage({}, { status: "not_set" }, []), "");
}

function testMessageWhenActive() {
  const message = buildAllergenExclusionSessionToastMessage(
    { first_name: "Andre" },
    {
      status: "active",
      should_filter: true,
      active_allergen_keys: ["peanuts", "dairy"],
      active_allergen_labels: ["Peanuts", "Dairy"],
    },
    []
  );
  assert.match(message, /Hi Andre — allergen exclusions are on \(Peanuts, Dairy\)/);
  assert.match(message, /Search results are filtered/);
}

function testOncePerSession() {
  storage.clear();
  clearAllergenExclusionSessionToastMarker();

  const payload = {
    consumerId: 42,
    profile: { first_name: "Andre" },
    allergenFilter: {
      status: "active",
      should_filter: true,
      active_allergen_keys: ["peanuts"],
      active_allergen_labels: ["Peanuts"],
    },
    allergenPreferences: [],
  };

  assert.ok(maybeBuildAllergenExclusionSessionToast(payload));
  assert.equal(maybeBuildAllergenExclusionSessionToast(payload), "");
}

testNoMessageWhenNoneSelected();
testNoMessageWhenNotConfigured();
testMessageWhenActive();
testOncePerSession();

console.log("✅ allergenExclusionSessionToast tests passed");
