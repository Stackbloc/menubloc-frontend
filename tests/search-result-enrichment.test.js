import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWhyMatchLabel,
  buildNutritionPreviewChips,
  formatPairingTeaser,
  shouldShowAllergenOnSearchCard,
} from "../src/lib/searchResultEnrichment.js";

test("buildWhyMatchLabel prefers match_reasons_v1", () => {
  const label = buildWhyMatchLabel(
    {
      match_reasons_v1: [
        { type: "canonical", label: "Burger-style", priority: 4 },
        { type: "nutrient", label: "40g protein", priority: 1 },
      ],
    },
    {}
  );
  assert.equal(label, "40g protein");
});

test("buildWhyMatchLabel falls back to template_name", () => {
  const label = buildWhyMatchLabel(
    { match_reasons_v1: [], match_reasons_structured: [], match_reasons: [], template_name: "crispy_chicken_sandwich" },
    {}
  );
  assert.ok(/crispy/i.test(label) && /sandwich/i.test(label));
});

test("buildNutritionPreviewChips omits missing values", () => {
  const chips = buildNutritionPreviewChips({ protein_g: 30 }, {});
  assert.deepEqual(chips, ["30g protein"]);
});

test("buildNutritionPreviewChips respects three-chip cap", () => {
  const chips = buildNutritionPreviewChips(
    {
      calories: 400,
      protein_g: 35,
      chips: {
        nutrition_chip: { calories_kcal: 400, protein_g: 35, sodium_mg: 200 },
        insights: { scores: { protein_strength: { score: 8, level: "high" } } },
      },
    },
    { nutrition_intent: { high_protein: true }, nutrient_constraints: {}, diet: {} }
  );
  assert.ok(chips.length <= 3);
});

test("formatPairingTeaser returns null for empty suggestions", () => {
  assert.equal(formatPairingTeaser({ chips: { pairings_chip: { suggestions: [] } } }), null);
  assert.equal(formatPairingTeaser({ chips: { pairings_chip: { status: "stub", suggestions: [] } } }), null);
});

test("formatPairingTeaser formats suggestion objects", () => {
  const line = formatPairingTeaser({
    chips: { pairings_chip: { suggestions: [{ name: "Side salad" }, "Fountain drink"] } },
  });
  assert.ok(line.startsWith("Pairs with"));
  assert.match(line, /Side salad/);
});

test("shouldShowAllergenOnSearchCard hidden by default without prefs or allergy query", () => {
  const row = {
    chips: {
      nutrition_chip: { allergens: ["Peanuts"], allergen_alert: "Contains peanuts" },
    },
  };
  assert.equal(
    shouldShowAllergenOnSearchCard(row, {
      searchQuery: "burger",
      isAuthenticated: false,
      allergenPreferences: [],
      allergenFilter: null,
    }),
    false
  );
});

test("shouldShowAllergenOnSearchCard shows for allergy-related query", () => {
  const row = {
    chips: { nutrition_chip: { allergens: ["Dairy"], allergen_alert: "" } },
  };
  assert.equal(
    shouldShowAllergenOnSearchCard(row, {
      searchQuery: "peanut free options",
      isAuthenticated: false,
      allergenPreferences: [],
      allergenFilter: null,
    }),
    true
  );
});

test("shouldShowAllergenOnSearchCard shows when user has allergen preferences", () => {
  const row = {
    chips: { nutrition_chip: { allergens: ["Soy"], allergen_alert: "" } },
  };
  assert.equal(
    shouldShowAllergenOnSearchCard(row, {
      searchQuery: "tofu bowl",
      isAuthenticated: true,
      allergenPreferences: ["soy"],
      allergenFilter: null,
    }),
    true
  );
});

test("shouldShowAllergenOnSearchCard hides when nutrition panel is open", () => {
  const row = {
    chips: { nutrition_chip: { allergens: ["Egg"], allergen_alert: "" } },
  };
  assert.equal(
    shouldShowAllergenOnSearchCard(row, {
      searchQuery: "allergy friendly",
      isAuthenticated: true,
      allergenPreferences: ["egg"],
      allergenFilter: null,
      nutritionDetailOpen: true,
    }),
    false
  );
});
