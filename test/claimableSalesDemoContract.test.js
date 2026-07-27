import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function read(relativePath) {
  return fs.readFileSync(path.join(currentDir, "..", relativePath), "utf8");
}

test("RestaurantPublicPage renders full claimable profile with menu and claim CTA", () => {
  const source = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(source, /isFullClaimablePublicProfile/);
  assert.match(source, /Claim This Profile/);
  assert.match(source, /Claim this profile|Claim/);
  assert.match(source, /menuPreviewItems=\{menuPreview\?\.items/);
  assert.doesNotMatch(source, /\.is_demo/);
  assert.doesNotMatch(source, /Demo profile/);
});

test("FoodTruckPage uses personality editorial with View menu icon rail (no inline menu)", () => {
  const source = read("src/pages/FoodTruckPage.jsx");
  const editorial = read("src/components/restaurant/FoodTruckPublicEditorial.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  const location = read("src/components/restaurant/publicProfile/FoodTruckCurrentLocation.jsx");
  const upcoming = read("src/components/restaurant/publicProfile/FoodTruckUpcomingStops.jsx");
  assert.match(source, /FoodTruckPublicEditorial/);
  assert.match(source, /public_ordering_mode === "display_only"/);
  assert.match(source, /public_profile_mode === "full_claimable"/);
  assert.match(source, /Claim this profile/);
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
  assert.match(hero, /food-truck-contact/);
  assert.match(hero, /hasPostedLocation/);
  assert.match(hero, /saveContactControl/);
  assert.match(upcoming, /food-truck-upcoming/);
  assert.match(shell, /Located today|buildCurrentLocation|FoodTruckUpcomingStops/);
  assert.match(shell, /Upcoming locations \/ events|FoodTruckUpcomingStops/);
  assert.doesNotMatch(shell, /ProfileRestaurantHighlights/);
  assert.doesNotMatch(shell, /Food truck highlights/);
  assert.doesNotMatch(shell, /Business information/);
  assert.match(shell, /ProfileFeaturedContent/);
  assert.match(shell, /FollowRestaurantButton|ProfileHero/);
  assert.match(shell, /food-truck-view-menu/);
  assert.match(shell, /ProfileMenuHighlights/);
  assert.match(shell, /saveContactControl/);
  assert.doesNotMatch(shell, /label="Website"/);
  assert.doesNotMatch(shell, /label="Phone"/);
  assert.match(hero, /ViewMenuIcon|ViewMenuLink/);
  assert.match(hero, /viewMenuTestId/);
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
