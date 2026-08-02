/**
 * Contract: Deals indicator icon next to menu-item prices when hasDeal.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("menu item deals indicator", () => {
  it("MenuItemDealsIndicator exposes a11y label and approved icon path", () => {
    const src = readFileSync(
      join(root, "src/components/menu/MenuItemDealsIndicator.jsx"),
      "utf8"
    );
    assert.match(src, /Deals available/);
    assert.match(src, /\/menuply-deals-icon\.png/);
    assert.match(src, /stopPropagation/);
  });

  it("PublicMenuItemCard shows indicator gated on hasDeal next to price", () => {
    const card = readFileSync(
      join(root, "src/components/menu-templates/PublicMenuItemCard.jsx"),
      "utf8"
    );
    assert.match(card, /MenuItemDealsIndicator/);
    assert.match(card, /hasDeal \? <MenuItemDealsIndicator/);
    assert.match(card, /onClick=\{openSheet\}/);
  });

  it("ChalkboardMenuTemplate shows indicator gated on deal", () => {
    const chalk = readFileSync(
      join(root, "src/components/menu-templates/ChalkboardMenuTemplate.jsx"),
      "utf8"
    );
    assert.match(chalk, /MenuItemDealsIndicator/);
    assert.match(chalk, /deal \? \(/);
  });

  it("dealMap builders key menu_item_id with id fallback", () => {
    const publicMenu = readFileSync(join(root, "src/pages/PublicMenuPage.jsx"), "utf8");
    const catalog = readFileSync(
      join(root, "src/components/menuCatalog/CatalogMenuRenderer.jsx"),
      "utf8"
    );
    const foodTruck = readFileSync(join(root, "src/pages/FoodTruckPage.jsx"), "utf8");
    for (const src of [publicMenu, catalog, foodTruck]) {
      assert.match(src, /d\.menu_item_id \?\? d\.id/);
    }
  });
});
