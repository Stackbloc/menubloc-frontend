/**
 * ============================================================
 * File: MenuItemDetailPage.jsx
 * Path: menubloc-frontend/src/pages/MenuItemDetailPage.jsx
 * Date: 2026-03-30
 * ============================================================
 *
 * Decision page hierarchy:
 *   1. Hero / item identity
 *   2. Compact allergen alert (inside hero)
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
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageNav } from "../components/NavButton";
import AllergenFilterStatusBanner from "../components/consumer/AllergenFilterStatusBanner.jsx";
import IndulgenceMeter from "../components/IndulgenceMeter.jsx";
import ShareButton from "../components/share/ShareButton.jsx";
import {
  applyDocumentSocialMetadata,
  buildDishShareData,
  buildCanonicalMenuPath,
  getCanonicalMenuItemPath,
} from "../components/share/shareUtils.js";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { resolveIndulgencePresentation } from "../lib/indulgencePresentation.js";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import CompareItemsModal from "../components/menu/CompareItemsModal.jsx";
import { fetchCompareItems } from "../lib/api.js";
import { trackMenuItemInteraction } from "../lib/interactionTracking.js";

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

// ── Utility ─────────────────────────────────────────────────

function asNum(v) {
  // null/undefined must return null — NOT 0.
  // Number(null) === 0, which would cause null values to render as "0g protein" etc.
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function moneyFromMinor(priceMinor) {
  if (priceMinor == null || Number.isNaN(Number(priceMinor))) return null;
  return (Number(priceMinor) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function moneyFromFloat(price) {
  if (price == null || Number.isNaN(Number(price))) return null;
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
  const exactPriceMinor = pickFirstDefined(
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
    id: raw?.menu_item_id || raw?.id || null,
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

/**
 * Null-safe macro formatter. Returns "—" for null/undefined/empty.
 * Never returns "0g" for a null value.
 */
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

function normalizeLabel(value) {
  return String(value || "")
    .trim().replace(/_/g, " ").replace(/\s+/g, " ").toLowerCase()
    .split(" ").filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function toTranslationSuffix(value) {
  return String(value || "").trim().toLowerCase()
    .replace(/&/g, "and").replace(/[-/\s]+/g, "_")
    .replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}

function translateInsightText(t, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return t(`menuItemDetail.text.${toTranslationSuffix(raw)}`, raw);
}

function localizeCanonicalLabel(t, prefix, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return t(`${prefix}.${toTranslationSuffix(raw)}`, raw);
}

function translateAllergenValue(t, value) {
  const normalized = normalizeLabel(value);
  return localizeCanonicalLabel(t, "menuItemDetail.allergen", normalized) || normalized;
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

const VERDICT_THEMES = {
  "Compatible with a health-conscious diet":      { bg: "linear-gradient(135deg, rgba(22,105,62,0.97), rgba(34,132,78,0.93))",    label: "rgba(186,248,204,0.97)", eye: "rgba(186,248,204,0.60)" },
  "Suitable for frequent/regular consumption":    { bg: "linear-gradient(135deg, rgba(16,50,118,0.97), rgba(32,68,140,0.93))",    label: "rgba(180,212,255,0.97)", eye: "rgba(180,212,255,0.60)" },
  "Solid nutritional profile — one consideration":{ bg: "linear-gradient(135deg, rgba(14,90,105,0.97), rgba(20,120,138,0.93))",   label: "rgba(178,238,248,0.97)", eye: "rgba(178,238,248,0.60)" },
  "Best in moderation":                           { bg: "linear-gradient(135deg, rgba(138,70,0,0.97), rgba(176,100,0,0.92))",     label: "rgba(255,218,148,0.97)", eye: "rgba(255,218,148,0.60)" },
  "Best suited for occasional consumption":       { bg: "linear-gradient(135deg, rgba(98,18,8,0.99), rgba(158,38,18,0.95))",     label: "rgba(255,188,168,0.97)", eye: "rgba(255,188,168,0.58)" },
};

const SIGNAL_CHIP_COLORS = {
  excellent: { bg: "rgba(26,154,74,0.12)",  color: "#1a6a3a", border: "1px solid rgba(26,154,74,0.22)" },
  good:      { bg: "rgba(18,75,163,0.11)",  color: "#124ba3", border: "1px solid rgba(18,75,163,0.20)" },
  moderate:  { bg: "rgba(176,96,0,0.11)",   color: "#9b5c00", border: "1px solid rgba(176,96,0,0.18)" },
  high:      { bg: "rgba(184,40,0,0.11)",   color: "#a02800", border: "1px solid rgba(184,40,0,0.18)" },
  very_high: { bg: "rgba(140,10,0,0.13)",   color: "#8a0a00", border: "1px solid rgba(140,10,0,0.20)" },
  low:       { bg: "rgba(80,80,80,0.08)",   color: "#4a5450", border: "1px solid rgba(80,80,80,0.12)" },
  default:   { bg: "rgba(20,33,27,0.06)",   color: "#23352d", border: "1px solid rgba(20,33,27,0.10)" },
};

// ── Layout Primitives ────────────────────────────────────────

function PageShell({ children, isMobile }) {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(255,241,214,0.85), rgba(255,255,255,0) 34%), linear-gradient(180deg, #fbf7ee 0%, #f6f1e7 45%, #f8f7f2 100%)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: isMobile ? "18px 14px 56px" : "28px 24px 72px", boxSizing: "border-box", color: "#14211b", fontFamily: 'var(--font-ui, "Avenir Next", "Segoe UI", sans-serif)' }}>
        <PageNav back />
        {children}
      </div>
    </div>
  );
}

function Surface({ children, style }) {
  return (
    <section style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(20,33,27,0.08)", borderRadius: 24, boxShadow: "0 16px 44px rgba(20,33,27,0.08)", backdropFilter: "blur(8px)", ...style }}>
      {children}
    </section>
  );
}

function Eyebrow({ children, color = "#7a5b20" }) {
  return (
    <div style={{ fontSize: 11, lineHeight: 1.2, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, color, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function BadgePill({ children, tone = "default" }) {
  const tones = {
    default:  { background: "rgba(20,33,27,0.06)",  color: "#23352d", border: "1px solid rgba(20,33,27,0.08)" },
    positive: { background: "rgba(38,120,74,0.12)", color: "#1c6a43", border: "1px solid rgba(38,120,74,0.16)" },
    caution:  { background: "rgba(176,96,0,0.12)",  color: "#9b5c00", border: "1px solid rgba(176,96,0,0.14)" },
    accent:   { background: "rgba(18,75,163,0.10)", color: "#124ba3", border: "1px solid rgba(18,75,163,0.14)" },
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
      <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#16241d" }}>{title}</h2>
      <div style={{ marginTop: 16 }}>{children}</div>
    </Surface>
  );
}

// ── Hero sub-components ──────────────────────────────────────

function CompactAllergenAlert({ section, t }) {
  if (!section?.items?.length) return null;
  const allergens = section.items.map((entry) => translateAllergenValue(t, entry.label));
  return (
    <div style={{ marginTop: 16, borderRadius: 18, border: "1px solid rgba(176,96,0,0.14)", background: "linear-gradient(135deg, rgba(255,245,228,0.92), rgba(255,255,255,0.95))", padding: "14px 16px" }}>
      <div style={{ fontSize: 11, lineHeight: 1.2, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, color: "#9b5c00", marginBottom: 8 }}>
        {t("menuItemDetail.allergenAlert", "Allergen Alert")}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.45, color: "#423017", fontWeight: 800 }}>
        Likely contains: {allergens.join(", ")}
      </div>
      <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.45, color: "#6e5a3a" }}>
        {translateInsightText(t, section.disclosure || "Confirm with the restaurant for allergy safety.")}
      </div>
    </div>
  );
}

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

function VerdictBlock({ detailSystem, isMobile, t }) {
  const verdict = detailSystem?.verdict || {};
  const label = verdict.label;
  const basis = Array.isArray(verdict.reasons)
    ? [...new Set(verdict.reasons.map(toShortVerdictBasis).filter(Boolean))].slice(0, 2)
    : [];

  if (!label) return null;

  const theme = getVerdictTheme(label);

  return (
    <Surface style={{ marginTop: 20, padding: isMobile ? 22 : 28, background: theme.bg, color: "#f8f6ef" }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.eye, marginBottom: 10 }}>
        {t("menuItemDetail.verdict", "Verdict")}
      </div>
      <div style={{ fontSize: isMobile ? 34 : 46, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: theme.label }}>
        {label}
      </div>
      {basis.length ? (
        <div
          style={{
            marginTop: 12,
            color: "#fff8ee",
            fontSize: isMobile ? 13 : 14,
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          {basis.join(", ")}
        </div>
      ) : null}
    </Surface>
  );
}

function IndulgenceInline({ presentation }) {
  if (!presentation) return null;
  if (!presentation?.indulgence?.score && presentation?.indulgence?.score !== 0) {
    return (
      <div style={{ marginTop: 14, display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(176,96,0,0.10)", color: "#9b5c00", fontWeight: 900, fontSize: 13 }}>
        Limited data
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18, maxWidth: 520 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9b5c00", marginBottom: 8 }}>
        Indulgent
      </div>
      <div style={{ borderRadius: 18, padding: "14px 16px", background: "rgba(255,255,255,0.98)", border: "1px solid rgba(176,96,0,0.14)" }}>
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
      <div style={{ marginTop: 14, display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "rgba(176,96,0,0.10)", color: "#9b5c00", fontWeight: 900, fontSize: 13 }}>
        Limited data
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18, maxWidth: 520 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9b5c00", marginBottom: 8 }}>
        Verdict
      </div>
      <div style={{ borderRadius: 18, padding: "14px 16px", background: "rgba(255,255,255,0.98)", border: "1px solid rgba(176,96,0,0.14)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#7c2d12", letterSpacing: "-0.03em" }}>
            Bread Score
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#9b5c00" }}>
            {breadScore.score}
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 800, color: "#9a3412" }}>
          {breadScore.band}
        </div>
        {breadScore.explanation ? (
          <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, color: "#7c2d12", fontWeight: 700 }}>
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
  const pairs = isEntree
    ? [
        { label: "Calories", value: formatMacro(nutrition.calories), dv: wholeDv(nutrition.calories, DAILY_CALORIES, isReliable) },
        { label: "Fat", value: formatMacro(nutrition.fat_g, "g"), dv: wholeDv(nutrition.fat_g, DAILY_FAT_G, isReliable) },
        { label: "Saturated Fat", value: formatMacro(nutrition.saturated_fat_g, "g"), dv: wholeDv(nutrition.saturated_fat_g, DAILY_SAT_FAT_G, isReliable) },
        { label: "Carbs", value: formatMacro(nutrition.carbs_g, "g"), dv: wholeDv(nutrition.carbs_g, DAILY_CARBS_G, isReliable) },
        { label: "Fiber", value: formatMacro(nutrition.fiber_g, "g"), dv: wholeDv(nutrition.fiber_g, DAILY_FIBER_G, isReliable) },
        { label: "Sugar", value: formatMacro(nutrition.sugar_g, "g"), dv: null },
        { label: "Protein", value: formatMacro(nutrition.protein_g, "g"), dv: wholeDv(nutrition.protein_g, DAILY_PROTEIN_G, isReliable) },
        { label: "Sodium", value: formatMacro(nutrition.sodium_mg, "mg"), dv: wholeDv(nutrition.sodium_mg, DAILY_SODIUM_MG, isReliable) },
      ]
    : [
        { label: "Calories", value: formatMacro(nutrition.calories), dv: null },
        { label: "Carbs", value: formatMacro(nutrition.carbs_g, "g"), dv: null },
        { label: "Sugar", value: formatMacro(nutrition.sugar_g, "g"), dv: null },
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
      <div style={{ display: "grid", gap: 10 }}>
        {pairs.map((entry) => (
          <div key={entry.label} style={{ borderRadius: 16, border: "1px solid rgba(20,33,27,0.08)", background: "#fbfaf6", padding: "12px 14px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#15241d", fontWeight: 800 }}>
              {entry.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#15241d", textAlign: "right" }}>
              {entry.value}{entry.dv != null ? ` · ${entry.dv}% DV` : ""}
            </div>
          </div>
        ))}
      </div>
      {!isDrink && !isDessertOrBread && perOzRows.length && isReliable ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f", marginBottom: 10 }}>
            Per Ounce
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(120px, 180px))", gap: 10, width: "fit-content", maxWidth: "100%" }}>
            {perOzRows.map((row) => (
              <div key={row.label} style={{ borderRadius: 16, border: "1px solid rgba(20,33,27,0.08)", background: "#fbfaf6", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#617167", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {row.label}
                </div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: "#15241d" }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5, color: "#617167", fontWeight: 700 }}>
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
      style={{ padding: 16, background: "rgba(255,255,255,0.82)", border: "1px solid rgba(20,33,27,0.06)", boxShadow: "0 10px 24px rgba(20,33,27,0.04)" }}
    >
      <div style={{ display: "grid", gap: 8, padding: "2px 0" }}>
        {items.map((item) => {
          const tone = insightTone(item.key, item.value);
          const meterFill = insightFillPercent(item.value);
          return (
            <div key={item.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 140px 72px", alignItems: "center", gap: 10, background: "rgba(20,33,27,0.03)", padding: "6px 8px", borderRadius: 10 }}>
              <div style={{ minWidth: 0, fontSize: 13.5, fontWeight: 800, color: "#15241d", textAlign: "left" }}>
                {item.label}
              </div>
              <div style={{ width: 140, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 140, height: 8, borderRadius: 999, background: "rgba(20,33,27,0.08)", overflow: "hidden" }}>
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
      style={{ padding: 16, background: "rgba(255,255,255,0.82)", border: "1px solid rgba(20,33,27,0.06)", boxShadow: "0 10px 24px rgba(20,33,27,0.04)" }}
    >
      <div style={{ fontSize: 15, lineHeight: 1.6, color: "#23352d", fontWeight: 800 }}>
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
          <div style={{ borderRadius: 16, border: "1px solid rgba(20,33,27,0.08)", background: "#fbfaf6", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#617167", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("menuItemDetail.processingLevel", "Processing Level")}
            </div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: "#15241d" }}>
              {processing.processing_level}
            </div>
            {processing.user_impact ? (
              <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "#53635a" }}>
                {processing.user_impact}
              </div>
            ) : null}
          </div>
        ) : null}

        {europe?.headline ? (
          <div style={{ borderRadius: 16, border: "1px solid rgba(176,96,0,0.14)", background: "rgba(255,248,236,0.88)", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#9b5c00", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f", marginBottom: 8 }}>
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
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8a0a00", marginBottom: 8 }}>
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
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9b5c00", marginBottom: 8 }}>
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

function NutritionInsightsCluster({ detailSystem, isMobile, t, indulgencePresentation = null }) {
  const category = detailCategory(detailSystem);
  const showInsights = detailSystem?.insights != null && confidenceLevel(detailSystem) !== "low";
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
              <div key={row.label} style={{ borderRadius: 16, border: "1px solid rgba(20,33,27,0.08)", background: "#fbfaf6", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#617167", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {row.label}
                </div>
                <div style={{ marginTop: 6, fontSize: 17, fontWeight: 900, color: "#15241d" }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {preparation.impact_line ? (
          <div style={{ fontSize: 15, lineHeight: 1.5, color: "#23352d", fontWeight: 800 }}>
            {preparation.impact_line}
          </div>
        ) : null}
        {preparation.why_it_matters ? (
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#617167" }}>
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
    <div style={{ fontSize: 13, lineHeight: 1.5, color: "#425149", fontWeight: 700 }}>
      {confidence.message}
    </div>
  );
}

function MissingNutritionState() {
  return (
    <Surface style={{ marginTop: 22, padding: 20 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: "#15241d" }}>
        Nutrition estimate — confirm with restaurant
      </div>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: "#53635a", fontWeight: 700 }}>
        Incomplete nutrition data is available for this item.
      </div>
      <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.5, color: "#53635a" }}>
        Try similar items for guidance
      </div>
    </Surface>
  );
}

// ── Explore Similar Dishes ───────────────────────────────────

function buildSimilarItemsLabel(meta) {
  if (!meta) return null;
  if (meta.used_broad_fallback) {
    return "Showing broader matches because nearby similar dishes were limited";
  }
  if (meta.radius_used_miles != null && Number(meta.radius_used_miles) > 25) {
    return "Expanded nearby search";
  }
  return null;
}

const SIMILAR_DIET_FILTER_KEYS = Object.freeze([
  "vegan",
  "vegetarian",
  "gluten_free",
  "dairy_free",
  "diabetic_friendly",
  "low_sodium",
  "keto",
]);

function ExploreSimilarDishes({ itemId, geoLat, geoLng, activeSearchParams, t, allergenFilter }) {
  const navigate = useNavigate();
  const [similar, setSimilar] = useState(null);
  const [similarMeta, setSimilarMeta] = useState(null);
  const [failed, setFailed]   = useState(false);
  const searchSuffix = activeSearchParams?.toString() ? `?${activeSearchParams.toString()}` : "";

  // ── Compare state ────────────────────────────────────────
  const [compareOpen,    setCompareOpen]    = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData,    setCompareData]    = useState(null);
  const [compareError,   setCompareError]   = useState(null);

  useEffect(() => {
    if (!itemId) return undefined;
    let cancelled = false;
    const params = new URLSearchParams();
    if (geoLat && geoLng) {
      params.set("lat", geoLat);
      params.set("lng", geoLng);
    }
    for (const key of SIMILAR_DIET_FILTER_KEYS) {
      if (activeSearchParams?.get(key) === "1") {
        params.set(key, "1");
      }
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    fetch(`${BACKEND_BASE}/menu-items/${encodeURIComponent(itemId)}/similar${suffix}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!cancelled) {
          setSimilar(Array.isArray(json?.similar) ? json.similar : []);
          setSimilarMeta(json?.meta || null);
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [activeSearchParams, geoLat, geoLng, itemId]);

  function handleCompare(similarEntry) {
    setCompareData(null);
    setCompareError(null);
    setCompareLoading(true);
    setCompareOpen(true);
    fetchCompareItems(itemId, similarEntry.id, geoLat || null, geoLng || null)
      .then((data) => {
        setCompareData(data);
        setCompareLoading(false);
      })
      .catch((err) => {
        setCompareError(String(err?.message || "Compare failed"));
        setCompareLoading(false);
      });
  }

  function handleSwap(candidateItem) {
    // Navigate to the candidate item's detail page, preserving geo params.
    // Safe first version: no cart mutation required.
    setCompareOpen(false);
    const slug = candidateItem?.restaurant_slug || null;
    const id   = candidateItem?.id;
    if (!id) return;
    const geoSuffix = geoLat && geoLng ? `?lat=${geoLat}&lng=${geoLng}` : "";
    const path = slug
      ? `/restaurants/${slug}/menu-items/${id}${geoSuffix}`
      : `/menu-items/${id}${geoSuffix}`;
    navigate(path);
  }

  if (failed || similar === null || similar.length === 0) return null;

  const helperLabel = buildSimilarItemsLabel(similarMeta);

  return (
    <>
      <SectionCard
        title={t("menuItemDetail.similarItems", "Similar Items")}
        eyebrow={t("menuItemDetail.similarItems", "Similar Items")}
        style={{ marginTop: 24 }}
      >
        <div style={{ display: "grid", gap: 14 }}>
          {allergenFilter ? <AllergenFilterStatusBanner allergenFilter={allergenFilter} compact /> : null}
          {helperLabel && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#4c5c53",
                background: "rgba(20,33,27,0.05)",
                border: "1px solid rgba(20,33,27,0.08)",
                borderRadius: 12,
                padding: "10px 12px",
              }}
            >
              {helperLabel}
            </div>
          )}
          {similar.map((entry) => (
            <div key={entry.id} style={{ borderRadius: 18, border: "1px solid rgba(20,33,27,0.08)", background: "#fbfaf6", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f", marginBottom: 10 }}>
                {entry.restaurant_name}
                {entry.distance_miles != null && (
                  <span style={{ fontWeight: 400, marginLeft: 6 }}>· {entry.distance_miles} mi</span>
                )}
              </div>

              {/* Item name link + Compare button side-by-side */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <Link
                  to={`${getCanonicalMenuItemPath({
                    restaurant: {
                      slug: entry.restaurant_slug || null,
                      id: entry.restaurant_id || null,
                    },
                    menuItem: { id: entry.id },
                  })}${searchSuffix}`}
                  style={{ textDecoration: "none", color: "#124ba3", fontWeight: 800, fontSize: 15, lineHeight: 1.35, flex: "1 1 0", minWidth: 0 }}
                  onClick={() => trackMenuItemInteraction(entry.id, "similar_click")}
                >
                  {entry.name}
                </Link>
                <button
                  onClick={() => handleCompare(entry)}
                  style={{
                    flexShrink: 0,
                    background: "rgba(18,75,163,0.09)",
                    border: "1px solid rgba(18,75,163,0.18)",
                    borderRadius: 999,
                    padding: "5px 13px",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#124ba3",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    lineHeight: 1.4,
                  }}
                >
                  Compare
                </button>
              </div>

              {Array.isArray(entry.profile_differences) && entry.profile_differences.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {entry.profile_differences.map((phrase) => (
                    <span
                      key={phrase}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#3a5a44",
                        background: "rgba(40,100,60,0.08)",
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

      <CompareItemsModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        comparison={compareData}
        loading={compareLoading}
        error={compareError}
        onSwap={handleSwap}
        baseLabel="Current"
      />
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────

function MenuItemDetailPageInner() {
  const { id, restaurantSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { language, t } = useLanguage();
  const { isAuthenticated, allergenFilter } = useConsumer();

  const geoLat = searchParams.get("lat");
  const geoLng = searchParams.get("lng");

  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");
  const [rawItem,  setRawItem]  = useState(null);

  const item = useMemo(() => (rawItem ? normalizeResultItem(rawItem) : null), [rawItem]);
  const shareData = useMemo(() => {
    if (!item) return null;
    return buildDishShareData({
      restaurant: item.restaurant,
      menuItem: {
        ...item,
        id: item.id,
        name: item.name,
      },
    });
  }, [item]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");
      setRawItem(null);

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
          } catch { /* try next */ }
        }

        if (!found) throw new Error("No item-detail endpoint found yet. Create GET /menu-items/:id to power this page.");

        if (!cancelled) {
          setRawItem(found);
          if (!restaurantSlug) {
            const slug =
              found?.restaurant_slug || found?.restaurant?.slug ||
              toSlug(found?.restaurant_name || found?.restaurant?.name || found?.restaurant);
            if (slug) navigate(`/restaurants/${slug}/menu-items/${id}`, { replace: true });
          }
        }
      } catch (error) {
        if (!cancelled) setErr(String(error?.message || error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, navigate, restaurantSlug]);

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
    item?.priceMinor != null ? moneyFromMinor(item.priceMinor) :
    item?.price      != null ? moneyFromFloat(item.price) : null;

  if (loading) {
    return (
      <PageShell isMobile={isMobile}>
        <Surface style={{ padding: 22 }}>
          <div style={{ fontSize: 14, color: "#53635a", fontWeight: 700 }}>{t("menuItemDetail.loadingItem", "Loading item...")}</div>
        </Surface>
      </PageShell>
    );
  }

  if (err || !item) {
    return (
      <PageShell isMobile={isMobile}>
        <Surface style={{ padding: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#15241d" }}>{t("menuItemDetail.itemNotAvailable", "Item not available")}</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#53635a", lineHeight: 1.5 }}>{err || t("menuItemDetail.itemCouldNotLoad", "Item could not load")}</div>
        </Surface>
      </PageShell>
    );
  }

  const detailSystem = item.detailSystem || null;
  const hasNutritionData = hasAnyNutritionData(detailSystem);
  const indulgencePresentation = resolveIndulgencePresentation({ detailSystem });
  const integrity = rawItem?.integrity || null;
  const isBrokenFranchiseLink = integrity?.status === "broken_franchise_link";
  const showRestaurantLogo = hasRenderableImage(item.restaurant.logoUrl);
  const showItemPhoto = hasRenderableImage(item.itemPhotoUrl);
  const heroGridColumns = isMobile ? "1fr" : showItemPhoto ? "minmax(0, 1.4fr) minmax(280px, 0.95fr)" : "1fr";
  const effectiveAllergenFilter = isAuthenticated ? allergenFilter || null : null;
  const fullMenuHref = buildCanonicalMenuPath({
    restaurantSlug: item.restaurant.slug || null,
    restaurantId: item.restaurant.id || null,
  });

  return (
    <PageShell isMobile={isMobile}>

      {effectiveAllergenFilter ? (
        <AllergenFilterStatusBanner allergenFilter={effectiveAllergenFilter} style={{ marginBottom: 18 }} />
      ) : null}

      {/* ── 1. Hero / Item Identity ── */}
      <Surface style={{ padding: isMobile ? 18 : 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: heroGridColumns, gap: isMobile ? 18 : 24, alignItems: "stretch" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <Eyebrow>{t("menuItemDetail.menuItemIntelligence", "Menu Item Intelligence")}</Eyebrow>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {showRestaurantLogo ? (
                  <img
                    src={item.restaurant.logoUrl}
                    alt={`${item.restaurant.name} logo`}
                    style={{ width: 62, height: 62, objectFit: "contain", borderRadius: 18, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(20,33,27,0.08)", padding: 8 }}
                  />
                ) : null}
                <div>
                  <div style={{ fontSize: 13, color: "#617167", fontWeight: 800 }}>
                    <Link to={`/restaurants/${item.restaurant.slug || item.restaurant.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {item.restaurant.name}
                    </Link>
                  </div>
                  {(item.restaurant.city || item.restaurant.cuisine) ? (
                    <div style={{ marginTop: 4, fontSize: 13, color: "#6a786f" }}>
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
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 34 : 46,
                    lineHeight: 0.96,
                    letterSpacing: "-0.05em",
                    color: "#15241d",
                    maxWidth: 760,
                    minWidth: 0,
                    flex: "1 1 320px",
                  }}
                >
                  {getLocalizedField(item, "name", language) || item.name}
                </h1>
                {shareData ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      flex: "0 0 auto",
                    }}
                  >
                    <ShareButton
                      variant="dish"
                      label="Share Dish"
                      modalTitle={`Share ${getLocalizedField(item, "name", language) || item.name}`}
                      shareData={shareData}
                      analyticsContext={{
                        restaurantId: item.restaurant.id,
                        restaurantSlug: item.restaurant.slug || null,
                        menuItemId: item.id,
                        menuItemName: getLocalizedField(item, "name", language) || item.name,
                        pageType: "menu_item_detail",
                        shareTarget: "dish",
                      }}
                    />
                    <div style={{ fontSize: 11, lineHeight: 1.3, color: "#617167", fontWeight: 400 }}>
                      share this item
                    </div>
                  </div>
                ) : null}
              </div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {priceLabel ? (
                  <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#7a5b20" }}>
                    {priceLabel}
                  </div>
                ) : null}
              </div>

              {indulgencePresentation ? <IndulgenceInline presentation={indulgencePresentation} /> : null}
              {!indulgencePresentation && detailSystem?.bread_score ? <BreadScoreInline detailSystem={detailSystem} /> : null}
            </div>

            {(getLocalizedField(item, "description", language) || item.description) ? (
              <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "#405048", maxWidth: 760 }}>
                {getLocalizedField(item, "description", language) || item.description}
              </div>
            ) : null}

            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#617167", fontWeight: 700, maxWidth: 760 }}>
              See nutrition, insights, and similar dishes on Grubbid.
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Link
                to={fullMenuHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 44,
                  padding: "0 18px",
                  borderRadius: 999,
                  background: "#11211a",
                  color: "#f8fafc",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 800,
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)",
                }}
              >
                View Full Menu
              </Link>
              <div style={{ fontSize: 13, color: "#617167", fontWeight: 700 }}>
                Explore this dish on Grubbid
              </div>
            </div>

            {(item.badges.vegan || item.badges.glutenFree || item.badges.deal) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {item.badges.vegan      ? <BadgePill tone="positive">{t("diet.vegan", "Vegan")}</BadgePill>              : null}
                {item.badges.glutenFree ? <BadgePill tone="accent">{t("diet.gluten_free", "Gluten Free")}</BadgePill>    : null}
                {item.badges.deal       ? <BadgePill tone="caution">{t("common.deals", "Deal")}</BadgePill>              : null}
              </div>
            )}

            {/* ── 2. Compact Allergen Alert (inside hero) ── */}
            {hasNutritionData ? <CompactAllergenAlert section={detailSystem?.allergen_alerts} t={t} /> : null}
          </div>

          {showItemPhoto ? (
            <div style={{ minHeight: isMobile ? 280 : 100, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(20,33,27,0.08)", background: "#efe9dc" }}>
              <img src={item.itemPhotoUrl} alt={`${item.name} photo`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ) : null}
        </div>
      </Surface>

      {/* ── Broken franchise link notice ── */}
      {isBrokenFranchiseLink && (
        <Surface style={{ marginTop: 20, padding: isMobile ? 16 : 20, background: "rgba(18,75,163,0.06)", border: "1px solid rgba(18,75,163,0.14)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#124ba3", lineHeight: 1.5 }}>
            Official nutrition data for this franchise item is still being linked.
          </div>
        </Surface>
      )}

      {/* ── 3. Verdict ── */}
      {hasNutritionData ? (
        <>
          {!indulgencePresentation && !detailSystem?.bread_score && confidenceLevel(detailSystem) !== "low" ? (
            <VerdictBlock detailSystem={detailSystem} isMobile={isMobile} t={t} />
          ) : null}
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

      {/* ── 7. Explore Similar Dishes ── */}
      <ExploreSimilarDishes
        itemId={item.id}
        geoLat={geoLat}
        geoLng={geoLng}
        activeSearchParams={searchParams}
        t={t}
        allergenFilter={effectiveAllergenFilter}
      />

    </PageShell>
  );
}

function MenuItemDetailPageFallback() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#15241d", marginBottom: 8 }}>
        Something went wrong loading this item.
      </div>
      <a href="/" style={{ fontSize: 14, color: "#166a3e", fontWeight: 700 }}>
        Return to home
      </a>
    </div>
  );
}

export default function MenuItemDetailPage() {
  return (
    <ErrorBoundary fallback={<MenuItemDetailPageFallback />}>
      <MenuItemDetailPageInner />
    </ErrorBoundary>
  );
}
