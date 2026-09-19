/**
 * Tagged What I Ate entries on a restaurant profile.
 * Only diners who opted in and linked this restaurant/menu item appear here.
 * C1: text-only on restaurant profile — video lives in Videos section only.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublicRestaurantWhatIAteToday } from "../../lib/whatIAteTodayApi.js";
import { restaurantPath } from "../../lib/canonicalUrlCore.js";
import { mealPeriodLabel } from "../../lib/whatIAteTodayMealPeriod.js";
import { calendarDayYmd } from "../../lib/calendarDayYmd.js";

/** Day (Sep 9) or month-only (Sep 2026) when API coarsened to YYYY-MM. */
function formatEatenOn(value) {
  const raw = String(value || "").trim();
  const monthOnly = raw.match(/^(\d{4})-(\d{2})$/);
  if (monthOnly) {
    const y = Number(monthOnly[1]);
    const m = Number(monthOnly[2]);
    if (!y || !m) return raw;
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }
  const ymd = calendarDayYmd(value);
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function EntryCard({ entry }) {
  const itemLabel = entry.item_name || entry.food_name;
  const menuHref =
    entry.menu_item_href ||
    (entry.menu_item_id ? `/menu-items/${entry.menu_item_id}` : null);
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
  wrap: { marginTop: 16 },
  title: { fontSize: 13, fontWeight: 800, letterSpacing: 0.3, marginBottom: 4 },
  disclaimer: { margin: "0 0 10px", fontSize: 12, color: "#78716c", lineHeight: 1.4 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { padding: "10px 0", borderBottom: "1px solid #e7e5e4" },
  nameRow: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline", marginBottom: 4 },
  name: { fontSize: 14, color: "#1c1917" },
  meal: { fontSize: 12, color: "#78716c" },
  when: { fontSize: 12, color: "#78716c" },
  itemLine: { fontSize: 14, fontWeight: 600, color: "#1c1917" },
  itemLink: { color: "#1c1917", textDecoration: "underline" },
  atLine: { margin: "4px 0 0", fontSize: 13, color: "#57534e" },
  shared: { margin: "6px 0 0", fontSize: 12, color: "#78716c" },
  quote: { margin: "6px 0 0", fontSize: 13, color: "#44403c", fontStyle: "italic" },
};
