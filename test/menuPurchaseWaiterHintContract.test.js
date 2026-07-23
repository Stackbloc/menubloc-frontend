/**
 * Menu purchase waiter hint — sticky coach on public menu surfaces,
 * gated to paid subscription + online ordering.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shouldShowMenuPurchaseWaiterHint } from "../src/lib/restaurantStatusLight.js";

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
  assert.match(src, /shouldShowMenuPurchaseWaiterHint\(data\)/);
}

function testCatalogMenuUsesPinnedHint() {
  const src = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(src, /pinWithStickyMenuHeader/);
  assert.match(src, /stickyBackground=\{resolvedPageBackground\}/);
  assert.match(src, /shouldShowMenuPurchaseWaiterHint\(data\)/);
}

function testHintGateRequiresPaidAndAccepting() {
  assert.equal(
    shouldShowMenuPurchaseWaiterHint({
      is_paid_subscriber: true,
      order_acceptance_status: "accepting_orders",
    }),
    true,
  );
  assert.equal(
    shouldShowMenuPurchaseWaiterHint({
      subscription_plan: "pro",
      order_acceptance_status: "accepting_orders",
    }),
    true,
  );
  assert.equal(
    shouldShowMenuPurchaseWaiterHint({
      is_paid_subscriber: true,
      order_acceptance_status: "paused",
    }),
    false,
  );
  assert.equal(
    shouldShowMenuPurchaseWaiterHint({
      subscription_plan: "starter",
      order_acceptance_status: "accepting_orders",
    }),
    false,
  );
  assert.equal(shouldShowMenuPurchaseWaiterHint({}), false);
}

testComponentSupportsSticky();
testClassicTemplatePinsIntakeInStickyHeader();
testPublicMenuUsesPinnedHint();
testCatalogMenuUsesPinnedHint();
testHintGateRequiresPaidAndAccepting();

console.log("✅ menuPurchaseWaiterHintContract tests passed");
