import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  filterClusterRestaurantsForMenuBrowser,
  isClusterRestaurantMenuReady,
  isMenuBrowserClusterScope,
  mapClusterRestaurantToBrowseEntry,
} from "../src/lib/menuBrowserClusterSequence.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const browseSrc = readFileSync(join(root, "src/pages/BrowseMenus.jsx"), "utf8");
const hookSrc = readFileSync(join(root, "src/hooks/useMenuCatalogSequence.js"), "utf8");

test("isMenuBrowserClusterScope accepts venue cover slugs only", () => {
  assert.equal(isMenuBrowserClusterScope("la-live"), true);
  assert.equal(isMenuBrowserClusterScope("coachella-2027"), true);
  assert.equal(isMenuBrowserClusterScope("lacc"), false);
  assert.equal(isMenuBrowserClusterScope(""), false);
});

test("mapClusterRestaurantToBrowseEntry keeps CatalogMenuRenderer identity fields", () => {
  const entry = mapClusterRestaurantToBrowseEntry({
    restaurant_id: 78119,
    restaurant_name: "The Mixing Room Cocktail Lounge",
    slug: "the-mixing-room-cocktail-lounge",
    city: "Los Angeles",
    state: "CA",
    menu_ready: true,
    has_menu: true,
  });
  assert.equal(entry.restaurant_id, 78119);
  assert.equal(entry.restaurant_name, "The Mixing Room Cocktail Lounge");
  assert.equal(entry.slug, "the-mixing-room-cocktail-lounge");
  assert.equal(entry.menu_ready, true);
});

test("filterClusterRestaurantsForMenuBrowser drops non-ready and dedupes", () => {
  const rows = [
    { restaurant_id: 1, restaurant_name: "Ready A", menu_ready: true },
    { restaurant_id: 2, restaurant_name: "Not ready", menu_ready: false },
    { restaurant_id: 1, restaurant_name: "Ready A dup", menu_ready: true },
    { restaurant_id: 3, restaurant_name: "Has menu", has_menu: true, menu_ready: undefined },
  ];
  const filtered = filterClusterRestaurantsForMenuBrowser(rows);
  assert.deepEqual(
    filtered.map((r) => r.restaurant_id),
    [1, 3]
  );
  assert.equal(isClusterRestaurantMenuReady(rows[1]), false);
});

test("BrowseMenus and sequence hook wire clusterSlug to fetchClusterRestaurants", () => {
  assert.match(browseSrc, /clusterSlug:\s*isMenuBrowserClusterScope\(venueSlug\)\s*\?\s*venueSlug\s*:\s*null/);
  assert.match(hookSrc, /fetchClusterRestaurants/);
  assert.match(hookSrc, /filterClusterRestaurantsForMenuBrowser/);
  assert.match(hookSrc, /scopedClusterSlug/);
  assert.match(hookSrc, /getBrowseMenus/);
});
