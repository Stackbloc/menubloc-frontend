import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const DETAIL_PAGE = new URL("../src/pages/MenuItemDetailPage.jsx", import.meta.url);

test("MenuItemDetailPage mounts StickyVerdictRail on desktop when verdict is eligible", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /<StickyVerdictRail[\s\S]*detailSystem=\{detailSystem\}/);
  assert.match(source, /position:\s*"sticky"/);
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
