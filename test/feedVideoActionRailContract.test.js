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
  assert.doesNotMatch(rail, /feed-rail-clusters/);
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
  // Rail order: +Wish List, Invite, Like, Menu Browser (no Share, no Clusters).
  const order = ["feed-rail-wanna-go", "feed-rail-invite", "feed-rail-like", "feed-rail-menu\""]
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
  // Connect is not shown on the video screen (More → Connect Search instead).
  assert.match(reel, /showConnect=\{false\}/);
  assert.doesNotMatch(reel, /showRailConnect/);
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

test("Feed shell nav: Waiter + Share My QR are signed-in only; no Connects tab", () => {
  const links = read("src/lib/feedShellLinks.js");
  assert.match(links, /label: "Waiter", testId: "feed-nav-waiter", authOnly: true/);
  assert.match(links, /openShareQr: true,\s*authOnly: true/);
  assert.match(links, /export function visibleFeedTabs/);
  assert.doesNotMatch(links, /feed-guest-waiter-card/);
  const nav = read("src/components/consumer/feed/FeedPrimaryNav.jsx");
  assert.match(nav, /visibleFeedTabs\(FEED_LEFT_TABS, \{ isAuthenticated \}\)/);
  const rail = read("src/components/consumer/feed/FeedDesktopRail.jsx");
  assert.match(rail, /visibleFeedTabs\(FEED_RAIL_TABS_AFTER_HOME, \{ isAuthenticated \}\)/);
  const bottom = read("src/components/BottomNav.jsx");
  assert.match(bottom, /isAuthenticated \|\| !tab\.authOnly/);
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

test("+Wish List on every video; saves the dish when linked, else the restaurant", () => {
  const rail = read("src/components/consumer/feed/FeedVideoActionRail.jsx");
  assert.match(rail, /label=\{wannaDone \? "Added" : WISH_LIST_LABEL\}/);
  assert.match(rail, /const WISH_LIST_LABEL = "\+Wish List";/);
  assert.doesNotMatch(rail, /"Wanna Go!"|"Wanna Eat!"/);
  assert.match(rail, /const isDishVideo = linkedMenuItemId != null;/);
  assert.match(rail, /menu_item_id: linkedMenuItemId,\s*intent_kind: "menu_item"/);
  assert.match(rail, /intent_kind: "restaurant"/);
  assert.match(rail, /menu_item_not_found/);
  for (const rel of [
    "src/components/consumer/feed/DealVideoSwipe.jsx",
    "src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx",
  ]) {
    assert.match(read(rel), /menuItemId=\{inviteMenuItemId\}/);
  }
});

test("Feed videos: play/pause circle + Invite/Share holds playback", () => {
  for (const rel of [
    "src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx",
    "src/components/consumer/feed/DealVideoSwipe.jsx",
  ]) {
    const src = read(rel);
    assert.match(src, /FeedVideoPlayPauseButton/);
    assert.match(src, /const holdPlayback = userPaused \|\| inviteOpen;/);
    assert.match(src, /if \(holdPlayback\) \{\s*el\.pause\(\);/);
  }
  const btn = read("src/components/consumer/feed/FeedVideoPlayPauseButton.jsx");
  assert.match(btn, /aria-label=\{paused \? "Play video" : "Pause video"\}/);
});

test("Menu Browser mini player shows a play circle while the video is paused", () => {
  for (const rel of [
    "src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx",
    "src/components/consumer/feed/DealVideoSwipe.jsx",
  ]) {
    const src = read(rel);
    assert.match(src, /\{userPaused \? \(\s*\/\/[^\n]*\n\s*<FeedVideoPlayPauseButton\s+paused\s+onToggle=\{\(\) => setUserPaused\(false\)\}/);
  }
});
