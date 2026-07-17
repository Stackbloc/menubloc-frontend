/**
 * Operator Merchant Account panel — nav + route contract.
 * Ensures Order History sidebar entry is replaced and Orders history API remains.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testSidebarMerchantAccount() {
  const layout = read("src/pages/operator/OperatorLayout.jsx");
  assert.match(layout, /\/operator\/merchant/);
  assert.match(layout, /operator\.nav\.merchantAccount/);
  assert.doesNotMatch(layout, /\/operator\/orders\?tab=history/);
  assert.doesNotMatch(layout, /operator\.nav\.orderHistory/);
}

function testMerchantRouteMounted() {
  const app = read("src/App.jsx");
  assert.match(app, /OperatorMerchantAccountPage/);
  assert.match(app, /path="\/operator\/merchant"/);
  assert.match(app, /path="\/operator\/orders"/);
  assert.match(app, /RestaurantOrdersPage/);
}

function testHistoryQueryRedirectsToMerchant() {
  const orders = read("src/pages/operator/RestaurantOrdersPage.jsx");
  assert.match(orders, /tab"\) === "history"/);
  assert.match(orders, /\/operator\/merchant/);
  assert.match(orders, /getOrderHistory/);
}

function testConnectClientApis() {
  const api = read("src/lib/operatorApi.js");
  assert.match(api, /getStripeConnectStatus/);
  assert.match(api, /startStripeConnectOnboarding/);
  assert.match(api, /createStripeConnectDashboardLink/);
  assert.match(api, /\/api\/stripe\/connect\/status\//);
  assert.match(api, /\/api\/stripe\/connect\/start/);
  assert.match(api, /\/api\/stripe\/connect\/dashboard-link/);
  assert.match(api, /getOrderHistory/);
}

function testMerchantPageCopy() {
  const page = read("src/pages/operator/OperatorMerchantAccountPage.jsx");
  assert.match(page, /Merchant Account/);
  assert.match(
    page,
    /Connect and manage the Stripe account Menuply uses for restaurant payouts and marketplace/
  );
  assert.match(page, /Set Up Stripe Account/);
  assert.match(page, /Continue Stripe Setup/);
  assert.match(page, /Open Stripe Account/);
  assert.doesNotMatch(page, /STRIPE_SECRET/);
}

function run() {
  testSidebarMerchantAccount();
  testMerchantRouteMounted();
  testHistoryQueryRedirectsToMerchant();
  testConnectClientApis();
  testMerchantPageCopy();
  console.log("✅ operatorMerchantAccountContract passed");
}

run();
