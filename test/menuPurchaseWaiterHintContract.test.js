/**
 * Menu purchase hint — pinned in the sticky menu header, shown only when online ordering
 * is available.
 *   - Classic public menus: the Waiter-face hint (MenuPurchaseWaiterHint).
 *   - Menu Browser (CatalogMenuRenderer): the "🛍 Order here · Tap a dish…" chip in the same
 *     intake slot (Andre, 2026-10-22: docs/audits/2026-10-22_web-app-unification-menu-search.md).
 *   - Gate: one plan (2026-10-12) — no plan gate; the server's ordering_availability, else the
 *     restaurant's ordering switch + accepting orders.
 * Updated 2026-10-23 with Andre's approval (docs/audits/2026-10-23_menu-hint-contract-update.md).
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
  assert.match(src, /stickyBackground=\{(resolvedPageBackground|stickyBarBackground)\}/);
  assert.match(src, /shouldShowMenuPurchaseWaiterHint\(data\)/);
}

function testCatalogMenuUsesOrderHereChip() {
  const src = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  // Approved copy (2026-10-22), shown in the intake slot that templates pin in the sticky header.
  assert.match(
    src,
    /const ORDER_HERE_CHIP_LABEL = "🛍 Order here · Tap a dish to add it to your basket · Hold to remove";/,
  );
  const slotIdx = src.indexOf("intakeBannerSlot:");
  assert.ok(slotIdx >= 0, "CatalogMenuRenderer passes an intakeBannerSlot");
  const slot = src.slice(slotIdx, src.indexOf("allergenBannerSlot:", slotIdx));
  assert.match(slot, /<OrderingUnavailableBanner data=\{data\} label=\{ORDER_HERE_CHIP_LABEL\} \/>/);
  // The chip shows only when online ordering is available (same gate as the Waiter hint).
  const banner = read("src/components/menu/OrderingUnavailableBanner.jsx");
  assert.match(banner, /if \(!isOnlineOrderingAvailable\(data\)\) return null;/);
}

function testHintGateFollowsOnePlanOrdering() {
  const show = shouldShowMenuPurchaseWaiterHint;
  // The server's ordering_availability decides when present (top level or nested restaurant).
  assert.equal(show({ ordering_availability: { available: true } }), true);
  assert.equal(show({ restaurant: { ordering_availability: { available: true } } }), true);
  assert.equal(
    show({
      ordering_availability: { available: false },
      is_paid_subscriber: true,
      ordering_enabled: true,
      order_acceptance_status: "accepting_orders",
    }),
    false,
  );
  // Otherwise: the restaurant's ordering switch + accepting orders. No plan gate (one plan).
  assert.equal(show({ ordering_enabled: true, order_acceptance_status: "accepting_orders" }), true);
  assert.equal(
    show({ ordering_enabled: true, subscription_plan: "standard", order_acceptance_status: "accepting_orders" }),
    true,
  );
  assert.equal(show({ ordering_enabled: true, order_acceptance_status: "paused" }), false);
  assert.equal(show({ is_paid_subscriber: true, order_acceptance_status: "accepting_orders" }), false);
  assert.equal(show({}), false);
}

testComponentSupportsSticky();
testClassicTemplatePinsIntakeInStickyHeader();
testPublicMenuUsesPinnedHint();
testCatalogMenuUsesOrderHereChip();
testHintGateFollowsOnePlanOrdering();

console.log("✅ menuPurchaseWaiterHintContract tests passed");
