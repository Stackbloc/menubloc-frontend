import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const DETAIL_PAGE = new URL("../src/pages/MenuItemDetailPage.jsx", import.meta.url);

test("MenuItemDetailPage sticky hero carries compact verdict (no duplicate rail)", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /position:\s*"sticky"/);
  assert.match(source, /showStickyVerdict/);
  assert.match(source, /<VerdictBlock[\s\S]*compact/);
  assert.doesNotMatch(source, /<StickyVerdictRail/);
});

test("MenuItemDetailPage compact VerdictBlock renders brief explanation", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /function resolveVerdictPresentation/);
  assert.match(source, /buildVerdictExplanation/);
  assert.match(source, /<VerdictBlock[\s\S]*compact/);
  assert.doesNotMatch(source, /if \(!nutritionComplete && compact\) return null/);
});

test("MenuItemDetailPage accepts cmi: franchise route IDs", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /isValidMenuItemRouteId/);
  assert.doesNotMatch(source, /\/\\^\\d\+\\\$\/\.test\(String\(id\)\)/);
});

test("MenuItemDetailPage action rail remains in hero (no duplicate full-menu CTA in removed rail)", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /MenuItemDetailActionRail/);
  assert.doesNotMatch(source, /function StickyVerdictRail/);
});

test("canonical menu item URLs with numeric itemSlug route to MenuItemDetailPage", () => {
  const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const routeSource = fs.readFileSync(new URL("../src/pages/MenuItemCanonicalRoute.jsx", import.meta.url), "utf8");
  const detailSource = fs.readFileSync(DETAIL_PAGE, "utf8");

  assert.match(appSource, /restaurants\/:state\/:city\/:restaurantSlug\/menu-items\/:itemSlug[\s\S]*MenuItemCanonicalRoute/);
  assert.match(routeSource, /isValidMenuItemRouteId\(itemSlug\)/);
  assert.match(routeSource, /<MenuItemDetailPage/);
  assert.match(detailSource, /const id = routeId \?\? itemSlug/);
});
