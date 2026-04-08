/**
 * ============================================================
 * File: SearchResultCard.jsx
 * Path: menubloc-frontend/src/components/SearchResultCard.jsx
 * Date: 2026-03-14
 * Purpose:
 *   Search result card UI — food-first, scan-optimized.
 *   - Grouped by restaurant (restaurant header, muted)
 *   - Menu items as primary content
 *   - Badges inline after item name: Popular → Deal → GF → Vegan
 *   - Price: whole dollars only, right-aligned, minWidth 64
 *   - Chips in order: Nutrition → Insights → Show Similar
 *   - Nutrition chip now uses NutritionCard (includes Allergen Alert)
 *   - Insights chip toggles InsightCardDeck (real chip-driven data only)
 *     Data derived entirely from existing row payload — no new fetches.
 *   - Footer CTA: "View Menu" → canonical /restaurants/:slugOrId/menu
 *
 *   2026-03-10 update:
 *   - Public restaurant profile links now prefer /restaurants/:slugOrId
 *   - Menu links now prefer canonical /restaurants/:slugOrId/menu
 *
 *   2026-03-14 update:
 *   - Nutrition chip expanded to use NutritionCard component.
 *   - hasNut check includes allergen presence so chip lights up
 *     when allergens are inferred even without calorie data.
 *
 *   2026-04-03 update:
 *   - compact dish share controls added to item rows
 *
 *   Design lock:
 *   Shared search-result typography and card styling must inherit
 *   from the Grubbid canonical design system.
 * ============================================================
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import IndulgenceMeter from "./IndulgenceMeter.jsx";
import ShareButton from "./share/ShareButton.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import InsightCardDeck, { buildInsightCards } from "./InsightCardDeck.jsx";
import { resolveIndulgencePresentation } from "../lib/indulgencePresentation.js";
import {
  buildCanonicalMenuPath,
  buildDishShareData,
  getCanonicalMenuItemPath,
} from "./share/shareUtils.js";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import {
  getQualitativeLabel,
  getNutritionSummary,
  computeInsights,
} from "../lib/nutritionInsights.js";

/* ---- Helpers ---- */

function asStr(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

function asNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const c = v.replace(/[^\d.-]/g, "");
    if (!c) return null;
    const n = Number(c);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pick(obj, keys, fallback) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && asStr(v) !== "") return v;
  }
  return fallback !== undefined ? fallback : "";
}

function asBool(v) {
  if (v === true) return true;
  if (v === false || v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "yes" || s === "1";
  }
  return false;
}

function normalizeAllergenList(rawAllergens) {
  if (!Array.isArray(rawAllergens)) return [];
  return rawAllergens
    .map((value) =>
      asStr(value)
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1));
}

function normalizeAllergenSource(source) {
  const normalized = asStr(source).toLowerCase();
  if (normalized === "chain_official") return "chain_official";
  if (normalized === "reference_dataset") return "reference_dataset";
  return normalized || "";
}

function getAllergenTone(source) {
  const normalized = normalizeAllergenSource(source);
  if (normalized === "chain_official") {
    return {
      background: "rgba(188, 37, 37, 0.10)",
      border: "1px solid rgba(188, 37, 37, 0.24)",
      color: "#9f2323",
      badgeBackground: "#b91c1c",
      badgeColor: "#fff7f7",
    };
  }

  return {
    background: "rgba(202, 138, 4, 0.10)",
    border: "1px solid rgba(107, 114, 128, 0.18)",
    color: "#8a5b00",
    badgeBackground: "rgba(107, 114, 128, 0.14)",
    badgeColor: "#5b6472",
  };
}

function AllergenIndicator({ chip, compact = false, containsLabel = "Contains", estimatedLabel = "estimated" }) {
  const allergens = normalizeAllergenList(chip?.allergens);
  if (!allergens.length) return null;

  const source = normalizeAllergenSource(chip?.source);
  const tone = getAllergenTone(source);
  const isEstimated = source === "reference_dataset";

  return (
    <div
      style={{
        marginTop: compact ? 8 : 10,
        padding: compact ? "8px 10px" : "9px 12px",
        borderRadius: compact ? 12 : 14,
        background: tone.background,
        border: tone.border,
        color: tone.color,
        display: "inline-flex",
        alignSelf: "flex-start",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        maxWidth: "100%",
      }}
    >
      <div style={{ fontSize: compact ? 12 : 13, lineHeight: 1.35, fontWeight: 700 }}>
        {`⚠️ ${containsLabel}: ${allergens.join(", ")}`}
      </div>
      {isEstimated ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 999,
            padding: "4px 8px",
            background: tone.badgeBackground,
            color: tone.badgeColor,
            fontSize: 11,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
        >
          {estimatedLabel}
        </span>
      ) : null}
    </div>
  );
}

/* Whole dollars only — no cents on search cards */
function fmtPrice(row) {
  const d = asNum(row?.price) ?? asNum(row?.item?.price);
  if (d !== null) return "$" + Math.round(d);
  const m = asNum(row?.price_minor_units) ?? asNum(row?.item?.price_minor_units);
  if (m !== null) return "$" + Math.round(m / 100);
  const c = asNum(row?.price_cents) ?? asNum(row?.item?.price_cents);
  if (c !== null) return "$" + Math.round(c / 100);
  return "";
}

function escRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hl(text, query) {
  const t = asStr(text);
  const q = asStr(query);
  if (!t || !q) return t;
  const re = new RegExp("(" + escRe(q) + ")", "ig");
  const parts = t.split(re);
  if (parts.length <= 1) return t;
  return parts.map((p, i) =>
    i % 2 === 1
      ? React.createElement(
          "span",
          { key: i, style: { fontWeight: 900 } },
          p
        )
      : React.createElement("span", { key: i }, p)
  );
}

function getItemId(row) {
  return asStr(pick(row, ["menu_item_id", "menuItemId", "id"]));
}
function getRestId(row) {
  return asStr(pick(row, ["restaurant_id", "restaurantId", "id"]));
}
function getRestSlug(row) {
  return asStr(pick(row, ["restaurant_slug", "restaurantSlug", "slug"]));
}
function getRestName(row, language = "en") {
  const record = row?.restaurant && typeof row.restaurant === "object" ? row.restaurant : row;
  return (
    getLocalizedField(record, "restaurant_name", language) ||
    getLocalizedField(record, "name", language) ||
    asStr(pick(row, ["restaurant_name", "restaurantName", "name", "title"], "Restaurant"))
  );
}
function getItemName(row, language = "en") {
  const record = row?.item && typeof row.item === "object" ? row.item : row;
  return (
    getLocalizedField(record, "search_display_name", language) ||
    getLocalizedField(record, "menu_item_name", language) ||
    getLocalizedField(record, "item_name", language) ||
    getLocalizedField(record, "name", language) ||
    asStr(
      pick(
        row,
        ["search_display_name", "menu_item_name", "menuItemName", "item_name", "dish", "name"],
        "Menu item"
      )
    )
  );
}

function normalizeTier(raw) {
  const s = asStr(raw).toLowerCase();
  if (!s) return "";
  if (s.includes("pro")) return "pro";
  if (s.includes("verified")) return "verified";
  return "";
}

const ALLOWED_CUISINES = new Set([
  "american",
  "barbecue",
  "bbq",
  "breakfast",
  "british",
  "cajun",
  "caribbean",
  "chinese",
  "coffee",
  "deli",
  "french",
  "greek",
  "indian",
  "italian",
  "japanese",
  "korean",
  "mediterranean",
  "mexican",
  "middle eastern",
  "southern",
  "spanish",
  "thai",
  "turkish",
  "vegan",
  "vietnamese",
]);

function toTitleCase(value) {
  return asStr(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getCuisineLike(x) {
  const raw = asStr(pick(x, ["cuisine", "restaurant_cuisine"], ""));
  const normalized = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized || !ALLOWED_CUISINES.has(normalized)) return "";
  return toTitleCase(normalized);
}

function getPhoneLike(x) {
  return asStr(pick(x, ["phone", "restaurant_phone"], ""));
}

function getAddressLine1Like(x) {
  return asStr(pick(x, ["address_line1", "restaurant_address_line1"], ""));
}

function getCityLike(x) {
  return asStr(pick(x, ["city", "restaurant_city"], ""));
}

function getStateLike(x) {
  return asStr(pick(x, ["state", "restaurant_state"], ""));
}

function getPostalCodeLike(x) {
  return asStr(pick(x, ["postal_code", "restaurant_postal_code"], ""));
}

function getDistanceMilesLike(x) {
  const n = asNum(pick(x, ["distance_miles", "restaurant_distance_miles"], null));
  return n === null ? null : n;
}

function getProfileTierLike(x) {
  return normalizeTier(
    pick(
      x,
      ["profile_tier", "restaurant_profile_tier", "listing_status", "restaurant_listing_status"],
      ""
    )
  );
}

function getPopular(row) {
  const clickCount = asNum(
    pick(row, ["click_count", "clicks", "popularity_click_count", "restaurant_click_count"], null)
  );
  return clickCount !== null && clickCount >= 10000;
}

/*
 * resolveChips / resolveItemFlag
 *
 * The search API returns rows as { item: { chips, is_vegan, ... }, restaurant: {...} }.
 * normalizeRows spreads the outer object, so chips and item-level flags live at
 * row.item.chips / row.item.is_vegan — NOT at row.chips / row.is_vegan.
 * These helpers check the top-level first (for any legacy flat shapes) and fall
 * back to the nested item object.
 */
function resolveChips(row) {
  return row?.chips || row?.item?.chips || {};
}

function resolveItemFlag(row, key) {
  const top = row?.[key];
  if (top != null) return top;
  return row?.item?.[key] ?? null;
}

/* ---- Nutrition + Insights bar panels ---- */

function BarRow({ label, pct, valueLabel, qualLabel, color, indent }) {
  const fill = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: indent ? "2px 0" : "4px 0", paddingLeft: indent ? 12 : 0 }}>
      <div style={{ width: indent ? 56 : 68, fontSize: indent ? 12 : 13, color: indent ? "#9ca3af" : "#667085", flexShrink: 0 }}>
        {indent && <span style={{ marginRight: 4, opacity: 0.5 }}>·</span>}{label}
      </div>
      <div style={{ flex: 1, maxWidth: 160, height: indent ? 4 : 6, background: "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${fill}%`, height: "100%", background: color, opacity: indent ? 0.55 : 0.75, borderRadius: 3 }} />
      </div>
      <div style={{ minWidth: 48, fontSize: indent ? 12 : 13, fontWeight: 700, color: "#344054", textAlign: "right", flexShrink: 0 }}>
        {valueLabel}
        {qualLabel && (
          <span style={{ marginLeft: 4, fontWeight: 500, color: "#9ca3af", fontSize: 11 }}>
            ({qualLabel})
          </span>
        )}
      </div>
    </div>
  );
}

function NutritionPanel({ chip }) {
  const r = (v) => (v != null && Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
  const r1 = (v) => (v != null && Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : null);
  const cal         = r(chip?.calories_kcal);
  const pro         = r(chip?.protein_g);
  const carbs       = r(chip?.carbs_g);
  const netCarbs    = r1(chip?.net_carbs);
  const fiber       = r1(chip?.fiber_g);
  const sug         = r1(chip?.sugar_g);
  const fat         = r(chip?.fat_g);
  const sod         = r(chip?.sodium_mg);
  const satiety     = r(chip?.satiety_score);
  const satietyLbl  = chip?.satiety_label || null;
  const glycemic    = r(chip?.glycemic_score);
  const glycemicLbl = chip?.glycemic_label || null;

  // Per-ounce — only present when chain official serving size was available
  const servingOz    = r1(chip?.serving_weight_oz);
  const proPerOz     = r1(chip?.protein_per_oz);
  const carbsPerOz   = r1(chip?.carbs_per_oz);
  const netCarbsPerOz = r1(chip?.net_carbs_per_oz);
  const sodPerOz     = r(chip?.sodium_per_oz);
  const fiberPerOz   = r1(chip?.fiber_per_oz);
  const hasPerOz = servingOz !== null;

  const hasValues = cal !== null || pro !== null || fat !== null || sod !== null;
  if (!hasValues) {
    return <div style={{ fontSize: 14, color: "#9ca3af" }}>Nutrition info unavailable for this item yet.</div>;
  }

  const summary = getNutritionSummary(chip);

  return (
    <div>
      {cal   !== null && <BarRow label="Calories" pct={(cal   / 2000) * 100} valueLabel={String(cal)}   qualLabel={getQualitativeLabel("calories", cal)} color="#e07b39" />}
      {pro   !== null && <BarRow label="Protein"  pct={(pro   / 50)   * 100} valueLabel={`${pro}g`}    qualLabel={getQualitativeLabel("protein", pro)}  color="#1a9a4a" />}
      {carbs !== null && <BarRow label="Carbs"    pct={(carbs / 275)  * 100} valueLabel={`${carbs}g`}  qualLabel={getQualitativeLabel("carbs", carbs)}  color="#b87a00" />}
      {netCarbs !== null && (
        <BarRow label="Net carbs" pct={(netCarbs / 150) * 100} valueLabel={`${netCarbs}g`} qualLabel={null} color="#b87a00" indent />
      )}
      {fiber !== null && <BarRow label="Fiber"    pct={(fiber / 28)   * 100} valueLabel={`${fiber}g`}  qualLabel={getQualitativeLabel("fiber", fiber)}  color="#6b7280" indent />}
      {sug   !== null && <BarRow label="Sugar"    pct={(sug   / 50)   * 100} valueLabel={`${sug}g`}    qualLabel={getQualitativeLabel("sugar", sug)}    color="#8b5cf6" indent />}
      {fat   !== null && <BarRow label="Fat"      pct={(fat   / 65)   * 100} valueLabel={`${fat}g`}    qualLabel={getQualitativeLabel("fat", fat)}      color="#b87a00" />}
      {sod   !== null && <BarRow label="Sodium"   pct={(sod   / 2300) * 100} valueLabel={`${sod}mg`}   qualLabel={getQualitativeLabel("sodium", sod)}   color="#c0392b" />}

      {hasPerOz && (
        <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(18,34,28,0.04)", border: "1px solid rgba(18,34,28,0.08)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", letterSpacing: "0.04em", marginBottom: 5, textTransform: "uppercase" }}>
            Per oz · {servingOz} oz serving
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
            {proPerOz !== null && <span style={{ fontSize: 12, color: "#344054" }}><span style={{ fontWeight: 700 }}>{proPerOz}g</span> protein/oz</span>}
            {carbsPerOz !== null && netCarbsPerOz !== null && <span style={{ fontSize: 12, color: "#344054" }}><span style={{ fontWeight: 700 }}>{netCarbsPerOz}g</span> net carbs/oz</span>}
            {carbsPerOz !== null && netCarbsPerOz === null && <span style={{ fontSize: 12, color: "#344054" }}><span style={{ fontWeight: 700 }}>{carbsPerOz}g</span> carbs/oz</span>}
            {sodPerOz !== null && <span style={{ fontSize: 12, color: "#344054" }}><span style={{ fontWeight: 700 }}>{sodPerOz}mg</span> sodium/oz</span>}
            {fiberPerOz !== null && <span style={{ fontSize: 12, color: "#344054" }}><span style={{ fontWeight: 700 }}>{fiberPerOz}g</span> fiber/oz</span>}
          </div>
        </div>
      )}

      {(satiety !== null || glycemic !== null) && (
        <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {satiety !== null && (
            <div style={{ fontSize: 13, color: "#344054" }}>
              <span style={{ color: "#667085" }}>Satiety </span>
              <span style={{ fontWeight: 700 }}>{satiety}/10</span>
              {satietyLbl && <span style={{ color: "#9ca3af", marginLeft: 4 }}>· {satietyLbl}</span>}
            </div>
          )}
          {glycemic !== null && (
            <div style={{ fontSize: 13, color: "#344054" }}>
              <span style={{ color: "#667085" }}>Glycemic </span>
              <span style={{ fontWeight: 700 }}>{glycemic}/10</span>
              {glycemicLbl && <span style={{ color: "#9ca3af", marginLeft: 4 }}>· {glycemicLbl}</span>}
            </div>
          )}
        </div>
      )}

      <AllergenIndicator chip={chip} />
      {summary && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#344054", fontWeight: 600, lineHeight: 1.4 }}>
          {summary}
        </div>
      )}
      {chip?.disclosure && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#93a0b2", fontStyle: "italic", lineHeight: 1.4 }}>
          {chip.disclosure}
        </div>
      )}
    </div>
  );
}

/* ---- Insights panel ---- */

// Backend score key → display metadata
const INSIGHT_DEFS = [
  { backendKey: "protein_strength", clientKey: "proteinStrength", label: "High Protein",       positive: true  },
  { backendKey: "protein_quality",  clientKey: null,               label: "Protein Quality",    positive: true  },
  { backendKey: "glycemic_impact",  clientKey: "glycemicImpact",   label: "Blood Sugar Impact", positive: false, levelOverrides: { "high": "High Spike", "very high": "Very High Spike" } },
  { backendKey: "sodium_risk",      clientKey: "sodiumRisk",        label: "Sodium Load",        positive: false },
  { backendKey: "lasting_energy",   clientKey: "lastingEnergy",     label: "Lasting Energy",     positive: true  },
];

// Dynamic accent: green=good end, red=bad end for each metric direction
function levelAccent(positive, score) {
  if (positive) {
    if (score >= 8) return "#1a9a4a";
    if (score >= 6) return "#2d7dd2";
    if (score >= 4) return "#9ca3af";
    return "#e05252";
  } else {
    if (score >= 8) return "#c0392b";
    if (score >= 6) return "#e07b39";
    if (score >= 4) return "#9ca3af";
    return "#1a9a4a";
  }
}

// Add directional emoji marker and optional level-name override
function formatLevel(positive, level, levelOverrides) {
  if (!level) return level;
  const key = level.toLowerCase();
  const raw = levelOverrides?.[key] ?? level;
  if (positive) {
    if (key === "excellent" || key === "good" || key === "high") return `${raw} ✅`;
    if (key === "low") return `${raw} ⚠️`;
  } else {
    if (key === "very high" || key === "high") return `${raw} ⚠️`;
    if (key === "low") return `${raw} ✅`;
  }
  return raw;
}

// Convert numeric score to raw level string for client-side path
function scoreToLevel(positive, score) {
  if (positive) {
    if (score >= 8) return "excellent";
    if (score >= 6) return "good";
    if (score >= 4) return "moderate";
    return "low";
  } else {
    if (score >= 8) return "very high";
    if (score >= 6) return "high";
    if (score >= 4) return "moderate";
    return "low";
  }
}

function buildSummary(rows) {
  const clean = (l) =>
    String(l || "")
      .replaceAll("✅", "")
      .replaceAll("⚠️", "")
      .trim()
      .toLowerCase();
  const goods = rows
    .filter((r) => r.positive && ["excellent", "good", "high"].includes(clean(r.level)))
    .map((r) => r.label.toLowerCase());
  const bads = rows
    .filter((r) => !r.positive && ["high", "very high", "high spike", "very high spike"].some((k) => clean(r.level).startsWith(k)))
    .map((r) => r.label.toLowerCase());
  if (!goods.length && !bads.length) return null;
  if (goods.length && bads.length)
    return `⚖️ Strong on ${goods.join(" & ")} — watch ${bads.join(" & ")}`;
  if (goods.length) return `✅ Strong on ${goods.join(" & ")}`;
  return `⚠️ Watch: high ${bads.join(" & ")}`;
}

function InsightsPanel({ chips, onFindSimilar }) {
  const nutChip       = chips?.nutrition_chip || {};
  const backendScores = chips?.insights?.scores;
  const clientScores  = computeInsights(nutChip);

  const rows = INSIGHT_DEFS.map(({ backendKey, clientKey, label, positive, levelOverrides }) => {
    // Prefer backend score (includes prep-aware explanation)
    const bs = backendScores?.[backendKey];
    if (bs && bs.score !== null && Number.isFinite(bs.score)) {
      const rawLevel = bs.level || scoreToLevel(positive, bs.score);
      return {
        label, positive,
        accent: levelAccent(positive, bs.score),
        score: bs.score,
        level: formatLevel(positive, rawLevel, levelOverrides),
        explanation: bs.explanation || null,
      };
    }
    // Client fallback — no explanation available
    const cs = clientScores[clientKey];
    if (cs === null || cs === undefined) return null;
    const rawLevel = scoreToLevel(positive, Math.round(cs));
    return {
      label, positive,
      accent: levelAccent(positive, Math.round(cs)),
      score: Math.round(cs),
      level: formatLevel(positive, rawLevel, levelOverrides),
      explanation: null,
    };
  }).filter(Boolean);

  if (!rows.length) {
    return <div style={{ fontSize: 14, color: "#9ca3af" }}>Not enough data to compute insights.</div>;
  }

  const summary = buildSummary(rows);

  return (
    <div>
      {summary && (
        <div style={{ fontSize: 12, color: "#667085", marginBottom: 10, fontStyle: "italic" }}>
          {summary}
        </div>
      )}
      {rows.map(({ label, accent, score, level, explanation }) => (
        <div key={label} style={{ padding: "6px 0", borderBottom: "1px solid #f0f2f5" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#344054" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{level}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>({score}/10)</span>
          </div>
          {explanation && (
            <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
              {"\u2192"} {explanation}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={onFindSimilar}
        style={{
          marginTop: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 14px",
          borderRadius: 999,
          border: "1px solid #d0d5dd",
          background: "#f2f4f7",
          color: "#344054",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Find Similar →
      </button>
    </div>
  );
}

/* ---- Query-specific precision explanation line ---- */

function PrecisionLine({ chip }) {
  const line = chip?.precision_line;
  if (!line) return null;
  return (
    <div
      style={{
        marginTop: 5,
        fontSize: 12,
        fontWeight: 700,
        color: "#2d6a4f",
        letterSpacing: "0.01em",
        lineHeight: 1.4,
      }}
    >
      {line}
    </div>
  );
}

/* ---- Chip button ---- */

function Chip({ label, active, available, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: 700,
        lineHeight: 1,
        cursor: "pointer",
        border: active
          ? "1px solid #11211a"
          : available
          ? "1px solid #d0d5dd"
          : "1px solid #e4e7ec",
        background: active ? "#11211a" : available ? "#f2f4f7" : "#f7f9fc",
        color: active ? "#fff" : available ? "#344054" : "#9ca3af",
      }}
    >
      {label}
    </button>
  );
}

function DessertSearchPanel({ presentation }) {
  if (!presentation?.indulgence) return null;

  return (
    <div
      style={{
        marginTop: 10,
        padding: "12px 14px",
        borderRadius: 16,
        background: "linear-gradient(135deg, rgba(255,247,237,1), rgba(255,255,255,1))",
        border: "1px solid rgba(249,115,22,0.18)",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2410c", marginBottom: 8 }}>
        {presentation.verdict || "Indulgent"}
      </div>
      <IndulgenceMeter indulgence={presentation.indulgence} />
      {presentation.interpretation ? (
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.45, color: "#7c2d12", fontWeight: 700 }}>
          {presentation.interpretation}
        </div>
      ) : null}
    </div>
  );
}

/* ---- Detail panel content ---- */

function DetailPanel({ tab, row, similarItems, onFindSimilar, labels }) {
  const chips = resolveChips(row);
  const nutChip = chips?.nutrition_chip || {};
  const indulgencePresentation = resolveIndulgencePresentation({ chips });

  const muted = { color: "#9ca3af" };
  const wrap = {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #e4e7ec",
    fontSize: "14px",
    color: "#11211a",
    lineHeight: 1.5,
    maxWidth: 560,
  };

  if (tab === "nutrition") {
    return (
      <div style={wrap}>
        <NutritionPanel chip={nutChip} />
      </div>
    );
  }

  if (tab === "insights") {
    return (
      <div style={wrap}>
        <InsightsPanel chips={chips} onFindSimilar={onFindSimilar} />
      </div>
    );
  }

  if (tab === "similar") {
    const groups = Array.isArray(similarItems) ? similarItems : [];
    return (
      <div style={wrap}>
        {groups.length > 0 ? (
          <div style={{ display: "grid", gap: 14 }}>
            {groups.map(({ restaurant_id, restaurant_name, items: siItems }) => (
              <div key={restaurant_id || restaurant_name}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#667085",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {restaurant_name}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {(Array.isArray(siItems) ? siItems : []).map((si) => {
                    const siName = getItemName(si);
                    const siPrice = fmtPrice(si);
                    const siId = getItemId(si);
                    const siHref = siId ? "/menu-items/" + siId : null;
                    const similarIndulgence = resolveIndulgencePresentation(si);
                    return (
                      <div
                        key={siId || siName}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#11211a",
                            minWidth: 0,
                          }}
                        >
                          {siHref ? (
                            <Link
                              to={siHref}
                              style={{ color: "#11211a", textDecoration: "none" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecoration = "underline";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecoration = "none";
                              }}
                            >
                              {siName}
                            </Link>
                          ) : (
                            siName
                          )}
                          {similarIndulgence?.indulgence ? (
                            <div style={{ marginTop: 4, fontSize: "11.5px", color: "#b45309", fontWeight: 800 }}>
                              Indulgent · {similarIndulgence.indulgence.score}/100
                            </div>
                          ) : null}
                        </div>
                        {siPrice ? (
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              color: "#11211a",
                              flexShrink: 0,
                            }}
                          >
                            {siPrice}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span style={muted}>{labels.noSimilar}</span>
        )}
      </div>
    );
  }

  return null;
}

/* ---- Single item row ---- */

function ItemRow({ row, query, similarItems, labels, language, geo }) {
  const [openTab, setOpenTab] = useState(null);

  const mid = getItemId(row);
  const name = getItemName(row, language);
  const chips = resolveChips(row);
  const indulgencePresentation = resolveIndulgencePresentation({ chips });
  const hrefBase = mid ? getCanonicalMenuItemPath({
    restaurant: {
      slug: getRestSlug(row),
      id: getRestId(row),
    },
    menuItem: { id: mid },
  }) : null;
  const href = hrefBase && geo?.lat != null && geo?.lng != null
    ? `${hrefBase}?lat=${geo.lat}&lng=${geo.lng}`
    : hrefBase;
  const price = fmtPrice(row);
  const dishShareData = mid ? buildDishShareData({
    restaurant: {
      id: getRestId(row),
      slug: getRestSlug(row),
      name: getRestName(row, language),
      logoUrl: pick(row, ["restaurant_logo_url", "logo_url"], row?.restaurant?.logo_url || row?.restaurant?.logoUrl || null),
    },
    menuItem: {
      id: mid,
      name,
      item_photo_url: pick(row, ["item_photo_url", "itemPhotoUrl", "photo_url", "image_url"], row?.item?.item_photo_url || row?.item?.photo_url || row?.item?.image_url || null),
      restaurant_logo_url: pick(row, ["restaurant_logo_url", "logo_url"], row?.restaurant?.logo_url || row?.restaurant?.logoUrl || null),
    },
  }) : null;
  const popular = getPopular(row);
  const hasDeal = asBool(resolveItemFlag(row, "has_active_deal"));
  const isVegan = asBool(resolveItemFlag(row, "is_vegan"));
  const isGF = asBool(resolveItemFlag(row, "is_gluten_free"));

  const nutChip = chips?.nutrition_chip || {};

  // Nutrition chip is "available" (lights up blue) when any of:
  // - actual nutrient values present
  // - allergens have been inferred
  const hasNut =
    asStr(nutChip?.status).toLowerCase() === "available" ||
    asNum(nutChip.calories_kcal) !== null ||
    asNum(nutChip.protein_g) !== null ||
    asNum(nutChip.fat_g) !== null ||
    asNum(nutChip.sodium_mg) !== null ||
    asNum(nutChip.sugar_g) !== null ||
    (Array.isArray(nutChip.allergens) && nutChip.allergens.length > 0) ||
    String(nutChip.allergen_alert || "").trim().length > 0;

  const insightScores = computeInsights(nutChip);
  const hasIns =
    buildInsightCards(row).length > 0 ||
    insightScores.proteinStrength !== null ||
    insightScores.glycemicImpact  !== null ||
    insightScores.sodiumRisk      !== null;
  const hasSimilar = Array.isArray(similarItems) && similarItems.length > 0;

  function toggle(tab) {
    setOpenTab((prev) => (prev === tab ? null : tab));
  }

  return (
    <div
      style={{
        paddingTop: 10,
        paddingBottom: 10,
        borderBottom: "1px solid #e4e7ec",
      }}
    >
      {/* Name + price — left-anchored, not pushed apart */}
      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 20px" }}>
        <span
          style={{
            fontSize: "20px",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {href ? (
            <Link
              to={href}
              style={{ color: "#11211a", textDecoration: "none" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
                e.currentTarget.style.textUnderlineOffset = "3px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {hl(name, query)}
            </Link>
          ) : (
            hl(name, query)
          )}
        </span>

	        {price ? (
	          <span
            style={{
              fontSize: "16px",
              fontWeight: 800,
              whiteSpace: "nowrap",
              color: "#667085",
            }}
	          >
	            {price}
	          </span>
	        ) : null}
          {dishShareData ? (
            <ShareButton
              variant="dish"
              label="Share Dish"
              modalTitle={`Share ${name}`}
              shareData={dishShareData}
              analyticsContext={{
                restaurantId: getRestId(row),
                restaurantSlug: getRestSlug(row) || null,
                menuItemId: mid,
                menuItemName: name,
                pageType: "search_results",
                shareTarget: "dish",
              }}
              iconOnly
              stopPropagation
            />
          ) : null}
      </div>

      {/* Badges */}
      {(popular || hasDeal || isGF || isVegan) && (
        <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {popular && <DietBadge label="★ Popular" tone="popular" />}
          {hasDeal && <DietBadge label="🏷 Deal" tone="deal" />}
          {isGF && <DietBadge label="GF" tone="gf" />}
          {isVegan && <DietBadge label="🌿 Vegan" tone="vegan" />}
        </div>
      )}

      <AllergenIndicator chip={nutChip} compact containsLabel={labels.contains} estimatedLabel={labels.estimated} />
      <PrecisionLine chip={nutChip} />
      {indulgencePresentation ? <DessertSearchPanel presentation={indulgencePresentation} /> : null}

      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {!indulgencePresentation ? (
          <Chip
            label={labels.nutrition}
            active={openTab === "nutrition"}
            available={hasNut}
            onClick={() => toggle("nutrition")}
          />
        ) : null}
        {!indulgencePresentation && hasIns ? (
          <Chip
            label={labels.insights}
            active={openTab === "insights"}
            available={true}
            onClick={() => toggle("insights")}
          />
        ) : null}
        {hasSimilar && (
          <Chip
            label={labels.showSimilar}
            active={openTab === "similar"}
            available={true}
            onClick={() => toggle("similar")}
          />
        )}
      </div>

      {openTab && (
        <DetailPanel
          tab={openTab}
          row={row}
          similarItems={similarItems}
          onFindSimilar={() => toggle("similar")}
          labels={labels}
        />
      )}
    </div>
  );
}

/* ---- Small diet/status badge (non-interactive) ---- */

function DietBadge({ label, tone }) {
  const tones = {
    deal: { background: "#fff8e8", borderColor: "#e8cf9c", color: "#7a5600" },
    vegan: { background: "#eefcf2", borderColor: "#b9e2c3", color: "#27643a" },
    gf: { background: "#f2f4f7", borderColor: "#d0d5dd", color: "#344054" },
    popular: { background: "#fff1f1", borderColor: "#f1c0c0", color: "#8a2f2f" },
  };
  const t = tones[tone] || {};
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "3px 8px",
        fontSize: "12px",
        fontWeight: 700,
        lineHeight: 1,
        border: "1px solid " + (t.borderColor || "#e4e7ec"),
        background: t.background || "#f7f9fc",
        color: t.color || "#667085",
        userSelect: "none",
      }}
    >
      {label}
    </span>
  );
}

/* ---- Card shell ---- */

const cardStyle = {
  border: "1px solid var(--gb-color-border)",
  borderRadius: "var(--gb-radius-card)",
  background: "var(--gb-color-surface-strong)",
  padding: "12px 14px",
  boxShadow: "var(--gb-shadow-card)",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

function RestaurantMeta({ cuisine, phone, distanceMiles, profileTier, locationCount }) {
  const pieces = [];
  if (cuisine) pieces.push(cuisine);
  if (distanceMiles !== null) pieces.push(`${distanceMiles.toFixed(1)} mi`);

  const tierLabel = profileTier === "pro" ? "Pro" : profileTier === "verified" ? "Verified" : "";
  const tierStyle =
    profileTier === "pro"
      ? { background: "#f2f4f7", border: "1px solid #d0d5dd", color: "#344054" }
      : profileTier === "verified"
      ? { background: "#ecfff4", border: "1px solid #b9e7c9", color: "#1f6a3c" }
      : null;

  return (
    <div
      style={{
        marginBottom: 8,
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {tierLabel ? (
        <span
          style={{
            fontSize: "var(--text-2, 13px)",
            fontWeight: 800,
            borderRadius: 999,
            padding: "2px 8px",
            ...tierStyle,
          }}
        >
          {tierLabel}
        </span>
      ) : null}
      {pieces.length > 0 ? (
        <span
          style={{
            fontSize: "var(--text-2, 13px)",
            color: "var(--muted, #5b6675)",
            fontWeight: 650,
          }}
        >
          {pieces.join(" • ")}
        </span>
      ) : null}
      {locationCount > 1 ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 999,
            padding: "2px 7px",
            background: "rgba(45,106,79,0.08)",
            border: "1px solid rgba(45,106,79,0.2)",
            color: "#2d6a4f",
            whiteSpace: "nowrap",
          }}
        >
          {locationCount} nearby locations
        </span>
      ) : null}
      {phone ? (
        <a
          href={`tel:${String(phone).replace(/[^\d+]/g, "")}`}
          title={phone}
          aria-label={`Call ${phone}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "var(--chip-bg, #f2f4f7)",
            border: "1px solid var(--border2, #d0d5dd)",
            color: "var(--muted, #5b6675)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </a>
      ) : null}
    </div>
  );
}

/* ---- Main export ---- */

export default function SearchResultCard({ restaurant, items, item, query, crossRestaurantItems, geo }) {
  const location = useLocation();
  const { language, t } = useLanguage();
  const contextSearch = location.search || "";
  const labels = {
    contains: t("common.allergensContains", "Contains"),
    estimated: t("common.estimated"),
    nutrition: t("common.nutrition", "Nutrition"),
    insights: t("common.insights", "Insights"),
    showSimilar: t("common.showSimilar", "Show Similar"),
    noSimilar: t("common.noSimilarNearby", "No similar items found nearby."),
    viewMenu: t("common.viewMenu"),
  };
  const grouped = Array.isArray(items) && items.length > 0;

  if (grouped) {
    const restId = asStr(restaurant?.restaurant_id || restaurant?.id);
    const restSlug = asStr(restaurant?.restaurant_slug || restaurant?.slug);
    const restName =
      getLocalizedField(restaurant, "restaurant_name", language) ||
      getLocalizedField(restaurant, "name", language) ||
      asStr(restaurant?.restaurant_name || restaurant?.name) ||
      getRestName(items[0], language);
    const cuisine = getCuisineLike(restaurant) || getCuisineLike(items[0]);
    const phone = getPhoneLike(restaurant) || getPhoneLike(items[0]);
    const distanceMiles = getDistanceMilesLike(restaurant) ?? getDistanceMilesLike(items[0]);
    const profileTier = getProfileTierLike(restaurant) || getProfileTierLike(items[0]);
    const locationCount = asNum(restaurant?.location_count) ?? asNum(restaurant?.raw?.location_count) ?? null;

    const restProfileTarget = restSlug || restId;
    const restHref = restProfileTarget ? "/restaurants/" + restProfileTarget : null;
    const menuHref = restId
      ? buildCanonicalMenuPath({ restaurantSlug: restSlug, restaurantId: restId }) + contextSearch
      : null;

    const similarItems = Array.isArray(crossRestaurantItems)
      ? crossRestaurantItems.filter((x) => asStr(x.restaurant_id) !== restId)
      : [];

    return (
      <article className="gb-card" style={cardStyle}>
        <div style={{ marginBottom: 2 }}>
          {restHref ? (
            <Link
              to={restHref}
              style={{
                fontSize: "var(--text-3, 16px)",
                fontWeight: 800,
                color: "var(--muted, #5b6675)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {restName}
            </Link>
          ) : (
            <span
              style={{
                fontSize: "var(--text-3, 16px)",
                fontWeight: 800,
                color: "var(--muted, #5b6675)",
              }}
            >
              {restName}
            </span>
          )}
        </div>

        <RestaurantMeta
          cuisine={cuisine}
          phone={phone}
          distanceMiles={distanceMiles}
          profileTier={profileTier}
          locationCount={locationCount}
        />

        <div>
          {items.map((row) => {
            const mid = getItemId(row);
            const nm = getItemName(row, language);
            return <ItemRow key={mid || nm} row={row} query={query} similarItems={similarItems} labels={labels} language={language} geo={geo} />;
          })}
        </div>

        {menuHref && (
          <div style={{ marginTop: 10 }}>
            <Link
              to={menuHref}
              style={{
                fontSize: "var(--text-3, 15px)",
                fontWeight: 800,
                color: "var(--link, #11211a)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {labels.viewMenu}
            </Link>
          </div>
        )}
      </article>
    );
  }

  const isItemRow = Boolean(item?.menu_item_id || item?.menu_item_name);
  const restIdS = getRestId(item);
  const restSlugS = getRestSlug(item);
  const restNameS = getRestName(item, language);
  const cuisineS = getCuisineLike(item);
  const phoneS = getPhoneLike(item);
  const addressLine1S = getAddressLine1Like(item);
  const cityS = getCityLike(item);
  const stateS = getStateLike(item);
  const postalS = getPostalCodeLike(item);
  const distanceMilesS = getDistanceMilesLike(item);
  const profileTierS = getProfileTierLike(item);
  const restProfileTargetS = restSlugS || restIdS;
  const restHrefS = restProfileTargetS ? "/restaurants/" + restProfileTargetS : null;
  const menuHrefS = restIdS
    ? buildCanonicalMenuPath({ restaurantSlug: restSlugS, restaurantId: restIdS }) + contextSearch
    : null;
  const similarItemsS = Array.isArray(crossRestaurantItems)
    ? crossRestaurantItems.filter((x) => asStr(x.restaurant_id) !== restIdS)
    : [];

  if (isItemRow) {
    return (
      <article className="gb-card" style={cardStyle}>
        {restHrefS && (
          <div style={{ marginBottom: 2 }}>
            <Link
              to={restHrefS}
              style={{
                fontSize: "var(--text-3, 16px)",
                fontWeight: 800,
                color: "var(--muted, #5b6675)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {restNameS}
            </Link>
          </div>
        )}
        <RestaurantMeta
          cuisine={cuisineS}
          phone={phoneS}
          distanceMiles={distanceMilesS}
          profileTier={profileTierS}
        />
        <ItemRow row={item} query={query} similarItems={similarItemsS} labels={labels} language={language} geo={geo} />
        {menuHrefS && (
          <div style={{ marginTop: 10 }}>
            <Link
              to={menuHrefS}
              style={{
                fontSize: "var(--text-3, 15px)",
                fontWeight: 800,
                color: "var(--link, #11211a)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {labels.viewMenu}
            </Link>
          </div>
        )}
      </article>
    );
  }

  const cityStateLine = [cityS, stateS ? (postalS ? `${stateS} ${postalS}` : stateS) : postalS]
    .filter(Boolean)
    .join(", ");
  const detailPieces = [
    distanceMilesS !== null ? `${distanceMilesS.toFixed(1)} mi away` : null,
    phoneS || null,
  ].filter(Boolean);

  return (
    <article className="gb-card" style={cardStyle}>
      {/* Restaurant name */}
      <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.01em", color: "#11211a" }}>
        {restHrefS ? (
          <Link
            to={restHrefS}
            style={{ color: "#11211a", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.textUnderlineOffset = "3px"; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
          >
            {hl(restNameS, query)}
          </Link>
        ) : (
          hl(restNameS, query)
        )}
      </div>

      {/* Cuisine tag */}
      {cuisineS && (
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: "#667085" }}>
          {cuisineS}
        </div>
      )}

      {/* Address — line 1: street, line 2: City, ST ZIP */}
      {(addressLine1S || cityStateLine) && (
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 500, color: "#475467", lineHeight: 1.5 }}>
          {addressLine1S && <div>{addressLine1S}</div>}
          {cityStateLine && <div>{cityStateLine}</div>}
        </div>
      )}

      {/* Distance · Phone */}
      {detailPieces.length > 0 && (
        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500, color: "#667085" }}>
          {detailPieces.join(" · ")}
        </div>
      )}

      {menuHrefS && (
        <div style={{ marginTop: 12 }}>
          <Link
            to={menuHrefS}
            style={{ fontSize: 15, fontWeight: 800, color: "#11211a", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
          >
            {labels.viewMenu}
          </Link>
        </div>
      )}
    </article>
  );
}
