/**
 * Plan 78 (Andre 2026-11-28, web follows the app): Deals → "+ Report a Deal" opens the normal Post with
 * Report a Deal ticked. The clip upload is unchanged: feedVideoCompose.js / consumerApi.js are not
 * touched and the report is sent after the post (QuickPostSheet → dealReportsApi).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dealReportBody } from "../src/lib/dealReportBody.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Deals page button opens Post via the shell event; guests are told to sign in", () => {
  const page = read("src/pages/consumer/feed/FeedDealsPage.jsx");
  assert.match(page, /data-testid="feed-deals-report-deal"/);
  assert.match(page, /openReportDeal\(\)/);
  assert.ok(page.includes("Sign in to report a deal."));
  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shell, /addEventListener\(OPEN_REPORT_DEAL_EVENT/);
  assert.match(shell, /initialReportDeal=\{composeReportDeal\}/);
  const overlay = read("src/components/consumer/feed/FeedVideoComposeOverlay.jsx");
  assert.match(overlay, /initialReportDeal=\{initialReportDeal\}/);
  assert.match(overlay, /canReportDeal=\{Boolean\(isAuthenticated\)\}/);
});

test("report is sent after the post; upload files untouched", () => {
  const sheet = read("src/components/consumer/feed/QuickPostSheet.jsx");
  assert.match(sheet, /const made = await onSubmit\?\.\(/);
  assert.ok(sheet.indexOf("sendDealReport({ clipId: entryId") > sheet.indexOf("const made = await onSubmit"));
  for (const f of ["src/lib/feedVideoCompose.js", "src/lib/consumerApi.js"]) assert.doesNotMatch(read(f), /deal-reports|dealReport/i, f);
});

test("listed = ids, unlisted = typed names", () => {
  assert.deepEqual(
    dealReportBody({ clipId: 5, place: { restaurant_id: 12, restaurant_name: "Fixins" }, food: { kind: "dish", dish: { menu_item_id: 55 }, label: "Pasta" }, description: " $9 " }),
    { clip_id: 5, restaurant_id: 12, menu_item_id: 55, description: "$9" }
  );
  assert.deepEqual(
    dealReportBody({ clipId: 6, place: { restaurant_id: null, restaurant_name: "Taco Stand", typed_name: "Taco Stand" }, food: { kind: "typed", name: "Al pastor", label: "Al pastor" } }),
    { clip_id: 6, place_name: "Taco Stand", dish_name: "Al pastor" }
  );
});
