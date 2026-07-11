import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRestaurantCuisineLabel,
  formatRestaurantMenuCount,
  formatRestaurantPriceTier,
  resolveClusterRestaurantAccent,
} from "../src/lib/clusterRestaurantDisplay.js";

test("resolveClusterRestaurantAccent maps cuisine families to colored accents", () => {
  const coffee = resolveClusterRestaurantAccent({ cuisine: "Coffee" });
  assert.equal(coffee.emoji, "☕");
  assert.ok(coffee.border);
  assert.ok(coffee.bg);
});

test("formatRestaurantPriceTier renders dollar symbols", () => {
  assert.equal(formatRestaurantPriceTier({ price_tier: "moderate" }), "$$ · Moderate");
  assert.equal(formatRestaurantPriceTier({ price_tier: "premium" }), "$$$$ · Premium");
  assert.equal(formatRestaurantPriceTier({}), null);
});

test("formatRestaurantCuisineLabel prefers cuisine over restaurant type", () => {
  assert.equal(
    formatRestaurantCuisineLabel({ cuisine: "Soul Food", restaurant_type: "full_service_restaurant" }),
    "Soul Food"
  );
  assert.equal(formatRestaurantCuisineLabel({ restaurant_type: "coffee_shop" }), "Coffee Shop");
});

test("formatRestaurantMenuCount uses public menu counts", () => {
  assert.equal(formatRestaurantMenuCount({ public_menu_item_count: 54 }), "54 menu items");
  assert.equal(formatRestaurantMenuCount({ menu_item_count: 1 }), "1 menu item");
  assert.equal(formatRestaurantMenuCount({}), null);
});
