/**
 * Deal eligible items contract — a deal's terms apply to up to 3 menu items
 * (menu_item_id + applies_to_menu_item_ids), each item individually. Combos are bundles.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mapDealRowToFeedVideoItem } from "../src/lib/feedDealVideos.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("feed mapping exposes eligible item names in order", () => {
  const item = mapDealRowToFeedVideoItem({
    id: 9,
    title: "20% off",
    video_url: "https://example.test/v.mp4",
    menu_item_id: 1,
    menu_item_name: "Tonkotsu",
    eligible_items: [
      { id: 1, name: "Tonkotsu" },
      { id: 2, name: "Shoyu" },
      { id: 3, name: " " },
      { id: 4, name: "Gyoza" },
    ],
  });
  assert.deepEqual(item.eligible_item_names, ["Tonkotsu", "Shoyu", "Gyoza"]);

  const legacy = mapDealRowToFeedVideoItem({ id: 10, title: "x", video_url: "https://example.test/v.mp4" });
  assert.deepEqual(legacy.eligible_item_names, []);
});

test("Feed reel shows all eligible items when more than one", () => {
  const src = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(src, /feed-deals-eligible-items/);
  assert.match(src, /eligible_item_names\.join\(" · "\)/);
});

test("deal detail lists the other items the deal applies to", () => {
  const src = read("src/pages/DealDetailPage.jsx");
  assert.match(src, /deal-detail-also-applies-to/);
  assert.match(src, /deal\.eligible_items\.slice\(1\)/);
});

test("owner deal video panel links up to 3 items from the deal menu", () => {
  const src = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(src, /const MAX_DEAL_MENU_ITEMS = 3;/);
  assert.match(src, /listOwnerDealMenuItems\(dealRestaurantId\)/);
  assert.match(src, /applies_to_menu_item_ids: dealItems\.slice\(1\)/);
  assert.match(src, /linked_items_source: dealMenu\.source/);
  // Upload wiring unchanged: create → upload video → publish.
  assert.match(src, /await uploadOwnerDealMediaVideo\(rid, dealId, file\)/);
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /\/api\/owner\/restaurants\/\$\{restaurantId\}\/deals\/menu-items/);
});

test("operator editor: 2 'also applies to' slots for non-combo deals; combos send none", () => {
  const src = read("src/pages/operator/OperatorDealsEditor.jsx");
  assert.match(src, /Also applies to \(item 2\)/);
  assert.match(src, /Also applies to \(item 3\)/);
  assert.match(src, /form\.deal_type !== "combo" && form\.menu_item_id/);
  assert.match(src, /form\.deal_type === "combo" \|\| !form\.menu_item_id\s*\?\s*\[\]/);
});
