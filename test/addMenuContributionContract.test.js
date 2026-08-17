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

console.log("addMenuContributionContract.test.js: PASS");
