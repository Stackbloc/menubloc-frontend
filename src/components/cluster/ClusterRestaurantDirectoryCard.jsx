import React from "react";
import { Link } from "react-router-dom";
import { restaurantMenuPathFromRow, restaurantPathFromRow } from "../../lib/canonicalUrl.js";
import { isRestaurantMenuReady } from "../../lib/publicCardCounts.js";
import { appendClusterReturnQuery } from "../../lib/clusterReturnNavigation.js";
import {
  formatRestaurantCuisineLabel,
  formatRestaurantPriceTier,
  resolveClusterRestaurantAccent,
  resolveClusterRestaurantStatus,
} from "../../lib/clusterRestaurantDisplay.js";
import { formatClusterListingNoteForDisplay } from "../../lib/clusterListingNoteDisplay.js";

export default function ClusterRestaurantDirectoryCard({
  restaurant,
  placeReturnPath = null,
  placeReturnLabel = null,
}) {
  if (!restaurant) return null;

  const name = restaurant?.restaurant_name || restaurant?.name || "Restaurant";
  const listingNote = formatClusterListingNoteForDisplay(
    restaurant?.listing_note || restaurant?.notes || ""
  );
  const accent = resolveClusterRestaurantAccent(restaurant);
  const cuisineLabel = formatRestaurantCuisineLabel(restaurant);
  const addressHint = String(restaurant?.address_line1 || "").trim() || null;
  const priceTierLabel = formatRestaurantPriceTier(restaurant);
  const status = resolveClusterRestaurantStatus(restaurant);
  const menuReady = isRestaurantMenuReady(restaurant);
  const profileHref = restaurantPathFromRow(restaurant);
  const menuHref = restaurantMenuPathFromRow(restaurant);
  const rawHref = menuReady && menuHref ? menuHref : profileHref;
  const href =
    rawHref && placeReturnPath
      ? appendClusterReturnQuery(rawHref, placeReturnPath, placeReturnLabel)
      : rawHref;

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.45rem",
          minHeight: 0,
          minWidth: 0,
          flex: "1 1 auto",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "1.35rem", lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
          {accent.emoji}
        </div>
        <div style={{ minWidth: 0, flexShrink: 0 }}>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.35,
              fontSynthesis: "none",
              WebkitFontSmoothing: "antialiased",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {name}
          </div>
          {listingNote ? (
            <div
              data-testid="cluster-restaurant-listing-note"
              style={{
                marginTop: "0.25rem",
                fontWeight: 600,
                fontSize: "0.78rem",
                color: "#6b7280",
                lineHeight: 1.35,
                overflowWrap: "anywhere",
              }}
            >
              {listingNote}
            </div>
          ) : null}
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
              flexShrink: 0,
            }}
          >
            {cuisineLabel}
          </div>
        ) : null}
        {addressHint ? (
          <div
            style={{
              color: "#6b7280",
              fontSize: "0.82rem",
              lineHeight: 1.35,
              overflowWrap: "anywhere",
              minHeight: 0,
            }}
          >
            {addressHint}
          </div>
        ) : null}
        {priceTierLabel ? (
          <div style={{ color: "#374151", fontSize: "0.88rem", fontWeight: 700, flexShrink: 0 }}>
            {priceTierLabel}
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
          flexShrink: 0,
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
          {menuReady ? "View menu →" : "View profile →"}
        </div>
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
