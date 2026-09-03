"use strict";

/**
 * Contract: Add Menu contribution eligibility + auth return paths.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildAddMenuLoginPath,
  buildAddMenuPath,
  canShowAddMenu,
  ADD_MENU_HOVER_LABEL,
  hasUsableActiveMenu,
  isDiningHallEntity,
  isUnclaimedForAddMenu,
} from "../src/lib/addMenuContribution.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const baseRow = {
  id: 42,
  restaurant_name: "Test Place",
  city: "Los Angeles",
  state: "CA",
  claim_status: "unclaimed",
  restaurant_type: "restaurant",
};

assert.equal(canShowAddMenu(baseRow), true, "unclaimed restaurant without menu shows Add Menu");
assert.equal(
  canShowAddMenu({ ...baseRow, menu_ready: true }),
  false,
  "menu_ready hides Add Menu"
);
assert.equal(
  canShowAddMenu({ ...baseRow, claim_status: "claimed" }),
  false,
  "claimed hides Add Menu"
);
assert.equal(
  canShowAddMenu({ ...baseRow, restaurant_type: "dining_hall" }),
  false,
  "dining hall excluded"
);
assert.equal(
  canShowAddMenu({ ...baseRow, preview_items: [{ name: "Burger" }] }),
  false,
  "preview items count as usable menu"
);

assert.equal(isDiningHallEntity({ restaurant_type: "dining_hall" }), true);
assert.equal(isUnclaimedForAddMenu({ claim_status: "claim_pending" }), false);
assert.equal(hasUsableActiveMenu({ public_menu_item_count: 3 }), true);
assert.equal(
  hasUsableActiveMenu({ menu_item_count: 20 }),
  true,
  "profile menu_item_count alone is usable (Bacari West Adams class)"
);
assert.equal(
  canShowAddMenu({ ...baseRow, menu_item_count: 20 }),
  false,
  "unclaimed + published item count must show View Menu not Add Menu camera"
);
assert.equal(
  hasUsableActiveMenu({
    menus: [{ id: 14391, status: "published", item_count: 7, is_active: true }],
  }),
  true,
  "published menus[] with item_count is usable"
);
assert.equal(
  canShowAddMenu({
    ...baseRow,
    id: 78936,
    restaurant_name: "bacari west adams",
    menus: [{ id: 14391, status: "published", item_count: 7 }],
  }),
  false,
  "Bacari West Adams-shaped profile must not open menu-capture"
);

const addPath = buildAddMenuPath(baseRow);
assert.ok(addPath.startsWith("/menu-capture?"), "Add Menu path uses menu-capture");
assert.ok(addPath.includes("restaurant_id=42"), "Add Menu path carries restaurant_id");
assert.equal(
  buildAddMenuLoginPath(addPath),
  `/account/login?next=${encodeURIComponent(addPath)}`,
  "login path preserves return"
);

const addMenuContribution = read("src/lib/addMenuContribution.js");
assert.ok(addMenuContribution.includes("camera at the top"), "hover copy explains top camera");

const addMenuAction = read("src/components/AddMenuAction.jsx");
assert.ok(addMenuAction.includes("ADD_MENU_HOVER_LABEL"), "uses shared hover copy");
assert.ok(addMenuAction.includes("AddMenuIcon"), "uses camera-menu icon");
assert.ok(addMenuAction.includes("buildAddMenuLoginPath"), "signed-out users go to login");
assert.doesNotMatch(addMenuAction, /prominent/);

const publicMenuPage = read("src/pages/PublicMenuPage.jsx");
assert.ok(publicMenuPage.includes("menuHeaderLeadingAction"), "empty menu uses header rail Add Menu");
assert.doesNotMatch(publicMenuPage, /AddMenuEmptyPlaceholder/);

const menuHeaderRail = read("src/components/menu-templates/MenuHeaderIconRail.jsx");
assert.ok(menuHeaderRail.includes("leadingAction"), "menu header accepts leading action slot");

const menuCapture = read("src/pages/MenuCapturePage.jsx");
assert.ok(menuCapture.includes("restaurantLocked"), "capture skips identity when restaurant known");
assert.ok(menuCapture.includes("apiPost"), "capture uses api.js helpers");
assert.ok(!menuCapture.includes('import.meta.env.VITE_API_BASE_URL'), "no inline API base");

const profileHero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
assert.ok(profileHero.includes("AddMenuAction"), "profile hero wires Add Menu");
assert.ok(profileHero.includes("ViewMenuLink"), "View Menu retained when menu exists");

const profileShell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
assert.ok(
  profileShell.includes("menuItemCount"),
  "profile shell passes menu item count into Add Menu context"
);
assert.match(
  profileShell,
  /restaurantFromAddMenuContext\([\s\S]*menuItemCount/,
  "menuItemCount reaches restaurantFromAddMenuContext"
);

console.log("addMenuContributionContract.test.js: PASS");
