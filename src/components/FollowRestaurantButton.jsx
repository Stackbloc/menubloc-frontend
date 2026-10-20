import useRestaurantFollow from "../hooks/useRestaurantFollow.js";
import { FAV_ACCENT, likeButtonVisualStyle } from "../lib/likeButtonStyles.js";
import IconHoverLabel from "./IconHoverLabel.jsx";
import FavHeartIcon from "./icons/FavHeartIcon.jsx";

/**
 * Fav heart for a restaurant (Andre, 2026-10-20): Favs are restaurants only and land in the
 * profile's My Favs; Like is for menu items. Same follow record underneath.
 */
export default function FollowRestaurantButton({
  restaurantId,
  restaurantName = "",
  source = "menu_page",
  dark = false,
  size = 36,
}) {
  const { followed, statusLoading, actionLoading, toggleFollow } = useRestaurantFollow(restaurantId, {
    source,
    restaurantName,
  });

  const id = Number(restaurantId);
  if (!Number.isInteger(id) || id <= 0) return null;

  const busy = statusLoading || actionLoading;
  const label = followed
    ? `${restaurantName || "This restaurant"} is in My Favs. Tap to remove.`
    : `Add ${restaurantName || "this restaurant"} to My Favs`;

  const hoverLabel = followed ? "My Fav" : "Fav";
  const iconSize = Math.max(14, Math.round(size * 0.5));

  return (
    <IconHoverLabel label={hoverLabel}>
      <button
        type="button"
        data-testid="restaurant-fav-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFollow();
        }}
        disabled={busy}
        aria-label={label}
        aria-pressed={followed}
        title={hoverLabel}
        style={{
          ...likeButtonVisualStyle({ selected: followed, dark, loading: busy, accent: FAV_ACCENT }),
          width: size,
          height: size,
        }}
      >
        <FavHeartIcon
          size={iconSize}
          filled={followed}
          color={followed ? FAV_ACCENT : dark ? "#f8fafc" : "#0f172a"}
        />
      </button>
    </IconHoverLabel>
  );
}
