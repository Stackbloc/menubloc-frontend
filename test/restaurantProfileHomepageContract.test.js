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
    "ProfileToday",
    "ProfileAboutFounded",
    "ProfileFavoriteMenuItems",
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
  assert.match(fav, /House Favorites/);
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
  const about = read("src/components/restaurant/publicProfile/ProfileAboutFounded.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  const fav = read("src/components/restaurant/publicProfile/ProfileFavoriteMenuItems.jsx");
  const deals = read("src/components/restaurant/publicProfile/ProfileDealsSection.jsx");
  const photos = read("src/components/restaurant/publicProfile/ProfilePhotoStrip.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(primitives, /ProfileSectionBlank/);
  assert.match(primitives, /ProfileClaimBanner/);
  assert.match(primitives, /This is an unclaimed profile/);
  assert.match(
    primitives,
    /independent directory listing and is not affiliated with/
  );
  assert.match(primitives, /Are you the owner\?/);
  assert.match(
    primitives,
    /Claim this profile to manage menus, updates, and other content\./
  );
  assert.doesNotMatch(primitives, /This profile is unclaimed\./);
  assert.doesNotMatch(primitives, /Claim this profile to complete it/);
  assert.doesNotMatch(primitives, /Owners can add Instagram/);
  assert.match(about, /profile-about-founded/);
  assert.match(about, /profile-founded/);
  assert.match(about, /profile-founded-blank/);
  assert.match(about, /profile-founded-empty/);
  assert.doesNotMatch(about, /profile-about-claim/);
  assert.match(about, /ProfilePhotoStrip/);
  assert.match(shell, /showPhotos=\{false\}/);
  assert.match(hero, /profile-hero-maps-address/);
  assert.match(hero, /profile-hero-hours/);
  assert.match(hero, /formatWeeklyHoursRows/); // typical Mon → Sun hours, no dates (2026-10-21)
  assert.match(hero, /const hoursPanel = hoursRows\.length \?/); // no hours → no panel
  assert.doesNotMatch(hero, /not posted/);
  assert.doesNotMatch(hero, /"Hours:"/);
  assert.match(hero, /formatWeeklyHoursRows\(operatingHours,\s*\{/);
  assert.match(hero, /timezone:\s*hoursTimezone/);
  assert.match(hero, /gridTemplateColumns: "auto 1fr"/);
  // Instagram removed from restaurant profiles (Andre 2026-10-20).
  assert.doesNotMatch(hero, /instagram/i);
  assert.match(hero, /profile-hero-website/);
  assert.match(hero, /profile-hero-phone/);
  assert.match(hero, /profile-hero-cluster-field/);
  assert.match(hero, /Cluster: /);
  assert.match(hero, /\{cluster \? \(/);
  assert.doesNotMatch(hero, /showRestaurantContact && cluster/);
  assert.doesNotMatch(hero, /profile-hero-phone-blank/);
  assert.doesNotMatch(hero, /profile-hero-instagram-blank/);
  assert.doesNotMatch(hero, /profile-hero-website-blank/);
  assert.doesNotMatch(hero, /Claim this profile/);
  assert.doesNotMatch(hero, /profile-hero-directions/);
  assert.match(hero, /justifyContent: "flex-end"/);
  assert.match(fav, /profile-favorites-blank/);
  assert.match(deals, /profile-deals-blank/);
  assert.match(photos, /profile-photos-blank/);
  assert.match(photos, /showPhotosHeading/);
  assert.match(photos, /photos\.length === 0/);
  assert.match(shell, /ProfileAboutFounded/);
  assert.match(shell, /ProfileClaimBanner/);
  assert.match(shell, /showClaimInvites=\{allowClaimInvites\}/);
  assert.match(shell, /clusterName=\{clusterName\}/);
  assert.doesNotMatch(shell, /clusterLabel/);
  assert.doesNotMatch(shell, /clusterTypeLabel/);
  assert.doesNotMatch(shell, /ProfileRestaurantInfo/);
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
  // Instagram removed from restaurant profiles (Andre 2026-10-20).
  assert.doesNotMatch(owner, /owner-profile-manager-instagram|instagram: form\.instagram/);
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

/** 2026-10-21 simplification: diners never see empty owner prompts or public diner-signal sections. */
function testSimplifiedDinerProfile() {
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  for (const tag of ["ProfileAboutFounded", "ProfileFavoriteMenuItems", "ProfileToday"]) {
    const start = shell.indexOf(`<${tag}`);
    assert.ok(start >= 0, `${tag} mounted`);
    const block = shell.slice(start, shell.indexOf("/>", start));
    assert.doesNotMatch(block, /showClaimInvites/, `${tag} must not render claim-invite blanks`);
  }
  assert.doesNotMatch(shell, /foundedText=\{founded\}/);
  assert.doesNotMatch(shell, /profile-upcoming-blank/);
  assert.match(shell, /establishedLabel=\{establishedLabel\}/);
  assert.match(shell, /<ProfileClaimBanner/);
  assert.match(shell, /<ConnectionSocialProof/);
  assert.match(shell, /restaurantId && isDiningHall \? \(\s*<WhatDinersAreSaying/);
  assert.doesNotMatch(shell, /<RestaurantDiningIntentSection/);

  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  assert.match(hero, /profile-hero-established/);
  const primitives = read("src/components/restaurant/publicProfile/profilePrimitives.jsx");
  assert.match(primitives, /export function formatEstablishedLabel/);
  assert.match(primitives, /`Est\. \$\{match\[1\]\}`/);
}

/** Phase 2 (2026-10-21): Today at card, Your Connects, Wish List naming. */
function testTodayAndYourConnects() {
  const today = read("src/components/restaurant/publicProfile/ProfileToday.jsx");
  assert.match(today, /`Today at \$\{placeName\}`/);
  assert.match(today, /if \(!posts\.length && !deals\.length\) return null/);
  assert.match(today, /placement="profile_today" badge/);
  const proof = read("src/components/social/ConnectionSocialProof.jsx");
  assert.match(proof, />Your Connects</);
  assert.match(proof, /has this on their Wish List/);
  assert.match(proof, /if \(!isAuthenticated\)/);
  const editor = read("src/pages/operator/OperatorProfileEditor.jsx");
  assert.match(editor, /Today at your restaurant/);
  assert.match(editor, /todayOnly/);
}

testHomepageSectionOrder();
testFavoritesCapAndViewMenu();
testUpdatesHideWhenEmpty();
testUnclaimedHomepageBlanks();
testSplashPreserved();
testOwnerFavoritesAndUpdates();
testFoodTruckPlanOrType();
testSimplifiedDinerProfile();
testTodayAndYourConnects();

console.log("restaurantProfileHomepageContract: ok");
