/**
 * Diner Intelligence Stage 1: a metric that couldn't be read never shows as 0.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DINER_INTERVAL_OPTIONS,
  dinerProfilePath,
  displayDinerCount,
  displayDinerMetric,
} from "../src/pages/owner/diners/dinerMetricDisplay.js";

describe("diner metric display", () => {
  it("zero, counted, unavailable and not tracked all read differently", () => {
    assert.deepEqual(displayDinerMetric({ status: "zero", count: 0, unique_diners: 0 }), {
      value: "0", subtitle: "0 unique diners", tone: "zero",
    });
    assert.equal(displayDinerMetric({ status: "ok", count: 1234, unique_diners: 7 }).value, "1,234");
    const failed = displayDinerMetric({ status: "unavailable", count: null });
    assert.equal(failed.value, "Unavailable");
    assert.equal(failed.tone, "unavailable");
    const missing = displayDinerMetric({ status: "not_instrumented", count: null, reason: "No table." });
    assert.deepEqual([missing.value, missing.subtitle, missing.tone], ["Not tracked", "No table.", "not_tracked"]);
  });

  it("averages keep decimals and say they are lifetime", () => {
    const avg = displayDinerMetric({
      status: "ok", count: 1.456, is_average: true, lifetime: true, accepted_connects_total: 3, active_diners: 2,
    });
    assert.equal(avg.value, "1.46");
    assert.equal(avg.subtitle, "3 accepted total · 2 active diners · lifetime");
  });

  it("per-diner counts: null is a dash, not 0", () => {
    assert.equal(displayDinerCount(null), "—");
    assert.equal(displayDinerCount(0), "0");
  });

  it("interval options include 90 days; profile links carry the window", () => {
    assert.deepEqual(DINER_INTERVAL_OPTIONS.map(([k]) => k), ["today", "yesterday", "7d", "30d", "90d", "365d"]);
    assert.equal(dinerProfilePath(42, "30d"), "/owner/diners/42");
    assert.equal(dinerProfilePath(42, "7d"), "/owner/diners/42?interval=7d");
    assert.equal(dinerProfilePath(42, "90d"), "/owner/diners/42?interval=90d");
  });
});
