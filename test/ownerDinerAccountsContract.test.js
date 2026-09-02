/**
 * Owner diner accounts roster + capability stats + hub dialog contract.
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

  it("OwnerDiners shows capability metrics, interval chips, and clickable roster", () => {
    const page = read("src/pages/owner/OwnerDiners.jsx");
    assert.match(page, /getOwnerDinerCapabilityStats/);
    assert.match(page, /getOwnerDinerAccounts/);
    assert.match(page, /OwnerDinerHubDialog/);
    assert.match(page, /diner-capability-metrics/);
    assert.match(page, /diner-stats-interval-\$\{key\}/);
    assert.match(page, /\["today", "Today"\]/);
    assert.match(page, /useState\("today"\)/);
    assert.match(page, /\["30d", "Month"\]/);
    assert.match(page, /\["365d", "Year"\]/);
    assert.match(page, /onRowClick/);
    assert.match(page, /My Menuply snapshot/);
    assert.match(page, /Total diners/);
    assert.match(page, /Account opened/);
    assert.match(page, /Referral source/);
    assert.match(page, /formatDateTime/);
    assert.match(page, /ids 2, 3, 4, 29/);
    assert.match(page, /QR scans are not logged/);
  });

  it("OwnerDinerHubDialog loads diner detail and supports close", () => {
    const dialog = read("src/pages/owner/OwnerDinerHubDialog.jsx");
    assert.match(dialog, /getOwnerDinerDetail/);
    assert.match(dialog, /owner-diner-hub-dialog/);
    assert.match(dialog, /owner-diner-hub-dialog-close/);
    assert.match(dialog, /My Menuply snapshot/);
    assert.match(dialog, /diner-hub-summary-grid/);
    assert.match(dialog, /Escape/);
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
