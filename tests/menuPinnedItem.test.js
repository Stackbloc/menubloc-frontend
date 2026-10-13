import test from "node:test";
import assert from "node:assert/strict";

import {
  findPinnedMenuItem,
  normalizeDishName,
  withoutPinnedMenuItem,
} from "../src/lib/menuPinnedItem.js";

const sections = [
  { title: "Breakfast", items: [{ menu_item_id: "541657", name: "Breakfast Baconator" }] },
  {
    title: "Chicken",
    items: [
      { menu_item_id: "541634", name: "Spicy Chicken Sandwich" },
      { menu_item_id: "541700", name: "Spicy Chicken Sandwich Combo" },
    ],
  },
  { title: "Solo", items: [{ menu_item_id: "9", name: "Frosty®" }] },
];

test("matches by canonical menu_item_id first", () => {
  const m = findPinnedMenuItem(sections, { menuItemId: 541700, menuItemName: "Spicy Chicken Sandwich" });
  assert.equal(m.item.menu_item_id, "541700");
});

test("falls back to exact normalized dish name (Wendy's video id 14363 is not on the menu)", () => {
  const m = findPinnedMenuItem(sections, { menuItemId: 14363, menuItemName: "spicy chicken  sandwich" });
  assert.equal(m.item.menu_item_id, "541634");
  assert.deepEqual([m.sectionIndex, m.itemIndex], [1, 0]);
});

test("no substring matches and no match returns null", () => {
  assert.equal(findPinnedMenuItem(sections, { menuItemName: "Spicy Chicken" }), null);
  assert.equal(findPinnedMenuItem(sections, { menuItemName: "Platform video" }), null);
  assert.equal(findPinnedMenuItem(sections, {}), null);
  assert.equal(findPinnedMenuItem(null, { menuItemName: "x" }), null);
});

test("normalizeDishName strips marks and punctuation", () => {
  assert.equal(normalizeDishName("Frosty®"), "frosty");
  assert.equal(normalizeDishName("Mac & Cheese"), "mac and cheese");
  assert.equal(findPinnedMenuItem(sections, { menuItemName: "frosty" }).item.menu_item_id, "9");
});

test("withoutPinnedMenuItem removes only the pinned row and drops emptied sections", () => {
  const pinned = findPinnedMenuItem(sections, { menuItemName: "Spicy Chicken Sandwich" });
  const rest = withoutPinnedMenuItem(sections, pinned);
  assert.equal(rest.length, 3);
  assert.deepEqual(rest[1].items.map((it) => it.menu_item_id), ["541700"]);
  const solo = withoutPinnedMenuItem(sections, findPinnedMenuItem(sections, { menuItemId: "9" }));
  assert.equal(solo.length, 2);
  assert.equal(withoutPinnedMenuItem(sections, null), sections);
});

test("findPinnedMenuItems pins up to three dishes in video order, skipping misses/dupes", async () => {
  const { findPinnedMenuItems, withoutPinnedMenuItems } = await import("../src/lib/menuPinnedItem.js");
  const matches = findPinnedMenuItems(sections, [
    { id: 541700, name: "Spicy Chicken Sandwich Combo" },
    { id: null, name: "Not On Menu" },
    { id: 9, name: "Frosty" },
    { id: 541700, name: "dupe" },
    { id: 541657, name: "Breakfast Baconator" },
    { id: 541634, name: "Spicy Chicken Sandwich" },
  ]);
  assert.deepEqual(matches.map((m) => m.item.menu_item_id), ["541700", "9", "541657"]);
  const rest = withoutPinnedMenuItems(sections, matches);
  assert.deepEqual(rest.map((s) => s.title), ["Chicken"]);
  assert.deepEqual(rest[0].items.map((i) => i.menu_item_id), ["541634"]);
});
