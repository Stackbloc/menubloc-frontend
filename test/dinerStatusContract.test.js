import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Diner Status Phase 5 UI + API (no ratings, no Waiter edits)", () => {
  const api = read("src/lib/dinerStatusApi.js");
  assert.match(api, /\/public\/diner-statuses/);
  assert.match(api, /apiGet/);
  assert.doesNotMatch(api, /fetch\(["']\/public\/diner-statuses/);

  const consumer = read("src/lib/consumerApi.js");
  assert.match(consumer, /createDinerStatus/);
  assert.match(consumer, /listMyDinerStatuses/);

  const feed = read("src/components/dinerStatus/DinerStatusFeed.jsx");
  assert.match(feed, /diner-status-feed/);
  assert.match(feed, /not star ratings/i);

  const composer = read("src/components/dinerStatus/DinerStatusComposer.jsx");
  assert.match(composer, /expression/);
  assert.match(composer, /fire/);

  const saying = read("src/components/restaurant/WhatDinersAreSaying.jsx");
  assert.match(saying, /DinerStatusFeed/);

  const cluster = read("src/components/cluster/WhatPeopleAreEating.jsx");
  assert.match(cluster, /DinerStatusFeed/);
  assert.match(cluster, /diner-status-cluster-signals/);

  const page = read("src/pages/consumer/DinerStatusPage.jsx");
  assert.match(page, /Post diner status/);
  assert.match(page, /not a star rating/i);
  assert.doesNotMatch(page, /1-5 stars|starRatings|rating_value/i);

  const app = read("src/App.jsx");
  assert.match(app, /\/account\/diner-status/);
  assert.match(app, /DinerStatusPage/);

  // Menu item detail sticky verdict: do not mount here without approval
  const detail = read("src/pages/MenuItemDetailPage.jsx");
  assert.doesNotMatch(detail, /DinerStatusFeed|DinerStatusComposer/);

  // Waiter zero-touch
  assert.doesNotMatch(read("src/pages/FoodInterestsPage.jsx"), /diner.status|DinerStatus/);
  assert.doesNotMatch(read("src/lib/waiterApi.js"), /diner-status|dinerStatus/);
});
