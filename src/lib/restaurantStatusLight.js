import { isRestaurantVerifiedMenuStatus } from "./menuVerificationLabels.js";

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

/**
 * Green: verified menu or at least Verified / Pro subscription tier.
 * Yellow: community / unverified menus below Verified.
 */
export function resolveRestaurantStatusLightTone({
  menuStatus,
  profileTier,
  listingStatus,
  planSlug,
  isPro,
  isPaidSubscriber,
} = {}) {
  const tier = normalizeRestaurantProfileTier(profileTier, listingStatus);
  if (tier === "pro" || tier === "verified") return "green";
  if (isPro === true) return "green";
  if (isPaidSubscriber === true) return "green";
  const plan = String(planSlug || "").trim().toLowerCase();
  if (plan && plan !== "free") return "green";
  if (plan === "pro" || plan === "enterprise" || plan.includes("verified")) return "green";
  if (isRestaurantVerifiedMenuStatus(menuStatus)) return "green";
  return "yellow";
}

export const RESTAURANT_STATUS_LIGHT_COLORS = {
  green: { background: "#4ade80", glow: "0 0 5px #4ade80" },
  yellow: { background: "#facc15", glow: "0 0 5px #facc15" },
};

export function buildRestaurantStatusLightProps(data, menus = data?.menus) {
  const menuList = Array.isArray(menus) ? menus : [];
  const primaryMenu =
    menuList.find((menu) => menu?.is_primary) ||
    menuList.find((menu) => String(menu?.status || "").toLowerCase() === "verified") ||
    menuList[0] ||
    null;
  const presentation = data?.menu_presentation || {};

  return {
    menuStatus: data?.menu_status || primaryMenu?.status || data?.status || null,
    profileTier: data?.profile_tier || null,
    listingStatus: data?.listing_status || data?.verification_status || null,
    planSlug: presentation?.plan_slug || null,
    isPro: presentation?.is_pro === true || data?.is_pro === true,
    isPaidSubscriber:
      presentation?.is_paid_subscriber === true || data?.is_paid_subscriber === true,
  };
}
