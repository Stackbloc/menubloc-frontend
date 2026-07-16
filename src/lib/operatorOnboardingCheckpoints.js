/**
 * Automatic onboarding checkpoints + login resume.
 *
 * Principle: operators never manually "save & exit". A checkpoint is created only
 * after a stage validates and the server confirms the update. On login, resume at
 * the first incomplete stage — never ask where to resume.
 *
 * Server SoT: restaurant_onboarding_progress (+ stage_records). localStorage is assist-only.
 */

/** Approved product sequence (canonical). */
export const ONBOARDING_STAGE_ORDER = Object.freeze([
  "welcome",
  "plan_selected",
  "account_created",
  "email_verified",
  "restaurant_information",
  "locations",
  "payment",
  "public_profile_review",
  "menu_design",
  "menu_upload",
  "menu_review",
  "launch_checklist",
  "published",
  "complete",
]);

/** Ordered completion keys (aliases normalized via COMPLETED_KEY_ALIASES). */
export const ONBOARDING_CHECKPOINT_ORDER = Object.freeze([
  "account_created",
  "email_verified",
  "restaurant_information",
  "locations",
  "payment",
  "public_profile_review",
  "menu_design",
  "menu_upload",
  "menu_review",
  "launch_checklist",
  "published",
]);

/** Map stored progress / current_step_key values → resume route. */
export const ONBOARDING_STEP_ROUTES = Object.freeze({
  welcome: "/restaurant/onboarding/welcome",
  plan_selected: "/restaurant/subscription",
  restaurant_information: "/restaurant/onboarding/information",
  restaurant_information_draft: "/restaurant/onboarding/information",
  locations: "/restaurant/onboarding/locations",
  locations_deferred: "/restaurant/onboarding/locations",
  choose_plan: "/restaurant/subscription",
  subscription_checkout: "/restaurant/subscription",
  payment: "/restaurant/subscription",
  basic_public_profile: "/restaurant/design-select",
  public_profile_review: "/restaurant/design-select",
  menu_design: "/restaurant/design-select",
  import_menu: "/restaurant/onboarding/welcome",
  menu_upload: "/restaurant/menu-upload-choice",
  process_menu: "/restaurant/onboarding/processing",
  review_menu: "/operator/menulab",
  menu_review: "/operator/menulab",
  publish_menu: "/operator/menulab",
  publish: "/operator/menulab",
  published: "/operator",
  launch_checklist: "/restaurant/onboarding/launch-checklist",
  menu_live: "/operator",
  complete: "/operator",
});

const COMPLETED_KEY_ALIASES = Object.freeze({
  create_operator_account: "account_created",
  account: "account_created",
  account_created: "account_created",
  public_restaurant_information: "restaurant_information",
  restaurant_information: "restaurant_information",
  email_verified: "email_verified",
  locations: "locations",
  locations_deferred: "locations",
  choose_plan: "payment",
  subscription_checkout: "payment",
  payment: "payment",
  basic_public_profile: "public_profile_review",
  public_profile_review: "public_profile_review",
  menu_design: "menu_design",
  import_menu: "menu_upload",
  menu_upload: "menu_upload",
  process_menu: "menu_upload",
  review_menu: "menu_review",
  menu_review: "menu_review",
  publish_menu: "published",
  publish: "published",
  published: "published",
  launch_checklist: "launch_checklist",
  menu_live: "complete",
  complete: "complete",
});

const FREE_PLAN_CODES = new Set(["verified", "published_free", "published"]);

export function isFreePlanPaymentBypassEligible(planCode) {
  return FREE_PLAN_CODES.has(String(planCode || "").trim().toLowerCase());
}

/** Next route after a given canonical checkpoint completes. */
export const NEXT_ROUTE_AFTER_CHECKPOINT = Object.freeze({
  account_created: "/operator/verify-email",
  email_verified: "/restaurant/onboarding/information",
  restaurant_information: "/restaurant/onboarding/locations",
  locations: null, // plan-dependent — resolved by resolvePostLocationsPath / server complete
  payment: "/restaurant/design-select",
  public_profile_review: "/restaurant/design-select",
  menu_design: "/restaurant/menu-upload-choice",
  menu_upload: "/restaurant/onboarding/processing",
  menu_review: "/restaurant/onboarding/success",
  launch_checklist: "/operator",
  published: "/operator",
});

function normalizeCompletedKeys(raw) {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];
  const set = new Set();
  for (const key of list) {
    const canonical = COMPLETED_KEY_ALIASES[String(key)] || String(key);
    if (canonical) set.add(canonical);
  }
  return set;
}

export function isOnboardingComplete(restaurant = {}) {
  if (restaurant?.has_published_menu === true) return true;
  const step = String(restaurant?.current_step_key || "").trim();
  if (step === "menu_live" || step === "complete") return true;
  const completed = normalizeCompletedKeys(restaurant?.completed_step_keys);
  return completed.has("published") || (completed.has("publish") && completed.has("menu_review"));
}

/**
 * Client-side revalidation hints (server /checkpoint is authoritative when available).
 */
export function revalidateCompletedStages(restaurant = {}) {
  const completed = normalizeCompletedKeys(restaurant.completed_step_keys);
  const reopen = [];

  if (completed.has("restaurant_information")) {
    const ok =
      String(restaurant.restaurant_name || "").trim() &&
      String(restaurant.category || "").trim() &&
      String(restaurant.phone || "").trim();
    if (restaurant.restaurant_name != null && !ok) {
      reopen.push({ stage: "restaurant_information", reason: "information_incomplete" });
    }
  }

  if (completed.has("locations")) {
    if (
      restaurant.valid_location_count != null &&
      Number(restaurant.valid_location_count) < 1
    ) {
      reopen.push({ stage: "locations", reason: "no_valid_owned_location_address" });
    }
  }

  if (completed.has("payment")) {
    const plan = String(
      restaurant.selected_plan_code || restaurant.selected_plan || restaurant.plan || ""
    ).toLowerCase();
    const stageRecords = restaurant.draft_payload?.stage_records || restaurant.stage_records || {};
    const paymentRec = stageRecords.payment;
    const free = isFreePlanPaymentBypassEligible(plan);
    if (free && !(paymentRec?.status === "skipped" || paymentRec?.skip_reason === "free_plan")) {
      // Prefer server complete path — if keys say payment done without skip record, reopen locations complete
      if (restaurant.require_payment_bypass_record === true) {
        reopen.push({ stage: "payment", reason: "free_plan_bypass_not_recorded" });
      }
    }
  }

  return reopen;
}

/**
 * Resolve the route for the first incomplete stage.
 * Prefers server `current_step_key` (already points at next/in-progress stage).
 * Falls back to completed_step_keys order.
 */
export function resolveNextOnboardingRoute(restaurant = {}) {
  if (!restaurant) return "/operator/claim";
  if (isOnboardingComplete(restaurant)) return "/operator";

  const reopen = revalidateCompletedStages(restaurant);
  if (reopen[0]) {
    const stage = reopen[0].stage;
    if (stage === "restaurant_information") return "/restaurant/onboarding/information";
    if (stage === "locations" || stage === "payment") return "/restaurant/onboarding/locations";
  }

  const step = String(restaurant.current_step_key || "").trim();
  if (step && ONBOARDING_STEP_ROUTES[step]) {
    const route = ONBOARDING_STEP_ROUTES[step];
    if (route === "/operator") return "/operator";
    return route;
  }

  const completed = normalizeCompletedKeys(restaurant.completed_step_keys);
  if (restaurant.id || restaurant.restaurant_id) completed.add("account_created");

  for (const checkpoint of ONBOARDING_CHECKPOINT_ORDER) {
    if (completed.has(checkpoint)) continue;
    if (checkpoint === "account_created") continue;
    if (checkpoint === "email_verified") return "/operator/verify-email";
    if (checkpoint === "restaurant_information") return "/restaurant/onboarding/information";
    if (checkpoint === "locations") return "/restaurant/onboarding/locations";
    if (checkpoint === "payment") {
      const plan = String(
        restaurant.selected_plan_code || restaurant.selected_plan || restaurant.plan || ""
      ).toLowerCase();
      const stageRecords = restaurant.draft_payload?.stage_records || restaurant.stage_records || {};
      const paymentRec = stageRecords.payment;
      if (
        isFreePlanPaymentBypassEligible(plan) &&
        (paymentRec?.status === "skipped" || paymentRec?.skip_reason === "free_plan")
      ) {
        continue;
      }
      if (isFreePlanPaymentBypassEligible(plan) && !paymentRec) {
        // Explicit bypass not recorded yet — send through Locations complete
        return "/restaurant/onboarding/locations";
      }
      return "/restaurant/subscription";
    }
    if (checkpoint === "public_profile_review" || checkpoint === "menu_design") {
      return "/restaurant/design-select";
    }
    if (checkpoint === "menu_upload") return "/restaurant/menu-upload-choice";
    if (checkpoint === "menu_review" || checkpoint === "published") return "/operator/menulab";
    if (checkpoint === "launch_checklist") return "/restaurant/onboarding/launch-checklist";
  }

  if (!restaurant.has_published_menu) {
    return "/restaurant/onboarding/information";
  }
  return "/operator";
}

/**
 * Login / session resume destination.
 * Incomplete onboarding always wins over preferredNextPath (no dashboard bypass).
 */
export function resolveOperatorResumePath(restaurant, preferredNextPath) {
  if (!restaurant) return "/operator/claim";

  if (isOnboardingComplete(restaurant)) {
    const preferred = String(preferredNextPath || "").trim();
    if (preferred.startsWith("/") && !preferred.startsWith("/operator/login")) {
      if (preferred === "/operator" || preferred.startsWith("/operator/")) {
        return preferred;
      }
    }
    return "/operator";
  }

  return resolveNextOnboardingRoute(restaurant);
}

/** Build checkpoint patch after a stage successfully completes on the server. */
export function buildCheckpointProgressPatch(completedCheckpointKey, nextStepKey, extra = {}) {
  return {
    current_step_key: nextStepKey,
    completed_step_keys_append: completedCheckpointKey,
    ...extra,
  };
}
