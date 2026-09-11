/**
 * What I'm Eating timeline: LUNCH 12:30 PM · dish · at place.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatMealClockTime,
  formatMealPeriodClockLead,
  mealPeriodAccentColor,
  mealPeriodClockParts,
  splitMealFoodLead,
  isoToTimeInputValue,
  timeInputToIso,
} from "../src/pages/consumer/myMenuply/dinerHubFormat.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("meal period + clock lead formatting", () => {
  const iso = "2026-09-11T19:00:00.000Z";
  const parts = mealPeriodClockParts("lunch", iso, { omitClock: false });
  assert.equal(parts.meal, "Lunch");
  assert.equal(parts.mealUpper, "LUNCH");
  assert.ok(parts.clock.length > 0);
  assert.match(parts.clock, /AM|PM/);
  assert.equal(parts.accent, mealPeriodAccentColor("lunch"));
  assert.match(formatMealPeriodClockLead("lunch", iso), /LUNCH /);
  assert.equal(formatMealPeriodClockLead("lunch", iso, { omitClock: true }), "LUNCH");
  assert.equal(formatMealClockTime(null), "");
  assert.equal(mealPeriodAccentColor("late_night"), "#7c3aed");
});

test("time input round-trip helpers", () => {
  const iso = timeInputToIso("12:45", "2026-09-11");
  assert.ok(iso);
  assert.match(isoToTimeInputValue(iso), /^\d{2}:\d{2}$/);
});

test("splitMealFoodLead keeps primary dish + secondary fold", () => {
  const split = splitMealFoodLead({
    items: [
      { food_name: "Chicken and waffles" },
      { food_name: "ham" },
      { food_name: "iced tea" },
    ],
  });
  assert.equal(split.primary, "Chicken and waffles");
  assert.equal(split.secondary, "ham, iced tea");
});

test("ownerCompact meal row uses timeline color hierarchy", () => {
  const row = read("src/pages/consumer/myMenuply/DinerActivityScanRow.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(row, /mealPeriodClockParts/);
  assert.match(row, /diner-activity-scan-meal-dot/);
  assert.match(row, /diner-activity-scan-meal-pill/);
  assert.match(row, /diner-activity-scan-meal-clock/);
  assert.match(row, /timelineBody|diner-activity-scan-timeline-body/);
  assert.match(row, /placeLinkTimeline/);
  assert.match(row, /#2563eb/);
  assert.match(hub, /splitMealFoodLead/);
  assert.match(hub, /secondaryFoodName/);
  assert.match(hub, /timelineFirst/);
  assert.match(hub, /eatenAt=\{meal\.eaten_at/);
  assert.match(hub, /omitMealClock/);
  assert.match(hub, /eating-meal-clock-edit/);
});
