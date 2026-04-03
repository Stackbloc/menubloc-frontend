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
  assert.equal(getQrProductCode("starter"), "qr_basic");
  assert.equal(getQrProductCode("full"), "qr_full");
  assert.equal(getSubscriptionPlanLabel("pro_monthly"), "Pro Monthly");
  assert.equal(getSubscriptionPlanLabel("pro_annual"), "Pro Annual");
  assert.equal(getSubscriptionStatusLabel("past_due"), "past due");
});
