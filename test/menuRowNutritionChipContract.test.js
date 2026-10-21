/**
 * Contract: restaurant menus keep the Nutrition button now that a dish tap adds it
 * (Andre, 2026-10-21). It is the protected way from a menu row to the dish page.
 * The Menu Browser (tap orders, never leaves the menu) still hides it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

describe("menu row Nutrition button", () => {
  it("PublicMenuItemCard shows Nutrition in tap-to-add mode when keepNutritionChip is set", () => {
    const card = read("src/components/menu-templates/PublicMenuItemCard.jsx");
    assert.match(card, /keepNutritionChip,\s*\n\s*\} = useMenuRowActions\(\)/);
    assert.match(card, /const showNutritionInline =\s*\n\s*\(!tapRowToAdd \|\| keepNutritionChip\) &&/);
  });

  it("restaurant menu pages set keepNutritionChip; the Menu Browser does not", () => {
    assert.match(read("src/pages/PublicMenuPage.jsx"), /tapRowToAdd: true,[\s\S]{0,120}keepNutritionChip: true,/);
    assert.doesNotMatch(read("src/components/menuCatalog/CatalogMenuRenderer.jsx"), /keepNutritionChip/);
  });
});
