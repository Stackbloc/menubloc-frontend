/**
 * Public SiteFooter navigation — canonical marketplace links (2026-07-09 d333af2).
 * Diners / Restaurants (onboarding) / Clusters; Creators + Distributors routes kept for
 * invite/direct access — no public footer entry for Distributors.
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
  assert.match(src, /<Link to="\/restaurant\/onboarding"/);
  assert.match(src, /<Link to="\/clusters"/);
  assert.match(src, />Discover</);
  assert.match(src, />Diners</);
  assert.match(src, />For Businesses</);
  assert.match(src, />Menuply</);
  assert.match(src, /<Link to="\/my-menuply"/);
  assert.match(src, /<Link to="\/activity"/);
  assert.match(src, /<Link to="\/account\/dining-crews"/);
  assert.match(src, /<Link to="\/account\/what-we-doing"/);
  assert.match(src, /<Link to="\/waiter"/);
  assert.match(src, /<Link to="\/browse-menus"/);
  assert.match(src, /What People Are Eating/);
  assert.doesNotMatch(src, /<Link to="\/distributors"/);
  assert.doesNotMatch(src, /<Link to="\/creative-pros"/);
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
    "expected /distributors to remain routed for invite-only direct links"
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
