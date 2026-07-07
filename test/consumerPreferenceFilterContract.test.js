/**
 * Consumer preference filter contract — menu auto-apply + allergen filtering.
 * PHMS P4-PRF-01 (static contract).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testPublicMenuUsesSessionDefaultApply() {
  const src = read("src/pages/PublicMenuPage.jsx");
  assert.match(src, /useCatalogDietaryPreferencesSession/);
  assert.match(src, /const \[applySavedPreferences, setApplySavedPreferences\] = useCatalogDietaryPreferencesSession\(\)/);
}

function testCatalogMenuUsesSessionDefaultApply() {
  const src = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(src, /useCatalogDietaryPreferencesSession/);
  assert.match(src, /enabledAllergenKeys/);
}

function testSessionDefaultIsApplyOn() {
  const src = read("src/lib/menuCatalogBrowsePreferences.js");
  assert.match(src, /stored === "0"/);
  assert.match(src, /return true/);
}

function testAllergensAlwaysAppliedOnMenus() {
  const src = read("src/lib/menuClientPreferenceFilter.js");
  assert.match(src, /allergenActive/);
  assert.match(src, /enabledAllergenKeys/);
}

function testBannerShowsCombinedFirstView() {
  const src = read("src/components/menu/MenuPreferencesAppliedBanner.jsx");
  assert.match(src, /preferencesAppliedCombined/);
  assert.match(src, /allergenProfileOnly/);
  assert.match(src, /clickToRemoveDietary/);
}

function testBannerShowsItemCounts() {
  const src = read("src/components/menu/MenuPreferencesAppliedBanner.jsx");
  assert.match(src, /Showing \{\{filtered\}\} out of \{\{total\}\} menu items\./);
  assert.match(src, /Showing \{\{total\}\} menu items/);
  assert.match(src, /filteredItemCount/);
}

testPublicMenuUsesSessionDefaultApply();
testCatalogMenuUsesSessionDefaultApply();
testSessionDefaultIsApplyOn();
testAllergensAlwaysAppliedOnMenus();
testBannerShowsCombinedFirstView();
testBannerShowsItemCounts();

console.log("✅ consumerPreferenceFilterContract tests passed");
