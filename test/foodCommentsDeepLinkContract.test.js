import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("food comments scroll helper exports hash and schedule", async () => {
  const mod = await import("../src/lib/foodCommentsScroll.js");
  assert.equal(mod.FOOD_COMMENTS_HASH, "food-comments");
  assert.equal(typeof mod.scheduleScrollToFoodComments, "function");
  assert.equal(typeof mod.scrollToFoodComments, "function");
});

test("FoodComments dish thread uses dish-only copy and menu item lead", () => {
  const src = read("src/components/comments/FoodComments.jsx");
  assert.match(src, /Share a tip about this dish/);
  assert.match(src, /Share a tip about this restaurant/);
  assert.match(src, /food-comment-dish-topic-lead/);
  assert.match(src, /Menu item: <strong>/);
  assert.match(src, /scheduleScrollToFoodComments/);
  assert.doesNotMatch(src, /this place or dish/);
});

test("MenuItemDetailPage has restaurant comment icon and hash-focused Discussion placement", () => {
  const src = read("src/pages/MenuItemDetailPage.jsx");
  assert.match(src, /FoodCommentNavButton/);
  assert.match(src, /target=["']restaurant["']/);
  assert.match(src, /data-menu-item-sticky-hero/);
  assert.match(src, /focusFoodComments/);
  assert.match(src, /scheduleScrollToFoodComments/);
});
