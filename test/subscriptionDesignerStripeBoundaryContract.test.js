/**
 * Frontend contract: Subscription Designer must not expose Stripe billing fields.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EDITOR = join(
  __dirname,
  "../src/pages/owner/subscriptionDesigner/SubscriptionDesignerPlanEditor.jsx"
);
const LIST = join(
  __dirname,
  "../src/pages/owner/subscriptionDesigner/SubscriptionDesignerList.jsx"
);

test("plan editor has no Stripe configuration fields", () => {
  const src = readFileSync(EDITOR, "utf8");
  assert.doesNotMatch(src, /stripe_json/);
  assert.doesNotMatch(src, /live_monthly_price_id/);
  assert.doesNotMatch(src, /test_monthly_price_id/);
  assert.doesNotMatch(src, /Stripe \(live/);
  assert.doesNotMatch(src, /Sync to Stripe|Create Stripe Product|Publish Stripe Price/);
  assert.match(
    src,
    /These prices control Menuply.s public plan display only/
  );
  assert.match(src, /does not change Stripe[\s\S]*billing/);
  assert.match(src, /prices_json/);
  assert.match(src, /acknowledge_display_billing_mismatch|ackMismatch/);
});

test("plan list does not show stripe_config_status", () => {
  const src = readFileSync(LIST, "utf8");
  assert.doesNotMatch(src, /stripe_config_status/);
  assert.doesNotMatch(src, /active_stripe_subscriptions/);
  assert.match(src, /active_subscriptions/);
  assert.match(src, /has_pricing_mismatch|Display ≠ billing catalog/);
});
