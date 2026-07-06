import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  appendMenuHighlightQuery,
  menuItemDomId,
  MENU_ITEM_HIGHLIGHT_QUERY_KEY,
} from "../src/components/share/shareUtils.js";

test("appendMenuHighlightQuery adds highlightItem and preserves geo params", () => {
  const href = appendMenuHighlightQuery("/restaurants/california/los-angeles/yard-house-2/menu", {
    menuItemId: 13881,
    extraParams: { lat: "34.02", lng: "-118.24" },
  });
  const url = new URL(href, "https://menuply.com");
  assert.equal(url.pathname, "/restaurants/california/los-angeles/yard-house-2/menu");
  assert.equal(url.searchParams.get(MENU_ITEM_HIGHLIGHT_QUERY_KEY), "13881");
  assert.equal(url.searchParams.get("lat"), "34.02");
  assert.equal(url.searchParams.get("lng"), "-118.24");
});

test("menuItemDomId matches PublicMenuItemCard anchor id", () => {
  assert.equal(menuItemDomId(13881), "menu-item-13881");
  const cardSource = fs.readFileSync(
    new URL("../src/components/menu-templates/PublicMenuItemCard.jsx", import.meta.url),
    "utf8",
  );
  assert.match(cardSource, /id=\{menuItemDomId\(normalizedItemId\)/);
});

test("MenuItemDetailPage view-full-menu link includes highlightItem", () => {
  const source = fs.readFileSync(
    new URL("../src/pages/MenuItemDetailPage.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /appendMenuHighlightQuery/);
  assert.match(source, /menuItemId: item\.menu_item_id/);
});
