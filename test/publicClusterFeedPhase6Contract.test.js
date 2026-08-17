/**
 * Contract: Public Cluster Feed UI — food activity overview (spec-aligned).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("cluster API exposes public feed + nearby events helpers", () => {
  const api = read("src/lib/clusterApi.js");
  assert.match(api, /fetchClusterPublicFeed/);
  assert.match(api, /\/feed/);
  assert.match(api, /fetchClusterNearbyEvents/);
  assert.match(api, /\/events/);
});

test("ClusterPage mounts public Cluster Feed dashboard and nearby events", () => {
  const page = read("src/pages/ClusterPage.jsx");
  assert.match(page, /ClusterPublicFeed/);
  assert.match(page, /ClusterNearbyEvents/);
  assert.match(page, /resolveClusterCardDescription/);
});

test("ClusterPublicFeed is a consumer dashboard; no everyone-eating claim", () => {
  const src = read("src/components/cluster/ClusterPublicFeed.jsx");
  assert.match(src, /cluster-public-feed/);
  assert.match(src, /cluster-dashboard-clock/);
  assert.match(src, /Today.?s Hotspots/);
  assert.match(src, /Popular today/);
  assert.match(src, /Who.?s eating here/);
  assert.match(src, /cluster-feed-section/);
  assert.match(src, /listPublicClusterFoodActivity/);
  assert.match(src, /fetchClusterPublicFeed/);
  assert.match(src, /from "react-router-dom"/);
  assert.doesNotMatch(src, /\bWaiter\b/);
  assert.doesNotMatch(src, /Where is everyone eating/i);
  assert.doesNotMatch(src, /everyone is eating/i);
  assert.doesNotMatch(src, /does not require following|personalizes|Anyone can view/i);
});

test("subscribe button does not say Waiter", () => {
  const btn = read("src/components/cluster/ClusterSubscribeButton.jsx");
  assert.match(btn, /cluster-subscribe-toggle/);
  assert.match(btn, /Following|Follow/);
  assert.doesNotMatch(btn, /\bWaiter\b/);
});

test("Waiter page keeps invariants; cluster follow copy avoids Waiter jargon", () => {
  const waiter = read("src/pages/FoodInterestsPage.jsx");
  assert.match(waiter, /groupByType/);
  assert.match(waiter, /Manage followed places|cluster-subscriptions/);
  assert.doesNotMatch(waiter, /Manage Waiter clusters|Waiter report from/);
  assert.doesNotMatch(waiter, /import\s+.*MarketFallback|<[Mm]arketFallback|CommunityGrowthCard\s*[({]/);
});
