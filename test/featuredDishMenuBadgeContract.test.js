/**
 * Featured dish picker + public menu badge contracts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("featured dish profile manager + menu badge", () => {
  it("Profile Manager loads candidates API and links empty/view-on-menu states", () => {
    const page = readFileSync(join(root, "src/pages/owner/OwnerProfileManager.jsx"), "utf8");
    const api = readFileSync(join(root, "src/lib/ownerApi.js"), "utf8");
    assert.match(api, /getOwnerRestaurantFeaturedDishCandidates/);
    assert.match(api, /featured-dish\/candidates/);
    assert.match(page, /getOwnerRestaurantFeaturedDishCandidates/);
    assert.match(page, /owner-profile-manager-favorite-items/);
    assert.match(page, /Open Menu Manager/);
    assert.match(page, /View featured on menu/);
    assert.match(page, /menuItemDomId/);
    assert.doesNotMatch(page, /searchMenuConsoleItems\(restaurantId/);
  });

  it("PublicMenuItemCard shows Featured Dish when ids match", () => {
    const card = readFileSync(
      join(root, "src/components/menu-templates/PublicMenuItemCard.jsx"),
      "utf8"
    );
    assert.match(card, /isFeaturedDish/);
    assert.match(card, /featured_item\?\.id/);
    assert.match(card, /featured_menu_item_id/);
    assert.match(card, /Featured Dish/);
  });
});
