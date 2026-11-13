// Diner Intelligence Stage 6 display helpers.
import test from "node:test";
import assert from "node:assert/strict";
import {
  chartIsEmpty, chartMax, drillPath, goalPercent, listApiParams, listStateFromParams, rangeApiParams, rangeStateFromParams, sourceName,
} from "../src/pages/owner/diners/networkDisplay.js";

const P = (s) => new URLSearchParams(s);

test("range state: prefixed keys on /owner/diners, plain on the USC/list pages; Lifetime allowed", () => {
  assert.deepEqual(rangeStateFromParams(P("nrange=lifetime&ncluster=4"), "n"), { range: { key: "lifetime" }, clusterId: 4 });
  assert.deepEqual(rangeStateFromParams(P("srange=7d"), "n"), { range: { key: "30d" }, clusterId: 0 });
  assert.deepEqual(rangeStateFromParams(P("range=custom&from=2026-11-01&to=2026-11-10&cluster_id=2")), { range: { key: "custom", from: "2026-11-01", to: "2026-11-10" }, clusterId: 2 });
  assert.deepEqual(rangeApiParams({ range: { key: "7d" }, clusterId: 0 }), { range: "7d" });
});

test("drill-down links keep the period and cluster", () => {
  assert.equal(drillPath("connected", { range: { key: "7d" }, clusterId: 3 }), "/owner/diners/list?set=connected&range=7d&cluster_id=3");
  assert.equal(drillPath("usc_engaged", { range: { key: "custom", from: "2026-11-01", to: "2026-11-10" }, clusterId: 0 }),
    "/owner/diners/list?set=usc_engaged&range=custom&from=2026-11-01&to=2026-11-10");
});

test("list state: filters validated, page from URL", () => {
  const s = listStateFromParams(P("set=isolated&range=90d&tier=gold_standard&cohort_from=2026-10-01&cohort_to=bad&source=diner_qr&page=3"));
  assert.equal(s.set, "isolated");
  assert.equal(s.tier, "gold_standard");
  assert.equal(s.cohortFrom, "2026-10-01");
  assert.equal(s.cohortTo, "");
  assert.equal(s.page, 3);
  assert.equal(listStateFromParams(P("set=x&tier=king")).tier, "");
  assert.equal(listApiParams(s).page_size, 50);
  assert.equal(listApiParams(s).source, "diner_qr");
});

test("goal, chart helpers, source names", () => {
  assert.equal(goalPercent(125, 500), 25);
  assert.equal(goalPercent(900, 500), 100);
  assert.equal(goalPercent(0, 0), 0);
  const chart = { series: [{ points: [{ value: null }, { value: 7 }] }, { points: [{ value: 3 }, { value: null }] }] };
  assert.equal(chartMax(chart), 7);
  assert.equal(chartIsEmpty({ series: [{ points: [{ value: null }] }] }), true);
  assert.equal(chartIsEmpty(chart), false);
  assert.equal(sourceName("diner_qr"), "Diner QR");
  assert.equal(sourceName(null), "Direct / not recorded");
  assert.equal(sourceName("website_referral"), "Website referral");
});
