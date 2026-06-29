"use strict";

const assert = require("assert");
const {
  buildRestaurantBrowseRows,
  countUniqueRestaurants,
  resolveRestaurantBrowseDistanceMiles,
  shouldShowSearchResultModeSelector,
} = require("../src/lib/searchResultViewMode.js");

assert.strictEqual(
  countUniqueRestaurants(
    [{ restaurant_id: 1 }, { restaurant_id: 1 }, { restaurant_id: 2 }],
    [{ restaurant_id: 3 }]
  ),
  3
);

assert.strictEqual(
  shouldShowSearchResultModeSelector({
    dishCount: 11,
    restaurantCount: 27,
  }),
  true
);

assert.strictEqual(
  shouldShowSearchResultModeSelector({
    directRestaurantName: true,
    dishCount: 0,
    restaurantCount: 5,
  }),
  false
);

assert.strictEqual(
  shouldShowSearchResultModeSelector({
    suppressMenuItems: true,
    dishCount: 0,
    restaurantCount: 5,
  }),
  false
);

assert.strictEqual(
  shouldShowSearchResultModeSelector({
    dishCount: 4,
    restaurantCount: 1,
  }),
  false
);

const browseRows = buildRestaurantBrowseRows(
  [
    { restaurant_id: 1, menu_item_id: 10, restaurant_name: "Alpha" },
    { restaurant_id: 1, menu_item_id: 11, restaurant_name: "Alpha" },
    { restaurant_id: 2, menu_item_id: 20, restaurant_name: "Beta" },
  ],
  [{ restaurant_id: 3, restaurant_name: "Gamma" }],
  new Map([["2", { phone: "555-0100" }]])
);
assert.strictEqual(browseRows.length, 3);
assert.strictEqual(browseRows.find((r) => String(r.restaurant_id) === "2")?.phone, "555-0100");

const closestRows = buildRestaurantBrowseRows(
  [
    { restaurant_id: 1, menu_item_id: 10, restaurant_name: "Alpha", distance_miles: 4.2 },
    { restaurant_id: 1, menu_item_id: 11, restaurant_name: "Alpha", distance_miles: 1.1 },
    { restaurant_id: 2, menu_item_id: 20, restaurant_name: "Beta", distance_miles: 2.5 },
  ],
  [],
  null,
  { lat: 31.2, lng: -85.4 }
);
assert.strictEqual(closestRows.length, 2);
assert.strictEqual(closestRows[0].restaurant_name, "Alpha");
assert.strictEqual(closestRows[0].distance_miles, 1.1);
assert.strictEqual(closestRows[1].restaurant_name, "Beta");
assert.strictEqual(closestRows[1].distance_miles, 2.5);

assert.ok(
  resolveRestaurantBrowseDistanceMiles(
    { restaurant_id: 9, lat: 31.223, lng: -85.393 },
    { lat: 31.2, lng: -85.4 }
  ) !== null
);

console.log("searchResultViewMode.test.cjs passed");
