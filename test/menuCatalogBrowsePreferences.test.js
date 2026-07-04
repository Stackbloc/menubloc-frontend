import test from "node:test";
import assert from "node:assert/strict";
import {
  MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY,
  readCatalogApplyDietaryPreferences,
  writeCatalogApplyDietaryPreferences,
} from "../src/lib/menuCatalogBrowsePreferences.js";

const storage = new Map();

global.window = {
  sessionStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

test("catalog dietary preferences default off", () => {
  storage.clear();
  assert.equal(readCatalogApplyDietaryPreferences(), false);
});

test("catalog dietary preferences persist for browse session", () => {
  storage.clear();
  writeCatalogApplyDietaryPreferences(true);
  assert.equal(storage.get(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY), "1");
  assert.equal(readCatalogApplyDietaryPreferences(), true);

  writeCatalogApplyDietaryPreferences(false);
  assert.equal(readCatalogApplyDietaryPreferences(), false);
  assert.equal(storage.has(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY), false);
});
