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
  assert.match(src, /useCatalogDietaryPreferencesSession\(\s*dietPreferenceActive\s*\)/);
}

function testCatalogMenuUsesSessionDefaultApply() {
  const src = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(src, /useCatalogDietaryPreferencesSession/);
  assert.match(src, /enabledAllergenKeys/);
}

function testSessionDefaultIsApplyOn() {
  const src = read("src/lib/menuCatalogBrowsePreferences.js");
  assert.match(src, /dietaryPreferencesOptedOut/);
  assert.match(src, /return !dietaryPreferencesOptedOut/);
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

function testPublicMenuPassesFilterParamsToApi() {
  const src = read("src/pages/PublicMenuPage.jsx");
  assert.match(src, /appendSavedMenuPreferenceQueryParams/);
  assert.doesNotMatch(src, /setApplySavedPreferences\(false\)/);
}

function testCatalogMenuPassesFilterParamsToApi() {
  const src = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(src, /appendSavedMenuPreferenceQueryParams/);
}

function testProfileOmitsUnsupportedDietOptions() {
  const src = read("src/pages/consumer/accountDashboard/accountDashboardOptions.js");
  assert.doesNotMatch(src, /\bhalal\b/);
  assert.doesNotMatch(src, /\bkosher\b/);
  assert.doesNotMatch(src, /\bpaleo\b/);
  assert.match(src, /high_protein/);
  assert.match(src, /nut_free/);
}

function testMenuFilterMapsHighProteinAndNutFree() {
  const src = read("src/lib/menuClientPreferenceFilter.js");
  assert.match(src, /high_protein:/);
  assert.match(src, /nut_free:/);
  const diet = read("src/hooks/useDietPreferences.js");
  assert.match(diet, /prefs\.high_protein/);
  assert.match(diet, /prefs\.nut_free/);
}

testPublicMenuUsesSessionDefaultApply();
testCatalogMenuUsesSessionDefaultApply();
testSessionDefaultIsApplyOn();
testAllergensAlwaysAppliedOnMenus();
testBannerShowsCombinedFirstView();
testPublicMenuPassesFilterParamsToApi();
testCatalogMenuPassesFilterParamsToApi();
testProfileOmitsUnsupportedDietOptions();
testMenuFilterMapsHighProteinAndNutFree();

function testBannerUsesCompactCheckboxToggle() {
  const src = read("src/components/menu/MenuPreferencesAppliedBanner.jsx");
  assert.match(src, /type="checkbox"/);
  assert.match(src, /applyDietaryPreferences/);
  assert.match(src, /TOAST_DISMISS_MS/);
  assert.doesNotMatch(src, /preferenceFilterCountActive/);
}

testBannerUsesCompactCheckboxToggle();

console.log("✅ consumerPreferenceFilterContract tests passed");
