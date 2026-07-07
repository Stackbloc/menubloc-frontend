import {
  RESTAURANT_STATUS_LIGHT_COLORS,
  resolveRestaurantStatusLightTone,
} from "../lib/restaurantStatusLight.js";

/**
 * Live-status dot (matches home browse "Live Menu" indicator).
 */
export default function RestaurantStatusLight({
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
  size = 5,
  style,
  className,
  ariaLabel,
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
  const palette =
    RESTAURANT_STATUS_LIGHT_COLORS[resolvedTone] ||
    RESTAURANT_STATUS_LIGHT_COLORS.red;

  const defaultAriaLabel =
    resolvedTone === "green"
      ? "Paid restaurant with online ordering"
      : resolvedTone === "yellow"
        ? "Verified restaurant"
        : "Pending verification";

  return (
    <span
      className={className}
      role="img"
      aria-label={ariaLabel || defaultAriaLabel}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: palette.background,
        boxShadow: palette.glow,
        flexShrink: 0,
        display: "inline-block",
        ...style,
      }}
    />
  );
}
