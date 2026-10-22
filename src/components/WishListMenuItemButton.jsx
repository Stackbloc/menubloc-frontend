import useWishListEntry from "../hooks/useWishListEntry.js";
import { likeButtonVisualStyle } from "../lib/likeButtonStyles.js";
import IconHoverLabel from "./IconHoverLabel.jsx";
import WishListIcon from "./icons/WishListIcon.jsx";

/** Wish List accent — the profile Wish List header color. */
export const WISH_LIST_ACCENT = "#D4537E";

/**
 * Row-level "+Wish List" for a dish — first of the four menu row actions
 * (Wish List · Like · Invite · Share). Tap again to take it off the Wish List.
 */
export default function WishListMenuItemButton({
  menuItemId,
  menuItemName = "",
  restaurantId = null,
  restaurantName = "",
  size = "row",
  dark = false,
}) {
  const { available, added, busy, toggle } = useWishListEntry({
    menuItemId,
    menuItemName,
    restaurantId,
    restaurantName,
  });
  const id = Number(menuItemId);
  if (!available || !Number.isInteger(id) || id <= 0) return null;

  const dim = size === "row" ? 28 : size === "compact" ? 32 : 36;
  const hoverLabel = added ? "On Wish List" : "+Wish List";
  const style = likeButtonVisualStyle({ selected: false, ghost: !dark, dark, loading: busy });

  return (
    <IconHoverLabel label={hoverLabel}>
      <button
        type="button"
        data-testid="menu-item-wish-list"
        aria-label={added ? `Remove ${menuItemName || "this dish"} from Wish List` : `Add ${menuItemName || "this dish"} to Wish List`}
        aria-pressed={added}
        title={hoverLabel}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        style={{
          ...style,
          ...(added
            ? { border: `1px solid ${WISH_LIST_ACCENT}`, background: "rgba(212,83,126,0.12)", color: WISH_LIST_ACCENT }
            : null),
          width: dim,
          height: dim,
          minWidth: dim,
          minHeight: dim,
        }}
      >
        <WishListIcon size={size === "row" ? 14 : size === "compact" ? 15 : 16} filled={added} color="currentColor" />
      </button>
    </IconHoverLabel>
  );
}

/**
 * Restaurant-level "+Wish List" (no dish) — profile hero, first of the Feed rail's order
 * (Wish List · Fav · Invite · Share). Saves the restaurant to the profile Wish List.
 */
export function WishListRestaurantButton({ restaurantId, restaurantName = "", size = "row", dark = false }) {
  const { available, added, busy, toggle } = useWishListEntry({ restaurantId, restaurantName });
  if (!available) return null;

  const dim = typeof size === "number" ? size : size === "row" ? 28 : size === "compact" ? 32 : 36;
  const hoverLabel = added ? "On Wish List" : "+Wish List";
  const style = likeButtonVisualStyle({ selected: false, ghost: !dark, dark, loading: busy });
  const place = restaurantName || "this restaurant";

  return (
    <IconHoverLabel label={hoverLabel}>
      <button
        type="button"
        data-testid="restaurant-wish-list"
        aria-label={added ? `Remove ${place} from Wish List` : `Add ${place} to Wish List`}
        aria-pressed={added}
        title={hoverLabel}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        style={{
          ...style,
          ...(added
            ? { border: `1px solid ${WISH_LIST_ACCENT}`, background: "rgba(212,83,126,0.12)", color: WISH_LIST_ACCENT }
            : null),
          width: dim,
          height: dim,
          minWidth: dim,
          minHeight: dim,
        }}
      >
        <WishListIcon size={Math.max(14, Math.round(dim * 0.5))} filled={added} color="currentColor" />
      </button>
    </IconHoverLabel>
  );
}
