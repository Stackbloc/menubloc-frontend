import React from "react";
import { CLUSTER_DIRECTORY_GRID_STYLE } from "./ClusterDirectoryCard.jsx";

const MKS_ACCENTS = {
  BEVERAGES: { border: "#7c3aed", bg: "#f5f3ff", emoji: "🍹" },
  BURGERS: { border: "#f59e0b", bg: "#fffbeb", emoji: "🍔" },
  PIZZA: { border: "#ef4444", bg: "#fef2f2", emoji: "🍕" },
  DESSERTS: { border: "#ec4899", bg: "#fdf2f8", emoji: "🍰" },
  SALADS: { border: "#22c55e", bg: "#f0fdf4", emoji: "🥗" },
  SEAFOOD: { border: "#0284c7", bg: "#eff6ff", emoji: "🦞" },
  BREAKFAST: { border: "#f97316", bg: "#fff7ed", emoji: "🥞" },
  APPETIZERS: { border: "#14b8a6", bg: "#f0fdfa", emoji: "🥟" },
};

const DEFAULT_ACCENT = { border: "#94a3b8", bg: "#f8fafc", emoji: "🍽️" };

function clampLines(maxLines) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

export function ClusterMksCategoryBlock({ category, onSelect }) {
  if (!category) return null;

  const accent = MKS_ACCENTS[category.code] || DEFAULT_ACCENT;
  const title = category.label || category.code;
  const subtitle = category.description || "Explore food in this category";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(category)}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        minHeight: 220,
        aspectRatio: "1 / 1",
        padding: "1.1rem",
        borderRadius: 6,
        border: `2px solid ${accent.border}`,
        background: accent.bg,
        boxSizing: "border-box",
        boxShadow: "0 2px 0 rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        color: "inherit",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ display: "grid", gap: "0.5rem", minHeight: 0, minWidth: 0 }}>
        <div style={{ fontSize: "1.35rem", lineHeight: 1 }} aria-hidden="true">
          {accent.emoji}
        </div>
        <div
          style={{
            ...clampLines(2),
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.3,
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </div>
        <div style={{ color: "#6b7280", fontSize: "0.88rem", lineHeight: 1.4, ...clampLines(4) }}>
          {subtitle}
        </div>
      </div>
      <div
        style={{
          marginTop: "0.75rem",
          paddingTop: "0.75rem",
          borderTop: `1px solid ${accent.border}`,
          fontWeight: 700,
          color: accent.border,
          fontSize: "0.92rem",
        }}
      >
        Explore →
      </div>
    </button>
  );
}

export function ClusterMksCategoryGrid({ categories, onSelect }) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  return (
    <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
      {categories.map((category) => (
        <ClusterMksCategoryBlock key={category.code} category={category} onSelect={onSelect} />
      ))}
    </div>
  );
}
