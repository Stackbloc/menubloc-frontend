/**
 * Phase 7b Waiter private offer (Intent-Based Offers) + Phase 8 operator publish UI.
 * 2026-09-07: Waiter briefing rebuild — privateOffer section replaces meal_intel category card.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Waiter private offer is IBO accent card; no forbidden greeting/fallback", () => {
  const page = read("src/pages/FoodInterestsPage.jsx");
  assert.match(page, /privateOffer|PrivateOfferSection/);
  assert.match(page, /Because you love/);
  assert.match(page, /Redeem when you/);
  assert.doesNotMatch(page, /<MarketFallback|<CommunityGrowthCard/);
  assert.doesNotMatch(page, /Good morning|Good afternoon|Good evening/);
  assert.doesNotMatch(page, /\bgroupByType\b/);
  assert.doesNotMatch(page, /\bbriefing\.cards\b/);
});

test("Operator Intent-Based Offers page hosts Meal Intel publish", () => {
  const page = read("src/pages/operator/OperatorCartNegotiationSettings.jsx");
  assert.match(page, /operator-meal-intel/);
  assert.match(page, /createRestaurantMealIntel/);
  assert.match(page, /publishRestaurantMealIntel/);
  assert.match(page, /not<\/strong> a public Deal/);
});

test("Consumer Meal Intel surfaces restaurant-published intel", () => {
  const section = read("src/pages/consumer/myMenuply/MealIntelSection.jsx");
  assert.match(section, /restaurant_meal_intel|meal-intel-restaurant/);
});
