import test from "node:test";
import assert from "node:assert/strict";

import { buildRestaurantFilterQueryParams } from "../src/lib/restaurantFilterParams.js";

test("buildRestaurantFilterQueryParams preserves structured cuisine/category params", () => {
  assert.deepEqual(
    buildRestaurantFilterQueryParams({
      cuisine: "italian-american",
      category: "Fast Food",
    }),
    {
      cuisine: "italian-american",
      category: "Fast Food",
    }
  );
});
