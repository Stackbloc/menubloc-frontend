/**
 * Public SiteFooter navigation.
 * Discover column removed (2026-08-24) — Search/Restaurants/Menus/Dishes/Deals/Clusters/Events/Waiter.
 * Diners / For Businesses (Restaurants onboarding) / Menuply remain.
 * Food Distributors is the last For Businesses link (`/distributors`).
 * no restaurant auth links in footer row.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testFooterMarketplaceLinks() {
  const src = read("src/components/SiteFooter.jsx");
  assert.match(src, /<Link to="\/diner\/signup"/);
  assert.match(src, />Sign Up</);
  assert.match(src, /<Link to="\/clusters"[^>]*>Clusters<\/Link>/);
  const diners = src.slice(src.indexOf(">Diners</"), src.indexOf("For Businesses"));
  assert.ok(diners.includes('<Link to="/diner/signup"'), "expected Sign Up under Diners");
  assert.ok(diners.includes('<Link to="/clusters"'), "expected Clusters under Diners");
  assert.doesNotMatch(src, />Discover</);
  assert.doesNotMatch(src, /<Link to="\/waiter"/);
  assert.doesNotMatch(src, /<Link to="\/browse-menus"/);
  assert.doesNotMatch(src, /<Link to="\/deals"/);
  assert.doesNotMatch(src, /<Link to="\/events"/);
  assert.doesNotMatch(src, /to="\/restaurants"/);
  assert.match(src, />Diners</);
  assert.match(src, />For Businesses</);
  assert.match(src, />Menuply</);
  assert.doesNotMatch(src, /<Link to="\/my-menuply"/);
  assert.doesNotMatch(src, /<Link to="\/activity"/);
  assert.doesNotMatch(src, /<Link to="\/account\/dining-crews"/);
  assert.doesNotMatch(src, /<Link to="\/account\/what-we-doing"/);
  assert.doesNotMatch(src, /What People Are Eating/);
  assert.match(src, /restaurant\/onboarding"/);
  assert.match(src, /discovery\.footer\.creators/);
  assert.match(src, /<Link to="\/distributors"/);
  assert.match(src, /discovery\.footer\.foodDistributors/);
  assert.doesNotMatch(src, /Owner tools/);
  const businesses = src.slice(src.indexOf("For Businesses"), src.indexOf(">Menuply<"));
  assert.ok(
    businesses.includes('<Link to="/restaurant/onboarding"'),
    "expected For Businesses Restaurants (onboarding) to remain"
  );
  assert.ok(
    businesses.lastIndexOf('<Link to="/distributors"') > businesses.lastIndexOf('<Link to="/creative-pros"'),
    "expected Food Distributors to be the last For Businesses link"
  );
  assert.doesNotMatch(src, /<Link to="\/operator\/login"/);
  assert.doesNotMatch(src, /discovery\.footer\.signup/);
  assert.doesNotMatch(src, /discovery\.footer\.signin/);
  // Site Footer Protection Contract: never hide whole footer on home without confirmation.
  assert.match(src, /FOOTER_HIDDEN_PATHS = new Set\(\["\/checkout"\]\)/);
  assert.doesNotMatch(src, /FOOTER_HIDDEN_PATHS[\s\S]{0,120}"\/"/);
  assert.doesNotMatch(src, /FOOTER_HIDDEN_PATHS[\s\S]{0,120}"\/home-next"/);
}

function testSiteFooterRemainsMountedOnPublicApp() {
  const src = read("src/App.jsx");
  assert.match(
    src,
    /\{hidePublicChrome \? null : <SiteFooter \/>\}/,
    "expected SiteFooter to remain mounted for public chrome"
  );
}

function testDistributorsPathRemainsRouted() {
  const src = read("src/App.jsx");
  assert.match(
    src,
    /path="\/distributors"/,
    "expected /distributors to remain routed for the public Food Distributors footer link"
  );
}

function testCreatorsPathRemainsRouted() {
  const src = read("src/App.jsx");
  assert.match(
    src,
    /path="\/creative-pros"/,
    "expected /creative-pros to remain routed for indexing"
  );
}

function testRestaurantsRouteUsesLandingPage() {
  const src = read("src/App.jsx");
  assert.ok(
    src.includes('path="/restaurants" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantsLandingPage />}'),
    "expected /restaurants hub route to use RestaurantsLandingPage"
  );
  assert.ok(
    !src.includes('path="/restaurants" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorLogin />}'),
    "expected /restaurants not to route to OperatorLogin"
  );
}

function testOperatorLoginUsesAuthPageFrame() {
  const src = read("src/pages/operator/OperatorLogin.jsx");
  assert.match(src, /AuthPageFrame/);
  assert.match(src, /styles\.submitButton/);
  assert.match(src, /auth\.operatorSignInTitle/);
  assert.doesNotMatch(src, /background:\s*"#1d4ed8"/);
  assert.doesNotMatch(src, /PageShell/);
}

testFooterMarketplaceLinks();
testSiteFooterRemainsMountedOnPublicApp();
testDistributorsPathRemainsRouted();
testCreatorsPathRemainsRouted();
testRestaurantsRouteUsesLandingPage();
testOperatorLoginUsesAuthPageFrame();

console.log("✅ siteFooterNavigationContract tests passed");
