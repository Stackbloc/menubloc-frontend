/**
 * Plan 78 (Andre 2026-11-27): Restaurant Manager → Deals → Diner reports. Informational use only:
 * the owner extends, says Wrong info / Ended, or "Create my deal" (normal editor, then
 * made_own_deal with the new deal id). A report never creates a deal by itself.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("owner API helpers call the CK deal report routes", () => {
  const api = read("src/lib/ownerApi.js");
  for (const route of [
    "/api/owner/deal-reports/restaurants/${restaurantId}",
    "/api/owner/deal-reports/unlisted",
    "/api/owner/deal-reports/${reportId}/extend",
    "/api/owner/deal-reports/${reportId}/response",
    "/api/owner/deal-reports/${reportId}/link-restaurant",
    "/api/owner/deal-reports/${reportId}/link-dish",
  ]) assert.ok(api.includes(route), route);
});

test("panel shows Diner reports and links a deal made from a report", () => {
  const panel = read("src/pages/owner/OwnerRestaurantDealsPanel.jsx");
  assert.match(panel, /<OwnerDealReportsSection/);
  assert.match(panel, /respondOwnerDealReport\(fromReport\.deal_report_id, "made_own_deal", saved\.id\)/);
  assert.match(panel, /prefill=\{editing\.fromReport \? formFromDealReport\(editing\.fromReport\) : null\}/);
  const section = read("src/pages/owner/OwnerDealReportsSection.jsx");
  for (const label of ["Diner reports", "Extend", "Deal ended", "Wrong info", "Create my deal", "Link dish", "Link to this restaurant"]) {
    assert.ok(section.includes(label), label);
  }
  // Never creates or prices a deal itself.
  assert.doesNotMatch(section, /createOwnerDeal|publishOwnerDeal/);
});

test("typed restaurant names match loosely", async () => {
  // Pure helper copied from the section (no React in node:test).
  const looseName = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const section = read("src/pages/owner/OwnerDealReportsSection.jsx");
  assert.ok(section.includes('String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "")'));
  assert.ok(looseName("Joe's Pizza!").includes(looseName("joes pizza")));
});
