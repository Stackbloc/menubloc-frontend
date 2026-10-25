import useMenuItemLike from "../hooks/useMenuItemLike.js";
import { FAV_ACCENT, likeButtonVisualStyle } from "../lib/likeButtonStyles.js";
import IconHoverLabel from "./IconHoverLabel.jsx";
import FavHeartIcon from "./icons/FavHeartIcon.jsx";

/**
 * Row-level Fav control for a menu item — the Fav heart on menu rows and detail pages. One Fav for
 * restaurants and dishes (Andre 2026-10-24); stored as the dish like, so existing likes show as Favs.
 * Same like/unlike API underneath. onLikedChange(liked) fires on a user toggle (and on revert),
 * so a row can keep its visible like count in step.
 */
export default function LikeMenuItemButton({ menuItemId, tone = "inline", size = "compact", onLikedChange = null }) {
  const { valid, liked, loading, busy, toggle } = useMenuItemLike(menuItemId, { onLikedChange });

  if (!valid) return null;

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }

  const inline = tone === "inline";
  const ghost = tone === "ghost";
  const dim = size === "row" ? 28 : size === "compact" ? 32 : 36;
  const hoverLabel = liked ? "My Fav" : "Fav";

  return (
    <IconHoverLabel label={hoverLabel}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || busy}
        aria-label={liked ? "Remove this dish from your Favs" : "Fav this dish"}
        aria-pressed={liked}
        title={hoverLabel}
        style={{
          ...likeButtonVisualStyle({ selected: liked, inline, ghost, loading: loading || busy }),
          width: inline ? "auto" : dim,
          height: inline ? "auto" : dim,
          minWidth: inline ? "auto" : dim,
          minHeight: inline ? "auto" : dim,
        }}
      >
        <FavHeartIcon
          size={size === "row" ? 14 : size === "compact" ? 15 : 16}
          filled={liked}
          color={liked ? FAV_ACCENT : "currentColor"}
        />
      </button>
    </IconHoverLabel>
  );
}
