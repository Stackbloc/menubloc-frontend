/**
 * Post about a place or dish not on Menuply (Andre 2026-10-28): the last suggestion row is
 * "Use “…”", and the post sends the typed restaurant as place_name with no restaurant_id.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  unlistedDishPlace,
  unlistedPlaceName,
  unlistedRestaurantPlace,
} from "../src/lib/unlistedPlace.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("typed places carry no Menuply id", () => {
  assert.deepEqual(unlistedRestaurantPlace("  Joe's   Tacos "), {
    restaurant_id: null,
    restaurant_name: "Joe's Tacos",
    unlisted: true,
  });
  assert.equal(unlistedRestaurantPlace("   "), null);
  const dish = unlistedDishPlace("Al pastor");
  assert.equal(dish.menu_item_id, null);
  assert.equal(dish.item_name, "Al pastor");
  assert.equal(dish.unlisted, true);
});

test("place_name only for a restaurant without an id", () => {
  assert.equal(unlistedPlaceName(unlistedRestaurantPlace("Joe's Tacos")), "Joe's Tacos");
  assert.equal(unlistedPlaceName({ restaurant_id: 42, restaurant_name: "Listed" }), null);
  assert.equal(unlistedPlaceName(null), null);
});

test("picker offers Use “…” rows; posts send place_name; reviews accept a typed dish", () => {
  const fields = read("src/pages/consumer/myMenuply/EatingPlaceFields.jsx");
  assert.match(fields, /eating-place-restaurant-use-typed/);
  assert.match(fields, /eating-place-dish-use-typed/);
  assert.match(fields, /allowUnlisted = false/);
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(compose, /dish\?\.menu_item_id \|\| dish\?\.unlisted/);
  assert.ok((compose.match(/allowUnlisted/g) || []).length >= 4);
  assert.match(read("src/lib/feedVideoCompose.js"), /place_name:/);
  assert.match(read("src/pages/consumer/MyMenuplyPage.jsx"), /place_name:/);
});
