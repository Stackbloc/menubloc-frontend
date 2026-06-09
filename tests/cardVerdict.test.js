import test from "node:test";
import assert from "node:assert/strict";

import {
  NOT_AVAILABLE_LABEL,
  isKnownNumber,
  resolveCardVerdict,
  toNullableNumber,
} from "../src/lib/cardVerdict.js";

test("toNullableNumber preserves missing values and explicit zero", () => {
  assert.equal(toNullableNumber(null), null);
  assert.equal(toNullableNumber(undefined), null);
  assert.equal(toNullableNumber(""), null);
  assert.equal(toNullableNumber(0), 0);
  assert.equal(toNullableNumber("0"), 0);
  assert.equal(isKnownNumber(""), false);
  assert.equal(isKnownNumber("0"), true);
});

test("sparse nutrition verdict fallback is Not Available", () => {
  assert.equal(
    resolveCardVerdict({
      chips: {
        nutrition_chip: {
          calories_kcal: null,
          sodium_mg: "",
          sugar_g: undefined,
          fat_g: null,
        },
      },
    }),
    NOT_AVAILABLE_LABEL
  );
});

test("explicit zero nutrition remains valid measured data", () => {
  assert.equal(
    resolveCardVerdict({
      chips: {
        nutrition_chip: {
          calories_kcal: 0,
          sodium_mg: "0",
          sugar_g: 0,
          fat_g: 0,
        },
      },
    }),
    "Suitable for frequent consumption"
  );
});

test("dessert and pure bread remain Indulgent without nutrition", () => {
  assert.equal(resolveCardVerdict({ category: "dessert" }), "Indulgent");
  assert.equal(resolveCardVerdict({ category: "pure_bread" }), "Indulgent");
});
