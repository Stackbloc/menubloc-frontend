import test from "node:test";
import assert from "node:assert/strict";
import { mergeEatingFeedForHub } from "../src/lib/eatingFeedMerge.js";

test("mergeEatingFeedForHub drops mirrored food_activity rows", () => {
  const diary = [
    {
      kind: "what_i_ate",
      restaurant_id: 1,
      menu_item_id: 9,
      photo_url: "/uploads/food-activity/x.jpg",
      food_name: "Burger",
    },
  ];
  const activity = [
    {
      kind: "im_eating",
      restaurant_id: 1,
      menu_item_id: 9,
      photo_url: "/uploads/food-activity/x.jpg",
      item_name: "Burger",
    },
    {
      kind: "im_eating",
      restaurant_id: 2,
      item_name: "Tacos",
    },
  ];
  const merged = mergeEatingFeedForHub(diary, activity);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].kind, "what_i_ate");
  assert.equal(merged[1].restaurant_id, 2);
});
