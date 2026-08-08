/**
 * Distributor Network portal + Restaurant Intelligence V1 contracts.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("distributor network portal contracts", () => {
  it("App mounts distributor routes and provider", () => {
    const app = read("src/App.jsx");
    assert.match(app, /DistributorProvider/);
    assert.match(app, /\/distributor\/login/);
    assert.match(app, /\/distributor\/restaurants/);
    assert.match(app, /\/distributor\/search/);
    assert.match(app, /\/distributor\/messages/);
    assert.match(app, /\/operator\/distributor-relationships/);
    assert.match(app, /DistributorRoute/);
  });

  it("V1 nav is Profile + Restaurants only", () => {
    const layout = read("src/pages/distributor/DistributorLayout.jsx");
    assert.match(layout, /label: "Profile"/);
    assert.match(layout, /label: "Restaurants"/);
    assert.match(layout, /\/distributor\/restaurants/);
    assert.doesNotMatch(layout, /label: "Messages"/);
    assert.doesNotMatch(layout, /label: "Connected"/);
    assert.doesNotMatch(layout, /Pending requests/);
  });

  it("dashboard shows reported count only when reported_usage_visible", () => {
    const dash = read("src/pages/distributor/DistributorDashboard.jsx");
    assert.match(dash, /reported_usage_visible/);
    assert.match(dash, /Menuply restaurants report/);
    assert.match(dash, /Your Profile/);
    assert.match(dash, /Restaurants/);
    assert.doesNotMatch(dash, /Unread messages/);
  });

  it("restaurants hub gates reported filter and omits Connect CTAs", () => {
    const search = read("src/pages/distributor/DistributorSearchPage.jsx");
    assert.match(search, /reported_usage_visible/);
    assert.match(search, /reported_distributor_slug/);
    assert.match(search, /Reported distributor/);
    assert.doesNotMatch(search, /requestRestaurantConnection/);
    assert.doesNotMatch(search, /Request connection/);
  });

  it("restaurant detail has public links and gated reported distributors", () => {
    const detail = read("src/pages/distributor/DistributorRestaurantProfile.jsx");
    assert.match(detail, /View Menu/);
    assert.match(detail, /View Restaurant/);
    assert.match(detail, /Reported distributors/);
    assert.match(detail, /reported_usage_visible/);
    assert.doesNotMatch(detail, /requestRestaurantConnection/);
    assert.doesNotMatch(detail, /Request connection/);
    assert.doesNotMatch(detail, />\s*Message\s*</);
  });

  it("profile editor keeps company name locked", () => {
    const profile = read("src/pages/distributor/DistributorProfileEditPage.jsx");
    assert.match(profile, /Company name \(locked\)/);
    assert.match(profile, /display_name/);
    assert.doesNotMatch(profile, /setField\("display_name"/);
  });

  it("DistributorLogin uses AuthPageFrame (not OperatorLogin)", () => {
    const login = read("src/pages/distributor/DistributorLogin.jsx");
    assert.match(login, /AuthPageFrame/);
    assert.match(login, /Distributor sign in/);
    assert.doesNotMatch(login, /OperatorLogin/);
  });

  it("distributorApi uses Railway fallback and distributor search path", () => {
    const api = read("src/lib/distributorApi.js");
    assert.match(api, /DEFAULT_PROD_API_BASE/);
    assert.match(api, /menubloc-backend-production\.up\.railway\.app/);
    assert.match(api, /\/distributor\/auth\/login/);
    assert.match(api, /\/distributor\/restaurants\/search/);
    assert.match(api, /\/distributor\/catalog\/distributors/);
    assert.doesNotMatch(api, /fetch\("\/search/);
  });

  it("operator relationships API + nav + page wiring", () => {
    const opApi = read("src/lib/operatorApi.js");
    assert.match(opApi, /distributor-relationships/);
    assert.match(opApi, /acceptDistributorRelationship/);

    const layout = read("src/pages/operator/OperatorLayout.jsx");
    assert.match(layout, /distributor-relationships/);
    assert.match(layout, /Distributor Relationships/);

    const opPage = read("src/pages/operator/OperatorDistributorRelationships.jsx");
    assert.match(opPage, /wants to connect/);
    assert.match(opPage, /acceptDistributorRelationship/);
  });

  it("OperatorLogin AuthPageFrame unchanged by this feature", () => {
    const operatorLogin = read("src/pages/operator/OperatorLogin.jsx");
    assert.match(operatorLogin, /AuthPageFrame/);
  });
});
