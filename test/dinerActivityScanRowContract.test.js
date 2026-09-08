/**
 * Status-line compose + prose activity presentation (no decorative emoji walls).
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

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerActivityScanRow: prose + video without play glyph", () => {
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.doesNotMatch(row, /diner-activity-scan-play/);
  assert.match(row, /diner-activity-scan-video/);
  assert.match(row, /activityLineOverride/);
  assert.match(row, /formatActivityProseClause/);
  assert.doesNotMatch(row, /MenuplyMediaPicker|getUserMedia|facingMode/);
});

test("What I'm Eating / Wanna Eat use ActivityStatusLineCompose — category-scoped", () => {
  const compose = read("src/pages/consumer/myMenuply/ActivityStatusLineCompose.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(compose, /eating-status-line-compose|wanna-status-line-compose/);
  assert.match(compose, /Restaurant/);
  assert.match(compose, /@home/);
  assert.match(compose, /I'?m eating @|I&apos;m eating @/);
  assert.match(compose, /I wanna eat/);
  assert.match(compose, /EatingPlaceFields/);
  assert.match(compose, /socialBtn\.primary/);
  assert.doesNotMatch(compose, /socialBtn\s*\(/);
  assert.doesNotMatch(compose, /QUICK_STATUS_ACTIONS|Ate.*Wanna Eat/);
  assert.doesNotMatch(compose, /MenuplyMediaPicker|getUserMedia|facingMode/);
  assert.match(hub, /ActivityStatusLineCompose/);
  assert.match(hub, /category="ate"/);
  assert.match(hub, /category="want"/);
  assert.doesNotMatch(hub, /FoodStatusQuickCompose|EatingActivityCompose/);
  assert.match(hub, /eating-activity-rows/);
  assert.match(hub, /secondPerson=\{!readOnly\}/);
  assert.match(hub, /restaurantLogoUrl/);
  assert.match(hub, /diner-activity-scan-place|restaurantLogoUrl/);
  assert.doesNotMatch(page, /ActivityTextComposer|postScanActivityText/);
  assert.equal(
    fs.existsSync(path.join(root, "src/pages/consumer/myMenuply/FoodStatusQuickCompose.jsx")),
    false
  );
  assert.equal(
    fs.existsSync(path.join(root, "src/pages/consumer/myMenuply/EatingActivityCompose.jsx")),
    false
  );
});

test("DinerActivityScanRow: logo/billboard place + clickable dish", () => {
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(row, /diner-activity-scan-place/);
  assert.match(row, /diner-activity-scan-dish/);
  assert.match(row, /restaurantHref/);
  assert.match(row, /\/menu-items\//);
  assert.match(row, /secondPerson/);
  assert.doesNotMatch(row, /You is eating/);
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
  assert.match(
    formatWhosEatingDiscoveryLine({
      display_name: "BrandyS",
      age_years: 22,
      school_affiliation: "USC",
      diner_sex_short: "F",
      kind: "ate",
      food_name: "Sushi",
      restaurant_name: "Sugarfish",
    }),
    /BrandyS, F, 22, USC is eating Sushi at Sugarfish/
  );
});

test("affiliation resolver ignores city-only location labels", () => {
  assert.equal(resolveDinerAffiliation({ school_affiliation: "USC" }), "USC");
  assert.equal(resolveDinerAffiliation({ city: "Los Angeles" }), null);
});

test("four meal periods only — breakfast lunch dinner late_night (no brunch)", () => {
  assert.equal(WHAT_I_ATE_MEAL_PERIODS.length, 4);
  assert.equal(WAITER_MEAL_PERIODS.length, 4);
  assert.ok(WHAT_I_ATE_MEAL_PERIODS.every((p) => p.id !== "brunch"));
  assert.ok(WAITER_MEAL_PERIODS.every((p) => p.id !== "brunch"));
  assert.equal(normalizeWhatIAteMealPeriod("brunch"), "lunch");
  assert.equal(normalizeMealPeriodId("brunch"), "lunch");
  assert.ok(["breakfast", "lunch", "dinner", "late_night"].includes(defaultWhatIAteMealPeriod()));
  assert.ok(["breakfast", "lunch", "dinner", "late_night"].includes(getDefaultMealPeriod()));
});

test("Multiplier/Feed video compose writes same diary fields used by prose rows", () => {
  const feed = read("src/lib/feedVideoCompose.js");
  assert.match(feed, /createWhatIAteToday|createWantToEat/);
});

test("scan surfaces mount DinerActivityScanRow", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  assert.match(hub, /DinerActivityScanRow/);
  assert.match(nearby, /DinerActivityScanRow/);
});
