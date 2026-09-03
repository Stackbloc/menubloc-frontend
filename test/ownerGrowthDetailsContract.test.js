/**
 * Owner Growth & conversion clickable detail contract.
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

describe("owner growth detail drilldowns", () => {
  it("ownerApi exposes getOwnerGrowthDetails against dashboard growth details route", () => {
    const api = read("src/lib/ownerApi.js");
    assert.match(api, /export const getOwnerGrowthDetails/);
    assert.match(api, /\/api\/owner\/dashboard\/growth\/details/);
  });

  it("OwnerDashboard growth counts are clickable and open a detail panel", () => {
    const dash = read("src/pages/owner/OwnerDashboard.jsx");
    assert.match(dash, /getOwnerGrowthDetails/);
    assert.match(dash, /GrowthDetailPanel/);
    assert.match(dash, /GrowthCountButton/);
    assert.match(dash, /testId=\{`growth-count-\$\{row\.id\}-\$\{key\}`\}/);
    assert.match(dash, /data-testid=\{testId\}/);
    assert.match(dash, /data-testid="growth-detail-panel"/);
    assert.match(dash, /new_diner_accounts/);
    assert.match(dash, /market area/i);
    assert.match(dash, /data-testid=\{`growth-metric-\$\{row\.id\}`\}/);
    assert.match(dash, /View details →/);
    assert.match(dash, /America\/Los_Angeles/);
    assert.match(dash, /formatGrowthDetailCell/);
    assert.match(dash, /intervals\.find\(\(key\) => Number\(row\.values/);
  });

  it("ownerApi growth details always send America/Los_Angeles timezone", () => {
    const api = read("src/lib/ownerApi.js");
    assert.match(api, /timezone.*America\/Los_Angeles|America\/Los_Angeles.*timezone/);
  });
});
