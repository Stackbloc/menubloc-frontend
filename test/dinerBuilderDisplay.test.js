// Diner Intelligence Stage 7 display helpers (Network Builder).
import test from "node:test";
import assert from "node:assert/strict";
import { builderApiParams, builderStateFromParams, nextSort, trendLabel } from "../src/pages/owner/diners/builderDisplay.js";

const P = (s) => new URLSearchParams(s);

test("state: b-prefixed keys, validated; other sections' keys ignored", () => {
  const s = builderStateFromParams(P("brange=lifetime&bsort=multi_diner_plans&bdir=asc&bcat=influencer&brepeat=1&bpage=3&nrange=7d"));
  assert.deepEqual(s, { range: { key: "lifetime" }, sort: "multi_diner_plans", dir: "asc", category: "influencer", repeat: true, plans: false, page: 3 });
  const d = builderStateFromParams(P("bsort=email&bcat=king&bpage=-2&brange=custom&bfrom=bad"));
  assert.deepEqual(d, { range: { key: "30d" }, sort: "nvs", dir: "desc", category: "", repeat: false, plans: false, page: 1 });
  assert.deepEqual(builderStateFromParams(P("brange=custom&bfrom=2026-11-01&bto=2026-11-10")).range, { key: "custom", from: "2026-11-01", to: "2026-11-10" });
});

test("api params: only what's set", () => {
  assert.deepEqual(builderApiParams(builderStateFromParams(P(""))), { range: "30d", sort: "nvs", dir: "desc", page: 1, page_size: 25 });
  assert.deepEqual(builderApiParams(builderStateFromParams(P("brange=custom&bfrom=2026-11-01&bto=2026-11-10&bcat=sheep&bplans=1"))),
    { range: "custom", from: "2026-11-01", to: "2026-11-10", sort: "nvs", dir: "desc", page: 1, page_size: 25, classification: "sheep", plans: "1" });
});

test("sort toggle and trend labels", () => {
  const s = builderStateFromParams(P("bsort=nvs&bdir=desc&bpage=4"));
  assert.deepEqual(nextSort(s, "nvs"), { bsort: "nvs", bdir: "asc", bpage: null });
  assert.deepEqual(nextSort(s, "social_days"), { bsort: "social_days", bdir: "desc", bpage: null });
  assert.equal(trendLabel(null), "—");
  assert.equal(trendLabel(5), "+5");
  assert.equal(trendLabel(-2.26), "−2.3");
  assert.equal(trendLabel(0), "0");
});
