/**
 * Contract: Public Cluster Feed UI — food-intel overview board (not venue menus).
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

test("ClusterPublicFeed is a food-intel overview board, not clickable venue menus", () => {
  const src = read("src/components/cluster/ClusterPublicFeed.jsx");
  assert.match(src, /cluster-public-feed/);
  assert.match(src, /Where is everyone eating today\?/);
  assert.match(src, /Food intel across/);
  assert.match(src, /fetchClusterPublicFeed/);
  assert.doesNotMatch(src, /from "react-router-dom"/);
  assert.doesNotMatch(src, /<Link\b/);
  assert.doesNotMatch(src, /\bWaiter\b/);
  assert.doesNotMatch(src, /does not require following|personalizes|Anyone can view/i);
  assert.doesNotMatch(src, /Public<\/span>|cluster-feed-public-badge/);
  assert.doesNotMatch(src, /Today'?s Hot Spots/i);
  assert.doesNotMatch(src, /sectionTitle[\s\S]*Right now/);
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
