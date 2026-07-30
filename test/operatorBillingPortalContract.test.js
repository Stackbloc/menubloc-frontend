/**
 * Operator subscription Manage Billing → Stripe Customer Portal contract.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testOpenBillingPortalHelper() {
  const api = read("src/lib/operatorApi.js");
  assert.match(api, /export const openBillingPortal/);
  assert.match(api, /\/operator\/restaurants\/\$\{rid\}\/billing\/portal/);
  assert.match(api, /portal_url/);
  assert.doesNotMatch(api, /STRIPE_SECRET/);
}

function testManageBillingEnabled() {
  const page = read("src/pages/operator/OperatorSubscription.jsx");
  assert.match(page, /handleManageBilling/);
  assert.match(page, /openBillingPortal/);
  assert.match(page, /canManageBilling/);
  assert.match(page, /stripe_customer_id/);
  assert.match(page, /Manage Billing/);
  assert.doesNotMatch(page, /Billing portal access is not available yet/);
}

function run() {
  testOpenBillingPortalHelper();
  testManageBillingEnabled();
  console.log("✅ operatorBillingPortalContract passed");
}

run();
