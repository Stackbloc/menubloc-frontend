import test from "node:test";
import assert from "node:assert/strict";
import {
  isExcludedModifierOrAddOnMenuItem,
  filterEligibleSimilarMenuItems,
} from "../src/lib/similarItemsEligibility.js";

test("excludes Add Bacon and Add Waffle Fries", () => {
  assert.equal(isExcludedModifierOrAddOnMenuItem({ name: "Add Bacon" }), true);
  assert.equal(isExcludedModifierOrAddOnMenuItem({ menu_item_name: "Add Waffle Fries" }), true);
});

test("keeps real entrees eligible", () => {
  assert.equal(isExcludedModifierOrAddOnMenuItem({ name: "Double Cheeseburger" }), false);
  assert.equal(isExcludedModifierOrAddOnMenuItem({ name: "Italian Sub" }), false);
  assert.equal(isExcludedModifierOrAddOnMenuItem({ name: "Large Pepperoni Pizza" }), false);
});

test("filterEligibleSimilarMenuItems removes junk only", () => {
  const rows = [{ name: "Add Bacon" }, { name: "Club Sandwich" }, { name: "Extra cheese" }];
  const out = filterEligibleSimilarMenuItems(rows);
  assert.deepEqual(
    out.map((r) => r.name),
    ["Club Sandwich"]
  );
});
