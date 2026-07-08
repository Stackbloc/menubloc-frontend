import React from "react";
import { Link } from "react-router-dom";
import { restaurantPath } from "../../lib/canonicalUrlCore.js";
import { getCanonicalMenuItemPath } from "../share/shareUtils.js";
import { formatMenuItemPrice, getConsumerDisplayPrice } from "../../lib/pricingDisplay.js";

function buildRestaurantHref(item) {
  return (
    restaurantPath({
      slug: item.restaurant_slug,
      city: item.city,
      state: item.state,
    }) ||
    (item.restaurant_id ? `/restaurants/${item.restaurant_id}` : null)
  );
}

function buildMenuItemHref(item) {
  const restaurantHref = buildRestaurantHref(item);
  if (!restaurantHref || !item.menu_item_id) return restaurantHref;

  return (
    getCanonicalMenuItemPath({
      restaurant: {
        slug: item.restaurant_slug,
        city: item.city,
        state: item.state,
      },
      menuItem: {
        id: item.menu_item_id,
        slug: item.menu_item_slug,
        item_name: item.name,
      },
    }) || restaurantHref
  );
}

export function ClusterMenuItemRow({ item }) {
  if (!item) return null;

  const itemHref = buildMenuItemHref(item);
  const restaurantHref = buildRestaurantHref(item);
  const priceLabel = formatMenuItemPrice(getConsumerDisplayPrice(item));

  return (
    <article
      style={{
        display: "grid",
        gap: "0.35rem",
        padding: "0.85rem 0",
        borderBottom: "1px solid #eef2f7",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
        {itemHref ? (
          <Link to={itemHref} style={{ fontWeight: 600, color: "#111827", textDecoration: "none" }}>
            {item.name}
          </Link>
        ) : (
          <div style={{ fontWeight: 600, color: "#111827" }}>{item.name}</div>
        )}
        {priceLabel ? <div style={{ color: "#111827", fontWeight: 600, whiteSpace: "nowrap" }}>{priceLabel}</div> : null}
      </div>
      <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>{item.restaurant_name}</div>
      {item.category ? (
        <div style={{ color: "#9ca3af", fontSize: "0.82rem" }}>{item.category}</div>
      ) : null}
      {restaurantHref ? (
        <Link
          to={restaurantHref}
          style={{ color: "#1d4ed8", textDecoration: "none", fontSize: "0.88rem", width: "fit-content" }}
        >
          View Restaurant →
        </Link>
      ) : null}
    </article>
  );
}

export function ClusterMenuCategorySection({ category, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section style={{ display: "grid", gap: "0.25rem" }}>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem", color: "#374151" }}>
        {category || "Menu"}
      </h3>
      {items.map((item) => (
        <ClusterMenuItemRow key={`${item.menu_item_id}-${item.restaurant_id}`} item={item} />
      ))}
    </section>
  );
}

export function ClusterMenuRestaurantGroup({ group }) {
  if (!group || !Array.isArray(group.menu_items) || group.menu_items.length === 0) return null;

  const restaurantHref = buildRestaurantHref(group);

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "0.85rem 1rem",
        display: "grid",
        gap: "0.35rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.02rem" }}>{group.restaurant_name}</h3>
        {restaurantHref ? (
          <Link to={restaurantHref} style={{ color: "#1d4ed8", textDecoration: "none", fontSize: "0.88rem" }}>
            View Restaurant →
          </Link>
        ) : null}
      </div>
      {group.menu_items.map((item) => (
        <ClusterMenuItemRow key={`${item.menu_item_id}-${item.name}`} item={{ ...item, ...group, restaurant_name: group.restaurant_name }} />
      ))}
    </section>
  );
}

export function ClusterMenuExplorerReservedFilters() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }} aria-label="Future menu filters">
      {[
        "Price",
        "Protein",
        "Calories",
        "Dietary",
        "Ingredients",
        "Deals",
        "Popular",
        "Open Now",
      ].map((label) => (
        <span
          key={label}
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: 999,
            border: "1px dashed #d1d5db",
            color: "#9ca3af",
            fontSize: "0.82rem",
            background: "#fafafa",
          }}
          title="Coming soon"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
