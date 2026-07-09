import test from "node:test";
import assert from "node:assert/strict";

import { buildDietaryQueryParams, appendSavedMenuPreferenceQueryParams } from "../src/lib/dietaryParams.js";

test("buildDietaryQueryParams aliases keto to low_carb", () => {
  assert.deepEqual(
    buildDietaryQueryParams({ keto: true }),
    {
      vegan: "",
      vegetarian: "",
      gluten_free: "",
      dairy_free: "",
      nut_free: "",
      diabetic_friendly: "",
      keto: 1,
      low_carb: 1,
      low_fat: "",
      low_sodium: "",
      high_protein: "",
      glp1_friendly: "",
    }
  );
});

test("appendSavedMenuPreferenceQueryParams wires all supported diet and allergen flags", () => {
  const params = new URLSearchParams();
  appendSavedMenuPreferenceQueryParams(params, {
    applyDietaryPreferences: true,
    dietPrefs: {
      vegetarian: true,
      high_protein: true,
      nut_free: true,
      keto: true,
      low_carb: true,
    },
    enabledAllergenKeys: new Set(["peanuts", "dairy"]),
  });
  assert.equal(params.get("vegetarian"), "1");
  assert.equal(params.get("high_protein"), "1");
  assert.equal(params.get("nut_free"), "1");
  assert.equal(params.get("low_carb"), "1");
  assert.equal(params.get("allergen_keys"), "peanuts,dairy");
  assert.equal(params.get("include_allergens"), "1");
});
