import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CARD_STYLE_BASE = `
  .dfc-card {
    transition: transform 150ms ease, box-shadow 150ms ease, background 80ms ease;
  }
  .dfc-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0,0,0,0.09) !important;
  }
`;


function formatCuisine(raw) {
  return String(raw || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function DiscoveryFeedCard({ menu, index = 0, onMore }) {
  const [pressed, setPressed] = useState(false);
  const navigate = useNavigate();

  const name     = menu?.restaurant_name || "Restaurant";
  const cuisine  = menu?.cuisine || menu?.category || null;
  const distance = menu?.distance_miles != null
    ? `${Number(menu.distance_miles).toFixed(1)} mi`
    : null;
  const href = `/public/restaurants/${menu?.restaurant_id}/menu`;

  const meta = [cuisine ? formatCuisine(cuisine) : null, distance]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <style>{CARD_STYLE_BASE}</style>
      <div
        className="dfc-card"
        role="button"
        tabIndex={0}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onTouchCancel={() => setPressed(false)}
        onClick={(e) => { if (e.target.closest("button")) return; navigate(href); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(href); }}
        style={{
          background: pressed
            ? "#f4f5f7"
            : "linear-gradient(to bottom, #ffffff, #fcfcfc)",
          borderRadius: 10,
          border: "1px solid rgba(18,34,28,0.08)",
          marginBottom: 6,
          boxShadow: pressed ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
          transform: pressed ? "scale(0.98)" : "scale(1)",
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
      <div style={{ padding: "10px 14px" }}>

        {/* Row 1 — name + more */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 8, marginBottom: 4,
        }}>
          <span style={{
            fontSize: 15, fontWeight: 700, color: "#101828",
            lineHeight: 1.15, flex: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {name}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMore?.(menu); }}
            aria-label="More options"
            style={{
              border: "none", background: "transparent",
              fontSize: 15, color: "#c4c9d4", cursor: "pointer",
              padding: "0 2px", flexShrink: 0, lineHeight: 1,
            }}
          >
            ⋮
          </button>
        </div>

        {/* Row 2 — meta + view menu on same line */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 500, color: "#9ca3af",
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {meta || "\u00a0"}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: "#1F4E3D",
            flexShrink: 0, whiteSpace: "nowrap",
          }}>
            View menu →
          </span>
        </div>

      </div>
      </div>
    </>
  );
}
