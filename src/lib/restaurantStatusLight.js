import { isRestaurantVerifiedMenuStatus } from "./menuVerificationLabels.js";

const STANDARD_SUBSCRIPTION_PLANS = new Set(["standard", "standard_free", "published_free", "verified"]);
const PAID_SUBSCRIPTION_PLANS = new Set([
  "pro",
  "pro_monthly",
  "pro_annual",
  "starter_monthly",
  "starter_annual",
  "founder",
  "founders",
  "founders_annual",
  "food_truck",
  "food_truck_monthly",
  "food_truck_annual",
  "performance",
  "enterprise",
]);

/** Returns "pro", "verified", or null. */
export function normalizeRestaurantProfileTier(profileTier, listingStatus) {
  for (const value of [profileTier, listingStatus]) {
    const token = String(value || "").trim().toLowerCase();
    if (!token) continue;
    if (token.includes("pro")) return "pro";
    if (token.includes("verified")) return "verified";
  }
  return null;
}

export function normalizeClaimStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export function isClaimedRestaurantProfile(claimStatus) {
  const status = normalizeClaimStatus(claimStatus);
  return status === "claimed" || status === "verified";
}

export function hasPaidSubscriptionPlan({
  subscriptionPlan,
  planSlug,
  isPro,
  isPaidSubscriber,
} = {}) {
  if (isPro === true || isPaidSubscriber === true) return true;
  const plan = String(subscriptionPlan || planSlug || "").trim().toLowerCase();
  return PAID_SUBSCRIPTION_PLANS.has(plan);
}

export function hasOnlineOrderingEnabled({ orderAcceptanceStatus } = {}) {
  return String(orderAcceptanceStatus || "").trim().toLowerCase() === "accepting_orders";
}

export function formatOrderingResumeLabel(iso, timeZone) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone || undefined,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Customer-facing ordering availability copy from public menu / restaurant payload.
 */
export function getOrderingAvailabilityMessage(data) {
  const availability = data?.ordering_availability || data?.restaurant?.ordering_availability || null;
  if (availability?.available === true) return null;
  if (availability?.message) return availability.message;

  const status = String(
    availability?.availability_status ||
      data?.order_acceptance_status ||
      data?.restaurant?.order_acceptance_status ||
      ""
  )
    .trim()
    .toLowerCase();
  const resumeAt =
    availability?.resume_at ||
    data?.order_pause_expires_at ||
    data?.order_closed_expires_at ||
    data?.restaurant?.order_pause_expires_at ||
    data?.restaurant?.order_closed_expires_at ||
    null;
  const when = formatOrderingResumeLabel(resumeAt, data?.timezone || data?.restaurant?.timezone);

  if (status === "paused") {
    return when
      ? `Online ordering is currently paused. Orders resume at ${when}.`
      : "Online ordering is currently paused.";
  }
  if (status === "closed" || status === "temporarily_closed") {
    return when
      ? `This restaurant is temporarily closed until ${when}.`
      : "This restaurant is temporarily closed.";
  }
  if (status === "outside_hours" || availability?.reason_code === "outside_store_hours") {
    return when
      ? `Online ordering is closed. Ordering opens ${when}.`
      : "Online ordering is closed for today.";
  }
  if (availability?.available === false) {
    return "Online ordering is currently unavailable.";
  }
  return null;
}

export function isOnlineOrderingAvailable(data) {
  const availability = data?.ordering_availability || data?.restaurant?.ordering_availability;
  if (availability && typeof availability.available === "boolean") {
    return availability.available === true;
  }
  return hasOnlineOrderingEnabled({
    orderAcceptanceStatus:
      data?.order_acceptance_status || data?.restaurant?.order_acceptance_status,
  });
}

/** Tap-to-order coach on public menus — paid plan + accepting online orders only. */
export function shouldShowMenuPurchaseWaiterHint(data) {
  const props = buildRestaurantStatusLightProps(data);
  return (
    hasPaidSubscriptionPlan(props) &&
    hasOnlineOrderingEnabled(props)
  );
}

export function hasStandardSubscriptionPlan({ subscriptionPlan, planSlug } = {}) {
  const plan = String(subscriptionPlan || planSlug || "").trim().toLowerCase();
  return STANDARD_SUBSCRIPTION_PLANS.has(plan);
}

export function isVerifiedRestaurantProfile({
  menuStatus,
  subscriptionPlan,
  profileTier,
  listingStatus,
} = {}) {
  if (isRestaurantVerifiedMenuStatus(menuStatus)) return true;
  if (String(subscriptionPlan || "").trim().toLowerCase() === "verified") return true;
  const tier = normalizeRestaurantProfileTier(profileTier, listingStatus);
  return tier === "verified";
}

/**
 * Red: nonsubscriber.
 * Yellow: Standard claimed/free profile.
 * Green: paid subscriber with online ordering enabled.
 */
export function resolveRestaurantStatusLightTone({
  subscriptionPlan,
  planSlug,
  isPro,
  isPaidSubscriber,
  orderAcceptanceStatus,
} = {}) {
  const paid = hasPaidSubscriptionPlan({
    subscriptionPlan,
    planSlug,
    isPro,
    isPaidSubscriber,
  });
  const ordering = hasOnlineOrderingEnabled({ orderAcceptanceStatus });
  if (paid && ordering) return "green";

  if (hasStandardSubscriptionPlan({ subscriptionPlan, planSlug })) return "yellow";

  return "red";
}

export const RESTAURANT_STATUS_LIGHT_COLORS = {
  red: { background: "#b86b6b", glow: "0 0 4px rgba(184, 107, 107, 0.55)" },
  green: { background: "#4ade80", glow: "0 0 5px #4ade80" },
  yellow: { background: "#facc15", glow: "0 0 5px #facc15" },
};

export function shouldShowMenuVerificationAttribution(tone) {
  return tone === "yellow" || tone === "green";
}

export function formatMenuVerificationAttributionDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function buildMenuVerificationAttributionText(menuLastVerifiedAt) {
  const formatted = formatMenuVerificationAttributionDate(menuLastVerifiedAt);
  if (!formatted) return "";
  return `Last verified by rep. on ${formatted}`;
}

export function buildRestaurantStatusLightProps(data, menus = data?.menus) {
  const menuList = Array.isArray(menus) ? menus : [];
  const primaryMenu =
    menuList.find((menu) => menu?.is_primary) ||
    menuList.find((menu) => String(menu?.status || "").toLowerCase() === "verified") ||
    menuList[0] ||
    null;
  const presentation = data?.menu_presentation || {};

  return {
    claimStatus: data?.claim_status || presentation?.claim_status || null,
    subscriptionPlan:
      data?.subscription_plan ||
      data?.subscription_plan_code ||
      presentation?.subscription_plan ||
      null,
    orderAcceptanceStatus:
      data?.order_acceptance_status || presentation?.order_acceptance_status || null,
    menuLastVerifiedAt:
      data?.menu_last_verified_at || presentation?.menu_last_verified_at || null,
    menuStatus: data?.menu_status || primaryMenu?.status || data?.status || null,
    profileTier: data?.profile_tier || null,
    listingStatus: data?.listing_status || data?.verification_status || null,
    planSlug: presentation?.plan_slug || data?.plan_slug || null,
    isPro: presentation?.is_pro === true || data?.is_pro === true,
    isPaidSubscriber:
      presentation?.is_paid_subscriber === true || data?.is_paid_subscriber === true,
    tone:
      data?.status_light_tone ||
      data?.verification_badge_tone ||
      resolveRestaurantStatusLightTone({
        claimStatus: data?.claim_status || presentation?.claim_status || null,
        subscriptionPlan:
          data?.subscription_plan ||
          data?.subscription_plan_code ||
          presentation?.subscription_plan ||
          null,
        orderAcceptanceStatus:
          data?.order_acceptance_status || presentation?.order_acceptance_status || null,
        menuStatus: data?.menu_status || primaryMenu?.status || data?.status || null,
        profileTier: data?.profile_tier || null,
        listingStatus: data?.listing_status || data?.verification_status || null,
        planSlug: presentation?.plan_slug || data?.plan_slug || null,
        isPro: presentation?.is_pro === true || data?.is_pro === true,
        isPaidSubscriber:
          presentation?.is_paid_subscriber === true || data?.is_paid_subscriber === true,
      }),
  };
}
