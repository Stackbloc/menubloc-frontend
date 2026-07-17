/**
 * Canonical Menuply checkout plan keys and checkout request helpers.
 * Backend owns Stripe Price IDs, amounts, intervals, and commissions.
 */

export const FREE_PLAN_CODE = "published_free";

/** Historical free alias still readable / accepted by backend no-checkout set. */
export const LEGACY_FREE_PLAN_CODE = "verified";

export const FOOD_TRUCK_ANNUAL_PLAN_CODE = "food_truck_annual";

export const INTENDED_CHECKOUT_PLAN_STORAGE_KEY = "menuply.intended_checkout_plan_code";

/** Paid plans selectable for new Stripe Checkout. */
export const SELECTABLE_PAID_PLAN_CODES = Object.freeze([
  "starter_monthly",
  "starter_annual",
  "founders_monthly",
  "founders_annual",
  FOOD_TRUCK_ANNUAL_PLAN_CODE,
]);

/** Must never be submitted by active plan selectors for new checkout. */
export const LEGACY_BLOCKED_CHECKOUT_PLAN_CODES = Object.freeze([
  "pro_monthly",
  "pro_annual",
]);

export const CHECKOUT_PRICE_LABELS = Object.freeze({
  [FREE_PLAN_CODE]: "Free",
  [LEGACY_FREE_PLAN_CODE]: "Free",
  starter_monthly: "$20/month",
  starter_annual: "$199/year",
  founders_monthly: "$39/month",
  founders_annual: "$319/year",
  [FOOD_TRUCK_ANNUAL_PLAN_CODE]: "$89/year",
});

/** Fallback catalog used when /plans is unavailable (amounts for display only). */
export const FALLBACK_CHECKOUT_PLANS = Object.freeze([
  {
    code: "starter_monthly",
    checkout_label: "Pro Monthly",
    amount_cents: 2000,
    billing_interval: "month",
  },
  {
    code: "starter_annual",
    checkout_label: "Pro Annual",
    amount_cents: 19900,
    billing_interval: "year",
  },
  {
    code: "founders_monthly",
    checkout_label: "Founder's Monthly",
    amount_cents: 3900,
    billing_interval: "month",
  },
  {
    code: "founders_annual",
    checkout_label: "Founder's Annual",
    amount_cents: 31900,
    billing_interval: "year",
  },
  {
    code: FOOD_TRUCK_ANNUAL_PLAN_CODE,
    checkout_label: "Food Truck Annual",
    amount_cents: 8900,
    billing_interval: "year",
  },
]);

const PAID_ACTIVE_STATUSES = new Set(["active", "trialing"]);

const FORBIDDEN_CHECKOUT_BODY_KEYS = Object.freeze([
  "stripe_price_id",
  "price_id",
  "commission_rate",
  "commission_rate_bps",
  "amount",
  "subscription_price",
  "billing_amount",
]);

export function isFreePlanCode(planCode) {
  const normalized = String(planCode || "").trim().toLowerCase();
  return normalized === FREE_PLAN_CODE || normalized === LEGACY_FREE_PLAN_CODE;
}

export function isSelectablePaidPlanCode(planCode) {
  return SELECTABLE_PAID_PLAN_CODES.includes(String(planCode || "").trim().toLowerCase());
}

export function isLegacyBlockedCheckoutPlanCode(planCode) {
  return LEGACY_BLOCKED_CHECKOUT_PLAN_CODES.includes(
    String(planCode || "").trim().toLowerCase()
  );
}

export function getCheckoutPriceLabel(planCode) {
  const normalized = String(planCode || "").trim().toLowerCase();
  return CHECKOUT_PRICE_LABELS[normalized] || null;
}

export function filterSelectableCheckoutPlans(plans = []) {
  const filtered = (plans || []).filter((plan) => isSelectablePaidPlanCode(plan?.code));
  return filtered.length ? filtered : [...FALLBACK_CHECKOUT_PLANS];
}

export function rememberIntendedCheckoutPlanCode(planCode) {
  if (typeof sessionStorage === "undefined") return;
  const normalized = String(planCode || "").trim().toLowerCase();
  if (!normalized) return;
  sessionStorage.setItem(INTENDED_CHECKOUT_PLAN_STORAGE_KEY, normalized);
}

export function readIntendedCheckoutPlanCode() {
  if (typeof sessionStorage === "undefined") return null;
  const value = String(sessionStorage.getItem(INTENDED_CHECKOUT_PLAN_STORAGE_KEY) || "")
    .trim()
    .toLowerCase();
  return value || null;
}

export function clearIntendedCheckoutPlanCode() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(INTENDED_CHECKOUT_PLAN_STORAGE_KEY);
}

/**
 * Operator Stripe checkout body — camelCase keys matching
 * POST /api/stripe/platform/checkout-sessions.
 */
export function buildOperatorStripeCheckoutBody({
  restaurantId,
  planCode,
  successUrl,
  cancelUrl,
}) {
  assertPayablePlanCode(planCode);
  const body = {
    restaurantId,
    planCode: String(planCode).trim().toLowerCase(),
    successUrl,
    cancelUrl,
  };
  assertNoClientPricingFields(body);
  return body;
}

/**
 * Owner onboarding checkout body — snake_case keys matching
 * POST /owner/subscription/checkout-session.
 */
export function buildOwnerStripeCheckoutBody({
  restaurantId,
  ownerToken,
  email,
  planCode,
  successUrl,
  cancelUrl,
  legalAcceptance,
}) {
  assertPayablePlanCode(planCode);
  const body = {
    restaurant_id: restaurantId,
    owner_token: ownerToken,
    email,
    plan_code: String(planCode).trim().toLowerCase(),
    success_url: successUrl,
    cancel_url: cancelUrl,
  };
  if (legalAcceptance) {
    body.legal_acceptance = legalAcceptance;
  }
  assertNoClientPricingFields(body);
  return body;
}

export function assertPayablePlanCode(planCode) {
  const normalized = String(planCode || "").trim().toLowerCase();
  if (isFreePlanCode(normalized)) {
    throw new Error("Free plans must not create a Stripe Checkout Session.");
  }
  if (isLegacyBlockedCheckoutPlanCode(normalized)) {
    throw new Error(`Plan "${normalized}" is not available for new checkout.`);
  }
  if (!isSelectablePaidPlanCode(normalized)) {
    throw new Error(`Unknown or inactive checkout plan: ${normalized}`);
  }
}

export function assertNoClientPricingFields(body) {
  for (const key of FORBIDDEN_CHECKOUT_BODY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] != null) {
      throw new Error(`Checkout body must not include ${key}; backend is authoritative.`);
    }
  }
}

/** True when backend has confirmed a paid subscription is usable. */
export function isPaidSubscriptionConfirmed(subscription) {
  const planCode = String(subscription?.plan_code || "").trim().toLowerCase();
  if (!planCode || isFreePlanCode(planCode)) return false;
  const status = String(subscription?.status || "").trim().toLowerCase();
  return PAID_ACTIVE_STATUSES.has(status);
}

/**
 * Resolve plan code from Stripe success return URL without remapping to legacy Pro keys.
 */
export function resolveReturnedCheckoutPlanCode(returnedPlanCode, fallback = null) {
  const normalized = String(returnedPlanCode || "").trim().toLowerCase();
  if (isSelectablePaidPlanCode(normalized)) return normalized;
  if (isFreePlanCode(normalized)) return FREE_PLAN_CODE;
  if (isLegacyBlockedCheckoutPlanCode(normalized)) {
    // Historical return URLs only — never use for new checkout selectors.
    return normalized;
  }
  if (fallback && isSelectablePaidPlanCode(fallback)) {
    return String(fallback).trim().toLowerCase();
  }
  return normalized || null;
}

export function shouldTreatCheckoutSuccessAsActive(subscription) {
  return isPaidSubscriptionConfirmed(subscription);
}
