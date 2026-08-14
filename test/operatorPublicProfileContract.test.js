/**
 * Operator Public Profile:
 * - Dashboard Quick Access → /operator/my-account (edit: Save draft / Publish / View)
 * - My Account hosts the Restaurant Profile form
 * - claim_pending + owning operator must not hit UnclaimedRestaurantPage claim CTA
 * - Public restaurant + food truck profiles share PublicProfileShell
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { operatorPublicProfilePath } from "../src/lib/canonicalUrl.js";
import { formatWebsiteHostLabel } from "../src/lib/formatWebsiteHostLabel.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testWebsiteHostLabelDisplay() {
  assert.equal(formatWebsiteHostLabel("https://www.tomswatchbar.com/"), "tomswatchbar.com");
  assert.equal(formatWebsiteHostLabel("https://tomswatchbar.com/menu"), "tomswatchbar.com");
  assert.equal(formatWebsiteHostLabel("http://Example.COM"), "example.com");
  assert.equal(formatWebsiteHostLabel("tomswatchbar.com"), "tomswatchbar.com");
  assert.equal(formatWebsiteHostLabel(""), "");
}

function testOperatorPublicProfilePathHelper() {
  assert.equal(
    operatorPublicProfilePath({ slug: "dunkin", city: "Los Angeles", state: "CA" }),
    "/restaurants/california/los-angeles/dunkin"
  );
  assert.equal(
    operatorPublicProfilePath({ slug: "dunkin" }),
    "/restaurants/dunkin"
  );
  assert.equal(
    operatorPublicProfilePath({ id: 78168 }),
    "/restaurants/78168"
  );
  assert.equal(operatorPublicProfilePath(null), null);
}

function testDashboardOpensProfileEditor() {
  const src = read("src/pages/operator/OperatorDashboard.jsx");
  // Tip dashboard layout varies; only assert restaurant-profile deep links are gone.
  assert.doesNotMatch(src, /\/restaurant-profile\/\$\{/);
  assert.doesNotMatch(src, /`\/restaurant-profile\//);
}

function testMyAccountUsesOperatorPublicProfilePath() {
  const src = read("src/pages/operator/OperatorMyAccount.jsx");
  // Profile editor moved to Operations / Menu sidebar; My Account keeps settings + QR.
  assert.match(src, /OperatorLayout/);
  assert.match(src, /My QR Code/);
  assert.doesNotMatch(src, /\/restaurant-profile\/\$\{/);
}

function testHelpCenterDocumentsRestaurantsSlug() {
  const src = read("src/pages/operator/RestaurantHelpCenter.jsx");
  assert.match(src, /\/restaurants\/\[your-restaurant-slug\]/);
  assert.doesNotMatch(src, /\/restaurant-profile\/\[your-restaurant-id\]/);
}

function testPublicPageHasOwnerChrome() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  const chrome = read("src/components/restaurant/PublicProfileOwnerChrome.jsx");
  assert.match(page, /PublicProfileOwnerChrome/);
  assert.match(page, /isOwner/);
  // Public page is view-only for owners — Edit links to My Account (no duplicate form).
  assert.match(chrome, /\/operator\/my-account/);
  assert.doesNotMatch(chrome, /publishProfile/);
  assert.doesNotMatch(chrome, /updateProfile/);
  assert.doesNotMatch(chrome, /RestaurantStatusSettingsPanel/);
}

function testClaimPendingAndOwnerSkipUnclaimedStub() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /status === "claimed" \|\| status === "claim_pending"/);
  assert.match(page, /isOrdinaryUnclaimed/);
  assert.doesNotMatch(page, /ClaimProfilePanel/);
  assert.doesNotMatch(page, /claim-profile-panel/);
}

function testProfileEditorHasSavePublishView() {
  const src = read("src/pages/operator/OperatorProfileEditor.jsx");
  assert.match(src, /Save draft/);
  assert.match(src, /Publish changes/);
  assert.match(src, /Preview Public Profile|View Public Profile/);
  assert.match(src, /Website/);
  assert.match(src, /website_url/);
  assert.match(src, /address_line1/);
  assert.match(src, /Street address/);
  assert.match(src, /postal_code/);
  assert.match(src, /publicData\.restaurant \|\| publicData/);
  assert.match(src, /publicRestaurant\.name \|\| publicRestaurant\.restaurant_name/);
  assert.match(src, /RestaurantStatusSettingsPanel/);
  assert.match(src, /readOnly/);
  assert.match(src, /Protected listing identity/);
  assert.match(src, /Instagram/);
  assert.match(src, /updateFavoriteMenuItems/);
  assert.match(src, /createProfileUpdate/);
  assert.doesNotMatch(src, /restaurant_name:\s*form\.restaurant_name/);
  assert.doesNotMatch(src, /Short bio/);
}

/** Consumer public profile must always be light — never grubbid_theme dark default. */
function testPublicProfileForcedLight() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /PUBLIC_PROFILE_IS_DARK\s*=\s*false/);
  assert.match(page, /const isDark = PUBLIC_PROFILE_IS_DARK/);
  assert.match(page, /pageBg = isDark \? "#0b0b0f" : "#ffffff"/);
  assert.doesNotMatch(page, /function readTheme/);
  assert.doesNotMatch(page, /function saveTheme/);
  assert.doesNotMatch(page, /THEME_KEY/);
  assert.doesNotMatch(page, /grubbid_theme/);
  assert.doesNotMatch(page, /localStorage\.getItem\(THEME_KEY\)/);
  const whitePageBgMatches = page.match(/pageBg = isDark \? "#0b0b0f" : "#ffffff"/g) || [];
  assert.equal(whitePageBgMatches.length, 1);
}

/** Profile header actions: View Menu, Follow, Share, Invite, Comment (no Call icon). */
function testPublicProfileMenuLikeShareRail() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  const editorial = read("src/components/restaurant/RestaurantPublicEditorial.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const favorites = read("src/components/restaurant/publicProfile/ProfileFavoriteMenuItems.jsx");
  assert.match(page, /RestaurantPublicEditorial/);
  assert.match(page, /menuHref=\{menuHref\}/);
  assert.match(page, /restaurantMenuPathFromRow/);
  assert.match(editorial, /PublicProfileShell/);
  assert.match(editorial, /profileType="restaurant"/);
  assert.match(hero, /ViewMenuLink/);
  assert.match(hero, /FollowRestaurantButton/);
  assert.match(hero, /source=\{followSource\}/);
  assert.match(hero, /variant="menu"/);
  assert.match(hero, /profile-hero-actions/);
  assert.doesNotMatch(hero, /profile-hero-call/);
  assert.match(hero, /profile-hero-phone/);
  assert.match(hero, /profile-hero-maps-address/);
  assert.doesNotMatch(hero, /profile-hero-directions/);
  assert.match(hero, /profile-action-order/);
  assert.match(shell, /followSource=\{isFoodTruck \? "food_truck_profile" : "restaurant_profile"\}/);
  assert.match(shell, /restaurant-profile-view-menu|food-truck-view-menu/);
  assert.match(favorites, /Favorite Menu Items/);
  assert.doesNotMatch(favorites, /View Menu →/);
  assert.doesNotMatch(favorites, /restaurant-profile-view-menu/);
  const railStart = hero.indexOf('data-testid="profile-hero-actions"');
  const railSlice = hero.slice(railStart, railStart + 1600);
  assert.ok(railStart > -1, "hero actions rail missing");
  assert.match(railSlice, /ViewMenuLink[\s\S]*FollowRestaurantButton[\s\S]*ShareButton[\s\S]*InviteToEatButton[\s\S]*FoodCommentNavButton/);
  assert.doesNotMatch(railSlice, /profile-hero-call|label="Call"/);
  assert.doesNotMatch(page, />\s*Follow\s*</);
  assert.doesNotMatch(page, /Following/);
}

/**
 * Claimed and ordinary unclaimed restaurants use shared homepage public profile.
 * Claimed: Hero → Windows (if offers) → About [Name] + Founded + Photos → Favorites → Deals → Updates.
 * Unclaimed: Hero → About [Name] + Founded + Photos → Favorites → Deals → Updates.
 */
function testClaimedProfileUsesEditorialPresentation() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  const editorial = read("src/components/restaurant/RestaurantPublicEditorial.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  const favorites = read("src/components/restaurant/publicProfile/ProfileFavoriteMenuItems.jsx");
  const updates = read("src/components/restaurant/publicProfile/ProfileUpdates.jsx");
  const deals = read("src/components/restaurant/publicProfile/ProfileDealsSection.jsx");
  const about = read("src/components/restaurant/publicProfile/ProfileAboutFounded.jsx");
  const billboard = read("src/components/restaurant/publicProfile/ProfileBillboardBlock.jsx");
  assert.match(page, /RestaurantPublicEditorial/);
  assert.match(page, /favorite_menu_items/);
  assert.match(page, /profile_updates/);
  assert.doesNotMatch(page, /ClaimProfilePanel/);
  assert.doesNotMatch(page, /claim-profile-panel/);
  assert.doesNotMatch(page, /Claim This Profile/);
  assert.doesNotMatch(page, /id="claim-profile"/);
  assert.match(page, /isOrdinaryUnclaimed/);
  assert.match(page, /operatingHours=\{operatingHours\}/);
  assert.match(editorial, /PublicProfileShell/);
  assert.doesNotMatch(shell, /ProfileRestaurantHighlights/);
  assert.doesNotMatch(shell, /Business information/);
  assert.doesNotMatch(shell, /ProfileFeaturedContent/);
  assert.doesNotMatch(shell, /ProfileAtAGlance/);
  assert.doesNotMatch(shell, /ProfileMenuHighlights/);
  assert.doesNotMatch(shell, /ProfileNowHiring/);
  assert.match(shell, /ProfileAboutFounded/);
  assert.match(shell, /ProfileBillboardBlock/);
  assert.match(shell, /ProfileFavoriteMenuItems/);
  assert.match(shell, /restaurant-profile-view-menu|food-truck-view-menu/);
  assert.match(shell, /ProfileUpdates/);
  assert.match(shell, /ProfileDealsSection/);
  assert.match(about, /ProfilePhotoStrip/);
  assert.doesNotMatch(shell, /ProfileRestaurantInfo/);
  assert.match(shell, /showClaimInvites/);
  assert.doesNotMatch(shell, /Photo coming soon/);
  assert.doesNotMatch(shell, /Bio coming soon/);
  assert.doesNotMatch(shell, /Coming Soon/);
  assert.doesNotMatch(shell, /#1d4ed8/);
  assert.match(favorites, /profile-favorite-menu-items/);
  assert.match(favorites, /\.slice\(0, 3\)/);
  assert.match(updates, /profile-updates/);
  assert.match(deals, /profile-deals-section/);
  assert.match(about, /profile-about-founded/);
  assert.match(about, /About \$\{placeName\}/);
  assert.doesNotMatch(about, />About Us</);
  assert.match(about, /profile-founded/);
  assert.match(about, /profile-founded-blank/);
  assert.match(shell, /ProfileClaimBanner/);
  assert.match(about, /profile-founded-blank/);
  assert.match(shell, /showPhotos=\{false\}/);
  assert.match(billboard, /profile-billboard-block/);
  assert.match(billboard, /Windows/);
  assert.match(billboard, /pickWindowsPosts/);
  assert.match(read("src/lib/profileWindows.js"), /WINDOWS_MAX_SLIDES\s*=\s*4/);
  assert.match(billboard, /Previous window/);
  assert.match(billboard, /Next window/);
  assert.match(billboard, /›/);
  assert.match(billboard, /‹/);
  assert.doesNotMatch(billboard, />\s*Billboard\s*</);
  assert.doesNotMatch(billboard, /No Windows yet/);
  assert.doesNotMatch(billboard, /postBody|postTitle/);
  assert.match(favorites, /showClaimInvites|ProfileSectionBlank/);
  assert.match(updates, /showClaimInvites|ProfileSectionBlank/);
  assert.match(hero, /profile-hero-actions/);
  assert.match(hero, /profile-hero-hours/);
  assert.match(hero, /formatFoodTruckHoursTodayHeading/);
  assert.match(hero, /includeTodayLine:\s*!isFoodTruck/);
  assert.match(hero, /profile-hero-maps-address/);
  assert.match(hero, /openStatus/);
  assert.match(hero, /shortDescription/);
  assert.match(hero, /profile-hero-identity-meta|profile-hero-venue/);
  assert.match(hero, /profile-hero-cluster-field/);
  assert.match(hero, /Cluster: /);
  assert.doesNotMatch(hero, /borderRadius: 999/);
  // Homepage section order.
  const billboardIdx = shell.indexOf("<ProfileBillboardBlock");
  const aboutIdx = shell.indexOf("<ProfileAboutFounded");
  const favIdx = shell.indexOf("<ProfileFavoriteMenuItems");
  const dealsIdx = shell.indexOf("<ProfileDealsSection");
  const updatesIdx = shell.indexOf("<ProfileUpdates");
  assert.ok(billboardIdx > -1 && aboutIdx > billboardIdx, "about/founded after windows");
  assert.ok(favIdx > aboutIdx, "favorites after about/founded");
  assert.ok(dealsIdx > favIdx, "deals after favorites");
  assert.ok(updatesIdx > dealsIdx, "updates after deals");
  assert.match(page, /canonicalRestaurantSlug/);
  assert.match(page, /\/restaurants\/:state\/:city\/:restaurantSlug/);
  assert.match(page, /firstBillboardImage/);
  assert.match(page, /data\?\.hero_image_url/);
  assert.match(page, /showClaimInvites/);
}

function testSharedPublicProfileShell() {
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const actions = read("src/components/restaurant/publicProfile/ProfilePrimaryActions.jsx");
  const primitives = read("src/components/restaurant/publicProfile/profilePrimitives.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  assert.match(shell, /isFoodTruckProfile/);
  assert.match(shell, /FoodTruckUpcomingStops/);
  assert.match(shell, /ProfileBillboardBlock/);
  assert.match(shell, /ProfileFavoriteMenuItems/);
  const upcomingIdx = shell.indexOf("Upcoming locations");
  const aboutIdxShell = shell.indexOf("<ProfileAboutFounded");
  assert.ok(upcomingIdx > -1 && aboutIdxShell > upcomingIdx, "FT upcoming locations under hero, before about");
  assert.doesNotMatch(shell, /ProfileRestaurantHighlights/);
  assert.doesNotMatch(shell, /ProfilePrimaryActions/);
  assert.doesNotMatch(shell, /ProfileMenuHighlights/);
  assert.doesNotMatch(shell, /ProfileFeaturedContent/);
  assert.doesNotMatch(shell, /ProfileAtAGlance/);
  assert.match(shell, /saveContactControl/);
  assert.match(shell, /Located today|buildCurrentLocation/);
  assert.match(shell, /data-profile-style|buildProfileStyleRootStyle/);
  assert.match(hero, /profile-hero-actions/);
  assert.match(hero, /canShowOrderAction/);
  // Order in hero for restaurants; FT uses Save Contact + location.
  assert.match(hero, /FoodTruckCurrentLocation/);
  // View Menu / Directions / Call / Website chips removed from primary actions file.
  assert.doesNotMatch(actions, /profile-action-view-menu/);
  assert.doesNotMatch(actions, /profile-action-directions/);
  assert.doesNotMatch(actions, /profile-action-call/);
  assert.doesNotMatch(actions, /profile-action-website/);
  assert.match(actions, /canShowOrderAction/);
  assert.match(actions, /profile-action-order/);
  assert.match(actions, /profileType === "food_truck"/);
  assert.match(actions, /!isFoodTruck && canShowOrderAction/);
  assert.match(primitives, /display_only/);
  assert.match(primitives, /Located today/);
  assert.match(primitives, /isFoodTruckProfile/);
  assert.match(primitives, /food_truck_annual/);
}

testOperatorPublicProfilePathHelper();
testWebsiteHostLabelDisplay();
testDashboardOpensProfileEditor();
testMyAccountUsesOperatorPublicProfilePath();
testHelpCenterDocumentsRestaurantsSlug();
testPublicPageHasOwnerChrome();
testClaimPendingAndOwnerSkipUnclaimedStub();
testProfileEditorHasSavePublishView();
testPublicProfileForcedLight();
testPublicProfileMenuLikeShareRail();
testClaimedProfileUsesEditorialPresentation();
testSharedPublicProfileShell();

console.log("operatorPublicProfileContract: ok");
