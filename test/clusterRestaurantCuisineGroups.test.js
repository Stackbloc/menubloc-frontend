import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  groupClusterRestaurantsByCuisine,
  resolveRestaurantCuisineGroup,
} from "../src/lib/clusterRestaurantCuisineGroups.js";

describe("clusterRestaurantCuisineGroups coffee_bakery", () => {
  it("includes Starbucks / Cafe Dulce / Spudnuts / Dunkin by name when cuisine is null", () => {
    for (const name of ["Starbucks", "Cafe Dulce", "Spudnuts Donuts", "Dunkin'"]) {
      const group = resolveRestaurantCuisineGroup({
        restaurant_name: name,
        cuisine: null,
        category: null,
      });
      assert.equal(group.id, "coffee_bakery", `${name} → coffee_bakery`);
    }
  });

  it("includes Pot Of Cha as a tea shop", () => {
    assert.equal(
      resolveRestaurantCuisineGroup({ restaurant_name: "Pot Of Cha" }).id,
      "coffee_bakery"
    );
  });

  it("excludes Yogurtland even when category is Desserts", () => {
    assert.equal(
      resolveRestaurantCuisineGroup({
        restaurant_name: "Yogurtland",
        cuisine: "Frozen Yogurt",
        category: "Desserts",
      }).id,
      "other"
    );
  });

  it("does not put Yogurtland in the Coffee & Bakery bucket", () => {
    const groups = groupClusterRestaurantsByCuisine([
      { restaurant_name: "Yogurtland", cuisine: "Frozen Yogurt", category: "Desserts" },
      { restaurant_name: "Starbucks", cuisine: null, category: null },
      { restaurant_name: "Spudnuts Donuts", cuisine: null, category: null },
    ]);
    const coffee = groups.find((g) => g.id === "coffee_bakery");
    assert.ok(coffee);
    assert.deepEqual(
      coffee.restaurants.map((r) => r.restaurant_name).sort(),
      ["Spudnuts Donuts", "Starbucks"]
    );
    const other = groups.find((g) => g.id === "other");
    assert.ok(other?.restaurants.some((r) => r.restaurant_name === "Yogurtland"));
  });
});

describe("restaurant type wins for coffee & bakery (2026-10-19)", () => {
  it("puts a coffee_shop with a Thai cuisine (Amino Ave) in Coffee & Bakery", () => {
    assert.equal(
      resolveRestaurantCuisineGroup({ restaurant_name: "Amino Ave", cuisine: "thai", restaurant_type: "coffee_shop" }).id,
      "coffee_bakery"
    );
  });
  it("keeps a Thai full-service restaurant in Asian", () => {
    assert.equal(
      resolveRestaurantCuisineGroup({ restaurant_name: "Thai Spot", cuisine: "thai", restaurant_type: "full_service_restaurant" }).id,
      "asian"
    );
  });
  it("labels a cafe with no cuisine as Cafe", () => {
    const [group] = groupClusterRestaurantsByCuisine([{ restaurant_name: "Cafe Dulce", cuisine: null, restaurant_type: "cafe" }]);
    assert.equal(group.restaurants[0].cuisine_display, "Cafe");
  });
});
