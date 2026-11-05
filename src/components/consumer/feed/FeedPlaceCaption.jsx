/**
 * Default Feed video caption — restaurant name (white) + menu item (green).
 * Andre 2026-10-21: the restaurant name opens the restaurant's profile; the dish opens the menu
 * (Menu Browser via onOpenMenu when the feed provides it).
 * Owner/operator clips feature up to 3 dishes (Andre 2026-11-04): the other two show as green
 * tags under the main dish and open the same menu (all three pinned). Diner clips: one dish.
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
  extraDishes: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
  },
  extraDish: {
    fontSize: 14,
    fontWeight: 800,
    color: "#5eead4",
    lineHeight: 1.3,
    padding: "2px 8px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
    textDecoration: "none",
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
  /**
   * Feed reels: the dish opens the restaurant's menu (dish pinned + highlighted) in the Menu
   * Browser instead of the dish-detail page. The restaurant name always goes to the profile.
   */
  onOpenMenu = null,
  testId = "feed-video-place-caption",
}) {
  const placeCaption = resolveFeedPlaceCaption(item);
  const extraDishes = feedClipExtraDishes(item);
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
        placeCaption.menuItem.href || onOpenMenu ? (
          <Link
            to={placeCaption.menuItem.href || placeCaption.restaurant?.href || "#"}
            style={styles.menuItemLink}
            data-testid="feed-video-menu-item-caption"
            onClick={(e) => {
              e.stopPropagation();
              onMenuLinkClick?.();
              if (onOpenMenu) {
                e.preventDefault();
                onOpenMenu(e);
              }
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
      {placeCaption.menuItem && extraDishes.length ? (
        <div style={styles.extraDishes} data-testid="feed-video-extra-dishes">
          {extraDishes.map((dish) =>
            onOpenMenu || placeCaption.restaurant?.href ? (
              <Link
                key={dish.id}
                to={placeCaption.restaurant?.href || `/menu-items/${dish.id}`}
                style={styles.extraDish}
                data-testid="feed-video-extra-dish"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuLinkClick?.();
                  if (onOpenMenu) {
                    e.preventDefault();
                    onOpenMenu(e);
                  }
                }}
              >
                {dish.name}
              </Link>
            ) : (
              <span key={dish.id} style={styles.extraDish} data-testid="feed-video-extra-dish">
                {dish.name}
              </span>
            )
          )}
        </div>
      ) : null}
      {showFoodFallback ? (
        <span style={styles.fallback}>{foodLabel}</span>
      ) : null}
    </div>
  );
}

/** The clip's 2nd and 3rd dishes (menu_items[0] is the main dish the caption already shows). */
export function feedClipExtraDishes(item) {
  const list = Array.isArray(item?.menu_items) ? item.menu_items : [];
  const mainId = Number(item?.menu_item_id ?? list[0]?.id);
  const seen = new Set([mainId]);
  const out = [];
  for (const dish of list) {
    const id = Number(dish?.id);
    const name = String(dish?.name || "").trim();
    if (!Number.isInteger(id) || id <= 0 || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name });
    if (out.length >= 2) break;
  }
  return out;
}
