/**
 * Contract: Public Cluster Feed UI + Waiter distinction (Phase 6).
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

test("ClusterPage mounts public Cluster Feed (not labeled Waiter)", () => {
  const page = read("src/pages/ClusterPage.jsx");
  assert.match(page, /ClusterPublicFeed/);
  assert.match(page, /cluster-public-feed|ClusterPublicFeed/);
  assert.doesNotMatch(page, /<Waiter|label=\{?[\"']Waiter[\"']/);
});

test("ClusterPublicFeed is public and subscription-independent", () => {
  const src = read("src/components/cluster/ClusterPublicFeed.jsx");
  assert.match(src, /cluster-public-feed/);
  assert.match(src, /Cluster Feed/);
  assert.match(src, /does not require following|not required/i);
  assert.match(src, /fetchClusterPublicFeed/);
  // Section title must be Cluster Feed, not Waiter
  assert.match(src, /sectionTitle}>Cluster Feed</);
  assert.doesNotMatch(src, /aria-label="Waiter"/);
});

test("subscribe button is Waiter personalization only", () => {
  const btn = read("src/components/cluster/ClusterSubscribeButton.jsx");
  assert.match(btn, /Follow for Waiter|Waiter is monitoring/);
  assert.match(btn, /public Cluster Feed/);
});

test("Waiter page remains personalized and distinct", () => {
  const waiter = read("src/pages/FoodInterestsPage.jsx");
  assert.match(waiter, /groupByType/);
  assert.match(waiter, /Manage Waiter clusters|cluster-subscriptions/);
  assert.match(waiter, /Waiter report from|cluster_report/);
  assert.doesNotMatch(waiter, /import\s+.*MarketFallback|<[Mm]arketFallback|CommunityGrowthCard\s*[({]/);
});
