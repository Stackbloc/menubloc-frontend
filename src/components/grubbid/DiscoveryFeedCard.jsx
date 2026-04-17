import React from "react";
import { Link } from "react-router-dom";

function formatCuisine(raw) {
  return String(raw || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function DiscoveryFeedCard({ menu, index = 0, onMore }) {
  const name = menu?.restaurant_name || "Restaurant";
  const cuisine = menu?.cuisine || menu?.category || null;
  const preview = (menu?.preview_items || []).slice(0, 3);
  const href = `/public/restaurants/${menu?.restaurant_id}/menu`;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      marginBottom: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ padding: "16px 16px 14px" }}>

        {/* Name + ⋮ */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 2,
        }}>
          <Link to={href} style={{
            fontSize: 17, fontWeight: 800, color: "#101828",
            textDecoration: "none", lineHeight: 1.2,
            flex: 1, paddingRight: 8,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </Link>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMore && onMore(menu); }}
            aria-label="More options"
            style={{
              border: "none", background: "transparent",
              fontSize: 18, color: "#c4c9d4", cursor: "pointer",
              padding: "0 2px", flexShrink: 0, lineHeight: 1, marginTop: 2,
            }}
          >
            ⋮
          </button>
        </div>

        {/* Cuisine */}
        {cuisine && (
          <div style={{
            fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 12,
          }}>
            {formatCuisine(cuisine)}
          </div>
        )}

        {/* Menu items */}
        {preview.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {preview.map((item, i) => (
              <div key={i} style={{
                fontSize: 13, fontWeight: 500, color: "#475467",
                lineHeight: 1.5,
              }}>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Text action */}
        <Link to={href} style={{
          display: "inline-block",
          fontSize: 13, fontWeight: 600, color: "#1F4E3D",
          textDecoration: "none", paddingTop: 2,
        }}>
          View menu
        </Link>

      </div>
    </div>
  );
}
