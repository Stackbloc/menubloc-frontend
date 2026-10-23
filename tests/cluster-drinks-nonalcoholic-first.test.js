import test from "node:test";
import assert from "node:assert/strict";
import {
  isUniversityCluster,
  sortNonAlcoholicDrinksFirst,
  visibleClusterDrinkSubcategoryChips,
} from "../src/lib/clusterDrinkSubcategories.js";

test("college clusters are type university", () => {
  assert.equal(isUniversityCluster({ type: "university" }), true);
  assert.equal(isUniversityCluster({ type: "stadium" }), false);
});

test("college drink list: non-alcoholic first, price order kept inside each group", () => {
  const items = [
    { name: "Beer", drinks_browser_categories: ["beer"] },
    { name: "Latte", drinks_browser_categories: ["coffee"] },
    { name: "Margarita", drinks_browser_categories: ["cocktails"] },
    { name: "Nojito", drinks_browser_categories: ["mocktails", "non_alcoholic"] },
    { name: "Green Tea", drinks_browser_categories: ["tea"] },
  ];
  assert.deepEqual(
    sortNonAlcoholicDrinksFirst(items).map((i) => i.name),
    ["Latte", "Nojito", "Green Tea", "Beer", "Margarita"],
  );
});

test("college drink chips: Coffee and Tea before Cocktails and Beer; others unchanged", () => {
  const ids = ["cocktails", "beer", "coffee", "tea", "happy_hour"];
  assert.deepEqual(
    visibleClusterDrinkSubcategoryChips(ids, { nonAlcoholicFirst: true }).map((c) => c.id),
    ["all", "coffee", "tea", "cocktails", "beer", "happy_hour"],
  );
  assert.deepEqual(
    visibleClusterDrinkSubcategoryChips(ids).map((c) => c.id),
    ["all", "cocktails", "beer", "coffee", "tea", "happy_hour"],
  );
});
