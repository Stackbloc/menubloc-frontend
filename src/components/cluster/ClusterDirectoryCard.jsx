import React from "react";
import { Link } from "react-router-dom";
import { clusterPath, clusterTypeLabel, clusterVerificationBadge } from "../../lib/clusterUrl.js";

export const CLUSTER_DIRECTORY_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 240px))",
  gap: "0.85rem",
  justifyContent: "start",
};

const DEFAULT_ACCENT = { border: "#d1d5db", bg: "#f9fafb" };

const blockShellStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "100%",
  minHeight: 220,
  aspectRatio: "1 / 1",
  padding: "1.1rem",
  borderRadius: 6,
  borderWidth: 2,
  borderStyle: "solid",
  boxSizing: "border-box",
  boxShadow: "0 2px 0 rgba(15, 23, 42, 0.08)",
};

function clampLines(maxLines) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

export default function ClusterDirectoryCard({
  cluster,
  accent = DEFAULT_ACCENT,
  statusLabel = null,
  isPending = false,
}) {
  if (!cluster) return null;

  const href = clusterPath({
    state: cluster.state,
    city: cluster.city,
    slug: cluster.slug,
  });

  const title = cluster.area_name || cluster.name;
  const typeLabel = clusterTypeLabel(cluster.type);
  const count = Number(cluster.restaurant_count) || 0;
  const resolvedAccent = accent || DEFAULT_ACCENT;
  const verification = statusLabel || clusterVerificationBadge(cluster.verification_level);

  const content = (
    <article
      style={{
        ...blockShellStyle,
        borderColor: resolvedAccent.border,
        background: resolvedAccent.bg,
        color: "inherit",
      }}
    >
      <div style={{ display: "grid", gap: "0.55rem", minHeight: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
          <div style={{ ...clampLines(3), fontSize: "1.05rem", fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
            {title}
          </div>
          {statusLabel ? (
            <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#374151", lineHeight: 1.25 }}>
              {statusLabel}
            </span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#4b5563",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {typeLabel}
        </div>
        {cluster.city && cluster.state ? (
          <div style={{ color: "#6b7280", fontSize: "0.88rem", lineHeight: 1.4 }}>
            {cluster.city}, {cluster.state}
          </div>
        ) : null}
        {cluster.short_description ? (
          <div style={{ ...clampLines(3), color: "#4b5563", fontSize: "0.84rem", lineHeight: 1.45 }}>
            {cluster.short_description}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.3rem",
          marginTop: "0.75rem",
          paddingTop: "0.75rem",
          borderTop: `1px solid ${resolvedAccent.border}`,
        }}
      >
        {!statusLabel ? (
          <div
            style={{
              color: "#374151",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {verification}
          </div>
        ) : null}
        <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.92rem" }}>
          {count} Restaurant{count === 1 ? "" : "s"}
        </div>
      </div>
    </article>
  );

  if (isPending || !href) return content;

  return (
    <Link to={href} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
      {content}
    </Link>
  );
}
