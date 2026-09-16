import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { likeButtonVisualStyle } from "../lib/likeButtonStyles.js";
import { restaurantPath } from "../lib/canonicalUrlCore.js";
import { parseMenuItemRouteId } from "../lib/menuItemIdentity.js";
import { FOOD_COMMENTS_HASH } from "../lib/foodCommentsScroll.js";
import IconHoverLabel from "./IconHoverLabel.jsx";
import CommentBubbleIcon from "./icons/CommentBubbleIcon.jsx";
import MenuItemReviewChooser from "./menu/MenuItemReviewChooser.jsx";
import MenuItemVideoReviewOverlay from "./menu/MenuItemVideoReviewOverlay.jsx";

function isCkMenuItemId(value) {
  const parsed = parseMenuItemRouteId(value);
  return parsed?.kind === "ck" && parsed.numericId > 0;
}

/**
 * Ghost speech-bubble control — opens restaurant or dish discussion thread.
 * Restaurant: profile #food-comments. Dish: chooser (written thread or video review).
 */
export default function FoodCommentNavButton({
  target = "restaurant",
  restaurantSlug = null,
  restaurantId = null,
  restaurantCity = null,
  restaurantState = null,
  restaurantName = null,
  menuItemId = null,
  menuItemName = null,
  tone = "ghost",
  size = "row",
  dark = false,
}) {
  const navigate = useNavigate();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const ghost = tone === "ghost";
  const dim = size === "row" ? 28 : size === "compact" ? 32 : typeof size === "number" ? size : 36;
  const iconSize = size === "row" ? 14 : size === "compact" ? 15 : Math.max(14, Math.round(dim * 0.5));
  const ckMenuItem = isCkMenuItemId(menuItemId);

  let href = null;
  if (target === "menu_item" && menuItemId != null && String(menuItemId).trim()) {
    href = `/menu-items/${encodeURIComponent(String(menuItemId))}?from=menu#${FOOD_COMMENTS_HASH}`;
  } else if (target === "restaurant") {
    const path =
      restaurantPath({
        slug: restaurantSlug,
        city: restaurantCity,
        state: restaurantState,
      }) ||
      (restaurantId != null && String(restaurantId).trim()
        ? `/restaurants/${encodeURIComponent(String(restaurantId))}`
        : null);
    if (path) href = `${path}#${FOOD_COMMENTS_HASH}`;
  }

  if (!href) return null;

  const label = target === "menu_item" ? "Comment on this dish" : "Comment on this restaurant";
  const dishLabel = String(menuItemName || "").trim() || "this dish";

  function openWritten() {
    setChooserOpen(false);
    navigate(href);
  }

  return (
    <>
      <IconHoverLabel label="Comment">
        <button
          type="button"
          data-testid={
            target === "menu_item" ? "menu-item-comment-nav" : "menu-restaurant-comment-nav"
          }
          aria-label={label}
          title="Comment"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (target === "menu_item") {
              setChooserOpen(true);
              return;
            }
            navigate(href);
          }}
          style={{
            ...likeButtonVisualStyle({ selected: false, inline: false, ghost, dark, loading: false }),
            width: dim,
            height: dim,
            minWidth: dim,
            minHeight: dim,
          }}
        >
          <CommentBubbleIcon size={iconSize} color="currentColor" />
        </button>
      </IconHoverLabel>
      {target === "menu_item" ? (
        <>
          <MenuItemReviewChooser
            open={chooserOpen}
            dishName={dishLabel}
            allowVideo={ckMenuItem}
            onWritten={openWritten}
            onVideo={() => {
              setChooserOpen(false);
              setVideoOpen(true);
            }}
            onClose={() => setChooserOpen(false)}
          />
          <MenuItemVideoReviewOverlay
            open={videoOpen}
            restaurantId={restaurantId}
            restaurantName={restaurantName}
            menuItemId={ckMenuItem ? parseMenuItemRouteId(menuItemId).numericId : null}
            menuItemName={dishLabel}
            onClose={() => setVideoOpen(false)}
          />
        </>
      ) : null}
    </>
  );
}
