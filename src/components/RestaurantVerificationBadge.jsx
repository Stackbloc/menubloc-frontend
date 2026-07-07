import {
  resolveRestaurantStatusLightTone,
  shouldShowMenuVerificationAttribution,
} from "../lib/restaurantStatusLight.js";

const BADGE_PALETTE = {
  red: { background: "#b86b6b", color: "#fff8f8" },
  green: { background: "var(--gb-color-accent, #22c55e)", color: "#ffffff" },
  yellow: { background: "#facc15", color: "#422006" },
};

function resolveBadgeLabel(tone) {
  if (tone === "green") return "LIVE";
  if (tone === "yellow") return "VERIFIED";
  return "PEND";
}

/**
 * Inline verification pill — dull red PEND, yellow VERIFIED, green LIVE.
 * Placed immediately after the restaurant name.
 */
export default function RestaurantVerificationBadge({
  tone,
  claimStatus,
  subscriptionPlan,
  menuStatus,
  profileTier,
  listingStatus,
  planSlug,
  isPro,
  isPaidSubscriber,
  orderAcceptanceStatus,
  size = "sm",
  style,
}) {
  const resolvedTone =
    tone ||
    resolveRestaurantStatusLightTone({
      claimStatus,
      subscriptionPlan,
      menuStatus,
      profileTier,
      listingStatus,
      planSlug,
      isPro,
      isPaidSubscriber,
      orderAcceptanceStatus,
    });
  const palette = BADGE_PALETTE[resolvedTone] || BADGE_PALETTE.red;
  const label = resolveBadgeLabel(resolvedTone);

  const sizeStyles =
    size === "md"
      ? { fontSize: 10, padding: "2px 5px", marginLeft: 8 }
      : { fontSize: 9, padding: "1px 4px", marginLeft: 6 };

  return (
    <span
      aria-label={
        resolvedTone === "green"
          ? "Paid restaurant with online ordering"
          : resolvedTone === "yellow"
            ? "Verified restaurant"
            : "Pending verification"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontWeight: 800,
        borderRadius: 3,
        verticalAlign: "middle",
        letterSpacing: "0.04em",
        lineHeight: 1.2,
        flexShrink: 0,
        whiteSpace: "nowrap",
        background: palette.background,
        color: palette.color,
        ...sizeStyles,
        ...style,
      }}
    >
      {label}
    </span>
  );
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
