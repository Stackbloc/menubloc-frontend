import React, { useState } from "react";
import { Link } from "react-router-dom";

function formatDistance(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${n.toFixed(1)} mi away`;
}

function cardGradient(index) {
  const gradients = [
    "linear-gradient(135deg, #1a3c32 0%, #3e7254 38%, #c5dfb5 100%)",
    "linear-gradient(135deg, #341d1b 0%, #945a35 40%, #efcfaa 100%)",
    "linear-gradient(135deg, #18263a 0%, #44688e 42%, #d4e4f3 100%)",
    "linear-gradient(135deg, #331929 0%, #8f4366 44%, #efc1c7 100%)",
  ];
  return gradients[index % gradients.length];
}

export default function MenuPreviewCard({ menu, index = 0 }) {
  const [active, setActive] = useState(false);
  const href = `/public/restaurants/${menu?.restaurant_id}/menu`;
  const isVerified = menu?.menu_status === "published";
  const distance = formatDistance(menu?.distance_miles);
  const cuisine = menu?.cuisine
    ? menu.cuisine.charAt(0).toUpperCase() + menu.cuisine.slice(1)
    : null;

  return (
    <Link
      to={href}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={{
        display: "block",
        width: 240,
        minWidth: 240,
        textDecoration: "none",
        color: "#f7f6f1",
        transform: active ? "scale(1.04)" : "scale(1)",
        transition: "transform 160ms ease",
      }}
    >
      <article
        style={{
          position: "relative",
          width: "100%",
          height: 148,
          borderRadius: 16,
          overflow: "hidden",
          background: cardGradient(index),
          boxShadow: active
            ? "0 18px 36px rgba(15,23,42,0.26)"
            : "0 8px 20px rgba(15,23,42,0.16)",
          transition: "box-shadow 160ms ease",
        }}
      >
        {/* Light shimmer overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 80% 12%, rgba(255,255,255,0.22), transparent 28%), radial-gradient(circle at 16% 16%, rgba(255,255,255,0.12), transparent 20%)",
          }}
        />

        {/* Bottom scrim */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(6,9,12,0.86) 0%, rgba(6,9,12,0.48) 48%, rgba(6,9,12,0.0) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 16px",
            textAlign: "center",
          }}
        >
          {/* Restaurant name */}
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -0.3,
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              marginBottom: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {menu?.restaurant_name || "Restaurant"}
          </div>

          {/* Cuisine · Distance */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(247,246,241,0.78)",
              marginBottom: 12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {[cuisine, distance].filter(Boolean).join(" · ") || "Nearby"}
          </div>

          {/* Status badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              background: isVerified
                ? "rgba(255,255,255,0.18)"
                : "rgba(0,0,0,0.28)",
              backdropFilter: "blur(8px)",
              border: isVerified
                ? "1px solid rgba(255,255,255,0.30)"
                : "1px solid rgba(255,255,255,0.10)",
              color: isVerified ? "#fff" : "rgba(247,246,241,0.62)",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: isVerified ? "#6ee7b7" : "rgba(247,246,241,0.4)",
                flexShrink: 0,
              }}
            />
            {isVerified ? "Verified" : "Unverified"}
          </div>
        </div>
      </article>
    </Link>
  );
}
