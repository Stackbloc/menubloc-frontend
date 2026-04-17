import React from "react";
import { Link } from "react-router-dom";

const CARD_THEMES = [
  { gradient: "linear-gradient(145deg, #e879f9 0%, #818cf8 55%, #67e8f9 100%)" },
  { gradient: "linear-gradient(145deg, #fb7185 0%, #f472b6 50%, #c084fc 100%)" },
  { gradient: "linear-gradient(145deg, #10b981 0%, #34d399 45%, #60a5fa 100%)" },
  { gradient: "linear-gradient(145deg, #f59e0b 0%, #fb923c 50%, #f472b6 100%)" },
  { gradient: "linear-gradient(145deg, #38bdf8 0%, #818cf8 50%, #a78bfa 100%)" },
  { gradient: "linear-gradient(145deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)" },
  { gradient: "linear-gradient(145deg, #06b6d4 0%, #10b981 50%, #84cc16 100%)" },
  { gradient: "linear-gradient(145deg, #a855f7 0%, #6366f1 50%, #38bdf8 100%)" },
];

function getEmoji(name, cuisine) {
  const n = (name || "").toLowerCase();
  if (n.includes("pizza") || n.includes("domino") || n.includes("papa john")) return "🍕";
  if (n.includes("taco") || n.includes("burrito") || n.includes("chipotle") || n.includes("mexican")) return "🌮";
  if (n.includes("burger") || n.includes("mcdonald") || n.includes("wendy") || n.includes("five guys")) return "🍔";
  if (n.includes("sushi") || n.includes("ramen") || n.includes("hibachi")) return "🍣";
  if (n.includes("chick-fil") || n.includes("popeye") || n.includes("kfc") || n.includes("chicken")) return "🍗";
  if (n.includes("bbq") || n.includes("barbecue") || n.includes("smokehouse")) return "🔥";
  if (n.includes("breakfast") || n.includes("waffle") || n.includes("ihop") || n.includes("denny")) return "🥞";
  if (n.includes("coffee") || n.includes("starbucks") || n.includes("cafe") || n.includes("café")) return "☕";
  if (n.includes("seafood") || n.includes("fish") || n.includes("lobster")) return "🦞";
  if (n.includes("indian") || n.includes("curry")) return "🍛";
  if (n.includes("chinese") || n.includes("panda")) return "🥡";
  if (n.includes("sub") || n.includes("subway") || n.includes("sandwich")) return "🥪";
  const c = (cuisine || "").toLowerCase();
  if (c.includes("pizza")) return "🍕";
  if (c.includes("mexican")) return "🌮";
  if (c.includes("sushi") || c.includes("japanese")) return "🍣";
  if (c.includes("bbq")) return "🔥";
  return "🍽️";
}

function dietBadges(menu) {
  const badges = [];
  if (menu?.has_vegan_options) badges.push({ label: "Vegan", icon: "🌱" });
  if (menu?.has_gluten_free_options) badges.push({ label: "GF", icon: "🌾" });
  if (menu?.has_diabetic_friendly_options) badges.push({ label: "Diabetic", icon: "💙" });
  if (menu?.has_deals) badges.push({ label: "Deal", icon: "🔥" });
  return badges.slice(0, 3);
}

export default function DiscoveryFeedCard({ menu, index = 0, onMore }) {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const name = menu?.restaurant_name || "Restaurant";
  const emoji = getEmoji(name, menu?.cuisine);
  const distance = menu?.distance_miles != null ? `${Number(menu.distance_miles).toFixed(1)} mi` : null;
  const preview = (menu?.preview_items || []).slice(0, 3).join(", ");
  const badges = dietBadges(menu);
  const href = `/public/restaurants/${menu?.restaurant_id}/menu`;
  const phone = menu?.phone || null;
  const websiteUrl = menu?.website_url || null;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 14,
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      border: "1px solid rgba(0,0,0,0.05)",
    }}>
      <div style={{
        height: 110,
        background: theme.gradient,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.18)",
          pointerEvents: "none",
        }} />
        <span style={{
          fontSize: 48,
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
          position: "relative", zIndex: 1,
        }}>{emoji}</span>
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Link
            to={href}
            style={{
              fontSize: 17, fontWeight: 800, color: "#101828",
              textDecoration: "none", flex: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              paddingRight: 8,
            }}
          >
            {name}
          </Link>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMore && onMore(menu); }}
            aria-label="More options"
            style={{
              border: "none", background: "transparent",
              fontSize: 22, color: "#667085", cursor: "pointer",
              padding: "0 4px", flexShrink: 0, lineHeight: 1,
            }}
          >
            ⋮
          </button>
        </div>

        {distance && (
          <div style={{ fontSize: 13, color: "#667085", fontWeight: 600, marginBottom: 6 }}>
            📍 {distance}
          </div>
        )}

        {preview && (
          <div style={{
            fontSize: 13, color: "#475467", fontWeight: 500,
            marginBottom: 10,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {preview}
          </div>
        )}

        {badges.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {badges.map((b) => (
              <span key={b.label} style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 11, fontWeight: 700, color: "#065f46",
                background: "#d1fae5", borderRadius: 999, padding: "3px 8px",
              }}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Link to={href} style={{
            flex: 1, height: 40, borderRadius: 10,
            background: "#101828", color: "#fff",
            fontSize: 14, fontWeight: 800, textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            View Menu
          </Link>
          {(phone || websiteUrl) && (
            <a
              href={websiteUrl || `tel:${phone}`}
              target={websiteUrl ? "_blank" : undefined}
              rel={websiteUrl ? "noopener noreferrer" : undefined}
              style={{
                flex: 1, height: 40, borderRadius: 10,
                background: "#f2f4f7", color: "#344054",
                fontSize: 14, fontWeight: 800, textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #e4e7ec",
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
