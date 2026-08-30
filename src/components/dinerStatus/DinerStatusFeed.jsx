/**
 * Public Diner Status feed — quick emoji signals (not reviews / not I'm Eating).
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listPublicRestaurantDinerStatuses,
  listPublicMenuItemDinerStatuses,
  listPublicClusterDinerStatuses,
} from "../../lib/dinerStatusApi.js";
import DinerStatusComposer from "./DinerStatusComposer.jsx";

function StatusCard({ status, showRestaurant = false }) {
  const name = String(status?.display_name || "").trim() || "A diner";
  const dishHref = status?.menu_item_id
    ? `/menu-items/${encodeURIComponent(String(status.menu_item_id))}`
    : null;
  const restHref = status?.restaurant_slug || status?.restaurant_id
    ? `/restaurants/${encodeURIComponent(String(status.restaurant_slug || status.restaurant_id))}`
    : null;

  return (
    <article data-testid="diner-status-card" style={styles.card}>
      <div style={styles.row}>
        <span style={styles.emoji} aria-hidden="true">
          {status.expression_emoji}
        </span>
        <div>
          <strong style={styles.name}>{name}</strong>
          <div style={styles.line}>{status.display_line}</div>
          {showRestaurant && restHref ? (
            <Link to={restHref} style={styles.link}>
              {status.restaurant_name || "Restaurant"}
            </Link>
          ) : null}
          {!showRestaurant && dishHref ? (
            <Link to={dishHref} style={styles.link}>
              {status.item_name || "Dish"}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function DinerStatusFeed({
  restaurantId = null,
  restaurantName = "",
  menuItemId = null,
  menuItemName = null,
  clusterId = null,
  showComposer = true,
  compact = false,
  title = "Diner statuses",
  experienceMode = false,
  venueMode = false,
}) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (menuItemId) {
        data = await listPublicMenuItemDinerStatuses(menuItemId, { limit: 12 });
      } else if (restaurantId) {
        data = await listPublicRestaurantDinerStatuses(restaurantId, { limit: 12 });
      } else if (clusterId) {
        data = await listPublicClusterDinerStatuses(clusterId, { limit: 12 });
      } else {
        data = { statuses: [] };
      }
      setStatuses(data.statuses || []);
    } catch {
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, menuItemId, clusterId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!restaurantId && !menuItemId && !clusterId) return null;

  return (
    <section
      data-testid="diner-status-feed"
      aria-label={title}
      style={{ marginBottom: compact ? 8 : 12 }}
    >
      <div style={styles.sectionTitle}>{title}</div>
      <p style={styles.disclaimer}>
        {experienceMode
          ? "What's tasting good? How's the line?"
          : "Quick diner signals — not star ratings or verified reviews."}
      </p>
      {loading ? <p style={styles.muted}>Loading statuses…</p> : null}
      {!loading && statuses.length === 0 ? (
        <p style={styles.muted} data-testid="diner-status-empty">
          {experienceMode
            ? "Nobody's posted yet. Post what's good today."
            : "No diner statuses here yet."}
        </p>
      ) : null}
      {!loading && statuses.length > 0 ? (
        <div style={styles.list}>
          {statuses.map((s) => (
            <StatusCard key={s.id} status={s} showRestaurant={Boolean(clusterId)} />
          ))}
        </div>
      ) : null}
      {showComposer && restaurantId ? (
        <DinerStatusComposer
          restaurantId={restaurantId}
          menuItemId={experienceMode ? null : menuItemId}
          restaurantName={restaurantName}
          menuItemName={experienceMode ? null : menuItemName}
          compact={compact}
          experienceMode={experienceMode}
          venueMode={venueMode}
          suppressHeading={Boolean(title)}
          onPosted={() => load()}
        />
      ) : null}
    </section>
  );
}

const styles = {
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: "#1c1917",
    marginBottom: 4,
  },
  disclaimer: { margin: "0 0 8px", fontSize: 12, color: "#78716c" },
  muted: { fontSize: 13, color: "#78716c" },
  list: { display: "grid", gap: 8 },
  card: {
    padding: "10px 12px",
    background: "#fff",
    border: "1px solid #e7e5e4",
    borderRadius: 12,
  },
  row: { display: "flex", gap: 10, alignItems: "flex-start" },
  emoji: { fontSize: 22, lineHeight: 1 },
  name: { fontSize: 13, color: "#1c1917" },
  line: { fontSize: 14, color: "#292524", marginTop: 2 },
  link: { display: "inline-block", marginTop: 4, color: "#0f766e", fontWeight: 600, fontSize: 12 },
};
