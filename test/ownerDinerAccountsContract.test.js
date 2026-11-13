/**
 * Owner diner accounts roster + capability stats + diner profile page contract (Diner Intelligence Stage 1).
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

describe("owner diner accounts panel", () => {
  it("ownerApi fetches diner accounts, stats, and detail through ownerApi get helper", () => {
    const api = read("src/lib/ownerApi.js");
    assert.match(api, /export const getOwnerDinerAccounts/);
    assert.match(api, /export const getOwnerDinerCapabilityStats/);
    assert.match(api, /export const getOwnerDinerDetail/);
    assert.match(api, /\/api\/owner\/dashboard\/diners\/stats/);
    assert.match(api, /\/api\/owner\/dashboard\/diners\/\$\{encodeURIComponent/);
  });

  it("OwnerDiners shows status-aware metrics, interval chips, and a server-paged roster", () => {
    const page = read("src/pages/owner/OwnerDiners.jsx");
    assert.match(page, /getOwnerDinerCapabilityStats/);
    assert.match(page, /getOwnerDinerAccounts\(\{ page, page_size: PAGE_SIZE, q:/);
    assert.doesNotMatch(page, /limit: 2000/);
    assert.doesNotMatch(page, /OwnerDinerHubDialog/);
    assert.match(page, /displayDinerMetric/);
    assert.match(page, /diner-capability-metrics/);
    assert.match(page, /diner-stats-interval-\$\{key\}/);
    assert.match(page, /onRowClick/);
    assert.match(page, /dinerProfilePath/);
    assert.match(page, /diner-accounts-pager/);
    assert.match(page, /Total diners/);
    assert.match(page, /Account opened/);
    assert.match(page, /Referral source/);
    assert.match(page, /Los Angeles days/);
    assert.match(page, /seeded test diners are left out/);
  });

  it("OwnerDinerProfile is a real page at /owner/diners/:dinerId", () => {
    const profile = read("src/pages/owner/OwnerDinerProfile.jsx");
    const app = read("src/App.jsx");
    assert.match(profile, /getOwnerDinerDetail/);
    assert.match(profile, /useParams/);
    assert.match(profile, /owner-diner-profile/);
    assert.match(profile, /diner-profile-back/);
    // Stage 4: the numbers (period vs lifetime, custom range) come from DinerIntelligencePanel.
    assert.match(profile, /<DinerIntelligencePanel/);
    const panel = read("src/pages/owner/diners/DinerIntelligencePanel.jsx");
    assert.match(panel, /getOwnerDinerIntelligence/);
    assert.match(panel, /metricCell/);
    assert.match(app, /path="\/owner\/diners\/:dinerId"[^\n]*<OwnerRoute><OwnerDinerProfile \/><\/OwnerRoute>/);
  });

  it("owner nav and dashboard link to /owner/diners", () => {
    const layout = read("src/pages/owner/OwnerLayout.jsx");
    const dash = read("src/pages/owner/OwnerDashboard.jsx");
    const app = read("src/App.jsx");
    assert.match(layout, /to: "\/owner\/diners"/);
    assert.match(dash, /to="\/owner\/diners"/);
    assert.match(dash, /View all diner accounts/);
    assert.match(app, /path="\/owner\/diners"/);
    assert.match(app, /OwnerDiners/);
  });
});
