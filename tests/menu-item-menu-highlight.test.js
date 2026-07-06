import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  appendMenuHighlightQuery,
  menuItemDomId,
  MENU_ITEM_HIGHLIGHT_QUERY_KEY,
  highlightMenuLinkExtrasFromSearch,
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

test("highlightMenuLinkExtrasFromSearch preserves geo and q params", () => {
  const extras = highlightMenuLinkExtrasFromSearch(
    "?q=burgers&lat=34.02&lng=-118.24&radius_miles=8&city=Los+Angeles&state=CA&from=search",
  );
  assert.equal(extras.q, "burgers");
  assert.equal(extras.lat, "34.02");
  assert.equal(extras.city, "Los Angeles");
  assert.equal(extras.from, undefined);
});

test("SearchResultCard view-full-menu link includes highlightItem with search context", () => {
  const source = fs.readFileSync(
    new URL("../src/components/SearchResultCard.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /appendMenuHighlightQuery/);
  assert.match(source, /highlightMenuLinkExtrasFromSearch\(contextSearch\)/);
});

test("MenuItemDetailActionRail shows view menu alongside return-to-search", () => {
  const source = fs.readFileSync(
    new URL("../src/components/menu/MenuItemDetailActionRail.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /fromSearch && onBack/);
  assert.match(source, /fullMenuHref \?/);
  assert.doesNotMatch(source, /fromSearch \? \([\s\S]*\) : fullMenuHref \?/);
});

test("MenuItemDetailPage view-full-menu link includes highlightItem", () => {
  const source = fs.readFileSync(
    new URL("../src/pages/MenuItemDetailPage.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /appendMenuHighlightQuery/);
  assert.match(source, /menuItemId: item\.menu_item_id/);
  assert.match(source, /highlightMenuLinkExtrasFromSearch\(searchParams\)/);
});

test("menu highlight uses 7s green border without smooth scroll", () => {
  const hookSource = fs.readFileSync(
    new URL("../src/hooks/useMenuItemHighlight.js", import.meta.url),
    "utf8",
  );
  const cssSource = fs.readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
  assert.match(hookSource, /HIGHLIGHT_MS = 7000/);
  assert.match(hookSource, /behavior: "auto"/);
  assert.doesNotMatch(hookSource, /behavior: "smooth"/);
  assert.match(hookSource, /scheduleScrollUntilVisible/);
  assert.match(hookSource, /isElementVisiblyInViewport/);
  assert.match(cssSource, /\.menuply-menu-item-highlight[\s\S]*border: 2px solid #22c55e/);
  assert.match(hookSource, /reapplyActiveHighlight/);
  assert.doesNotMatch(
    hookSource,
    /return \(\) => \{[\s\S]*clearHighlight\(document\.getElementById/,
  );
});
