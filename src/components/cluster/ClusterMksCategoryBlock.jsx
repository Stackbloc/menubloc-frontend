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

export function clusterBoxLook(code) {
  return BOX_LOOKS[code] || DEFAULT_LOOK;
}

/**
 * One box: tinted, outlined in its accent, emoji + name (+ dish count), as the app's TypeBox.
 * `count` overrides the category's own count (nutrition chips on); 0 = dimmed and not tappable.
 * `compact` = the app's small drink-kind boxes (emoji beside the name, no count).
 */
export function ClusterMksCategoryBlock({ category, onSelect, count: countOverride, compact = false, selected, look: lookOverride }) {
  if (!category) return null;

  const look = lookOverride || clusterBoxLook(category.code);
  const title = category.label || category.code;
  const rawCount = countOverride !== undefined ? countOverride : category.item_count;
  const count = Number(rawCount);
  const hasCount = !compact && rawCount != null && Number.isFinite(count);
  const sub = hasCount ? `${count.toLocaleString("en-US")} ${count === 1 ? "dish" : "dishes"}` : null;
  const empty = hasCount && countOverride !== undefined && count === 0;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(category)}
      disabled={empty}
      data-testid={`cluster-type-${category.code}`}
      aria-label={sub ? `${title}, ${sub}` : title}
      // aria-current, not aria-pressed: the cluster themes restyle every aria-pressed button.
      aria-current={selected ? "true" : undefined}
      style={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        alignItems: compact ? "center" : "stretch",
        justifyContent: compact ? "flex-start" : "space-between",
        gap: compact ? 6 : 4,
        minWidth: 0,
        minHeight: compact ? 52 : 100,
        padding: compact ? "6px 8px" : 12,
        borderRadius: compact ? 12 : 16,
        border: `${selected ? 2.5 : compact ? 1.5 : 2}px solid ${look.accent}`,
        background: `${look.accent}${selected ? "33" : "14"}`,
        opacity: empty ? 0.4 : 1,
        boxSizing: "border-box",
        color: "inherit",
        cursor: empty ? "default" : "pointer",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <span style={{ fontSize: compact ? 18 : 26, lineHeight: compact ? "22px" : "32px" }} aria-hidden="true">
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

export function ClusterMksCategoryGrid({ categories, onSelect, counts = null, refreshing = false, testId = "cluster-type-boxes" }) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  return (
    <div
      style={{ ...BOX_GRID_STYLE, opacity: refreshing && counts ? 0.6 : 1, transition: "opacity 120ms ease" }}
      data-testid={testId}
      aria-busy={refreshing || undefined}
    >
      {categories.map((category) => (
        <ClusterMksCategoryBlock
          key={category.code}
          category={category}
          onSelect={onSelect}
          count={counts ? Number(counts[category.code] || 0) : undefined}
        />
      ))}
    </div>
  );
}

/** Drink kinds as small boxes (app 2026-10-26), three across like the food boxes. */
export const CLUSTER_DRINK_BOX_LOOKS = {
  all: { emoji: "🍹", accent: "#7c3aed" },
  cocktails: { emoji: "🍸", accent: "#9333ea" },
  beer: { emoji: "🍺", accent: "#ca8a04" },
  wine: { emoji: "🍷", accent: "#be123c" },
  spirits: { emoji: "🥃", accent: "#92400e" },
  coffee: { emoji: "☕", accent: "#78716c" },
  tea: { emoji: "🍵", accent: "#16a34a" },
  smoothies: { emoji: "🥤", accent: "#f97316" },
  juice: { emoji: "🧃", accent: "#eab308" },
  mocktails: { emoji: "🍹", accent: "#ec4899" },
  non_alcoholic: { emoji: "💧", accent: "#0ea5e9" },
  happy_hour: { emoji: "🕔", accent: "#f59e0b" },
};

export function ClusterDrinkBoxGrid({ chips, selectedId, onSelect }) {
  if (!Array.isArray(chips) || chips.length === 0) return null;
  return (
    <div style={{ ...BOX_GRID_STYLE, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} data-testid="cluster-food-drink-subcategory-chips" role="group" aria-label="Drink subcategories">
      {chips.map((chip) => (
        <ClusterMksCategoryBlock
          key={chip.id}
          compact
          category={{ code: `drink-${chip.id}`, label: chip.label }}
          look={CLUSTER_DRINK_BOX_LOOKS[chip.id] || DEFAULT_LOOK}
          selected={selectedId === chip.id}
          onSelect={() => onSelect(chip.id)}
        />
      ))}
    </div>
  );
}
