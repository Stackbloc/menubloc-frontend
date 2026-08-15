/**
 * Contract: Public Cluster Feed UI (Phase 6) — report, don't explain.
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

test("public cluster feed API helper exists", () => {
  const api = read("src/lib/clusterApi.js");
  assert.match(api, /fetchClusterPublicFeed/);
  assert.match(api, /\/feed/);
});

test("ClusterPage mounts public Cluster Feed", () => {
  const page = read("src/pages/ClusterPage.jsx");
  assert.match(page, /ClusterPublicFeed/);
});

test("ClusterPublicFeed leads with happening-now reporting, not product explainer", () => {
  const src = read("src/components/cluster/ClusterPublicFeed.jsx");
  assert.match(src, /cluster-public-feed/);
  assert.match(src, /Cluster Feed/);
  assert.match(src, /happening now/i);
  assert.match(src, /fetchClusterPublicFeed/);
  assert.doesNotMatch(src, /\bWaiter\b/);
  assert.doesNotMatch(src, /does not require following|personalizes|Anyone can view/i);
  assert.doesNotMatch(src, /Public<\/span>|cluster-feed-public-badge/);
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
