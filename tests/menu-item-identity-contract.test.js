import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { requireMenuItemIdentity, MENU_ITEM_IDENTITY_CONTRACT } from "../src/lib/menuItemIdentity.js";

const valid = Object.freeze({ menu_item_id: 101, restaurant_id: 12, menu_id: 7, product_key: "burger.classic" });

for (const source of ["Browse", "Search", "Restaurant Menu", "Similar", "Compare", "Saved/Bookmarks", "Likes", "Cart"]) {
  test(`${MENU_ITEM_IDENTITY_CONTRACT}: ${source}`, () => {
    assert.equal(requireMenuItemIdentity({ ...valid }, { menuContext: true }).menuItemId, 101);
  });
}

test(`${MENU_ITEM_IDENTITY_CONTRACT}: no generic id fallback`, () => {
  assert.throws(() => requireMenuItemIdentity({ id: 101, restaurant_id: 12 }), /menu_item_id is required/);
});

test(`${MENU_ITEM_IDENTITY_CONTRACT}: consumer action paths do not use item.id`, () => {
  const files = [
    "src/pages/MenuItemDetailPage.jsx",
    "src/pages/MenuItemInfoPage.jsx",
    "src/pages/ComparePage.jsx",
    "src/components/menu/CompareItemsModal.jsx",
    "src/components/menu-templates/PublicMenuItemCard.jsx",
    "src/components/menuCatalog/CatalogItemDetailSheet.jsx",
    "src/components/menuCatalog/CatalogMenuRenderer.jsx",
    "src/pages/PublicMenuPage.jsx",
    "src/pages/MarketMenuItemPage.jsx",
    "src/pages/Top5HealthiestPage.jsx",
    "src/context/orderCartModel.js",
  ];
  for (const file of files) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\b(?:item|candidateItem|similarEntry|entry)\??\.id\b/, file);
  }
});
