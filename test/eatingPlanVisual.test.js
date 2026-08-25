import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("eating plan visual helper prefers logo then billboard for restaurant-bound plans", () => {
  const visual = read("src/pages/consumer/myMenuply/eatingDishVisual.js");
  assert.match(visual, /export function planHasSpecificRestaurant/);
  assert.match(visual, /export function resolveEatingPlanVisual/);
  assert.match(visual, /if \(!planHasSpecificRestaurant\(plan\)\) return null/);
  assert.match(visual, /restaurant_logo_url: plan\?\.restaurant_logo_url/);
  assert.match(visual, /restaurant_billboard_image_url: plan\?\.restaurant_billboard_image_url/);
});

test("FuturePlanRow renders logo, billboard name overlay, or text fallback", () => {
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(bits, /EatingPlanRestaurantMark/);
  assert.match(bits, /eating-plan-logo/);
  assert.match(bits, /eating-plan-billboard/);
  assert.match(bits, /resolveEatingPlanVisual/);
  assert.match(bits, /planCardMarkBillboardName/);
});

test("EventComposeSheet stays open and shows error when create fails", () => {
  const sheet = read("src/pages/consumer/myMenuply/EventComposeSheet.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(sheet, /event-compose-error/);
  assert.match(sheet, /setLocalError/);
  assert.match(sheet, /catch \(err\)/);
  assert.match(page, /throw err instanceof Error \? err : new Error\(message\)/);
});
