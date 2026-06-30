"use strict";

const assert = require("assert");
const {
  canRemoveManualMenuItem,
  canRemoveManualMenuSection,
  emptyManualMenuItem,
  emptyManualMenuSection,
  isManualMenuItemRowStarted,
  loadManualMenuDraft,
  manualMenuDraftStorageKey,
  validateManualMenuSections,
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

function testSectionsToItemsSkipsEmptyPlaceholderRows() {
  const section = emptyManualMenuSection();
  section.name = "Appetizers";
  section.items[0] = {
    ...section.items[0],
    name: "Mozzarella Sticks",
    price: "8.99",
  };
  section.items.push({
    id: "extra",
    name: "",
    description: "",
    price: "",
  });

  const filledSection = emptyManualMenuSection();
  filledSection.name = "";
  filledSection.items[0] = {
    ...filledSection.items[0],
    name: "",
    description: "",
    price: "",
  };

  const items = validateManualMenuSections([section, filledSection]);
  assert.strictEqual(items.ok, true);
  assert.strictEqual(items.flat.length, 1);

  assert.strictEqual(isManualMenuItemRowStarted({ name: "", description: "", priceRaw: "" }), false);
  assert.strictEqual(isManualMenuItemRowStarted({ name: "Fries", description: "", priceRaw: "" }), true);
}

function testCanRemoveOnlyAdditionalSections() {
  assert.strictEqual(canRemoveManualMenuSection(0, 1), false);
  assert.strictEqual(canRemoveManualMenuSection(0, 2), false);
  assert.strictEqual(canRemoveManualMenuSection(1, 2), true);
}

function testMissingSectionNamePointsAtCorrectSection() {
  const section1 = emptyManualMenuSection();
  section1.items[0] = {
    ...section1.items[0],
    name: "Steak & Eggs",
    price: "16.99",
  };

  const section2 = emptyManualMenuSection();
  section2.name = "Drinks";
  section2.items[0] = {
    ...section2.items[0],
    name: "Vodka & Tonic",
    price: "11.00",
  };

  const result = validateManualMenuSections([section1, section2]);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors[0], /Section 1: add a section name for Steak & Eggs/);
  assert.strictEqual(result.invalidSectionIds.length, 1);
  assert.strictEqual(result.invalidSectionIds[0], section1.id);
}

testCanRemoveOnlyAdditionalItems();
testCanRemoveOnlyAdditionalSections();
testValidateRequiresSectionNamePrice();
testSectionsToItemsSkipsEmptyPlaceholderRows();
testMissingSectionNamePointsAtCorrectSection();
console.log("manualMenuEntryModel.test.cjs: all passed");
