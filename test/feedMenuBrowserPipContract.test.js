/**
 * Feed Menu Browser PiP — frozen browse restaurant + independent mini-player.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Menu Browser overlay freezes browse restaurant and requires explicit switch", () => {
  const overlay = read("src/components/consumer/feed/FeedMenuBrowserPipOverlay.jsx");
  assert.match(overlay, /feed-menu-browser-pip/);
  assert.match(overlay, /CatalogMenuRenderer/);
  assert.match(overlay, /playingRestaurantRef/);
  assert.match(overlay, /onSwitchBrowseToPlaying/);
  assert.match(overlay, /feed-menu-browser-switch/);
  assert.match(overlay, /Browse this menu/);
  assert.match(overlay, /data-browse-restaurant-id/);
});

test("Feed reel keeps browseRestaurantRef across index changes", () => {
  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /browseRestaurantRef/);
  assert.match(reel, /setBrowseRestaurantRef/);
  assert.match(reel, /Keep browseRestaurantRef locked|Do not clear browseRestaurantRef/);
  assert.match(reel, /switchBrowseToPlaying/);
  assert.match(reel, /onSwitchBrowseToPlaying=\{switchBrowseToPlaying\}/);
  assert.match(reel, /playingRestaurantRef=\{restaurantRef\}/);
  assert.match(reel, /aria-label="Menu Browser"/);
  assert.doesNotMatch(reel, /navigate\(menuPath\)/);
});

test("Deal reel mirrors frozen Menu Browser PiP", () => {
  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(swipe, /browseRestaurantRef/);
  assert.match(swipe, /Keep browseRestaurantRef locked/);
  assert.match(swipe, /switchBrowseToPlaying/);
  assert.match(swipe, /FeedMenuBrowserPipOverlay/);
  assert.match(swipe, /aria-label="Menu Browser"/);
  assert.doesNotMatch(swipe, /navigate\(menuPath\)/);
  assert.doesNotMatch(swipe, /menuPathFromRestaurantRef/);
});
