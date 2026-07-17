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
  assert.match(chrome, /publishProfile/);
  assert.match(chrome, /updateProfile/);
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
}

testOperatorPublicProfilePathHelper();
testDashboardOpensProfileEditor();
testMyAccountUsesOperatorPublicProfilePath();
testHelpCenterDocumentsRestaurantsSlug();
testPublicPageHasOwnerChrome();
testClaimPendingAndOwnerSkipUnclaimedStub();
testProfileEditorHasSavePublishView();

console.log("operatorPublicProfileContract: ok");
