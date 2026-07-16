/**
 * Operator Public Profile links must open /restaurants/{slug}, not legacy /restaurant-profile/:id.
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

function testDashboardUsesOperatorPublicProfilePath() {
  const src = read("src/pages/operator/OperatorDashboard.jsx");
  assert.match(src, /operatorPublicProfilePath/);
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

testOperatorPublicProfilePathHelper();
testDashboardUsesOperatorPublicProfilePath();
testMyAccountUsesOperatorPublicProfilePath();
testHelpCenterDocumentsRestaurantsSlug();
testPublicPageHasOwnerChrome();

console.log("operatorPublicProfileContract: ok");
