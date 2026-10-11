import test from "node:test";
import assert from "node:assert/strict";

import {
  SEARCH_SHOP_MODE_STORAGE_KEY,
  buildSearchShopModeSearch,
  readStoredSearchShopMode,
  resolveSearchShopMode,
  writeStoredSearchShopMode,
} from "../src/lib/searchShopMode.js";

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}
const throwingStorage = {
  getItem() { throw new Error("blocked"); },
  setItem() { throw new Error("blocked"); },
};

test("new users default to Search", () => {
  assert.equal(resolveSearchShopMode(new URLSearchParams(""), memoryStorage()), "search");
});

test("last mode is remembered; URL ?view= wins", () => {
  const store = memoryStorage();
  writeStoredSearchShopMode("menu-browser", store);
  assert.equal(store.getItem(SEARCH_SHOP_MODE_STORAGE_KEY), "menu-browser");
  assert.equal(resolveSearchShopMode(new URLSearchParams(""), store), "menu-browser");
  assert.equal(resolveSearchShopMode(new URLSearchParams("view=search"), store), "search");
});

test("blocked storage never throws", () => {
  assert.equal(readStoredSearchShopMode(throwingStorage), null);
  assert.doesNotThrow(() => writeStoredSearchShopMode("menu-browser", throwingStorage));
  assert.equal(resolveSearchShopMode(new URLSearchParams(""), throwingStorage), "search");
});

test("switching keeps query and filters", () => {
  const next = buildSearchShopModeSearch(new URLSearchParams("q=pizza&vegan=1&city=Los+Angeles"), "menu-browser");
  assert.equal(next.get("q"), "pizza");
  assert.equal(next.get("vegan"), "1");
  assert.equal(next.get("city"), "Los Angeles");
  assert.equal(next.get("view"), "menu-browser");
});
