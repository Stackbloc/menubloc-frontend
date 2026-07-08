import React from "react";
import { Link } from "react-router-dom";
import { clusterPath, clusterTypeLabel, clusterVerificationBadge } from "../../lib/clusterUrl.js";

export default function ClusterDirectoryCard({ cluster }) {
  if (!cluster) return null;

  const href = clusterPath({
    state: cluster.state,
    city: cluster.city,
    slug: cluster.slug,
  });
  if (!href) return null;

  const title = cluster.area_name || cluster.name;
  const typeLabel = clusterTypeLabel(cluster.type);
  const count = Number(cluster.restaurant_count) || 0;

  return (
    <Link
      to={href}
      style={{
        display: "grid",
        gap: "0.35rem",
        padding: "1rem",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>{title}</div>
      <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>{typeLabel}</div>
      <div style={{ color: "#374151", fontSize: "0.82rem", fontWeight: 600 }}>
        {clusterVerificationBadge(cluster.verification_level)}
      </div>
      {cluster.city && cluster.state ? (
        <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          {cluster.city}, {cluster.state}
        </div>
      ) : null}
      {cluster.short_description ? (
        <div style={{ color: "#4b5563", fontSize: "0.9rem", lineHeight: 1.45 }}>{cluster.short_description}</div>
      ) : null}
      <div style={{ marginTop: "0.25rem", fontWeight: 600, color: "#111827", fontSize: "0.9rem" }}>
        {count} Restaurant{count === 1 ? "" : "s"}
      </div>
    </Link>
  );
}
