/**
 * Plan 78 (Andre 2026-11-27): diner deal reports on the web Deals reel. Informational use only:
 * never a deal id, discount, deal link or Sponsored; "User Reported" + "Subject to restaurant
 * confirmation" + date; unlisted restaurant = typed name, no link; 3 marks via the CK route.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  mapDealReportToFeedVideoItem,
  mapDealsToFeedVideoItems,
  reportedOnLabel,
} from "../src/lib/feedDealVideos.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const listed = {
  deal_report_id: 7,
  clip_id: 91,
  informational: true,
  label: "User Reported",
  disclaimer: "Subject to restaurant confirmation",
  reported_at: "2026-11-27T20:00:00Z",
  video_url: "https://cdn.example.com/clip.mp4",
  restaurant_listed: true,
  restaurant_id: 12,
  restaurant_name: "Fixins",
  restaurant_slug: "fixins",
  city: "Los Angeles",
  state: "CA",
  dish_listed: true,
  menu_item_id: 55,
  dish_name: "Pasta Carbonara",
  description: "Tuesday special",
  reported_by: 160,
};

test("report maps to an informational reel item, never a deal", () => {
  const item = mapDealReportToFeedVideoItem(listed);
  assert.equal(item.is_deal_report, true);
  assert.equal(item.deal_id, null);
  assert.equal(item.deal_href, null);
  assert.equal(item.discount_label, "");
  assert.equal(item.feed_promoted, false);
  assert.equal(item.report_label, "User Reported");
  assert.equal(item.report_disclaimer, "Subject to restaurant confirmation");
  assert.match(item.reported_on, /^Reported Nov 2[78]$/);
  assert.equal(item.title, "Pasta Carbonara");
  assert.equal(item.restaurant_id, 12);
  assert.ok(item.restaurant_href);
  assert.deepEqual(item.menu_items, [{ id: 55, name: "Pasta Carbonara" }]);
});

test("unlisted restaurant + typed dish: name only, no links", () => {
  const item = mapDealReportToFeedVideoItem({
    ...listed,
    restaurant_listed: false,
    restaurant_id: null,
    restaurant_name: "Taco Stand",
    dish_listed: false,
    menu_item_id: null,
    dish_name: "Al pastor",
  });
  assert.equal(item.restaurant_name, "Taco Stand");
  assert.equal(item.restaurant_id, null);
  assert.equal(item.restaurant_href, null);
  assert.equal(item.menu_item_id, null);
  assert.deepEqual(item.menu_items, []);
});

test("no video or not informational → skipped; deals list keeps working", () => {
  assert.equal(mapDealReportToFeedVideoItem({ ...listed, video_url: "" }), null);
  assert.equal(mapDealReportToFeedVideoItem({ ...listed, informational: false }), null);
  assert.equal(reportedOnLabel("nope"), null);
  assert.deepEqual(mapDealsToFeedVideoItems([], undefined), []);
  assert.equal(mapDealsToFeedVideoItems([], [listed]).length, 1);
});

test("page asks for reports; reel shows the box and hides deal-only pieces", () => {
  const page = read("src/pages/consumer/feed/FeedDealsPage.jsx");
  assert.match(page, /include_reports: "1"/);
  assert.match(page, /mapDealsToFeedVideoItems\(data\?\.deals, data\?\.deal_reports\)/);
  const reel = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(reel, /<DealReportBox item=\{item\} \/>/);
  assert.match(reel, /item\.feed_promoted && !isDealReport/);
  assert.match(reel, /item\.discount_label && !isDealReport/);
  const box = read("src/components/consumer/feed/DealReportBox.jsx");
  assert.match(box, /\/api\/consumer\/deal-reports\/\$\{encodeURIComponent\(String\(reportId\)\)\}\/marks/);
  for (const label of ["Deal still on", "Mark deal as expired", "Wrong deal info"]) assert.ok(box.includes(label));
  assert.ok(box.includes("When 3 people mark it, it comes down."));
});
