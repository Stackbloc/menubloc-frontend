import React from "react";
import { Link } from "react-router-dom";

function formatCuisine(raw) {
  return String(raw || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function buildBadges(menu) {
  const badges = [];
  if (menu?.has_vegan_options) badges.push("Vegan");
  if (menu?.has_gluten_free_options) badges.push("Gluten-Free");
  if (menu?.has_diabetic_friendly_options && badges.length < 2) badges.push("Diabetic Friendly");
  return badges.slice(0, 2);
}

export default function DiscoveryFeedCard({ menu, index = 0, onMore }) {
  const name = menu?.restaurant_name || "Restaurant";
  const cuisine = menu?.cuisine || menu?.category || null;
  const distance = menu?.distance_miles != null
    ? `${Number(menu.distance_miles).toFixed(1)} mi`
    : null;
  const preview = (menu?.preview_items || []).slice(0, 3);
  const badges = buildBadges(menu);
  const href = `/public/restaurants/${menu?.restaurant_id}/menu`;
  const phone = menu?.phone || null;
  const websiteUrl = menu?.website_url || null;
  const hasSecondCTA = phone || websiteUrl;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      marginBottom: 12,
      border: "1px solid #eaecf0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px 16px 14px" }}>

        {/* Meta row: cuisine type + distance */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 8,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#667085",
            textTransform: "uppercase", letterSpacing: 0.7,
          }}>
            {cuisine ? formatCuisine(cuisine) : "Restaurant"}
          </span>
          {distance && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>
              {distance}
            </span>
          )}
        </div>

        {/* Restaurant name + ⋮ */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 12,
        }}>
          <Link to={href} style={{
            fontSize: 18, fontWeight: 800, color: "#101828",
            textDecoration: "none", lineHeight: 1.25,
            flex: 1, paddingRight: 8,
          }}>
            {name}
          </Link>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMore && onMore(menu); }}
            aria-label="More options"
            style={{
              border: "none", background: "transparent",
              fontSize: 20, color: "#9ca3af", cursor: "pointer",
              padding: "0 2px", flexShrink: 0, lineHeight: 1, marginTop: 2,
            }}
          >
            ⋮
          </button>
        </div>

        {/* Preview items — structured bullet list */}
        {preview.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af",
              letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6,
            }}>
              Top items
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {preview.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 3, height: 3, borderRadius: "50%",
                    background: "#d0d5dd", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#344054" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diet badges — max 2, subdued */}
        {badges.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {badges.map((b) => (
              <span key={b} style={{
                fontSize: 11, fontWeight: 600, color: "#475467",
                background: "#f9fafb", borderRadius: 999,
                padding: "3px 10px", border: "1px solid #eaecf0",
              }}>
                {b}
              </span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10 }}>
          <Link to={href} style={{
            flex: hasSecondCTA ? 1 : undefined,
            width: hasSecondCTA ? undefined : "100%",
            height: 40, borderRadius: 10,
            background: "#101828", color: "#fff",
            fontSize: 14, fontWeight: 700, textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            letterSpacing: 0.1,
          }}>
            View Menu
          </Link>
          {hasSecondCTA && (
            <a
              href={websiteUrl || `tel:${phone}`}
              target={websiteUrl ? "_blank" : undefined}
              rel={websiteUrl ? "noopener noreferrer" : undefined}
              style={{
                flex: 1, height: 40, borderRadius: 10,
                background: "#fff", color: "#344054",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #d0d5dd",
              }}
            >
              {websiteUrl ? "Order" : "Call"}
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
