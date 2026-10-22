/**
 * 2026-10-21 (Andre): one shared franchise profile + Find closest location, reels-size clips,
 * clip captions (restaurant → profile, dish → menu), menu-browsing PIP loops the restaurant's clips.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { queueNextRestaurantClip } from "../src/lib/feedMenuBrowserTrail.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("franchise store pages: no claim prompt, store-mode Find closest location", () => {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /const isFranchiseStore = Boolean\(data\?\.chain_id\) && data\?\.is_canonical_parent !== true/);
  assert.match(page, /!isFranchiseStore &&\s*!isClaimedRestaurant\(data\)/);
  assert.match(page, /<BrandLocationsSection\s+mode="store"/);
  const brand = read("src/components/restaurant/BrandLocationsSection.jsx");
  assert.match(brand, /if \(!coords && !storeMode\) askForLocation\(\)/);
  assert.match(brand, /Find closest location/);
  assert.match(brand, /restaurantPath\(\{ slug: loc\.slug, city: loc\.city, state: loc\.state \}\)/);
  const mle = read("src/components/restaurant/MleLocationsSection.jsx");
  assert.match(mle, /data-testid="find-closest-location"/);
  assert.match(mle, /params\.delete\("location"\)/);
});

test("profile clips use a reels-size grid", () => {
  const src = read("src/components/restaurant/publicProfile/ProfileVideosSection.jsx");
  assert.match(src, /repeat\(auto-fill, minmax\(min\(31%, 150px\), 1fr\)\)/);
  assert.doesNotMatch(src, /repeat\(3, minmax\(0, 1fr\)\)/);
});

test("menu-browsing PIP queues the same restaurant's next clip", () => {
  const ref = (it) => ({ restaurant_id: it.r });
  const feed = [{ id: 1, r: "A" }, { id: 2, r: "B" }, { id: 3, r: "A" }, { id: 4, r: "C" }];
  const next = queueNextRestaurantClip(feed, 0, ref);
  assert.equal(next.index, 1);
  assert.deepEqual(next.items.map((x) => x.id), [1, 3, 2, 4]);
  assert.equal(queueNextRestaurantClip(feed, 1, ref), null); // B has one clip → replay
  const feedSrc = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(feedSrc, /if \(menuBrowserOpen\) \{\s*playNextRestaurantClip\(\);/);
});

test("phone clip player is full-screen and autoplays (muted fallback), dish link separate", () => {
  const src = read("src/components/restaurant/publicProfile/ProfileVideosSection.jsx");
  assert.match(src, /data-layout=\{isDesktop \? "sheet" : "fullscreen"\}/);
  assert.match(src, /err\?\.name !== "NotAllowedError"/);
  assert.match(src, /Tap for sound/);
  assert.match(src, /data-testid="profile-video-dish-link"/);
  const card = read("src/components/search/SearchResultVideoCard.jsx");
  assert.match(card, /const dish = String\(video\?\.menu_item_name \|\| ""\)\.trim\(\);\s*if \(dish\) return dish;/);
});
