import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Venue capability profile + operator package shell (Phase 3)", () => {
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(shell, /ProfileUpcomingEvents/);
  assert.match(shell, /venue_capability_enabled|venueCapabilityEnabled/);
  assert.match(shell, /Upcoming Events/);

  const page = read("src/pages/operator/OperatorVenuePackagePage.jsx");
  assert.match(page, /operator-venue-capability-toggle/);
  assert.match(page, /setRestaurantCapability/);

  const layout = read("src/pages/operator/OperatorLayout.jsx");
  assert.match(layout, /\/operator\/events/);

  const app = read("src/App.jsx");
  assert.match(app, /OperatorVenuePackagePage/);
  assert.match(app, /path=["']\/operator\/events["']/);

  const api = read("src/lib/operatorApi.js");
  assert.match(api, /getRestaurantCapabilities/);
  assert.match(api, /setRestaurantCapability/);
});
