/**
 * W4 compact menu header (Andre, 2026-10-23): on the shared header row (Classic v1/v16, Fine v17)
 * the address moves from under the name into an ⓘ sheet at the end of the header icon row.
 * Other templates keep their header as is. Purchase hint reads the agreed tap/hold text.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("menu page hides the header address only for Classic/Fine and provides the ⓘ", () => {
  const page = read("src/pages/PublicMenuPage.jsx");
  assert.match(page, /const compactMenuHeader = \["v1", "v16", "v17"\]\.includes\(menuPresentationStyle\)/);
  assert.match(page, /addressLine: compactMenuHeader \? "" : addressLine/);
  assert.match(page, /directionsHref: compactMenuHeader \? null : directionsHref/);
  assert.match(page, /<MenuHeaderTrailingActionContext\.Provider value=\{menuInfoAction\}>/);
});

test("ⓘ is About this menu: review date or not-claimed note + report email naming the menu (Andre 2026-10-31)", () => {
  const btn = read("src/components/menu/MenuInfoButton.jsx");
  for (const s of ['aria-label="About this menu"', "menuTrustText", "menuReportMailto", "submit a report", "isUnclaimedProfile"]) {
    assert.ok(btn.includes(s), s);
  }
  // Directions, phone and the profile live on the profile now (the restaurant name links there).
  for (const s of ["Get directions", "tel:", "Restaurant profile"]) assert.ok(!btn.includes(s), s);
  assert.doesNotMatch(btn, /website_url|websiteHref/);
  const page = read("src/pages/PublicMenuPage.jsx");
  assert.match(page, /reviewedAt=\{data\?\.menu_last_verified_at \|\| null\}/);
  assert.match(page, /menuUrl=\{shareData\?\.url \|\| null\}/);
});

test("Classic and Fine render the trailing slot in the header icon row", () => {
  const rail = read("src/components/menu-templates/MenuHeaderIconRail.jsx");
  assert.match(rail, /\{trailingAction\}/);
  for (const f of ["ClassicMenuTemplate.jsx", "FineMenuTemplate.jsx"]) {
    assert.match(read(`src/components/menu-templates/${f}`), /<MenuHeaderNameWithActions/, f);
  }
});

test("purchase hint keeps tap-to-order messaging and stays sticky", () => {
  const hint = read("src/components/menu/MenuPurchaseWaiterHint.jsx");
  assert.match(hint, /Order here · Tap a dish to see it, pick options and add it/);
  assert.match(hint, /position: "sticky"/);
});
