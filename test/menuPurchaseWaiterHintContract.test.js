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
  assert.match(src, /position: "sticky"/);
  assert.match(src, /stickyBackground/);
}

function testPublicMenuUsesStickyHint() {
  const src = read("src/pages/PublicMenuPage.jsx");
  assert.match(src, /<MenuPurchaseWaiterHint sticky stickyBackground=\{resolvedPageBackground\} \/>/);
}

function testCatalogMenuUsesStickyHint() {
  const src = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(src, /<MenuPurchaseWaiterHint sticky stickyBackground=\{resolvedPageBackground\} \/>/);
}

testComponentSupportsSticky();
testPublicMenuUsesStickyHint();
testCatalogMenuUsesStickyHint();

console.log("✅ menuPurchaseWaiterHintContract tests passed");
