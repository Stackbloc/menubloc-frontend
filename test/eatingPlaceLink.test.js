import test from "node:test";
import assert from "node:assert/strict";
import {
  dishPhotoUrl,
  eatingFoodName,
  formatHomemadePlaceLabel,
  joinHomemadeComment,
  splitHomemadeComment,
} from "../src/lib/eatingPlaceLink.js";

test("homemade comment round-trips and food name stays optional", () => {
  assert.deepEqual(splitHomemadeComment("@home"), { homemade: true, recipe: "" });
  assert.deepEqual(splitHomemadeComment("Homemade"), { homemade: true, recipe: "" });
  assert.deepEqual(splitHomemadeComment("@home: Thanksgiving dinner"), {
    homemade: true,
    recipe: "Thanksgiving dinner",
  });
  assert.equal(joinHomemadeComment(true, "grandma chili"), "@home: grandma chili");
  assert.equal(formatHomemadePlaceLabel("Homemade. Thanksgiving dinner"), "@home: Thanksgiving dinner");
  assert.equal(formatHomemadePlaceLabel("@home. Thanksgiving dinner"), "@home: Thanksgiving dinner");
  assert.equal(eatingFoodName({ text: "", homemade: true }), "@home");
  assert.equal(
    eatingFoodName({ text: "", dish: { item_name: "Fries" }, homemade: false }),
    "Fries"
  );
  assert.equal(eatingFoodName({ text: "Tacos" }), "Tacos");
  assert.equal(dishPhotoUrl({ item_photo_url: "https://cdn.example/dish.jpg" }), "https://cdn.example/dish.jpg");
  assert.equal(dishPhotoUrl({ photo_url: "/uploads/a.jpg" }), "/uploads/a.jpg");
  assert.equal(dishPhotoUrl({}), null);
});
