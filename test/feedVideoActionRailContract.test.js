/**
 * Live Feed right action rail — Wanna go · Share · Invite · Like · Menu · Waiter.
 * Dedupes legacy Share & Invite + Menu Browser dock icons.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFeedDealShareData } from "../src/lib/feedShare.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("FeedVideoActionRail exposes Waiter at bottom, not Connect", () => {
  const rail = read("src/components/consumer/feed/FeedVideoActionRail.jsx");
  assert.match(rail, /feed-rail-waiter/);
  assert.match(rail, /WaiterFaceIcon/);
  assert.match(rail, /navigate\("\/waiter"\)/);
  assert.match(rail, /feed-rail-wanna-go/);
  assert.match(rail, /feed-rail-share/);
  assert.match(rail, /feed-rail-invite/);
  assert.match(rail, /feed-rail-like/);
  assert.match(rail, /feed-rail-menu/);
  assert.doesNotMatch(rail, /feed-rail-connect/);
  assert.doesNotMatch(rail, /showConnect/);
  // Waiter appears after Menu in source order
  const menuIdx = rail.indexOf("feed-rail-menu");
  const waiterIdx = rail.indexOf("feed-rail-waiter");
  assert.ok(menuIdx >= 0 && waiterIdx > menuIdx);
});

test("feed home fullscreen mounts rail and removes duplicate share/invite/menu dock", () => {
  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /FeedVideoActionRail/);
  assert.match(reel, /feed-video-action-rail|FeedVideoActionRail/);
  assert.match(reel, /flowTitle="Invite to Eat"/);
  assert.doesNotMatch(reel, /feed-video-share-invite/);
  assert.doesNotMatch(reel, /feed-video-yellow-browser/);
  assert.doesNotMatch(reel, /see-whos-eating-share-wrap/);
  assert.doesNotMatch(reel, /Share & Invite/);
  // Screen name still supports Connect request (not a rail icon)
  assert.match(reel, /requestConnection/);
  assert.match(reel, /onScreenNameClick/);
});

test("feed deals swipe mounts rail and removes duplicate share/invite/menu dock", () => {
  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(swipe, /FeedVideoActionRail/);
  assert.match(swipe, /buildFeedDealShareData/);
  assert.match(swipe, /flowTitle="Invite to Eat"/);
  assert.doesNotMatch(swipe, /feed-deals-share-invite/);
  assert.doesNotMatch(swipe, /feed-deals-yellow-browser/);
  assert.doesNotMatch(swipe, /Share & Invite/);
  assert.doesNotMatch(swipe, /BrowseMenusIcon/);
});

test("buildFeedDealShareData locks menuply.com", () => {
  const data = buildFeedDealShareData({
    deal_id: "d1",
    title: "2 for 1",
    restaurant_name: "Domino's",
  });
  assert.ok(data);
  assert.match(data.url, /^https:\/\/menuply\.com\/feed\/deals\?deal=/);
  assert.match(data.text, /Domino/);
});
