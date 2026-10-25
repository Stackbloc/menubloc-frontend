/**
 * Video deals are structured deals (Andre, 2026-10-22): the deal video unlocks only once the
 * written terms are complete. Mirrors backend `validateVideoDealTerms`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  videoDealTermsProblem,
  videoDealTermsFromDeal,
  videoDealTermsSummary,
} from "../src/lib/videoDealTerms.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const complete = {
  dealType: "percent_off",
  value: 20,
  itemCount: 1,
  startsAt: "2026-10-22",
  expiresAt: "2026-11-22",
};

test("videoDealTermsProblem: complete terms pass for every priced type", () => {
  assert.equal(videoDealTermsProblem(complete), null);
  assert.equal(videoDealTermsProblem({ ...complete, dealType: "amount_off", value: "3.00" }), null);
  assert.equal(videoDealTermsProblem({ ...complete, dealType: "fixed_price", value: 9.99 }), null);
});

test("videoDealTermsProblem: names what is missing", () => {
  for (const dealType of ["other", "bogo", "combo", undefined]) {
    assert.match(videoDealTermsProblem({ ...complete, dealType }), /written deal first/);
  }
  assert.match(videoDealTermsProblem({ ...complete, value: "" }), /between 1 and 100/);
  assert.match(videoDealTermsProblem({ ...complete, value: 150 }), /between 1 and 100/);
  assert.match(videoDealTermsProblem({ ...complete, dealType: "amount_off", value: 0 }), /deal amount/);
  assert.match(videoDealTermsProblem({ ...complete, itemCount: 0 }), /at least one menu item/);
  assert.match(videoDealTermsProblem({ ...complete, expiresAt: "" }), /start and end dates/);
});

test("videoDealTermsFromDeal: reads saved rows (cents) and linked items", () => {
  assert.deepEqual(
    videoDealTermsFromDeal({
      deal_type: "amount_off",
      discount_amount_cents: 300,
      menu_item_id: null,
      applies_to_menu_item_ids: [4, 5],
      starts_at: "2026-10-22T00:00:00.000Z",
      expires_at: "2026-11-22T23:59:59.999Z",
    }),
    {
      dealType: "amount_off",
      value: 3,
      itemCount: 2,
      startsAt: "2026-10-22T00:00:00.000Z",
      expiresAt: "2026-11-22T23:59:59.999Z",
    }
  );
  assert.match(
    videoDealTermsProblem(videoDealTermsFromDeal({ deal_type: "other", title: "Specials" })),
    /written deal first/
  );
});

test("videoDealTermsSummary: one line beside the video", () => {
  assert.equal(videoDealTermsSummary(complete), "20% off · 2026-10-22 – 2026-11-22");
  assert.equal(
    videoDealTermsSummary({ ...complete, dealType: "fixed_price", value: 9.99 }),
    "Special price $9.99 · 2026-10-22 – 2026-11-22"
  );
  assert.equal(
    videoDealTermsSummary({ ...complete, dealType: "fixed_price", value: 9 }),
    "Special price $9 · 2026-10-22 – 2026-11-22"
  );
});

test("operator deal editor locks the video until the terms are complete and saved", () => {
  const page = read("src/pages/operator/OperatorDealsEditor.jsx");
  assert.match(page, /videoDealTermsProblem\(formTerms\)/);
  assert.match(page, /videoDealTermsFromDeal\(initial\)/);
  assert.match(page, /Save the deal terms first, then add the video\./);
  assert.match(page, /disabled=\{busy \|\| dealVideoUploadBusy \|\| Boolean\(videoTermsProblem\)\}/);
  assert.match(page, /!videoNeedsTerms/);
  assert.match(page, /data-testid="deal-form-video-terms-needed"/);
});

test("owner deal video panel creates a priced, item-linked deal (never 'other')", () => {
  const page = read("src/pages/owner/OwnerVideoCuration.jsx");
  const start = page.indexOf("function DealVideoUploadPanel");
  const panel = page.slice(start, page.indexOf("\nfunction ", start + 10));
  assert.doesNotMatch(panel, /deal_type: "other"/);
  assert.doesNotMatch(panel, /allow_null_menu_item/);
  assert.match(panel, /deal_type: dealType/);
  assert.match(panel, /value: Number\(dealValue\)/);
  assert.match(panel, /videoDealTermsProblem\(\{/);
  assert.match(panel, /data-testid="owner-deal-video-type"/);
  assert.match(panel, /data-testid="owner-deal-video-value"/);
});
