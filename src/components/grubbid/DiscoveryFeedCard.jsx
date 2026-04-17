import React from "react";
import { Link } from "react-router-dom";

function formatCuisine(raw) {
  return String(raw || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function getCuisineEmoji(name, cuisine) {
  const n = (name || "").toLowerCase();
  const c = (cuisine || "").toLowerCase();
  if (n.includes("pizza") || c.includes("pizza")) return "🍕";
  if (n.includes("taco") || n.includes("burrito") || n.includes("chipotle") || c.includes("mexican")) return "🌮";
  if (n.includes("burger") || n.includes("mcdonald") || n.includes("wendy") || n.includes("five guys")) return "🍔";
  if (n.includes("sushi") || n.includes("ramen") || c.includes("japanese")) return "🍱";
  if (n.includes("chick-fil") || n.includes("popeye") || n.includes("kfc") || c.includes("chicken")) return "🍗";
  if (n.includes("bbq") || n.includes("barbecue") || c.includes("bbq")) return "🔥";
  if (n.includes("breakfast") || n.includes("waffle") || n.includes("ihop") || n.includes("denny")) return "🥞";
  if (n.includes("coffee") || n.includes("starbucks") || c.includes("cafe")) return "☕";
  if (n.includes("seafood") || c.includes("seafood")) return "🦞";
  if (c.includes("indian")) return "🍛";
  if (c.includes("chinese") || n.includes("panda")) return "🥡";
  if (n.includes("sandwich") || n.includes("subway") || c.includes("sandwich")) return "🥪";
  if (c.includes("italian") || n.includes("pasta")) return "🍝";
  if (c.includes("mediterranean") || c.includes("greek")) return "🫒";
  return "🍽️";
}

const ANCHOR_PALETTE = [
  { bg: "#e8f4fd" },
  { bg: "#edfcf2" },
  { bg: "#fdf3e7" },
  { bg: "#f3eefa" },
  { bg: "#fdecea" },
  { bg: "#e9f7f6" },
  { bg: "#fef9e7" },
  { bg: "#f0f0f5" },
];

export default function DiscoveryFeedCard({ menu, index = 0, onMore }) {
  const name = menu?.restaurant_name || "Restaurant";
  const cuisine = menu?.cuisine || menu?.category || null;
  const preview = (menu?.preview_items || []).slice(0, 3);
  const href = `/public/restaurants/${menu?.restaurant_id}/menu`;

  const anchor = ANCHOR_PALETTE[index % ANCHOR_PALETTE.length];
  const emoji = getCuisineEmoji(name, cuisine);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      marginBottom: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px 16px 14px" }}>

        {/* Header: emoji + name/cuisine + ⋮ */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>

          <div style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            background: anchor.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, marginTop: 1,
          }}>
            {emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={href} style={{
              display: "block",
              fontSize: 17, fontWeight: 800, color: "#101828",
              textDecoration: "none", lineHeight: 1.2, marginBottom: 3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {name}
            </Link>
            {cuisine && (
              <div style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af" }}>
                {formatCuisine(cuisine)}
              </div>
            )}
          </div>

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

        {/* Preview items */}
        {preview.length > 0 && (
          <>
            <div style={{ height: 1, background: "#f2f4f7", marginBottom: 10 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
              {preview.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 3, height: 3, borderRadius: "50%",
                    background: "#d0d5dd", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#344054" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Single CTA */}
        <Link to={href} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: 36, borderRadius: 8,
          background: "#101828", color: "#fff",
          fontSize: 13, fontWeight: 600, textDecoration: "none",
          padding: "0 18px", width: "100%", boxSizing: "border-box",
        }}>
          View Menu
        </Link>

      </div>
    </div>
  );
}
