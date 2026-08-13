import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveRestaurantStatusLightTone,
  buildMenuVerificationAttributionText,
  buildRestaurantStatusLightProps,
  isOnlineOrderingAvailable,
} from "../src/lib/restaurantStatusLight.js";

test("resolveRestaurantStatusLightTone defaults unclaimed restaurants to red", () => {
  assert.equal(resolveRestaurantStatusLightTone({ claimStatus: "unclaimed" }), "red");
});

test("resolveRestaurantStatusLightTone marks Standard restaurants yellow", () => {
  assert.equal(
    resolveRestaurantStatusLightTone({
      claimStatus: "claimed",
      subscriptionPlan: "standard",
    }),
    "yellow"
  );
});

test("resolveRestaurantStatusLightTone marks paid online ordering restaurants green", () => {
  assert.equal(
    resolveRestaurantStatusLightTone({
      claimStatus: "claimed",
      subscriptionPlan: "pro",
      isPro: true,
      orderAcceptanceStatus: "accepting_orders",
    }),
    "green"
  );
});

test("buildMenuVerificationAttributionText formats rep verification copy", () => {
  const text = buildMenuVerificationAttributionText("2026-07-06T12:00:00.000Z");
  assert.match(text, /^Last verified by rep\. on /);
});

test("resolveRestaurantStatusLightTone marks paid online ordering restaurants green without claim fallback", () => {
  assert.equal(
    resolveRestaurantStatusLightTone({
      claimStatus: "unclaimed",
      subscriptionPlan: "pro",
      isPro: true,
      orderAcceptanceStatus: "accepting_orders",
    }),
    "green"
  );
});

test("buildRestaurantStatusLightProps includes subscription and claim fields", () => {
  const props = buildRestaurantStatusLightProps({
    claim_status: "unclaimed",
    subscription_plan: "unverified",
    menu_presentation: { plan_slug: "free" },
  });
  assert.equal(props.claimStatus, "unclaimed");
  assert.equal(props.subscriptionPlan, "unverified");
  assert.equal(props.tone, "red");
});

test("isOnlineOrderingAvailable respects ordering_availability.available", () => {
  assert.equal(
    isOnlineOrderingAvailable({
      ordering_availability: { available: false, reason_code: "ordering_disabled" },
      order_acceptance_status: "accepting_orders",
      subscription_plan: "pro",
    }),
    false
  );
  assert.equal(
    isOnlineOrderingAvailable({
      ordering_availability: { available: true },
      order_acceptance_status: "accepting_orders",
      subscription_plan: "pro",
    }),
    true
  );
});

test("isOnlineOrderingAvailable fails closed without availability payload for unpaid restaurants", () => {
  assert.equal(
    isOnlineOrderingAvailable({
      order_acceptance_status: "accepting_orders",
      subscription_plan: "unverified",
    }),
    false
  );
  assert.equal(
    isOnlineOrderingAvailable({
      order_acceptance_status: "accepting_orders",
      subscription_plan: "pro",
      is_pro: true,
    }),
    true
  );
});
