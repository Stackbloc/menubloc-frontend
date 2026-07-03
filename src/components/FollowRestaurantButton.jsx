import useRestaurantFollow from "../hooks/useRestaurantFollow.js";
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
  const accent = "#22C55E";
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
          width: size,
          height: size,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: followed
            ? `1px solid ${accent}`
            : dark
              ? "1px solid rgba(255,255,255,0.16)"
              : "1px solid rgba(15,23,42,0.16)",
          background: followed
            ? "rgba(34,197,94,0.12)"
            : dark
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)",
          color: followed ? accent : dark ? "#f8fafc" : "#0f172a",
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.6 : 1,
          padding: 0,
        }}
      >
        <ThumbsUpIcon
          size={iconSize}
          filled={followed}
          color={followed ? accent : dark ? "#f8fafc" : "#0f172a"}
        />
      </button>
    </IconHoverLabel>
  );
}
