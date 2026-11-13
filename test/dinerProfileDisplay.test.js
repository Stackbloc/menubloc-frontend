// Diner Intelligence Stage 4 display helpers.
import test from "node:test";
import assert from "node:assert/strict";
import { metricCell, metricFootnote, rangeFromParams, tierLabel } from "../src/pages/owner/diners/profileDisplay.js";

const P = (s) => new URLSearchParams(s);

test("range from the URL: range, the list page's interval, custom with dates, safe default", () => {
  assert.deepEqual(rangeFromParams(P("")), { key: "30d" });
  assert.deepEqual(rangeFromParams(P("range=lifetime")), { key: "lifetime" });
  assert.deepEqual(rangeFromParams(P("interval=today")), { key: "today" });
  assert.deepEqual(rangeFromParams(P("range=custom&from=2026-10-01&to=2026-10-31")), { key: "custom", from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(rangeFromParams(P("range=custom&from=bad")), { key: "30d" });
  assert.deepEqual(rangeFromParams(P("range=nope")), { key: "30d" });
});

test("cells: not tracked, unavailable and missing are never 0; formats; partial star", () => {
  assert.deepEqual(metricCell({ status: "not_instrumented" }, "period"), { text: "Not tracked", tone: "not_tracked", partial: false });
  assert.equal(metricCell({ status: "unavailable", period_status: "unavailable", period: null }, "period").text, "Unavailable");
  assert.equal(metricCell({ status: "ok", period_status: "zero", period: 0 }, "period").text, "0");
  assert.equal(metricCell({ status: "ok", period_status: "zero", period: null, format: "duration" }, "period").text, "—");
  assert.equal(metricCell({ status: "ok", period_status: "ok", period: 1830, format: "duration" }, "period").text, "30m 30s");
  assert.equal(metricCell({ status: "ok", period_status: "ok", period: 0.5, format: "percent", period_detail: { yes: 1, of: 2 } }, "period").text, "50% (1 of 2)");
  assert.equal(metricCell({ status: "ok", lifetime_status: "ok", lifetime: 3, lifetime_partial: true }, "lifetime").partial, true);
});

test("footnotes: note, tracking gap with date, snapshot", () => {
  assert.match(metricFootnote({ note: "Self-reported.", since: "2026-11-12", lifetime_partial: true }), /Self-reported\. Recorded since Nov 12, 2026/);
  assert.equal(metricFootnote({ status: "not_instrumented", reason: "No likes yet." }), "No likes yet.");
  assert.match(metricFootnote({ kind: "snapshot" }), /snapshot/);
  assert.equal(metricFootnote({}), null);
  assert.equal(tierLabel("gold_standard"), "Gold Standard");
});
