/**
 * Dish photos on menu rows (Andre, 2026-10-28): the current row keeps its design and shows the
 * dish thumbnail when the restaurant's photo setting is on (default on). Menu Browser follows the
 * same setting instead of forcing photos off; owners flip it in Menu Manager.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shouldShowItemImages } from "../src/components/menu-templates/menuThemeSettings.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("photo setting: default on, owner off = none", () => {
  assert.equal(shouldShowItemImages({}), true);
  assert.equal(shouldShowItemImages({ item_image_style: "thumbnail" }), true);
  assert.equal(shouldShowItemImages({ item_image_style: "none" }), false);
});

test("Menu Browser rows follow the photo setting (no forced showImage={false})", () => {
  const src = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.doesNotMatch(src, /showImage=\{false\}/);
  assert.match(src, /showImage=\{shouldShowItemImages\(menuThemeSettings\)\}/);
});

test("owner Menu Manager shows the Show dish photos switch", () => {
  const editor = read("src/components/menuEditor/SharedMenuEditor.jsx");
  assert.match(editor, /api\.getMenuPhotos && api\.setMenuPhotos \? \(\s*<MenuPhotosSwitch/);
  const owner = read("src/pages/owner/ownerMenuEditorComponents.jsx");
  assert.match(owner, /getMenuPhotos: getMenuConsoleMenuPhotos/);
  assert.match(owner, /setMenuPhotos: setMenuConsoleMenuPhotos/);
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /\/restaurants\/\$\{encodeURIComponent\(restaurantId\)\}\/menu-photos/);
  const sw = read("src/components/menuEditor/MenuPhotosSwitch.jsx");
  assert.match(sw, /Show dish photos on menu/);
  assert.match(sw, /show_item_photos: next/);
});
