import useRestaurantFollow from "../hooks/useRestaurantFollow.js";
import { LIKE_ACCENT, likeButtonVisualStyle } from "../lib/likeButtonStyles.js";
import IconHoverLabel from "./IconHoverLabel.jsx";
import ThumbsUpIcon from "./icons/ThumbsUpIcon.jsx";

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
    ? `Liked ${restaurantName || "this restaurant"}. Tap to unlike.`
    : `Like ${restaurantName || "this restaurant"}`;

  const hoverLabel = followed ? "Liked" : "Like";
  const iconSize = Math.max(14, Math.round(size * 0.5));

  return (
    <IconHoverLabel label={hoverLabel}>
      <button
        type="button"
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
          ...likeButtonVisualStyle({ selected: followed, dark, loading: busy }),
          width: size,
          height: size,
        }}
      >
        <ThumbsUpIcon
          size={iconSize}
          filled={followed}
          color={followed ? LIKE_ACCENT : dark ? "#f8fafc" : "#0f172a"}
        />
      </button>
    </IconHoverLabel>
  );
}
