/**
 * Contract: /restaurants/:slug/menu-items/:id must not be parsed as
 * /restaurants/:state/:city/:slug (SEO middleware false match → wrong 301).
 */
const assert = require("node:assert/strict");

const CANONICAL_PROFILE_RE = /^\/restaurants\/([^/]+)\/([^/]+)\/([^/]+)\/?$/;
const RESTAURANT_MENU_ITEM_RE = /^\/restaurants\/([^/]+)\/menu-items\/([^/]+)\/?$/;

function classifyRestaurantPath(pathname) {
  const menuItem = RESTAURANT_MENU_ITEM_RE.exec(pathname);
  if (menuItem) {
    return { kind: "restaurant_menu_item", restaurantSlug: menuItem[1], itemId: menuItem[2] };
  }
  const profile = CANONICAL_PROFILE_RE.exec(pathname);
  if (profile) {
    if (profile[2] === "menu-items") {
      return { kind: "blocked_false_profile", state: profile[1], city: profile[2], slug: profile[3] };
    }
    return { kind: "canonical_profile", state: profile[1], city: profile[2], slug: profile[3] };
  }
  return { kind: "other" };
}

function main() {
  const ino = classifyRestaurantPath("/restaurants/in-n-out-burger-3/menu-items/24862");
  assert.equal(ino.kind, "restaurant_menu_item");
  assert.equal(ino.restaurantSlug, "in-n-out-burger-3");
  assert.equal(ino.itemId, "24862");

  const fixins = classifyRestaurantPath(
    "/restaurants/fixins-soul-kitchen-los-angeles/menu-items/457052"
  );
  assert.equal(fixins.kind, "restaurant_menu_item");
  assert.equal(fixins.itemId, "457052");

  // Without menu-item handler, CANONICAL_PROFILE_RE still matches — prove the hazard.
  const hazard = CANONICAL_PROFILE_RE.exec("/restaurants/in-n-out-burger-3/menu-items/24862");
  assert.ok(hazard);
  assert.equal(hazard[2], "menu-items");
  assert.equal(hazard[3], "24862");

  const dunkin = classifyRestaurantPath(
    "/restaurants/tennessee/knoxville/dunkin-knoxville-tn-36-017-83-827"
  );
  assert.equal(dunkin.kind, "canonical_profile");
  assert.equal(dunkin.slug, "dunkin-knoxville-tn-36-017-83-827");

  console.log("middlewareRestaurantMenuItemPathContract: ok");
}

main();
