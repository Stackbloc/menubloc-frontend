"use strict";

const assert = require("assert");
const {
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

console.log("searchResultViewMode.test.cjs passed");
