/**
 * Owner menu-item pickers list a restaurant's full menu, and Video Manager deal videos
 * edit up to 3 "applies to" items (saved through the owner deal endpoint with source).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("CK menu picker loads the restaurant's full menu once and filters locally", () => {
  const src = read("src/components/ck/CkRestaurantMenuPicker.jsx");
  assert.match(src, /const FULL_MENU_LIMIT = 500;/);
  assert.match(src, /limit: FULL_MENU_LIMIT/);
  assert.match(src, /menuDishes\.filter\(\(row\) => dishLabel\(row\)\.toLowerCase\(\)\.includes\(q\)\)/);
  assert.doesNotMatch(src, /limit: 20,/);
});

test("deal items picker lists every item without typing", () => {
  const src = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(src, /\(!q \|\| String\(i\.name \|\| ""\)\.toLowerCase\(\)\.includes\(q\)\)/);
  assert.match(src, /owner-deal-menu-item-list/);
  assert.doesNotMatch(src, /\.slice\(0, 8\)/);
});

test("Video Manager editor: deal videos use the 3-item picker and save via the deal", () => {
  const src = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(src, /const isDealVideo = video\.video_kind === "deal";/);
  // Single CK dish picker no longer used for deals.
  const supports = src.match(/const supportsMenuItem =[\s\S]*?;/)[0];
  assert.doesNotMatch(supports, /"deal"/);
  assert.match(src, /listOwnerDealMenuItems\(dealRestaurantId\), listOwnerDeals\(dealRestaurantId\)/);
  assert.match(src, /await updateOwnerDeal\(dealRestaurantId, video\.video_source_id, \{/);
  assert.match(src, /linked_items_source: dealMenu\.source/);
  // Unchanged restaurant is not re-sent (that would clear the deal's items).
  assert.match(src, /if \(supportsRestaurant && \(!isDealVideo \|\| dealRestaurantChanged\)\)/);
});
