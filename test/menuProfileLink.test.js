import assert from "node:assert/strict";
import test from "node:test";

import { resolveRestaurantProfileHref } from "../src/lib/catalogMenuUtils.js";

test("menu profile href prefers restaurant_id over slug", () => {
  const href = resolveRestaurantProfileHref({
    data: {
      restaurant_id: 586,
      slug: "richie-bs-dothan-al",
      city: "Dothan",
      state: "AL",
    },
  });

  assert.equal(href, "/restaurants/586");
});

test("food truck profile href still uses the food truck route", () => {
  const href = resolveRestaurantProfileHref({
    data: {
      restaurant_id: 123,
      slug: "rolling-kitchen",
      city: "Los Angeles",
      state: "CA",
    },
    isFoodTruck: true,
  });

  assert.equal(href, "/foodtrucks/rolling-kitchen");
});
