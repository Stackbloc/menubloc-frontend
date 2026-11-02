import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildClusterVideoIndex } from "../src/lib/clusterVideoIndex.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

// Shapes from production GET /public/clusters/usc/videos inputs (2026-10-17).
const payload = {
  videos: [
    { video_key: "managed:15", kind: "managed", video_id: 15, video_url: "https://cdn/x.mp4", restaurant_id: 1313, menu_item_id: 475269, item_name: "2 Protein Bowl" },
    { video_key: "managed:51", kind: "managed", video_id: 51, video_url: "https://cdn/y.mp4", restaurant_id: 12161, menu_item_id: 543525, item_name: "Burrito" },
    { video_key: "deal:48", kind: "deal", video_id: 48, video_url: "https://cdn/z.mp4", restaurant_id: 1027, menu_item_id: null, item_name: null },
    { video_key: "ate:9", kind: "ate", video_id: 9, video_url: "", restaurant_id: 1027 },
  ],
  restaurants: { 1313: ["managed:15"], 12161: ["managed:51"], 1027: ["deal:48", "ate:9"] },
};

test("dish rows match by menu item id", () => {
  const index = buildClusterVideoIndex(payload);
  const hits = index.forDish({ restaurant_id: 12161, menu_item_id: 543525, name: "Burrito" });
  assert.deepEqual(hits.map((v) => v.video_key), ["managed:51"]);
  assert.equal(index.forDish({ restaurant_id: 12161, menu_item_id: 543526, name: "Burrito Bowl" }).length, 0);
});

test("chain store rows (canonical ids) fall back to the exact dish name", () => {
  const index = buildClusterVideoIndex(payload);
  // Yoshinoya cluster row id 543195 ≠ clip menu_item_id 475269.
  const hits = index.forDish({ restaurant_id: 1313, menu_item_id: 543195, name: "2 Protein Bowl" });
  assert.deepEqual(hits.map((v) => v.video_key), ["managed:15"]);
  assert.equal(index.forDish({ restaurant_id: 1313, menu_item_id: 543196, name: "Veggie Bowl" }).length, 0);
});

test("same dish name at another restaurant never matches", () => {
  const index = buildClusterVideoIndex(payload);
  assert.equal(index.forDish({ restaurant_id: 999, name: "Burrito" }).length, 0);
});

test("restaurant cards see only playable clips; dish-less clips never mark a dish", () => {
  const index = buildClusterVideoIndex(payload);
  assert.deepEqual(index.forRestaurant(1027).map((v) => v.video_key), ["deal:48"]);
  assert.equal(index.forDish({ restaurant_id: 1027, name: "Specials" }).length, 0);
  assert.equal(index.videos.length, 3);
});

test("empty or failed payload leaves the cluster page unchanged", () => {
  const index = buildClusterVideoIndex(null);
  assert.equal(index.videos.length, 0);
  assert.equal(index.forRestaurant(1).length, 0);
  assert.equal(index.forDish({ restaurant_id: 1, name: "x" }).length, 0);
});

test("hero keeps paid inventory: sold image ads are not replaced, sponsored clips are labeled", () => {
  const hero = read("src/components/cluster/video/ClusterVideoHero.jsx");
  assert.match(hero, /delivery\?\.adSource === "sold"/);
  assert.match(hero, /index\.forRestaurant\(ad\.restaurant_id\)/);
  assert.match(hero, /Sponsored/);
  assert.match(hero, /adEngagementAttrs\(sponsoredAd, delivery\)/);
});

test("video playback is muted by default and tracked through the video events pipeline", () => {
  for (const rel of [
    "src/components/cluster/video/ClusterVideoHero.jsx",
    "src/components/cluster/video/ClusterFloatingVideoPlayer.jsx",
  ]) {
    const src = read(rel);
    assert.match(src, /useState\(true\)/, `${rel} starts muted`);
    assert.match(src, /play_muted === true/, `${rel} honors Video Manager play muted`);
    assert.match(src, /trackClusterVideoEvent\(clip, "play"/, `${rel} tracks plays`);
  }
  const analytics = read("src/lib/clusterVideoAnalytics.js");
  assert.match(analytics, /\/api\/analytics\/video-events/);
  assert.match(analytics, /isEngagementTrackingAllowed\(\)/);
});

test("clip → dish → basket reuses the Feed pinned-dish menu treatment", () => {
  const sheet = read("src/components/cluster/video/ClusterVideoMenuSheet.jsx");
  assert.match(sheet, /CatalogMenuRenderer/);
  // Clips keep "From the clip"; dish rows pass "Your pick".
  assert.match(sheet, /pinnedItemLabel=\{highlightName \? pinnedLabel \|\| "From the clip" : null\}/);
  assert.match(sheet, /enableRestaurantContextualVideo=\{false\}/);
});

test("cluster page calls them clips, never videos, in visible text", () => {
  const files = [
    "src/components/cluster/video/ClusterVideoHero.jsx",
    "src/components/cluster/video/ClusterFloatingVideoPlayer.jsx",
    "src/components/cluster/video/ClusterVideoPlayButton.jsx",
    "src/components/cluster/video/ClusterVideoMenuSheet.jsx",
    "src/components/cluster/ClusterMenuExplorer.jsx",
    "src/components/cluster/ClusterRestaurantDirectoryCard.jsx",
    "src/pages/ClusterPage.jsx",
  ];
  for (const rel of files) {
    const visible = read(rel)
      .split("\n")
      .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
      .filter((line) => /(aria-label|label=|title=|>[^<{]*\b[Vv]ideos?\b|"[^"]*\b[Vv]ideos?\b[^"]*"|`[^`]*\b[Vv]ideos?\b)/.test(line))
      .filter((line) => !/data-testid|testId=|className=|import /.test(line))
      .filter((line) => /\b[Vv]ideos?\b/.test(line.replace(/\.videos?\b/g, "")));
    assert.deepEqual(visible, [], `${rel} shows "video" to diners`);
  }
});

test("hero clips play in place, stick under search, and start on their own after 15 s", () => {
  const hero = read("src/components/cluster/video/ClusterVideoHero.jsx");
  assert.match(hero, /IDLE_AUTOPLAY_MS = 15000/);
  assert.match(hero, /orderClipsForAutoplay\(clips\)/);
  assert.match(hero, /position: "sticky"/);
  assert.match(hero, /aspectRatio: "16 \/ 9"/, "portrait clips shown in a landscape frame inline");
  assert.match(hero, /trigger: "hero_expand"/, "⤢ opens the full portrait clip");
  const page = read("src/pages/ClusterPage.jsx");
  assert.match(page, /data-testid="cluster-ad-space"[^>]*style=\{\{ display: "contents" \}\}/);
});
