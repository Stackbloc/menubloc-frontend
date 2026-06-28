"use strict";

const assert = require("assert");
const { getTimeAwareMealChip } = require("../src/lib/homeNextMealChip.js");
const { buildHomeChipUrl, buildHomeBrowseUrl } = require("../src/lib/homeNextNavigation.js");

function atHour(h) {
  return new Date(2026, 5, 28, h, 30, 0);
}

assert.strictEqual(getTimeAwareMealChip(atHour(8)).label, "Breakfast");
assert.strictEqual(getTimeAwareMealChip(atHour(11)).label, "Brunch");
assert.strictEqual(getTimeAwareMealChip(atHour(13)).label, "Lunch");
assert.strictEqual(getTimeAwareMealChip(atHour(19)).label, "Dinner");
assert.strictEqual(getTimeAwareMealChip(atHour(23)).label, "Late Night");

const asianUrl = buildHomeChipUrl(
  { query: "asian food", cuisine: "asian" },
  { appliedLocation: "Los Angeles, CA", autoLocation: null, shouldUseGeoBrowse: false }
);
assert.ok(asianUrl.includes("cuisine=asian"), "Asian chip sets cuisine param");
assert.ok(asianUrl.includes("q=asian"), "Asian chip keeps food intent query");

const waiterUrl = buildHomeChipUrl({ to: "/waiter" }, {});
assert.strictEqual(waiterUrl, "/waiter");

const browseUrl = buildHomeBrowseUrl({
  sectionId: "nearby",
  appliedLocation: "Los Angeles, CA",
  autoLocation: { lat: 34.05, lng: -118.24, city: "Los Angeles", state: "CA" },
  shouldUseGeoBrowse: true,
});
assert.ok(browseUrl.startsWith("/browse-menus?"), "View all links to browse-menus");
assert.ok(browseUrl.includes("sort=nearby"), "Nearby section adds sort hint");

console.log("homeNext wiring tests passed");
