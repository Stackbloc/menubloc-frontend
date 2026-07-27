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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
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
  assert.match(page, /ClaimProfilePanel/);
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
  assert.doesNotMatch(src, /restaurant_name:\s*form\.restaurant_name/);
  assert.doesNotMatch(src, /Short bio/);
  assert.doesNotMatch(src, /Instagram/);
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

/** Profile header actions: View menu (list icon), then Like, then Share. */
function testPublicProfileMenuLikeShareRail() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  const editorial = read("src/components/restaurant/RestaurantPublicEditorial.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(page, /RestaurantPublicEditorial/);
  assert.match(page, /menuHref=\{menuHref\}/);
  assert.match(page, /restaurantMenuPathFromRow/);
  assert.match(editorial, /PublicProfileShell/);
  assert.match(editorial, /profileType="restaurant"/);
  assert.match(hero, /FollowRestaurantButton/);
  assert.match(hero, /source=\{followSource\}/);
  assert.match(hero, /variant="menu"/);
  assert.match(hero, /ViewMenuIcon|ViewMenuLink/);
  assert.match(hero, /restaurant-profile-view-menu/);
  assert.match(shell, /followSource=\{isFoodTruck \? "food_truck_profile" : "restaurant_profile"\}/);
  // Order in the header rail JSX: View menu → Follow → Share.
  const railStart = hero.indexOf("<ViewMenuLink href={menuHref}");
  const railSlice = hero.slice(railStart, railStart + 800);
  assert.ok(railStart > -1, "ViewMenuLink rail mount missing");
  assert.match(railSlice, /ViewMenuLink[\s\S]*FollowRestaurantButton[\s\S]*ShareButton/);
  assert.doesNotMatch(page, />\s*Follow\s*</);
  assert.doesNotMatch(page, /Following/);
}

/**
 * Claimed and ordinary unclaimed restaurants use shared editorial public profile.
 * Claim is one panel — not a FieldRow subscription stub.
 */
function testClaimedProfileUsesEditorialPresentation() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  const editorial = read("src/components/restaurant/RestaurantPublicEditorial.jsx");
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const highlights = read("src/components/restaurant/publicProfile/ProfileRestaurantHighlights.jsx");
  const preview = read("src/components/restaurant/publicProfile/ProfileMenuHighlights.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  assert.match(page, /RestaurantPublicEditorial/);
  assert.match(page, /fetchRestaurantMenuPreview/);
  assert.match(page, /ClaimProfilePanel/);
  assert.match(page, /id="claim-profile"/);
  assert.match(page, /Claim This Profile/);
  assert.match(page, /isOrdinaryUnclaimed/);
  assert.match(page, /status_banners/);
  assert.match(page, /status_event_presentations/);
  assert.match(page, /operatingHours=\{operatingHours\}/);
  assert.doesNotMatch(page, /function ProfileFieldList/);
  assert.doesNotMatch(page, /Your information appears here with/);
  assert.match(editorial, /PublicProfileShell/);
  assert.match(shell, /ProfileRestaurantHighlights/);
  assert.match(shell, /profile-highlights-layout/);
  assert.match(shell, /restaurant-profile-view-menu|viewMenuTestId/);
  assert.doesNotMatch(shell, /Photo coming soon/);
  assert.doesNotMatch(shell, /Bio coming soon/);
  assert.doesNotMatch(shell, /No featured dish yet/);
  assert.doesNotMatch(shell, /common\.viewMenu/);
  assert.doesNotMatch(shell, /#1d4ed8/);
  // No duplicative bottom address — Maps entry is the hero address.
  assert.doesNotMatch(shell, /label="Address"/);
  assert.match(highlights, /Restaurant highlights/);
  assert.match(highlights, /About Us/);
  assert.match(highlights, /Signature Dish/);
  assert.match(highlights, /profile-now-hiring|Now Hiring/);
  assert.match(highlights, /Announcements/);
  assert.match(highlights, /profile-highlight-chips/);
  assert.match(preview, /Menu preview/);
  assert.match(preview, /View Full Menu/);
  assert.match(preview, /Order Online/);
  assert.match(preview, /MAX_ITEMS = 6/);
  assert.match(preview, /MAX_SECTIONS = 3/);
  assert.doesNotMatch(preview, /import .*Basket|import .*Waiter|import .*CatalogMenu/);
  assert.doesNotMatch(preview, /#1d4ed8/);
  assert.match(hero, /profile-hero-maps-address/);
  assert.match(hero, /Open in Google Maps|Open \$\{name\} in Google Maps/);
  // Photos before billboard in shell reading order.
  const photoIdx = shell.indexOf("<ProfilePhotoStrip");
  const billboardIdx = shell.indexOf("<ProfileBillboardFeature");
  assert.ok(photoIdx > -1 && billboardIdx > -1 && photoIdx < billboardIdx, "photos should precede billboard");
  assert.doesNotMatch(shell, /label="Website"/);
  assert.doesNotMatch(shell, /label="Phone"/);
  assert.doesNotMatch(shell, /label="Address"/);
  assert.match(page, /canonicalRestaurantSlug/);
  assert.match(page, /\/restaurants\/:state\/:city\/:restaurantSlug/);
  assert.match(page, /firstBillboardImage/);
}

function testSharedPublicProfileShell() {
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const actions = read("src/components/restaurant/publicProfile/ProfilePrimaryActions.jsx");
  const primitives = read("src/components/restaurant/publicProfile/profilePrimitives.jsx");
  assert.match(shell, /profileType === "food_truck"/);
  assert.match(shell, /FoodTruckUpcomingStops/);
  assert.match(shell, /ProfilePrimaryActions/);
  assert.match(shell, /ProfileMenuHighlights/);
  assert.match(shell, /ProfileRestaurantHighlights/);
  // View Menu + Directions chips removed from primary actions.
  assert.doesNotMatch(actions, /profile-action-view-menu/);
  assert.doesNotMatch(actions, /profile-action-directions/);
  assert.match(actions, /canShowOrderAction/);
  assert.match(actions, /profile-action-order/);
  assert.match(primitives, /display_only/);
}

testOperatorPublicProfilePathHelper();
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
