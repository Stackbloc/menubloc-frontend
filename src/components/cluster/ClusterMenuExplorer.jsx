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
  const description = String(item?.description || item?.item_description || "").trim();
  const concessionName = item?.concession_name || item?.restaurant_name || null;
  const location = item?.location ? String(item.location).trim() : "";
  const area = item?.area ? String(item.area).trim() : "";

  return (
    <div style={CLUSTER_PLACEHOLDER_FOOD_CARD_STYLE}>
      <div style={{ fontWeight: 700, color: "#111827", fontSize: "1rem", overflowWrap: "anywhere" }}>
        {itemName}
      </div>
      {description ? (
        <div style={{ color: "#4b5563", fontSize: "0.86rem", lineHeight: 1.45, overflowWrap: "anywhere" }}>
          {description}
        </div>
      ) : null}
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
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  width: "100%",
  boxSizing: "border-box",
  padding: "0.55rem 0.75rem 0.55rem 0.7rem",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  borderLeft: "3px solid #16a34a",
  background: "#ffffff",
  color: "#111827",
  textDecoration: "none",
  textAlign: "left",
  overflowWrap: "anywhere",
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

function ClusterDishChipContent({ item }) {
  const restaurantName = String(item?.restaurant_name || "").trim();

  return (
    <>
      <span style={{ display: "grid", gap: "0.15rem", minWidth: 0, flex: 1 }}>
        <span
          data-testid="cluster-dish-name"
          style={{
            fontWeight: 650,
            fontSize: "0.95rem",
            lineHeight: 1.3,
            color: "#111827",
            overflowWrap: "anywhere",
          }}
        >
          {item.name}
        </span>
        {restaurantName ? (
          <span
            data-testid="cluster-dish-restaurant"
            style={{
              fontWeight: 500,
              fontSize: "0.8rem",
              lineHeight: 1.3,
              color: "#6b7280",
              overflowWrap: "anywhere",
            }}
          >
            {restaurantName}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          color: "#9ca3af",
          fontSize: "0.95rem",
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        →
      </span>
    </>
  );
}

export function ClusterDishChip({ item, clusterReturnTo = null, clusterReturnLabel = null }) {
  if (!item?.name) return null;

  if (item?.placeholder_item) {
    return <ClusterPlaceholderFoodCard item={item} />;
  }

  const href = buildDishHref(item, clusterReturnTo, clusterReturnLabel);
  const content = <ClusterDishChipContent item={item} />;

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
    <div style={{ display: "grid", gap: "0.4rem" }}>
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
