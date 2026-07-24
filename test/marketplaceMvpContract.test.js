/**
 * Marketplace MVP operator UI contract — hub, route, creative categories.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const page = read("src/pages/operator/OperatorQrKitOrder.jsx");
const layout = read("src/pages/operator/OperatorLayout.jsx");
const app = read("src/App.jsx");
const operatorApi = read("src/lib/operatorApi.js");

assert.match(app, /path="\/operator\/marketplace"/);
assert.match(app, /OperatorMarketplaceLegacyRedirect/);
assert.match(app, /path="\/operator\/qr-kits\/order"/);
assert.match(layout, /to: "\/operator\/marketplace"/);
assert.match(layout, /operator\.nav\.marketplace/);
assert.match(page, /Marketplace/);
assert.match(page, /Products and creative services for your restaurant/);
assert.match(page, /Shop Products/);
assert.match(page, /Shop Creative Services/);
assert.equal(page.includes("Featured Products"), false);
assert.match(page, /Custom Menu Design/);
assert.match(page, /Pro Photography/);
assert.match(page, /Graphic Arts/);
assert.match(page, /Coming Soon/);
assert.match(page, /menuply_menu_design/);
assert.match(page, /marketplace-menu-design-panel/);
assert.match(page, /awaiting fulfillment/i);
assert.equal(page.includes("supplier_cost"), false);
assert.equal(/submitted to VistaPrint/i.test(page), false);
assert.equal(page.includes("Printful"), false);
assert.match(operatorApi, /getMarketplaceOrderHistory/);
assert.match(operatorApi, /uploadMarketplaceArtwork/);
assert.match(operatorApi, /checkoutMarketplaceService/);

const placeholders = [
  "public/marketplace/placeholders/sign-retractable-banner.svg",
  "public/marketplace/placeholders/sign-vinyl-banner.svg",
  "public/marketplace/placeholders/mkt-door-hangers.svg",
];
for (const rel of placeholders) {
  assert.equal(fs.existsSync(path.join(ROOT, rel)), true, `missing ${rel}`);
}

console.log("marketplaceMvpContract.test.js: ok");
