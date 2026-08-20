import test from "node:test";
import assert from "node:assert/strict";
import {
  dishPhotoUrl,
  eatingFoodName,
  joinHomemadeComment,
  splitHomemadeComment,
} from "../src/pages/consumer/myMenuply/eatingPlaceLink.js";

test("homemade comment round-trips and food name stays optional", () => {
  assert.deepEqual(splitHomemadeComment("Homemade"), { homemade: true, recipe: "" });
  assert.equal(joinHomemadeComment(true, "grandma chili"), "Homemade. grandma chili");
  assert.equal(eatingFoodName({ text: "", homemade: true }), "Homemade");
  assert.equal(
    eatingFoodName({ text: "", dish: { item_name: "Fries" }, homemade: false }),
    "Fries"
  );
  assert.equal(eatingFoodName({ text: "Tacos" }), "Tacos");
  assert.equal(dishPhotoUrl({ item_photo_url: "https://cdn.example/dish.jpg" }), "https://cdn.example/dish.jpg");
  assert.equal(dishPhotoUrl({ photo_url: "/uploads/a.jpg" }), "/uploads/a.jpg");
  assert.equal(dishPhotoUrl({}), null);
});
