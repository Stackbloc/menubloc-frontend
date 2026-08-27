/**
 * Feed deal video mapping + swipe contract.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  mapDealRowToFeedVideoItem,
  mapDealsToFeedVideoItems,
  formatDealDiscountLabel,
} from "../src/lib/feedDealVideos.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("feedDealVideos: maps video deals only", () => {
  assert.equal(mapDealRowToFeedVideoItem({ id: 1, title: "No video" }), null);
  const row = mapDealRowToFeedVideoItem({
    deal_id: 42,
    video_url: "https://cdn.example.com/deal.mp4",
    title: "Lunch special",
    restaurant_name: "Fixins",
    restaurant_slug: "fixins",
    city: "Los Angeles",
    state: "CA",
    deal_type: "percent_off",
    discount_percent: 20,
    meal_periods: ["lunch"],
    show_meal_time_caption: true,
  });
  assert.equal(row.id, "42");
  assert.equal(row.video_url, "https://cdn.example.com/deal.mp4");
  assert.equal(row.discount_label, "20% off");
  assert.deepEqual(row.meal_periods, ["lunch"]);
  assert.deepEqual(row.meal_period_labels, ["Lunch"]);
  assert.equal(row.meal_time_caption, "Lunch Deal");
  assert.equal(row.headline, "Lunch Deal");
  assert.match(row.restaurant_href, /\/restaurants\//);
  assert.equal(row.deal_href, "/deals/42");
  assert.equal(mapDealsToFeedVideoItems([{ id: 1 }, row]).length, 1);
  assert.equal(formatDealDiscountLabel({ deal_type: "bogo" }), "");
});

test("Feed deals: video swipe reel, no meal chips", () => {
  const feedDeals = read("src/pages/consumer/feed/FeedDealsPage.jsx");
  assert.match(feedDeals, /has_video/);
  assert.match(feedDeals, /DealVideoSwipe/);
  assert.match(feedDeals, /feed-deals-search/);
  assert.match(feedDeals, /Search deals/);
  assert.match(feedDeals, /feed-deals-meal-filters/);
  assert.match(feedDeals, /meal_period/);
  assert.doesNotMatch(feedDeals, /prefer_media/);

  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(swipe, /feed-deals-video-swipe/);
  assert.match(swipe, /meal_time_caption|headline/);
  assert.match(swipe, /Swipe up/);

  const home = read("src/pages/consumer/feed/FeedHomePage.jsx");
  assert.match(home, /\/feed\/deals\?city=/);

  const dealsEditor = read("src/pages/operator/OperatorDealsEditor.jsx");
  assert.match(dealsEditor, /uploadDealMediaVideo/);
  assert.match(dealsEditor, /Deal video \(Feed → Deals\)/);
  assert.match(dealsEditor, /deal-form-meal-periods/);
  assert.match(dealsEditor, /deal-form-meal-time-caption/);
  assert.match(dealsEditor, /deal-row-feed-video-badge/);
  assert.match(dealsEditor, /deal-row-meal-periods/);

  const operatorApi = read("src/lib/operatorApi.js");
  assert.match(operatorApi, /deals\/\$\{did\}\/media\/video/);
});
