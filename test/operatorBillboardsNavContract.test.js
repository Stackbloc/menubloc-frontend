/**
 * Billboards replaces Display Board in operator nav.
 * Dual entry remains: Billboards page + Deals “Feature as Billboard”.
 * /operator/display-settings redirects to /operator/billboards (bookmarks).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testBillboardsReplacesDisplayBoardInNav() {
  const layout = read("src/pages/operator/OperatorLayout.jsx");
  assert.match(layout, /to: "\/operator\/billboards"/);
  assert.match(layout, /operator\.nav\.billboards/);
  assert.doesNotMatch(layout, /to: "\/operator\/display-settings"/);
  assert.doesNotMatch(layout, /benefitKey: "tv_menu_board"/);

  const app = read("src/App.jsx");
  assert.match(app, /path="\/operator\/billboards"/);
  assert.match(app, /OperatorBillboardsPage/);
  assert.match(app, /path="\/operator\/display-settings"/);
  assert.match(app, /Navigate to="\/operator\/billboards"/);

  const page = read("src/pages/operator/OperatorBillboardsPage.jsx");
  assert.match(page, /Is this billboard an offer to sell a menu item/);
  assert.match(page, /allow_null_menu_item/);
  assert.match(page, /upsertDealBillboard/);
  assert.match(page, /Show on restaurant profile load/);

  const deals = read("src/pages/operator/OperatorDealsEditor.jsx");
  assert.match(deals, /Feature this deal as a billboard/);
  assert.match(deals, /\/operator\/billboards/);
  assert.match(deals, /upsertDealBillboard|buildBillboardPayload/);
}

testBillboardsReplacesDisplayBoardInNav();
console.log("operatorBillboardsNavContract: ok");
