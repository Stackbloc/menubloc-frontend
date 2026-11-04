// Clip Manager: click-to-sort columns (Andre 2026-11-04) + links only sent when changed.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sortClipRows, CLIP_SORTABLE_KEYS } from "../src/lib/ownerClipSort.js";

const rows = [
  { video_id: "ate:10", asset_number: 3, restaurant_name: "Taco Stand", created_at: "2026-11-03T05:40:00Z" },
  { video_id: "ate:9", asset_number: 12, restaurant_name: null, created_at: "2026-11-01T00:00:00Z" },
  { video_id: "managed:2", asset_number: null, restaurant_name: "all burgers", created_at: "2026-11-04T00:00:00Z" },
];
const ids = (list) => list.map((r) => r.video_id);

test("no sort keeps server order", () => {
  assert.deepEqual(ids(sortClipRows(rows, null)), ["ate:10", "ate:9", "managed:2"]);
});

test("text sorts case-insensitively; blanks last both ways", () => {
  assert.deepEqual(ids(sortClipRows(rows, { key: "restaurant_name", dir: "asc" })), ["managed:2", "ate:10", "ate:9"]);
  assert.deepEqual(ids(sortClipRows(rows, { key: "restaurant_name", dir: "desc" })), ["ate:10", "managed:2", "ate:9"]);
});

test("numbers, dates and video ids sort numerically", () => {
  assert.deepEqual(ids(sortClipRows(rows, { key: "asset_number", dir: "asc" })), ["ate:10", "ate:9", "managed:2"]);
  assert.deepEqual(ids(sortClipRows(rows, { key: "asset_number", dir: "desc" })), ["ate:9", "ate:10", "managed:2"]);
  assert.deepEqual(ids(sortClipRows(rows, { key: "created_at", dir: "desc" })), ["managed:2", "ate:10", "ate:9"]);
  assert.deepEqual(ids(sortClipRows(rows, { key: "video_id", dir: "asc" })), ["ate:9", "ate:10", "managed:2"]);
});

test("every data column is sortable; Edit is not", () => {
  for (const key of ["restaurant_name", "menu_item_name", "creator", "settings", "created_at"]) {
    assert.ok(CLIP_SORTABLE_KEYS.includes(key), key);
  }
  assert.ok(!CLIP_SORTABLE_KEYS.includes("edit"));
});

test("page wires sorting; editor sends links only when changed", () => {
  const src = fs.readFileSync(new URL("../src/pages/owner/OwnerVideoCuration.jsx", import.meta.url), "utf8");
  assert.match(src, /sortableKeys=\{CLIP_SORTABLE_KEYS\}/);
  assert.match(src, /onSortChange=\{handleSortChange\}/);
  assert.match(src, /if \(placeTouched && supportsMenuItem\)/);
  const table = fs.readFileSync(new URL("../src/pages/owner/intelligence/intelligenceShared.jsx", import.meta.url), "utf8");
  assert.match(table, /aria-sort=/);
  const api = fs.readFileSync(new URL("../src/lib/foodActivityApi.js", import.meta.url), "utf8");
  assert.match(api, /if \(!rid\) throw err;/);
});
