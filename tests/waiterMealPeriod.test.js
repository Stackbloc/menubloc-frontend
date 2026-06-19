import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultMealPeriod, getWaiterGreeting } from "../src/lib/waiterMealPeriod.js";

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
