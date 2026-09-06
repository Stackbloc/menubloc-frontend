/**
 * Restaurant-scoped contextual video on independent menus (not Feed PiP).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("MenuRestaurantContextualVideo uses profile videos API only", () => {
  const src = read("src/components/menu/MenuRestaurantContextualVideo.jsx");
  assert.match(src, /listRestaurantProfileVideos/);
  assert.match(src, /menu-restaurant-contextual-video/);
  assert.doesNotMatch(src, /see-whos-eating/);
  assert.doesNotMatch(src, /listSeeWhosEating/);
});

test("CatalogMenuRenderer mounts contextual video; Feed PiP disables it", () => {
  const catalog = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(catalog, /MenuRestaurantContextualVideo/);
  assert.match(catalog, /enableRestaurantContextualVideo/);
  const overlay = read("src/components/consumer/feed/FeedMenuBrowserPipOverlay.jsx");
  assert.match(overlay, /enableRestaurantContextualVideo=\{false\}/);
});

test("PublicMenuPage mounts restaurant contextual video for search/menu opens", () => {
  const page = read("src/pages/PublicMenuPage.jsx");
  assert.match(page, /MenuRestaurantContextualVideo/);
});
