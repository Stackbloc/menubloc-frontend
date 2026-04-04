import test from "node:test";
import assert from "node:assert/strict";

import { buildDietaryQueryParams } from "../src/lib/dietaryParams.js";

test("buildDietaryQueryParams aliases keto to low_carb", () => {
  assert.deepEqual(
    buildDietaryQueryParams({ keto: true }),
    {
      vegan: "",
      vegetarian: "",
      gluten_free: "",
      dairy_free: "",
      diabetic_friendly: "",
      keto: 1,
      low_carb: 1,
      low_sodium: "",
    }
  );
});
