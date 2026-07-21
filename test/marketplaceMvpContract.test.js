/**
 * Marketplace MVP operator UI contract — labels, route, Coming Soon services.
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

assert.match(app, /path="\/operator\/qr-kits\/order"/);
assert.match(layout, /to: "\/operator\/qr-kits\/order"/);
assert.match(layout, /operator\.nav\.marketplace/);
assert.match(page, /Marketplace/);
assert.match(page, /Products and creative services for your restaurant/);
assert.match(page, /Featured Products/);
assert.match(page, /Shop by Category/);
assert.match(page, /Creative Services/);
assert.match(page, /Photography/);
assert.match(page, /Menu Design/);
assert.match(page, /Social Media Graphics/);
assert.match(page, /Coming Soon/);
assert.match(page, /Menuply Menu Design/);
assert.match(page, /Browse Menu Design/);
assert.match(page, /awaiting fulfillment/i);
assert.equal(page.includes("supplier_cost"), false);
assert.equal(/submitted to VistaPrint/i.test(page), false);
assert.equal(page.includes("Printful"), false);
assert.match(operatorApi, /getMarketplaceOrderHistory/);
assert.match(operatorApi, /uploadMarketplaceArtwork/);
assert.match(operatorApi, /checkoutMarketplaceService/);

console.log("marketplaceMvpContract.test.js: ok");
