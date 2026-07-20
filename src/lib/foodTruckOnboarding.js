import { FOOD_TRUCK_ANNUAL_PLAN_CODE } from "./menuplyCheckoutPlans.js";

export const FOOD_TRUCK_ONBOARDING_STAGES = Object.freeze([
  "email_verified",
  "basic_information_complete",
  "menu_uploaded",
  "subscription_active",
  "onboarding_complete",
  "detailed_information_complete",
]);

export function isFoodTruckRestaurant(restaurant = {}) {
  const type = String(restaurant.restaurant_type || restaurant.category || "").trim().toLowerCase();
  const plan = String(
    restaurant.selected_plan_code ||
      restaurant.subscription_plan_code ||
      restaurant.plan_code ||
      ""
  ).trim().toLowerCase();
  return (
    type === "food_truck" ||
    plan === FOOD_TRUCK_ANNUAL_PLAN_CODE ||
    plan === "foodtruck_verified_annual"
  );
}

export function getFoodTruckStageRecords(restaurant = {}) {
  return restaurant.draft_payload?.stage_records || restaurant.stage_records || {};
}

export function getFoodTruckCompletedKeys(restaurant = {}) {
  const completed = Array.isArray(restaurant.completed_step_keys)
    ? restaurant.completed_step_keys
    : [];
  return new Set(completed.map(String));
}

export function isFoodTruckStageComplete(restaurant = {}, stage) {
  if (stage === "email_verified") return true;
  if (stage === "subscription_active") {
    if (restaurant.subscription_active === true) return true;
  }
  const completed = getFoodTruckCompletedKeys(restaurant);
  if (completed.has(stage)) return true;
  const rec = getFoodTruckStageRecords(restaurant)[stage];
  return rec?.status === "completed" || rec?.status === "skipped";
}

export function resolveFoodTruckFirstIncompleteStage(restaurant = {}) {
  for (const stage of FOOD_TRUCK_ONBOARDING_STAGES) {
    if (!isFoodTruckStageComplete(restaurant, stage)) return stage;
  }
  return null;
}

export function routeForFoodTruckOnboardingStage(stage) {
  switch (stage) {
    case "email_verified":
      return "/operator/verify-email";
    case "basic_information_complete":
      return "/foodtruck/signup";
    case "menu_uploaded":
      return "/restaurant/pdf-upload?food_truck_onboarding=1";
    case "subscription_active":
      return "/operator/subscription?onboarding=food_truck";
    case "onboarding_complete":
      return "/foodtruck/onboarding/details?activated=1";
    case "detailed_information_complete":
      return "/foodtruck/onboarding/details";
    default:
      return "/operator";
  }
}

export function resolveFoodTruckOnboardingRoute(restaurant = {}) {
  const stage = resolveFoodTruckFirstIncompleteStage(restaurant);
  return stage ? routeForFoodTruckOnboardingStage(stage) : "/operator";
}

export function isFoodTruckOnboardingComplete(restaurant = {}) {
  return !resolveFoodTruckFirstIncompleteStage(restaurant);
}
