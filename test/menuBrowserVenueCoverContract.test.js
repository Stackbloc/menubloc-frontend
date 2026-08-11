import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  buildMenuBrowserPages,
  getMenuBrowserVenueCover,
  resolveMenuBrowserVenueSlug,
} from "../src/lib/menuBrowserVenueCover.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const browseSrc = readFileSync(join(root, "src/pages/BrowseMenus.jsx"), "utf8");
const modeSrc = readFileSync(join(root, "src/components/menuCatalog/MenuCatalogModePage.jsx"), "utf8");

test("resolveMenuBrowserVenueSlug defaults and hosts", () => {
  assert.equal(resolveMenuBrowserVenueSlug(null), "la-live");
  assert.equal(resolveMenuBrowserVenueSlug("coachella-2027"), "coachella-2027");
  assert.equal(
    resolveMenuBrowserVenueSlug(null, { hostname: "venues.menuply.com" }),
    "coachella-2027"
  );
});

test("venue covers keep Food/Drinks prompt", () => {
  const la = getMenuBrowserVenueCover("la-live");
  const co = getMenuBrowserVenueCover("coachella-2027");
  assert.match(la.prompt, /browse/i);
  assert.match(co.prompt, /browse/i);
  assert.equal(la.foodLabel, "Food");
  assert.equal(co.drinksLabel, "Drinks");
});

test("buildMenuBrowserPages inserts a few sponsored pages", () => {
  const entries = Array.from({ length: 10 }, (_, i) => ({ restaurant_id: i + 1 }));
  const pages = buildMenuBrowserPages(entries, "la-live");
  const ads = pages.filter((p) => p.kind === "venue_ad");
  const menus = pages.filter((p) => p.kind === "menu");
  assert.equal(menus.length, 10);
  assert.ok(ads.length >= 2 && ads.length <= 3);
  assert.equal(pages[3].kind, "venue_ad");
});

test("BrowseMenus wires venue cover + ad pages", () => {
  assert.match(browseSrc, /venueSlug=\{venueSlug\}/);
  assert.match(browseSrc, /MenuBrowserVenueAdPage/);
  assert.match(browseSrc, /buildMenuBrowserPages/);
  assert.match(browseSrc, /isMenuBrowserClusterScope/);
  assert.match(modeSrc, /menu-browser-venue-cover/);
  assert.match(modeSrc, /menu-browser-choose-prompt/);
});
