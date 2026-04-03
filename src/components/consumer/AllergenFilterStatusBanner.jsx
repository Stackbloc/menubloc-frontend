import React from "react";
import { Link } from "react-router-dom";

export default function AllergenFilterStatusBanner({ allergenFilter, compact = false, style }) {
  if (!allergenFilter?.title_text) return null;

  return (
    <div
      style={{
        border: "1px solid rgba(162, 28, 42, 0.24)",
        background: "linear-gradient(180deg, rgba(255, 235, 238, 0.98), rgba(255, 247, 247, 0.98))",
        color: "#8f1222",
        borderRadius: compact ? 14 : 18,
        padding: compact ? "12px 14px" : "14px 16px",
        boxShadow: "0 10px 24px rgba(162, 28, 42, 0.08)",
        ...style,
      }}
    >
      <div style={{ fontSize: compact ? 14 : 16, fontWeight: 900, lineHeight: 1.3 }}>
        {allergenFilter.title_text}
      </div>
      <div style={{ marginTop: 6, fontSize: compact ? 12.5 : 13.5, lineHeight: 1.45, color: "#7d1826" }}>
        {allergenFilter.advisory_text || "Users with severe allergies should confirm directly with the restaurant."}
      </div>
      {allergenFilter.status === "not_set" ? (
        <div style={{ marginTop: 10 }}>
          <Link
            to="/account#allergen-preferences"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 12px",
              borderRadius: 999,
              background: "#a21c2a",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            {allergenFilter.cta_text || "Set Allergen Preferences"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
