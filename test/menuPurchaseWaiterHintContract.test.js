/**
 * Menu purchase waiter hint — sticky coach on all public menu surfaces.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testComponentSupportsSticky() {
  const src = read("src/components/menu/MenuPurchaseWaiterHint.jsx");
  assert.match(src, /sticky = false/);
  assert.match(src, /pinWithStickyMenuHeader/);
  assert.match(src, /position: "sticky"/);
  assert.match(src, /stickyBackground/);
}

function testClassicTemplatePinsIntakeInStickyHeader() {
  const src = read("src/components/menu-templates/ClassicMenuTemplate.jsx");
  const stickyIdx = src.indexOf('position: "sticky"');
  const intakeIdx = src.indexOf("{intakeBannerSlot");
  assert.ok(stickyIdx >= 0 && intakeIdx > stickyIdx, "intakeBannerSlot must render inside sticky menu header");
}

function testPublicMenuUsesPinnedHint() {
  const src = read("src/pages/PublicMenuPage.jsx");
  assert.match(src, /pinWithStickyMenuHeader/);
  assert.match(src, /stickyBackground=\{resolvedPageBackground\}/);
}

function testCatalogMenuUsesPinnedHint() {
  const src = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(src, /pinWithStickyMenuHeader/);
  assert.match(src, /stickyBackground=\{resolvedPageBackground\}/);
}

testComponentSupportsSticky();
testClassicTemplatePinsIntakeInStickyHeader();
testPublicMenuUsesPinnedHint();
testCatalogMenuUsesPinnedHint();

console.log("✅ menuPurchaseWaiterHintContract tests passed");
