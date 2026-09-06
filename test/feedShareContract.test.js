/**
 * Feed video share + shared-clip deep links — menuply.com locked.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFeedVideoShareData,
  feedClipSharePath,
  feedClipShareUrl,
  feedDealSharePath,
  feedDealShareUrl,
  resolveFeedClipStartIndex,
  resolveFeedDealStartIndex,
} from "../src/lib/feedShare.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("feed clip share URLs use menuply.com and clip query param", () => {
  assert.equal(feedClipSharePath("ate:42"), "/feed?clip=ate%3A42");
  assert.equal(feedClipShareUrl("ate:42"), "https://menuply.com/feed?clip=ate%3A42");
});

test("buildFeedVideoShareData includes account invitation", () => {
  const data = buildFeedVideoShareData({
    id: "ate:99",
    kind: "ate",
    item_name: "Double-Double",
    diner: { display_name: "Andre Barber" },
  });
  assert.ok(data);
  assert.match(data.url, /^https:\/\/menuply\.com\/feed\?clip=/);
  assert.match(data.text, /Double-Double/);
  assert.match(data.text, /Open a free Menuply account/);
  assert.match(data.text, /menuply\.com\/diner\/signup/);
});

test("resolveFeedClipStartIndex finds shared clip in feed list", () => {
  const items = [{ id: "ate:1" }, { id: "want:2" }, { id: "ate:3" }];
  assert.equal(resolveFeedClipStartIndex(items, "want:2"), 1);
  assert.equal(resolveFeedClipStartIndex(items, "missing"), 0);
});

test("feed home + fullscreen wire clip deep link and share affordance", () => {
  const home = read("src/pages/consumer/feed/FeedHomePage.jsx");
  assert.match(home, /useSearchParams/);
  assert.match(home, /sharedClipId/);
  assert.match(home, /showSharedAccountInvite/);
  assert.match(home, /resolveFeedClipStartIndex/);

  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /buildFeedVideoShareData/);
  assert.match(reel, /see-whos-eating-share-wrap/);
  assert.match(reel, /feed-shared-clip-account-invite/);
  assert.match(reel, /feed-video-share-invite/);
  assert.match(reel, /feed-video-yellow-browser/);
  assert.match(reel, /BrowseMenusIcon/);
  assert.match(reel, /FeedMenuBrowserPipOverlay/);
  assert.match(reel, /browseRestaurantRef/);
  assert.match(reel, /aria-label="Menu Browser"/);
  assert.match(reel, /Share & Invite/);
  assert.match(reel, /InviteToEatModal/);
  assert.match(reel, /videoShareUrl/);
  assert.match(reel, /Let's try this out!/);
});

test("feed deals deep link helpers use menuply.com and deal query param", () => {
  assert.equal(feedDealSharePath("deal-9"), "/feed/deals?deal=deal-9");
  assert.equal(feedDealShareUrl("deal-9"), "https://menuply.com/feed/deals?deal=deal-9");
  const items = [{ id: "a", deal_id: "a" }, { id: "b", deal_id: "b" }];
  assert.equal(resolveFeedDealStartIndex(items, "b"), 1);
  assert.equal(resolveFeedDealStartIndex(items, "missing"), 0);
});

test("feed deals page + swipe wire Share & Invite with video link", () => {
  const page = read("src/pages/consumer/feed/FeedDealsPage.jsx");
  assert.match(page, /useSearchParams/);
  assert.match(page, /sharedDealId/);
  assert.match(page, /resolveFeedDealStartIndex/);
  assert.match(page, /startIndex=\{startIndex\}/);

  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(swipe, /feed-deals-share-invite/);
  assert.match(swipe, /feed-deals-yellow-browser/);
  assert.match(swipe, /BrowseMenusIcon/);
  assert.match(swipe, /FeedMenuBrowserPipOverlay/);
  assert.match(swipe, /browseRestaurantRef/);
  assert.match(swipe, /aria-label="Menu Browser"/);
  assert.match(swipe, /Share & Invite/);
  assert.match(swipe, /InviteToEatModal/);
  assert.match(swipe, /feedDealShareUrl/);
  assert.match(swipe, /Let's try this out!/);
});

test("feed shell profile share shows QR first then optional Share link", () => {
  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shell, /FeedShareMyMenuplySheet/);
  assert.match(shell, /handleShareMyMenuply/);

  const shareSheet = read("src/components/consumer/feed/FeedShareMyMenuplySheet.jsx");
  assert.match(shareSheet, /getMyDinerQr/);
  assert.match(shareSheet, /buildDinerQrShareData/);
  assert.match(shareSheet, /ShareModal/);
  assert.match(shareSheet, /feed-share-my-menuply-qr/);
  assert.match(shareSheet, /feed-share-my-menuply-link/);
  assert.match(shareSheet, /Share link/);
});
