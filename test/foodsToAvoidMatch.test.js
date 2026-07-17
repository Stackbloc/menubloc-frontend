/**
 * Foods I Avoid preference matching (not allergens).
 */
import assert from "node:assert/strict";
import {
  matchAvoidedIngredients,
  findAvoidedInIngredientList,
  detectCustomizableItemType,
} from "../src/lib/foodsToAvoidMatch.js";

const mushroomOnionItem = {
  name: "Mushroom Swiss Burger",
  description: "Topped with sautéed mushrooms and caramelized onions",
};

const hits = matchAvoidedIngredients(mushroomOnionItem, ["mushrooms", "onions", "cilantro"]);
assert.equal(hits.length, 2);
assert.deepEqual(
  hits.map((h) => h.label).sort(),
  ["Mushrooms", "Onions"],
);

assert.equal(matchAvoidedIngredients(mushroomOnionItem, []).length, 0);
assert.equal(matchAvoidedIngredients(mushroomOnionItem, null).length, 0);

const burgerDefaults = matchAvoidedIngredients(
  { name: "Classic Cheeseburger", description: "Angus beef" },
  ["onions", "pickles"],
);
assert.ok(burgerDefaults.some((h) => h.key === "onions"));
assert.ok(burgerDefaults.some((h) => h.key === "pickles"));
assert.equal(detectCustomizableItemType({ name: "Classic Cheeseburger" }), "BURGERS");

const listHits = findAvoidedInIngredientList(
  ["Bun", "Onion", "Pickles"],
  ["onions", "cilantro"],
);
assert.equal(listHits.length, 1);
assert.equal(listHits[0].ingredient, "Onion");

console.log("foodsToAvoidMatch: ok");
