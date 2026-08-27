/**
 * Frontend deal meal periods — clock mapping + labels.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEAL_MEAL_PERIODS,
  defaultDealMealPeriod,
  normalizeDealMealPeriod,
  dealHasMedia,
} from "../src/lib/dealMealPeriods.js";

test("dealMealPeriods: four meal chips only", () => {
  assert.deepEqual(
    DEAL_MEAL_PERIODS.map((p) => p.id),
    ["breakfast", "lunch", "dinner", "late_night"]
  );
  assert.equal(normalizeDealMealPeriod("Late-Night"), "late_night");
  assert.equal(normalizeDealMealPeriod("snack"), "lunch");
});

test("dealMealPeriods: default from clock windows", () => {
  assert.equal(defaultDealMealPeriod(new Date(2026, 7, 27, 8, 0, 0)), "breakfast");
  assert.equal(defaultDealMealPeriod(new Date(2026, 7, 27, 12, 0, 0)), "lunch");
  assert.equal(defaultDealMealPeriod(new Date(2026, 7, 27, 18, 0, 0)), "dinner");
  assert.equal(defaultDealMealPeriod(new Date(2026, 7, 27, 23, 0, 0)), "late_night");
});

test("dealMealPeriods: has media helper", () => {
  assert.equal(dealHasMedia({}), false);
  assert.equal(dealHasMedia({ photo_url: "https://x" }), true);
  assert.equal(dealHasMedia({ video_url: " https://v " }), true);
});
