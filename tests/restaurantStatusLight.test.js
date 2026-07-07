import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveRestaurantStatusLightTone,
  buildMenuVerificationAttributionText,
  buildRestaurantStatusLightProps,
} from "../src/lib/restaurantStatusLight.js";

test("resolveRestaurantStatusLightTone defaults unclaimed restaurants to red", () => {
  assert.equal(resolveRestaurantStatusLightTone({ claimStatus: "unclaimed" }), "red");
});

test("resolveRestaurantStatusLightTone marks claimed verified restaurants yellow", () => {
  assert.equal(
    resolveRestaurantStatusLightTone({
      claimStatus: "claimed",
      subscriptionPlan: "verified",
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

test("resolveRestaurantStatusLightTone keeps unclaimed restaurants red even with ordering enabled", () => {
  assert.equal(
    resolveRestaurantStatusLightTone({
      claimStatus: "unclaimed",
      subscriptionPlan: "pro",
      isPro: true,
      orderAcceptanceStatus: "accepting_orders",
    }),
    "red"
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
