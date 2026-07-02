import useRestaurantFollow from "../hooks/useRestaurantFollow.js";

function FollowIcon({ size = 16, filled = false, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5C6 2.67157 6.67157 2 7.5 2H16.5C17.3284 2 18 2.67157 18 3.5V21L12 17.5L6 21V3.5Z" />
    </svg>
  );
}

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
    ? `Following ${restaurantName || "this restaurant"}. Tap to unfollow.`
    : `Follow ${restaurantName || "this restaurant"}`;

  return (
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
      title={followed ? "Following" : "Follow"}
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
      <FollowIcon size={16} filled={followed} color={followed ? accent : "currentColor"} />
    </button>
  );
}
