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
  assert.doesNotMatch(rail, /feed-rail-share/);
  assert.match(rail, /feed-rail-invite/);
  assert.match(rail, /feed-rail-clusters/);
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
  // Rail order: Wanna Go!, Invite, Like, Clusters, Menu Browser.
  const order = ["feed-rail-wanna-go", "feed-rail-invite", "feed-rail-like", "feed-rail-clusters", "feed-rail-menu\""]
    .map((id) => rail.indexOf(id));
  assert.ok(order.every((idx, i) => idx >= 0 && (i === 0 || idx > order[i - 1])));
});

test("Invite flow keeps an external Share entry point (link/text)", () => {
  const modal = read("src/components/InviteToEatModal.jsx");
  assert.match(modal, /invite-quick-share/);
  assert.match(modal, /quickShareData/);
  for (const rel of [
    "src/components/consumer/feed/DealVideoSwipe.jsx",
    "src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx",
  ]) {
    assert.match(read(rel), /quickShareData=\{/);
  }
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
