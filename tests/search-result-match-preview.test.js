import test from "node:test";
import assert from "node:assert/strict";

import buildMatchPreview from "../src/components/searchResultMatchPreview.js";

test("high protein near me", () => {
  const preview = buildMatchPreview(
    { protein_g: 58, restaurant_distance_miles: 1.8 },
    {
      nutrition_intent: { high_protein: true },
      nutrient_constraints: {},
      diet: {},
    },
    { wantsNearby: true, coordinateSearchActive: false }
  );

  assert.deepEqual(preview, {
    parts: ["58 g protein", "1.8 mi away"],
    text: "58 g protein • 1.8 mi away",
  });
});

test("low fat", () => {
  const preview = buildMatchPreview(
    { fat_g: 5 },
    {
      nutrition_intent: { low_fat: true },
      nutrient_constraints: {},
      diet: {},
    },
    { wantsNearby: false, coordinateSearchActive: false }
  );

  assert.deepEqual(preview, {
    parts: ["5 g fat"],
    text: "5 g fat",
  });
});

test("low carb vegan near me caps at three parts", () => {
  const preview = buildMatchPreview(
    {
      carbs_g: 15,
      fiber_g: 3,
      is_vegan: true,
      restaurant_distance_miles: 2.1,
    },
    {
      nutrition_intent: { low_carb: true },
      nutrient_constraints: { carbs: { direction: "low" } },
      diet: { vegan: true },
    },
    { wantsNearby: true, coordinateSearchActive: false }
  );

  assert.deepEqual(preview, {
    parts: ["12 g net carbs", "Vegan", "2.1 mi away"],
    text: "12 g net carbs • Vegan • 2.1 mi away",
  });
});

test("budget query shows actual price and blocks zero placeholder price", () => {
  const goodPreview = buildMatchPreview(
    { price: 13.49 },
    {
      nutrition_intent: {},
      nutrient_constraints: {},
      diet: {},
      price: { max: 15 },
    },
    { wantsNearby: false, coordinateSearchActive: false }
  );

  assert.deepEqual(goodPreview, {
    parts: ["$13.49"],
    text: "$13.49",
  });

  const badPreview = buildMatchPreview(
    { price: 0 },
    {
      nutrition_intent: {},
      nutrient_constraints: {},
      diet: {},
      price: { max: 15 },
    },
    { wantsNearby: false, coordinateSearchActive: false }
  );

  assert.equal(badPreview, null);
});

test("missing data renders no match preview", () => {
  const preview = buildMatchPreview(
    {},
    {
      nutrition_intent: { high_protein: true },
      nutrient_constraints: {},
      diet: {},
    },
    { wantsNearby: false, coordinateSearchActive: false }
  );

  assert.equal(preview, null);
});

test("duplicate prevention keeps parts unique", () => {
  const preview = buildMatchPreview(
    { protein_g: 58, restaurant_distance_miles: 1.8 },
    {
      nutrition_intent: { high_protein: true },
      nutrient_constraints: { protein: { direction: "high" } },
      diet: { high_protein: true },
    },
    { wantsNearby: true, coordinateSearchActive: false }
  );

  assert.deepEqual(preview, {
    parts: ["58 g protein", "1.8 mi away"],
    text: "58 g protein • 1.8 mi away",
  });
});

test("distance only appears for location-driven queries", () => {
  const preview = buildMatchPreview(
    { protein_g: 58, restaurant_distance_miles: 1.8 },
    {
      nutrition_intent: { high_protein: true },
      nutrient_constraints: {},
      diet: {},
    },
    { wantsNearby: false, coordinateSearchActive: false }
  );

  assert.deepEqual(preview, {
    parts: ["58 g protein"],
    text: "58 g protein",
  });
});
