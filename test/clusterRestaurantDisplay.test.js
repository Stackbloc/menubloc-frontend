import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRestaurantCuisineLabel,
  formatRestaurantMenuCount,
  formatClusterCardStreetAddress,
  resolveClusterRestaurantAccent,
} from "../src/lib/clusterRestaurantDisplay.js";

test("resolveClusterRestaurantAccent maps cuisine families to colored accents", () => {
  const coffee = resolveClusterRestaurantAccent({ cuisine: "Coffee" });
  assert.equal(coffee.emoji, "☕");
  assert.ok(coffee.border);
  assert.ok(coffee.bg);
});

test("formatClusterCardStreetAddress drops the shared city/state/zip", () => {
  assert.equal(
    formatClusterCardStreetAddress({ address_line1: "936 W 23rd St, Los Angeles, CA", city: "Los Angeles" }),
    "936 W 23rd St"
  );
  assert.equal(
    formatClusterCardStreetAddress({ address_line1: "3001 S Figueroa St, Los Angeles, CA 90007", city: "Los Angeles" }),
    "3001 S Figueroa St"
  );
  assert.equal(formatClusterCardStreetAddress({ address_line1: "2700 S Figueroa St #105" }), "2700 S Figueroa St #105");
  assert.equal(formatClusterCardStreetAddress({ address_line1: "100 Main St, Suite 4" }), "100 Main St, Suite 4");
  assert.equal(formatClusterCardStreetAddress({}), null);
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
