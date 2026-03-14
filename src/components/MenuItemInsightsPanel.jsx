/**
 * ============================================================
 * File: MenuItemInsightsPanel.jsx
 * Path: menubloc-frontend/src/components/MenuItemInsightsPanel.jsx
 * Date: 2026-03-12
 * Purpose:
 *   Render real existing Insights / Nutrition data inside
 *   the menu item card on the menu view page.
 *
 *   Primary data source — chip-driven backend shapes:
 *     item.chips.insights.phrases
 *     item.chips.insights.items
 *     item.chips.nutrition_chip
 *
 *   Fallback support (if chips are absent):
 *     item.signals.nutrition / item.nutrition / item.signal_nutrition
 *
 *   Insights: rendered as a navigable InsightCardDeck.
 *   Nutrition: rendered as a MetricGrid with daily-value context.
 *   Pairings: NOT rendered (removed per menu view spec).
 *   No fake placeholders. No new scoring logic.
 * ============================================================
 */

import InsightCardDeck, { buildInsightCards } from "./InsightCardDeck.jsx";

// ---------------------
// Utility
// ---------------------
function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function labelValue(label, value) {
  if (value === null || value === undefined || value === "") return null;
  return { label, value };
}

function getNutrition(item) {
  const chips = item?.chips || {};

  // Primary: chip-driven shape
  if (chips?.nutrition_chip && typeof chips.nutrition_chip === "object") {
    const n = chips.nutrition_chip;
    return {
      calories_kcal: asNumber(n?.calories_kcal),
      protein_g: asNumber(n?.protein_g),
      fat_g: asNumber(n?.fat_g),
      sodium_mg: asNumber(n?.sodium_mg),
      sugar_g: asNumber(n?.sugar_g),
      calories_pct_women: asNumber(n?.calories_pct_women),
      calories_pct_men: asNumber(n?.calories_pct_men),
      protein_pct_daily: asNumber(n?.protein_pct_daily),
      status: String(n?.status || "").trim().toLowerCase(),
    };
  }

  // Fallback: legacy shapes
  const sigObj =
    item?.signals && !Array.isArray(item.signals) && typeof item.signals === "object"
      ? item.signals
      : null;
  const legacyRaw = sigObj?.nutrition ?? item?.nutrition ?? item?.signal_nutrition;

  if (legacyRaw && typeof legacyRaw === "object") {
    return {
      calories_kcal: asNumber(legacyRaw?.calories_kcal ?? legacyRaw?.calories),
      protein_g: asNumber(legacyRaw?.protein_g ?? legacyRaw?.protein),
      fat_g: asNumber(legacyRaw?.fat_g ?? legacyRaw?.fat),
      sodium_mg: asNumber(legacyRaw?.sodium_mg ?? legacyRaw?.sodium),
      sugar_g: asNumber(legacyRaw?.sugar_g ?? legacyRaw?.sugar),
      calories_pct_women: asNumber(legacyRaw?.calories_pct_women),
      calories_pct_men: asNumber(legacyRaw?.calories_pct_men),
      protein_pct_daily: asNumber(legacyRaw?.protein_pct_daily),
      status: String(legacyRaw?.status || "").trim().toLowerCase(),
    };
  }

  return {
    calories_kcal: null,
    protein_g: null,
    fat_g: null,
    sodium_mg: null,
    sugar_g: null,
    calories_pct_women: null,
    calories_pct_men: null,
    protein_pct_daily: null,
    status: "",
  };
}

// ---------------------
// Sub-components
// ---------------------
function SectionCard({ title, colors, children }) {
  return (
    <div
      style={{
        background: colors.panel2,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.subtext,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function MetricGrid({ rows, colors }) {
  const clean = rows.filter(Boolean);
  if (!clean.length) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
        gap: 8,
      }}
    >
      {clean.map((row) => (
        <div
          key={row.label}
          style={{
            background: colors.chipBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: "8px 10px",
          }}
        >
          <div style={{ fontSize: 11, color: colors.subtext, marginBottom: 3 }}>
            {row.label}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>
            {row.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------
// Default colors (dark theme fallback for standalone use)
// ---------------------
const DEFAULT_COLORS = {
  panel2: "#141418",
  border: "rgba(255,255,255,0.08)",
  text: "rgba(255,255,255,0.92)",
  subtext: "rgba(255,255,255,0.65)",
  chipBg: "rgba(255,255,255,0.06)",
};

// ---------------------
// Main export
// ---------------------
export default function MenuItemInsightsPanel({ item, colors }) {
  const C = colors || DEFAULT_COLORS;

  const nutrition = getNutrition(item);
  const insightCards = buildInsightCards(item);

  const hasInsights = insightCards.length > 0;
  const hasNutrition =
    nutrition.status === "available" ||
    nutrition.calories_kcal !== null ||
    nutrition.protein_g !== null ||
    nutrition.fat_g !== null ||
    nutrition.sodium_mg !== null ||
    nutrition.sugar_g !== null;

  if (!hasInsights && !hasNutrition) return null;

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
      {hasInsights && <InsightCardDeck item={item} colors={C} />}

      {hasNutrition && (
        <SectionCard title="Nutrition" colors={C}>
          <MetricGrid
            colors={C}
            rows={[
              labelValue(
                "Calories",
                nutrition.calories_kcal !== null
                  ? String(Math.round(nutrition.calories_kcal))
                  : null
              ),
              labelValue(
                "Protein",
                nutrition.protein_g !== null
                  ? `${Math.round(nutrition.protein_g)}g`
                  : null
              ),
              labelValue(
                "Fat",
                nutrition.fat_g !== null ? `${Math.round(nutrition.fat_g)}g` : null
              ),
              labelValue(
                "Sugar",
                nutrition.sugar_g !== null ? `${Math.round(nutrition.sugar_g)}g` : null
              ),
              labelValue(
                "Sodium",
                nutrition.sodium_mg !== null
                  ? `${Math.round(nutrition.sodium_mg)}mg`
                  : null
              ),
              labelValue(
                "Protein DV",
                nutrition.protein_pct_daily !== null
                  ? `${Math.round(nutrition.protein_pct_daily)}%`
                  : null
              ),
            ]}
          />

          {(nutrition.calories_pct_women !== null ||
            nutrition.calories_pct_men !== null) && (
            <div
              style={{
                marginTop: 10,
                fontSize: 11.5,
                color: C.subtext,
                lineHeight: 1.5,
              }}
            >
              {nutrition.calories_pct_women !== null
                ? `Approx. ${Math.round(nutrition.calories_pct_women)}% of a 2,000 cal diet. `
                : ""}
              {nutrition.calories_pct_men !== null
                ? `Approx. ${Math.round(nutrition.calories_pct_men)}% of a 2,500 cal diet.`
                : ""}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}