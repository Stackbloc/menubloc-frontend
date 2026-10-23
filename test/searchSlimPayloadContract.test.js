/**
 * Slim search payload (2026-10-23): the page requests slim=1&defer_similar=1 and
 * loads similar-item availability for the dishes on screen after results render.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  applySimilarAvailabilityToSearchRows,
  collectVisibleSimilarUnknownIds,
} from "../src/lib/searchSlimPayload.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const dish = (id, extra = {}) => ({ row_type: "menu_item", menu_item_id: String(id), name: `D${id}`, ...extra });

function card() {
  const qualified = [dish(1), dish(2, { similar_availability: "available" }), dish(3), dish(4), dish(5), dish(6)];
  return { row_type: "restaurant", restaurant_id: 9, visible_count: 4, matches: qualified.slice(0, 4), qualified_matches: qualified };
}

// Same shape as the page's applySimilarAvailabilityToRows.
function applyToRows(rows, availability) {
  return rows.map((row) => {
    const id = String(row.menu_item_id);
    if (!(id in availability)) return row;
    const value = availability[id];
    if (value == null) return { ...row, has_similar_items: null, similar_availability: "unknown" };
    return { ...row, has_similar_items: value === true, similar_availability: value === true ? "available" : "none" };
  });
}

test("only visible dishes with unknown availability are requested", () => {
  const rows = [card(), dish(20), dish("cmi:77"), { row_type: "restaurant", restaurant_id: 5 }];
  assert.deepEqual(collectVisibleSimilarUnknownIds(rows), ["1", "3", "4", "20"]);
});

test("batch answer lands on visible and hidden copies of each dish", () => {
  const next = applySimilarAvailabilityToSearchRows([card(), dish(20)], { 1: true, 3: false, 20: null }, applyToRows);
  assert.equal(next[0].matches[0].similar_availability, "available");
  assert.equal(next[0].qualified_matches[0].similar_availability, "available");
  assert.equal(next[0].qualified_matches[2].similar_availability, "none");
  assert.equal(next[0].qualified_matches[4].similar_availability, undefined, "hidden dishes untouched until shown");
  assert.equal(next[1].similar_availability, "unknown");
  // Answered ids drop out; a null ("don't know") answer stays unknown — the page's
  // requested-id set keeps it from being asked again.
  assert.deepEqual(collectVisibleSimilarUnknownIds(next), ["4", "20"]);
});

test("search page requests the slim payload and loads availability after results", () => {
  const page = read("src/pages/GrubbidSearchResults.jsx");
  assert.match(page, /u\.searchParams\.set\("slim", "1"\)/);
  assert.match(page, /u\.searchParams\.set\("defer_similar", "1"\)/);
  assert.match(page, /similar_availability_preflight\?\.deferred !== true/);
  assert.match(page, /collectVisibleSimilarUnknownIds\(rows\)/);
  assert.match(page, /applySimilarAvailabilityToSearchRows\(prev, availability, applySimilarAvailabilityToRows\)/);
});
