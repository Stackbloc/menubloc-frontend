"use strict";

const assert = require("assert");
const {
  buildHomeDiscoverySections,
  getExpandedSectionMenus,
} = require("../src/lib/homeNextSections.js");

function testDedupesAcrossSections() {
  const menus = [
    { menu_id: 1, restaurant_id: 10, restaurant_name: "A", menu_item_count: 50, cuisine: "pizza" },
    { menu_id: 2, restaurant_id: 20, restaurant_name: "B", menu_item_count: 40, cuisine: "mexican", distance_miles: 1.2 },
    { menu_id: 3, restaurant_id: 30, restaurant_name: "C", menu_item_count: 30, cuisine: "asian", distance_miles: 2.5 },
    { menu_id: 4, restaurant_id: 40, restaurant_name: "D", menu_item_count: 20, cuisine: "italian", distance_miles: 3.1 },
    { menu_id: 5, restaurant_id: 50, restaurant_name: "E", menu_item_count: 10, cuisine: "american", distance_miles: 4.0 },
  ];

  const sections = buildHomeDiscoverySections(menus, { hasGeo: true });
  assert.ok(sections.length >= 2);

  const ids = sections.flatMap((s) => s.menus.map((m) => m.menu_id));
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(sections[0].title, "Popular Menus");
  assert.ok(sections[0].reason.length > 0);
}

function testEmptyInput() {
  assert.deepStrictEqual(buildHomeDiscoverySections([]), []);
}

function testExpandedPopularReturnsSortedAndCapped() {
  const menus = Array.from({ length: 12 }, (_, i) => ({
    menu_id: i + 1,
    restaurant_id: (i + 1) * 10,
    restaurant_name: `R${i + 1}`,
    menu_item_count: 100 - i,
    cuisine: "american",
  }));
  const expanded = getExpandedSectionMenus(menus, "popular");
  assert.strictEqual(expanded.length, 8);
  assert.strictEqual(expanded[0].menu_id, 1);
  assert.strictEqual(expanded[7].menu_id, 8);
}

testDedupesAcrossSections();
testEmptyInput();
testExpandedPopularReturnsSortedAndCapped();
console.log("homeNextSections tests passed");
