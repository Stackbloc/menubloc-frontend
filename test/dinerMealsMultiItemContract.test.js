/**
 * Unified multi-item meal compose + hub grouping contracts.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { groupHubAteMeals } from "../src/lib/groupHubAteMeals.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("groupHubAteMeals groups by meal_id and joins item names", () => {
  const meals = groupHubAteMeals([
    { entry_id: 1, meal_id: 9, food_name: "Burger", meal_period: "lunch", eaten_on: "2026-09-11" },
    { entry_id: 2, meal_id: 9, food_name: "Fries", meal_period: "lunch", eaten_on: "2026-09-11" },
    { entry_id: 3, meal_id: null, food_name: "Apple", meal_period: "snack", eaten_on: "2026-09-11" },
  ]);
  assert.equal(meals.length, 2);
  assert.equal(meals[0].meal_id, 9);
  assert.equal(meals[0].items.length, 2);
  assert.match(meals[0].food_name, /Burger/);
  assert.match(meals[0].food_name, /Fries/);
  assert.equal(meals[1].items.length, 1);
});

test("compose + API expose multi-item meal create", () => {
  const api = read("src/lib/consumerApi.js");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  const feed = read("src/lib/feedVideoCompose.js");
  assert.match(api, /createWhatIAteMeal/);
  assert.match(api, /what-i-ate-today\/meals/);
  assert.match(compose, /ate-add-item/);
  assert.match(compose, /extraItemNames/);
  assert.match(compose, /items:/);
  const status = read("src/pages/consumer/myMenuply/ActivityStatusLineCompose.jsx");
  assert.match(status, /ate-add-item/);
  assert.match(status, /extraItemNames/);
  assert.match(status, /items:/);
  assert.match(feed, /createWhatIAteMeal/);
});

test("hub does not number Meal 1/2/3", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  assert.match(hub, /groupHubAteMeals/);
  assert.doesNotMatch(hub, /dailyMealNumber=\{index \+ 1\}/);
  assert.doesNotMatch(row, /diner-activity-scan-meal-num/);
});
