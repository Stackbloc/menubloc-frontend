import assert from "node:assert/strict";
import test from "node:test";

import { resolveRestaurantProfileHref } from "../src/lib/catalogMenuUtils.js";

test("menu profile href uses the canonical state/city/slug path when location is known", () => {
  const href = resolveRestaurantProfileHref({
    data: {
      restaurant_id: 586,
      slug: "richie-bs-dothan-al",
      city: "Dothan",
      state: "AL",
    },
  });

  assert.equal(href, "/restaurants/alabama/dothan/richie-bs-dothan-al");
});

test("menu profile href falls back to restaurant_id when location is missing", () => {
  const href = resolveRestaurantProfileHref({
    data: { restaurant_id: 586, slug: "richie-bs-dothan-al", city: "", state: null },
  });

  assert.equal(href, "/restaurants/586");
});

test("menu profile href falls back to slug when neither location nor id is known", () => {
  const href = resolveRestaurantProfileHref({ data: { slug: "richie-bs-dothan-al" } });

  assert.equal(href, "/restaurants/richie-bs-dothan-al");
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
