import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { getMenuItemLikeStatus, likeMenuItem, unlikeMenuItem } from "../lib/consumerApi.js";
import { LIKE_ACCENT, likeButtonVisualStyle } from "../lib/likeButtonStyles.js";
import IconHoverLabel from "./IconHoverLabel.jsx";
import ThumbsUpIcon from "./icons/ThumbsUpIcon.jsx";

/**
 * Row-level "like" control for a menu item — thumbs up on menu rows and detail pages.
 * Same like/unlike API underneath.
 */
export default function LikeMenuItemButton({ menuItemId, tone = "inline", size = "compact" }) {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const id = Number(menuItemId);
  const valid = Number.isInteger(id) && id > 0;

  useEffect(() => {
    let alive = true;
    if (!valid || !isAuthenticated) {
      setLiked(false);
      setLoading(false);
      return () => {
        alive = false;
      };
    }
    setLoading(true);
    getMenuItemLikeStatus(id)
      .then((data) => {
        if (alive) setLiked(data?.liked === true);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, valid, isAuthenticated]);

  if (!valid) return null;

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    if (!isAuthenticated) {
      const redirectTo = `${location.pathname}${location.search || ""}${location.hash || ""}`;
      navigate("/account/login", { state: { redirectTo } });
      return;
    }

    setBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    try {
      if (wasLiked) {
        await unlikeMenuItem(id);
      } else {
        await likeMenuItem(id);
      }
    } catch {
      setLiked(wasLiked);
    } finally {
      setBusy(false);
    }
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
