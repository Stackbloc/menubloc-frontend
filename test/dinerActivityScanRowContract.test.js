/**
 * Quick status + derived food emoji scan language (no mortgage forms).
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
  resolveDinerAffiliation,
} from "../src/lib/dinerDiscoverySummary.js";
import {
  deriveFoodEmoji,
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

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerActivityScanRow: play only when video; no camera on identity card", () => {
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(row, /diner-activity-scan-play/);
  assert.match(row, /diner-activity-scan-video/);
  assert.match(row, /activityLineOverride/);
  assert.match(row, /actionLine/);
  assert.match(row, /detailLine/);
  assert.doesNotMatch(row, /MenuplyMediaPicker|getUserMedia|facingMode/);
});

test("What I'm Eating uses tiny FoodStatusQuickCompose — no EatingPlaceFields wall", () => {
  const compose = read("src/pages/consumer/myMenuply/FoodStatusQuickCompose.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(compose, /food-status-quick-compose/);
  assert.match(compose, /QUICK_STATUS_ACTIONS/);
  assert.match(compose, /food-status-food-chips/);
  assert.doesNotMatch(compose, /EatingPlaceFields|Search restaurant/);
  assert.doesNotMatch(compose, /WHAT_I_ATE_MEAL_PERIODS/);
  assert.doesNotMatch(compose, /MenuplyMediaPicker|getUserMedia|facingMode/);
  assert.match(hub, /FoodStatusQuickCompose/);
  assert.doesNotMatch(hub, /EatingActivityCompose/);
  assert.match(hub, /eating-activity-rows/);
  assert.doesNotMatch(page, /ActivityTextComposer|postScanActivityText/);
  assert.equal(fs.existsSync(path.join(root, "src/pages/consumer/myMenuply/EatingActivityCompose.jsx")), false);
});

test("scan identity and activity parts match BrandyS · 22 · USC / 🍔 Wanna Eat / Burgers · Tonight", () => {
  assert.equal(
    formatDinerScanIdentity({
      display_name: "BrandyS",
      age_years: 22,
      school_affiliation: "USC",
    }),
    "BrandyS · 22 · USC"
  );
  const want = formatActivityScanParts({
    kind: "want",
    food_interest_key: "burger",
    food_name: "Burgers",
    meal_period: "dinner",
    eaten_on: "2026-09-08",
  }, { todayYmd: "2026-09-08" });
  assert.equal(want.actionLine, "🍔 Wanna Eat");
  assert.match(want.detailLine, /Burgers/);
  assert.match(want.detailLine, /Tonight/);

  const ate = formatActivityScanParts({
    kind: "ate",
    food_interest_key: "sushi",
    food_name: "Sushi",
    meal_period: "lunch",
    eaten_on: "2026-09-07",
  }, { todayYmd: "2026-09-08" });
  assert.equal(ate.actionLine, "🍣 Ate");
  assert.match(ate.detailLine, /Sushi/);
  assert.match(ate.detailLine, /Yesterday/);

  assert.equal(deriveFoodEmoji({ food_name: "Korean BBQ" }), "🥩");
  assert.match(formatOwnEatingActivityLine({
    kind: "ate",
    food_name: "Meatball sub",
    restaurant_name: "Subway",
    meal_period: "lunch",
  }), /🍽️ Ate/);
  assert.match(formatConnectEatingLine({
    kind: "want",
    food_interest_key: "burger",
    food_name: "Burgers",
  }), /Wanna Eat/);
  assert.match(
    formatWhosEatingDiscoveryLine({
      display_name: "Becky",
      diner_sex_short: "F",
      age_years: 21,
      school_affiliation: "USC",
      kind: "ate",
      food_name: "Chai Tea",
      restaurant_name: "Starbucks",
    }),
    /Becky · F · 21 · USC/
  );
  assert.equal(resolveDinerAffiliation({ school_affiliation: "USC" }), "USC");
});

test("meal periods are only breakfast lunch dinner late_night (no brunch/snack/dessert)", () => {
  assert.deepEqual(
    WHAT_I_ATE_MEAL_PERIODS.map((p) => p.id),
    ["breakfast", "lunch", "dinner", "late_night"]
  );
  assert.equal(normalizeWhatIAteMealPeriod("brunch"), "lunch");
  assert.equal(normalizeWhatIAteMealPeriod("snack"), "lunch");
  assert.equal(normalizeWhatIAteMealPeriod("dessert"), "dinner");
  assert.equal(defaultWhatIAteMealPeriod(new Date(2026, 8, 8, 15, 0, 0)), "lunch");
  assert.deepEqual(
    WAITER_MEAL_PERIODS.map((p) => p.id),
    ["breakfast", "lunch", "dinner", "late_night"]
  );
  assert.equal(normalizeMealPeriodId("brunch"), "lunch");
  assert.equal(getDefaultMealPeriod(new Date(2026, 8, 8, 15, 0, 0), "America/Los_Angeles"), "lunch");
  assert.doesNotMatch(read("src/lib/waiterMealPeriod.js"), /id: "brunch"/);
});

test("Multiplier/Feed video compose writes same diary fields used by emoji rows", () => {
  const feed = read("src/lib/feedVideoCompose.js");
  assert.match(feed, /createWhatIAteToday/);
  assert.match(feed, /meal_period/);
  assert.match(feed, /restaurant_id/);
  assert.match(feed, /menu_item_id/);
  assert.match(feed, /market_discoverable: true/);
  assert.match(feed, /video_url|videoUrl/);
});

test("scan surfaces mount DinerActivityScanRow", () => {
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  const social = read("src/pages/consumer/myMenuply/SocialFoodInfoSection.jsx");
  assert.match(nearby, /DinerActivityScanRow/);
  assert.match(nearby, /includeSex/);
  assert.match(social, /DinerActivityScanRow/);
  assert.match(social, /formatConnectEatingLine/);
});
