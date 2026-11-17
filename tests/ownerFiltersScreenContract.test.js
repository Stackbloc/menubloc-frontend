/**
 * 🔒 FILTERS CONTRACT, plan 48 Phase 2 (Andre 2026-11-16).
 * Owner → Food Intelligence → Filters is read-only, and Contains tags match the backend
 * (filterRegistry.js CONTAINS_TAGS). Do NOT edit to make it pass.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("Filters screen is routed and in the Food Intelligence menu", () => {
  assert.match(read("src/pages/owner/foodIntelligence/FoodIntelligence.jsx"), /<Route path="filters" element={<FiltersScreen \/>} \/>/);
  assert.match(read("src/pages/owner/OwnerLayout.jsx"), /\/owner\/food-intelligence\/filters", label: "Filters"/);
});

test("Filters screen never writes: no publish, draft edit or live switch calls", () => {
  const src = read("src/pages/owner/foodIntelligence/FiltersScreen.jsx");
  for (const call of ["publish(", "editDraft(", "createDraft(", "restore(", "mealtimeSetLive("]) {
    assert.ok(!src.includes(`fiApi.${call}`), call);
  }
});

test("Contains tags match the backend vocabulary", () => {
  const src = read("src/lib/ownerFoodIntelligenceApi.js");
  const tags = [...src.matchAll(/\{ tag: "([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(tags, [
    "meat", "pork", "poultry", "fish", "shellfish", "meat_broth", "gelatin", "egg", "dairy",
    "gluten", "wheat", "peanuts", "tree_nuts", "soy", "sesame", "alcohol", "honey",
  ]);
});
