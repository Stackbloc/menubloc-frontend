/**
 * Unified basket (Andre, 2026-10-22; Menuply Design System): one-restaurant warning keeps the
 * current basket by default; basket bar says restaurant · count · total · View basket.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REMAINING_COVERAGE_LABELS as L } from "../src/i18n/remainingCoverageLabels.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("warning: keep is the main, focused button; start new names the dish", () => {
  const modal = read("src/components/basket/ReplaceCartModal.jsx");
  assert.match(modal, /onClick=\{onKeep\} style=\{keepButtonStyle\} autoFocus/);
  assert.match(modal, /keepButtonStyle = \{[\s\S]*?background: "var\(--mp-accent\)"/);
  assert.match(modal, /onClick=\{onReplace\} style=\{startNewButtonStyle\}/);
  assert.match(read("src/context/OrderCartContext.jsx"), /dishName=\{pendingReplacement\?\.item\?\.name\}/);
});

test("warning wording in every language has the placeholders", () => {
  for (const lang of ["en", "es", "zh"]) {
    assert.match(L[lang]["basket.replace.title"], /\{restaurant\}/, lang);
    assert.match(L[lang]["basket.replace.keep"], /\{restaurant\}/, lang);
    assert.match(L[lang]["basket.replace.clear"], /\{dish\}/, lang);
    assert.ok(L[lang]["basket.viewBasket"], lang);
  }
  assert.equal(L.en["basket.replace.keep"], "Keep my {restaurant} basket");
  assert.equal(L.en["basket.replace.clear"], "Start new basket with {dish}");
});

test("basket bar: restaurant heading and View basket on menus", () => {
  const bar = read("src/components/basket/BasketSummaryBar.jsx");
  assert.match(bar, /t\("basket\.viewBasket", "View basket"\)/);
  assert.match(bar, /restaurantName \|\| t\("basket\.heading", "Basket"\)/);
  for (const f of ["src/pages/PublicMenuPage.jsx", "src/components/menuCatalog/CatalogMenuRenderer.jsx"]) {
    assert.doesNotMatch(read(f), /Review Order/, f);
  }
});

test("design system variables are defined", () => {
  const css = read("src/index.css");
  for (const v of ["--mp-accent: #0f7a24", "--mp-brand-lime: #77c517", "--mp-surface-alt: #f5f7f4", "--mp-radius-lg: 16px"]) {
    assert.ok(css.includes(v), v);
  }
});
