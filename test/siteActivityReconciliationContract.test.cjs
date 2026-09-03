"use strict";

/**
 * FE contract: Site Activity shows Unique + Unattributed and documents city attribution.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const siteActivityPath = path.join(
  __dirname,
  "../src/pages/owner/intelligence/IntelligenceSiteActivity.jsx"
);
const dashboardPath = path.join(__dirname, "../src/pages/owner/OwnerDashboard.jsx");

test("Site Activity UI exposes Unique visitors and Unattributed cards", () => {
  const src = fs.readFileSync(siteActivityPath, "utf8");
  assert.match(src, /unique_visitors/);
  assert.match(src, /unattributed_visitors/);
  assert.match(src, /Unattributed/);
  assert.match(src, /does not sum to Unique visitors/);
  assert.match(src, /CityVisitorInsightPanel/);
});

test("Owner dashboard markets copy mentions Unattributed", () => {
  const src = fs.readFileSync(dashboardPath, "utf8");
  assert.match(src, /Unattributed/);
  assert.match(src, /unique_visitors/);
});
