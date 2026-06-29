"use strict";

const assert = require("assert");
const { getTimeAwareMealChip } = require("../src/lib/homeNextMealChip.js");
const { getFoodEntryPoints } = require("../src/lib/homeNextEntryPoints.js");
const { splitFoodEntryPointRows } = require("../src/lib/homeNextEntryPoints.js");
const { buildHomeChipUrl } = require("../src/lib/homeNextNavigation.js");

function atLocalHour(hour, date = new Date()) {
  const d = new Date(date);
  d.setHours(hour, 30, 0, 0);
  return d;
}

function testMealWindows() {
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(7)).label, "Breakfast");
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(13)).label, "Lunch");
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(19)).label, "Dinner");
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(23)).label, "Late Night");
  assert.strictEqual(getTimeAwareMealChip(atLocalHour(15)).label, "Snacks");
}

function testWeekendBrunch() {
  // Saturday 2026-06-27
  const saturday = new Date("2026-06-27T11:30:00");
  assert.strictEqual(getTimeAwareMealChip(saturday).label, "Brunch");
  const wednesday = new Date("2026-06-24T11:30:00");
  assert.strictEqual(getTimeAwareMealChip(wednesday).label, "Lunch");
}

function testFoodEntryPointsMealSlot() {
  const chips = getFoodEntryPoints(atLocalHour(8));
  const meal = chips.find((c) => c.label === "Breakfast");
  assert.ok(meal);
  assert.strictEqual(meal.query, "breakfast");
  assert.strictEqual(meal.mealPeriod, "breakfast");
  assert.strictEqual(meal.contextAware, true);
}

function testContextMealChipRoutesToSearch() {
  const chips = getFoodEntryPoints(atLocalHour(13));
  const lunch = chips.find((c) => c.label === "Lunch");
  assert.ok(lunch);
  const url = buildHomeChipUrl(lunch, {
    appliedLocation: "Los Angeles, CA",
    autoLocation: null,
    shouldUseGeoBrowse: false,
  });
  assert.match(url, /q=lunch/);
  assert.doesNotMatch(url, /waiter/);
}

function testLateNightMealPeriodMapping() {
  const chips = getFoodEntryPoints(atLocalHour(23));
  const late = chips.find((c) => c.label === "Late Night");
  assert.ok(late);
  assert.strictEqual(late.mealPeriod, "late_night");
  const url = buildHomeChipUrl(late, {
    appliedLocation: "",
    autoLocation: null,
    shouldUseGeoBrowse: false,
  });
  assert.match(url, /q=late(\+|%20)night/);
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

function testSomethingElseNotInBlankStateChips() {
  const chips = getFoodEntryPoints(atLocalHour(12));
  const other = chips.find((c) => c.id === "something-else");
  assert.strictEqual(other, undefined, "Something Else must not appear in default food chips");
}

function testSplitFoodRowsIndependently() {
  const chips = getFoodEntryPoints(atLocalHour(12));
  const [rowOne, rowTwo] = splitFoodEntryPointRows(chips);
  assert.strictEqual(rowOne.length + rowTwo.length, chips.length);
  assert.ok(rowOne.length >= rowTwo.length);
  assert.strictEqual(rowOne[0].id, chips[0].id);
  assert.strictEqual(rowTwo[0].id, chips[1].id);
}

testMealWindows();
testWeekendBrunch();
testFoodEntryPointsMealSlot();
testContextMealChipRoutesToSearch();
testLateNightMealPeriodMapping();
testAsianChipUsesCuisineParam();
testSomethingElseNotInBlankStateChips();
testSplitFoodRowsIndependently();
console.log("homeNextMealChip tests passed");
