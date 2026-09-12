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
  assert.doesNotMatch(row, /Meal \{mealNum\}/);
  assert.doesNotMatch(row, /diner-activity-scan-meal-num/);
  assert.match(row, /shouldPreferRestaurantMark/);
  assert.match(row, /diner-activity-scan-prose-name/);
  assert.match(row, /formatWhosEatingScanIdentity/);
  assert.match(row, /mealPeriodProseWord/);
  assert.match(row, /@home/);
  assert.match(row, /diner-activity-scan-dish/);
  assert.match(row, /diner-activity-scan-place/);
  assert.match(row, /profileHref/);
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
  assert.match(compose, /status-compose-open|hideTrigger/);
  assert.match(compose, /status-compose-sheet/);
  assert.match(compose, /ate-add-item/);
  assert.match(compose, /More items on this meal/);
  assert.match(compose, /Restaurant/);
  assert.match(compose, /@home/);
  assert.match(compose, /EatingPlaceFields/);
  assert.match(compose, /socialBtn\.primary/);
  assert.doesNotMatch(compose, /socialBtn\s*\(/);
  assert.doesNotMatch(compose, /I'?m eating @/);
  assert.doesNotMatch(compose, /MenuplyMediaPicker|getUserMedia|facingMode/);
  assert.match(hub, /ActivityStatusLineCompose/);
  assert.match(hub, /hideTrigger/);
  assert.match(hub, /status-compose-open/);
  assert.match(hub, /category="ate"/);
  assert.match(hub, /category="want"/);
  assert.match(hub, /editMode/);
  assert.match(hub, /ownerCompact/);
  assert.match(hub, /isConnectPreview/);
  assert.match(hub, /nameInProse=\{false\}/);
  assert.match(hub, /groupHubAteMeals/);
  assert.doesNotMatch(hub, /dailyMealNumber=\{index \+ 1\}/);
  assert.doesNotMatch(hub, /Meal \{/);
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
  assert.match(page, /profileView\.previewAsConnect|previewAsConnect/);
  assert.match(page, /useOutletContext/);
  assert.match(read("src/components/consumer/feed/ProfileViewModeToggle.jsx"), /profile-view-mode-toggle/);
  assert.match(hub, /isConnectPreview=\{isConnectPreview\}/);
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

test("prose activity: discovery reports meal at place, dish — not timeline layout", () => {
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
      food_name: "Chicken Sandwich",
      restaurant_name: "ABC Restaurant",
      meal_period: "lunch",
    }),
    "is eating lunch at ABC Restaurant, Chicken Sandwich"
  );
  assert.equal(
    formatActivityProseClause({
      kind: "ate",
      food_name: "Double-Double",
      restaurant_name: "In-N-Out",
    }),
    "is eating at In-N-Out, Double-Double"
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
        meal_period: "lunch",
      }
    ),
    "BeckG, F, 22, USC is eating lunch at In-N-Out, Double-Double."
  );
  assert.equal(
    formatActivityProseClause({
      kind: "ate",
      food_name: "burgers",
      homemade: true,
      cooking: true,
      meal_period: "dinner",
    }),
    "is eating dinner at @home, burgers"
  );
  assert.equal(
    formatActivityProseClause({
      kind: "ate",
      food_name: "Double-Double",
      restaurant_name: "In-N-Out",
      second_person: true,
    }),
    "are eating at In-N-Out, Double-Double"
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
  assert.equal(parts.proseClause, "is eating at In-N-Out, Double-Double");
  assert.doesNotMatch(parts.actionLine, /🍽️|🍔|😋/);
  assert.match(
    formatOwnEatingActivityLine({
      kind: "ate",
      food_name: "Meatball sub",
      restaurant_name: "Subway",
    }),
    /is eating at Subway, Meatball sub/
  );
  assert.match(
    formatConnectEatingLine({
      kind: "want",
      food_name: "Burgers",
    }),
    /wants Burgers/
  );
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(row, /mealPeriodProseWord/);
  assert.match(row, /ownerCompact/);
  assert.match(row, /timelineBody|diner-activity-scan-timeline-body/);
});

test("affiliation resolver ignores city-only location labels", () => {
  assert.equal(resolveDinerAffiliation({ school_affiliation: "USC" }), "USC");
  assert.equal(resolveDinerAffiliation({ location_label: "Los Angeles, CA" }), null);
});

test("unified meal periods include brunch snack other", () => {
  assert.ok(WHAT_I_ATE_MEAL_PERIODS.length >= 6);
  assert.deepEqual(
    WHAT_I_ATE_MEAL_PERIODS.map((p) => p.id),
    ["breakfast", "brunch", "lunch", "dinner", "late_night", "snack", "other"]
  );
  assert.equal(normalizeWhatIAteMealPeriod("brunch"), "brunch");
  assert.ok(defaultWhatIAteMealPeriod());
  // Waiter meal periods stay separate (no brunch).
  assert.equal(WAITER_MEAL_PERIODS.some((p) => p.id === "brunch"), false);
  assert.equal(normalizeMealPeriodId("brunch"), "lunch");
  assert.equal(typeof getDefaultMealPeriod, "function");
});

test("Multiplier/Feed video compose writes same diary fields used by prose rows", () => {
  const feed = read("src/lib/feedVideoCompose.js");
  assert.match(feed, /createWhatIAteMeal|createWhatIAteToday|what-i-ate/);
});

test("scan surfaces mount DinerActivityScanRow", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  assert.match(hub, /DinerActivityScanRow/);
  assert.match(nearby, /DinerActivityScanRow/);
});

test("My Favs (followed restaurants) rail has no Join Me pill", () => {
  const rails = read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx");
  const followBlock = rails.slice(
    rails.indexOf("function FollowedRestaurantsRail"),
    rails.indexOf("function FoodStoryCta")
  );
  assert.match(followBlock, /followed-restaurants-rail/);
  assert.match(followBlock, /PROFILE_SECTION_HEADERS\.favs|My Favs/);
  assert.doesNotMatch(followBlock, /Join Me/);

  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.doesNotMatch(hub, /profile-connect-preview-actions/);
  assert.match(hub, /readOnly && isJoinMeGuestHref/);
  assert.match(hub, /isConnectPreview && typeof onJoinMeFromCraving/);
  assert.match(hub, /scope="wanna-eat"/);
  assert.doesNotMatch(hub, /canEdit \|\| isConnectPreview/);
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
