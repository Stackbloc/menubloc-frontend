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
  formatDealMealPeriodLabels,
  dealMealPeriodSummary,
  formatMealTimeDealCaption,
  normalizeDealMealPeriodList,
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

test("dealMealPeriods: labels and multi-select summary", () => {
  assert.deepEqual(formatDealMealPeriodLabels([]), ["All day"]);
  assert.deepEqual(formatDealMealPeriodLabels(["dinner", "breakfast"]), ["Breakfast", "Dinner"]);
  assert.equal(dealMealPeriodSummary(["lunch", "late_night"]), "Lunch · Late Night");
  assert.deepEqual(normalizeDealMealPeriodList(["late_night", "lunch", "lunch"]), [
    "lunch",
    "late_night",
  ]);
  assert.equal(formatMealTimeDealCaption(["lunch"]), "Lunch Deal");
  assert.equal(formatMealTimeDealCaption(["breakfast", "lunch"]), "Breakfast & Lunch Deal");
  assert.equal(formatMealTimeDealCaption([]), null);
});
