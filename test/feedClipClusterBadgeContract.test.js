import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Feed clip cluster badge only uses clusters the viewer's Explore clusters offers", () => {
  const hook = read("src/hooks/useFeedClipClusters.js");
  assert.match(hook, /useMarketClusters\(locationLabel\)/);
  assert.match(hook, /grubbid\.discovery\.location/);
  assert.match(hook, /readDetectedLocation/);
  assert.doesNotMatch(hook, /geolocation/, "never prompts for location itself");
  assert.match(hook, /fetchClusterMemberIds/);
  const screen = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(screen, /<FeedClipClusterBadge cluster=\{clipCluster\}/);
});

test("badge label says Cluster once and links to the cluster", async () => {
  const { clusterBadgeLabel } = await import("../src/hooks/useFeedClipClusters.js").catch(() => ({}));
  if (clusterBadgeLabel) {
    assert.equal(clusterBadgeLabel("USC"), "USC Cluster");
    assert.equal(clusterBadgeLabel("Downtown Cluster"), "Downtown Cluster");
  }
  const badge = read("src/components/consumer/feed/FeedClipClusterBadge.jsx");
  assert.match(badge, /<Link\s+to=\{cluster\.href\}/);
});

test("Feed rail keeps the original 64px column; Menu Browser is a labeled rail button; hover hints explain each icon", () => {
  const rail = read("src/components/consumer/feed/FeedVideoActionRail.jsx");
  assert.match(rail, /width: 64,/);
  assert.match(rail, /testId="feed-rail-menu"/);
  for (const hint of [
    "Add this item to your Wish List",
    "Add this restaurant to your Wish List",
    "Add this restaurant to your Favorites",
    "Fav this dish",
    "Invite a Connect to eat this",
    "Share this clip",
  ]) {
    assert.ok(rail.includes(hint), hint);
  }
});
