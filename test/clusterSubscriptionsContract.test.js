import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Cluster subscriptions UI + report feed (Waiter wired)", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /subscribeToCluster/);
  assert.match(api, /fetchClusterReportFeed/);
  assert.match(api, /cluster-subscriptions/);

  const btn = read("src/components/cluster/ClusterSubscribeButton.jsx");
  assert.match(btn, /cluster-subscribe-toggle/);
  assert.match(btn, /Follow cluster/);

  const page = read("src/pages/consumer/ClusterSubscriptionsPage.jsx");
  assert.match(page, /Cluster food report|Food report/);
  assert.match(page, /cluster-report-item/);
  assert.match(page, /selected clusters/);

  const clusterPage = read("src/pages/ClusterPage.jsx");
  assert.match(clusterPage, /ClusterSubscribeButton/);

  const app = read("src/App.jsx");
  assert.match(app, /\/account\/cluster-subscriptions/);
  assert.match(app, /ClusterSubscriptionsPage/);

  // Waiter Phase 6 authorized wiring
  const waiterPage = read("src/pages/FoodInterestsPage.jsx");
  assert.match(waiterPage, /cluster-subscriptions|cluster_report/);
  assert.match(waiterPage, /groupByType/);
  assert.doesNotMatch(waiterPage, /import\s+.*MarketFallback|<[Mm]arketFallback|CommunityGrowthCard\s*[({]/);

  const waiterApi = read("src/lib/waiterApi.js");
  assert.match(waiterApi, /\/api\/waiter\/briefing/);
});
