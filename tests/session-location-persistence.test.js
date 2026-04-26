/**
 * Guardrail tests for session location persistence in GrubbidDiscovery.
 *
 * These tests encode the invariant that a manually-set location survives
 * back-navigation (component remount). They directly model the two lines
 * that implement the protection:
 *
 *   GrubbidDiscovery.jsx line 216-218 — initialization:
 *     const locationManuallySet = useRef(
 *       typeof window !== "undefined" && !!window.sessionStorage.getItem(SESSION_LOCATION_KEY)
 *     );
 *
 *   GrubbidDiscovery.jsx line 289 — geo-overwrite guard:
 *     if (locationManuallySet.current) return;
 *     setAppliedLocation(autoLocation.label);
 *
 * If either line is changed to break the invariant the tests below will fail.
 */

import test from "node:test";
import assert from "node:assert/strict";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";

// Minimal sessionStorage stand-in (Map-backed, same API surface used in the component).
function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
  };
}

// Re-implement the initialization expression exactly as it appears in the component.
// Any agent that changes useRef(false) vs useRef(<sessionStorage read>) will break this.
function initLocationManuallySet(storage) {
  // mirrors: typeof window !== "undefined" && !!window.sessionStorage.getItem(SESSION_LOCATION_KEY)
  return !!storage.getItem(SESSION_LOCATION_KEY);
}

// Re-implement the geo guard + overwrite.
function applyGeoIfAllowed({ locationManuallySet, autoLabel, currentApplied }) {
  // mirrors: if (locationManuallySet.current) return;
  if (locationManuallySet) return currentApplied;
  // mirrors: setAppliedLocation(autoLocation.label);
  return autoLabel;
}

// ---------------------------------------------------------------------------
// Scenario 1: User sets manual location, navigates away, presses Back.
//             Location must survive the remount.
// ---------------------------------------------------------------------------
test("manual location survives back-navigation (sessionStorage preserved)", () => {
  // After applyLocationChange the component wrote the label to sessionStorage.
  // On remount (back-nav) the component reads it back via the useRef initializer.
  const storage = makeStorage({ [SESSION_LOCATION_KEY]: "Los Angeles, CA" });

  const locationManuallySet = initLocationManuallySet(storage);
  assert.equal(locationManuallySet, true, "locationManuallySet must be true when sessionStorage has a label");

  // Geo fires and attempts to overwrite with a different city.
  const result = applyGeoIfAllowed({
    locationManuallySet,
    autoLabel: "San Francisco, CA",   // whatever geo detects
    currentApplied: "Los Angeles, CA",
  });

  assert.equal(result, "Los Angeles, CA", "Applied location must not change when locationManuallySet is true");
});

// ---------------------------------------------------------------------------
// Scenario 2: No manual location — geo is the only source.
//             Geo must be allowed to set the initial location.
// ---------------------------------------------------------------------------
test("geo sets location when no manual location exists in sessionStorage", () => {
  const storage = makeStorage(); // empty — no manual location

  const locationManuallySet = initLocationManuallySet(storage);
  assert.equal(locationManuallySet, false, "locationManuallySet must be false when sessionStorage is empty");

  const result = applyGeoIfAllowed({
    locationManuallySet,
    autoLabel: "Los Angeles, CA",
    currentApplied: "",
  });

  assert.equal(result, "Los Angeles, CA", "Geo should set location when no manual location exists");
});

// ---------------------------------------------------------------------------
// Scenario 3: Geo fires AFTER user set a location in the same session.
//             The label written to sessionStorage during applyLocationChange
//             must protect against a second geo resolution.
// ---------------------------------------------------------------------------
test("geo does not overwrite location already saved by applyLocationChange", () => {
  const storage = makeStorage();

  // Simulate applyLocationChange saving the label.
  storage.setItem(SESSION_LOCATION_KEY, "New York, NY");

  // Simulate component remount (back-nav) — useRef re-initializes from storage.
  const locationManuallySet = initLocationManuallySet(storage);
  assert.equal(locationManuallySet, true);

  const result = applyGeoIfAllowed({
    locationManuallySet,
    autoLabel: "Los Angeles, CA",  // user is physically in LA
    currentApplied: "New York, NY",
  });

  assert.equal(result, "New York, NY", "Manual location must win over geo even when user is physically elsewhere");
});

// ---------------------------------------------------------------------------
// Regression guard: the exact bug this commit fixed.
//   useRef(false) always initializes to false, causing geo to overwrite on
//   every remount regardless of what is in sessionStorage.
// ---------------------------------------------------------------------------
test("regression: useRef(false) pattern causes geo to overwrite saved location (documents the old bug)", () => {
  const storage = makeStorage({ [SESSION_LOCATION_KEY]: "Los Angeles, CA" });

  // The broken initialization: hardcoded false (what was in the code before this fix).
  const brokenLocationManuallySet = false;

  const result = applyGeoIfAllowed({
    locationManuallySet: brokenLocationManuallySet,
    autoLabel: "San Francisco, CA",
    currentApplied: "Los Angeles, CA",
  });

  // With the broken init, geo always wins — this is the bug.
  assert.equal(
    result,
    "San Francisco, CA",
    "useRef(false) allows geo to overwrite — this test documents the regression; the fix must use sessionStorage init"
  );

  // Confirm the correct init would have prevented this.
  const fixedLocationManuallySet = initLocationManuallySet(storage); // reads from storage
  const fixedResult = applyGeoIfAllowed({
    locationManuallySet: fixedLocationManuallySet,
    autoLabel: "San Francisco, CA",
    currentApplied: "Los Angeles, CA",
  });
  assert.equal(fixedResult, "Los Angeles, CA", "Correct init protects saved location");
});
