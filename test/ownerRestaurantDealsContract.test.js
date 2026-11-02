/**
 * Restaurant Manager → Deals (2026-10-24, Andre): owner enters structured deals for a specific
 * restaurant and attaches deal videos. Nav item under Restaurant Manager, own page, and a
 * Deals section on each restaurant in the Restaurant Manager workspace.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Deals sits under Restaurant Manager in the owner nav and has a route", () => {
  const layout = read("src/pages/owner/OwnerLayout.jsx");
  const section = layout.match(/id: "restaurant-manager"[\s\S]*?\]/)[0];
  assert.match(section, /\{ to: "\/owner\/deals", label: "Deals" \}/);
  const app = read("src/App.jsx");
  assert.match(app, /<Route path="\/owner\/deals" element=\{[^\n]*<OwnerRoute><OwnerDeals \/><\/OwnerRoute>/);
});

test("Restaurant Manager workspace has a Deals section using the shared panel", () => {
  const ws = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
  assert.match(ws, /\{ key: "deals", label: "Deals" \}/);
  assert.match(ws, /section === "deals" \? \(\s*<OwnerRestaurantDealsPanel key=\{rid\} restaurantId=\{rid\}/);
});

test("Deals panel: structured terms, items, dates, meal time, optional video, row actions", () => {
  const src = read("src/pages/owner/OwnerRestaurantDealsPanel.jsx");
  for (const type of ["percent_off", "amount_off", "fixed_price", "bogo", "combo", "other"]) {
    assert.match(src, new RegExp(`value: "${type}"`));
  }
  assert.match(src, /listOwnerDealMenuItems\(rid\)/);
  assert.match(src, /linked_items_source: menu\.source/);
  assert.match(src, /applies_to_menu_item_ids: form\.dealType === "combo" \? \[\]/);
  // Video attaches only to complete written terms, uploaded after the deal is saved.
  assert.match(src, /if \(wantsVideo && termsProblem\)/);
  assert.match(src, /await uploadOwnerDealMediaVideo\(restaurantId, saved\.id, videoFile\)/);
  // Structured deals publish without a video; Clip Manager keeps the video requirement.
  assert.match(src, /publishOwnerDeal\(rid, deal\.id, \{ require_video: false \}\)/);
  assert.match(src, /pauseOwnerDeal\(rid, deal\.id\)/);
  assert.match(src, /removeOwnerDeal\(rid, deal\.id\)/);
  const clip = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(clip, /await publishOwnerDeal\(rid, dealId\);/);
});

test("owner deal API helpers hit the owner deal routes", () => {
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /export const publishOwnerDeal = \(restaurantId, dealId, body = \{\}\) =>/);
  assert.match(api, /post\(`\/api\/owner\/restaurants\/\$\{restaurantId\}\/deals\/\$\{dealId\}\/pause`/);
  assert.match(api, /del\(`\/api\/owner\/restaurants\/\$\{restaurantId\}\/deals\/\$\{dealId\}`\)/);
});
