/**
 * Feed Menu Browser PiP — trail + side-arrow video advance + menu sync (no Full Feed banner).
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

test("Menu Browser overlay: trail swipe, close to Feed, highlight wiring — no Full Feed banner", () => {
  const overlay = read("src/components/consumer/feed/FeedMenuBrowserPipOverlay.jsx");
  assert.match(overlay, /feed-menu-browser-pip/);
  assert.match(overlay, /Return to Feed/);
  assert.match(overlay, /onTrailPrev/);
  assert.match(overlay, /onTrailNext/);
  assert.match(overlay, /feed-menu-browser-trail-next/);
  assert.match(overlay, /highlightMenuItemId/);
  assert.doesNotMatch(overlay, /Full Feed/);
  assert.doesNotMatch(overlay, /feed-menu-browser-switch/);
  assert.doesNotMatch(overlay, /Browse this menu/);
});

test("Feed reel: browseSession trail + PiP side arrows + mute + menu sync on advance", () => {
  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /browseSession/);
  assert.match(reel, /buildBrowseMenuTrail/);
  assert.match(reel, /onBrowseTrailNext/);
  assert.match(reel, /feed-menu-browser-pip-next-video/);
  assert.match(reel, /pipSideArrows/);
  assert.match(reel, /pipMuteBtn/);
  assert.match(reel, /see-whos-eating-pip-sound-toggle/);
  assert.match(reel, /highlightMenuItemId/);
  assert.match(reel, /menu syncs to playing restaurant/);
  assert.doesNotMatch(reel, /feed-menu-browser-pip-full-feed/);
  assert.doesNotMatch(reel, /Full Feed/);
  assert.match(reel, /Keep browseSession locked|Do not clear browseSession/);
  assert.doesNotMatch(reel, /navigate\(menuPath\)/);
});

test("CatalogMenuRenderer wires useMenuItemHighlight for Feed PiP dish frame", () => {
  const catalog = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(catalog, /useMenuItemHighlight/);
  assert.match(catalog, /highlightMenuItemId/);
});

test("Feed nav Menu Browser tab uses openFeedMenuBrowser flag", () => {
  const links = read("src/lib/feedShellLinks.js");
  assert.match(links, /label: "Menu Browser"/);
  assert.match(links, /openFeedMenuBrowser:\s*true/);
  assert.doesNotMatch(links, /My Menu Stack/);
});

test("Feed nav Menu Browser dispatches same PiP open as yellow video icon", () => {
  const navHelper = read("src/lib/feedMenuBrowserNav.js");
  assert.match(navHelper, /OPEN_FEED_MENU_BROWSER_EVENT/);
  assert.match(navHelper, /requestOpenFeedMenuBrowser/);
  const primary = read("src/components/consumer/feed/FeedPrimaryNav.jsx");
  assert.match(primary, /requestOpenFeedMenuBrowser/);
  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /OPEN_FEED_MENU_BROWSER_EVENT/);
  const deals = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(deals, /OPEN_FEED_MENU_BROWSER_EVENT/);
});

test("Deal reel mirrors PiP side arrows + mute + menu sync", () => {
  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(swipe, /browseSession/);
  assert.match(swipe, /buildBrowseMenuTrail/);
  assert.match(swipe, /feed-deals-pip-next-video/);
  assert.match(swipe, /pipSideArrows/);
  assert.match(swipe, /pipMuteBtn/);
  assert.match(swipe, /highlightMenuItemId/);
  assert.doesNotMatch(swipe, /feed-deals-pip-full-feed/);
  assert.doesNotMatch(swipe, /Full Feed/);
  assert.match(swipe, /Keep browseSession locked/);
  assert.doesNotMatch(swipe, /navigate\(menuPath\)/);
});
