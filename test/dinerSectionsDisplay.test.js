// Diner Intelligence Stage 5 display helpers.
import test from "node:test";
import assert from "node:assert/strict";
import {
  SECTIONS_RANGE_KEYS,
  bucketLabel,
  formatSectionValue,
  sectionCell,
  sectionCompare,
  sectionFootnote,
  sectionsApiParams,
  sectionsStateFromParams,
} from "../src/pages/owner/diners/sectionsDisplay.js";

const P = (s) => new URLSearchParams(s);

test("state from the URL: own keys, no Lifetime, custom needs dates, cluster", () => {
  assert.ok(!SECTIONS_RANGE_KEYS.includes("lifetime"));
  assert.deepEqual(sectionsStateFromParams(P("")), { range: { key: "30d" }, clusterId: 0 });
  assert.deepEqual(sectionsStateFromParams(P("srange=lifetime")), { range: { key: "30d" }, clusterId: 0 });
  assert.deepEqual(sectionsStateFromParams(P("srange=7d&scluster=3&interval=today")), { range: { key: "7d" }, clusterId: 3 });
  assert.deepEqual(sectionsStateFromParams(P("srange=custom&sfrom=2026-10-01&sto=2026-10-31")).range, { key: "custom", from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(sectionsStateFromParams(P("srange=custom&sfrom=bad")).range, { key: "30d" });
  assert.deepEqual(sectionsApiParams({ range: { key: "custom", from: "a", to: "b" }, clusterId: 2 }), { range: "custom", from: "a", to: "b", cluster_id: 2 });
  assert.deepEqual(sectionsApiParams({ range: { key: "7d" }, clusterId: 0 }), { range: "7d" });
});

test("values: <5 people, percent, missing is never 0", () => {
  assert.equal(formatSectionValue(3, "people"), "<5");
  assert.equal(formatSectionValue(0, "people"), "0");
  assert.equal(formatSectionValue(1200, "people"), "1,200");
  assert.equal(formatSectionValue(42.5, "percent"), "42.5%");
  assert.equal(formatSectionValue(null, "count"), "—");
  assert.deepEqual(sectionCell({ status: "unavailable", value: null }), { text: "Unavailable", tone: "unavailable" });
  assert.deepEqual(sectionCell({ status: "zero", value: 0, format: "count" }), { text: "0", tone: "zero" });
});

test("compare: change vs before; percent in points; small people counts not compared", () => {
  assert.equal(sectionCompare({ status: "ok", value: 30, previous: 20, format: "count" }).text, "+10 (+50%) vs before (20)");
  assert.equal(sectionCompare({ status: "ok", value: 40, previous: 45.5, format: "percent" }).text, "−5.5 pts vs before (45.5%)");
  assert.equal(sectionCompare({ status: "ok", value: 3, previous: 10, format: "people" }).text, "Too few people to compare");
  assert.equal(sectionCompare({ status: "ok", value: 10, previous: null, format: "people" }).text, "No earlier data");
  assert.equal(sectionCompare({ status: "unavailable" }), null);
});

test("footnote mentions partial recording; bucket labels", () => {
  assert.match(sectionFootnote({ note: "N.", partial: true, since: "2026-11-10" }), /^N\. Recorded since Nov 10, 2026/);
  assert.equal(sectionFootnote({}), null);
  assert.equal(bucketLabel("2026-11-03", "day"), "Nov 3");
  assert.equal(bucketLabel("2026-11-02", "week"), "Wk of Nov 2");
});
