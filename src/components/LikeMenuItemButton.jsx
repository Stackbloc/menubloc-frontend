import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { getMenuItemLikeStatus, likeMenuItem, unlikeMenuItem } from "../lib/consumerApi.js";

function ThumbsUpIcon({ size = 15, filled = false, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h12.5a2 2 0 0 0 2-1.6l1.3-6.5a2 2 0 0 0-2-2.4H15V5a3 3 0 0 0-3-3l-1 5-3.5 4.5H2Z" />
    </svg>
  );
}

/**
 * Row-level "like" control for a menu item — thumbs up, distinct from the
 * heart-based Like button on the full item detail page (MenuItemDetailPage.jsx).
 * Same like/unlike API underneath, different affordance for the compact row context.
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
  const dim = size === "compact" ? 32 : 36;
  const accent = "#22C55E";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={liked ? "Unlike this dish" : "Like this dish"}
      aria-pressed={liked}
      title={liked ? "Liked" : "Like"}
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
              ? "rgba(255,255,255,0.92)"
              : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.96) 100%)",
        color: liked ? accent : inline ? "inherit" : "#0f172a",
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.6 : 1,
        flexShrink: 0,
      }}
    >
      <ThumbsUpIcon size={size === "compact" ? 15 : 16} filled={liked} color={liked ? accent : "currentColor"} />
    </button>
  );
}
