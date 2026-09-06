/**
 * Feed Menu Browser PiP — frozen browse trail + independent mini-player + Full Feed.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildBrowseMenuTrail,
  clampBrowseTrailIndex,
  normalizeBrowseTrailRef,
} from "../src/lib/feedMenuBrowserTrail.js";
import { restaurantRefFromFeedItem } from "../src/lib/feedMenuLibrary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("buildBrowseMenuTrail unique restaurants from open clip through current", () => {
  const items = [
    { restaurant_id: "1", restaurant_name: "A", restaurant_slug: "a" },
    { restaurant_id: "2", restaurant_name: "B", restaurant_slug: "b" },
    { restaurant_id: "1", restaurant_name: "A again", restaurant_slug: "a" },
    { restaurant_id: "3", restaurant_name: "C", restaurant_slug: "c" },
  ];
  const trail = buildBrowseMenuTrail(items, 0, 3, restaurantRefFromFeedItem);
  assert.equal(trail.length, 3);
  assert.deepEqual(
    trail.map((r) => r.restaurant_id),
    ["1", "2", "3"]
  );
});

test("clampBrowseTrailIndex and normalizeBrowseTrailRef", () => {
  assert.equal(clampBrowseTrailIndex(9, 3), 2);
  assert.equal(clampBrowseTrailIndex(-1, 3), 0);
  assert.equal(normalizeBrowseTrailRef(null), null);
  assert.equal(normalizeBrowseTrailRef({ restaurant_id: "9" }).restaurant_id, "9");
});

test("Menu Browser overlay supports trail swipe + Full Feed", () => {
  const overlay = read("src/components/consumer/feed/FeedMenuBrowserPipOverlay.jsx");
  assert.match(overlay, /feed-menu-browser-pip/);
  assert.match(overlay, /Full Feed/);
  assert.match(overlay, /onTrailPrev/);
  assert.match(overlay, /onTrailNext/);
  assert.match(overlay, /feed-menu-browser-trail-next/);
  assert.match(overlay, /Swipe menus/);
  assert.match(overlay, /feed-menu-browser-switch/);
});

test("Feed reel wires browseSession trail + PiP video advance", () => {
  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /browseSession/);
  assert.match(reel, /buildBrowseMenuTrail/);
  assert.match(reel, /onBrowseTrailNext/);
  assert.match(reel, /feed-menu-browser-pip-next-video/);
  assert.match(reel, /feed-menu-browser-pip-full-feed/);
  assert.match(reel, /Keep browseSession locked|Do not clear browseSession/);
  assert.doesNotMatch(reel, /navigate\(menuPath\)/);
});

test("Deal reel mirrors trail + PiP video advance", () => {
  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(swipe, /browseSession/);
  assert.match(swipe, /buildBrowseMenuTrail/);
  assert.match(swipe, /feed-deals-pip-next-video/);
  assert.match(swipe, /feed-deals-pip-full-feed/);
  assert.match(swipe, /Keep browseSession locked/);
  assert.doesNotMatch(swipe, /navigate\(menuPath\)/);
});
