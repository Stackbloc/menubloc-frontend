import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { getMenuItemLikeStatus, likeMenuItem, unlikeMenuItem } from "../lib/consumerApi.js";
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
    setLiked(false);
    if (!valid || !isAuthenticated) {
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
    try {
      if (liked) {
        await unlikeMenuItem(id);
        setLiked(false);
      } else {
        await likeMenuItem(id);
        setLiked(true);
      }
    } catch {
      // Keep prior state on failure — button stays clickable for retry.
    } finally {
      setBusy(false);
    }
  }

  const inline = tone === "inline";
  const ghost = tone === "ghost";
  const dim = size === "row" ? 28 : size === "compact" ? 32 : 36;
  const accent = "#22C55E";
  const hoverLabel = liked ? "Liked" : "Like";

  return (
    <IconHoverLabel label={hoverLabel}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label={liked ? "Unlike this dish" : "Like this dish"}
        aria-pressed={liked}
        title={hoverLabel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: inline ? "auto" : dim,
          height: inline ? "auto" : dim,
          padding: 0,
          borderRadius: "50%",
          border: inline
            ? "none"
            : ghost
              ? "1px solid rgba(55,65,81,0.22)"
              : "1px solid rgba(15,23,42,0.16)",
          background: inline
            ? "transparent"
            : liked
              ? "rgba(34,197,94,0.12)"
              : ghost
                ? "rgba(255,255,255,0.96)"
                : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)",
          color: liked ? accent : inline ? "inherit" : "#0f172a",
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.6 : 1,
          flexShrink: 0,
          boxShadow: inline
            ? "none"
            : ghost
              ? "0 2px 8px rgba(15, 23, 42, 0.12)"
              : "0 8px 18px rgba(15, 23, 42, 0.12)",
        }}
      >
        <ThumbsUpIcon size={size === "row" ? 14 : size === "compact" ? 15 : 16} filled={liked} color={liked ? accent : "currentColor"} />
      </button>
    </IconHoverLabel>
  );
}
