import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWhyMatchLabel,
  buildNutritionPreviewChips,
  formatPairingTeaser,
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
