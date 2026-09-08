/**
 * Profile activity-selection layer — peer profile before Feed/media.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {
  buildFoodExploreSearchUrl,
  dinerCanonicalProfilePath,
  formatWantActivityHeadline,
  foodExploreLabel,
} from "../src/lib/dinerActivityExplore.js";
import { dinerPeerProfilePath } from "../src/lib/liveFeedCategory.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Who's Eating / peer path uses canonical /account/diners/:id", () => {
  assert.equal(dinerPeerProfilePath(42), "/account/diners/42");
  assert.equal(dinerCanonicalProfilePath(42), "/account/diners/42");
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  assert.match(nearby, /dinerPeerProfilePath/);
  assert.match(nearby, /choose an activity/);
});

test("activity headline helpers + scan row on peer layer", () => {
  const line = formatWantActivityHeadline({
    displayName: "BeckyG",
    want: { food_name: "burger", food_interest_key: "burger" },
  });
  assert.match(line, /🍔 BeckyG wants burger/);
  assert.equal(foodExploreLabel({ food_name: "burger" }), "See burger");
  assert.match(
    buildFoodExploreSearchUrl({ foodName: "burger", city: "Los Angeles", state: "CA" }),
    /\/search\?q=burger/
  );
  assert.match(
    buildFoodExploreSearchUrl({ foodName: "burger", city: "Los Angeles", state: "CA" }),
    /city=Los\+Angeles/
  );
  const layer = read("src/pages/consumer/myMenuply/DinerActivitySelectionLayer.jsx");
  assert.match(layer, /DinerActivityScanRow/);
  assert.doesNotMatch(layer, /MenuplyMediaPicker|getUserMedia/);
});

test("Discoverable profile mounts activity-selection layer", () => {
  const page = read("src/pages/consumer/DiscoverableDinerProfilePage.jsx");
  assert.match(page, /DinerActivitySelectionLayer/);
  assert.match(page, /activityWants|activity\.wants/);
  assert.match(page, /diner-activity-selection|DinerActivitySelectionLayer/);
  assert.doesNotMatch(page, /Basic profile only until you Connect/);
});

test("Connection peer hub puts activity selection above rich media", () => {
  const page = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(page, /DinerActivitySelectionLayer/);
  assert.match(page, /showRichMedia=\{false\}/);
  const activityIdx = page.indexOf("<DinerActivitySelectionLayer");
  const homeIdx = page.indexOf("<HomeAtHomeSection");
  assert.ok(activityIdx >= 0 && homeIdx >= 0);
  assert.ok(activityIdx < homeIdx, "activity before @home");
});

test("SocialFoodInfoSection is mounted on My Menuply", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /SocialFoodInfoSection/);
});

test("legacy /diners/:id redirects authenticated peers to canonical profile", () => {
  const page = read("src/pages/consumer/DinerProfilePage.jsx");
  assert.match(page, /\/account\/diners\//);
  assert.match(page, /\/feed\/profile/);
});
