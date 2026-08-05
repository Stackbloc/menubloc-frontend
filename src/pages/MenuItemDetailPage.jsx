/**
 * ============================================================
 * File: MenuItemDetailPage.jsx
 * Path: menubloc-frontend/src/pages/MenuItemDetailPage.jsx
 * Date: 2026-03-30
 * ============================================================
 *
 * Decision page hierarchy:
 *   1. Hero / item identity
 *   2. Preference ingredient advisory (Foods I Avoid — soft notice, NOT allergens)
 *   3. Verdict block  (NO confidence here)
 *   4. Full nutrition block  (NO confidence here — shows ALL macros)
 *   5. Insights row  (signals + InsightCardDeck, always shown when nutrition exists)
 *   6. Preparation block
 *   7. Compact confidence line  (SINGLE occurrence — here only)
 *   8. Explore Similar Dishes
 *
 * Confidence rule: appears EXACTLY ONCE — CompactConfidence below preparation.
 * Not in VerdictBlock. Not in NutritionCard. Not anywhere else.
 *
 * 2026-04-03 update:
 *   - canonical dish sharing support
 *   - dynamic Open Graph / Twitter card metadata for dish pages
 *   - standalone public landing-page polish for shared dish URLs
 *
 * Header guardrail (2026-05): do not render item name or price in the global
 * sticky header or any fixed top band — StickyPageHeader stays nav-only; item
 * identity and price live only in the hero Surface below.
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import IndulgenceMeter from "../components/IndulgenceMeter.jsx";
import MenuItemDetailActionRail from "../components/menu/MenuItemDetailActionRail.jsx";
import {
  applyDocumentSocialMetadata,
  buildDishShareData,
  buildCanonicalMenuPath,
  appendMenuHighlightQuery,
  highlightMenuLinkExtrasFromSearch,
  getCanonicalMenuItemPath,
} from "../components/share/shareUtils.js";
import ReturnToSourceBar from "../components/navigation/ReturnToSourceBar.jsx";
import {
  hasClusterReturnContext,
  resolveReturnTarget,
  resolveReturnLabel,
  returnContextExtraParams,
} from "../lib/clusterReturnNavigation.js";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { resolveIndulgencePresentation } from "../lib/indulgencePresentation.js";
import { resolveCardVerdict, NOT_AVAILABLE_LABEL } from "../lib/cardVerdict.js";
import { fetchCompareItems } from "../lib/api.js";
import { isSimilarRowCompareEligible } from "../lib/comparePolicy.js";
import { sortSimilarItemsByMatchStrength } from "../lib/searchCardSimilar.js";
import CompareItemsModal from "../components/menu/CompareItemsModal.jsx";
import PreferenceIngredientAdvisory from "../components/menu/PreferenceIngredientAdvisory.jsx";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../utils/getDisplayMenuItemName.js";
import { formatMenuItemName } from "../utils/formatMenuItemName.js";
import { formatMoney, getConsumerDisplayPrice } from "../lib/pricingDisplay.js";
import { useOrderCart } from "../context/OrderCartContext.jsx";
import { sendPageVisit } from "../lib/analyticsPageVisitSend.js";
import { getNormalizedMenuItemId, isValidMenuItemRouteId } from "../lib/menuItemIdentity.js";
import {
  hasAlcoholicBeverageContent,
  isAlcoholicBeverageItem,
  resolveAlcoholicBeverageContent,
  RESPONSIBLE_DRINKING_BULLETS,
  RESPONSIBLE_DRINKING_TITLE,
} from "../lib/alcoholicBeverageDetail.js";

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

/** Offset below `StickyPageHeader` (nav-only row, no title) so sticky hero clears the bar. */
const STICKY_ITEM_HERO_TOP_PX = 72;

// ── Utility ─────────────────────────────────────────────────

function moneyFromFloat(price) {
  if (price == null || Number.isNaN(Number(price)) || Number(price) <= 0) return null;
  return Number(price).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function pickFirstDefined(...vals) {
  for (const value of vals) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function toSlug(str) {
  if (!str) return null;
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hasRenderableImage(url) {
  const value = String(url || "").trim();
  if (!value) return false;
  return /^(https?:)?\/\//i.test(value) || value.startsWith("/");
}

function useIsMobile(breakpoint = 840) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

function resolveNutritionChip(raw) {
  if (raw?.chips?.nutrition_chip && typeof raw.chips.nutrition_chip === "object") {
    return raw.chips.nutrition_chip;
  }
  return raw?.nutrition || raw?.signal_nutrition || raw?.signals?.nutrition || null;
}

function normalizeResultItem(raw) {
  const exactPriceMinor = getConsumerDisplayPrice(raw) ?? pickFirstDefined(
    raw?.exact_price_minor, raw?.price_minor, raw?.priceMinor,
    raw?.price_minor_units, raw?.price_cents, null
  );
  const exactPrice = pickFirstDefined(
    raw?.exact_price, raw?.price, raw?.price_float, raw?.priceFloat, null
  );
  const restaurantName =
    raw?.restaurant_name || raw?.restaurant?.name ||
    raw?.restaurant?.restaurant_name || raw?.restaurantName || raw?.restaurant;
  const restaurantId = raw?.restaurant_id || raw?.restaurant?.id || raw?.restaurantId || null;
  const restaurantLogoUrl =
    raw?.restaurant_logo_url || raw?.restaurant?.logo_url ||
    raw?.restaurant?.logoUrl || raw?.logo_url || null;
  const restaurantSubscription = raw?.restaurant?.subscription || raw?.subscription || null;
  const itemPhotoUrl =
    raw?.item_photo_url || raw?.itemPhotoUrl || raw?.photo_url || raw?.image_url || null;

  return {
    menu_item_id: getNormalizedMenuItemId(raw),
    name: raw?.name || raw?.item_name || raw?.title || "Untitled Item",
    description: raw?.description || raw?.notes || raw?.snippet || "",
    translations: raw?.translations || null,
    priceMinor: exactPriceMinor,
    price: exactPrice,
    itemPhotoUrl,
    detailSystem: raw?.detail_system || null,
    nutritionChip: resolveNutritionChip(raw),
    insightScores: raw?.chips?.insights?.scores || null,
    chips: raw?.chips || null,
    ingredients: Array.isArray(raw?.ingredients) ? raw.ingredients : [],
    badges: {
      vegan: Boolean(raw?.badges?.vegan) || Boolean(raw?.badges?.is_vegan) || Boolean(raw?.is_vegan) || Boolean(raw?.vegan),
      glutenFree: Boolean(raw?.badges?.gluten_free) || Boolean(raw?.badges?.glutenFree) || Boolean(raw?.gluten_free) || Boolean(raw?.is_gluten_free),
      deal: Boolean(raw?.badges?.deal) || Boolean(raw?.badges?.deals) || Boolean(raw?.deal) || Boolean(raw?.is_deal),
    },
    restaurant: {
      id: restaurantId,
      name: restaurantName || "Unknown Restaurant",
      slug: raw?.restaurant_slug || raw?.restaurant?.slug || raw?.slug || null,
      city: raw?.restaurant?.city || raw?.city || null,
      cuisine: raw?.restaurant?.cuisine || raw?.cuisine || null,
      logoUrl: restaurantLogoUrl,
      subscription: restaurantSubscription,
      isPro:
        raw?.restaurant?.is_pro === true || raw?.restaurant?.isPro === true ||
        restaurantSubscription?.is_pro === true || restaurantSubscription?.isPro === true || false,
    },
  };
}

function formatMacro(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}${suffix}`;
}

function formatPerOzValue(value, suffix = "") {
  if (value == null || Number.isNaN(Number(value))) return null;
  const rounded = Number(value) >= 100 ? Math.round(Number(value)) : Number(value).toFixed(1).replace(/\.0$/, "");
  return `${rounded}${suffix}`;
}

function scaleMacroValue(value, multiplier) {
  if (value == null || Number.isNaN(Number(value))) return value;
  return Number(value) * multiplier;
}

function roundPortionOz(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.max(1, Math.round(numeric));
}

function buildPortionEstimate(calories, caloriesPerOz) {
  const totalCalories = Number(calories);
  const perOzCalories = Number(caloriesPerOz);
  if (!Number.isFinite(totalCalories) || totalCalories <= 0) return null;
  if (!Number.isFinite(perOzCalories) || perOzCalories <= 0) return null;

  const estimatedOz = totalCalories / perOzCalories;
  const options = [
    { key: "small", label: "Small", multiplier: 0.75, ounces: roundPortionOz(estimatedOz * 0.75) },
    { key: "medium", label: "Medium", multiplier: 1, ounces: roundPortionOz(estimatedOz) },
    { key: "large", label: "Large", multiplier: 1.5, ounces: roundPortionOz(estimatedOz * 1.5) },
  ];

  if (options.some((option) => option.ounces == null)) return null;
  return options;
}

function hasAnyNutritionData(detailSystem) {
  const nutrition = detailSystem?.nutrition;
  if (!nutrition) return false;
  return [
    nutrition.calories,
    nutrition.saturated_fat_g,
    nutrition.protein_g,
    nutrition.carbs_g,
    nutrition.fat_g,
    nutrition.fiber_g,
    nutrition.sugar_g,
    nutrition.sodium_mg,
  ].some((value) => value !== null && value !== undefined);
}

const DAILY_CALORIES = 2000;
const DAILY_FAT_G = 78;
const DAILY_SAT_FAT_G = 20;
const DAILY_CARBS_G = 275;
const DAILY_FIBER_G = 28;
const DAILY_SUGAR_G = 50;
const DAILY_PROTEIN_G = 50;
const DAILY_SODIUM_MG = 2300;

function wholeDv(value, dailyValue, isReliable) {
  if (!isReliable || value == null || dailyValue == null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.round((numeric / dailyValue) * 100);
}

function detailCategory(detailSystem) {
  return detailSystem?.presentation_model?.item_category || detailSystem?.item_category || "entree";
}

function confidenceLevel(detailSystem) {
  return String(detailSystem?.confidence?.level || "none").trim().toLowerCase() || "none";
}

// ── Design Tokens ────────────────────────────────────────────

// ⛔ DESIGN LOCK — 2026-06-09: These colors and gradients are locked by user approval.
// DO NOT change colors, layout, or VerdictBlock structure without explicit user approval.
const VERDICT_THEMES = {
  "Compatible with a health-conscious diet":      { bg: "linear-gradient(135deg, rgba(30,86,63,0.95), rgba(45,106,79,0.88))",    label: "rgba(196,244,214,0.97)", eye: "rgba(196,244,214,0.62)" },
  // Client-side computed labels from cardVerdict.js (sentence-case)
  "Suitable for frequent consumption":            { bg: "linear-gradient(135deg, rgba(20,56,110,0.94), rgba(33,72,138,0.88))",   label: "rgba(184,216,255,0.97)", eye: "rgba(184,216,255,0.62)" },
  "Suitable for frequent/regular consumption":    { bg: "linear-gradient(135deg, rgba(20,56,110,0.94), rgba(33,72,138,0.88))",   label: "rgba(184,216,255,0.97)", eye: "rgba(184,216,255,0.62)" },
  // Client-side computed labels from cardVerdict.js (sentence-case)
  "Suitable for frequent consumption":            { bg: "linear-gradient(135deg, rgba(20,56,110,0.94), rgba(33,72,138,0.88))",   label: "rgba(184,216,255,0.97)", eye: "rgba(184,216,255,0.62)" },
  "Solid nutritional profile — one consideration":{ bg: "linear-gradient(135deg, rgba(18,84,100,0.94), rgba(24,112,132,0.88))",  label: "rgba(182,240,252,0.97)", eye: "rgba(182,240,252,0.62)" },
  "Best in moderation":                           { bg: "linear-gradient(135deg, rgba(118,62,8,0.95), rgba(156,90,12,0.89))",    label: "rgba(255,220,155,0.97)", eye: "rgba(255,220,155,0.62)" },
  "Best suited for occasional consumption":       { bg: "linear-gradient(135deg, rgba(106,20,10,0.96), rgba(162,40,20,0.91))",  label: "rgba(255,192,174,0.97)", eye: "rgba(255,192,174,0.62)" },
  "Suitable for occasional consumption":          { bg: "linear-gradient(135deg, rgba(106,20,10,0.96), rgba(162,40,20,0.91))",  label: "rgba(255,192,174,0.97)", eye: "rgba(255,192,174,0.62)" },
  "Indulgent":                                    { bg: "linear-gradient(135deg, rgba(124,45,18,0.95), rgba(180,72,22,0.89))",  label: "rgba(254,215,170,0.97)", eye: "rgba(254,215,170,0.62)" },
};

const SIGNAL_CHIP_COLORS = {
  excellent: { bg: "rgba(34,197,94,0.12)",  color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" },
  good:      { bg: "rgba(34,197,94,0.08)",  color: "#86EFAC", border: "1px solid rgba(34,197,94,0.2)" },
  moderate:  { bg: "rgba(234,179,8,0.12)",  color: "#FBBF24", border: "1px solid rgba(234,179,8,0.2)" },
  high:      { bg: "rgba(239,68,68,0.12)",  color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" },
  very_high: { bg: "rgba(185,28,28,0.15)",  color: "#FCA5A5", border: "1px solid rgba(185,28,28,0.25)" },
  low:       { bg: "rgba(107,114,128,0.12)", color: "#9CA3AF", border: "1px solid rgba(107,114,128,0.2)" },
  default:   { bg: "var(--gb-color-surface)", color: "var(--gb-color-ink-soft)", border: "1px solid var(--gb-color-border)" },
};

// ── Layout Primitives ────────────────────────────────────────

function PageShell({ children, isMobile, stickyTitle }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)" }}>
      <StickyPageHeader title={stickyTitle} />
      <div style={{
        maxWidth: 720, margin: "0 auto",
        padding: isMobile ? "16px 14px 80px" : "24px 20px 80px",
        boxSizing: "border-box",
        fontFamily: 'var(--font-ui, "Avenir Next", "Segoe UI", sans-serif)',
      }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

const Surface = React.forwardRef(function Surface({ children, style }, ref) {
  return (
    <section ref={ref} style={{ background: "var(--gb-color-surface-strong)", border: "1px solid var(--gb-color-border)", borderRadius: 24, boxShadow: "var(--gb-shadow-card)", ...style }}>
      {children}
    </section>
  );
});

function Eyebrow({ children, color = "#6B7280" }) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.2, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, color, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function BadgePill({ children, tone = "default" }) {
  const tones = {
    default:  { background: "var(--gb-color-surface)", color: "var(--gb-color-ink-soft)", border: "1px solid var(--gb-color-border)" },
    positive: { background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" },
    caution:  { background: "rgba(234,179,8,0.12)",  color: "#FBBF24", border: "1px solid rgba(234,179,8,0.2)" },
    accent:   { background: "rgba(34,197,94,0.10)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" },
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 12px", fontSize: 12, lineHeight: 1, fontWeight: 800, ...tones[tone] }}>
      {children}
    </span>
  );
}

function SectionCard({ title, eyebrow, children, style }) {
  return (
    <Surface style={{ padding: 22, ...style }}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#FFFFFF" }}>{title}</h2>
      <div style={{ marginTop: 16 }}>{children}</div>
    </Surface>
  );
}

// ── Hero sub-components ──────────────────────────────────────

function getVerdictTheme(label) {
  return VERDICT_THEMES[label] || VERDICT_THEMES["Best in moderation"];
}

function toShortVerdictBasis(reason) {
  const raw = String(reason || "").trim();
  if (!raw) return null;

  const simplified = raw
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*\b\d+(?:\.\d+)?\s*(?:mg|g|kcal|calories?)\b/gi, "")
    .split(/\b(?:which|so|and it|making it|that)\b/i)[0]
    .trim()
    .replace(/[.,;:!?-]+$/g, "")
    .replace(/\s+/g, " ");

  if (!simplified) return null;

  return simplified.charAt(0).toLowerCase() + simplified.slice(1);
}

// Returns a driver-based explanation sentence for the verdict label.
// Uses backend reason if it is substantive; otherwise derives from actual nutrition values.
function buildVerdictExplanation(label, verdict, nutrition) {
  const backendReason = String(verdict?.reason || "").trim();
  const genericPhrases = ["profile is decent", "not light enough", "overall profile", "recommend daily"];
  const isGeneric = !backendReason || genericPhrases.some((p) => backendReason.toLowerCase().includes(p));
  if (!isGeneric && backendReason.length > 20) return backendReason;

  const cal = nutrition?.calories_kcal ?? nutrition?.calories;
  const fat = nutrition?.fat_g;
  const sodium = nutrition?.sodium_mg;
  const protein = nutrition?.protein_g;

  const lbl = String(label || "").toLowerCase();
  if (lbl.includes("frequent") || lbl.includes("daily") || lbl.includes("regular")) {
    if (cal != null && cal <= 400) return "Lower calorie density and balanced nutrition support frequent consumption.";
    if (protein != null && protein >= 25) return "High protein and controlled macronutrient levels support frequent consumption.";
    return "Calorie density and macronutrient balance are within range for frequent consumption.";
  }
  if (lbl.includes("occasional") || lbl.includes("moderation")) {
    const drivers = [];
    if (cal != null && cal >= 600) drivers.push("calorie density");
    if (fat != null && fat >= 20) drivers.push("fat content");
    if (sodium != null && sodium >= 700) drivers.push("sodium level");
    if (drivers.length) {
      const joined = drivers.join(" and ");
      return `Elevated ${joined} increases overall energy density, making this better suited for occasional rather than daily consumption.`;
    }
    return "Nutrient profile exceeds the daily-friendly threshold for one or more key macros.";
  }
  if (lbl.includes("indulgent")) {
    const drivers = [];
    if (cal != null && cal >= 700) drivers.push(`high calorie density (${Math.round(cal)} kcal)`);
    if (fat != null && fat >= 35) drivers.push(`elevated fat (${Math.round(fat)}g)`);
    if (sodium != null && sodium >= 1200) drivers.push(`high sodium (${Math.round(sodium)}mg)`);
    if (drivers.length) return `${drivers[0].charAt(0).toUpperCase() + drivers[0].slice(1)} makes this best as an occasional choice.`;
    return "High calorie density and elevated fat or sodium levels make this an occasional choice.";
  }
  return "";
}

// Returns an array of driver strings to display under "Why this verdict".
// Uses backend reasons when available; falls back to deriving from nutrition values.
function buildVerdictDrivers(verdict, nutrition) {
  if (Array.isArray(verdict?.reasons) && verdict.reasons.length > 0) {
    return verdict.reasons.slice(0, 4);
  }
  const drivers = [];
  const cal = nutrition?.calories_kcal ?? nutrition?.calories;
  const fat = nutrition?.fat_g;
  const satFat = nutrition?.saturated_fat_g;
  const protein = nutrition?.protein_g;
  const sodium = nutrition?.sodium_mg;

  if (cal != null) drivers.push(`Calories: ${Math.round(cal)}`);
  if (fat != null) {
    drivers.push(fat >= 20
      ? `Fat: ${Math.round(fat)}g — above daily-friendly threshold`
      : `Fat: ${Math.round(fat)}g`);
  }
  if (satFat != null && satFat >= 6) drivers.push(`Saturated fat: ${Math.round(satFat)}g — elevated`);
  if (sodium != null) {
    drivers.push(sodium >= 700
      ? `Sodium: ${Math.round(sodium)}mg — elevated`
      : `Sodium: ${Math.round(sodium)}mg`);
  }
  if (protein != null && protein >= 20) drivers.push(`Protein: ${Math.round(protein)}g`);
  return drivers.slice(0, 4);
}

// Returns label + brief explanation for sticky verdict surfaces (hero + sticky rail).
function resolveVerdictPresentation(detailSystem) {
  const verdict = detailSystem?.verdict || {};
  const nutrition = detailSystem?.nutrition || null;
  const normalizedNutrition = nutrition
    ? { ...nutrition, calories_kcal: nutrition.calories_kcal ?? nutrition.calories }
    : null;
  const fallbackVerdict = resolveCardVerdict({
    detailSystem: { ...detailSystem, nutrition: normalizedNutrition },
  });
  const label = verdict.label || (fallbackVerdict !== NOT_AVAILABLE_LABEL ? fallbackVerdict : null);
  const reason = String(verdict.reason || "").trim();
  const basis = Array.isArray(verdict.reasons)
    ? [...new Set(verdict.reasons.map(toShortVerdictBasis).filter(Boolean))].slice(0, 2)
    : [];
  const explanation =
    reason ||
    basis[0] ||
    (label ? buildVerdictExplanation(label, verdict, normalizedNutrition) : "");
  return { label, explanation };
}

function VerdictBlock({ detailSystem, isMobile, t, compact = false }) {
  const { label, explanation } = resolveVerdictPresentation(detailSystem);

  if (!label) return null;

  const theme = getVerdictTheme(label);

  if (compact) {
    return (
      <div style={{ marginTop: 2, padding: 0, background: "transparent", color: "#f8f6ef", border: "none" }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 4 }}>
          {t("menuItemDetail.verdict", "Verdict")}
        </div>
        <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", color: theme.label }}>
          {label}
        </div>
        {explanation ? (
          <div style={{ marginTop: 4, color: "#D1D5DB", fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>
            {explanation}
          </div>
        ) : null}
      </div>
    );
  }

  const verdict = detailSystem?.verdict || {};
  const nutrition = detailSystem?.nutrition || null;
  const normalizedNutrition = nutrition
    ? { ...nutrition, calories_kcal: nutrition.calories_kcal ?? nutrition.calories }
    : null;
  const drivers = buildVerdictDrivers(verdict, normalizedNutrition);

  return (
    <Surface style={{ marginTop: 20, padding: isMobile ? 22 : 28, background: theme.bg, color: "#f8f6ef" }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.eye, marginBottom: 10 }}>
        {t("menuItemDetail.verdict", "Verdict")}
      </div>
      <div style={{ fontSize: isMobile ? 34 : 46, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: theme.label }}>
        {label}
      </div>
      {explanation ? (
        <div style={{ marginTop: 12, color: "#fff8ee", fontSize: isMobile ? 13 : 14, fontWeight: 700, lineHeight: 1.5 }}>
          {explanation}
        </div>
      ) : null}
      {drivers.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.eye, marginBottom: 8 }}>
            Why this verdict
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 16px", listStyle: "disc" }}>
            {drivers.map((d, i) => (
              <li key={i} style={{ color: "#fff8ee", fontSize: 12, fontWeight: 600, lineHeight: 1.5, marginBottom: 2 }}>
                {d}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Surface>
  );
}

function IndulgenceInline({ presentation }) {
  if (!presentation) return null;
  if (!presentation?.indulgence?.score && presentation?.indulgence?.score !== 0) {
    return (
      <div style={{ marginTop: 14, display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(234,179,8,0.12)", color: "#FBBF24", fontWeight: 900, fontSize: 13 }}>
        Limited data
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18, maxWidth: 520 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#FBBF24", marginBottom: 8 }}>
        Indulgent
      </div>
      <div style={{ borderRadius: 18, padding: "14px 16px", background: "var(--gb-color-warning-bg)", border: "1px solid var(--gb-color-warning-border)" }}>
        <IndulgenceMeter indulgence={presentation.indulgence} />
      </div>
    </div>
  );
}

function BreadScoreInline({ detailSystem }) {
  const breadScore = detailSystem?.bread_score || null;
  if (!breadScore) return null;
  if (breadScore.score == null) {
    return (
      <div style={{ marginTop: 14, display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(234,179,8,0.12)", color: "#FBBF24", fontWeight: 900, fontSize: 13 }}>
        Limited data
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18, maxWidth: 520 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#FBBF24", marginBottom: 8 }}>
        Verdict
      </div>
      <div style={{ borderRadius: 18, padding: "14px 16px", background: "var(--gb-color-warning-bg)", border: "1px solid var(--gb-color-warning-border)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FBBF24", letterSpacing: "-0.03em" }}>
            Bread Score
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#FBBF24" }}>
            {breadScore.score}
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 800, color: "#FDE68A" }}>
          {breadScore.band}
        </div>
        {breadScore.explanation ? (
          <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, color: "#FBBF24", fontWeight: 700 }}>
            {breadScore.explanation}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NutritionCard({ detailSystem, t }) {
  const nutrition = detailSystem?.nutrition || {};
  const category = detailCategory(detailSystem);
  const reliability = confidenceLevel(detailSystem);
  const isReliable = reliability !== "low" && reliability !== "none";
  const isDrink = category === "beverage";
  const isDessertOrBread = category === "dessert" || category === "pure_bread";
  const isEntree = !isDrink && !isDessertOrBread;
  const perOz = nutrition?.per_oz || null;
  const portionOptions = buildPortionEstimate(nutrition.calories, perOz?.calories_kcal);
  const [portionMenuOpen, setPortionMenuOpen] = useState(false);
  const [selectedPortionKey, setSelectedPortionKey] = useState("medium");
  const selectedPortion = portionOptions?.find((option) => option.key === selectedPortionKey) || portionOptions?.[1] || null;
  const portionScale = selectedPortion?.multiplier || 1;
  const scaledNutrition = {
    calories: scaleMacroValue(nutrition.calories, portionScale),
    fat_g: scaleMacroValue(nutrition.fat_g, portionScale),
    saturated_fat_g: scaleMacroValue(nutrition.saturated_fat_g, portionScale),
    carbs_g: scaleMacroValue(nutrition.carbs_g, portionScale),
    fiber_g: scaleMacroValue(nutrition.fiber_g, portionScale),
    sugar_g: scaleMacroValue(nutrition.sugar_g, portionScale),
    protein_g: scaleMacroValue(nutrition.protein_g, portionScale),
    sodium_mg: scaleMacroValue(nutrition.sodium_mg, portionScale),
  };
  const pairs = isEntree
    ? [
        { label: "Calories", value: formatMacro(scaledNutrition.calories), dv: wholeDv(scaledNutrition.calories, DAILY_CALORIES, isReliable) },
        { label: "Fat", value: formatMacro(scaledNutrition.fat_g, "g"), dv: wholeDv(scaledNutrition.fat_g, DAILY_FAT_G, isReliable) },
        { label: "Saturated Fat", value: formatMacro(scaledNutrition.saturated_fat_g, "g"), dv: wholeDv(scaledNutrition.saturated_fat_g, DAILY_SAT_FAT_G, isReliable) },
        { label: "Carbs", value: formatMacro(scaledNutrition.carbs_g, "g"), dv: wholeDv(scaledNutrition.carbs_g, DAILY_CARBS_G, isReliable) },
        { label: "Fiber", value: formatMacro(scaledNutrition.fiber_g, "g"), dv: wholeDv(scaledNutrition.fiber_g, DAILY_FIBER_G, isReliable) },
        { label: "Sugar", value: formatMacro(scaledNutrition.sugar_g, "g"), dv: null },
        { label: "Protein", value: formatMacro(scaledNutrition.protein_g, "g"), dv: wholeDv(scaledNutrition.protein_g, DAILY_PROTEIN_G, isReliable) },
        { label: "Sodium", value: formatMacro(scaledNutrition.sodium_mg, "mg"), dv: wholeDv(scaledNutrition.sodium_mg, DAILY_SODIUM_MG, isReliable) },
      ]
    : [
        { label: "Calories", value: formatMacro(scaledNutrition.calories), dv: null },
        { label: "Carbs", value: formatMacro(scaledNutrition.carbs_g, "g"), dv: null },
        { label: "Sugar", value: formatMacro(scaledNutrition.sugar_g, "g"), dv: null },
      ].filter((entry) => entry.value !== "—");
  const perOzRows = perOz
    ? [
        { label: "Calories / oz", value: formatPerOzValue(perOz.calories_kcal) || "—" },
        { label: "Protein / oz", value: formatPerOzValue(perOz.protein_g, "g") || "—" },
        { label: "Carbs / oz", value: formatPerOzValue(perOz.carbs_g, "g") || "—" },
        { label: "Fat / oz", value: formatPerOzValue(perOz.fat_g, "g") || "—" },
      ]
    : [];

  return (
    <SectionCard title={t("menuItemDetail.nutritionTitle", "Nutrition")} eyebrow={t("menuItemDetail.decisionData", "Decision Data")}>
      {portionOptions && selectedPortion ? (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setPortionMenuOpen((open) => !open)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderRadius: 16,
              border: "1px solid var(--gb-color-border)",
              background: "var(--gb-color-surface-strong)",
              padding: "12px 14px",
              cursor: "pointer",
              color: "var(--gb-color-ink)",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 900 }}>
              {`Portion Size: ${selectedPortion.label} (~${selectedPortion.ounces} oz)`}
            </span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#9CA3AF" }}>
              {portionMenuOpen ? "Hide" : "Change"}
            </span>
          </button>
          {portionMenuOpen ? (
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {portionOptions.map((option) => {
                const active = option.key === selectedPortion.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedPortionKey(option.key)}
                    style={{
                      borderRadius: 14,
                      border: active ? "1.5px solid var(--gb-color-accent)" : "1px solid var(--gb-color-border)",
                      background: active ? "rgba(45,106,79,0.12)" : "var(--gb-color-surface-strong)",
                      padding: "12px 10px",
                      cursor: "pointer",
                      color: "var(--gb-color-ink)",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 900 }}>{option.label}</div>
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: "#9CA3AF" }}>
                      {`(~${option.ounces} oz)`}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {pairs.map((entry) => (
          <BadgePill key={entry.label}>
            <span style={{ color: "#9CA3AF", fontWeight: 600, marginRight: 6 }}>{entry.label}</span>
            <span>{entry.value}{entry.dv != null ? ` · ${entry.dv}% DV` : ""}</span>
          </BadgePill>
        ))}
      </div>
      {!isDrink && !isDessertOrBread && perOzRows.length && isReliable ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 10 }}>
            Per Ounce
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {perOzRows.map((row) => (
              <BadgePill key={row.label}>
                <span style={{ color: "#9CA3AF", fontWeight: 600, marginRight: 6 }}>{row.label}</span>
                <span>{row.value}</span>
              </BadgePill>
            ))}
          </div>
        </div>
      ) : null}
      <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5, color: "#9CA3AF", fontWeight: 700 }}>
        {reliability === "high" ? "HIGH" : reliability === "medium" ? "MEDIUM" : reliability === "low" ? "LOW" : "NONE"}
        {reliability === "low" || reliability === "none" ? " · Nutrition estimate — confirm with restaurant" : ""}
      </div>
    </SectionCard>
  );
}

function insightTone(kind, level) {
  if (kind === "protein_strength" || kind === "lasting_energy" || kind === "fiber_signal") {
    if (level === "High") return SIGNAL_CHIP_COLORS.excellent;
    if (level === "Low") return SIGNAL_CHIP_COLORS.high;
    return SIGNAL_CHIP_COLORS.moderate;
  }

  if (level === "High") return SIGNAL_CHIP_COLORS.high;
  if (level === "Low") return SIGNAL_CHIP_COLORS.excellent;
  return SIGNAL_CHIP_COLORS.moderate;
}

function insightFillPercent(level) {
  if (level === "High") return "92%";
  if (level === "Low") return "30%";
  return "60%";
}

function InsightsCard({ detailSystem, t }) {
  const insights = detailSystem?.insights;
  if (!insights) return null;

  const items = [
    { key: "protein_strength", label: "Protein Strength", value: insights.protein_strength },
    { key: "glycemic_impact", label: "Glycemic Impact", value: insights.glycemic_impact },
    { key: "sodium_signal", label: "Sodium Signal", value: insights.sodium_signal },
    { key: "lasting_energy", label: "Lasting Energy", value: insights.lasting_energy },
    { key: "fiber_signal", label: "Fiber Signal", value: insights.fiber_signal },
  ];

  return (
    <SectionCard
      title={t("menuItemDetail.insights", "Insights")}
      eyebrow={t("menuItemDetail.insights", "Insights")}
      style={{ padding: 16, background: "var(--gb-color-surface-strong)", border: "1px solid var(--gb-color-border)", boxShadow: "var(--gb-shadow-soft)" }}
    >
      <div style={{ display: "grid", gap: 8, padding: "2px 0" }}>
        {items.map((item) => {
          const tone = insightTone(item.key, item.value);
          const meterFill = insightFillPercent(item.value);
          return (
            <div key={item.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 140px 72px", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", padding: "6px 8px", borderRadius: 10 }}>
              <div style={{ minWidth: 0, fontSize: 13.5, fontWeight: 800, color: "#FFFFFF", textAlign: "left" }}>
                {item.label}
              </div>
              <div style={{ width: 140, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 140, height: 8, borderRadius: 999, background: "rgba(18,34,28,0.1)", overflow: "hidden" }}>
                  <div style={{ width: meterFill, height: "100%", borderRadius: 999, background: tone.color }} />
                </div>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: tone.color, textAlign: "right" }}>
                {item.value || "Moderate"}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function DessertInterpretationCard({ presentation, t }) {
  if (!presentation) return null;
  const itemLabel = presentation.itemCategory === "pure_bread" ? "Bread interpretation" : "Dessert interpretation";

  return (
    <SectionCard
      title={t("menuItemDetail.insights", "Insights")}
      eyebrow={itemLabel}
      style={{ padding: 16, background: "var(--gb-color-surface-strong)", border: "1px solid var(--gb-color-border)", boxShadow: "var(--gb-shadow-soft)" }}
    >
      <div style={{ fontSize: 15, lineHeight: 1.6, color: "#D1D5DB", fontWeight: 800 }}>
        {presentation.interpretation || "This item is still treated as an indulgent choice even if some protein or fiber offsets are present."}
      </div>
      {presentation.indulgence?.drivers?.length ? (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {presentation.indulgence.drivers.map((driver) => (
            <BadgePill key={driver} tone="caution">{driver}</BadgePill>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}

function IngredientFlagsCard({ detailSystem, t }) {
  const processing = detailSystem?.ingredients_processing || null;
  const europe = detailSystem?.europe_standards || null;

  const additiveFlags = [
    ...(Array.isArray(processing?.artificial_additives) ? processing.artificial_additives : []),
    ...(Array.isArray(processing?.artificial_colors) ? processing.artificial_colors : []),
    ...(Array.isArray(processing?.preservatives) ? processing.preservatives : []),
    ...(Array.isArray(processing?.flavor_enhancers) ? processing.flavor_enhancers : []),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const uniqueAdditives = [...new Set(additiveFlags)];
  const restricted = [...new Set((Array.isArray(europe?.restricted_ingredients) ? europe.restricted_ingredients : []).map((value) => String(value || "").trim()).filter(Boolean))];
  const scrutiny = [...new Set((Array.isArray(europe?.scrutiny_ingredients) ? europe.scrutiny_ingredients : []).map((value) => String(value || "").trim()).filter(Boolean))];

  const hasContent =
    uniqueAdditives.length ||
    restricted.length ||
    scrutiny.length ||
    processing?.processing_level ||
    processing?.user_impact ||
    europe?.headline;

  if (!hasContent) return null;

  return (
    <SectionCard
      title={t("menuItemDetail.ingredientFlags", "Ingredient Flags")}
      eyebrow={t("menuItemDetail.ingredientFlags", "Ingredient Flags")}
      style={{ marginTop: 14 }}
    >
      <div style={{ display: "grid", gap: 12 }}>
        {processing?.processing_level ? (
          <div style={{ borderRadius: 16, border: "1px solid #1F2937", background: "#121A14", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("menuItemDetail.processingLevel", "Processing Level")}
            </div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: "#FFFFFF" }}>
              {processing.processing_level}
            </div>
            {processing.user_impact ? (
              <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "#9CA3AF" }}>
                {processing.user_impact}
              </div>
            ) : null}
          </div>
        ) : null}

        {europe?.headline ? (
          <div style={{ borderRadius: 16, border: "1px solid rgba(234,179,8,0.2)", background: "rgba(234,179,8,0.08)", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#FBBF24", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("menuItemDetail.euStandards", "EU Standards")}
            </div>
            <div style={{ marginTop: 6, fontSize: 16, fontWeight: 900, color: "#5f3c00", lineHeight: 1.35 }}>
              {europe.headline}
            </div>
            {europe.note ? (
              <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "#7b6233" }}>
                {europe.note}
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 10 }}>
          {uniqueAdditives.length ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 8 }}>
                {t("menuItemDetail.artificialAndAdditiveSignals", "Artificial & Additive Signals")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {uniqueAdditives.map((entry) => (
                  <BadgePill key={entry} tone="caution">{entry}</BadgePill>
                ))}
              </div>
            </div>
          ) : null}

          {restricted.length ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FCA5A5", marginBottom: 8 }}>
                {t("menuItemDetail.restrictedInEurope", "Restricted In Parts of Europe")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {restricted.map((entry) => (
                  <BadgePill key={entry} tone="caution">{entry}</BadgePill>
                ))}
              </div>
            </div>
          ) : null}

          {scrutiny.length ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FBBF24", marginBottom: 8 }}>
                {t("menuItemDetail.underEuropeanScrutiny", "Under European Scrutiny")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {scrutiny.map((entry) => (
                  <BadgePill key={entry} tone="accent">{entry}</BadgePill>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

function NutritionInsightsCluster({ detailSystem, isMobile, t }) {
  const category = detailCategory(detailSystem);
  const showInsights = category === "entree" && confidenceLevel(detailSystem) !== "low";
  return (
    <Surface style={{ marginTop: 22, padding: isMobile ? 18 : 22 }}>
      <Eyebrow>{t("menuItemDetail.nutritionAndInsights", "Nutrition & Insights")}</Eyebrow>
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, alignItems: "start" }}>
          <NutritionCard detailSystem={detailSystem} t={t} />
          {showInsights ? (
            <InsightsCard detailSystem={detailSystem} t={t} />
          ) : null}
        </div>
        {showInsights ? <IngredientFlagsCard detailSystem={detailSystem} t={t} /> : null}
      </div>
    </Surface>
  );
}

function PreparationCard({ detailSystem, t }) {
  const preparation = detailSystem?.preparation;
  const category = detailCategory(detailSystem);
  if (!preparation) return null;
  if (category === "dessert" || category === "pure_bread") return null;

  const rows = [
    { label: t("menuItemDetail.preparationMethod", "Cooking Method"), value: preparation.cooking_method },
    { label: t("menuItemDetail.preparationCoating", "Coating"), value: preparation.coating },
    { label: t("menuItemDetail.preparationSauce", "Sauce Style"), value: preparation.sauce_style },
  ].filter((entry) => {
    if (!String(entry.value || "").trim()) return false;
    if (category === "beverage") return entry.label === t("menuItemDetail.preparationMethod", "Cooking Method");
    return true;
  });

  if (!rows.length && !preparation.impact_line && !preparation.why_it_matters) return null;

  return (
    <SectionCard
      title={t("menuItemDetail.preparationTitle", "Preparation")}
      eyebrow={t("menuItemDetail.preparationTitle", "Preparation")}
      style={{ marginTop: 18 }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        {rows.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
            {rows.map((row) => (
              <div key={row.label} style={{ borderRadius: 16, border: "1px solid var(--gb-color-border)", background: "var(--gb-color-surface-strong)", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {row.label}
                </div>
                <div style={{ marginTop: 6, fontSize: 17, fontWeight: 900, color: "#FFFFFF" }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {preparation.impact_line ? (
          <div style={{ fontSize: 15, lineHeight: 1.5, color: "#D1D5DB", fontWeight: 800 }}>
            {preparation.impact_line}
          </div>
        ) : null}
        {preparation.why_it_matters ? (
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#9CA3AF" }}>
            {preparation.why_it_matters}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function CompactConfidence({ detailSystem }) {
  const confidence = detailSystem?.confidence;
  if (!confidence?.message) return null;
  return (
    <div style={{ fontSize: 13, lineHeight: 1.5, color: "#9CA3AF", fontWeight: 700 }}>
      {confidence.message}
    </div>
  );
}

function MissingNutritionState() {
  return (
    <Surface style={{ marginTop: 22, padding: 20 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: "#FFFFFF" }}>
        Nutrition estimate — confirm with restaurant
      </div>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: "#9CA3AF", fontWeight: 700 }}>
        Incomplete nutrition data is available for this item.
      </div>
      <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.5, color: "#9CA3AF" }}>
        Try similar items for guidance
      </div>
    </Surface>
  );
}

function AlcoholicBeverageInfoCluster({ content, isMobile, t }) {
  if (!hasAlcoholicBeverageContent(content)) return null;

  const description = String(content?.description || "").trim();
  const recipe = String(content?.recipe || "").trim();
  const ingredients = Array.isArray(content?.ingredients)
    ? content.ingredients.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];

  return (
    <Surface style={{ marginTop: 22, padding: isMobile ? 18 : 22 }}>
      <Eyebrow>{t("menuItemDetail.beverageInfo", "Beverage")}</Eyebrow>
      <div style={{ display: "grid", gap: 18 }}>
        {description ? (
          <SectionCard
            title={t("menuItemDetail.beverageDescription", "Description")}
            eyebrow={t("menuItemDetail.beverageDescription", "Description")}
          >
            <div style={{ fontSize: 15, lineHeight: 1.6, color: "#D1D5DB", fontWeight: 800 }}>
              {description}
            </div>
          </SectionCard>
        ) : null}
        {recipe ? (
          <SectionCard
            title={t("menuItemDetail.beverageRecipe", "Recipe")}
            eyebrow={t("menuItemDetail.beverageRecipe", "Recipe")}
          >
            <div style={{ fontSize: 15, lineHeight: 1.6, color: "#D1D5DB", fontWeight: 800, whiteSpace: "pre-wrap" }}>
              {recipe}
            </div>
          </SectionCard>
        ) : null}
        {ingredients.length ? (
          <SectionCard
            title={t("menuItemDetail.beverageIngredients", "Ingredients")}
            eyebrow={t("menuItemDetail.beverageIngredients", "Ingredients")}
          >
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, color: "#D1D5DB", fontSize: 15, lineHeight: 1.55, fontWeight: 700 }}>
              {ingredients.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </SectionCard>
        ) : null}
      </div>
    </Surface>
  );
}

function ResponsibleDrinkingNotice({ t }) {
  return (
    <Surface style={{ marginTop: 22, padding: 20 }}>
      <Eyebrow>{t("menuItemDetail.drinkResponsiblyEyebrow", "Please note")}</Eyebrow>
      <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#FFFFFF" }}>
        {t("menuItemDetail.drinkResponsiblyTitle", RESPONSIBLE_DRINKING_TITLE)}
      </h2>
      <ul style={{ margin: "16px 0 0", paddingLeft: 18, display: "grid", gap: 8, color: "#9CA3AF", fontSize: 13.5, lineHeight: 1.55, fontWeight: 700 }}>
        {RESPONSIBLE_DRINKING_BULLETS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Surface>
  );
}

// ── Explore Similar Dishes ───────────────────────────────────

const SIMILAR_DIET_FILTER_KEYS = Object.freeze([
  "vegan",
  "vegetarian",
  "gluten_free",
  "dairy_free",
  "diabetic_friendly",
  "low_fat",
  "low_sodium",
  "keto",
]);

function ExploreSimilarDishes({ itemId, itemName, currentSlug, geoLat, geoLng, activeSearchParams, t }) {
  const navigate = useNavigate();
  const { itemCount } = useOrderCart();
  const sectionRef = useRef(null);
  const [similar, setSimilar] = useState(null);
  const [failed, setFailed] = useState(false);

  function buildSimilarLink(entry) {
    const normalizedEntryId = getNormalizedMenuItemId(entry);
    const basePath = getCanonicalMenuItemPath({
      restaurant: { slug: entry.restaurant_slug || null, id: entry.restaurant_id || null },
      menuItem: { id: normalizedEntryId },
    });
    const params = new URLSearchParams();
    if (geoLat && geoLng) { params.set("lat", geoLat); params.set("lng", geoLng); }
    for (const key of SIMILAR_DIET_FILTER_KEYS) {
      if (activeSearchParams?.get(key) === "1") params.set(key, "1");
    }
    if (itemId) params.set("fromItem", String(itemId));
    if (itemName) params.set("fromName", itemName);
    if (currentSlug) params.set("fromSlug", currentSlug);
    params.set("from", "menu");
    return `${basePath}?${params.toString()}`;
  }

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareError, setCompareError] = useState(null);

  useEffect(() => {
    if (!itemId) return undefined;
    let cancelled = false;
    // Geo context only — search filters (diet, price) are NOT forwarded.
    // Similar candidates are drawn from the full local family pool regardless
    // of what filters were active on the search page.
    const params = new URLSearchParams();
    if (geoLat && geoLng) {
      params.set("lat", geoLat);
      params.set("lng", geoLng);
    }
    const browseCity = activeSearchParams?.get("city");
    const browseState = activeSearchParams?.get("state");
    if (browseCity) params.set("city", browseCity);
    if (browseState) params.set("state", browseState);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    fetch(`${BACKEND_BASE}/menu-items/${encodeURIComponent(itemId)}/similar${suffix}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!cancelled) {
          const rows = sortSimilarItemsByMatchStrength(Array.isArray(json?.similar) ? json.similar : []);
          setSimilar(rows);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [geoLat, geoLng, itemId, activeSearchParams]);

  function handleCompare(similarEntry) {
    const candidateId = getNormalizedMenuItemId(similarEntry);
    if (!isSimilarRowCompareEligible(similarEntry) || !itemId || !candidateId) return;
    setCompareData(null);
    setCompareError(null);
    setCompareLoading(true);
    setCompareOpen(true);
    fetchCompareItems(itemId, candidateId, geoLat || null, geoLng || null, {
      skipEligibilityCheck: true,
    })
      .then((data) => {
        if (!data?.baseItem && !data?.candidateItem) {
          setCompareLoading(false);
          setCompareError("This comparison is no longer available.");
          return;
        }
        setCompareData(data);
        setCompareLoading(false);
      })
      .catch((error) => {
        setCompareLoading(false);
        setCompareData(null);
        setCompareError(error?.message || "This comparison is no longer available.");
      });
  }

  function handleSwap(candidateItem) {
    setCompareOpen(false);
    const slug = candidateItem?.restaurant_slug || null;
    const id = getNormalizedMenuItemId(candidateItem);
    if (!id) return;
    navigate(buildSimilarLink({ ...candidateItem, restaurant_slug: slug, restaurant_id: candidateItem?.restaurant_id }));
  }

  if (itemCount > 0) return null;

  return (
    <>
      <div ref={sectionRef}>
        <SectionCard
          title={t("menuItemDetail.similarItems", "Similar Items")}
          eyebrow={t("menuItemDetail.similarItems", "Similar Items")}
          style={{ marginTop: 24 }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            {failed ? (
              <div style={{ color: "#9CA3AF", fontSize: 14 }}>Could not load similar items. Try again.</div>
            ) : similar === null ? (
              <div style={{ color: "#9CA3AF", fontSize: 14 }}>Loading similar items...</div>
            ) : similar.length === 0 ? (
              <div style={{ color: "#9CA3AF", fontSize: 14 }}>No closely similar menu items were found.</div>
            ) : similar.map((entry) => (
              <div key={getNormalizedMenuItemId(entry)} style={{ borderRadius: 18, border: "1px solid var(--gb-color-border)", background: "var(--gb-color-surface-strong)", padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 10 }}>
                  {entry.restaurant_name}
                  {entry.distance_miles != null && (
                    <span style={{ fontWeight: 400, marginLeft: 6 }}>· {entry.distance_miles} mi</span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <Link
                    to={buildSimilarLink(entry)}
                    style={{
                      textDecoration: "none",
                      color: "#22C55E",
                      fontWeight: 800,
                      fontSize: 15,
                      lineHeight: 1.35,
                      flex: "1 1 0",
                      minWidth: 0,
                    }}
                  >
                    {formatMenuItemName(entry.name)}
                  </Link>
                  {isSimilarRowCompareEligible(entry) ? (
                    <button
                      type="button"
                      onClick={() => handleCompare(entry)}
                      style={{
                        flexShrink: 0,
                        background: "rgba(34,197,94,0.09)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        borderRadius: 999,
                        padding: "5px 13px",
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#22C55E",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        lineHeight: 1.4,
                      }}
                    >
                      Compare
                    </button>
                  ) : null}
                </div>

                {Array.isArray(entry.profile_differences) && entry.profile_differences.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {entry.profile_differences.map((phrase) => (
                      <span
                        key={phrase}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#9CA3AF",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 20,
                          padding: "3px 10px",
                        }}
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <CompareItemsModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        comparison={compareData}
        loading={compareLoading}
        error={compareError}
        onSwap={handleSwap}
        onViewBase={() => {
          setCompareOpen(false);
          navigate(buildSimilarLink({ id: itemId, restaurant_slug: currentSlug, restaurant_id: null }));
        }}
        baseLabel="Current"
      />
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function MenuItemDetailPage() {
  const { id: routeId, restaurantSlug, itemSlug } = useParams();
  const id = routeId ?? itemSlug;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { language, t } = useLanguage();
  const { isAuthenticated, allergenFilter } = useConsumer();

  const geoLat = searchParams.get("lat");
  const geoLng = searchParams.get("lng");
  const fromSearch = searchParams.get("from") === "search";
  const fromMenu   = searchParams.get("from") === "menu";
  const fromCluster = hasClusterReturnContext(searchParams);
  const clusterReturnTo = resolveReturnTarget(searchParams);
  const clusterBackLabel = fromCluster
    ? `Back to ${resolveReturnLabel(searchParams)}`
    : null;

  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");
  const [rawItem,  setRawItem]  = useState(null);
  const item = useMemo(() => (rawItem ? normalizeResultItem(rawItem) : null), [rawItem]);

  useEffect(() => {
    if (!item) return;
    sendPageVisit({
      path: window.location.pathname + window.location.search,
      restaurant_id: item.restaurant?.id ? Number(item.restaurant.id) : null,
      menu_item_id: id ? Number(id) : null,
    });
    // Intentionally fire once when item first loads for this id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.menu_item_id, id]);

  const displayItemName = useMemo(
    () => getDisplayMenuItemName(item, language, item?.name || "Untitled Item"),
    [item, language]
  );
  const shareData = useMemo(() => {
    if (!item) return null;
    return buildDishShareData({
      restaurant: item.restaurant,
      menuItem: {
        ...item,
        menu_item_id: item.menu_item_id,
        name: displayItemName,
      },
    });
  }, [item, displayItemName]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");
      setRawItem(null);

      if (!isValidMenuItemRouteId(id)) {
        setErr("A valid menu item ID is required.");
        setLoading(false);
        return;
      }

      try {
        const geoSuffix = geoLat && geoLng ? `?lat=${geoLat}&lng=${geoLng}` : "";
        const tryUrls = [`${BACKEND_BASE}/menu-items/${encodeURIComponent(id)}${geoSuffix}`];

        let found = null;
        for (const url of tryUrls) {
          try {
            const response = await fetch(url, { credentials: "include" });
            if (!response.ok) continue;
            const json = await response.json();
            if (json?.ok && (json?.item || json?.menu_item)) {
              found = json.item || json.menu_item;
              break;
            }
          } catch (error) {
            void error;
          }
        }

        if (!found) throw new Error("This item was not found. Return to the restaurant menu and choose another item.");

        if (!cancelled) {
          setRawItem(found);
          if (!restaurantSlug && !fromSearch && !fromMenu && !fromCluster) {
            const slug =
              found?.restaurant_slug || found?.restaurant?.slug ||
              toSlug(found?.restaurant_name || found?.restaurant?.name || found?.restaurant);
            if (slug) navigate(`/restaurants/${slug}/menu-items/${id}`, { replace: true });
          }
        }
      } catch (error) {
        if (!cancelled) setErr(error?.message ?? "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, navigate, restaurantSlug, fromSearch, fromMenu, fromCluster, geoLat, geoLng]);

  useEffect(() => {
    if (!shareData) return undefined;
    return applyDocumentSocialMetadata({
      title: shareData.title,
      description: shareData.text,
      url: shareData.url,
      image: shareData.image,
    });
  }, [shareData]);

  const priceLabel =
    (item?.priceMinor != null && item.priceMinor > 0) ? formatMoney(item.priceMinor) :
    (item?.price      != null && Number(item.price) > 0) ? moneyFromFloat(item.price) : null;

  const fromItemId   = searchParams.get("fromItem");
  const fromItemName = searchParams.get("fromName");
  const fromItemSlug = searchParams.get("fromSlug");
  const backUrl = fromItemId
    ? (fromItemSlug
        ? `/restaurants/${fromItemSlug}/menu-items/${fromItemId}`
        : `/menu-items/${fromItemId}`)
    : null;

  if (loading) {
    return (
      <PageShell isMobile={isMobile}>
        <Surface style={{ padding: 22 }}>
          <div style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 700 }}>{t("menuItemDetail.loadingItem", "Loading item...")}</div>
        </Surface>
      </PageShell>
    );
  }

  if (err || !item) {
    return (
      <PageShell isMobile={isMobile}>
        <Surface style={{ padding: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#FFFFFF" }}>{t("menuItemDetail.itemNotAvailable", "Item not available")}</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#9CA3AF", lineHeight: 1.5 }}>{err || t("menuItemDetail.itemCouldNotLoad", "Item could not load")}</div>
        </Surface>
      </PageShell>
    );
  }

  const detailSystem = item.detailSystem || null;
  const isAlcoholicBeverage = isAlcoholicBeverageItem(rawItem, detailSystem);
  const alcoholicBeverageContent = isAlcoholicBeverage
    ? resolveAlcoholicBeverageContent(
      rawItem,
      detailSystem,
      getLocalizedField(item, "description", language) || item.description,
    )
    : null;
  const hasNutritionData = hasAnyNutritionData(detailSystem);
  const indulgencePresentation = resolveIndulgencePresentation({ detailSystem });
  const integrity = rawItem?.integrity || null;
  const isBrokenFranchiseLink = integrity?.status === "broken_franchise_link";
  const showRestaurantLogo = hasRenderableImage(item.restaurant.logoUrl);
  const showItemPhoto = hasRenderableImage(item.itemPhotoUrl);
  const heroGridColumns = "1fr";
  const effectiveAllergenFilter = isAuthenticated ? allergenFilter || null : null;
  const showStickyVerdict = !isAlcoholicBeverage && !indulgencePresentation && !detailSystem?.bread_score;
  const itemDescription = getLocalizedField(item, "description", language) || item.description;
  const fullMenuHref = item
    ? appendMenuHighlightQuery(
        buildCanonicalMenuPath({
          restaurantSlug: item.restaurant.slug || null,
          restaurantId: item.restaurant.id || null,
          city: item.restaurant.city || null,
          state: item.restaurant.state || null,
        }),
        {
          menuItemId: item.menu_item_id,
          extraParams: {
            ...highlightMenuLinkExtrasFromSearch(searchParams),
            ...returnContextExtraParams(searchParams),
          },
        },
      )
    : "/menus";

  return (
    <PageShell isMobile={isMobile}>
      {fromCluster && clusterReturnTo ? (
        <ReturnToSourceBar to={clusterReturnTo} label={clusterBackLabel} />
      ) : null}

      {backUrl && fromItemName && (
        <Link
          to={backUrl}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginBottom: 14, fontSize: 13, fontWeight: 800,
            color: "#9CA3AF", textDecoration: "none",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>←</span>
          <span style={{
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: 220,
          }}>
            {fromItemName}
          </span>
        </Link>
      )}

      {/* ── 1. Hero / Item Identity ── */}
      <Surface style={{
        padding: isMobile ? 18 : 18,
        position: "sticky",
        top: STICKY_ITEM_HERO_TOP_PX,
        zIndex: 40,
        background: "var(--gb-color-surface-muted)",
        boxShadow: "var(--gb-shadow-card)",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: heroGridColumns, gap: isMobile ? 18 : 18, alignItems: "stretch" }}>
          <div style={{ display: "grid", gap: isMobile ? 16 : 12 }}>
            <div>
              <Eyebrow>{t("menuItemDetail.menuItemIntelligence", "Menu Item Intelligence")}</Eyebrow>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {showRestaurantLogo ? (
                  <img
                    src={item.restaurant.logoUrl}
                    alt={`${item.restaurant.name} logo`}
                    style={{ width: 62, height: 62, objectFit: "contain", borderRadius: 18, background: "var(--gb-color-surface)", border: "1px solid var(--gb-color-border)", padding: 8 }}
                  />
                ) : null}
                <div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 800 }}>
                    <Link to={`/restaurants/${item.restaurant.slug || item.restaurant.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {item.restaurant.name}
                    </Link>
                  </div>
                  {(item.restaurant.city || item.restaurant.cuisine) ? (
                    <div style={{ marginTop: 4, fontSize: 13, color: "#9CA3AF" }}>
                      {[item.restaurant.city, item.restaurant.cuisine].filter(Boolean).join(" · ")}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 34 : 46,
                    lineHeight: 0.96,
                    letterSpacing: "-0.05em",
                    color: "#FFFFFF",
                    maxWidth: 760,
                    minWidth: 0,
                    flex: "1 1 auto",
                  }}
                >
                  {displayItemName}
                </h1>
                {priceLabel ? (
                  <div
                    style={{
                      flexShrink: 0,
                      fontSize: isMobile ? 24 : 28,
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      color: "#22C55E",
                      lineHeight: 1,
                      paddingTop: isMobile ? 4 : 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {priceLabel}
                  </div>
                ) : null}
              </div>
              <div style={{ marginTop: 10 }}>
                <MenuItemDetailActionRail
                  menuItemId={item.menu_item_id}
                  itemName={displayItemName}
                  shareData={shareData}
                  shareAnalyticsContext={{
                    restaurantId: item.restaurant.id,
                    restaurantSlug: item.restaurant.slug || null,
                    menuItemId: item.menu_item_id,
                    menuItemName: displayItemName,
                    pageType: "menu_item_detail",
                    shareTarget: "dish",
                  }}
                  fullMenuHref={fullMenuHref}
                  fromSearch={fromSearch || fromCluster}
                  onBack={() => {
                    if (clusterReturnTo) navigate(clusterReturnTo);
                    else navigate(-1);
                  }}
                  returnLabel={fromCluster ? clusterBackLabel : "Return to search results"}
                />
              </div>

              {!isAlcoholicBeverage && indulgencePresentation ? <IndulgenceInline presentation={indulgencePresentation} /> : null}
              {!isAlcoholicBeverage && !indulgencePresentation && detailSystem?.bread_score ? <BreadScoreInline detailSystem={detailSystem} /> : null}
            </div>

            {itemDescription ? (
              <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "#D1D5DB", maxWidth: 760 }}>
                {itemDescription}
              </div>
            ) : null}

            {/* Foods I Avoid preference advisory — not allergen filtering */}
            <PreferenceIngredientAdvisory
              item={{
                name: displayItemName,
                description: itemDescription,
                section_name: item?.section_name || item?.category || null,
                mks_category: item?.mks_category || item?.mksCategory || null,
              }}
              tone="dark"
            />

            {showStickyVerdict && !isAlcoholicBeverage ? (
              <VerdictBlock detailSystem={detailSystem} isMobile={isMobile} t={t} compact />
            ) : null}

            {(item.badges.vegan || item.badges.glutenFree || item.badges.deal) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {item.badges.vegan      ? <BadgePill tone="positive">{t("diet.vegan", "Vegan")}</BadgePill> : null}
                {item.badges.glutenFree ? <BadgePill tone="accent">{t("diet.gluten_free", "Gluten Free")}</BadgePill> : null}
                {item.badges.deal       ? <BadgePill tone="caution">{t("common.deals", "Deal")}</BadgePill> : null}
              </div>
            )}

          </div>

        {showItemPhoto && isMobile ? (
          <div style={{ minHeight: isMobile ? 280 : 100, borderRadius: 22, overflow: "hidden", border: "1px solid var(--gb-color-border)", background: "var(--gb-color-surface)" }}>
            <img src={item.itemPhotoUrl} alt={`${displayItemName} photo`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ) : null}
        </div>
      </Surface>

      {isBrokenFranchiseLink && (
        <Surface style={{ marginTop: 20, padding: isMobile ? 16 : 20, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#22C55E", lineHeight: 1.5 }}>
            Official nutrition data for this franchise item is still being linked.
          </div>
        </Surface>
      )}

      {isAlcoholicBeverage ? (
        <AlcoholicBeverageInfoCluster
          content={alcoholicBeverageContent}
          isMobile={isMobile}
          t={t}
        />
      ) : hasNutritionData ? (
        <>
          <PreparationCard detailSystem={detailSystem} t={t} />
          <NutritionInsightsCluster
            detailSystem={detailSystem}
            isMobile={isMobile}
            t={t}
            indulgencePresentation={indulgencePresentation}
          />
        </>
      ) : (
        <MissingNutritionState />
      )}

      <ExploreSimilarDishes
        itemId={item.menu_item_id}
        itemName={displayItemName}
        currentSlug={item.restaurant.slug || null}
        geoLat={geoLat}
        geoLng={geoLng}
        activeSearchParams={searchParams}
        t={t}
        allergenFilter={effectiveAllergenFilter}
      />

      {isAlcoholicBeverage ? <ResponsibleDrinkingNotice t={t} /> : null}
    </PageShell>
  );
}
