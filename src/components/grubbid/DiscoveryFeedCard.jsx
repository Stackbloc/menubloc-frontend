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

// Muted per-card palette — soft background + readable foreground
const MONO_PALETTE = [
  { bg: "#e8f4fd", text: "#1e6fa8" },
  { bg: "#edfcf2", text: "#1a6b3c" },
  { bg: "#fdf3e7", text: "#a35b0a" },
  { bg: "#f3eefa", text: "#6b21a8" },
  { bg: "#fdecea", text: "#b91c1c" },
  { bg: "#e9f7f6", text: "#0f766e" },
  { bg: "#fef9e7", text: "#92400e" },
  { bg: "#f0f0f5", text: "#374151" },
];

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

  const mono = MONO_PALETTE[index % MONO_PALETTE.length];
  const initial = name.replace(/^The\s+/i, "").charAt(0).toUpperCase();
  const metaParts = [cuisine ? formatCuisine(cuisine) : null, distance].filter(Boolean);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      marginBottom: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px 16px 14px" }}>

        {/* Header: monogram + name/meta + ⋮ */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>

          {/* Monogram — visual anchor */}
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: mono.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: mono.text,
            marginTop: 1,
          }}>
            {initial}
          </div>

          {/* Name + cuisine · distance */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={href} style={{
              display: "block",
              fontSize: 17, fontWeight: 800, color: "#101828",
              textDecoration: "none", lineHeight: 1.2, marginBottom: 3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {name}
            </Link>
            {metaParts.length > 0 && (
              <div style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af" }}>
                {metaParts.join("  ·  ")}
              </div>
            )}
          </div>

          {/* ⋮ */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMore && onMore(menu); }}
            aria-label="More options"
            style={{
              border: "none", background: "transparent",
              fontSize: 18, color: "#c4c9d4", cursor: "pointer",
              padding: "0 2px", flexShrink: 0, lineHeight: 1, marginTop: 3,
            }}
          >
            ⋮
          </button>
        </div>

        {/* Preview items — hairline divider then bare list, no label */}
        {preview.length > 0 && (
          <>
            <div style={{ height: 1, background: "#f2f4f7", marginBottom: 12 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
              {preview.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 3, height: 3, borderRadius: "50%",
                    background: "#d0d5dd", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#475467" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Badges — borderless, very light */}
        {badges.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
            {badges.map((b) => (
              <span key={b} style={{
                fontSize: 11, fontWeight: 500, color: "#6b7280",
                background: "#f9fafb", borderRadius: 999, padding: "2px 8px",
              }}>
                {b}
              </span>
            ))}
          </div>
        )}

        {/* CTAs — primary button + text link */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link to={href} style={{
            height: 36, borderRadius: 8, flexShrink: 0,
            background: "#101828", color: "#fff",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 18px",
          }}>
            View Menu
          </Link>
          {hasSecondCTA && (
            <a
              href={websiteUrl || `tel:${phone}`}
              target={websiteUrl ? "_blank" : undefined}
              rel={websiteUrl ? "noopener noreferrer" : undefined}
              style={{
                fontSize: 13, fontWeight: 600, color: "#1F4E3D",
                textDecoration: "none",
                display: "flex", alignItems: "center", gap: 3,
              }}
            >
              {websiteUrl ? "Order" : "Call"} →
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
