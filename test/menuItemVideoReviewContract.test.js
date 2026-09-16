/**
 * Menu-item comment icon → written thread or inherited-identity video review.
 * Reuses food_comments + existing X review video (what_i_ate_today). No parallel system.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("menu-item comment icon opens written vs video chooser with inherited IDs", () => {
  const btn = read("src/components/FoodCommentNavButton.jsx");
  const chooser = read("src/components/menu/MenuItemReviewChooser.jsx");
  const overlay = read("src/components/menu/MenuItemVideoReviewOverlay.jsx");
  const card = read("src/components/menu-templates/PublicMenuItemCard.jsx");
  const rail = read("src/components/menu/MenuItemDetailActionRail.jsx");

  assert.match(btn, /MenuItemReviewChooser/);
  assert.match(btn, /MenuItemVideoReviewOverlay/);
  assert.match(btn, /FOOD_COMMENTS_HASH/);
  assert.match(btn, /parseMenuItemRouteId/);
  assert.match(chooser, /menu-item-review-written/);
  assert.match(chooser, /menu-item-review-video/);
  assert.match(overlay, /postFeedReviewVideo/);
  assert.match(overlay, /identityLocked/);
  assert.match(overlay, /defaultCategory=["']reviews["']/);
  assert.doesNotMatch(overlay, /putBlobWithProgress|multipartUpload|OwnerVideoCuration/);
  assert.doesNotMatch(btn, /FoodInterestsPage|HomeNext/);

  assert.match(card, /restaurantId=\{currentRestaurantId\}/);
  assert.match(card, /menuItemName=\{name\}/);
  assert.match(rail, /restaurantId=\{restaurantId\}/);
  assert.match(rail, /menuItemName=\{itemName\}/);
});

test("locked video review compose does not ask the user to search restaurant or dish", () => {
  const overlay = read("src/components/menu/MenuItemVideoReviewOverlay.jsx");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  const sheet = read("src/pages/consumer/myMenuply/EatingComposeSheet.jsx");
  const places = read("src/pages/consumer/myMenuply/EatingPlaceFields.jsx");

  assert.match(overlay, /menu_item_id: menuItemId/);
  assert.match(overlay, /restaurant_id: restaurantId/);
  assert.match(compose, /identityLocked/);
  assert.match(sheet, /you do not pick the restaurant or dish again/);
  assert.match(places, /eating-place-identity-locked/);
  assert.match(places, /identityLocked \? null/);
  assert.doesNotMatch(overlay, /searchReportPlaces/);
});

test("written food comments path remains the existing API", () => {
  const comments = read("src/components/comments/FoodComments.jsx");
  const api = read("src/lib/foodCommentsApi.js");
  assert.match(comments, /createFoodComment/);
  assert.match(api, /\/api\/consumer\/comments/);
  assert.match(api, /\/public\/comments/);
});

test("existing X review video helper is reused not duplicated", () => {
  const compose = read("src/lib/feedVideoCompose.js");
  const overlay = read("src/components/menu/MenuItemVideoReviewOverlay.jsx");
  const xSheet = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");
  assert.match(compose, /export async function postFeedReviewVideo/);
  assert.match(compose, /Reviews require a menu item/);
  assert.match(overlay, /from ["'].*feedVideoCompose/);
  assert.match(xSheet, /FEED_CONTENT_KINDS\.REVIEWS/);
  assert.doesNotMatch(overlay, /CREATE TABLE|entity_type|entity_id/);
});
