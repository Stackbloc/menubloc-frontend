/**
 * Yellow Browse — Bookmarked Menus + search intent contract.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MENU_CATALOG_TABS,
  isMenuCatalogPersonalSection,
  MENU_CATALOG_BROWSE_SECTION_IDS,
} from "../src/lib/menuCatalogCategories.js";
import {
  resolveMenuBrowserSearchIntent,
  MENU_BROWSER_EXPLORE_CHIPS,
} from "../src/lib/menuBrowserSearchIntent.js";
import {
  applyBookmarkToggle,
  createEmptyLibrary,
  applyRecordOpen,
} from "../src/lib/feedMenuLibrary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Yellow Browse tabs include Bookmarked and Recently Viewed first", () => {
  assert.equal(MENU_CATALOG_TABS[0].id, "bookmarked");
  assert.equal(MENU_CATALOG_TABS[1].id, "recent_viewed");
  assert.equal(isMenuCatalogPersonalSection("bookmarked"), true);
  assert.equal(isMenuCatalogPersonalSection("italian"), false);
});

test("cuisine search intents map to existing browse_section ids", () => {
  assert.deepEqual(resolveMenuBrowserSearchIntent("Italian"), {
    kind: "section",
    sectionId: "italian",
    q: "Italian",
  });
  assert.equal(resolveMenuBrowserSearchIntent("sushi").sectionId, "sushi");
  assert.equal(resolveMenuBrowserSearchIntent("burgers").sectionId, "burgers");
  assert.equal(resolveMenuBrowserSearchIntent("pizza").sectionId, "pizza");
  assert.equal(resolveMenuBrowserSearchIntent("vegetarian").sectionId, "vegetarian");
  assert.equal(resolveMenuBrowserSearchIntent("Korean").sectionId, "asian");
  assert.equal(resolveMenuBrowserSearchIntent("tacos").sectionId, "mexican");
  for (const chip of MENU_BROWSER_EXPLORE_CHIPS) {
    const intent = resolveMenuBrowserSearchIntent(chip.query);
    assert.ok(intent.kind === "section" || intent.kind === "search");
    if (intent.kind === "section") {
      assert.ok(MENU_CATALOG_BROWSE_SECTION_IDS.has(intent.sectionId));
    }
  }
});

test("unknown food queries fall through to global search", () => {
  const intent = resolveMenuBrowserSearchIntent("best pad thai near me");
  assert.equal(intent.kind, "search");
  assert.match(intent.q, /pad thai/i);
});

test("Save Menu library entries are the Bookmarked source (restaurant_id)", () => {
  const now = 1_700_000_000_000;
  const ref = {
    restaurant_id: "14018",
    restaurant_name: "Fixins",
    slug: "fixins",
    city: "Los Angeles",
    state: "CA",
  };
  const { library, bookmarked } = applyBookmarkToggle(createEmptyLibrary(), ref, now);
  assert.equal(bookmarked, true);
  assert.equal(library.saved[0].restaurant_id, "14018");
  const opened = applyRecordOpen(createEmptyLibrary(), ref, now);
  assert.equal(opened.recent[0].restaurant_id, "14018");
});

test("BrowseMenus wires search, personal sections, and Save Menu library", () => {
  const page = read("src/pages/BrowseMenus.jsx");
  const hook = read("src/hooks/useMenuCatalogSequence.js");
  const search = read("src/components/menuCatalog/MenuCatalogBrowseSearch.jsx");
  const classic = read("src/components/menu-templates/ClassicMenuTemplate.jsx");

  assert.match(page, /MenuCatalogBrowseSearch/);
  assert.match(page, /bookmarked/);
  assert.match(page, /recent_viewed/);
  assert.match(page, /recordFeedMenuOpen/);
  assert.match(page, /navigateBrowseSearch/);
  assert.match(page, /\/search\?/);
  assert.match(hook, /readFeedMenuLibrary/);
  assert.match(hook, /isMenuCatalogPersonalSection/);
  assert.match(hook, /bookmarked/);
  assert.match(search, /menu-browser-search/);
  assert.match(classic, /InviteToEatButton/);
  assert.match(classic, /restaurantId=\{currentRestaurantId\}/);
});

test("Feed Save menu still uses feedMenuLibrary (no duplicate store)", () => {
  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /toggleFeedMenuBookmark/);
  assert.match(reel, /Save menu/);
  assert.doesNotMatch(reel, /saved_menus/);
});
