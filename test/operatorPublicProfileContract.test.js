/**
 * Operator Public Profile:
 * - Dashboard Quick Access → /operator/profile (edit: Save draft / Publish / View)
 * - My Account "View Public Profile" → /restaurants/{slug}, not legacy /restaurant-profile/:id
 * - claim_pending + owning operator must not hit UnclaimedRestaurantPage claim CTA
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
  assert.match(src, /navigate\("\/operator\/profile"\)/);
  assert.doesNotMatch(src, /operatorPublicProfilePath/);
  assert.doesNotMatch(src, /\/restaurant-profile\/\$\{/);
  assert.doesNotMatch(src, /`\/restaurant-profile\//);
}

function testMyAccountUsesOperatorPublicProfilePath() {
  const src = read("src/pages/operator/OperatorMyAccount.jsx");
  assert.match(src, /operatorPublicProfilePath/);
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
  // Public page is view-only for owners — Edit links to /operator/profile (no duplicate form).
  assert.match(chrome, /\/operator\/profile/);
  assert.doesNotMatch(chrome, /publishProfile/);
  assert.doesNotMatch(chrome, /updateProfile/);
  assert.doesNotMatch(chrome, /RestaurantStatusSettingsPanel/);
}

function testClaimPendingAndOwnerSkipUnclaimedStub() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /status === "claimed" \|\| status === "claim_pending"/);
  assert.match(page, /!isClaimedRestaurant\(data\) && !isOwner/);
}

function testProfileEditorHasSavePublishView() {
  const src = read("src/pages/operator/OperatorProfileEditor.jsx");
  assert.match(src, /Save draft/);
  assert.match(src, /Publish changes/);
  assert.match(src, /Preview Public Profile|View Public Profile/);
  assert.match(src, /Website/);
  assert.match(src, /website_url/);
  assert.match(src, /publicData\.restaurant \|\| publicData/);
  assert.match(src, /publicRestaurant\.name \|\| publicRestaurant\.restaurant_name/);
  assert.match(src, /RestaurantStatusSettingsPanel/);
  assert.match(src, /readOnly/);
  assert.match(src, /Protected listing identity/);
  assert.doesNotMatch(src, /restaurant_name:\s*form\.restaurant_name/);
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
  // Claimed + unclaimed both use solid white pageBg (two occurrences).
  const whitePageBgMatches = page.match(/pageBg = isDark \? "#0b0b0f" : "#ffffff"/g) || [];
  assert.equal(whitePageBgMatches.length, 2);
}

/** Profile header actions match menu: Like (thumb) then Share. */
function testPublicProfileMenuLikeShareRail() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /FollowRestaurantButton/);
  assert.match(page, /MENU_ROW_ICON_SIZE/);
  assert.match(page, /MENU_ROW_HEADER_ICON_GAP/);
  assert.match(page, /source="restaurant_profile"/);
  assert.match(page, /variant="menu"/);
  assert.doesNotMatch(page, />\s*Follow\s*</);
  assert.doesNotMatch(page, /Following/);
}

/**
 * Claimed profile keeps claim-screen FieldRow SEO body (same labels/URL surface)
 * without the Claim This Profile CTA. Status banners remain mounted.
 */
function testClaimedProfileSharesFieldListSeoWithoutClaimCta() {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /function ProfileFieldList/);
  assert.match(page, /Restaurant Name/);
  assert.match(page, /City \/ Region \/ Postal Code/);
  assert.match(page, /Story \/ About/);
  assert.match(page, /Featured Dish/);
  assert.match(page, /Landmarks \/ Nearby/);
  assert.match(page, /Brand Presentation/);
  assert.match(page, /RestaurantStatusBannerStrip/);
  assert.match(page, /status_banners/);
  assert.match(page, /status_event_presentations/);
  // Claim CTA only on unclaimed stub (id=claim-profile), not claimed path copy.
  assert.match(page, /id="claim-profile"/);
  assert.match(page, /Claim This Profile/);
  assert.match(page, /!isClaimedRestaurant\(data\) && !isOwner/);
  // Claimed empty fields use em dash, not subscription upsell placeholders.
  assert.match(page, /verifiedEmpty="—"/);
  assert.match(page, /proEmpty="—"/);
  // Canonical 3-segment route params preserved for SEO URLs.
  assert.match(page, /canonicalRestaurantSlug/);
  assert.match(page, /\/restaurants\/:state\/:city\/:restaurantSlug/);
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
testClaimedProfileSharesFieldListSeoWithoutClaimCta();

console.log("operatorPublicProfileContract: ok");
