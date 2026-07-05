import test from "node:test";
import assert from "node:assert/strict";
import { getCanonicalMenuItemPath } from "../src/components/share/shareUtils.js";

test("getCanonicalMenuItemPath accepts menuItem.id", () => {
  const path = getCanonicalMenuItemPath({
    restaurant: { slug: "burger-place", city: "Los Angeles", state: "CA" },
    menuItem: { id: 123 },
  });

  assert.equal(path, "/restaurants/california/los-angeles/burger-place/menu-items/123");
});

test("getCanonicalMenuItemPath accepts menuItem.menu_item_id", () => {
  const path = getCanonicalMenuItemPath({
    restaurant: { slug: "burger-place", city: "Los Angeles", state: "CA" },
    menuItem: { menu_item_id: 456 },
  });

  assert.equal(path, "/restaurants/california/los-angeles/burger-place/menu-items/456");
});
