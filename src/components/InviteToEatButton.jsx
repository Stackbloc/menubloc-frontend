import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { likeButtonVisualStyle } from "../lib/likeButtonStyles.js";
import IconHoverLabel from "./IconHoverLabel.jsx";
import InviteToEatIcon from "./icons/InviteToEatIcon.jsx";
import InviteToEatModal from "./InviteToEatModal.jsx";

/**
 * Ghost Invite to Eat control — restaurant or menu-item context.
 * Tooltip: "Invite to Eat". Opens compose modal (link-first share).
 */
export default function InviteToEatButton({
  restaurantId = null,
  restaurantName = "",
  menuItemId = null,
  menuItemName = null,
  tone = "ghost",
  size = "row",
  dark = false,
}) {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const rid = restaurantId != null && String(restaurantId).trim() !== "" ? restaurantId : null;
  if (!rid) return null;

  const ghost = tone === "ghost";
  const dim = size === "row" ? 28 : size === "compact" ? 32 : typeof size === "number" ? size : 36;
  const iconSize = size === "row" ? 14 : size === "compact" ? 15 : Math.max(14, Math.round(dim * 0.5));

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      const redirectTo = `${location.pathname}${location.search || ""}${location.hash || ""}`;
      navigate("/account/login", { state: { redirectTo } });
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <IconHoverLabel label="Invite to Eat">
        <button
          type="button"
          data-testid={menuItemId != null ? "menu-item-invite-nav" : "menu-restaurant-invite-nav"}
          aria-label="Invite to Eat"
          title="Invite to Eat"
          onClick={handleClick}
          style={{
            ...likeButtonVisualStyle({ selected: false, inline: false, ghost, dark, loading: false }),
            width: dim,
            height: dim,
            minWidth: dim,
            minHeight: dim,
          }}
        >
          <InviteToEatIcon size={iconSize} color="currentColor" />
        </button>
      </IconHoverLabel>
      <InviteToEatModal
        open={open}
        onClose={() => setOpen(false)}
        restaurantId={rid}
        restaurantName={restaurantName}
        menuItemId={menuItemId}
        menuItemName={menuItemName}
      />
    </>
  );
}
