import {
  RESTAURANT_STATUS_LIGHT_COLORS,
  resolveRestaurantStatusLightTone,
} from "../lib/restaurantStatusLight.js";

/**
 * Live-status dot (matches home browse "Live Menu" indicator).
 */
export default function RestaurantStatusLight({
  tone,
  menuStatus,
  profileTier,
  listingStatus,
  planSlug,
  isPro,
  size = 5,
  style,
  className,
  ariaLabel,
}) {
  const resolvedTone =
    tone || resolveRestaurantStatusLightTone({
      menuStatus,
      profileTier,
      listingStatus,
      planSlug,
      isPro,
    });
  const palette =
    RESTAURANT_STATUS_LIGHT_COLORS[resolvedTone] ||
    RESTAURANT_STATUS_LIGHT_COLORS.yellow;

  return (
    <span
      className={className}
      role="img"
      aria-label={
        ariaLabel ||
        (resolvedTone === "green" ? "Verified restaurant" : "Unverified menu")
      }
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
