/**
 * Phase 7 — Meal Intel is intent-scoped; not public Deals; Waiter files untouched.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Eating hub mounts Meal Intel separate from Deals", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const section = read("src/pages/consumer/myMenuply/MealIntelSection.jsx");
  const api = read("src/lib/consumerApi.js");

  assert.match(hub, /MealIntelSection/);
  assert.match(section, /listMealIntel/);
  assert.match(section, /not public Deals/i);
  assert.match(section, /Intent-Based Offers/);
  assert.doesNotMatch(section, /Bid-Free|\/deals|FeedDealsPage/);
  assert.match(api, /\/api\/consumer\/meal-intel/);
});

test("Phase 7 does not edit Waiter protected files", () => {
  // Contract: this phase must not rewrite Waiter UI — link only.
  const section = read("src/pages/consumer/myMenuply/MealIntelSection.jsx");
  assert.match(section, /to="\/waiter"/);
  assert.doesNotMatch(section, /fetchWaiterBriefing|FoodInterestsPage/);
});
