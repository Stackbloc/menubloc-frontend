/**
 * Default Feed video caption — restaurant name (white) + menu item (green).
 */

import { Link } from "react-router-dom";
import { resolveFeedPlaceCaption } from "../../../lib/liveFeedCategory.js";

const styles = {
  row: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    marginTop: 8,
    maxWidth: "100%",
  },
  rowCompact: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    marginTop: 4,
    maxWidth: "100%",
  },
  restaurant: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1.3,
    textShadow: "0 1px 3px rgba(0,0,0,0.75)",
  },
  restaurantLink: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1.3,
    textDecoration: "underline",
    textUnderlineOffset: 3,
    textShadow: "0 1px 3px rgba(0,0,0,0.75)",
  },
  menuItem: {
    fontSize: 17,
    fontWeight: 800,
    color: "#5eead4",
    lineHeight: 1.3,
    textShadow: "0 1px 3px rgba(0,0,0,0.75)",
  },
  menuItemLink: {
    fontSize: 17,
    fontWeight: 800,
    color: "#5eead4",
    lineHeight: 1.3,
    textDecoration: "underline",
    textUnderlineOffset: 3,
    textShadow: "0 1px 3px rgba(0,0,0,0.75)",
  },
  fallback: {
    fontSize: 15,
    fontWeight: 600,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 1.3,
  },
};

export default function FeedPlaceCaption({
  item,
  compact = false,
  onMenuLinkClick,
  testId = "feed-video-place-caption",
}) {
  const placeCaption = resolveFeedPlaceCaption(item);
  const foodLabel = String(item?.item_name || item?.food_name || "").trim();
  const posterLabel = String(
    item?.diner?.display_name || item?.creator?.name || item?.venue?.name || ""
  ).trim();
  const foodIsPosterEcho =
    foodLabel && posterLabel && foodLabel.toLowerCase() === posterLabel.toLowerCase();
  const showFoodFallback =
    !placeCaption.restaurant && !placeCaption.menuItem && foodLabel && !foodIsPosterEcho;

  if (!placeCaption.restaurant && !placeCaption.menuItem && !showFoodFallback) {
    return null;
  }

  return (
    <div style={compact ? styles.rowCompact : styles.row} data-testid={testId}>
      {placeCaption.restaurant ? (
        placeCaption.restaurant.href ? (
          <Link
            to={placeCaption.restaurant.href}
            style={styles.restaurantLink}
            data-testid="feed-video-restaurant-caption"
            onClick={(e) => {
              e.stopPropagation();
              onMenuLinkClick?.();
            }}
          >
            {placeCaption.restaurant.label}
          </Link>
        ) : (
          <span style={styles.restaurant} data-testid="feed-video-restaurant-caption">
            {placeCaption.restaurant.label}
          </span>
        )
      ) : null}
      {placeCaption.menuItem ? (
        placeCaption.menuItem.href ? (
          <Link
            to={placeCaption.menuItem.href}
            style={styles.menuItemLink}
            data-testid="feed-video-menu-item-caption"
            onClick={(e) => {
              e.stopPropagation();
              onMenuLinkClick?.();
            }}
          >
            {placeCaption.menuItem.label}
          </Link>
        ) : (
          <span style={styles.menuItem} data-testid="feed-video-menu-item-caption">
            {placeCaption.menuItem.label}
          </span>
        )
      ) : null}
      {showFoodFallback ? (
        <span style={styles.fallback}>{foodLabel}</span>
      ) : null}
    </div>
  );
}
