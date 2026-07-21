import test from "node:test";
import assert from "node:assert/strict";
import {
  formatMoney,
  getQrProductCode,
  getStripePublishableKey,
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
  hasStripePublishableKey,
} from "../src/components/payments/paymentHelpers.js";

test("payment helpers expose safe defaults outside Vite runtime", () => {
  assert.equal(getStripePublishableKey(), "");
  assert.equal(hasStripePublishableKey(), false);
});

test("payment helpers format platform product display values", () => {
  assert.equal(formatMoney(2999), "$29.99");
  assert.equal(getQrProductCode("starter"), "QR-WINDOW");
  assert.equal(getQrProductCode("table"), "QR-TABLE");
  assert.equal(getQrProductCode("counter"), "QR-COUNTER");
  assert.equal(getQrProductCode("full"), "full");
  assert.equal(getQrProductCode("QR-TABLE"), "QR-TABLE");
  assert.equal(getSubscriptionPlanLabel("published_free"), "Standard");
  assert.equal(getSubscriptionPlanLabel("verified"), "Standard");
  assert.equal(getSubscriptionPlanLabel("pro_monthly"), "Pro Monthly");
  assert.equal(getSubscriptionPlanLabel("pro_annual"), "Pro Annual");
  assert.equal(getSubscriptionStatusLabel("past_due"), "past due");
});
