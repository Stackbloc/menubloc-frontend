import React from "react";
import { Link } from "react-router-dom";
import { restaurantMenuPathFromRow, restaurantPathFromRow } from "../../lib/canonicalUrl.js";
import { isRestaurantMenuReady } from "../../lib/publicCardCounts.js";
import {
  formatRestaurantCuisineLabel,
  formatRestaurantLocationLabel,
  formatRestaurantMenuCount,
  formatRestaurantPriceTier,
  resolveClusterRestaurantAccent,
  resolveClusterRestaurantStatus,
} from "../../lib/clusterRestaurantDisplay.js";

function clampLines(maxLines) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

export default function ClusterRestaurantDirectoryCard({ restaurant }) {
  if (!restaurant) return null;

  const name = restaurant?.restaurant_name || restaurant?.name || "Restaurant";
  const accent = resolveClusterRestaurantAccent(restaurant);
  const cuisineLabel = formatRestaurantCuisineLabel(restaurant);
  const locationLabel = formatRestaurantLocationLabel(restaurant);
  const priceTierLabel = formatRestaurantPriceTier(restaurant);
  const menuCountLabel = formatRestaurantMenuCount(restaurant);
  const status = resolveClusterRestaurantStatus(restaurant);
  const locationCount = Number(restaurant?.location_count) || 1;
  const menuReady = isRestaurantMenuReady(restaurant);
  const profileHref = restaurantPathFromRow(restaurant);
  const menuHref = restaurantMenuPathFromRow(restaurant);
  const href = menuReady && menuHref ? menuHref : profileHref;

  const content = (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        minHeight: 220,
        aspectRatio: "1 / 1",
        padding: "1.1rem",
        borderRadius: 6,
        border: `2px solid ${accent.border}`,
        background: accent.bg,
        boxSizing: "border-box",
        boxShadow: "0 2px 0 rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        color: "inherit",
      }}
    >
      <div style={{ display: "grid", gap: "0.5rem", minHeight: 0, minWidth: 0 }}>
        <div style={{ fontSize: "1.35rem", lineHeight: 1 }} aria-hidden="true">
          {accent.emoji}
        </div>
        <div
          style={{
            ...clampLines(3),
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.3,
            overflowWrap: "anywhere",
          }}
        >
          {name}
        </div>
        {cuisineLabel ? (
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#4b5563",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              overflowWrap: "anywhere",
            }}
          >
            {cuisineLabel}
          </div>
        ) : null}
        {locationLabel ? (
          <div style={{ color: "#6b7280", fontSize: "0.88rem", lineHeight: 1.4, overflowWrap: "anywhere" }}>
            {locationLabel}
          </div>
        ) : null}
        {priceTierLabel ? (
          <div style={{ color: "#374151", fontSize: "0.88rem", fontWeight: 700 }}>{priceTierLabel}</div>
        ) : null}
        {locationCount > 1 ? (
          <div style={{ color: "#6b7280", fontSize: "0.84rem" }}>
            {locationCount} locations in this area
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.35rem",
          marginTop: "0.75rem",
          paddingTop: "0.75rem",
          borderTop: `1px solid ${accent.border}`,
        }}
      >
        <span
          style={{
            alignSelf: "flex-start",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: status.tone,
            background: status.background,
            borderRadius: 999,
            padding: "0.2rem 0.55rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {status.text}
        </span>
        <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.92rem", overflowWrap: "anywhere" }}>
          {menuCountLabel || "Menu details coming soon"}
        </div>
        {href ? (
          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: accent.border }}>
            {menuReady ? "View menu →" : "View profile →"}
          </div>
        ) : null}
      </div>
    </article>
  );

  if (!href) return content;

  return (
    <Link to={href} style={{ display: "block", color: "inherit", textDecoration: "none", minWidth: 0, maxWidth: "100%" }}>
      {content}
    </Link>
  );
}
