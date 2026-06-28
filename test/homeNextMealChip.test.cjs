"use strict";

const assert = require("assert");
const { getTimeAwareMealChip } = require("../src/lib/homeNextMealChip.js");
const { getFoodEntryPoints } = require("../src/lib/homeNextEntryPoints.js");
const { buildHomeChipUrl } = require("../src/lib/homeNextNavigation.js");

function atLocalHour(hour) {
  const d = new Date();
  d.setHours(hour, 30, 0, 0);
  return d;
}

function testMealWindows() {
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(7)).label, "Breakfast");
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(11)).label, "Brunch");
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(13)).label, "Lunch");
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(19)).label, "Dinner");
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(23)).label, "Late Night");
}

function testFoodEntryPointsMealSlot() {
  const chips = getFoodEntryPoints(atLocalHour(8));
  const meal = chips.find((c) => c.label === "Breakfast");
  assert.ok(meal);
  assert.strictEqual(meal.query, "breakfast");
}

function testAsianChipUsesCuisineParam() {
  const chips = getFoodEntryPoints(atLocalHour(12));
  const asian = chips.find((c) => c.id === "asian");
  assert.ok(asian);
  const url = buildHomeChipUrl(asian, {
    appliedLocation: "",
    autoLocation: null,
    shouldUseGeoBrowse: false,
  });
  assert.match(url, /q=asian\+food/);
  assert.match(url, /cuisine=asian/);
}

function testSomethingElseGoesToWaiter() {
  const chips = getFoodEntryPoints(atLocalHour(12));
  const other = chips.find((c) => c.id === "something-else");
  assert.strictEqual(buildHomeChipUrl(other, {}), "/waiter");
}

testMealWindows();
testFoodEntryPointsMealSlot();
testAsianChipUsesCuisineParam();
testSomethingElseGoesToWaiter();
console.log("homeNextMealChip tests passed");
