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
  assert.match(src, /Share your thoughts about this dish/);
  assert.match(src, /Share your thoughts about this restaurant/);
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

test("MenuItemDetailPage restaurant actions order is like → share → invite → comment", () => {
  const src = read("src/pages/MenuItemDetailPage.jsx");
  const railStart = src.indexOf('data-testid="menu-item-detail-restaurant-actions"');
  assert.ok(railStart > -1, "restaurant actions rail present");
  const railSlice = src.slice(railStart, railStart + 1800);
  assert.match(
    railSlice,
    /FollowRestaurantButton[\s\S]*ShareButton[\s\S]*InviteToEatButton[\s\S]*FoodCommentNavButton/
  );
  assert.match(railSlice, /target=["']restaurant["']/);
});

test("MenuItemDetailActionRail includes dish comment after invite", () => {
  const src = read("src/components/menu/MenuItemDetailActionRail.jsx");
  const likeIdx = src.indexOf("LikeMenuItemButton");
  const shareIdx = src.indexOf("<ShareButton");
  const inviteIdx = src.indexOf("<InviteToEatButton");
  const commentIdx = src.indexOf('target="menu_item"');
  assert.ok(likeIdx > 0 && shareIdx > likeIdx && inviteIdx > shareIdx);
  assert.ok(commentIdx > inviteIdx, "dish FoodCommentNavButton after Invite");
});
