import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWhyMatchLabel,
  buildNutritionPreviewChips,
  formatPairingTeaser,
  queryRequiresNutritionDisplay,
  rowHasNutritionMacros,
  resolveNutritionIntentDisplayKeys,
  isNutritionIntentDisplayActive,
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

test("buildWhyMatchLabel prefers primary_family over template slug noise", () => {
  const label = buildWhyMatchLabel(
    {
      match_reasons_v1: [],
      match_reasons_structured: [],
      match_reasons: [],
      primary_family: "breaded_chicken",
      template_name: "fried_chicken_sandwich",
    },
    {}
  );
  assert.equal(label, "Breaded Chicken");
});

test("buildWhyMatchLabel skips ontology canonical reasons when primary_family is set", () => {
  assert.equal(
    buildWhyMatchLabel(
      {
        match_reasons_v1: [{ type: "canonical", label: "Crispy-style prep", priority: 1 }],
        primary_family: "burger",
      },
      {}
    ),
    "Burger"
  );
});

test("buildWhyMatchLabel uses broader identity when template confidence is low", () => {
  assert.equal(
    buildWhyMatchLabel(
      {
        match_reasons_v1: [],
        primary_family: "breaded_chicken",
        template_confidence_score: 0.2,
      },
      {}
    ),
    "Chicken"
  );
  assert.equal(
    buildWhyMatchLabel(
      {
        match_reasons_v1: [],
        primary_family: "breaded_chicken",
        template_confidence_score: 0.9,
      },
      {}
    ),
    "Breaded Chicken"
  );
});

test("buildNutritionPreviewChips omits missing values", () => {
  const chips = buildNutritionPreviewChips({ protein_g: 30 }, {});
  assert.deepEqual(chips, [{ label: "30g protein", primary: false }]);
});

test("buildNutritionPreviewChips highlights calories for low-calorie intent", () => {
  const chips = buildNutritionPreviewChips(
    { chips: { nutrition_chip: { calories_kcal: 420, protein_g: 18 } } },
    { nutrition_intent: { low_calorie: true }, nutrient_constraints: {}, diet: {} }
  );
  assert.equal(chips.length, 1);
  assert.equal(chips[0]?.label, "420 cal");
  assert.equal(chips[0]?.primary, true);
});

test("intent-aware low sodium shows sodium only", () => {
  const queryMeta = { nutrition_intent: { low_sodium: true } };
  const chips = buildNutritionPreviewChips(
    {
      chips: {
        nutrition_chip: {
          sodium_mg: 180,
          protein_g: 35,
          calories_kcal: 400,
          fat_g: 10,
        },
      },
    },
    queryMeta
  );
  assert.deepEqual(chips, [{ label: "180mg sodium", primary: true }]);
});

test("intent-aware low carbs and keto show carbs only", () => {
  const lowCarb = buildNutritionPreviewChips(
    {
      chips: {
        nutrition_chip: { carbs_g: 12, fiber_g: 4, protein_g: 28, sodium_mg: 500 },
      },
    },
    { nutrition_intent: { low_carb: true } }
  );
  assert.deepEqual(lowCarb, [{ label: "8g net carbs", primary: true }]);

  const keto = buildNutritionPreviewChips(
    {
      chips: {
        nutrition_chip: { carbs_g: 6, protein_g: 20, calories_kcal: 300 },
      },
    },
    { diet: { keto: true } }
  );
  assert.deepEqual(keto, [{ label: "6g net carbs", primary: true }]);
});

test("intent-aware high protein shows protein only", () => {
  const chips = buildNutritionPreviewChips(
    {
      chips: {
        nutrition_chip: { protein_g: 42, calories_kcal: 390, sodium_mg: 620 },
      },
    },
    { nutrition_intent: { high_protein: true } }
  );
  assert.deepEqual(chips, [{ label: "42g protein", primary: true }]);
});

test("intent-aware low calories shows calories only", () => {
  const chips = buildNutritionPreviewChips(
    {
      chips: {
        nutrition_chip: { calories_kcal: 310, protein_g: 24, sodium_mg: 480 },
      },
    },
    { nutrition_intent: { low_calorie: true } }
  );
  assert.deepEqual(chips, [{ label: "310 cal", primary: true }]);
});

test("resolveNutritionIntentDisplayKeys maps keto to low_carb", () => {
  assert.deepEqual(resolveNutritionIntentDisplayKeys({ diet: { keto: true } }), ["low_carb"]);
});

test("queryRequiresNutritionDisplay detects nutrient constraints", () => {
  assert.equal(
    queryRequiresNutritionDisplay({
      nutrient_constraints: { calories: { explicit: true, max: 500, direction: "low" } },
    }),
    true
  );
  assert.equal(queryRequiresNutritionDisplay({ nutrition_intent: { high_protein: true } }), true);
  assert.equal(queryRequiresNutritionDisplay({ text_terms: ["burger"] }), false);
});

test("isNutritionIntentDisplayActive detects nutrition intents", () => {
  assert.equal(isNutritionIntentDisplayActive({ nutrition_intent: { low_sodium: true } }), true);
  assert.equal(isNutritionIntentDisplayActive({ text_terms: ["salad"] }), false);
});

test("rowHasNutritionMacros reads chip and row fields", () => {
  assert.equal(rowHasNutritionMacros({ protein_g: 25 }), true);
  assert.equal(rowHasNutritionMacros({ chips: { nutrition_chip: { calories_kcal: 400 } } }), true);
  assert.equal(rowHasNutritionMacros({ item_name: "Salad" }), false);
});

test("rowHasNutritionMacros respects intent fields for low sodium", () => {
  const queryMeta = { nutrition_intent: { low_sodium: true } };
  assert.equal(
    rowHasNutritionMacros(
      { chips: { nutrition_chip: { sodium_mg: 220, protein_g: null, calories_kcal: null } } },
      queryMeta
    ),
    true
  );
  assert.equal(
    rowHasNutritionMacros(
      { chips: { nutrition_chip: { protein_g: 30, sodium_mg: null } } },
      queryMeta
    ),
    false
  );
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
  assert.equal(chips.length, 1);
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
