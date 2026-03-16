/**
 * ============================================================
 * File: MenuItemInsightsPanel.jsx
 * Path: menubloc-frontend/src/components/MenuItemInsightsPanel.jsx
 * Date: 2026-03-14
 * Purpose:
 *   Render real existing Insights / Nutrition data inside
 *   the menu item card on the menu view page.
 *
 *   Primary data source — chip-driven backend shapes:
 *     item.chips.insights.phrases
 *     item.chips.insights.items
 *     item.chips.nutrition_chip
 *       (now also includes allergens, allergen_alert, disclosure)
 *
 *   Fallback support (if chips are absent):
 *     item.signals.nutrition / item.nutrition / item.signal_nutrition
 *
 *   Insights: rendered as a navigable InsightCardDeck.
 *   Nutrition: rendered via NutritionCard (includes Allergen Alert).
 *   Pairings: NOT rendered (removed per menu view spec).
 *   No fake placeholders. No new scoring logic.
 *
 *   2026-03-14: NutritionCard replaces inline MetricGrid.
 *   hasNutrition now includes allergen presence so the panel
 *   renders when allergens are inferred even without calorie data.
 * ============================================================
 */

import InsightCardDeck, { buildInsightCards } from "./InsightCardDeck.jsx";
import NutritionCard from "./NutritionCard.jsx";

// ---------------------
// Utility
// ---------------------
function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolve the canonical nutrition_chip object from various possible data shapes.
 * Returns a chip-shaped object or null.
 */
function resolveNutritionChip(item) {
  const chips = item?.chips || {};

  // Primary: chip-driven shape from backend (includes allergen fields)
  if (chips?.nutrition_chip && typeof chips.nutrition_chip === "object") {
    return chips.nutrition_chip;
  }

  // Fallback: legacy shapes
  const sigObj =
    item?.signals && !Array.isArray(item.signals) && typeof item.signals === "object"
      ? item.signals
      : null;
  const legacyRaw = sigObj?.nutrition ?? item?.nutrition ?? item?.signal_nutrition;

  if (legacyRaw && typeof legacyRaw === "object") {
    return {
      status:              String(legacyRaw?.status || "").trim().toLowerCase(),
      calories_kcal:       asNumber(legacyRaw?.calories_kcal ?? legacyRaw?.calories),
      protein_g:           asNumber(legacyRaw?.protein_g    ?? legacyRaw?.protein),
      fat_g:               asNumber(legacyRaw?.fat_g        ?? legacyRaw?.fat),
      sodium_mg:           asNumber(legacyRaw?.sodium_mg    ?? legacyRaw?.sodium),
      sugar_g:             asNumber(legacyRaw?.sugar_g      ?? legacyRaw?.sugar),
      calories_pct_women:  asNumber(legacyRaw?.calories_pct_women),
      calories_pct_men:    asNumber(legacyRaw?.calories_pct_men),
      protein_pct_daily:   asNumber(legacyRaw?.protein_pct_daily),
      allergens:           Array.isArray(legacyRaw?.allergens) ? legacyRaw.allergens : [],
      allergen_alert:      legacyRaw?.allergen_alert  || "",
      confidence:          legacyRaw?.confidence      || "none",
      source:              legacyRaw?.source          || "",
      disclosure:          legacyRaw?.disclosure      || "",
    };
  }

  return null;
}

function chipHasContent(chip) {
  if (!chip) return false;
  return (
    chip.status === "available" ||
    chip.calories_kcal != null ||
    chip.protein_g     != null ||
    chip.fat_g         != null ||
    chip.sodium_mg     != null ||
    chip.sugar_g       != null ||
    (Array.isArray(chip.allergens) && chip.allergens.length > 0) ||
    String(chip.allergen_alert || "").trim().length > 0
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

  const nutChip     = resolveNutritionChip(item);
  const insightCards = buildInsightCards(item);

  const hasInsights  = insightCards.length > 0;
  const hasNutrition = chipHasContent(nutChip);

  if (!hasInsights && !hasNutrition) return null;

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
      {hasInsights && <InsightCardDeck item={item} colors={C} />}
      {hasNutrition && <NutritionCard chip={nutChip} colors={C} />}
    </div>
  );
}
