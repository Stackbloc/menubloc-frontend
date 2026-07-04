import { resolveRestaurantStatusLightTone } from "../lib/restaurantStatusLight.js";

const BADGE_PALETTE = {
  green: { background: "var(--gb-color-accent, #22c55e)", color: "#ffffff" },
  yellow: { background: "#facc15", color: "#422006" },
};

/**
 * Inline verification pill — green LIVE (verified / Pro) or yellow PEND (unverified).
 * Placed immediately after the restaurant name.
 */
export default function RestaurantVerificationBadge({
  menuStatus,
  profileTier,
  listingStatus,
  planSlug,
  isPro,
  isPaidSubscriber,
  size = "sm",
  style,
}) {
  const tone = resolveRestaurantStatusLightTone({
    menuStatus,
    profileTier,
    listingStatus,
    planSlug,
    isPro,
    isPaidSubscriber,
  });
  const verified = tone === "green";
  const palette = verified ? BADGE_PALETTE.green : BADGE_PALETTE.yellow;
  const label = verified ? "LIVE" : "PEND";

  const sizeStyles =
    size === "md"
      ? { fontSize: 10, padding: "2px 5px", marginLeft: 8 }
      : { fontSize: 9, padding: "1px 4px", marginLeft: 6 };

  return (
    <span
      aria-label={verified ? "Verified restaurant" : "Pending verification"}
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
  return {
    menuStatus: row.menu_status,
    profileTier: row.profile_tier,
    listingStatus: row.listing_status || row.verification_status,
    planSlug: presentation.plan_slug || row.plan_slug,
    isPro: presentation.is_pro === true || row.is_pro === true,
    isPaidSubscriber:
      presentation.is_paid_subscriber === true || row.is_paid_subscriber === true,
  };
}
