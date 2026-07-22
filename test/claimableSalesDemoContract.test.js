import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function read(relativePath) {
  return fs.readFileSync(path.join(currentDir, "..", relativePath), "utf8");
}

test("RestaurantPublicPage renders full claimable profile with menu and claim CTA", () => {
  const source = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(source, /isFullClaimablePublicProfile/);
  assert.match(source, /Your Menuply profile is already set up/);
  assert.match(source, /Claim this profile/);
  assert.match(source, /menuPreviewItems=\{menuPreview\?\.items/);
  assert.doesNotMatch(source, /\.is_demo/);
  assert.doesNotMatch(source, /Demo profile/);
});

test("FoodTruckPage keeps custom ProfileHeaderCard for all trucks including full_claimable", () => {
  const source = read("src/pages/FoodTruckPage.jsx");
  assert.match(source, /ProfileHeaderCard/);
  assert.match(source, /public_ordering_mode === "display_only"/);
  assert.match(source, /public_profile_mode === "full_claimable"/);
  assert.match(source, /Your Menuply profile is already set up/);
  assert.match(source, /Claim this profile/);
  assert.match(source, /\/foodtrucks\/\$\{slug\}\/schedule/);
  assert.doesNotMatch(source, /RestaurantPublicEditorial/);
  assert.doesNotMatch(source, /FullClaimableFoodTruckProfile/);
  assert.doesNotMatch(source, /\.is_demo/);
});

test("RestaurantPublicPage redirects food_truck listings to /foodtrucks custom profile", () => {
  const source = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(source, /isFoodTruckListing/);
  assert.match(source, /buildFoodTruckProfileHref/);
  assert.match(source, /Navigate to=\{foodTruckHref\}/);
  assert.match(source, /\/foodtrucks\/\$\{encodeURIComponent\(target\)\}/);
});

test("OwnerMenuCreateWorkspace exposes internal Normal/Demo control only", () => {
  const source = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
  assert.match(source, /Listing mode \(internal\)/);
  assert.match(source, /\{ value: "demo", label: "Demo" \}/);
  assert.match(source, /search_eligible/);
  assert.match(source, /public_profile_path/);
  assert.match(source, /Claim status/);
});
