/**
 * Owner diner accounts roster contract.
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
  it("ownerApi fetches diner accounts through ownerApi get helper", () => {
    const api = read("src/lib/ownerApi.js");
    assert.match(api, /export const getOwnerDinerAccounts/);
    assert.match(api, /\/api\/owner\/dashboard\/diners/);
    assert.match(api, /getOwnerDinerAccounts[\s\S]*return get\(`\/api\/owner\/dashboard\/diners/);
  });

  it("OwnerDiners shows total diner count and opened/closed with time of day", () => {
    const page = read("src/pages/owner/OwnerDiners.jsx");
    assert.match(page, /getOwnerDinerAccounts/);
    assert.match(page, /Total diners/);
    assert.match(page, /Account opened/);
    assert.match(page, /Referral source/);
    assert.match(page, /referral_source_label/);
    assert.match(page, /Account closed/);
    assert.match(page, /Geographic market/);
    assert.match(page, /formatDateTime/);
    assert.match(page, /hour:\s*"numeric"/);
    assert.match(page, /minute:\s*"2-digit"/);
    assert.match(page, /ids 2, 3, 4, 29/);
    assert.match(page, /data-testid="diner-accounts-table"/);
    assert.doesNotMatch(
      page,
      /wrapKeys/,
      "wrapKeys puts leftover diner columns on 88px metric cells and overlapping headers"
    );
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
