/**
 * Owner → Deals overview (2026-11-18, Andre): /owner/deals opens on the status + analytics view
 * of every deal, with search. The per-restaurant editor stays under "Manage by restaurant".
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Overview is the default /owner/deals view; Manage keeps the restaurant editor", () => {
  const page = read("src/pages/owner/OwnerDeals.jsx");
  assert.match(page, /const view = paramId \|\| searchParams\.get\("view"\) === "manage" \? "manage" : "overview";/);
  assert.match(page, /<OwnerDealsOverview/);
  assert.match(page, /<OwnerRestaurantDealsPanel/);
  assert.match(page, /<CkRestaurantMenuPicker/);
});

test("Overview reads the one overview endpoint and shows status, analytics and search", () => {
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /export const getOwnerDealsOverview = [\s\S]*?\/api\/owner\/deals\/overview\?days=/);
  const src = read("src/pages/owner/OwnerDealsOverview.jsx");
  for (const s of ["live", "scheduled", "paused", "draft", "ended"]) {
    assert.match(src, new RegExp(`${s}: \\{ label: "`));
  }
  assert.match(src, /getOwnerDealsOverview\(\{ days \}\)/);
  assert.match(src, /data-testid="deals-search"/);
  assert.match(src, /Not purchases or redemptions/);
  assert.match(src, /export function filterDeals/);
  assert.match(src, /words\.every\(\(w\) => text\.includes\(w\)\)/);
  assert.match(src, /deal\.restaurant_name/);
});
