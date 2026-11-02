import React from "react";

export const MKS_ACCENTS = {
  BEVERAGES: { border: "#7c3aed", bg: "#f5f3ff", emoji: "🍹" },
  BURGERS: { border: "#f59e0b", bg: "#fffbeb", emoji: "🍔" },
  PIZZA: { border: "#ef4444", bg: "#fef2f2", emoji: "🍕" },
  DESSERTS: { border: "#ec4899", bg: "#fdf2f8", emoji: "🍰" },
  SALADS: { border: "#22c55e", bg: "#f0fdf4", emoji: "🥗" },
  SEAFOOD: { border: "#0284c7", bg: "#eff6ff", emoji: "🦞" },
  BREAKFAST: { border: "#f97316", bg: "#fff7ed", emoji: "🥞" },
  APPETIZERS: { border: "#14b8a6", bg: "#f0fdfa", emoji: "🥟" },
};

function clampLines(maxLines) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

/**
 * Cluster Food boxes look like the app's (menuply-mobile foodTypeBoxes.ts; app wins, Andre
 * 2026-10-30): small tinted tiles, three across on a phone, emoji + name + dish count.
 */
const BOX_LOOKS = {
  SPECIALS: { emoji: "⭐", accent: "#ca8a04" },
  BREAKFAST: { emoji: "🥞", accent: "#f97316" },
  APPETIZERS: { emoji: "🥟", accent: "#14b8a6" },
  SOUPS: { emoji: "🍲", accent: "#b45309" },
  SALADS: { emoji: "🥗", accent: "#22c55e" },
  BURGERS: { emoji: "🍔", accent: "#f59e0b" },
  SANDWICHES: { emoji: "🥪", accent: "#a16207" },
  TACOS: { emoji: "🌮", accent: "#ea580c" },
  PIZZA: { emoji: "🍕", accent: "#ef4444" },
  PASTA: { emoji: "🍝", accent: "#dc2626" },
  BOWLS: { emoji: "🍚", accent: "#0d9488" },
  CHICKEN_ENTREES: { emoji: "🍗", accent: "#d97706" },
  BEEF_STEAK: { emoji: "🥩", accent: "#9f1239" },
  PORK: { emoji: "🍖", accent: "#be185d" },
  SEAFOOD: { emoji: "🦞", accent: "#0284c7" },
  CURRIES: { emoji: "🍛", accent: "#c2410c" },
  VEGETARIAN_ENTREES: { emoji: "🥦", accent: "#16a34a" },
  VEGAN_ENTREES: { emoji: "🌱", accent: "#15803d" },
  COMBOS: { emoji: "🍱", accent: "#4f46e5" },
  SIDES: { emoji: "🍟", accent: "#eab308" },
  KIDS: { emoji: "🧒", accent: "#0ea5e9" },
  DESSERTS: { emoji: "🍰", accent: "#ec4899" },
  BEVERAGES: { emoji: "🍹", accent: "#7c3aed" },
};
const DEFAULT_LOOK = { emoji: "🍽️", accent: "#64748b" };

const BOX_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(6.5rem, 1fr))",
  gap: 10,
  width: "100%",
};

export function ClusterMksCategoryBlock({ category, onSelect }) {
  if (!category) return null;

  const look = BOX_LOOKS[category.code] || DEFAULT_LOOK;
  const title = category.label || category.code;
  const count = Number(category.item_count);
  const sub = Number.isFinite(count) && category.item_count != null ? `${count} ${count === 1 ? "dish" : "dishes"}` : null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(category)}
      data-testid={`cluster-type-${category.code}`}
      aria-label={sub ? `${title}, ${sub}` : title}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 4,
        minWidth: 0,
        minHeight: 100,
        padding: 12,
        borderRadius: 16,
        border: `2px solid ${look.accent}`,
        background: `${look.accent}14`,
        boxSizing: "border-box",
        color: "inherit",
        cursor: "pointer",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <span style={{ fontSize: 26, lineHeight: "32px" }} aria-hidden="true">
        {look.emoji}
      </span>
      <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
        <span
          style={{
            ...clampLines(2),
            fontSize: 14,
            lineHeight: "18px",
            fontWeight: 700,
            color: "#111827",
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </span>
        {sub ? <span style={{ fontSize: 11, lineHeight: "14px", color: "#6b7280" }}>{sub}</span> : null}
      </span>
    </button>
  );
}

export function ClusterMksCategoryGrid({ categories, onSelect }) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  return (
    <div style={BOX_GRID_STYLE} data-testid="cluster-type-boxes">
      {categories.map((category) => (
        <ClusterMksCategoryBlock key={category.code} category={category} onSelect={onSelect} />
      ))}
    </div>
  );
}
