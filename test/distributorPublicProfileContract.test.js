/**
 * Public distributor profile route + API client contracts.
 * Includes claim CTA / verified badge surface (no fake Connect/offers).
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

  it("unclaimed profile shows company identity + claim invite; no fake offers", () => {
    const page = read("src/pages/DistributorPublicPage.jsx");
    assert.match(page, /has_website/);
    assert.match(page, /data-distributor-offer-slot/);
    assert.match(page, /show_claim_cta/);
    assert.match(page, /Unclaimed/);
    assert.match(page, />Claimed</);
    assert.match(page, /Claim Your Free Profile/);
    assert.match(
      page,
      /Menuply is a new platform dedicated to serving the restaurant industry/
    );
    assert.match(
      page,
      /Claim your free distributor profile to establish your presence on[\s\S]*Menuply/
    );
    assert.match(page, /Verified Distributor/);
    assert.doesNotMatch(page, /Not yet claimed/);
    assert.doesNotMatch(page, /Claim this Profile/);
    assert.doesNotMatch(page, /\$50 off/);
    assert.doesNotMatch(page, /Restaurants reporting/);
    assert.match(page, /Visit Website/);
    assert.match(page, /logoFallback/);
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
