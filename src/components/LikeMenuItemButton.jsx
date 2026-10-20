import useMenuItemLike from "../hooks/useMenuItemLike.js";
import { LIKE_ACCENT, likeButtonVisualStyle } from "../lib/likeButtonStyles.js";
import IconHoverLabel from "./IconHoverLabel.jsx";
import ThumbsUpIcon from "./icons/ThumbsUpIcon.jsx";

/**
 * Row-level "like" control for a menu item — thumbs up on menu rows and detail pages.
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
  const hoverLabel = liked ? "Liked" : "Like";

  return (
    <IconHoverLabel label={hoverLabel}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || busy}
        aria-label={liked ? "Unlike this dish" : "Like this dish"}
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
        <ThumbsUpIcon
          size={size === "row" ? 14 : size === "compact" ? 15 : 16}
          filled={liked}
          color={liked ? LIKE_ACCENT : "currentColor"}
        />
      </button>
    </IconHoverLabel>
  );
}
