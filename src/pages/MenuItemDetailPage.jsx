/**
 * ============================================================
 * File: MenuItemDetailPage.jsx
 * Path: menubloc-frontend/src/pages/MenuItemDetailPage.jsx
 * Date: 2026-03-29
 * ============================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageNav } from "../components/NavButton";
import { useLanguage } from "../context/LanguageContext.jsx";
import IndulgenceMeter from "../components/IndulgenceMeter.jsx";
import InsightCardDeck from "../components/InsightCardDeck.jsx";

const BACKEND_BASE = (
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  "http://localhost:3001"
).replace(/\/$/, "");

// ── Utility ─────────────────────────────────────────────────

function asNum(v) {
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

function percentFromRatio(ratio) {
  if (ratio == null || Number.isNaN(Number(ratio))) return null;
  return `${Math.round(Number(ratio) * 100)}%`;
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
    priceMinor: exactPriceMinor,
    price: exactPrice,
    itemPhotoUrl,
    intelligence: raw?.intelligence || null,
    nutritionChip: resolveNutritionChip(raw),
    insightScores: raw?.chips?.insights?.scores || null,
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

function formatMetricValue(value, suffix = "") {
  if (value == null || Number.isNaN(Number(value))) return null;
  return `${Math.round(Number(value))}${suffix}`;
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

function normalizeIngredientName(value) {
  return String(value || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function getIngredientNames(ingredients) {
  if (!Array.isArray(ingredients)) return [];
  return ingredients
    .map((row) => row?.name || row?.ingredient_name || row?.ingredient || "")
    .map(normalizeIngredientName).filter(Boolean);
}

// ── Verdict Logic ────────────────────────────────────────────

/**
 * deriveVerdictLabel — scoring-based, multi-signal verdict label.
 *
 * Signal weights:
 *
 *   Calories (0–4 pts):
 *     ≥ 1000 → +4 | ≥ 800 → +3 | ≥ 600 → +2 | ≥ 400 → +1
 *     Raised thresholds so 700-cal grilled items don't prematurely hit Indulgent.
 *
 *   Fat (0–3 pts):
 *     ≥ 45g → +3 | ≥ 30g → +2 | ≥ 18g → +1
 *
 *   Sodium (0–4 pts) — one of the strongest negative signals:
 *     ≥ 1800mg → +4 | ≥ 1400mg → +3 | ≥ 1000mg → +2 | ≥ 700mg → +1
 *
 *   Sugar (0–2 pts):
 *     ≥ 40g → +2 | ≥ 28g → +1
 *
 *   Fiber modifier (±1 pt) — primary quality signal:
 *     < 2g → +1 (low fiber raises indulgence) | ≥ 5g → -1 (high fiber offsets)
 *
 *   Protein modifier (±1 pt) — primary quality signal:
 *     ≥ 30g → -1 (strong protein offsets indulgence) | ≤ 10g → +1 (weak protein raises it)
 *
 * Score bands:
 *   ≥ 10 → Maximum Indulgence
 *   ≥  6 → Indulgent
 *   ≥  2 → Balanced Choice
 *   < 2, guardrail passes → Light Choice
 *   < 2, guardrail fails  → Balanced Choice
 *
 *   Light Choice guardrail (all must pass):
 *     cal ≤ 450 AND sodium ≤ 700 AND (fiber ≥ 2 OR protein ≥ 15)
 *
 * Returns null if calories absent (no verdict possible).
 * Dessert path: uses backend dessert_indulgence.level directly.
 */
function deriveVerdictLabel(intelligence) {
  // Dessert path — use backend indulgence meter if available
  const ind = intelligence?.dessert_indulgence;
  if (ind?.level) {
    const map = { indulgent: "Maximum Indulgence", rich: "Indulgent", moderate: "Balanced Choice", light: "Light Choice" };
    if (map[ind.level]) return map[ind.level];
  }

  const nut = intelligence?.nutrition;
  if (!nut) return null;

  const cal     = asNum(nut.calories_kcal);
  const fat     = asNum(nut.fat_g);
  const sodium  = asNum(nut.sodium_mg);
  const sugar   = asNum(nut.sugar_g);
  const fiber   = asNum(nut.fiber_g);
  const protein = asNum(nut.protein_g);

  // Calories required to produce any verdict
  if (cal === null) return null;

  let score = 0;

  // Calories (0–4 pts) — raised thresholds to avoid penalising moderate-cal whole foods
  if      (cal >= 1000) score += 4;
  else if (cal >=  800) score += 3;
  else if (cal >=  600) score += 2;
  else if (cal >=  400) score += 1;

  // Fat (0–3 pts)
  if (fat !== null) {
    if      (fat >= 45) score += 3;
    else if (fat >= 30) score += 2;
    else if (fat >= 18) score += 1;
  }

  // Sodium (0–4 pts) — strongest negative signal, now carries full weight
  if (sodium !== null) {
    if      (sodium >= 1800) score += 4;
    else if (sodium >= 1400) score += 3;
    else if (sodium >= 1000) score += 2;
    else if (sodium >=  700) score += 1;
  }

  // Sugar (0–2 pts)
  if (sugar !== null) {
    if      (sugar >= 40) score += 2;
    else if (sugar >= 28) score += 1;
  }

  // Fiber modifier (±1 pt) — low fiber raises indulgence, high fiber offsets it
  if (fiber !== null) {
    if      (fiber <  2) score += 1;
    else if (fiber >= 5) score -= 1;
  }

  // Protein modifier (±1 pt) — strong protein offsets, weak protein adds to indulgence
  if (protein !== null) {
    if      (protein >= 30) score -= 1;
    else if (protein <= 10) score += 1;
  }

  if (score >= 10) return "Maximum Indulgence";
  if (score >=  6) return "Indulgent";
  if (score >=  2) return "Balanced Choice";

  // score < 2 — candidate for Light Choice, but must pass quality guardrail.
  // Low-calorie items with high sodium or no fiber/protein land at Balanced, not Light.
  const sodiumOk  = sodium === null || sodium <= 700;
  const qualityOk = (fiber !== null && fiber >= 2) || (protein !== null && protein >= 15);
  if (cal <= 450 && sodiumOk && qualityOk) return "Light Choice";

  return "Balanced Choice";
}

/**
 * deriveVerdictExplanations — up to 2 absolute, self-contained explanation lines.
 *
 * Priority ordering (highest first):
 *   10 — Very high sodium (≥1600mg): "Contains a high amount of sodium"
 *    9 — High sodium (≥1200mg): "High in sodium for a single menu item"
 *    8 — Strong protein (≥28g): "Strong protein content"
 *    7 — Low fiber (≤2g): "Provides limited fiber"
 *    6 — High fat (≥35g): "Higher in fat"
 *    5 — High sugar (≥30g): "Sugar content is elevated"
 *    4 — High fiber (≥5g): "Contains fiber which may support slower digestion"
 *    3 — Calorie-dense (≥800 cal, only if no sodium signal already taken top 2): "Calorie-dense for its estimated portion"
 *
 * Fiber appears at both priority 7 (low fiber, negative) and priority 4 (high fiber, positive).
 * Low fiber ranks above fat and sugar — it is a primary decision signal, not secondary.
 *
 * No comparative phrasing. All lines are absolute and self-contained.
 */
function deriveVerdictExplanations(intelligence) {
  const nut = intelligence?.nutrition;
  if (!nut) return [];

  const sodium  = asNum(nut.sodium_mg);
  const fiber   = asNum(nut.fiber_g);
  const protein = asNum(nut.protein_g);
  const fat     = asNum(nut.fat_g);
  const sugar   = asNum(nut.sugar_g);
  const cal     = asNum(nut.calories_kcal);

  const candidates = [];

  // Sodium
  if      (sodium !== null && sodium >= 1600) candidates.push({ priority: 10, text: "Contains a high amount of sodium" });
  else if (sodium !== null && sodium >= 1200) candidates.push({ priority:  9, text: "High in sodium for a single menu item" });

  // Protein
  if (protein !== null && protein >= 28) candidates.push({ priority: 8, text: "Strong protein content" });

  // Fiber — low is priority 7 (above fat/sugar); high is priority 4 (supporting positive)
  if      (fiber !== null && fiber <= 2) candidates.push({ priority: 7, text: "Provides limited fiber" });
  else if (fiber !== null && fiber >= 5) candidates.push({ priority: 4, text: "Contains fiber which may support slower digestion" });

  // Fat
  if (fat !== null && fat >= 35) candidates.push({ priority: 6, text: "Higher in fat" });

  // Sugar
  if (sugar !== null && sugar >= 30) candidates.push({ priority: 5, text: "Sugar content is elevated" });

  // Calories (only surfaces if sodium hasn't already claimed the top 2 slots)
  if (cal !== null && cal >= 800 && !candidates.some((c) => c.priority >= 9)) {
    candidates.push({ priority: 3, text: "Calorie-dense for its estimated portion" });
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, 2).map((c) => c.text);
}

/**
 * resolveEvidenceState — single source of truth for both verdict label and confidence.
 *
 * Confidence rules:
 *   High   — verdict label present AND calories + protein + carbs + fat ALL present
 *            AND backend confidence is "high"
 *   Medium — verdict label present AND ≥2 of the 4 core macros present,
 *            OR backend confidence is "medium"
 *   Low    — verdict label is null (limited-info state), OR fewer than 2 core macros
 *
 * "High confidence" requires all 4 core macros. "coreCount >= 3" is not sufficient —
 * a missing carbs value means the nutrition picture is incomplete.
 *
 * Both `verdictLabel` and `confidenceLevel` are returned from this function.
 * Neither is derived separately elsewhere. They cannot contradict.
 */
function resolveEvidenceState(intelligence) {
  const nut     = intelligence?.nutrition;
  const cal     = asNum(nut?.calories_kcal);
  const protein = asNum(nut?.protein_g);
  const carbs   = asNum(nut?.carbs_g);
  const fat     = asNum(nut?.fat_g);

  // "High" requires every one of the four core macros
  const hasAllCoreMacros = cal !== null && protein !== null && carbs !== null && fat !== null;
  // "Medium" requires at least 2
  const coreCount = [cal, protein, carbs, fat].filter((v) => v !== null).length;

  const verdictLabel = deriveVerdictLabel(intelligence);
  const backendLevel = String(
    intelligence?.confidence?.level || intelligence?.nutrition?.confidence || ""
  ).toLowerCase().trim();

  let confidenceLevel;
  if (!verdictLabel) {
    // No verdict derivable — nutrition values too sparse. Must be Low.
    confidenceLevel = "Low";
  } else if (backendLevel === "high" && hasAllCoreMacros) {
    confidenceLevel = "High";
  } else if (backendLevel === "medium" || coreCount >= 2) {
    confidenceLevel = "Medium";
  } else {
    confidenceLevel = "Low";
  }

  return { verdictLabel, confidenceLevel };
}

function buildPreparationNutritionNote(section) {
  if (!section) return null;
  const method = section.cooking_method;
  const coating = section.coating;
  const sauce = section.sauce_style;
  const isBreaded = coating && !["None", "none", ""].includes(String(coating).trim());
  const isCreamy = sauce && /cream/i.test(String(sauce));
  const isLightMethod = method && ["Grilled", "Baked", "Roasted", "Steamed"].includes(method);
  if (method === "Fried" && isBreaded) return "Breaded and fried preparation raises fat and calorie load significantly.";
  if (method === "Fried") return "Fried preparation generally adds more fat than grilled or baked methods.";
  if (isLightMethod && !isBreaded && isCreamy) return "Light cooking method, but creamy sauce increases richness and calorie density.";
  if (isLightMethod && !isBreaded && !isCreamy) return "No breading or heavy sauce keeps the item lighter.";
  if (isLightMethod && isBreaded) return "Breaded preparation can raise fat and calorie load even with a lighter cooking method.";
  if (isCreamy) return "Creamy sauce increases richness and calorie density.";
  return section.impact_line || null;
}

// ── Design Tokens ────────────────────────────────────────────

const VERDICT_THEMES = {
  "Light Choice":        { bg: "linear-gradient(135deg, rgba(22,120,60,0.95), rgba(28,90,55,0.93))",   label: "rgba(168,255,188,0.97)", eye: "rgba(168,255,188,0.60)" },
  "Balanced Choice":     { bg: "linear-gradient(135deg, rgba(16,50,118,0.97), rgba(32,68,140,0.93))",  label: "rgba(180,212,255,0.97)", eye: "rgba(180,212,255,0.60)" },
  "Indulgent":           { bg: "linear-gradient(135deg, rgba(138,70,0,0.97), rgba(176,100,0,0.92))",   label: "rgba(255,218,148,0.97)", eye: "rgba(255,218,148,0.60)" },
  "Maximum Indulgence":  { bg: "linear-gradient(135deg, rgba(98,18,8,0.99), rgba(158,38,18,0.95))",    label: "rgba(255,188,168,0.97)", eye: "rgba(255,188,168,0.58)" },
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

function KeyValueGrid({ rows }) {
  if (!rows?.length) return null;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 14, paddingBottom: 10, borderBottom: "1px solid rgba(20,33,27,0.08)" }}>
          <div style={{ fontSize: 13, color: "#5a695f", fontWeight: 700 }}>{row.label}</div>
          <div style={{ fontSize: 14, color: "#15241d", fontWeight: 800, textAlign: "right" }}>{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function SignalList({ title, values }) {
  if (!values?.length) return null;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f" }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {values.map((v) => <BadgePill key={`${title}-${v}`} tone="default">{v}</BadgePill>)}
      </div>
    </div>
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

// ── Verdict Block ────────────────────────────────────────────

function VerdictBlock({ verdictLabel, confidenceLevel, intelligence, isMobile, t }) {
  const label = verdictLabel;
  const explanations = deriveVerdictExplanations(intelligence);

  if (!label) {
    // Fallback: limited data
    return (
      <Surface style={{ marginTop: 20, padding: isMobile ? 22 : 28, background: "linear-gradient(135deg, rgba(18,28,23,0.96), rgba(38,58,47,0.94))", color: "#f8f6ef" }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.52)", marginBottom: 10 }}>
          Estimated Insight
        </div>
        <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>
          Limited nutrition information available
        </div>
        <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.65)" }}>
          Based on preparation style and similar dish patterns
        </div>
        {confidenceLevel && (
          <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>
            Confidence: {normalizeLabel(confidenceLevel)}
          </div>
        )}
      </Surface>
    );
  }

  const theme = VERDICT_THEMES[label] || VERDICT_THEMES["Balanced Choice"];

  return (
    <Surface style={{ marginTop: 20, padding: isMobile ? 22 : 28, background: theme.bg, color: "#f8f6ef" }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.eye, marginBottom: 10 }}>
        {t("menuItemDetail.verdict", "Verdict")}
      </div>
      <div style={{ fontSize: isMobile ? 32 : 44, fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.04em", color: theme.label }}>
        {label}
      </div>
      {explanations.map((line, i) => (
        <div key={i} style={{ marginTop: i === 0 ? 12 : 6, fontSize: 15, lineHeight: 1.5, color: "rgba(255,255,255,0.84)", fontWeight: 700 }}>
          {line}
        </div>
      ))}
      {confidenceLevel && (
        <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.44)", fontWeight: 700 }}>
          Confidence: {normalizeLabel(confidenceLevel)}
        </div>
      )}
    </Surface>
  );
}

// ── Nutrition ────────────────────────────────────────────────

function nutritionPairs(intelligenceNutrition, nutritionChip) {
  const source = intelligenceNutrition || nutritionChip || {};
  return [
    { labelKey: "menuItemDetail.metric.calories", fallback: "Calories", value: formatMetricValue(source?.calories_kcal) },
    { labelKey: "menuItemDetail.metric.protein",  fallback: "Protein",  value: formatMetricValue(source?.protein_g, "g") },
    { labelKey: "menuItemDetail.metric.carbs",    fallback: "Carbs",    value: formatMetricValue(source?.carbs_g, "g") },
    { labelKey: "menuItemDetail.metric.fat",      fallback: "Fat",      value: formatMetricValue(source?.fat_g, "g") },
    { labelKey: "menuItemDetail.metric.fiber",    fallback: "Fiber",    value: formatMetricValue(source?.fiber_g, "g") },
    { labelKey: "menuItemDetail.metric.sugar",    fallback: "Sugar",    value: formatMetricValue(source?.sugar_g, "g") },
    { labelKey: "menuItemDetail.metric.sodium",   fallback: "Sodium",   value: formatMetricValue(source?.sodium_mg, "mg") },
  ].filter((e) => e.value);
}

function NutritionCard({ intelligenceNutrition, nutritionChip, t }) {
  const pairs = nutritionPairs(intelligenceNutrition, nutritionChip);
  const satiety    = intelligenceNutrition?.satiety_label    || nutritionChip?.satiety_label    || null;
  const glycemic   = intelligenceNutrition?.glycemic_label   || nutritionChip?.glycemic_label   || null;
  const confidence = intelligenceNutrition?.confidence       || null;
  const localizedConfidence = localizeCanonicalLabel(t, "menuItemDetail.confidence", normalizeLabel(confidence)) || confidence;

  const portionSizeOz = intelligenceNutrition?.portion_size_oz ?? null;
  const perOz = intelligenceNutrition?.per_oz || null;
  const perOzRows = perOz
    ? [
        { label: "Calories / oz", value: formatPerOzValue(perOz?.calories_kcal) },
        { label: "Protein / oz",  value: formatPerOzValue(perOz?.protein_g, "g") },
        { label: "Carbs / oz",    value: formatPerOzValue(perOz?.carbs_g, "g") },
        { label: "Fat / oz",      value: formatPerOzValue(perOz?.fat_g, "g") },
        { label: "Sodium / oz",   value: formatPerOzValue(perOz?.sodium_mg, "mg") },
      ].filter((r) => r.value)
    : [];

  if (!pairs.length) {
    // Fallback: no nutrition data available
    return (
      <SectionCard title={t("menuItemDetail.nutritionTitle", "Nutrition")} eyebrow={t("menuItemDetail.decisionData", "Decision Data")}>
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#15241d" }}>
            Limited nutrition information available
          </div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55, color: "#425149" }}>
            Based on preparation style and similar dish patterns
          </div>
          {intelligenceNutrition?.interpretation ? (
            <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5, color: "#425149", fontWeight: 700 }}>
              {translateInsightText(t, intelligenceNutrition.interpretation)}
            </div>
          ) : null}
          {confidence && (
            <div style={{ marginTop: 14, fontSize: 12, color: "#617167", fontWeight: 700 }}>
              Confidence: {normalizeLabel(confidence)}
            </div>
          )}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={t("menuItemDetail.nutritionTitle", "Nutrition")} eyebrow={t("menuItemDetail.decisionData", "Decision Data")}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
        {pairs.map((entry) => (
          <div key={entry.fallback} style={{ borderRadius: 18, border: "1px solid rgba(20,33,27,0.08)", background: "#fbfaf6", padding: "14px 12px" }}>
            <div style={{ fontSize: 12, color: "#617167", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t(entry.labelKey, entry.fallback)}
            </div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: "#15241d" }}>
              {entry.value}
            </div>
          </div>
        ))}
      </div>

      {(satiety || glycemic || confidence) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {satiety   ? <BadgePill tone="positive">{translateInsightText(t, satiety)}</BadgePill>   : null}
          {glycemic  ? <BadgePill tone="accent">{translateInsightText(t, glycemic)}</BadgePill>    : null}
          {confidence ? (
            <BadgePill tone="default">
              {t("menuItemDetail.confidenceChip", "", { confidence: localizedConfidence })}
            </BadgePill>
          ) : null}
        </div>
      )}

      {portionSizeOz ? (
        <div style={{ marginTop: 16, borderRadius: 18, border: "1px solid rgba(20,33,27,0.08)", background: "#fbfaf6", padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f" }}>Portion Assumption</div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: "#15241d" }}>
            Estimated portion: {formatPerOzValue(portionSizeOz, " oz")}
          </div>
          <div style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.45, color: "#425149" }}>
            Total nutrition above is based on the assumed portion size. Confirm with the restaurant if needed.
          </div>
        </div>
      ) : null}

      {perOzRows.length ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f", marginBottom: 10 }}>Nutrition Per Ounce</div>
          <KeyValueGrid rows={perOzRows} />
        </div>
      ) : null}

      {intelligenceNutrition?.interpretation ? (
        <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5, color: "#425149", fontWeight: 700 }}>
          {translateInsightText(t, intelligenceNutrition.interpretation)}
        </div>
      ) : null}
    </SectionCard>
  );
}

// ── Nutrition Signals Row ────────────────────────────────────

function signalChipStyle(level) {
  return SIGNAL_CHIP_COLORS[level] || SIGNAL_CHIP_COLORS.default;
}

function NutritionSignalsRow({ intelligenceNutrition, nutritionChip, insightScores }) {
  const nut = intelligenceNutrition || nutritionChip;
  if (!nut) return null;

  const scores = insightScores || {};
  const chips = [];

  const protein = asNum(nut.protein_g);
  const sodium  = asNum(nut.sodium_mg);
  const fiber   = asNum(nut.fiber_g);

  // Protein
  if (protein !== null) {
    const level = scores.protein_strength?.level ||
      (protein >= 28 ? "excellent" : protein >= 20 ? "good" : protein >= 12 ? "moderate" : "low");
    const s = signalChipStyle(level);
    chips.push({ id: "protein", label: "Protein", value: `${Math.round(protein)}g`, ...s });
  }

  // Glycemic Impact
  if (scores.glycemic_impact?.level) {
    const level = scores.glycemic_impact.level;
    const s = signalChipStyle(level === "low" ? "excellent" : level);
    chips.push({ id: "glycemic", label: "Glycemic", value: normalizeLabel(level), ...s });
  } else if (nut.glycemic_label) {
    chips.push({ id: "glycemic", label: "Glycemic", value: nut.glycemic_label, ...SIGNAL_CHIP_COLORS.default });
  }

  // Sodium
  if (sodium !== null) {
    const level = scores.sodium_risk?.level ||
      (sodium >= 1600 ? "very_high" : sodium >= 1200 ? "high" : sodium >= 800 ? "moderate" : "low");
    const s = signalChipStyle(level);
    chips.push({ id: "sodium", label: "Sodium", value: `${Math.round(sodium)}mg`, ...s });
  }

  // Lasting Energy
  if (scores.lasting_energy?.level) {
    const level = scores.lasting_energy.level;
    const s = signalChipStyle(level);
    chips.push({ id: "lasting", label: "Lasting Energy", value: normalizeLabel(level), ...s });
  }

  // Fiber — first-class signal
  if (fiber !== null) {
    const level = fiber >= 5 ? "excellent" : fiber >= 3 ? "good" : "low";
    const s = signalChipStyle(level);
    const display = fiber % 1 === 0 ? `${fiber}g` : `${fiber.toFixed(1)}g`;
    chips.push({ id: "fiber", label: "Fiber", value: display, ...s });
  }

  if (!chips.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
      {chips.map((chip) => (
        <div key={chip.id} style={{ display: "inline-flex", flexDirection: "column", borderRadius: 14, padding: "8px 12px", background: chip.bg, border: chip.border, minWidth: 60 }}>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: chip.color, opacity: 0.72 }}>
            {chip.label}
          </div>
          <div style={{ marginTop: 3, fontSize: 14, fontWeight: 900, color: chip.color, letterSpacing: "-0.02em" }}>
            {chip.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Insights + Food Quality ──────────────────────────────────

function InsightsAndFoodQualityCard({ item, section, insightScores, t }) {
  const chipsData = item?.chips || {};
  const insightsChip = chipsData.insights;
  const hasInsights = item.nutritionChip?.status === "available" && insightsChip != null;
  const hasFoodQuality = !!section;

  if (!hasInsights && !hasFoodQuality) return null;

  return (
    <Surface style={{ padding: 22 }}>
      {hasInsights && (
        <>
          <Eyebrow>{t("menuItemDetail.insights", "Insights")}</Eyebrow>
          <h2 style={{ margin: "0 0 16px", fontSize: 22, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#16241d" }}>
            {t("menuItemDetail.insightsTitle", "Item Analysis")}
          </h2>
          <NutritionSignalsRow
            intelligenceNutrition={item.intelligence?.nutrition}
            nutritionChip={item.nutritionChip}
            insightScores={insightScores}
          />
          <InsightCardDeck item={item} colors={{ text: "#14211b", subtext: "#5a695f", chipBg: "transparent" }} />
        </>
      )}

      {hasInsights && hasFoodQuality && (
        <div style={{ marginTop: 24, marginBottom: 20, borderTop: "1px solid rgba(20,33,27,0.08)" }} />
      )}

      {hasFoodQuality && (
        <>
          <Eyebrow>{t("menuItemDetail.processingLevel", "Processing Assessment")}</Eyebrow>
          <h2 style={{ margin: "0 0 16px", fontSize: 22, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#16241d" }}>
            {t("menuItemDetail.foodQuality", "Food Quality")}
          </h2>
          {section.processing_level ? (
            <div style={{
              padding: 16, borderRadius: 18,
              background: section.processing_level.includes("Highly")
                ? "linear-gradient(135deg, rgba(184,94,21,0.13), rgba(255,255,255,0.75))"
                : section.processing_level.includes("Whole")
                ? "linear-gradient(135deg, rgba(38,120,74,0.12), rgba(255,255,255,0.75))"
                : "linear-gradient(135deg, rgba(18,75,163,0.10), rgba(255,255,255,0.75))",
              border: "1px solid rgba(20,33,27,0.08)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f" }}>
                Processing level
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "#15241d" }}>
                {translateInsightText(t, section.processing_level)}
              </div>
              {section.processing_reason ? (
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.45, color: "#425149" }}>
                  {translateInsightText(t, section.processing_reason)}
                </div>
              ) : null}
              {section.user_impact ? (
                <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, color: "#425149", fontWeight: 700 }}>
                  What this means: {translateInsightText(t, section.user_impact)}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </Surface>
  );
}

// ── Preparation Card ─────────────────────────────────────────

function PreparationCard({ section, t }) {
  if (!section) return null;

  const rows = [
    section.cooking_method ? { label: "Cooking method", value: translateInsightText(t, section.cooking_method) } : null,
    section.coating        ? { label: "Coating",        value: translateInsightText(t, section.coating) }        : null,
    section.sauce_style    ? { label: "Sauce style",    value: translateInsightText(t, section.sauce_style) }    : null,
  ].filter(Boolean);

  if (!rows.length) return null;

  const nutritionNote = buildPreparationNutritionNote(section);

  return (
    <SectionCard
      title={t("menuItemDetail.preparationDetails", "Preparation")}
      eyebrow={t("menuItemDetail.whyItEatsHeavierOrLighter", "Why It Eats Heavier Or Lighter")}
    >
      <KeyValueGrid rows={rows} />
      {nutritionNote ? (
        <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.55, color: "#425149", fontWeight: 700 }}>
          {nutritionNote}
        </div>
      ) : null}
      {section.why_it_matters && section.why_it_matters !== section.impact_line ? (
        <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5, color: "#425149" }}>
          {translateInsightText(t, section.why_it_matters)}
        </div>
      ) : null}
    </SectionCard>
  );
}

// ── Ingredients Evidence ─────────────────────────────────────

function IngredientsEvidenceCard({ ingredients, section, t }) {
  const coreIngredients = getIngredientNames(ingredients).slice(0, 8);
  const hasSignals =
    section?.artificial_additives?.length || section?.artificial_colors?.length ||
    section?.preservatives?.length || section?.flavor_enhancers?.length;

  if (!coreIngredients.length && !hasSignals) return null;

  return (
    <SectionCard title="Ingredients" eyebrow="Evidence Layer">
      {coreIngredients.length ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f", marginBottom: 10 }}>
            Core ingredients
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {coreIngredients.map((name) => (
              <BadgePill key={name} tone="default">{translateInsightText(t, name)}</BadgePill>
            ))}
          </div>
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 14 }}>
        <SignalList title="Additive signals"          values={section?.artificial_additives} />
        <SignalList title="Color signals"             values={section?.artificial_colors} />
        <SignalList title="Preservative signals"      values={section?.preservatives} />
        <SignalList title="Flavor enhancer signals"   values={section?.flavor_enhancers} />
      </div>
      {ingredients?.length > 8 ? (
        <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.45, color: "#54645b" }}>
          Additional ingredient detail can be expanded later as evidence quality improves.
        </div>
      ) : null}
    </SectionCard>
  );
}

// ── Europe Card ──────────────────────────────────────────────

function EuropeCard({ section, t }) {
  if (!section) return null;
  return (
    <SectionCard title="European Standards" eyebrow="Standards Intelligence">
      <div style={{
        borderRadius: 18, padding: 16,
        background: section.restricted_ingredients?.length
          ? "linear-gradient(135deg, rgba(176,96,0,0.12), rgba(255,255,255,0.78))"
          : section.scrutiny_ingredients?.length
          ? "linear-gradient(135deg, rgba(18,75,163,0.10), rgba(255,255,255,0.78))"
          : "linear-gradient(135deg, rgba(38,120,74,0.10), rgba(255,255,255,0.78))",
        border: "1px solid rgba(20,33,27,0.08)",
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", color: "#15241d" }}>
          {translateInsightText(t, section.headline)}
        </div>
        {section.note ? (
          <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.45, color: "#425149", fontWeight: 700 }}>
            {translateInsightText(t, section.note)}
          </div>
        ) : null}
      </div>
      <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
        <SignalList title="More tightly restricted in Europe" values={section.restricted_ingredients} />
        <SignalList title="Facing European scrutiny"          values={section.scrutiny_ingredients} />
      </div>
    </SectionCard>
  );
}

// ── Value Card ───────────────────────────────────────────────

function ValueCard({ section, priceLabel, t }) {
  if (!section) return null;

  const score = section.value_score ?? section.score ?? null;
  const scoreDisplay = section.score_display || (score != null ? `Fair Value Score: ${score}/100` : null);
  const ratioLabel = percentFromRatio(section.price_ratio);
  const benchmarkPrice = section.local_median_price != null ? moneyFromFloat(section.local_median_price) : null;
  const detailRows = [
    benchmarkPrice ? { label: "Median price",     value: benchmarkPrice }           : null,
    ratioLabel     ? { label: "Price vs baseline", value: ratioLabel }               : null,
    section.sample_size ? { label: "Sample size", value: String(section.sample_size) } : null,
  ].filter(Boolean);

  return (
    <SectionCard title={t("menuItemDetail.valuePricingIntelligence", "Value")} eyebrow={t("menuItemDetail.worthThePrice", "Worth The Price")}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 16, alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#15241d" }}>
            {translateInsightText(t, section.label || "Fair value")}
          </div>
          <div style={{ marginTop: 6, fontSize: 15, color: "#425149", fontWeight: 800 }}>
            {translateInsightText(t, section.explanation || section.interpretation)}
          </div>
          {priceLabel ? (
            <div style={{ marginTop: 6, fontSize: 13, color: "#5a695f", fontWeight: 700 }}>Current price: {priceLabel}</div>
          ) : null}
          {scoreDisplay ? (
            <div style={{ marginTop: 10, fontSize: 14, color: "#15241d", fontWeight: 900 }}>{scoreDisplay}</div>
          ) : null}
        </div>
        {score != null ? (
          <div style={{ minWidth: 92, textAlign: "center", borderRadius: 16, padding: "12px 10px", background: "rgba(20,33,27,0.05)", border: "1px solid rgba(20,33,27,0.08)" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, color: "#5a695f" }}>Score</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em", color: "#15241d" }}>{score}</div>
          </div>
        ) : null}
      </div>
      {detailRows.length ? <div style={{ marginTop: 16 }}><KeyValueGrid rows={detailRows} /></div> : null}
      {section.basis?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {section.basis.map((reason) => (
            <BadgePill key={reason} tone="default">{translateInsightText(t, reason)}</BadgePill>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}

// ── Compact Confidence ───────────────────────────────────────

// `level` comes from resolveEvidenceState — guaranteed consistent with the verdict.
// `notes` are the backend trust notes (optional, for extra context). At most 1 shown.
function CompactConfidence({ level, notes, t }) {
  if (!level) return null;
  const note = Array.isArray(notes) ? notes[0] : null;
  return (
    <div style={{
      padding: "12px 16px",
      borderRadius: 14,
      background: "rgba(20,33,27,0.04)",
      border: "1px solid rgba(20,33,27,0.07)",
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: "#617167", textTransform: "uppercase", letterSpacing: "0.10em" }}>
        Confidence:
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#15241d" }}>
        {level}
      </span>
      {note && (
        <span style={{ fontSize: 12, color: "#617167", lineHeight: 1.4 }}>
          — {translateInsightText(t, note)}
        </span>
      )}
    </div>
  );
}

// ── Explore Similar Dishes ───────────────────────────────────

function ExploreSimilarDishes({ itemId, t }) {
  const [similar, setSimilar] = useState(null);
  const [failed, setFailed]   = useState(false);

  useEffect(() => {
    if (!itemId) return undefined;
    let cancelled = false;
    fetch(`${BACKEND_BASE}/menu-items/${encodeURIComponent(itemId)}/similar`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!cancelled) setSimilar(Array.isArray(json?.similar) ? json.similar : []);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [itemId]);

  if (failed || similar === null || similar.length === 0) return null;

  return (
    <SectionCard
      title={t("menuItemDetail.exploreSimilarDishes", "Explore Similar Dishes")}
      eyebrow={t("menuItemDetail.keepExploring", "Keep Exploring")}
      style={{ marginTop: 24 }}
    >
      <div style={{ display: "grid", gap: 14 }}>
        {similar.map((entry) => (
          <div key={entry.id} style={{ borderRadius: 18, border: "1px solid rgba(20,33,27,0.08)", background: "#fbfaf6", padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5a695f", marginBottom: 10 }}>
              {entry.restaurant_name}
            </div>
            <Link to={`/menu-items/${entry.id}`} style={{ textDecoration: "none", color: "#124ba3", fontWeight: 800, fontSize: 15, lineHeight: 1.35 }}>
              {entry.name}
            </Link>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function MenuItemDetailPage() {
  const { id, restaurantSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  const geoLat = searchParams.get("lat");
  const geoLng = searchParams.get("lng");

  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");
  const [rawItem,  setRawItem]  = useState(null);

  const item = useMemo(() => (rawItem ? normalizeResultItem(rawItem) : null), [rawItem]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");
      setRawItem(null);

      try {
        const geoSuffix = geoLat && geoLng ? `?lat=${geoLat}&lng=${geoLng}` : "";
        const tryUrls = [
          `${BACKEND_BASE}/menu-items/${encodeURIComponent(id)}${geoSuffix}`,
          `${BACKEND_BASE}/public/items/${encodeURIComponent(id)}`,
        ];

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

  const intelligence = item.intelligence || {};
  const integrity = rawItem?.integrity || null;
  const isBrokenFranchiseLink = integrity?.status === "broken_franchise_link";

  // Single source of truth — both verdict label and confidence level come from here.
  // They CANNOT contradict each other.
  const evidenceState = resolveEvidenceState(intelligence);
  const showRestaurantLogo = hasRenderableImage(item.restaurant.logoUrl);
  const showItemPhoto = item.restaurant.isPro === true && hasRenderableImage(item.itemPhotoUrl);
  const heroGridColumns = isMobile ? "1fr" : showItemPhoto ? "minmax(0, 1.4fr) minmax(280px, 0.95fr)" : "1fr";

  return (
    <PageShell isMobile={isMobile}>

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
              <h1 style={{ margin: 0, fontSize: isMobile ? 34 : 46, lineHeight: 0.96, letterSpacing: "-0.05em", color: "#15241d", maxWidth: 760 }}>
                {item.name}
              </h1>
              {priceLabel ? (
                <div style={{ marginTop: 10, fontSize: isMobile ? 24 : 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#7a5b20" }}>
                  {priceLabel}
                </div>
              ) : null}
            </div>

            {item.description ? (
              <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "#405048", maxWidth: 760 }}>
                {item.description}
              </div>
            ) : null}

            {(item.badges.vegan || item.badges.glutenFree || item.badges.deal) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {item.badges.vegan      ? <BadgePill tone="positive">{t("diet.vegan", "Vegan")}</BadgePill>              : null}
                {item.badges.glutenFree ? <BadgePill tone="accent">{t("diet.gluten_free", "Gluten Free")}</BadgePill>    : null}
                {item.badges.deal       ? <BadgePill tone="caution">{t("common.deals", "Deal")}</BadgePill>              : null}
              </div>
            )}

            {/* ── 2. Allergen Alert (compact, inside hero) ── */}
            <CompactAllergenAlert section={intelligence.allergen_alerts} t={t} />
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

      {/* ── 3. Verdict Block ── */}
      <VerdictBlock
        verdictLabel={evidenceState.verdictLabel}
        confidenceLevel={evidenceState.confidenceLevel}
        intelligence={intelligence}
        isMobile={isMobile}
        t={t}
      />

      {/* ── Dessert Indulgence Meter (additional, for desserts) ── */}
      {intelligence.dessert_indulgence ? (
        <Surface style={{ marginTop: 16, padding: isMobile ? 22 : 28 }}>
          <IndulgenceMeter indulgence={intelligence.dessert_indulgence} />
        </Surface>
      ) : null}

      {/* ── Decision Tags ── */}
      {intelligence.decision_tags?.length ? (
        <Surface style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>{t("menuItemDetail.decisionTags", "Decision Tags")}</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {intelligence.decision_tags.map((tag) => (
              <BadgePill
                key={tag}
                tone={
                  /High Sodium|Very High Sodium|Highly Processed/.test(tag) ? "caution" :
                  /High Protein|Good Value|Minimally Processed/.test(tag)   ? "positive" : "accent"
                }
              >
                {translateInsightText(t, tag)}
              </BadgePill>
            ))}
          </div>
        </Surface>
      ) : null}

      {/* ── 4. Nutrition Card (full-width, prominent) ── */}
      <div style={{ marginTop: 22 }}>
        <NutritionCard intelligenceNutrition={intelligence.nutrition} nutritionChip={item.nutritionChip} t={t} />
      </div>

      {/* ── 5. Insights Row (full-width) ── */}
      <div style={{ marginTop: 18 }}>
        <InsightsAndFoodQualityCard
          item={item}
          section={intelligence.ingredients_processing}
          insightScores={item.insightScores}
          t={t}
        />
      </div>

      {/* ── 6. Secondary cards: Preparation, Ingredients, Europe, Value ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
        gap: 18,
        marginTop: 22,
      }}>
        <PreparationCard section={intelligence.preparation} t={t} />
        <IngredientsEvidenceCard ingredients={item.ingredients} section={intelligence.ingredients_processing} t={t} />
        <EuropeCard section={intelligence.europe_standards} t={t} />
        <ValueCard section={intelligence.value} priceLabel={priceLabel} t={t} />
      </div>

      {/* ── 7. Compact Confidence ── */}
      {evidenceState.confidenceLevel ? (
        <Surface style={{ marginTop: 18, padding: "16px 20px" }}>
          <CompactConfidence
            level={evidenceState.confidenceLevel}
            notes={intelligence.confidence?.notes}
            t={t}
          />
        </Surface>
      ) : null}

      {/* ── 8. Explore Similar Dishes ── */}
      <ExploreSimilarDishes itemId={item.id} t={t} />

    </PageShell>
  );
}
