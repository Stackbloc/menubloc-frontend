/**
 * Feed Menus library contract — saved + 48h recents deck.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RECENT_TTL_MS,
  applyBookmarkToggle,
  applyRecordOpen,
  applyRemoveSaved,
  buildFeedMenuDeck,
  createEmptyLibrary,
  purgeExpiredRecent,
  restaurantRefFromFeedItem,
} from "../src/lib/feedMenuLibrary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const REF_A = {
  restaurant_id: "101",
  restaurant_name: "Northern Cafe",
  slug: "northern-cafe",
  city: "Los Angeles",
  state: "CA",
};

const REF_B = {
  restaurant_id: "202",
  restaurant_name: "Fixins",
  slug: "fixins",
  city: "Los Angeles",
  state: "CA",
};

test("restaurantRefFromFeedItem prefers referenced_restaurant", () => {
  const ref = restaurantRefFromFeedItem({
    referenced_restaurant: {
      id: 55,
      name: "In-N-Out",
      slug: "in-n-out-burger",
    },
    restaurant_city: "Los Angeles",
    restaurant_state: "CA",
  });
  assert.equal(ref.restaurant_id, "55");
  assert.equal(ref.restaurant_name, "In-N-Out");
  assert.equal(ref.slug, "in-n-out-burger");
});

test("bookmark toggle adds then removes saved tier", () => {
  const now = 1_700_000_000_000;
  const first = applyBookmarkToggle(createEmptyLibrary(), REF_A, now);
  assert.equal(first.bookmarked, true);
  assert.equal(first.library.saved.length, 1);

  const second = applyBookmarkToggle(first.library, REF_A, now);
  assert.equal(second.bookmarked, false);
  assert.equal(second.library.saved.length, 0);
});

test("record open adds recent with 48h expiry when not saved", () => {
  const now = 1_700_000_000_000;
  const lib = applyRecordOpen(createEmptyLibrary(), REF_A, now);
  assert.equal(lib.recent.length, 1);
  assert.equal(lib.recent[0].expires_at, now + RECENT_TTL_MS);
});

test("record open refreshes saved last_opened_at without duplicating recent", () => {
  const now = 1_700_000_000_000;
  let lib = applyBookmarkToggle(createEmptyLibrary(), REF_A, now).library;
  lib = applyRecordOpen(lib, REF_A, now + 1000);
  assert.equal(lib.saved.length, 1);
  assert.equal(lib.saved[0].last_opened_at, now + 1000);
  assert.equal(lib.recent.length, 0);
});

test("buildFeedMenuDeck orders saved before recent and dedupes", () => {
  const now = 1_700_000_000_000;
  let lib = applyBookmarkToggle(createEmptyLibrary(), REF_A, now).library;
  lib = applyRecordOpen(lib, REF_B, now);
  lib = applyRecordOpen(lib, REF_A, now + 500);
  const deck = buildFeedMenuDeck(lib, now + 500);
  assert.equal(deck.length, 2);
  assert.equal(deck[0].restaurant_id, "101");
  assert.equal(deck[0].tier, "saved");
  assert.equal(deck[1].restaurant_id, "202");
  assert.equal(deck[1].tier, "recent");
});

test("purgeExpiredRecent drops stale recent rows", () => {
  const now = 1_700_000_000_000;
  const lib = {
    version: 1,
    saved: [],
    recent: [
      { restaurant_id: "9", expires_at: now - 1, last_opened_at: now - RECENT_TTL_MS },
      { restaurant_id: "8", expires_at: now + 1000, last_opened_at: now },
    ],
  };
  const cleaned = purgeExpiredRecent(lib, now);
  assert.equal(cleaned.recent.length, 1);
  assert.equal(cleaned.recent[0].restaurant_id, "8");
});

test("applyRemoveSaved removes only saved tier row", () => {
  const now = 1_700_000_000_000;
  let lib = applyBookmarkToggle(createEmptyLibrary(), REF_A, now).library;
  lib = applyRecordOpen(lib, REF_B, now);
  lib = applyRemoveSaved(lib, REF_A.restaurant_id);
  assert.equal(lib.saved.length, 0);
  assert.equal(lib.recent.length, 1);
});

test("Feed Menus page + nav contract strings", () => {
  const nav = read("src/components/consumer/feed/FeedPrimaryNav.jsx");
  assert.match(nav, /\/feed\/menus/);
  assert.match(nav, /feed-nav-menus/);
  assert.match(nav, /Menus/);
  assert.doesNotMatch(nav, /feed-nav-eating/);

  const app = read("src/App.jsx");
  assert.match(app, /FeedMenusPage/);
  assert.match(app, /path="menus"/);
  assert.match(app, /Navigate to="\/feed\/menus"/);

  const page = read("src/pages/consumer/feed/FeedMenusPage.jsx");
  assert.match(page, /feed-menus/);
  assert.match(page, /CatalogMenuRenderer/);
  assert.match(page, /feed-menus-bookmark/);

  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /see-whos-eating-menu-bookmark/);
  assert.match(reel, /recordFeedMenuOpen/);
});
