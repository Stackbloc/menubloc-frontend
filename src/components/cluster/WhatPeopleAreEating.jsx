/**
 * Cluster: What People Are Eating
 * Area-specific aggregated food activity — PUBLIC / non-subscriber readable.
 * Derived from canonical food_activity. Not person-browsing. Not "orders".
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublicClusterFoodActivity } from "../../lib/foodActivityApi.js";

function restaurantHref(item) {
  const key = item?.restaurant_slug || item?.restaurant_id;
  return key ? `/restaurants/${encodeURIComponent(String(key))}` : null;
}

function ItemCard({ item }) {
  const dishHref = item?.menu_item_id
    ? `/menu-items/${encodeURIComponent(String(item.menu_item_id))}`
    : null;
  const restHref = restaurantHref(item);
  const label =
    item?.people_shared_label ||
    `${item?.people_shared_count || 0} ${
      Number(item?.people_shared_count) === 1 ? "person shared this" : "people shared this"
    }`;

  return (
    <article data-testid="people-eating-item" style={styles.card}>
      <div style={styles.dish}>
        {dishHref ? (
          <Link to={dishHref} style={styles.dishLink}>
            {item.item_name || "Menu item"}
          </Link>
        ) : (
          <strong>{item.item_name || "Menu item"}</strong>
        )}
      </div>
      <div style={styles.restaurant}>
        {restHref ? (
          <Link to={restHref} style={styles.restLink}>
            {item.restaurant_name || "Restaurant"}
          </Link>
        ) : (
          <span>{item.restaurant_name || "Restaurant"}</span>
        )}
      </div>
      <div style={styles.count} data-testid="people-eating-count">
        {label}
      </div>
    </article>
  );
}

export default function WhatPeopleAreEating({ clusterId, compact = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!clusterId) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    listPublicClusterFoodActivity(clusterId, { limit: 20 })
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        if (import.meta.env?.DEV) {
          console.warn("[WhatPeopleAreEating]", err?.message || err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  if (!clusterId) return null;

  return (
    <section
      id="what-people-are-eating"
      data-testid="what-people-are-eating"
      aria-label="What People Are Eating"
      style={{
        marginBottom: compact ? 12 : 20,
        padding: compact ? "12px 0" : "14px 0 4px",
        borderTop: "1px solid #e5e7eb",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div style={styles.sectionTitle}>What People Are Eating</div>
      <p style={styles.lead}>What&apos;s happening around food here — public area activity.</p>
      <p style={styles.disclaimer}>
        Counts are people who shared they&apos;re eating these dishes — not verified purchases.
      </p>

      {loading ? <p style={styles.muted}>Loading activity…</p> : null}

      {!loading && items.length === 0 ? (
        <p style={styles.muted} data-testid="people-eating-empty">
          No shared food activity in this area yet.
        </p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div style={styles.list} data-testid="people-eating-list">
          {items.map((item) => (
            <ItemCard
              key={`${item.menu_item_id}-${item.restaurant_id}`}
              item={item}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: "#111827",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  lead: {
    margin: "0 0 4px",
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.45,
  },
  disclaimer: {
    margin: "0 0 12px",
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.4,
  },
  muted: { fontSize: 13, color: "#6b7280", margin: "0 0 8px" },
  list: { display: "grid", gap: 10 },
  card: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    display: "grid",
    gap: 4,
  },
  dish: { fontSize: 16, fontWeight: 700, color: "#111827" },
  dishLink: { color: "#166534", textDecoration: "none", fontWeight: 700 },
  restaurant: { fontSize: 14, color: "#4b5563" },
  restLink: { color: "#2563eb", textDecoration: "none" },
  count: { fontSize: 13, fontWeight: 600, color: "#14532d", marginTop: 2 },
};
