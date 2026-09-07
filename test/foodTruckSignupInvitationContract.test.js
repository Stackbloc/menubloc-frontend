/**
 * Contract: FoodTruckSignup is a Menuply invitation, not a plan-comparison pitch.
 * Internal FOOD_TRUCK_ANNUAL_PLAN_CODE / food_truck category preserved on POST.
 * Customer-facing "Standard" and PlanComparisonTable must not appear.
 * Optional Paid Upgrades pitch removed — free create only on this page.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("FoodTruckSignup is invitation messaging with free-join economics", () => {
  const src = read("src/pages/FoodTruckSignup.jsx");
  assert.match(src, /Your Menu\. More Ways to Be Discovered\./);
  assert.match(src, /12% commission\. No subscription fee\./);
  assert.match(src, /Claim your free profile\. Upload and manage your menu\. Join the community\./);
  assert.match(src, /Create your account/);
  assert.doesNotMatch(src, /Optional paid upgrades/i);
  assert.doesNotMatch(src, /Show optional paid options/i);
  assert.doesNotMatch(src, /Compare Food Truck Standard/);
  assert.doesNotMatch(src, /PlanComparisonTable/);
  assert.doesNotMatch(src, /Food Truck Standard/);
  assert.doesNotMatch(src, /Compare food truck plans/);
});

test("FoodTruckSignup preserves food_truck signup POST and plan code", () => {
  const src = read("src/pages/FoodTruckSignup.jsx");
  assert.match(src, /FOOD_TRUCK_ANNUAL_PLAN_CODE/);
  assert.match(src, /category:\s*"food_truck"/);
  assert.match(src, /selected_plan:\s*FOOD_TRUCK_ANNUAL_PLAN_CODE/);
  assert.match(src, /rememberIntendedCheckoutPlanCode\(FOOD_TRUCK_ANNUAL_PLAN_CODE\)/);
  assert.match(src, /\/owner\/profile/);
});
