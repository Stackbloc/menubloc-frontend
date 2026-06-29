"use strict";

const assert = require("assert");
const {
  buildRestaurantBrowseRows,
  countUniqueRestaurants,
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

console.log("searchResultViewMode.test.cjs passed");
