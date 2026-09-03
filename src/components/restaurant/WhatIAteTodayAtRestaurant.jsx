/**
 * Tagged What I Ate entries on a restaurant profile.
 * Only diners who opted in and linked this restaurant/menu item appear here.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublicRestaurantWhatIAteToday } from "../../lib/whatIAteTodayApi.js";
import { restaurantPath } from "../../lib/canonicalUrlCore.js";
import { mealPeriodLabel } from "../../lib/whatIAteTodayMealPeriod.js";
import { resolveConsumerMediaUrl } from "../../lib/consumerApi.js";

function formatEatenOn(ymd) {
  if (!ymd) return "";
  const [y, m, d] = String(ymd).split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function EntryCard({ entry }) {
  const itemLabel = entry.item_name || entry.food_name;
  const menuHref = entry.menu_item_href || (entry.menu_item_id ? `/menu-items/${entry.menu_item_id}` : null);
  const restaurantHref = restaurantPath({
    slug: entry.restaurant_slug,
    city: entry.restaurant_city,
    state: entry.restaurant_state,
  });

  return (
    <article data-testid="what-i-ate-restaurant-entry" style={styles.card}>
      <div style={styles.nameRow}>
        <strong style={styles.name}>{entry.display_name || "A diner"}</strong>
        {entry.meal_period ? (
          <span style={styles.meal}>{mealPeriodLabel(entry.meal_period)}</span>
        ) : null}
        {entry.eaten_on ? <span style={styles.when}>{formatEatenOn(entry.eaten_on)}</span> : null}
      </div>
      <div style={styles.itemLine}>
        {menuHref ? (
          <Link to={menuHref} style={styles.itemLink}>
            {itemLabel}
          </Link>
        ) : (
          <span>{itemLabel}</span>
        )}
      </div>
      {entry.restaurant_name && !entry.menu_item_id ? (
        <p style={styles.atLine}>
          at{" "}
          {restaurantHref ? (
            <Link to={restaurantHref} style={styles.itemLink}>
              {entry.restaurant_name}
            </Link>
          ) : (
            entry.restaurant_name
          )}
        </p>
      ) : null}
      <p style={styles.shared}>{entry.activity_label || "logged in their food diary"}</p>
      {entry.comment ? <p style={styles.quote}>&ldquo;{entry.comment}&rdquo;</p> : null}
      {entry.video_url ? (
        <video
          src={resolveConsumerMediaUrl(entry.video_url)}
          style={styles.video}
          controls
          playsInline
          preload="metadata"
          data-testid="what-i-ate-restaurant-video"
        />
      ) : entry.photo_url ? (
        <img
          src={resolveConsumerMediaUrl(entry.photo_url)}
          alt=""
          style={styles.photo}
          loading="lazy"
        />
      ) : null}
    </article>
  );
}

export default function WhatIAteTodayAtRestaurant({ restaurantId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId) {
      setEntries([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    listPublicRestaurantWhatIAteToday(restaurantId, { limit: 20 })
      .then((data) => {
        if (!cancelled) setEntries(Array.isArray(data.entries) ? data.entries : []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (!restaurantId || loading || entries.length === 0) return null;

  return (
    <div style={styles.wrap} data-testid="what-i-ate-at-restaurant">
      <div style={styles.title}>What diners logged here</div>
      <p style={styles.disclaimer}>
        Tagged food diary entries from diners who opted in to sharing — not verified orders.
      </p>
      <div style={styles.list}>
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: { margin: "0 0 14px" },
  title: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.3,
    color: "#1c1917",
    marginBottom: 4,
  },
  disclaimer: {
    margin: "0 0 10px",
    fontSize: 12,
    color: "#78716c",
    lineHeight: 1.4,
  },
  list: { display: "grid", gap: 10 },
  card: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e7e5e4",
    background: "#fff",
    display: "grid",
    gap: 4,
  },
  nameRow: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline" },
  name: { fontSize: 15, color: "#1c1917" },
  meal: { fontSize: 11, fontWeight: 700, color: "#166534" },
  when: { fontSize: 11, color: "#78716c" },
  itemLine: { fontSize: 15, fontWeight: 600, color: "#1c1917" },
  atLine: { margin: 0, fontSize: 13, color: "#57534e" },
  itemLink: { color: "#166534", textDecoration: "none" },
  shared: { margin: 0, fontSize: 12, color: "#78716c" },
  quote: {
    margin: "4px 0 0",
    fontSize: 14,
    color: "#44403c",
    fontStyle: "italic",
    lineHeight: 1.4,
  },
  photo: {
    marginTop: 8,
    maxWidth: "100%",
    maxHeight: 180,
    borderRadius: 8,
    objectFit: "cover",
  },
  video: {
    marginTop: 8,
    width: "100%",
    maxHeight: 220,
    borderRadius: 8,
    background: "#0f172a",
    objectFit: "contain",
  },
};
