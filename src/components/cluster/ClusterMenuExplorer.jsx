import React from "react";
import { Link } from "react-router-dom";
import { restaurantMenuPathFromRow } from "../../lib/canonicalUrl.js";

export const CLUSTER_DISH_CHIP_STYLE = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "0.62rem 0.85rem",
  borderRadius: 8,
  border: "2px solid #22c55e",
  background: "#f0fdf4",
  color: "#14532d",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: "0.95rem",
  lineHeight: 1.35,
  overflowWrap: "anywhere",
  textAlign: "left",
};

function buildDishHref(item) {
  const menuItemId = item?.menu_item_id ?? item?.id;
  if (menuItemId) return `/menu-items/${menuItemId}?from=cluster`;

  return restaurantMenuPathFromRow(item);
}

export function ClusterDishChip({ item }) {
  if (!item?.name) return null;
  const href = buildDishHref(item);

  const content = <span>{item.name}</span>;

  if (!href) {
    return <div style={CLUSTER_DISH_CHIP_STYLE}>{content}</div>;
  }

  return (
    <Link to={href} style={CLUSTER_DISH_CHIP_STYLE}>
      {content}
    </Link>
  );
}

export function ClusterDishList({ items = [], showRestaurantBreaks = false }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  let lastRestaurantId = null;

  return (
    <div style={{ display: "grid", gap: "0.55rem" }}>
      {items.map((item) => {
        const restaurantId = Number(item.restaurant_id) || null;
        const showRestaurantHeading =
          showRestaurantBreaks &&
          restaurantId &&
          restaurantId !== lastRestaurantId &&
          item.restaurant_name;
        if (restaurantId) lastRestaurantId = restaurantId;

        return (
          <React.Fragment key={`${item.menu_item_id}-${item.restaurant_id}-${item.name}`}>
            {showRestaurantHeading ? (
              <div
                style={{
                  marginTop: "0.35rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {item.restaurant_name}
              </div>
            ) : null}
            <ClusterDishChip item={item} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function flattenClusterSearchGroups(groups = []) {
  const items = [];
  for (const group of groups) {
    for (const item of group.menu_items || []) {
      items.push({
        ...item,
        restaurant_id: item.restaurant_id ?? group.restaurant_id,
        restaurant_name: item.restaurant_name ?? group.restaurant_name,
        restaurant_slug: item.restaurant_slug ?? group.restaurant_slug,
        city: item.city ?? group.city,
        state: item.state ?? group.state,
      });
    }
  }
  return items;
}

export function ClusterMenuExplorerReservedFilters() {
  return null;
}
