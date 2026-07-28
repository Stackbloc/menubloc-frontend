/**
 * Operator Restaurant Style selector — preview cards + compact live preview.
 * Selection is local until Profile Setup Save (draft) / Publish.
 */
import {
  PROFILE_STYLE_KEYS,
  getProfileStyleTokens,
  buildProfileStyleRootStyle,
} from "../../lib/restaurantProfileStyles.js";
import { resolveEffectiveProfileStyle } from "../../lib/restaurantProfileStyleRecommendation.js";

const CARD_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 10,
  marginTop: 12,
};

function StylePreviewCard({
  styleKey,
  selected,
  recommended,
  onSelect,
}) {
  const tokens = getProfileStyleTokens(styleKey);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={`profile-style-card-${styleKey}`}
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
          height: 52,
          backgroundColor: tokens.pageBackground,
          backgroundImage: tokens.backgroundPattern,
          backgroundRepeat: "repeat",
          position: "relative",
          borderBottom: `1px solid ${tokens.cardBorder}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            width: 28,
            height: 10,
            borderRadius: 4,
            background: tokens.buttonBackground,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            width: 36,
            height: 22,
            borderRadius: 4,
            background: "#fff",
            border: `1px solid ${tokens.cardBorder}`,
            boxShadow: tokens.cardShadow,
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
              color: tokens.sectionLabel,
            }}
          >
            Recommended
          </div>
        ) : null}
      </div>
    </button>
  );
}

function CompactStylePreview({ styleKey, restaurantName }) {
  const tokens = getProfileStyleTokens(styleKey);
  const root = buildProfileStyleRootStyle(styleKey);
  return (
    <div
      data-testid="profile-style-live-preview"
      style={{
        ...root,
        borderRadius: 12,
        border: "1px solid #e4e9f0",
        padding: 16,
        marginTop: 14,
        marginBottom: 4,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: `1px solid ${tokens.cardBorder}`,
          boxShadow: tokens.cardShadow,
          borderRadius: 10,
          padding: "14px 16px",
          maxWidth: 320,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: tokens.sectionLabel,
            marginBottom: 6,
          }}
        >
          Profile preview
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1c1917", marginBottom: 8 }}>
          {restaurantName || "Your restaurant"}
        </div>
        <div style={{ fontSize: 12, color: "#78716c", marginBottom: 12, lineHeight: 1.4 }}>
          Sample white information card with readable contrast.
        </div>
        <button
          type="button"
          tabIndex={-1}
          style={{
            background: tokens.buttonBackground,
            color: tokens.buttonText,
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "inherit",
            pointerEvents: "none",
          }}
        >
          Sample action
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "#78716c" }}>
        Showing: <strong style={{ color: "#1c1917" }}>{tokens.name}</strong>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   profileStyleKey: string|null,
 *   category: string,
 *   cuisine: string,
 *   restaurantName: string,
 *   onChange: (key: string|null) => void,
 * }} props
 */
export default function RestaurantStyleSelector({
  profileStyleKey,
  category,
  cuisine,
  restaurantName,
  onChange,
}) {
  const recommended = resolveEffectiveProfileStyle({
    profile_style_key: null,
    category,
    cuisine,
  });
  const effective = resolveEffectiveProfileStyle({
    profile_style_key: profileStyleKey,
    category,
    cuisine,
  });
  const useRecommended = profileStyleKey == null || profileStyleKey === "";

  return (
    <div data-testid="restaurant-style-selector">
      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#57534e", lineHeight: 1.45 }}>
        Choose the atmosphere of your Menuply profile. We recommend a style based on your
        restaurant type, but you can select any style.
      </p>

      <button
        type="button"
        data-testid="profile-style-use-recommended"
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
          Use Recommended Style
        </div>
        <div style={{ fontSize: 12, color: "#57534e", marginTop: 4, lineHeight: 1.4 }}>
          Automatically matches your profile style to your restaurant type.
          {" "}
          <span style={{ fontWeight: 600 }}>
            ({getProfileStyleTokens(recommended).name})
          </span>
        </div>
      </button>

      <CompactStylePreview styleKey={effective} restaurantName={restaurantName} />

      <div style={CARD_GRID}>
        {PROFILE_STYLE_KEYS.map((key) => (
          <StylePreviewCard
            key={key}
            styleKey={key}
            selected={!useRecommended && profileStyleKey === key}
            recommended={key === recommended}
            onSelect={() => onChange(key)}
          />
        ))}
      </div>
    </div>
  );
}
