/**
 * Automatic onboarding checkpoints + login resume.
 *
 * Principle: operators never manually "save & exit". A checkpoint is created only
 * after a stage validates and the server confirms the update.
 *
 * Core path (blocks dashboard until done or Continue later at gate):
 *   … → locations → menu_upload → menu_worksheet → default_menu_ready
 *   → public_profile_edit → profile_complete_gate
 *
 * Deferred optional (Finish setup; do not force login redirect):
 *   merchant_onboarding → delivery_onboarding → menu_design (last)
 *
 * Server SoT: restaurant_onboarding_progress (+ stage_records). localStorage is assist-only.
 */

/** Full product sequence (canonical). */
export const ONBOARDING_STAGE_ORDER = Object.freeze([
  "welcome",
  "plan_selected",
  "account_created",
  "email_verified",
  "business_organization",
  "payment",
  // Reserved: qr_merchandise — not Stripe-live yet
  "restaurant_information",
  "locations",
  "menu_upload",
  "menu_worksheet",
  "default_menu_ready",
  "public_profile_edit",
  "profile_complete_gate",
  "merchant_onboarding",
  "delivery_onboarding",
  "menu_design",
  "complete",
]);

/** Core stages that block dashboard resume until done / gate continue_later. */
export const CORE_ONBOARDING_CHECKPOINT_ORDER = Object.freeze([
  "account_created",
  "email_verified",
  "business_organization",
  "payment",
  "restaurant_information",
  "locations",
  "menu_upload",
  "menu_worksheet",
  "default_menu_ready",
  "public_profile_edit",
  "profile_complete_gate",
]);

/** Deferred Finish-setup tracks (optional; design last). */
export const DEFERRED_ONBOARDING_STAGES = Object.freeze([
  "merchant_onboarding",
  "delivery_onboarding",
  "menu_design",
]);

/** Ordered completion keys used for forced resume (core only). */
export const ONBOARDING_CHECKPOINT_ORDER = CORE_ONBOARDING_CHECKPOINT_ORDER;

/** Map stored progress / current_step_key values → resume route. */
export const ONBOARDING_STEP_ROUTES = Object.freeze({
  welcome: "/restaurant/onboarding/welcome",
  plan_selected: "/restaurant/subscription",
  business_organization: "/restaurant/onboarding/organization",
  restaurant_information: "/restaurant/onboarding/information",
  restaurant_information_draft: "/restaurant/onboarding/information",
  locations: "/restaurant/onboarding/locations",
  locations_deferred: "/restaurant/onboarding/locations",
  choose_plan: "/restaurant/subscription",
  subscription_checkout: "/restaurant/subscription",
  payment: "/restaurant/subscription",
  qr_merchandise: "/restaurant/qr-upsell",
  menu_upload: "/restaurant/menu-upload-choice",
  import_menu: "/restaurant/menu-upload-choice",
  process_menu: "/restaurant/menu-upload-choice",
  menu_worksheet: null, // needs restaurantId+menuId — resolved via progress / worksheet entry
  review_menu: null,
  menu_review: null,
  default_menu_ready: "/operator/my-account?tab=profile&onboarding=1",
  public_profile_edit: "/operator/my-account?tab=profile&onboarding=1",
  public_profile_review: "/operator/my-account?tab=profile&onboarding=1",
  basic_public_profile: "/operator/my-account?tab=profile&onboarding=1",
  profile_complete_gate: "/restaurant/onboarding/profile-complete",
  merchant_onboarding: "/operator/merchant",
  delivery_onboarding: "/operator/delivery",
  menu_design: "/restaurant/design-select",
  launch_checklist: "/operator",
  published: "/operator",
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
  business_organization: "business_organization",
  organization: "business_organization",
  locations: "locations",
  locations_deferred: "locations",
  choose_plan: "payment",
  subscription_checkout: "payment",
  payment: "payment",
  qr_merchandise: "qr_merchandise",
  import_menu: "menu_upload",
  menu_upload: "menu_upload",
  process_menu: "menu_upload",
  review_menu: "menu_worksheet",
  menu_review: "menu_worksheet",
  menu_worksheet: "menu_worksheet",
  default_menu_ready: "default_menu_ready",
  publish_menu: "default_menu_ready",
  published: "default_menu_ready",
  basic_public_profile: "public_profile_edit",
  public_profile_review: "public_profile_edit",
  public_profile_edit: "public_profile_edit",
  profile_complete_gate: "profile_complete_gate",
  merchant_onboarding: "merchant_onboarding",
  delivery_onboarding: "delivery_onboarding",
  menu_design: "menu_design",
  launch_checklist: "complete",
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
  email_verified: "/restaurant/onboarding/organization",
  business_organization: null, // plan-dependent — payment or information
  payment: "/restaurant/onboarding/information",
  restaurant_information: "/restaurant/onboarding/locations",
  locations: "/restaurant/menu-upload-choice",
  menu_upload: null, // worksheet path is id-specific
  menu_worksheet: "/operator/my-account?tab=profile&onboarding=1",
  default_menu_ready: "/operator/my-account?tab=profile&onboarding=1",
  public_profile_edit: "/restaurant/onboarding/profile-complete",
  profile_complete_gate: "/operator",
  merchant_onboarding: "/operator",
  delivery_onboarding: "/operator",
  menu_design: "/operator",
});

/** Finish-setup card definitions for Operator Dashboard (design last). */
export const FINISH_SETUP_STEPS = Object.freeze([
  {
    id: "merchant_onboarding",
    title: "Set up payments",
    body: "Connect your merchant account so you can accept orders on Menuply.",
    href: "/operator/merchant",
  },
  {
    id: "delivery_onboarding",
    title: "Set up delivery",
    body: "Connect delivery providers when you are ready to offer delivery.",
    href: "/operator/delivery",
  },
  {
    id: "menu_design",
    title: "Customize menu design",
    body: "Pick a menu look and layout — available after your content is live.",
    href: "/restaurant/design-select",
  },
]);

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

export function getStageRecords(restaurant = {}) {
  return restaurant.draft_payload?.stage_records || restaurant.stage_records || {};
}

/** Core onboarding done: gate completed or continue_later recorded (or legacy live). */
export function isCoreOnboardingComplete(restaurant = {}) {
  const completed = normalizeCompletedKeys(restaurant?.completed_step_keys);
  const stageRecords = getStageRecords(restaurant);
  const gate = stageRecords.profile_complete_gate;
  const step = String(restaurant?.current_step_key || "").trim();

  if (completed.has("complete") || completed.has("menu_live")) return true;
  if (step === "menu_live" || step === "complete") return true;

  if (
    completed.has("profile_complete_gate") ||
    gate?.status === "completed" ||
    gate?.status === "skipped" ||
    gate?.skip_reason === "continue_later"
  ) {
    return true;
  }

  // Legacy restaurants already live before post-locations reorder
  if (restaurant?.has_published_menu === true) {
    if (
      !step ||
      step === "published" ||
      step === "launch_checklist" ||
      step === "merchant_onboarding" ||
      step === "delivery_onboarding" ||
      step === "menu_design" ||
      step === "basic_public_profile"
    ) {
      return true;
    }
    // Mid core path with a published menu still needs gate if profile edit pending
    if (completed.has("default_menu_ready") && completed.has("public_profile_edit")) {
      return true;
    }
  }

  return false;
}

/**
 * Login / dashboard eligibility. Core complete → dashboard even if deferred stages remain.
 * Legacy: has_published_menu + old published keys still count once gate-equivalent exists.
 */
export function isOnboardingComplete(restaurant = {}) {
  return isCoreOnboardingComplete(restaurant);
}

/** Incomplete deferred Finish-setup steps (preserves order; design last). */
export function getIncompleteFinishSetupSteps(restaurant = {}) {
  const completed = normalizeCompletedKeys(restaurant?.completed_step_keys);
  const stageRecords = getStageRecords(restaurant);
  return FINISH_SETUP_STEPS.filter((step) => {
    if (completed.has(step.id)) return false;
    const rec = stageRecords[step.id];
    if (rec?.status === "completed" || rec?.status === "skipped") return false;
    return true;
  });
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
    const stageRecords = getStageRecords(restaurant);
    const paymentRec = stageRecords.payment;
    const free = isFreePlanPaymentBypassEligible(plan);
    if (free && !(paymentRec?.status === "skipped" || paymentRec?.skip_reason === "free_plan")) {
      if (restaurant.require_payment_bypass_record === true) {
        reopen.push({ stage: "payment", reason: "free_plan_bypass_not_recorded" });
      }
    }
  }

  return reopen;
}

/**
 * Resolve the route for the first incomplete *core* stage.
 * Deferred merchant/delivery/design never force login away from dashboard once core is done.
 */
export function resolveNextOnboardingRoute(restaurant = {}) {
  if (!restaurant) return "/operator/claim";
  if (isCoreOnboardingComplete(restaurant)) return "/operator";

  const reopen = revalidateCompletedStages(restaurant);
  if (reopen[0]) {
    const stage = reopen[0].stage;
    if (stage === "business_organization") return "/restaurant/onboarding/organization";
    if (stage === "payment") return "/restaurant/subscription";
    if (stage === "restaurant_information") return "/restaurant/onboarding/information";
    if (stage === "locations") return "/restaurant/onboarding/locations";
  }

  const completed = normalizeCompletedKeys(restaurant.completed_step_keys);
  if (restaurant.id || restaurant.restaurant_id) completed.add("account_created");

  for (const checkpoint of CORE_ONBOARDING_CHECKPOINT_ORDER) {
    if (completed.has(checkpoint)) continue;
    if (checkpoint === "account_created") continue;
    if (checkpoint === "email_verified") return "/operator/verify-email";
    if (checkpoint === "business_organization") return "/restaurant/onboarding/organization";
    if (checkpoint === "payment") {
      const plan = String(
        restaurant.selected_plan_code || restaurant.selected_plan || restaurant.plan || ""
      ).toLowerCase();
      const stageRecords = getStageRecords(restaurant);
      const paymentRec = stageRecords.payment;
      if (
        isFreePlanPaymentBypassEligible(plan) &&
        (paymentRec?.status === "skipped" || paymentRec?.skip_reason === "free_plan")
      ) {
        continue;
      }
      return "/restaurant/subscription";
    }
    if (checkpoint === "restaurant_information") return "/restaurant/onboarding/information";
    if (checkpoint === "locations") return "/restaurant/onboarding/locations";
    if (checkpoint === "menu_upload") return "/restaurant/menu-upload-choice";
    if (checkpoint === "menu_worksheet") {
      // Prefer upload choice if worksheet ids unknown; PdfUpload auto-routes after parse.
      return "/restaurant/menu-upload-choice";
    }
    if (checkpoint === "default_menu_ready") {
      return "/operator/my-account?tab=profile&onboarding=1";
    }
    if (checkpoint === "public_profile_edit") {
      return "/operator/my-account?tab=profile&onboarding=1";
    }
    if (checkpoint === "profile_complete_gate") {
      return "/restaurant/onboarding/profile-complete";
    }
  }

  const step = String(restaurant.current_step_key || "").trim();
  if (step && ONBOARDING_STEP_ROUTES[step]) {
    const route = ONBOARDING_STEP_ROUTES[step];
    if (route === "/operator" || route == null) return "/operator";
    return route;
  }

  if (!restaurant.has_published_menu) {
    return "/restaurant/onboarding/organization";
  }
  return "/operator";
}

/**
 * Login / session resume destination.
 * Core incomplete → force resume. Core complete → dashboard (deferred never blocks).
 */
export function resolveOperatorResumePath(restaurant, preferredNextPath) {
  if (!restaurant) return "/operator/claim";

  if (isCoreOnboardingComplete(restaurant)) {
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

export function worksheetPath(restaurantId, menuId, uploadSessionId = null) {
  const rid = Number(restaurantId);
  const mid = Number(menuId);
  if (!rid || !mid) return null;
  const qs = uploadSessionId
    ? `?upload_session_id=${encodeURIComponent(String(uploadSessionId))}`
    : "";
  return `/operator/restaurants/${rid}/menus/${mid}/worksheet${qs}`;
}

export function profileEditOnboardingPath() {
  return "/operator/my-account?tab=profile&onboarding=1";
}
