import { useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import InsightCardDeck, { buildInsightCards } from "../InsightCardDeck.jsx";
import NutritionCard from "../NutritionCard.jsx";
import { formatMenuItemName } from "../../utils/formatMenuItemName.js";

function resolveNutritionChip(item) {
  const chip = item?.chips?.nutrition_chip;
  if (chip && typeof chip === "object") return chip;
  return null;
}

function chipHasContent(chip) {
  if (!chip) return false;
  return (
    chip.calories_kcal != null ||
    chip.protein_g     != null ||
    chip.fat_g         != null ||
    chip.sodium_mg     != null ||
    (Array.isArray(chip.allergens) && chip.allergens.length > 0) ||
    String(chip.allergen_alert || "").trim().length > 0
  );
}

export function itemHasInsightsData(item) {
  const chips = item?.chips || {};
  const nutChip = chips.nutrition_chip;
  const insights = chips.insights || {};
  const hasNutrition = chipHasContent(nutChip);
  const hasInsights =
    (Array.isArray(insights.phrases) && insights.phrases.length > 0) ||
    (Array.isArray(insights.items)   && insights.items.length   > 0) ||
    (insights.scores && Object.keys(insights.scores).length > 0);
  return hasNutrition || hasInsights;
}

export default function ItemInsightsSheet({ item, name, price, onClose, onViewDetails }) {
  const { t } = useLanguage();
  useEffect(() => {
    document.body.style.overflow = item ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  if (!item) return null;

  const nutChip    = resolveNutritionChip(item);
  const cards      = buildInsightCards(item);
  const hasInsights  = cards.length > 0;
  const hasNutrition = chipHasContent(nutChip);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", zIndex: 500 }}
      />
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          zIndex: 501,
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.16)",
          animation: "iiSlideUp 210ms cubic-bezier(.22,.68,0,1.1) both",
        }}
      >
        <style>{`@keyframes iiSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

        {/* drag handle */}
        <div style={{ paddingTop: 14, paddingBottom: 6, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e4e7ec" }} />
        </div>

        <div style={{ padding: "4px 20px 48px" }}>

          {/* Item header */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 19, fontWeight: 900, color: "#11211a", lineHeight: 1.2 }}>
                {formatMenuItemName(name)}
              </span>
              {price ? (
                <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>{price}</span>
              ) : null}
            </div>
          </div>

          {/* Insights section */}
          {hasInsights && (
            <div style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 900, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#9ca3af", marginBottom: 8,
              }}>
                Insights
              </div>
              <InsightCardDeck item={item} />
            </div>
          )}

          {/* Nutrition section */}
          {hasNutrition && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 900, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#9ca3af", marginBottom: 8,
              }}>
                Nutrition
              </div>
              <NutritionCard chip={nutChip} />
            </div>
          )}

          {/* No data state */}
          {!hasInsights && !hasNutrition && (
            <div style={{ fontSize: 14, color: "#9ca3af", fontWeight: 600, padding: "8px 0 16px" }}>
              Nutrition data not available for this item yet.
            </div>
          )}

          {/* Full details link */}
          {onViewDetails ? (
            <button
              type="button"
              onClick={onViewDetails}
              style={{
                marginTop: 10,
                display: "inline-block",
                border: "none",
                background: "transparent",
                color: "#2d6a4f",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              View full item details →
            </button>
          ) : null}

        </div>
      </div>
    </>
  );
}
