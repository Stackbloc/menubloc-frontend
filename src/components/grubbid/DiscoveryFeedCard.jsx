import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CARD_STYLE_BASE = `
  .dfc-card {
    transition: transform 160ms ease, box-shadow 160ms ease;
  }
  .dfc-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.10) !important;
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
          background: pressed ? "#f0f1f0" : "#faf9f6",
          borderRadius: 20,
          border: "1px solid rgba(18,34,28,0.09)",
          marginBottom: 16,
          minHeight: 120,
          boxShadow: pressed
            ? "none"
            : "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          transform: pressed ? "scale(0.985)" : "scale(1)",
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ padding: "18px 20px 14px" }}>

          {/* Row 1 — name + more button */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <span style={{
              fontSize: 17, fontWeight: 700, color: "#101828",
              lineHeight: 1.25, flex: 1, minWidth: 0,
            }}>
              {name}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMore?.(menu); }}
              aria-label="More options"
              style={{
                border: "none", background: "transparent",
                fontSize: 18, color: "#c4c9d4", cursor: "pointer",
                padding: "0 2px", flexShrink: 0, lineHeight: 1,
                marginTop: 1,
              }}
            >
              ⋮
            </button>
          </div>

          {/* Row 2 — cuisine · distance */}
          {meta ? (
            <div style={{
              fontSize: 13, fontWeight: 500, color: "#9ca3af",
              lineHeight: 1.4,
            }}>
              {meta}
            </div>
          ) : null}

        </div>

        {/* Bottom row — view menu CTA */}
        <div style={{
          padding: "0 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: "#1F4E3D",
            letterSpacing: "0.01em",
          }}>
            View menu
          </span>
          <span style={{ fontSize: 13, color: "#1F4E3D", lineHeight: 1 }}>→</span>
        </div>

      </div>
    </>
  );
}
