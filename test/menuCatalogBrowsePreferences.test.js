import test from "node:test";
import assert from "node:assert/strict";
import {
  MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY,
  MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY,
  readCatalogApplyDietaryPreferences,
  writeCatalogApplyDietaryPreferences,
  resetMenuPreferenceSessionForLogin,
} from "../src/lib/menuCatalogBrowsePreferences.js";

const storage = new Map();

global.window = {
  sessionStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

test("catalog dietary preferences default on (opt-out only)", () => {
  storage.clear();
  assert.equal(readCatalogApplyDietaryPreferences(), true);
});

test("catalog dietary preferences persist opt-out for browse session", () => {
  storage.clear();
  writeCatalogApplyDietaryPreferences(false);
  assert.equal(storage.get(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY), "0");
  assert.equal(readCatalogApplyDietaryPreferences(), false);

  writeCatalogApplyDietaryPreferences(true);
  assert.equal(readCatalogApplyDietaryPreferences(), true);
  assert.equal(storage.has(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY), false);
});

test("login reset clears opt-out and first-menu banner flag", () => {
  storage.clear();
  writeCatalogApplyDietaryPreferences(false);
  storage.set(MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY, "1");

  resetMenuPreferenceSessionForLogin();

  assert.equal(readCatalogApplyDietaryPreferences(), true);
  assert.equal(storage.has(MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY), false);
});
