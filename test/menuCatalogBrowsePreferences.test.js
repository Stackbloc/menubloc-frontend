import test from "node:test";
import assert from "node:assert/strict";
import {
  MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY,
  readCatalogApplyDietaryPreferences,
  writeCatalogApplyDietaryPreferences,
  resetMenuPreferenceSessionForLogin,
  __resetDietaryPreferencesOptOutForTests,
} from "../src/lib/menuCatalogBrowsePreferences.js";

const storage = new Map();

global.window = {
  sessionStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

test.beforeEach(() => {
  storage.clear();
  __resetDietaryPreferencesOptOutForTests();
});

test("catalog dietary preferences default on (opt-out only)", () => {
  assert.equal(readCatalogApplyDietaryPreferences(), true);
});

test("catalog dietary preferences opt-out is in-memory for SPA navigation", () => {
  writeCatalogApplyDietaryPreferences(false);
  assert.equal(readCatalogApplyDietaryPreferences(), false);

  writeCatalogApplyDietaryPreferences(true);
  assert.equal(readCatalogApplyDietaryPreferences(), true);
});

test("login reset clears opt-out and first-menu banner flag", () => {
  writeCatalogApplyDietaryPreferences(false);
  storage.set(MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY, "1");

  resetMenuPreferenceSessionForLogin();

  assert.equal(readCatalogApplyDietaryPreferences(), true);
  assert.equal(storage.has(MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY), false);
});
