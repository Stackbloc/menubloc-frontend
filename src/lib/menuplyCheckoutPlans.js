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
  standard: "Free",
  [LEGACY_FREE_PLAN_CODE]: "Free",
  starter_monthly: "$20/month",
  starter_annual: "$199/year",
  founders_monthly: "$39/month",
  founders_annual: "$319/year",
  [FOOD_TRUCK_ANNUAL_PLAN_CODE]: "$89/year",
});

/**
 * Fallback commission (basis points) aligned with backend menuplyPlanCatalog.
 * Display only — never send these fields in checkout request bodies.
 */
export const FALLBACK_COMMISSION_RATE_BPS = Object.freeze({
  [FREE_PLAN_CODE]: null,
  standard: null,
  [LEGACY_FREE_PLAN_CODE]: null,
  starter_monthly: 1100,
  starter_annual: 1100,
  founders_monthly: 800,
  founders_annual: 800,
  [FOOD_TRUCK_ANNUAL_PLAN_CODE]: 800,
});

export const FALLBACK_COMMISSION_LOCK_MONTHS = Object.freeze({
  founders_annual: 24,
});

/** Fallback catalog used when /plans is unavailable (amounts + commission for display only). */
export const FALLBACK_CHECKOUT_PLANS = Object.freeze([
  {
    code: FREE_PLAN_CODE,
    checkout_label: "Standard",
    amount_cents: 0,
    billing_interval: null,
    commission_rate_bps: FALLBACK_COMMISSION_RATE_BPS[FREE_PLAN_CODE],
    commission_lock_months: null,
  },
  {
    code: "starter_monthly",
    checkout_label: "Pro Monthly",
    amount_cents: 2000,
    billing_interval: "month",
    commission_rate_bps: FALLBACK_COMMISSION_RATE_BPS.starter_monthly,
    commission_lock_months: null,
  },
  {
    code: "starter_annual",
    checkout_label: "Pro Annual",
    amount_cents: 19900,
    billing_interval: "year",
    commission_rate_bps: FALLBACK_COMMISSION_RATE_BPS.starter_annual,
    commission_lock_months: null,
  },
  {
    code: "founders_monthly",
    checkout_label: "Founder's Monthly",
    amount_cents: 3900,
    billing_interval: "month",
    commission_rate_bps: FALLBACK_COMMISSION_RATE_BPS.founders_monthly,
    commission_lock_months: null,
  },
  {
    code: "founders_annual",
    checkout_label: "Founder's Annual",
    amount_cents: 31900,
    billing_interval: "year",
    commission_rate_bps: FALLBACK_COMMISSION_RATE_BPS.founders_annual,
    commission_lock_months: FALLBACK_COMMISSION_LOCK_MONTHS.founders_annual,
  },
  {
    code: FOOD_TRUCK_ANNUAL_PLAN_CODE,
    checkout_label: "Food Truck Annual",
    amount_cents: 8900,
    billing_interval: "year",
    commission_rate_bps: FALLBACK_COMMISSION_RATE_BPS[FOOD_TRUCK_ANNUAL_PLAN_CODE],
    commission_lock_months: null,
  },
]);

/** @param {unknown} bps */
export function formatCommissionPercentFromBps(bps) {
  if (bps == null || bps === "") return null;
  const n = Number(bps);
  if (!Number.isFinite(n)) return null;
  const pct = n / 100;
  return Number.isInteger(pct) ? `${pct}%` : `${parseFloat(pct.toFixed(2))}%`;
}

/**
 * Marketplace commission disclosure label shown before subscription fee amounts.
 * @param {{ commission_rate_bps?: unknown, commission_lock_months?: unknown, code?: string } | string | null} planOrCode
 * @param {{ plansByCode?: Record<string, object> }} [opts]
 */
export function getMarketplaceCommissionDisclosure(planOrCode, opts = {}) {
  let plan = null;
  if (planOrCode && typeof planOrCode === "object") {
    plan = planOrCode;
  } else {
    const code = String(planOrCode || "").trim().toLowerCase();
    plan =
      opts.plansByCode?.[code] ||
      FALLBACK_CHECKOUT_PLANS.find((p) => p.code === code) ||
      (code
        ? {
            code,
            commission_rate_bps: FALLBACK_COMMISSION_RATE_BPS[code] ?? null,
            commission_lock_months: FALLBACK_COMMISSION_LOCK_MONTHS[code] ?? null,
          }
        : null);
  }

  const pct = formatCommissionPercentFromBps(plan?.commission_rate_bps);
  if (!pct) {
    return "No Menuply marketplace commission (online ordering not included)";
  }

  const lockMonths = Number(plan?.commission_lock_months);
  if (Number.isFinite(lockMonths) && lockMonths > 0) {
    const years = lockMonths / 12;
    const yearsLabel = Number.isInteger(years) ? `${years}-year` : `${parseFloat(years.toFixed(1))}-year`;
    return `${pct} marketplace commission · ${yearsLabel} rate lock`;
  }
  return `${pct} marketplace commission`;
}

/**
 * Fetch display-safe plan options (includes commission_rate_bps from catalog).
 * Falls back to FALLBACK_CHECKOUT_PLANS when the API is unavailable.
 */
export async function fetchCheckoutPlanOptionsForDisplay() {
  const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
  const API = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${API}/api/stripe/platform/plans`);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok || !Array.isArray(json.plans)) {
      return { ok: false, plans: [...FALLBACK_CHECKOUT_PLANS], source: "fallback" };
    }
    const byCode = Object.fromEntries(
      FALLBACK_CHECKOUT_PLANS.map((p) => [p.code, { ...p }])
    );
    for (const plan of json.plans) {
      const code = String(plan?.code || "").trim().toLowerCase();
      if (!code) continue;
      byCode[code] = {
        ...(byCode[code] || {}),
        ...plan,
        code,
        commission_rate_bps:
          plan.commission_rate_bps != null
            ? Number(plan.commission_rate_bps)
            : byCode[code]?.commission_rate_bps ?? FALLBACK_COMMISSION_RATE_BPS[code] ?? null,
        commission_lock_months:
          plan.commission_lock_months != null
            ? Number(plan.commission_lock_months)
            : byCode[code]?.commission_lock_months ?? FALLBACK_COMMISSION_LOCK_MONTHS[code] ?? null,
      };
    }
    if (!byCode[FREE_PLAN_CODE]) {
      byCode[FREE_PLAN_CODE] = { ...FALLBACK_CHECKOUT_PLANS.find((p) => p.code === FREE_PLAN_CODE) };
    }
    return { ok: true, plans: Object.values(byCode), source: "api" };
  } catch {
    return { ok: false, plans: [...FALLBACK_CHECKOUT_PLANS], source: "fallback" };
  }
}

export function indexPlansByCode(plans = []) {
  return Object.fromEntries(
    (plans || [])
      .map((p) => [String(p?.code || "").trim().toLowerCase(), p])
      .filter(([code]) => Boolean(code))
  );
}

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
