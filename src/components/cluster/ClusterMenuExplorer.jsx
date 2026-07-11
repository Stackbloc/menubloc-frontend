import React from "react";
import { Link } from "react-router-dom";
import { restaurantMenuPathFromRow } from "../../lib/canonicalUrl.js";
import { appendClusterReturnQuery } from "../../lib/clusterReturnNavigation.js";

export const CLUSTER_PLACEHOLDER_FOOD_CARD_STYLE = {
  display: "grid",
  gap: "0.3rem",
  padding: "0.85rem 1rem",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
};

export function ClusterPlaceholderFoodCard({ item }) {
  const itemName = item?.name || item?.menu_item_name || "Menu item";
  const concessionName = item?.concession_name || item?.restaurant_name || null;
  const location = item?.location ? String(item.location).trim() : "";
  const area = item?.area ? String(item.area).trim() : "";

  return (
    <div style={CLUSTER_PLACEHOLDER_FOOD_CARD_STYLE}>
      <div style={{ fontWeight: 700, color: "#111827", fontSize: "1rem", overflowWrap: "anywhere" }}>
        {itemName}
      </div>
      {concessionName ? (
        <div style={{ color: "#374151", fontSize: "0.9rem", overflowWrap: "anywhere" }}>
          {concessionName}
        </div>
      ) : null}
      {location || area ? (
        <div style={{ color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.4, overflowWrap: "anywhere" }}>
          {[area, location].filter(Boolean).join(" · ")}
        </div>
      ) : null}
      <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>Prices vary by event</div>
    </div>
  );
}

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

function buildDishHref(item, clusterReturnTo, clusterReturnLabel) {
  const menuItemId = item?.menu_item_id ?? item?.id;
  if (menuItemId) {
    const encodedId = encodeURIComponent(String(menuItemId));
    const base = `/menu-items/${encodedId}`;
    return clusterReturnTo
      ? appendClusterReturnQuery(base, clusterReturnTo, clusterReturnLabel)
      : `${base}?from=cluster`;
  }

  const menuPath = restaurantMenuPathFromRow(item);
  return clusterReturnTo
    ? appendClusterReturnQuery(menuPath, clusterReturnTo, clusterReturnLabel)
    : menuPath;
}

export function ClusterDishChip({ item, clusterReturnTo = null, clusterReturnLabel = null }) {
  if (!item?.name) return null;

  if (item?.placeholder_item) {
    return <ClusterPlaceholderFoodCard item={item} />;
  }

  const href = buildDishHref(item, clusterReturnTo, clusterReturnLabel);

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

export function ClusterDishList({
  items = [],
  showRestaurantBreaks = false,
  clusterReturnTo = null,
  clusterReturnLabel = null,
}) {
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
          <React.Fragment key={item.placeholder_key || `${item.menu_item_id}-${item.restaurant_id}-${item.name}`}>
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
            <ClusterDishChip
              item={item}
              clusterReturnTo={clusterReturnTo}
              clusterReturnLabel={clusterReturnLabel}
            />
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
