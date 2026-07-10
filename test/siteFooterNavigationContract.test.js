/**
 * Public SiteFooter navigation — canonical marketplace links (2026-07-09 d333af2).
 * Diners / Restaurants (onboarding) / Creators; no restaurant auth links in footer row.
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
  assert.match(src, /<Link to="\/creative-pros"/);
  assert.doesNotMatch(src, /<Link to="\/operator\/login"/);
  assert.doesNotMatch(src, /discovery\.footer\.signup/);
  assert.doesNotMatch(src, /discovery\.footer\.signin/);
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

function testOperatorLoginUsesBrandedShell() {
  const src = read("src/pages/operator/OperatorLogin.jsx");
  assert.match(src, /PageShell/);
  assert.match(src, /BrandLogo/);
  assert.match(src, /restaurants\.landing\.signIn/);
}

testFooterMarketplaceLinks();
testRestaurantsRouteUsesLandingPage();
testOperatorLoginUsesBrandedShell();

console.log("✅ siteFooterNavigationContract tests passed");
