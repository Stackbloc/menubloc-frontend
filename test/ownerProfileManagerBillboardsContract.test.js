/**
 * Profile Manager: owner billboard + Windows upload section.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("ownerApi exposes menu-console billboard + window helpers", () => {
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /listOwnerRestaurantBillboards/);
  assert.match(api, /uploadOwnerRestaurantBillboardPhoto/);
  assert.match(api, /createOwnerRestaurantBillboard/);
  assert.match(api, /listOwnerRestaurantWindows/);
  assert.match(api, /uploadOwnerRestaurantWindowPhoto/);
  assert.match(api, /\/api\/owner\/menu-console\/restaurants/);
});

test("Profile Manager mounts billboards panel with upload testids", () => {
  const manager = read("src/pages/owner/OwnerProfileManager.jsx");
  const panel = read("src/pages/owner/OwnerProfileBillboardsPanel.jsx");
  assert.match(manager, /OwnerProfileBillboardsPanel/);
  assert.match(panel, /owner-profile-manager-billboards/);
  assert.match(panel, /owner-profile-billboard-add/);
  assert.match(panel, /owner-profile-billboard-photo-input/);
  assert.match(panel, /Promo headline \(optional\)/);
  assert.match(panel, /restaurant name already appears on the profile hero/);
  assert.match(panel, /owner-profile-window-add/);
  assert.match(panel, /owner-profile-window-photo-input/);
  assert.doesNotMatch(manager, /\/operator\/billboards/);
});
