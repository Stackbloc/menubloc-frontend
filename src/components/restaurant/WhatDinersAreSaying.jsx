/**
 * Restaurant profile: What Diners Are Saying
 * Derived from canonical food_activity (I'm Eating) — not verified purchase data.
 * FoodComments (tips/discussion) live under the same section — no second heading.
 * Not a conventional rating system.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FoodComments from "../comments/FoodComments.jsx";
import { listPublicRestaurantFoodActivity } from "../../lib/foodActivityApi.js";
import { profileReadableSurfaceStyle } from "./publicProfile/profilePrimitives.jsx";
import DinerStatusFeed from "../dinerStatus/DinerStatusFeed.jsx";

function dinerLabel(activity) {
  const name = String(activity?.display_name || "").trim();
  if (name) return name;
  return "A diner";
}

function ActivityCard({ activity }) {
  const itemHref = activity?.menu_item_id
    ? `/menu-items/${encodeURIComponent(String(activity.menu_item_id))}`
    : null;
  const isPlaceOnly = !activity?.menu_item_id;
  const itemName = isPlaceOnly
    ? activity?.restaurant_name || "this place"
    : activity?.item_name || "Menu item";
  const badge = activity?.edu_verification_badge || null;

  return (
    <article
      data-testid="diners-saying-activity"
      data-share-kind={isPlaceOnly ? "place" : "dish"}
      style={styles.card}
    >
      <div style={styles.nameRow}>
        <strong style={styles.name}>{dinerLabel(activity)}</strong>
        {badge ? <span style={styles.badge}>{badge}</span> : null}
      </div>
      <div style={styles.itemLine}>
        {itemHref ? (
          <Link to={itemHref} style={styles.itemLink}>
            {itemName}
          </Link>
        ) : (
          <span>{itemName}</span>
        )}
      </div>
      <p style={styles.shared}>
        {activity?.activity_label || "shared that they are eating"}
      </p>
      {activity?.comment ? (
        <p style={styles.quote}>&ldquo;{activity.comment}&rdquo;</p>
      ) : null}
      {activity?.photo_url ? (
        <img
          src={activity.photo_url}
          alt=""
          style={styles.photo}
          loading="lazy"
        />
      ) : null}
    </article>
  );
}

export default function WhatDinersAreSaying({
  restaurantId,
  restaurantSlug = null,
  restaurantCity = null,
  restaurantState = null,
  restaurantName = "",
  menuPreviewItems = null,
  compact = false,
  /** Dining halls: experience reports only — no menu framing. */
  experienceMode = false,
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId) {
      setActivities([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError("");
    listPublicRestaurantFoodActivity(restaurantId, { limit: 20 })
      .then((data) => {
        if (cancelled) return;
        setActivities(data.activities || []);
      })
      .catch((err) => {
        if (cancelled) return;
        // Soft-fail when migration not applied yet — still show discussion.
        setError("");
        setActivities([]);
        if (import.meta.env?.DEV) {
          console.warn("[WhatDinersAreSaying]", err?.message || err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (!restaurantId) return null;

  return (
    <section
      id="what-diners-are-saying"
      data-testid="what-diners-are-saying"
      aria-label="What Diners Are Saying"
      style={{ marginBottom: 0 }}
    >
      <div
        data-profile-surface="card"
        style={profileReadableSurfaceStyle({
          marginBottom: 16,
          padding: compact ? "14px 14px" : "16px 16px",
        })}
      >
        <div style={styles.sectionTitle}>
          {experienceMode ? "Dining hall experiences" : "What Diners Are Saying"}
        </div>
        <p style={styles.disclaimer}>
          {experienceMode
            ? "Diner-reported campus experiences (lines, vibe, what's good today). Menuply does not track dining-hall menus here."
            : "User-reported food activity — Menuply does not verify purchases."}
        </p>

        <DinerStatusFeed
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          showComposer
          compact={compact}
          experienceMode={experienceMode}
          title={experienceMode ? "Campus updates" : "Diner statuses"}
        />

        {experienceMode ? null : loading ? <p style={styles.muted}>Loading activity…</p> : null}
        {experienceMode ? null : error ? (
          <p style={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {experienceMode ? null : !loading && activities.length === 0 ? (
          <p style={styles.muted} data-testid="diners-saying-empty">
            No one has shared what they&apos;re eating here yet.
          </p>
        ) : null}

        {experienceMode ? null : !loading && activities.length > 0 ? (
          <div style={styles.list} data-testid="diners-saying-list">
            {activities.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        ) : null}

        <div style={styles.commentsWrap} data-testid="diners-saying-comments">
          <FoodComments
            restaurantId={restaurantId}
            restaurantSlug={restaurantSlug}
            restaurantCity={restaurantCity}
            restaurantState={restaurantState}
            menuPreviewItems={experienceMode ? null : menuPreviewItems}
            showFeaturedFirst
            hideTitle
            embedded
            compact={compact}
          />
        </div>
      </div>
    </section>
  );
}

const styles = {
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: "#1c1917",
    marginBottom: 6,
  },
  disclaimer: {
    margin: "0 0 12px",
    fontSize: 12,
    color: "#78716c",
    lineHeight: 1.4,
  },
  muted: { fontSize: 13, color: "#78716c", margin: "0 0 12px" },
  error: { fontSize: 13, color: "#b91c1c", margin: "0 0 12px" },
  list: { display: "grid", gap: 10, marginBottom: 4 },
  commentsWrap: {
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid #e7e5e4",
  },
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
  badge: { fontSize: 11, fontWeight: 600, color: "#14532d" },
  itemLine: { fontSize: 15, fontWeight: 600, color: "#1c1917" },
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
};
