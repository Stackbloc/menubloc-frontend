"use strict";

const assert = require("assert");
const {
  canRemoveManualMenuItem,
  emptyManualMenuSection,
  validateManualMenuSections,
  sectionsToManualMenuItems,
} = require("../src/lib/manualMenuEntryModel.js");

function testCanRemoveOnlyAdditionalItems() {
  assert.strictEqual(canRemoveManualMenuItem(0, 1), false);
  assert.strictEqual(canRemoveManualMenuItem(0, 2), false);
  assert.strictEqual(canRemoveManualMenuItem(1, 2), true);
  assert.strictEqual(canRemoveManualMenuItem(2, 3), true);
}

function testValidateRequiresSectionNamePrice() {
  const section = emptyManualMenuSection();
  section.name = "Appetizers";
  section.items[0] = {
    ...section.items[0],
    name: "Mozzarella Sticks",
    price: "8.99",
  };

  const ok = validateManualMenuSections([section]);
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.flat.length, 1);

  const bad = validateManualMenuSections([
    {
      ...section,
      items: [{ ...section.items[0], price: "" }],
    },
  ]);
  assert.strictEqual(bad.ok, false);
}

function testSectionsToItemsSkipsFullyEmptyRows() {
  const section = emptyManualMenuSection();
  section.items.push({
    id: "extra",
    name: "",
    description: "",
    price: "",
  });
  assert.strictEqual(sectionsToManualMenuItems([section]).length, 0);
}

testCanRemoveOnlyAdditionalItems();
testValidateRequiresSectionNamePrice();
testSectionsToItemsSkipsFullyEmptyRows();
console.log("manualMenuEntryModel.test.cjs: all passed");
