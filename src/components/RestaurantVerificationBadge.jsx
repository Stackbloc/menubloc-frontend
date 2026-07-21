import {
  resolveRestaurantStatusLightTone,
  shouldShowMenuVerificationAttribution,
} from "../lib/restaurantStatusLight.js";

/** Public subscription/status badges are intentionally hidden from diners. */
export default function RestaurantVerificationBadge() {
  return null;
}

/** Flat discovery/browse row → badge props. */
export function verificationBadgePropsFromRow(row) {
  if (!row || typeof row !== "object") return {};
  const presentation = row.menu_presentation || {};
  const tone =
    row.status_light_tone ||
    row.verification_badge_tone ||
    resolveRestaurantStatusLightTone({
      claimStatus: row.claim_status || presentation.claim_status,
      subscriptionPlan:
        row.subscription_plan || row.subscription_plan_code || presentation.subscription_plan,
      menuStatus: row.menu_status,
      profileTier: row.profile_tier,
      listingStatus: row.listing_status || row.verification_status,
      planSlug: presentation.plan_slug || row.plan_slug,
      isPro: presentation.is_pro === true || row.is_pro === true,
      isPaidSubscriber:
        presentation.is_paid_subscriber === true || row.is_paid_subscriber === true,
      orderAcceptanceStatus:
        row.order_acceptance_status || presentation.order_acceptance_status,
    });

  return {
    tone,
    claimStatus: row.claim_status || presentation.claim_status,
    subscriptionPlan:
      row.subscription_plan || row.subscription_plan_code || presentation.subscription_plan,
    menuStatus: row.menu_status,
    profileTier: row.profile_tier,
    listingStatus: row.listing_status || row.verification_status,
    planSlug: presentation.plan_slug || row.plan_slug,
    isPro: presentation.is_pro === true || row.is_pro === true,
    isPaidSubscriber:
      presentation.is_paid_subscriber === true || row.is_paid_subscriber === true,
    orderAcceptanceStatus:
      row.order_acceptance_status || presentation.order_acceptance_status,
    menuLastVerifiedAt:
      row.menu_last_verified_at || presentation.menu_last_verified_at || null,
    showMenuVerificationAttribution:
      row.show_menu_verification_attribution === true ||
      (shouldShowMenuVerificationAttribution(tone) &&
        Boolean(row.menu_last_verified_at || presentation.menu_last_verified_at)),
  };
}
