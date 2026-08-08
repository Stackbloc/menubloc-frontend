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
    assert.match(app, /\/distributor\/profile/);
  });

  it("api helper uses shared apiGet / Railway fallback path", () => {
    const api = read("src/lib/api.js");
    assert.match(api, /fetchPublicDistributor/);
    assert.match(api, /\/public\/distributors\//);
    assert.match(api, /DEFAULT_PROD_API_BASE/);
  });

  it("page omits empty sections, claim CTA, verified badge; no fake offers/metrics", () => {
    const page = read("src/pages/DistributorPublicPage.jsx");
    assert.match(page, /has_website/);
    assert.match(page, /has_description/);
    assert.match(page, /data-distributor-offer-slot/);
    assert.match(page, /show_claim_cta/);
    assert.match(page, /Claim this Profile/);
    assert.match(page, /Not yet claimed/);
    assert.match(page, /Verified Distributor/);
    assert.doesNotMatch(page, /\$50 off/);
    assert.doesNotMatch(page, /Restaurants reporting/);
    assert.match(page, /Visit Website/);
  });

  it("claim page uses operator auth + email verification", () => {
    const page = read("src/pages/DistributorClaimPage.jsx");
    assert.match(page, /createDistributorProfileClaim/);
    assert.match(page, /isEmailVerified/);
    assert.match(page, /nextPath/);
    assert.match(page, /\/operator\/login/);
  });

  it("operatorApi exposes claim endpoints", () => {
    const api = read("src/lib/operatorApi.js");
    assert.match(api, /createDistributorProfileClaim/);
    assert.match(api, /\/operator\/distributor-profile-claims/);
  });
});
