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
  it("routes /distributors index and join before :slug; claim path; portal stays /distributor", () => {
    const app = read("src/App.jsx");
    assert.match(app, /DistributorsDirectoryPage/);
    assert.match(app, /DistributorJoinPage/);
    assert.match(app, /path="\/distributors"/);
    assert.match(app, /path="\/distributors\/join"/);
    assert.match(app, /\/distributors\/:slug\/claim/);
    assert.match(app, /\/distributors\/:slug/);
    assert.match(app, /DistributorPublicPage/);
    assert.match(app, /DistributorClaimPage/);
    assert.match(app, /DistributorProfileEditPage/);
    assert.match(app, /\/distributor\/login/);
    assert.match(app, /\/distributor\/account\/signup/);
    assert.match(app, /\/distributor\/account\/login/);
    assert.match(app, /\/distributor\/profile/);
    const indexIdx = app.indexOf('path="/distributors"');
    const joinIdx = app.indexOf('path="/distributors/join"');
    const slugIdx = app.indexOf('path="/distributors/:slug"');
    assert.ok(indexIdx >= 0 && joinIdx >= 0 && slugIdx >= 0);
    assert.ok(indexIdx < joinIdx && joinIdx < slugIdx, "directory/join must precede :slug");
  });

  it("api helper uses shared apiGet / Railway fallback path", () => {
    const api = read("src/lib/api.js");
    assert.match(api, /fetchPublicDistributors/);
    assert.match(api, /fetchPublicDistributor/);
    assert.match(api, /registerPublicDistributor/);
    assert.match(api, /submitPublicDistributorClaim/);
    assert.match(api, /\/public\/distributors/);
    assert.match(api, /DEFAULT_PROD_API_BASE/);
  });

  it("directory page has ecosystem intro CTA and no claim-status badges", () => {
    const page = read("src/pages/DistributorsDirectoryPage.jsx");
    assert.match(page, /fetchPublicDistributors/);
    assert.match(page, /Join the Menuply Foodservice Ecosystem/);
    assert.match(page, /Create your free distributor profile today/);
    assert.match(page, /\/distributors\/join/);
    assert.match(page, /View profile/);
    assert.doesNotMatch(page, /claimBadge|Unclaimed|Claim Pending/);
    assert.match(page, /StickyPageHeader/);
    assert.match(page, /BottomNav/);
  });

  it("join page collects company info + primary Menuply contact", () => {
    const page = read("src/pages/DistributorJoinPage.jsx");
    assert.match(page, /registerPublicDistributor/);
    assert.match(page, /Your Menuply Contact/);
    assert.match(page, /Who should be the primary contact person for Menuply/);
    assert.match(page, /Add Another Menuply Contact/);
    assert.match(page, /menuply_contacts/);
    assert.match(page, /geographic_markets/);
    assert.match(page, /product_categories/);
    assert.match(page, /Company email/);
    assert.match(page, /Founded \(year\)/);
  });

  it("distributorApi exposes profile-updates and Menuply contact helpers", () => {
    const api = read("src/lib/distributorApi.js");
    assert.match(api, /listDistributorProfileUpdates/);
    assert.match(api, /createDistributorProfileUpdate/);
    assert.match(api, /deleteDistributorProfileUpdate/);
    assert.match(api, /\/distributor\/profile-updates/);
    assert.match(api, /listDistributorMenuplyContacts/);
    assert.match(api, /createDistributorMenuplyContact/);
    assert.match(api, /\/distributor\/menuply-contacts/);
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
    assert.doesNotMatch(page, /statusBadgeStyle|label: "Unclaimed"/);
    assert.match(page, /distributor-markets-categories/);
    assert.match(
      page,
      /Menuply is a new platform dedicated to serving the restaurant industry/
    );
    assert.match(page, /data-distributor-offer-slot/);
    assert.doesNotMatch(page, /menuply_contacts|Menuply Contact/);
    assert.doesNotMatch(page, /Company information/);
    assert.doesNotMatch(page, /Favorite Menu Items/);
    assert.doesNotMatch(page, /ProfileDealsSection/);
    assert.doesNotMatch(page, /ProfilePhotoStrip/);
    assert.doesNotMatch(page, /Visit Website/);
    assert.doesNotMatch(page, /\$50 off/);
    assert.doesNotMatch(page, /Restaurants reporting/);
  });

  it("profile editor can post Updates and manage Menuply contacts", () => {
    const page = read("src/pages/distributor/DistributorProfileEditPage.jsx");
    assert.match(page, /createDistributorProfileUpdate/);
    assert.match(page, /Publish update/);
    assert.match(page, /founded_year/);
    assert.match(page, /About Us/);
    assert.match(page, /Your Menuply Contact/);
    assert.match(page, /listDistributorMenuplyContacts/);
    assert.match(page, /geographic_markets/);
    assert.match(page, /product_categories/);
  });

  it("claim page is public-first with Menuply contact + distributor account CTAs", () => {
    const page = read("src/pages/DistributorClaimPage.jsx");
    assert.match(page, /submitPublicDistributorClaim/);
    assert.match(page, /no auth required/i);
    assert.match(page, /Your Menuply Contact/);
    assert.match(page, /menuply_contacts/);
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
