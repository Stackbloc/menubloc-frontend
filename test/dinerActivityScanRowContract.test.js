/**
 * Activity-first eating: CK compose + shared emoji rows for video and non-video.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatConnectEatingLine,
  formatOwnEatingActivityLine,
  formatWhosEatingDiscoveryLine,
  resolveDinerAffiliation,
} from "../src/lib/dinerDiscoverySummary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DinerActivityScanRow: play only when video; no camera on identity card", () => {
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(row, /diner-activity-scan-play/);
  assert.match(row, /diner-activity-scan-video/);
  assert.match(row, /activityLineOverride/);
  assert.doesNotMatch(row, /MenuplyMediaPicker|getUserMedia|facingMode/);
});

test("What I'm Eating in-section compose requires CK restaurant + menu item + meal period", () => {
  const compose = read("src/pages/consumer/myMenuply/EatingActivityCompose.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(compose, /eating-activity-compose/);
  assert.match(compose, /EatingPlaceFields/);
  assert.match(compose, /allowHomemade=\{false\}/);
  assert.match(compose, /menu_item_id/);
  assert.match(compose, /mealPeriod/);
  assert.match(compose, /marketDiscoverable: true/);
  assert.doesNotMatch(compose, /MenuplyMediaPicker|getUserMedia|facingMode/);
  assert.match(hub, /EatingActivityCompose/);
  assert.match(hub, /eating-activity-rows/);
  assert.match(hub, /formatOwnEatingActivityLine/);
  assert.doesNotMatch(page, /ActivityTextComposer|postScanActivityText/);
  assert.doesNotMatch(hub, /Shared from Feed/);
});

test("own / connect / Who's Eating activity phrasing", () => {
  assert.match(
    formatOwnEatingActivityLine({
      meal_period: "breakfast",
      restaurant_name: "Starbucks",
      food_name: "Chai Tea",
    }),
    /Breakfast\. Starbucks - Chai Tea/
  );
  assert.equal(
    formatConnectEatingLine({
      display_name: "Becky",
      restaurant_name: "Starbucks",
      food_name: "Chai Tea",
      meal_period: "breakfast",
    }),
    "Becky is having Starbucks Chai Tea for breakfast"
  );
  assert.equal(
    formatWhosEatingDiscoveryLine({
      display_name: "Becky",
      diner_sex_short: "F",
      age_years: 21,
      school_affiliation: "USC",
      restaurant_name: "Starbucks",
      food_name: "Chai Tea",
    }),
    "Becky, F, 21, USC is having Starbucks Chai Tea at Starbucks"
  );
  assert.equal(resolveDinerAffiliation({ school_affiliation: "USC" }), "USC");
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
});
