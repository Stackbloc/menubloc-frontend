import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { likeButtonVisualStyle } from "../../lib/likeButtonStyles.js";
import IconHoverLabel from "../IconHoverLabel.jsx";
import DishVideoCommentSheet from "./DishVideoCommentSheet.jsx";

/** Speech bubble with a play mark: a video comment. */
function VideoCommentIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16v11H9l-5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11 8.5v4l3.5-2-3.5-2z" fill="currentColor" />
    </svg>
  );
}

/**
 * Ghost "Comment" control on a dish (Andre, 2026-10-22): opens the video comment sheet with the
 * dish auto-tagged. Signed-out diners go to sign in and come back.
 */
export default function DishVideoCommentButton({
  menuItemId,
  menuItemName = "",
  restaurantId = null,
  tone = "ghost",
  size = "row",
  dark = false,
  onPosted,
}) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  if (menuItemId == null || String(menuItemId).trim() === "") return null;

  const ghost = tone === "ghost";
  const dim = size === "row" ? 28 : size === "compact" ? 32 : typeof size === "number" ? size : 36;
  const iconSize = size === "row" ? 14 : size === "compact" ? 15 : Math.max(14, Math.round(dim * 0.5));

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      const next = `${location.pathname}${location.search}`;
      navigate(`/account/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <IconHoverLabel label="Comment">
        <button
          type="button"
          data-testid="menu-item-video-comment"
          aria-label="Comment with a video"
          title="Comment"
          onClick={handleClick}
          style={{
            ...likeButtonVisualStyle({ selected: false, inline: false, ghost, dark, loading: false }),
            width: dim,
            height: dim,
            minWidth: dim,
            minHeight: dim,
          }}
        >
          <VideoCommentIcon size={iconSize} />
        </button>
      </IconHoverLabel>
      <DishVideoCommentSheet
        open={open}
        onClose={() => setOpen(false)}
        menuItemId={menuItemId}
        menuItemName={menuItemName}
        restaurantId={restaurantId}
        onPosted={onPosted}
      />
    </>
  );
}
