import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function formatCuisine(raw) {
  return String(raw || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function DiscoveryFeedCard({ menu, index = 0, onMore }) {
  const [pressed, setPressed] = useState(false);
  const navigate = useNavigate();

  const name = menu?.restaurant_name || "Restaurant";
  const cuisine = menu?.cuisine || menu?.category || null;
  const distance = menu?.distance_miles != null
    ? `${Number(menu.distance_miles).toFixed(1)} mi`
    : null;
  const href = `/public/restaurants/${menu?.restaurant_id}/menu`;

  const meta = [cuisine ? formatCuisine(cuisine) : null, distance]
    .filter(Boolean)
    .join(" • ");

  function handlePress() { setPressed(true); }
  function handleRelease() { setPressed(false); }
  function handleClick(e) {
    if (e.target.closest("button")) return;
    navigate(href);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(href); }}
      style={{
        background: pressed ? "#f7f8fa" : "#fff",
        borderRadius: 14,
        marginBottom: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: pressed
          ? "transform 100ms ease, background 100ms ease"
          : "transform 150ms ease, background 150ms ease",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ padding: "16px 16px 14px" }}>

        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 2,
        }}>
          <span style={{
            fontSize: 17, fontWeight: 800, color: "#101828",
            lineHeight: 1.2, flex: 1, paddingRight: 8,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </span>
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

        {meta && (
          <div style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 12 }}>
            {meta}
          </div>
        )}

        <span style={{
          display: "inline-block",
          fontSize: 13, fontWeight: 600, color: "#1F4E3D",
          paddingTop: 2,
        }}>
          View menu
        </span>

      </div>
    </div>
  );
}
