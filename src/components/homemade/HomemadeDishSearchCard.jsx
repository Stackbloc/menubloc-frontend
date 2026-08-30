import React from "react";
import { Link } from "react-router-dom";
import { captureEvent } from "../../services/posthog.js";

export default function HomemadeDishSearchCard({ row, onClick }) {
  const href = row.href || `/homemade-dishes/${row.homemade_dish_id || row.id}`;
  return (
    <article
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #e2e8f0",
      }}
      data-testid="homemade-search-card"
      data-result-type="homemade_dish"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#15803d" }}>
          Homemade
        </span>
        <h3 style={{ margin: "4px 0", fontSize: 16, fontWeight: 700 }}>
          <Link
            to={href}
            onClick={() => {
              onClick?.(row);
              captureEvent("homemade_search_result_clicked", {
                homemade_dish_id: row.id || row.homemade_dish_id,
              });
            }}
            style={{ color: "#0f172a", textDecoration: "none" }}
          >
            {row.name}
          </Link>
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          by {row.creator_display_name || "Diner"}
        </p>
        {row.description ? (
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#475569", lineHeight: 1.4 }}>
            {String(row.description).slice(0, 120)}
            {String(row.description).length > 120 ? "…" : ""}
          </p>
        ) : null}
      </div>
    </article>
  );
}
