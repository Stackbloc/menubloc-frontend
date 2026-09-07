/**
 * Live Feed mobile right action rail — Connect first; no Waiter on rail.
 * Desktop keeps Share & Invite dock. Nav Connects → Waiter.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFeedDealShareData } from "../src/lib/feedShare.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("FeedVideoActionRail: Connect first, no Waiter on rail", () => {
  const rail = read("src/components/consumer/feed/FeedVideoActionRail.jsx");
  assert.match(rail, /feed-rail-connect/);
  assert.match(rail, /feed-rail-wanna-go/);
  assert.match(rail, /feed-rail-share/);
  assert.match(rail, /feed-rail-invite/);
  assert.match(rail, /feed-rail-like/);
  assert.match(rail, /feed-rail-menu/);
  assert.match(rail, /WannaGoPlateIcon/);
  assert.match(rail, /"Added"/);
  assert.doesNotMatch(rail, /"Saved"/);
  assert.doesNotMatch(rail, /feed-rail-waiter/);
  assert.doesNotMatch(rail, /WaiterFaceIcon/);
  assert.doesNotMatch(rail, /navigate\("\/waiter"\)/);
  const connectIdx = rail.indexOf("feed-rail-connect");
  const wannaIdx = rail.indexOf("feed-rail-wanna-go");
  assert.ok(connectIdx >= 0 && wannaIdx > connectIdx);
});

test("feed home: mobile rail + desktop Share & Invite dock", () => {
  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /useMobileActionRail/);
  assert.match(reel, /FeedVideoActionRail/);
  assert.match(reel, /showRailConnect/);
  assert.match(reel, /see-whos-eating-share-wrap/);
  assert.match(reel, /feed-video-share-invite/);
  assert.match(reel, /feed-video-yellow-browser/);
  assert.match(reel, /Share & Invite/);
  assert.match(reel, /Invite to Eat/);
  assert.match(reel, /requestConnection/);
});

test("feed deals: mobile rail + desktop Share & Invite dock", () => {
  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(swipe, /useMobileActionRail/);
  assert.match(swipe, /FeedVideoActionRail/);
  assert.match(swipe, /feed-deals-share-invite/);
  assert.match(swipe, /feed-deals-yellow-browser/);
  assert.match(swipe, /Share & Invite/);
  assert.match(swipe, /buildFeedDealShareData/);
});

test("Feed shell nav replaces Connects tab with Waiter", () => {
  const links = read("src/lib/feedShellLinks.js");
  assert.match(links, /label: "Waiter"/);
  assert.match(links, /to: "\/waiter"/);
  assert.match(links, /feed-nav-waiter/);
  assert.doesNotMatch(links, /label: "Connects"/);
  assert.doesNotMatch(links, /feed-nav-connects/);
});

test("buildFeedDealShareData locks menuply.com", () => {
  const data = buildFeedDealShareData({
    deal_id: "d1",
    title: "2 for 1",
    restaurant_name: "Domino's",
  });
  assert.ok(data);
  assert.match(data.url, /^https:\/\/menuply\.com\/feed\/deals\?deal=/);
});
