import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function read(relativePath) {
  return fs.readFileSync(path.join(currentDir, "..", relativePath), "utf8");
}

test("RestaurantPublicPage renders full claimable profile with menu; no bottom claim panel", () => {
  const source = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(source, /isFullClaimablePublicProfile/);
  assert.match(source, /showClaimInvites/);
  assert.match(source, /menuPreviewItems=\{menuPreview\?\.items/);
  assert.doesNotMatch(source, /ClaimProfilePanel/);
  assert.doesNotMatch(source, /claim-profile-panel/);
  assert.doesNotMatch(source, /Claim This Profile/);
  assert.doesNotMatch(source, /id="claim-profile"/);
  assert.doesNotMatch(source, /\.is_demo/);
  assert.doesNotMatch(source, /Demo profile/);
});

test("FoodTruckPage uses personality editorial with homepage shell (no inline menu)", () => {
  const source = read("src/pages/FoodTruckPage.jsx");
  const editorial = read("src/components/restaurant/FoodTruckPublicEditorial.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  const location = read("src/components/restaurant/publicProfile/FoodTruckCurrentLocation.jsx");
  const upcoming = read("src/components/restaurant/publicProfile/FoodTruckUpcomingStops.jsx");
  const favorites = read("src/components/restaurant/publicProfile/ProfileFavoriteMenuItems.jsx");
  assert.match(source, /FoodTruckPublicEditorial/);
  assert.match(source, /public_ordering_mode === "display_only"/);
  assert.match(source, /isClaimedFoodTruck/);
  assert.match(source, /showClaimInvites=\{Boolean\(profile\) && !isClaimedFoodTruck\(profile\)\}/);
  assert.doesNotMatch(source, /public_profile_mode === "full_claimable"/);
  assert.match(source, /showClaimInvites/);
  assert.doesNotMatch(source, /FullClaimableClaimNotice/);
  assert.doesNotMatch(source, /claim-profile-panel/);
  assert.doesNotMatch(source, /Claim this profile/);
  assert.match(source, /SaveContactButton/);
  assert.match(source, /food-truck-save-contact/);
  assert.match(source, /restaurantMenuPathFromRow/);
  assert.match(source, /menuHref/);
  assert.doesNotMatch(source, /Full menu/);
  assert.doesNotMatch(source, /<MenuInline/);
  assert.match(editorial, /PublicProfileShell/);
  assert.match(editorial, /profileType="food_truck"/);
  assert.match(editorial, /CONTENT_MAX = 640/);
  assert.match(location, /Current Location:/);
  assert.match(location, /food-truck-current-location/);
  assert.doesNotMatch(location, /Current location has not been posted/);
  assert.match(hero, /hasPostedLocation/);
  assert.match(hero, /saveContactControl/);
  assert.match(hero, /FoodTruckCurrentLocation/);
  assert.match(hero, /profile-hero-actions/);
  assert.match(upcoming, /food-truck-upcoming/);
  assert.match(shell, /Located today|buildCurrentLocation|FoodTruckUpcomingStops/);
  assert.match(shell, /Upcoming locations|FoodTruckUpcomingStops/);
  assert.match(shell, /isFoodTruckProfile/);
  assert.doesNotMatch(shell, /ProfileRestaurantHighlights/);
  assert.doesNotMatch(shell, /Food truck highlights/);
  assert.doesNotMatch(shell, /Business information/);
  assert.doesNotMatch(shell, /\{claimPanel\}/);
  assert.match(shell, /ProfileFavoriteMenuItems/);
  assert.match(shell, /ProfileBillboardBlock/);
  assert.match(shell, /FollowRestaurantButton|ProfileHero/);
  assert.match(shell, /saveContactControl/);
  assert.match(favorites, /viewMenuTestId|food-truck-view-menu/);
  assert.doesNotMatch(editorial, /RestaurantProfileMenuPreview/);
  assert.doesNotMatch(shell, /Where & when/);
  assert.doesNotMatch(shell, /Bio coming soon/);
  assert.doesNotMatch(shell, /No featured dish yet/);
  assert.doesNotMatch(shell, /No upcoming stops yet/);
  assert.doesNotMatch(source, /RestaurantPublicEditorial/);
  assert.doesNotMatch(source, /FullClaimableFoodTruckProfile/);
  assert.doesNotMatch(source, /\.is_demo/);
});

test("RestaurantPublicPage redirects food_truck listings to /foodtrucks custom profile", () => {
  const source = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(source, /isFoodTruckListing/);
  assert.match(source, /buildFoodTruckProfileHref/);
  assert.match(source, /Navigate to=\{foodTruckHref\}/);
  assert.match(source, /\/foodtrucks\/\$\{encodeURIComponent\(target\)\}/);
});
