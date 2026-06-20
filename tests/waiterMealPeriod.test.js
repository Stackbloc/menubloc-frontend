import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getDefaultMealPeriod, getMealPeriodFallback, getWaiterGreeting } from "../src/lib/waiterMealPeriod.js";

function localDate(year, month, day, hour, minute) {
  return new Date(year, month, day, hour, minute, 0, 0);
}

test("Waiter selects meal periods from local time boundaries", () => {
  assert.equal(getDefaultMealPeriod(localDate(2026, 5, 17, 5, 0)), "breakfast");
  assert.equal(getDefaultMealPeriod(localDate(2026, 5, 17, 10, 29)), "breakfast");
  assert.equal(getDefaultMealPeriod(localDate(2026, 5, 17, 10, 30)), "lunch");
  assert.equal(getDefaultMealPeriod(localDate(2026, 5, 20, 10, 30)), "brunch");
  assert.equal(getDefaultMealPeriod(localDate(2026, 5, 17, 14, 0)), "lunch");
  assert.equal(getDefaultMealPeriod(localDate(2026, 5, 17, 17, 0)), "dinner");
  assert.equal(getDefaultMealPeriod(localDate(2026, 5, 17, 22, 0)), "late_night");
  assert.equal(getDefaultMealPeriod(localDate(2026, 5, 17, 4, 59)), "late_night");
});

test("Waiter greeting follows local morning, afternoon, and evening", () => {
  assert.equal(getWaiterGreeting(localDate(2026, 5, 17, 8, 0)), "Good morning");
  assert.equal(getWaiterGreeting(localDate(2026, 5, 17, 12, 0)), "Good afternoon");
  assert.equal(getWaiterGreeting(localDate(2026, 5, 17, 17, 0)), "Good evening");
});

test("Waiter exposes a distinct fallback prompt for every meal-period chip", () => {
  const periods = ["breakfast", "brunch", "lunch", "dinner", "late_night"];
  const prompts = periods.map((period) => getMealPeriodFallback(period));

  assert.equal(new Set(prompts.map((prompt) => prompt.title)).size, periods.length);
  for (const prompt of prompts) {
    assert.match(prompt.title, /^Looking for /);
    assert.ok(prompt.paragraphs.length > 0);
    const copy = [prompt.title, ...prompt.paragraphs].join(" ");
    assert.doesNotMatch(copy, /no recommendations|recommendations (?:are )?available near/i);
  }
});

test("Waiter fallback guidance preserves the requested meal-period language", () => {
  assert.match(getMealPeriodFallback("breakfast").paragraphs.join(" "), /breakfast menus and morning favorites/);
  assert.match(getMealPeriodFallback("brunch").paragraphs.join(" "), /brunch-friendly menus/);
  assert.match(getMealPeriodFallback("lunch").paragraphs.join(" "), /lunch-friendly menu items/);
  assert.match(getMealPeriodFallback("dinner").paragraphs.join(" "), /evening favorites/);
  assert.match(getMealPeriodFallback("late_night").paragraphs.join(" "), /late-night options/);
});

test("Waiter fallback omits unverified counts and negative empty-state messaging", () => {
  const pageSource = readFileSync(new URL("../src/pages/FoodInterestsPage.jsx", import.meta.url), "utf8");
  const apiSource = readFileSync(new URL("../src/lib/waiterApi.js", import.meta.url), "utf8");
  const source = `${pageSource}\n${apiSource}`;

  assert.doesNotMatch(source, /fetchWaiterMarketCounts|restaurants represented|menu items available|food categories available/);
  assert.doesNotMatch(source, /no (?:breakfast|brunch|lunch|dinner|late-night|personalized )?recommendations|recommendations (?:are )?available near/i);
  assert.match(pageSource, /Help Menuply Grow/);
  assert.match(pageSource, /use the camera scanner on the home page to submit a menu/);
});
