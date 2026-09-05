/**
 * Phase 6 — Deals are public offers; not Meal Intel / Waiter personalization.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Deals catalog and Feed Deals frame public offers", () => {
  const dealsPage = read("src/pages/DealsPage.jsx");
  const feedDeals = read("src/pages/consumer/feed/FeedDealsPage.jsx");
  const app = read("src/App.jsx");

  assert.match(dealsPage, /deals-public-offers/);
  assert.match(dealsPage, /Public offers for everyone/);
  assert.match(dealsPage, /not personalized Meal Intel/i);

  assert.match(feedDeals, /Public deal videos/);
  assert.match(feedDeals, /apiGet\(`\/deals/);
  assert.doesNotMatch(feedDeals, /see-whos-eating|want-to-eat/i);
  assert.doesNotMatch(feedDeals, /listSeeWhosEating|fetchWantDiscovery/);

  assert.match(app, /path="\/deals"/);
  assert.match(app, /path="\/waiter"/);
  assert.match(app, /path="\/operator\/intent-based-offers"/);
  assert.match(app, /path="\/operator\/bid-free-bidding".*Navigate to="\/operator\/intent-based-offers"/s);
  assert.match(app, /path="\/operator\/limited-audience-offers".*Navigate to="\/operator\/intent-based-offers"/s);
});

test("Eating hub does not mount Deals as Meal Intel", () => {
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.doesNotMatch(hub, /DealsPage|FeedDealsPage|\/deals/);
  // Phase 7 mounts Meal Intel on hub (non-Waiter surface) — still must not use Deals.
  assert.match(hub, /MealIntelSection/);
});

test("Intent-Based Offers operator surface remains separate from public Deals", () => {
  const offers = read("src/pages/operator/OperatorCartNegotiationSettings.jsx");
  assert.match(offers, /Intent-Based Offers/);
  assert.match(offers, /not<\/strong> public Deals/);
  assert.doesNotMatch(offers, /Bid-Free Bidding/);
  assert.doesNotMatch(offers, /Meal Intel|public\.deals|FeedDealsPage/);
});
