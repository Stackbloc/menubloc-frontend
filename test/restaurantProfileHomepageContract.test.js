/**
 * Public restaurant homepage redesign contracts:
 * section order, favorites ≤3, updates hide-when-empty, splash preserved.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testHomepageSectionOrder() {
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const order = [
    "ProfileHero",
    "ProfileBillboardBlock",
    "ProfileFavoriteMenuItems",
    "ProfileUpdates",
    "ProfileDealsSection",
    "ProfilePhotoStrip",
    "ProfileRestaurantInfo",
  ];
  let last = -1;
  for (const name of order) {
    const idx = shell.indexOf(`<${name}`);
    assert.ok(idx > last, `${name} missing or out of order`);
    last = idx;
  }
}

function testFavoritesCapAndViewMenu() {
  const fav = read("src/components/restaurant/publicProfile/ProfileFavoriteMenuItems.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(fav, /\.slice\(0, 3\)/);
  assert.match(fav, /Favorite Menu Items/);
  assert.doesNotMatch(fav, /View Menu →/);
  assert.match(hero, /ViewMenuLink/);
  assert.match(shell, /restaurant-profile-view-menu|food-truck-view-menu/);
}

function testUpdatesHideWhenEmpty() {
  const updates = read("src/components/restaurant/publicProfile/ProfileUpdates.jsx");
  assert.match(updates, /if \(!list\.length && !showClaimInvites\) return null/);
  assert.match(updates, /profile-updates/);
  assert.match(updates, /ProfileSectionBlank/);
}

function testUnclaimedHomepageBlanks() {
  const primitives = read("src/components/restaurant/publicProfile/profilePrimitives.jsx");
  const billboard = read("src/components/restaurant/publicProfile/ProfileBillboardBlock.jsx");
  const fav = read("src/components/restaurant/publicProfile/ProfileFavoriteMenuItems.jsx");
  const deals = read("src/components/restaurant/publicProfile/ProfileDealsSection.jsx");
  const photos = read("src/components/restaurant/publicProfile/ProfilePhotoStrip.jsx");
  const info = read("src/components/restaurant/publicProfile/ProfileRestaurantInfo.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(primitives, /ProfileSectionBlank/);
  assert.match(primitives, /Claim this profile to complete/);
  assert.match(billboard, /profile-billboard-blank/);
  assert.match(fav, /profile-favorites-blank/);
  assert.match(deals, /profile-deals-blank/);
  assert.match(photos, /profile-photos-blank/);
  assert.match(info, /profile-info-hours-blank/);
  assert.match(shell, /showClaimInvites=\{showClaimInvites\}/);
  assert.doesNotMatch(shell, /ProfileAtAGlance/);
}

function testSplashPreserved() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /ClaimedRestaurantBillboardSplash/);
  assert.match(page, /UnclaimedRestaurantBrandSplash/);
  assert.match(page, /pickClaimedBillboardSplashPosts/);
}

function testOwnerFavoritesAndUpdates() {
  const owner = read("src/pages/owner/OwnerProfileManager.jsx");
  const api = read("src/lib/ownerApi.js");
  assert.match(owner, /owner-profile-manager-favorite-items/);
  assert.match(owner, /owner-profile-manager-updates/);
  assert.match(owner, /updateOwnerRestaurantFavoriteMenuItems/);
  assert.match(owner, /createOwnerRestaurantProfileUpdate/);
  assert.match(api, /favorite-menu-items/);
  assert.match(api, /profile-updates/);
}

function testFoodTruckPlanOrType() {
  const primitives = read("src/components/restaurant/publicProfile/profilePrimitives.jsx");
  assert.match(primitives, /isFoodTruckProfile/);
  assert.match(primitives, /food_truck_annual/);
  assert.match(primitives, /restaurant_type/);
}

testHomepageSectionOrder();
testFavoritesCapAndViewMenu();
testUpdatesHideWhenEmpty();
testUnclaimedHomepageBlanks();
testSplashPreserved();
testOwnerFavoritesAndUpdates();
testFoodTruckPlanOrType();

console.log("restaurantProfileHomepageContract: ok");
