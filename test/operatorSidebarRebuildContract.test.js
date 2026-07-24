/**
 * Operator sidebar IA: spaced section order + item order under each section.
 * Shared Menu Worksheet keeps separate Save + Publish.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testShellNestedNav() {
  const shell = read("src/components/adminConsole/AdminConsoleShell.jsx");
  const css = read("src/components/adminConsole/adminConsoleShell.css");
  assert.match(shell, /admin-console__nav-children/);
  assert.match(shell, /admin-console__link--nested/);
  assert.match(shell, /item\.children/);
  assert.match(css, /\.admin-console__section--spaced/);
  assert.match(css, /\.admin-console__link--nested/);
}

function testLayoutSectionAndItemOrder() {
  const layout = read("src/pages/operator/OperatorLayout.jsx");
  const homeIdx = layout.indexOf('id: "home"');
  const opsIdx = layout.indexOf('id: "operations"');
  const mktIdx = layout.indexOf('id: "marketing"');
  const menuIdx = layout.indexOf('id: "menu"');
  const marketIdx = layout.indexOf('id: "marketplace"');
  const acctIdx = layout.indexOf('id: "my-account"');
  assert.ok(homeIdx > 0 && opsIdx > homeIdx && mktIdx > opsIdx && menuIdx > mktIdx);
  assert.ok(marketIdx > menuIdx && acctIdx > marketIdx);

  // Home → Orders nested
  assert.match(layout, /to: "\/operator"/);
  assert.match(layout, /children:\s*\[[\s\S]*?to: "\/operator\/orders"/);

  // Operations order: Profile Editor, Brand Settings, Hours
  const opsBlock = layout.slice(opsIdx, mktIdx);
  const pe = opsBlock.indexOf("/operator/profile-editor");
  const brand = opsBlock.indexOf("/operator/brand");
  const hours = opsBlock.indexOf("/operator/hours");
  assert.ok(pe >= 0 && brand > pe && hours > brand, "Operations item order");

  // Marketing order: Billboards, Deals, Bid-Free
  const mktBlock = layout.slice(mktIdx, menuIdx);
  const bb = mktBlock.indexOf("/operator/billboards");
  const deals = mktBlock.indexOf("/operator/deals");
  const bid = mktBlock.indexOf("/operator/bid-free-bidding");
  assert.ok(bb >= 0 && deals > bb && bid > deals, "Marketing item order");

  // Menu order: Worksheet, View Menu, Menu Lab, Adobe (defined in menuItems array)
  const menuItemsIdx = layout.indexOf("const menuItems = [");
  const menuItemsBlock = layout.slice(menuItemsIdx, layout.indexOf("list.push({\n      id: \"menu\"", menuItemsIdx) + 80);
  const ws = menuItemsBlock.indexOf("/operator/menu-worksheet");
  const view = menuItemsBlock.indexOf("view-menu");
  const lab = menuItemsBlock.indexOf("/operator/menulab");
  const adobe = menuItemsBlock.indexOf("/operator/design");
  assert.ok(ws >= 0 && view > ws && lab > view, "Menu item order");
  assert.ok(adobe < 0 || adobe > lab, "Adobe after Menu Lab when present");

  // Marketplace hub (generalized; same route)
  assert.match(layout, /to: "\/operator\/marketplace"/);
  assert.match(layout, /operator\.nav\.marketplace/);
}

function testMyAccountTabs() {
  const src = read("src/pages/operator/OperatorMyAccount.jsx");
  assert.match(src, /id: "settings"/);
  assert.match(src, /id: "qr"/);
  assert.doesNotMatch(src, /id: "profile", label: "Profile Editor"/);
  assert.doesNotMatch(src, /\{ id: "menu", label: "Menu" \}/);
  assert.match(src, /Account Settings/);
  assert.match(src, /Merchant Account/);
  assert.match(src, /Delivery Portal/);
  assert.match(src, /Owner PIN Settings/);
  assert.match(src, /navigate\("\/operator\/profile-editor"/);
  assert.match(src, /navigate\("\/operator\/menu-worksheet"/);
}

function testWorksheetSharedSavePublish() {
  const page = read("src/pages/operator/OperatorMenuWorksheetPage.jsx");
  const hub = read("src/pages/operator/OperatorMenuWorksheetHubPage.jsx");
  const ui = read("src/components/menuEditor/MenuWorksheet.jsx");
  assert.match(page, /onSave=\{handleSave\}/);
  assert.match(page, /onPublish=\{handlePublish\}/);
  assert.match(ui, /Save Worksheet/);
  assert.match(ui, /onPublish/);
  assert.match(hub, /menu-worksheet-hub/);
  assert.match(page, /View Menu/);
}

function testRoutes() {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/operator\/menu-worksheet"/);
  assert.match(app, /path="\/operator\/profile-editor"/);
  assert.match(app, /OperatorMenuWorksheetHubPage/);
}

function testMenuLabOverflowGuard() {
  const src = read("src/pages/operator/OperatorMenuEditor.jsx");
  assert.match(src, /menu-lab-header-actions/);
  assert.match(src, /maxWidth: "100%"/);
}

testShellNestedNav();
testLayoutSectionAndItemOrder();
testMyAccountTabs();
testWorksheetSharedSavePublish();
testRoutes();
testMenuLabOverflowGuard();
console.log("operatorSidebarRebuildContract: ok");
