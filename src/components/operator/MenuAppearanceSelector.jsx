/**
 * Operator Menu Appearance selector — patterned page + readable surface preview.
 * Selection is local until Menu Lab Save Design persists menu_appearance_key.
 */
import {
  MENU_APPEARANCE_KEYS,
  getMenuAppearanceTokens,
  buildMenuAppearanceRootStyle,
  buildMenuAppearanceSurfaceStyle,
} from "../../lib/menuAppearances.js";
import {
  getTypeScopedAppearancePool,
  resolveEffectiveMenuAppearance,
  sortAppearancesForRestaurantType,
} from "../../lib/menuAppearanceRecommendation.js";

const CARD_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
  gap: 12,
  marginTop: 14,
};

function AppearancePreviewCard({ appearanceKey, selected, recommended, related, onSelect }) {
  const tokens = getMenuAppearanceTokens(appearanceKey);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={`menu-appearance-card-${appearanceKey}`}
      style={{
        textAlign: "left",
        padding: 0,
        borderRadius: 10,
        border: selected ? `2px solid ${tokens.accent}` : "1px solid #e4e9f0",
        background: "#fff",
        cursor: "pointer",
        overflow: "hidden",
        fontFamily: "inherit",
        boxShadow: selected ? `0 0 0 1px ${tokens.accent}` : "none",
      }}
    >
      <div
        style={{
          height: 78,
          backgroundColor: tokens.pageBackground,
          backgroundImage: tokens.backgroundPattern,
          backgroundRepeat: "repeat",
          position: "relative",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 5,
            background: tokens.accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 10,
            bottom: 10,
            right: 10,
            height: 36,
            borderRadius: 6,
            background: tokens.menuSurface,
            border: `1px solid ${tokens.border}`,
            boxShadow: tokens.shadow,
          }}
        />
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", lineHeight: 1.25 }}>
          {tokens.name}
        </div>
        {recommended ? (
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: tokens.sectionHeader,
            }}
          >
            Recommended
          </div>
        ) : related ? (
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#78716c",
            }}
          >
            Related
          </div>
        ) : null}
      </div>
    </button>
  );
}

function CompactMenuAppearancePreview({ appearanceKey, restaurantName }) {
  const tokens = getMenuAppearanceTokens(appearanceKey);
  const root = buildMenuAppearanceRootStyle(appearanceKey);
  const surface = buildMenuAppearanceSurfaceStyle(appearanceKey);
  return (
    <div
      key={appearanceKey}
      data-testid="menu-appearance-live-preview"
      data-preview-appearance={appearanceKey}
      style={{
        ...root,
        borderRadius: 12,
        border: `2px solid ${tokens.accent}`,
        padding: 16,
        marginTop: 14,
        marginBottom: 4,
        minHeight: 200,
      }}
    >
      <div
        style={{
          ...surface,
          padding: "14px 16px",
          maxWidth: 340,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: tokens.sectionHeader,
            marginBottom: 6,
          }}
        >
          Menu preview
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: tokens.ink, marginBottom: 8 }}>
          {restaurantName || "Your restaurant"}
        </div>
        <div
          style={{
            height: 1,
            background: tokens.divider,
            margin: "8px 0 10px",
          }}
        />
        <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>Sample dish</div>
        <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4, lineHeight: 1.4 }}>
          Readable menu surface over a subtle page pattern.
        </div>
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: tokens.accent }}>
          $12.00
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: tokens.onPage, fontWeight: 700 }}>
        Showing: {tokens.name}
        <span style={{ fontWeight: 500, opacity: 0.85 }}>
          {" "}
          · page {tokens.pageBackground} · surface {tokens.menuSurface}
        </span>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   menuAppearanceKey: string|null,
 *   category: string,
 *   cuisine: string,
 *   restaurantName: string,
 *   defaultLayoutActive: boolean,
 *   applyMode?: "draft" | "live",
 *   onChange: (key: string|null) => void,
 * }} props
 */
export default function MenuAppearanceSelector({
  menuAppearanceKey,
  category,
  cuisine,
  restaurantName,
  defaultLayoutActive = true,
  applyMode = "draft",
  onChange,
}) {
  const recommended = resolveEffectiveMenuAppearance({
    menu_appearance_key: null,
    category,
    cuisine,
  });
  const typePool = getTypeScopedAppearancePool(category, cuisine);
  const typePoolSet = new Set(typePool);
  const sortedKeys = sortAppearancesForRestaurantType(MENU_APPEARANCE_KEYS, category, cuisine);
  const effective = resolveEffectiveMenuAppearance({
    menu_appearance_key: menuAppearanceKey,
    category,
    cuisine,
  });
  const useRecommended = menuAppearanceKey == null || menuAppearanceKey === "";
  const applyCopy =
    applyMode === "live"
      ? "Selecting an appearance applies it to the public Default menu immediately. Hard-refresh the public menu to see it. Custom Menu Lab layouts keep their own styling."
      : "Customize how your menu is presented to customers. Menuply recommends an appearance based on your restaurant type, but you may choose any available appearance. Preview uses your current selection (Save Design still required to publish).";

  return (
    <div data-testid="menu-appearance-selector">
      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#57534e", lineHeight: 1.45 }}>
        {applyCopy}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280", lineHeight: 1.45 }}>
        Applies only when Default layout is active. Custom Menu Lab designs use their own styling.
      </p>
      {!defaultLayoutActive ? (
        <div
          data-testid="menu-appearance-default-only-notice"
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            fontSize: 12,
            color: "#9a3412",
            lineHeight: 1.45,
          }}
        >
          A custom Menu Lab layout is selected. Menu Appearance will show on the public menu when you
          switch back to Default.
        </div>
      ) : null}

      <button
        type="button"
        data-testid="menu-appearance-use-recommended"
        onClick={() => onChange(null)}
        aria-pressed={useRecommended}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "12px 14px",
          borderRadius: 10,
          border: useRecommended ? "2px solid #166534" : "1px solid #e4e9f0",
          background: useRecommended ? "#f0fdf4" : "#fff",
          cursor: "pointer",
          fontFamily: "inherit",
          marginBottom: 4,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1c1917" }}>
          Use Recommended Appearance
        </div>
        <div style={{ fontSize: 12, color: "#57534e", marginTop: 4, lineHeight: 1.4 }}>
          Automatically matches your menu appearance to your restaurant type.{" "}
          <span style={{ fontWeight: 600 }}>({getMenuAppearanceTokens(recommended).name})</span>
        </div>
      </button>

      <CompactMenuAppearancePreview appearanceKey={effective} restaurantName={restaurantName} />

      <div style={CARD_GRID}>
        {sortedKeys.map((key) => (
          <AppearancePreviewCard
            key={key}
            appearanceKey={key}
            selected={!useRecommended && menuAppearanceKey === key}
            recommended={key === recommended}
            related={key !== recommended && typePoolSet.has(key)}
            onSelect={() => onChange(key)}
          />
        ))}
      </div>
    </div>
  );
}
