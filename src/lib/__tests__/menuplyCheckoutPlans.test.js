import { beforeEach, describe, expect, it } from "vitest";
import {
  CHECKOUT_PRICE_LABELS,
  FALLBACK_CHECKOUT_PLANS,
  FOOD_TRUCK_ANNUAL_PLAN_CODE,
  FREE_PLAN_CODE,
  LEGACY_BLOCKED_CHECKOUT_PLAN_CODES,
  SELECTABLE_PAID_PLAN_CODES,
  assertPayablePlanCode,
  buildOperatorStripeCheckoutBody,
  buildOwnerStripeCheckoutBody,
  filterSelectableCheckoutPlans,
  formatCommissionPercentFromBps,
  getMarketplaceCommissionDisclosure,
  isFreePlanCode,
  isLegacyBlockedCheckoutPlanCode,
  isPaidSubscriptionConfirmed,
  rememberIntendedCheckoutPlanCode,
  resolveReturnedCheckoutPlanCode,
  shouldTreatCheckoutSuccessAsActive,
} from "../menuplyCheckoutPlans.js";

describe("menuplyCheckoutPlans canonical checkout contract", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("maps Pro Monthly checkout to starter_monthly only", () => {
    const body = buildOperatorStripeCheckoutBody({
      restaurantId: "r1",
      planCode: "starter_monthly",
      successUrl: "https://example.com/ok",
      cancelUrl: "https://example.com/cancel",
    });
    expect(body).toEqual({
      restaurantId: "r1",
      planCode: "starter_monthly",
      successUrl: "https://example.com/ok",
      cancelUrl: "https://example.com/cancel",
    });
  });

  it("maps Pro Annual checkout to starter_annual only", () => {
    const body = buildOwnerStripeCheckoutBody({
      restaurantId: "r1",
      ownerToken: "tok",
      email: "a@b.com",
      planCode: "starter_annual",
      successUrl: "https://example.com/ok",
      cancelUrl: "https://example.com/cancel",
    });
    expect(body.plan_code).toBe("starter_annual");
    expect(body).not.toHaveProperty("stripe_price_id");
    expect(body).not.toHaveProperty("commission_rate_bps");
  });

  it("maps Founder's Monthly to founders_monthly", () => {
    expect(
      buildOperatorStripeCheckoutBody({
        restaurantId: "r1",
        planCode: "founders_monthly",
        successUrl: "https://example.com/ok",
        cancelUrl: "https://example.com/cancel",
      }).planCode
    ).toBe("founders_monthly");
  });

  it("maps Founder's Annual to founders_annual", () => {
    expect(
      buildOperatorStripeCheckoutBody({
        restaurantId: "r1",
        planCode: "founders_annual",
        successUrl: "https://example.com/ok",
        cancelUrl: "https://example.com/cancel",
      }).planCode
    ).toBe("founders_annual");
  });

  it("maps Food Truck to food_truck_annual", () => {
    expect(
      buildOperatorStripeCheckoutBody({
        restaurantId: "r1",
        planCode: FOOD_TRUCK_ANNUAL_PLAN_CODE,
        successUrl: "https://example.com/ok",
        cancelUrl: "https://example.com/cancel",
      }).planCode
    ).toBe("food_truck_annual");
  });

  it("does not allow Published / free plans to build Stripe checkout bodies", () => {
    expect(() =>
      buildOperatorStripeCheckoutBody({
        restaurantId: "r1",
        planCode: FREE_PLAN_CODE,
        successUrl: "https://example.com/ok",
        cancelUrl: "https://example.com/cancel",
      })
    ).toThrow(/must not create a Stripe Checkout Session/i);
    expect(isFreePlanCode(FREE_PLAN_CODE)).toBe(true);
    expect(isFreePlanCode("verified")).toBe(true);
  });

  it("blocks legacy pro_monthly and pro_annual from new checkout", () => {
    for (const planCode of LEGACY_BLOCKED_CHECKOUT_PLAN_CODES) {
      expect(isLegacyBlockedCheckoutPlanCode(planCode)).toBe(true);
      expect(() => assertPayablePlanCode(planCode)).toThrow(/not available for new checkout/i);
    }
    expect(SELECTABLE_PAID_PLAN_CODES).not.toContain("pro_monthly");
    expect(SELECTABLE_PAID_PLAN_CODES).not.toContain("pro_annual");
    expect(filterSelectableCheckoutPlans([{ code: "pro_monthly" }, { code: "starter_monthly" }]).map((p) => p.code)).toEqual([
      "starter_monthly",
    ]);
  });

  it("never includes Stripe Price IDs or commission rates in checkout bodies", () => {
    const operatorBody = buildOperatorStripeCheckoutBody({
      restaurantId: "r1",
      planCode: "starter_monthly",
      successUrl: "https://example.com/ok",
      cancelUrl: "https://example.com/cancel",
    });
    const ownerBody = buildOwnerStripeCheckoutBody({
      restaurantId: "r1",
      ownerToken: "tok",
      email: "a@b.com",
      planCode: "founders_annual",
      successUrl: "https://example.com/ok",
      cancelUrl: "https://example.com/cancel",
    });
    for (const body of [operatorBody, ownerBody]) {
      expect(body).not.toHaveProperty("stripe_price_id");
      expect(body).not.toHaveProperty("price_id");
      expect(body).not.toHaveProperty("commission_rate");
      expect(body).not.toHaveProperty("commission_rate_bps");
      expect(body).not.toHaveProperty("amount");
      expect(body).not.toHaveProperty("subscription_price");
      expect(body).not.toHaveProperty("billing_amount");
    }
  });

  it("formats marketplace commission disclosures before subscription pricing", () => {
    expect(formatCommissionPercentFromBps(1100)).toBe("11%");
    expect(formatCommissionPercentFromBps(800)).toBe("8%");
    expect(getMarketplaceCommissionDisclosure("starter_annual")).toBe("11% marketplace commission");
    expect(getMarketplaceCommissionDisclosure("founders_annual")).toBe(
      "8% marketplace commission · 2-year rate lock"
    );
    expect(getMarketplaceCommissionDisclosure(FREE_PLAN_CODE)).toMatch(/not included/i);
    expect(FALLBACK_CHECKOUT_PLANS.find((p) => p.code === "starter_annual").commission_rate_bps).toBe(
      1100
    );
  });

  it("uses Standard as the free plan display name", () => {
    const standard = FALLBACK_CHECKOUT_PLANS.find((p) => p.code === FREE_PLAN_CODE);
    expect(standard.checkout_label).toBe("Standard");
  });

  it("displays Founder's Annual as $319, not $299", () => {
    expect(CHECKOUT_PRICE_LABELS.founders_annual).toBe("$319/year");
    expect(CHECKOUT_PRICE_LABELS.founders_annual).not.toContain("299");
    const foundersAnnual = FALLBACK_CHECKOUT_PLANS.find((p) => p.code === "founders_annual");
    expect(foundersAnnual.amount_cents).toBe(31900);
  });

  it("displays Food Truck as $89, not $39", () => {
    expect(CHECKOUT_PRICE_LABELS[FOOD_TRUCK_ANNUAL_PLAN_CODE]).toBe("$89/year");
    expect(CHECKOUT_PRICE_LABELS[FOOD_TRUCK_ANNUAL_PLAN_CODE]).not.toContain("39");
    const foodTruck = FALLBACK_CHECKOUT_PLANS.find((p) => p.code === FOOD_TRUCK_ANNUAL_PLAN_CODE);
    expect(foodTruck.amount_cents).toBe(8900);
  });

  it("does not treat success URL alone as an active paid subscription", () => {
    expect(shouldTreatCheckoutSuccessAsActive(null)).toBe(false);
    expect(shouldTreatCheckoutSuccessAsActive({ plan_code: "starter_monthly", status: "incomplete" })).toBe(false);
    expect(shouldTreatCheckoutSuccessAsActive({ plan_code: "starter_monthly", status: "processing" })).toBe(false);
    expect(isPaidSubscriptionConfirmed({ plan_code: FREE_PLAN_CODE, status: "active" })).toBe(false);
    expect(
      shouldTreatCheckoutSuccessAsActive({
        plan_code: "starter_monthly",
        status: "active",
      })
    ).toBe(true);
  });

  it("preserves food truck intended plan across deferred operator checkout", () => {
    rememberIntendedCheckoutPlanCode(FOOD_TRUCK_ANNUAL_PLAN_CODE);
    expect(sessionStorage.getItem("menuply.intended_checkout_plan_code")).toBe(
      FOOD_TRUCK_ANNUAL_PLAN_CODE
    );
  });

  it("does not remap checkout success plan codes to Pro", () => {
    expect(resolveReturnedCheckoutPlanCode("founders_annual")).toBe("founders_annual");
    expect(resolveReturnedCheckoutPlanCode("starter_monthly")).toBe("starter_monthly");
    expect(resolveReturnedCheckoutPlanCode("pro_monthly")).toBe("pro_monthly");
  });
});

describe("source contracts for active selectors", () => {
  async function readSource(relativeFromLibTest) {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const here = path.dirname(fileURLToPath(import.meta.url));
    return fs.readFileSync(path.resolve(here, relativeFromLibTest), "utf8");
  }

  it("OperatorSubscription source does not submit pro_* for new checkout", async () => {
    const file = await readSource("../../pages/operator/OperatorSubscription.jsx");
    expect(file).not.toMatch(/handleStripeCheckout\(\s*["']pro_monthly["']/);
    expect(file).not.toMatch(/handleStripeCheckout\(\s*["']pro_annual["']/);
    expect(file).toMatch(/starter_monthly/);
    expect(file).toMatch(/starter_annual/);
    expect(file).toMatch(/founders_monthly/);
    expect(file).toMatch(/founders_annual/);
    expect(file).toMatch(/FOOD_TRUCK_ANNUAL_PLAN_CODE/);
    expect(file).toMatch(/CHECKOUT_PRICE_LABELS/);
    expect(file).toMatch(/buildOperatorStripeCheckoutBody/);
    expect(file).toMatch(/isPaidSubscriptionConfirmed/);
    expect(file).not.toMatch(/\$299/);
  });

  it("SubscriptionSelect free path skips Stripe and Founder's shows $319", async () => {
    const file = await readSource("../../pages/SubscriptionSelect.jsx");
    expect(file).toMatch(/choosePublished/);
    expect(file).toMatch(/FREE_PLAN_CODE/);
    expect(file).toMatch(/buildOwnerStripeCheckoutBody/);
    expect(file).toMatch(/isFreePlanCode\(planCode\)/);
    expect(file).toMatch(/CHECKOUT_PRICE_LABELS\.founders_annual/);
    expect(file).not.toMatch(/\$299\/year/);
    expect(file).not.toMatch(/returnedPlanCode === "pro_annual"/);
    expect(file).toMatch(/Payment received/);
    expect(file).not.toMatch(/Plan confirmed/);
  });

  it("FoodTruckSignup shows $89 and wires like restaurant signup", async () => {
    const file = await readSource("../../pages/FoodTruckSignup.jsx");
    expect(file).toMatch(/rememberIntendedCheckoutPlanCode\(FOOD_TRUCK_ANNUAL_PLAN_CODE\)/);
    expect(file).toMatch(/CHECKOUT_PRICE_LABELS\[FOOD_TRUCK_ANNUAL_PLAN_CODE\]/);
    expect(file).not.toMatch(/\$39\/year/);
    expect(file).not.toMatch(/Select Food Truck/);
    expect(file).not.toMatch(/food-truck-plan-signup-cta/);
    expect(file).toMatch(/persistRestaurantOnboardingState/);
    expect(file).toMatch(/\/operator\/verify-email/);
    expect(file).toMatch(/autoSend:\s*true/);
    expect(file).toMatch(/food_truck_onboarding=1/);
  });
});
