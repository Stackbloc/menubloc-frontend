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
  assert.match(source, /data-testid="menu-item-detail-photo"/);
  assert.match(source, /width: isMobile \? 101 : 129/);
  assert.doesNotMatch(source, /showItemPhoto && isMobile/);
  assert.doesNotMatch(source, /minHeight:\s*320/);
});

test("MenuItemDetailPage compact VerdictBlock renders brief explanation", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /function resolveVerdictPresentation/);
  assert.match(source, /buildVerdictExplanation/);
  assert.match(source, /<VerdictBlock[\s\S]*compact/);
  assert.doesNotMatch(source, /if \(!nutritionComplete && compact\) return null/);
});

test("MenuItemDetailPage hides nutrition verdict only for alcoholic beverages", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /isAlcoholicBeverageItem/);
  assert.match(source, /showStickyVerdict && !isAlcoholicBeverage/);
  assert.match(source, /ResponsibleDrinkingNotice/);
  assert.match(source, /<NutritionInsightsCluster/);
  assert.match(source, /\{!isAlcoholicBeverage \? \([\s\S]*<ExploreSimilarDishes/);
});

test("MenuItemDetailPage accepts cmi: franchise route IDs", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /isValidMenuItemRouteId/);
  assert.doesNotMatch(source, /\/\\^\\d\+\\\$\/\.test\(String\(id\)\)/);
});

test("MenuItemDetailPage action rail includes save icon; no duplicate full-width add buttons", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /MenuItemDetailActionRail/);
  assert.doesNotMatch(source, /function StickyVerdictRail/);
  assert.match(source, /showSaveToMyMenuply/);
  assert.doesNotMatch(source, /<WhatIAteTodayAddButton/);
  assert.doesNotMatch(source, /<WantToEatAddButton/);
  const rail = source.indexOf("<MenuItemDetailActionRail");
  const verdict = source.indexOf("<VerdictBlock");
  assert.ok(rail >= 0 && verdict > rail, "compact VerdictBlock must remain after the action rail");
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
