/**
 * Public distributor profile route + API client contracts.
 * Restaurant-like layout: identity block, claim invite, About/Founded, Updates.
 * No photos / deals / favorite menu items. No fake Connect/offers.
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

describe("distributor public profile contracts", () => {
  it("routes /distributors/:slug and claim path; portal stays /distributor", () => {
    const app = read("src/App.jsx");
    assert.match(app, /\/distributors\/:slug\/claim/);
    assert.match(app, /\/distributors\/:slug/);
    assert.match(app, /DistributorPublicPage/);
    assert.match(app, /DistributorClaimPage/);
    assert.match(app, /DistributorProfileEditPage/);
    assert.match(app, /\/distributor\/login/);
    assert.match(app, /\/distributor\/account\/signup/);
    assert.match(app, /\/distributor\/account\/login/);
    assert.match(app, /\/distributor\/profile/);
  });

  it("api helper uses shared apiGet / Railway fallback path", () => {
    const api = read("src/lib/api.js");
    assert.match(api, /fetchPublicDistributor/);
    assert.match(api, /submitPublicDistributorClaim/);
    assert.match(api, /\/public\/distributors\//);
    assert.match(api, /DEFAULT_PROD_API_BASE/);
  });

  it("distributorApi exposes profile-updates write helpers", () => {
    const api = read("src/lib/distributorApi.js");
    assert.match(api, /listDistributorProfileUpdates/);
    assert.match(api, /createDistributorProfileUpdate/);
    assert.match(api, /deleteDistributorProfileUpdate/);
    assert.match(api, /\/distributor\/profile-updates/);
  });

  it("unclaimed profile mirrors restaurant shell; identity not repeated later", () => {
    const page = read("src/pages/DistributorPublicPage.jsx");
    assert.match(page, /Food Distributor/);
    assert.match(page, /distributor-identity-block/);
    assert.match(page, /profile-hero-contact/);
    assert.match(page, /ProfileAboutFounded/);
    assert.match(page, /showPhotos=\{false\}/);
    assert.match(page, /ProfileUpdates/);
    assert.match(page, /show_claim_cta/);
    assert.match(page, /Is this your company\?/);
    assert.match(page, /Claim this Profile/);
    assert.match(page, /label: "Unclaimed"/);
    assert.match(page, /label: "Claim Pending"/);
    assert.match(page, /label: "Claimed"/);
    assert.match(page, /label: "Verified"/);
    assert.match(
      page,
      /Menuply is a new platform dedicated to serving the restaurant industry/
    );
    assert.match(page, /data-distributor-offer-slot/);
    assert.doesNotMatch(page, /Company information/);
    assert.doesNotMatch(page, /Favorite Menu Items/);
    assert.doesNotMatch(page, /ProfileDealsSection/);
    assert.doesNotMatch(page, /ProfilePhotoStrip/);
    assert.doesNotMatch(page, /Visit Website/);
    assert.doesNotMatch(page, /\$50 off/);
    assert.doesNotMatch(page, /Restaurants reporting/);
  });

  it("profile editor can post Updates", () => {
    const page = read("src/pages/distributor/DistributorProfileEditPage.jsx");
    assert.match(page, /createDistributorProfileUpdate/);
    assert.match(page, /Publish update/);
    assert.match(page, /founded_year/);
    assert.match(page, /About Us/);
  });

  it("claim page is public-first with distributor account CTAs", () => {
    const page = read("src/pages/DistributorClaimPage.jsx");
    assert.match(page, /submitPublicDistributorClaim/);
    assert.match(page, /no auth required/i);
    assert.match(page, /\/distributor\/account\/signup/);
    assert.match(page, /\/distributor\/account\/login/);
    assert.doesNotMatch(page, /\/operator\/login/);
    assert.match(page, /Create distributor account/);
  });

  it("distributor account screens reuse restaurant email verification path", () => {
    const signup = read("src/pages/distributor/DistributorAccountSignup.jsx");
    assert.match(signup, /Create distributor account/);
    assert.match(signup, /\/operator\/verify-email/);
    assert.match(signup, /useOperator/);
    const login = read("src/pages/distributor/DistributorAccountLogin.jsx");
    assert.match(login, /Distributor sign in/);
    assert.match(login, /\/operator\/verify-email/);
  });

  it("operatorApi exposes claim attach endpoint", () => {
    const api = read("src/lib/operatorApi.js");
    assert.match(api, /attachDistributorProfileClaim/);
    assert.match(api, /\/operator\/distributor-profile-claims/);
  });
});
