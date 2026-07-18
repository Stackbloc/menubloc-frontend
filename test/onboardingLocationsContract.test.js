/**
 * Locations onboarding — backend-authoritative MAX_MANUAL_LOCATIONS + guided Bulk Import.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  buildManualLocationLimitMessages,
  canAddManualLocation,
  EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS,
  MANUAL_LOCATION_LIMIT_MESSAGE,
  resolveManualLocationLimit,
  validateLocationForm,
} from "../src/lib/locationEntryPolicy.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("frontend emergency fallback is 10 and not treated as authoritative in policy comments", () => {
  assert.equal(EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS, 10);
  const policySrc = read("src/lib/locationEntryPolicy.js");
  assert.match(policySrc, /AUTHORITY: Backend/);
  assert.match(policySrc, /EMERGENCY FALLBACK/);
  assert.match(policySrc, /NOT a second authoritative constant/);
});

test("resolveManualLocationLimit prefers backend workspace.max_manual", () => {
  const fromBackend = resolveManualLocationLimit(10);
  assert.equal(fromBackend.max, 10);
  assert.equal(fromBackend.source, "backend");
  const custom = resolveManualLocationLimit(7);
  assert.equal(custom.max, 7);
  assert.equal(custom.source, "backend");
});

test("resolveManualLocationLimit uses emergency fallback when backend max missing", () => {
  const warn = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    const fb = resolveManualLocationLimit(undefined);
    assert.equal(fb.max, EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS);
    assert.equal(fb.source, "emergency_fallback");
    assert.ok(calls.length >= 1);
  } finally {
    console.warn = warn;
  }
});

test("canAddManualLocation respects provided max (backend-supplied)", () => {
  for (let n = 0; n < 10; n += 1) {
    assert.equal(canAddManualLocation(n, 10), true);
  }
  assert.equal(canAddManualLocation(10, 10), false);
  assert.equal(canAddManualLocation(4, 5), true);
  assert.equal(canAddManualLocation(5, 5), false);
});

test("guided messaging embeds the resolved configuration value", () => {
  const messages = buildManualLocationLimitMessages(10);
  assert.equal(messages.headline, "You've reached the manual location limit.");
  assert.match(messages.body, /more than 10 locations/);
  assert.equal(messages.primaryAction, "Import Locations");
  assert.equal(messages.secondaryAction, "Back to Locations");
  assert.match(MANUAL_LOCATION_LIMIT_MESSAGE, /Bulk Location Import/);

  const custom = buildManualLocationLimitMessages(7);
  assert.match(custom.body, /more than 7 locations/);
  assert.doesNotMatch(custom.body, /more than 10/);
});

test("Locations page consumes backend max_manual and guided Bulk Import transition", () => {
  const page = read("src/pages/RestaurantOnboardingLocations.jsx");
  assert.match(page, /resolveManualLocationLimit/);
  assert.match(page, /workspace\?\.max_manual/);
  assert.match(page, /buildManualLocationLimitMessages/);
  assert.match(page, /guidedBulkTransition/);
  assert.match(page, /startBulkImportFromGuide/);
  assert.match(page, /data-testid="guided-import-locations"/);
  assert.match(page, /data-testid="guided-back-to-locations"/);
  assert.match(page, /Import Locations/);
  assert.match(page, /Back to Locations/);
  assert.match(page, /completeOwnedLocationsCheckpoint/);
  assert.doesNotMatch(page, /data dump/i);
  assert.doesNotMatch(page, /more than 10 locations/);
});

test("Import Locations preserves Locations onboarding checkpoint", () => {
  const page = read("src/pages/RestaurantOnboardingLocations.jsx");
  assert.match(page, /persistLocationsCheckpoint/);
  assert.match(page, /persistRestaurantOnboardingState/);
  assert.match(page, /syncRestaurantOnboardingProgress/);
  assert.match(page, /current_step_key:\s*"locations"/);
  assert.match(page, /startBulkImportFromGuide[\s\S]*persistLocationsCheckpoint/);
});

test("Locations page wires validate → preview → confirm and never implies auto-create", () => {
  const page = read("src/pages/RestaurantOnboardingLocations.jsx");
  assert.match(page, /validateLocationImport/);
  assert.match(page, /confirmLocationImport/);
  assert.match(page, /no locations are created until you confirm/i);
  assert.match(page, /Download CSV template/);
  assert.match(page, /Manual Location Entry/);
  assert.match(page, /does not look like CSV|header row|Example:/);
  assert.match(page, /Downtown,501 East Adams St,Chicago,IL,60661/);
  assert.match(page, /result\.message/);
});

test("App mounts Locations page (not stub)", () => {
  const app = read("src/App.jsx");
  assert.match(app, /RestaurantOnboardingLocations/);
  assert.doesNotMatch(app, /RestaurantOnboardingLocationsStub/);
  assert.match(app, /path="\/restaurant\/onboarding\/locations"/);
});

test("operatorApi exposes locations + import + checkpoint endpoints", () => {
  const api = read("src/lib/operatorApi.js");
  assert.match(api, /createOwnedLocation/);
  assert.match(api, /validateLocationImport/);
  assert.match(api, /confirmLocationImport/);
  assert.match(api, /completeOwnedLocationsCheckpoint/);
  assert.match(api, /getOnboardingCheckpoint/);
  assert.match(api, /getLaunchReadiness/);
  assert.match(api, /onboarding\/locations\/import\/validate/);
  assert.match(api, /onboarding\/locations\/complete/);
  assert.match(api, /onboarding\/launch-readiness/);
  assert.match(api, /primary_location_id/);
});

test("location form validation requires address fields", () => {
  const bad = validateLocationForm({ restaurant_name: "A" });
  assert.equal(bad.ok, false);
  assert.ok(bad.missing.includes("address_line1"));
  const good = validateLocationForm({
    restaurant_name: "A",
    address_line1: "1 Main",
    city: "LA",
    state: "CA",
    postal_code: "90012",
  });
  assert.equal(good.ok, true);
  const badState = validateLocationForm({
    restaurant_name: "A",
    address_line1: "1 Main",
    city: "LA",
    state: "XX",
    postal_code: "90012",
  });
  assert.equal(badState.ok, false);
  assert.match(badState.message, /valid US state/i);
});

test("Locations page uses white Organization shell with placeholders and State select", () => {
  const page = read("src/pages/RestaurantOnboardingLocations.jsx");
  const policy = read("src/lib/locationEntryPolicy.js");
  assert.match(page, /backgroundColor:\s*"#ffffff"/);
  assert.doesNotMatch(page, /#f7f4ef/);
  assert.doesNotMatch(page, /#efe8df/);
  assert.match(page, /color:\s*"#1f2937"/);
  assert.match(page, /placeholder="e\.g\. 123 Main St"/);
  assert.match(page, /placeholder="e\.g\. Los Angeles"/);
  assert.match(page, /placeholder="e\.g\. 90012"/);
  assert.match(page, /placeholder="e\.g\. \(310\) 555-0100"/);
  assert.match(page, /id="loc_state"/);
  assert.match(page, /<select[\s\S]*id="loc_state"/);
  assert.match(page, /Select state/);
  assert.match(page, /US_STATE_OPTIONS/);
  assert.match(page, /LOCATION_COUNTRY_OPTIONS/);
  assert.match(page, /!showAdd \?/);
  assert.match(policy, /US_STATE_OPTIONS/);
  assert.match(policy, /Select a valid US state/);
});
