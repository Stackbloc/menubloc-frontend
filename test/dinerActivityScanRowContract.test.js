/**
 * Profile modernization: compact compose + uniform activity rows.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatConnectEatingLine,
  formatDinerScanIdentity,
  formatOwnEatingActivityLine,
  formatWhosEatingDiscoveryLine,
  formatActivityProseSentence,
  resolveDinerAffiliation,
} from "../src/lib/dinerDiscoverySummary.js";
import {
  formatActivityProseClause,
  formatActivityScanParts,
} from "../src/lib/dinerSocialEmojiLanguage.js";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  normalizeWhatIAteMealPeriod,
  defaultWhatIAteMealPeriod,
} from "../src/lib/whatIAteTodayMealPeriod.js";
import {
  WAITER_MEAL_PERIODS,
  normalizeMealPeriodId,
  getDefaultMealPeriod,
} from "../src/lib/waiterMealPeriod.js";
import { shouldPreferRestaurantMark } from "../src/lib/restaurantMarkPreference.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerActivityScanRow: compact thumb + working video play", () => {
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(row, /diner-activity-scan-thumb/);
  assert.match(row, /diner-activity-scan-video/);
  assert.match(row, /diner-activity-scan-play/);
  assert.match(row, /controls/);
  assert.match(row, /ownerCompact/);
  assert.match(row, /showThumb/);
  assert.match(row, /nameInProse/);
  assert.match(row, /placeAsText/);
  assert.match(row, /dailyMealNumber/);
  assert.match(row, /diner-activity-scan-meal-num/);
  assert.match(row, /shouldPreferRestaurantMark/);
  // Owner deletes video/meal via long-press on the row (not feed CTA)
  assert.match(row, /useLongPressReveal/);
  assert.match(row, /diner-activity-scan-delete/);
  // No alphabet letter fallbacks for restaurant/food (text-only when no photo/emoji)
  assert.doesNotMatch(row, /thumbFallback/);
  assert.doesNotMatch(row, /initialLetter\(food \|\| place/);
  assert.doesNotMatch(row, /MenuplyMediaPicker|getUserMedia|facingMode/);
});

test("What I'm Eating / Wanna Eat use compact Add + sheet compose", () => {
  const compose = read("src/pages/consumer/myMenuply/ActivityStatusLineCompose.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(compose, /eating-status-line-compose|wanna-status-line-compose/);
  assert.match(compose, /status-compose-open/);
  assert.match(compose, /status-compose-sheet/);
  assert.match(compose, /Restaurant/);
  assert.match(compose, /@home/);
  assert.match(compose, /EatingPlaceFields/);
  assert.match(compose, /socialBtn\.primary/);
  assert.doesNotMatch(compose, /socialBtn\s*\(/);
  assert.doesNotMatch(compose, /I'?m eating @/);
  assert.doesNotMatch(compose, /MenuplyMediaPicker|getUserMedia|facingMode/);
  assert.match(hub, /ActivityStatusLineCompose/);
  assert.match(hub, /category="ate"/);
  assert.match(hub, /category="want"/);
  assert.match(hub, /editMode/);
  assert.match(hub, /ownerCompact/);
  assert.match(hub, /isConnectPreview/);
  assert.match(hub, /nameInProse=\{false\}/);
  assert.match(hub, /dailyMealNumber=\{index \+ 1\}/);
  assert.match(hub, /showThumb/);
  assert.match(hub, /activityAvatarUrl/);
  assert.match(hub, /want-cravings-action-box/);
  assert.match(hub, /Join Me \/ Take Me Out/);
  assert.doesNotMatch(hub, /nameInProse=\{isConnectPreview\}/);
  assert.doesNotMatch(hub, /WhatIAteMealBoard/);
  assert.doesNotMatch(hub, /Multiplier\/Post/);
  assert.doesNotMatch(hub, /FoodStatusQuickCompose|EatingActivityCompose/);
  assert.doesNotMatch(hub, /Invite & Make Me This/);
  assert.match(hub, /eating-activity-rows/);
  assert.match(page, /profile-view-mode-toggle/);
  assert.match(page, /previewAsConnect/);
  assert.doesNotMatch(page, /ActivityTextComposer|postScanActivityText/);
  assert.equal(
    fs.existsSync(path.join(root, "src/pages/consumer/myMenuply/FoodStatusQuickCompose.jsx")),
    false
  );
});

test("DinerActivityScanRow: place + dish clickable; chain mark preference", () => {
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(row, /diner-activity-scan-place/);
  assert.match(row, /diner-activity-scan-dish/);
  assert.match(row, /restaurantHref/);
  assert.match(row, /\/menu-items\//);
  assert.equal(shouldPreferRestaurantMark({ restaurant_name: "In-N-Out Burger" }), true);
  assert.equal(shouldPreferRestaurantMark({ restaurant_name: "NBC Seafood" }), false);
  assert.equal(shouldPreferRestaurantMark({ chain_id: 12, restaurant_name: "Local Spot" }), true);
});

test("prose activity: BeckG is eating Double-Double at In-N-Out — no decorative emoji", () => {
  assert.equal(
    formatDinerScanIdentity({
      display_name: "BeckG",
      age_years: 22,
      school_affiliation: "USC",
    }),
    "BeckG · 22 · USC"
  );
  assert.equal(
    formatActivityProseClause({
      kind: "ate",
      food_name: "Double-Double",
      restaurant_name: "In-N-Out",
    }),
    "is eating Double-Double at In-N-Out"
  );
  assert.equal(
    formatActivityProseSentence(
      {
        display_name: "BeckG",
        age_years: 22,
        school_affiliation: "USC",
        diner_sex_short: "F",
      },
      {
        kind: "ate",
        food_name: "Double-Double",
        restaurant_name: "In-N-Out",
      }
    ),
    "BeckG, F, 22, USC is eating Double-Double at In-N-Out."
  );
  assert.equal(
    formatActivityProseClause({
      kind: "ate",
      food_name: "burgers",
      homemade: true,
      cooking: true,
    }),
    "is cooking burgers at home"
  );
  assert.equal(
    formatActivityProseClause({
      kind: "ate",
      food_name: "Double-Double",
      restaurant_name: "In-N-Out",
      second_person: true,
    }),
    "are eating Double-Double at In-N-Out"
  );
  assert.equal(
    formatActivityProseClause({
      kind: "want",
      food_name: "Zaou Chicken",
      restaurant_name: "Chinatown",
    }),
    "wants Zaou Chicken at Chinatown"
  );
  const parts = formatActivityScanParts({
    kind: "ate",
    food_name: "Double-Double",
    restaurant_name: "In-N-Out",
  });
  assert.equal(parts.proseClause, "is eating Double-Double at In-N-Out");
  assert.doesNotMatch(parts.actionLine, /🍽️|🍔|😋/);
  assert.match(formatOwnEatingActivityLine({
    kind: "ate",
    food_name: "Meatball sub",
    restaurant_name: "Subway",
  }), /is eating Meatball sub at Subway/);
  assert.match(formatConnectEatingLine({
    kind: "want",
    food_name: "Burgers",
  }), /wants Burgers/);
});

test("affiliation resolver ignores city-only location labels", () => {
  assert.equal(resolveDinerAffiliation({ school_affiliation: "USC" }), "USC");
  assert.equal(resolveDinerAffiliation({ location_label: "Los Angeles, CA" }), null);
});

test("four meal periods only — breakfast lunch dinner late_night (no brunch)", () => {
  assert.equal(WHAT_I_ATE_MEAL_PERIODS.length, 4);
  assert.deepEqual(
    WHAT_I_ATE_MEAL_PERIODS.map((p) => p.id),
    ["breakfast", "lunch", "dinner", "late_night"]
  );
  assert.equal(normalizeWhatIAteMealPeriod("brunch"), "lunch");
  assert.ok(defaultWhatIAteMealPeriod());
  assert.equal(WAITER_MEAL_PERIODS.some((p) => p.id === "brunch"), false);
  assert.equal(normalizeMealPeriodId("brunch"), "lunch");
  assert.equal(typeof getDefaultMealPeriod, "function");
});

test("Multiplier/Feed video compose writes same diary fields used by prose rows", () => {
  const feed = read("src/lib/feedVideoCompose.js");
  assert.match(feed, /createWhatIAteToday|what-i-ate/);
});

test("scan surfaces mount DinerActivityScanRow", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  assert.match(hub, /DinerActivityScanRow/);
  assert.match(nearby, /DinerActivityScanRow/);
});

test("Restaurants you follow rail has no Join Me pill", () => {
  const rails = read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx");
  const followBlock = rails.slice(
    rails.indexOf("function FollowedRestaurantsRail"),
    rails.indexOf("function FoodStoryCta")
  );
  assert.match(followBlock, /followed-restaurants-rail/);
  assert.doesNotMatch(followBlock, /Join Me/);
});

test("profile keeps four distinct category sections", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(hub, /what-im-eating/);
  assert.match(hub, /want-to-eat/);
  assert.match(hub, /eating-plans/);
  assert.match(page, /my-events/);
  assert.match(hub, /eating-day-nav/);
});
