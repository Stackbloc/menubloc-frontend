/**
 * ============================================================
 * File: SearchResultCard.jsx
 * Path: menubloc-frontend/src/components/SearchResultCard.jsx
 * Date: 2026-05-06
 * Purpose:
 *   Search result card UI — food-first, scan-optimized.
 *   Dark Menuply theme. Visual-only update; all logic preserved.
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  buildWhyMatchLabel,
  buildNutritionPreviewChips,
  formatPairingTeaser,
  queryRequiresNutritionDisplay,
  rowHasNutritionMacros,
} from "../lib/searchResultEnrichment.js";
import IndulgenceMeter from "./IndulgenceMeter.jsx";
import MenuItemDetailActionRail from "./menu/MenuItemDetailActionRail.jsx";
import FollowRestaurantButton from "./FollowRestaurantButton.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { buildInsightCards } from "./InsightCardDeck.jsx";
import { resolveIndulgencePresentation } from "../lib/indulgencePresentation.js";
import buildMatchPreview from "./searchResultMatchPreview.js";
import {
  appendMenuHighlightQuery,
  buildCanonicalMenuPath,
  buildDishShareData,
  getCanonicalMenuItemPath,
  highlightMenuLinkExtrasFromSearch,
} from "./share/shareUtils.js";
import { restaurantPath, restaurantMenuPath } from "../lib/canonicalUrl.js";
import { getConsumerDisplayPrice } from "../lib/pricingDisplay.js";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../utils/getDisplayMenuItemName.js";
import { trackMenuItemInteraction } from "../lib/interactionTracking.js";
import { trackBillboardClick } from "../lib/analytics.js";
import { fetchSimilarItems, fetchCompareItems, fetchMenuItemIntelligence, fetchFranchiseLocation } from "../lib/api.js";
import CompareItemsModal from "./menu/CompareItemsModal.jsx";
import { getNormalizedMenuItemId, normalizeMenuItemIdentity } from "../lib/menuItemIdentity.js";
import {
  SEARCH_CARD_NO_SIMILAR_TEXT,
  SIMILAR_INITIAL_LIMIT,
  SIMILAR_PAGE_SIZE,
  buildSimilarStateFromResponse,
  cacheSimilarState,
  getCachedSimilarState,
  getSimilarMoreButtonLabel,
  isShowSimilarChipVisible,
  mergeSimilarItems,
  shouldShowSimilarMoreButton,
} from "../lib/searchCardSimilar.js";

import {
  getQualitativeLabel,
  getNutritionSummary,
  computeInsights,
} from "../lib/nutritionInsights.js";

const MATCH_LABEL = "Match:";
const SIMILAR_DIET_FILTER_KEYS = Object.freeze([
  "vegan", "vegetarian", "gluten_free", "dairy_free",
  "diabetic_friendly", "low_fat", "low_sodium", "keto",
]);
const searchCardIntelligenceCache = new Map();
const searchCardFranchiseLocationCache = new Map();

/* ---- Billboard banner (compact, search-surface) ---- */

const SEARCH_BILLBOARD_TYPE_META = {
  deal:         { label: "Deal",   badgeColor: "#FCD34D", badgeBg: "rgba(252,211,77,0.12)",   grad: "linear-gradient(135deg,#92400e,#b45309)" },
  event:        { label: "Event",  badgeColor: "#C4B5FD", badgeBg: "rgba(196,181,253,0.12)",  grad: "linear-gradient(135deg,#4c1d95,#6d28d9)" },
  menu:         { label: "New",    badgeColor: "#93C5FD", badgeBg: "rgba(147,197,253,0.12)",  grad: "linear-gradient(135deg,#1e3a5f,#1d4ed8)" },
  notice:       { label: "Notice", badgeColor: "#FCA5A5", badgeBg: "rgba(252,165,165,0.12)",  grad: "linear-gradient(135deg,#7f1d1d,#dc2626)" },
  announcement: { label: "Update", badgeColor: "#86EFAC", badgeBg: "rgba(134,239,172,0.12)",  grad: "linear-gradient(135deg,#14532d,#15803d)" },
  general:      { label: "Post",   badgeColor: "#CBD5E1", badgeBg: "rgba(203,213,225,0.12)",  grad: "linear-gradient(135deg,#1e293b,#475569)" },
};

function SearchBillboardBanner({ billboard, restaurantId = null, restaurantName = null }) {
  if (!billboard) return null;
  const meta = SEARCH_BILLBOARD_TYPE_META[billboard.post_type] || SEARCH_BILLBOARD_TYPE_META.general;
  const headline = billboard.headline || billboard.title || "";
  const sub = billboard.subheadline || null;
  if (!headline) return null;

  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 8,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          background: billboard.image_url ? "#000" : meta.grad,
          position: "relative",
        }}
      >
        {billboard.image_url && (
          <img
            src={billboard.image_url}
            alt={billboard.image_alt_text || headline}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: billboard.image_fit || "cover", display: "block" }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: "8px 10px 8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: sub ? 2 : 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 16,
              padding: "0 6px",
              borderRadius: 999,
              background: meta.badgeBg,
              color: meta.badgeColor,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {meta.label}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#E5E7EB",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {headline}
          </span>
        </div>
        {sub && (
          <div
            style={{
              fontSize: 11,
              color: "#6B7280",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {billboard.cta_label && billboard.cta_url && (
        <a
          href={billboard.cta_url}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackBillboardClick({
              restaurantId,
              restaurantName,
              billboardId: billboard.id || billboard.billboard_id || null,
              target: billboard.cta_url,
            })
          }
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            height: 28,
            padding: "0 10px",
            marginRight: 10,
            borderRadius: 6,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#E5E7EB",
            fontSize: 11,
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {billboard.cta_label}
        </a>
      )}
    </div>
  );
}

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

/* Whole dollars only — no cents on search cards */
function fmtPrice(row) {
  const cents = getConsumerDisplayPrice(row) ?? getConsumerDisplayPrice(row?.item);
  if (cents != null && cents > 0) return "$" + Math.round(cents / 100);
  if (row?.price_resolution_source === "unavailable") return "Price varies";
  return "";
}

function buildSimilarItemsLabel(meta) {
  if (!meta) return null;
  if (meta.used_broad_fallback) return "Showing broader matches because nearby similar dishes were limited";
  if (meta.radius_used_miles != null && Number(meta.radius_used_miles) > 25) return "Expanded nearby search";
  return null;
}

function buildSearchCardSimilarFilters(search) {
  const routeParams = new URLSearchParams(search || "");
  const filters = {};
  for (const key of SIMILAR_DIET_FILTER_KEYS) {
    const value = routeParams.get(key);
    if (value === "1" || value === "true") filters[key] = "1";
  }
  const city = routeParams.get("city");
  const state = routeParams.get("state");
  if (city) filters.city = city;
  if (state) filters.state = state;
  return filters;
}

function groupSimilarResultsByRestaurant(items) {
  const deduped = mergeSimilarItems([], items, (row) => row?.menu_item_id || row?.menuItemId || row?.id);
  const grouped = new Map();
  for (const item of Array.isArray(deduped) ? deduped : []) {
    const restaurantId = asStr(item?.restaurant_id);
    const restaurantName = asStr(item?.restaurant_name) || "Nearby restaurant";
    const key = restaurantId || restaurantName;
    if (!grouped.has(key)) {
      grouped.set(key, {
        restaurant_id: restaurantId || null,
        restaurant_name: restaurantName,
        items: [],
      });
    }
    grouped.get(key).items.push(item);
  }
  return Array.from(grouped.values());
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
          { key: i, style: { fontWeight: 900, color: "#FFFFFF" } },
          p
        )
      : React.createElement("span", { key: i }, p)
  );
}

function getItemId(row) {
  return asStr(getNormalizedMenuItemId(row));
}
function getRestId(row) {
  return asStr(normalizeMenuItemIdentity(row).restaurantId);
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
  return getDisplayMenuItemName(row, language, "Menu item");
}

function isFranchiseLocationDeferred(row) {
  if (!row || row.location_deferred !== true) return false;
  return !getRestId(row);
}

function mergeFranchiseLocationIntoRow(row, location) {
  if (!location) return row;
  return {
    ...row,
    location_deferred: false,
    franchise_details_available: true,
    restaurant_id: location.restaurant_id ?? row.restaurant_id ?? null,
    restaurant_name: location.restaurant_name || row.restaurant_name || row.chain_name || null,
    restaurant_slug: location.slug ?? row.restaurant_slug ?? null,
    city: location.city ?? row.city ?? null,
    state: location.state ?? row.state ?? null,
    lat: location.lat ?? row.lat ?? null,
    lng: location.lng ?? row.lng ?? null,
    distance_miles: location.distance_miles ?? row.distance_miles ?? null,
    restaurant_distance_miles: location.distance_miles ?? row.restaurant_distance_miles ?? null,
  };
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
  // Suppress null-island distances (lat=0,lng=0 computes ~5600mi from any US city)
  return n === null || n > 3000 ? null : n;
}

function getLatLike(x) {
  return asNum(pick(x, ["lat", "restaurant_lat", "latitude"], null));
}

function getLngLike(x) {
  return asNum(pick(x, ["lng", "restaurant_lng", "longitude"], null));
}

function buildGoogleMapsUrl(row) {
  const lat = getLatLike(row);
  const lng = getLngLike(row);
  if (lat !== null && lng !== null && !(lat === 0 && lng === 0)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const parts = [
    getAddressLine1Like(row),
    getCityLike(row),
    getStateLike(row),
    getPostalCodeLike(row),
  ].filter(Boolean);
  if (!parts.length) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
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

function resolveCapabilities(row) {
  return row?.capabilities && typeof row.capabilities === "object" ? row.capabilities : {};
}

function resolveChips(row) {
  return row?.chips || row?.item?.chips || {};
}

function mergeRowIntelligence(row, intelligence) {
  if (!intelligence?.chips) return row;
  return {
    ...row,
    chips: {
      ...(row?.chips || {}),
      ...intelligence.chips,
      nutrition_chip: {
        ...(row?.chips?.nutrition_chip || {}),
        ...(intelligence.chips?.nutrition_chip || {}),
      },
      insights: {
        ...(row?.chips?.insights || {}),
        ...(intelligence.chips?.insights || {}),
      },
      pairings_chip: {
        ...(row?.chips?.pairings_chip || {}),
        ...(intelligence.chips?.pairings_chip || {}),
      },
    },
    detail_system: intelligence.detail_system || row?.detail_system || null,
  };
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
      <div style={{ width: indent ? 56 : 68, fontSize: indent ? 12 : 13, color: indent ? "#6B7280" : "#9CA3AF", flexShrink: 0 }}>
        {indent && <span style={{ marginRight: 4, opacity: 0.5 }}>·</span>}{label}
      </div>
      <div style={{ flex: 1, maxWidth: 160, height: indent ? 4 : 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${fill}%`, height: "100%", background: color, opacity: indent ? 0.65 : 0.85, borderRadius: 3 }} />
      </div>
      <div style={{ minWidth: 48, fontSize: indent ? 12 : 13, fontWeight: 700, color: "#D1D5DB", textAlign: "right", flexShrink: 0 }}>
        {valueLabel}
        {qualLabel && (
          <span style={{ marginLeft: 4, fontWeight: 500, color: "#6B7280", fontSize: 11 }}>
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

  const servingOz    = r1(chip?.serving_weight_oz);
  const proPerOz     = r1(chip?.protein_per_oz);
  const carbsPerOz   = r1(chip?.carbs_per_oz);
  const netCarbsPerOz = r1(chip?.net_carbs_per_oz);
  const sodPerOz     = r(chip?.sodium_per_oz);
  const fiberPerOz   = r1(chip?.fiber_per_oz);
  const hasPerOz = servingOz !== null;

  const hasValues = cal !== null || pro !== null || fat !== null || sod !== null;
  if (!hasValues) {
    return <div style={{ fontSize: 14, color: "#6B7280" }}>Nutrition info unavailable for this item yet.</div>;
  }

  const summary = getNutritionSummary(chip);

  return (
    <div>
      {cal   !== null && <BarRow label="Calories" pct={(cal   / 2000) * 100} valueLabel={String(cal)}   qualLabel={getQualitativeLabel("calories", cal)} color="#e07b39" />}
      {pro   !== null && <BarRow label="Protein"  pct={(pro   / 50)   * 100} valueLabel={`${pro}g`}    qualLabel={getQualitativeLabel("protein", pro)}  color="#22C55E" />}
      {carbs !== null && <BarRow label="Carbs"    pct={(carbs / 275)  * 100} valueLabel={`${carbs}g`}  qualLabel={getQualitativeLabel("carbs", carbs)}  color="#b87a00" />}
      {netCarbs !== null && (
        <BarRow label="Net carbs" pct={(netCarbs / 150) * 100} valueLabel={`${netCarbs}g`} qualLabel={null} color="#b87a00" indent />
      )}
      {fiber !== null && <BarRow label="Fiber"    pct={(fiber / 28)   * 100} valueLabel={`${fiber}g`}  qualLabel={getQualitativeLabel("fiber", fiber)}  color="#6b7280" indent />}
      {sug   !== null && <BarRow label="Sugar"    pct={(sug   / 50)   * 100} valueLabel={`${sug}g`}    qualLabel={getQualitativeLabel("sugar", sug)}    color="#8b5cf6" indent />}
      {fat   !== null && <BarRow label="Fat"      pct={(fat   / 65)   * 100} valueLabel={`${fat}g`}    qualLabel={getQualitativeLabel("fat", fat)}      color="#b87a00" />}
      {sod   !== null && <BarRow label="Sodium"   pct={(sod   / 2300) * 100} valueLabel={`${sod}mg`}   qualLabel={getQualitativeLabel("sodium", sod)}   color="#c0392b" />}

      {hasPerOz && (
        <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.04em", marginBottom: 5, textTransform: "uppercase" }}>
            Per oz · {servingOz} oz serving
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
            {proPerOz !== null && <span style={{ fontSize: 12, color: "#D1D5DB" }}><span style={{ fontWeight: 700 }}>{proPerOz}g</span> protein/oz</span>}
            {carbsPerOz !== null && netCarbsPerOz !== null && <span style={{ fontSize: 12, color: "#D1D5DB" }}><span style={{ fontWeight: 700 }}>{netCarbsPerOz}g</span> net carbs/oz</span>}
            {carbsPerOz !== null && netCarbsPerOz === null && <span style={{ fontSize: 12, color: "#D1D5DB" }}><span style={{ fontWeight: 700 }}>{carbsPerOz}g</span> carbs/oz</span>}
            {sodPerOz !== null && <span style={{ fontSize: 12, color: "#D1D5DB" }}><span style={{ fontWeight: 700 }}>{sodPerOz}mg</span> sodium/oz</span>}
            {fiberPerOz !== null && <span style={{ fontSize: 12, color: "#D1D5DB" }}><span style={{ fontWeight: 700 }}>{fiberPerOz}g</span> fiber/oz</span>}
          </div>
        </div>
      )}

      {(satiety !== null || glycemic !== null) && (
        <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {satiety !== null && (
            <div style={{ fontSize: 13, color: "#D1D5DB" }}>
              <span style={{ color: "#9CA3AF" }}>Satiety </span>
              <span style={{ fontWeight: 700 }}>{satiety}/10</span>
              {satietyLbl && <span style={{ color: "#6B7280", marginLeft: 4 }}>· {satietyLbl}</span>}
            </div>
          )}
          {glycemic !== null && (
            <div style={{ fontSize: 13, color: "#D1D5DB" }}>
              <span style={{ color: "#9CA3AF" }}>Glycemic </span>
              <span style={{ fontWeight: 700 }}>{glycemic}/10</span>
              {glycemicLbl && <span style={{ color: "#6B7280", marginLeft: 4 }}>· {glycemicLbl}</span>}
            </div>
          )}
        </div>
      )}

      {summary && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#D1D5DB", fontWeight: 600, lineHeight: 1.4 }}>
          {summary}
        </div>
      )}
      {chip?.disclosure && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280", fontStyle: "italic", lineHeight: 1.4 }}>
          {chip.disclosure}
        </div>
      )}
    </div>
  );
}

/* ---- Insights panel ---- */

const INSIGHT_DEFS = [
  { backendKey: "protein_strength", clientKey: "proteinStrength", label: "High Protein",       positive: true  },
  { backendKey: "protein_quality",  clientKey: null,               label: "Protein Quality",    positive: true  },
  { backendKey: "glycemic_impact",  clientKey: "glycemicImpact",   label: "Blood Sugar Impact", positive: false, levelOverrides: { "high": "High Spike", "very high": "Very High Spike" } },
  { backendKey: "sodium_risk",      clientKey: "sodiumRisk",        label: "Sodium Load",        positive: false },
  { backendKey: "lasting_energy",   clientKey: "lastingEnergy",     label: "Lasting Energy",     positive: true  },
];

function levelAccent(positive, score) {
  if (positive) {
    if (score >= 8) return "#22C55E";
    if (score >= 6) return "#3B82F6";
    if (score >= 4) return "#6B7280";
    return "#EF4444";
  } else {
    if (score >= 8) return "#EF4444";
    if (score >= 6) return "#F97316";
    if (score >= 4) return "#6B7280";
    return "#22C55E";
  }
}

function formatLevel(positive, level, levelOverrides) {
  if (level == null || level === "") return level;
  const key = String(level).toLowerCase();
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
    .map((r) => String(r.label || "").toLowerCase());
  const bads = rows
    .filter((r) => !r.positive && ["high", "very high", "high spike", "very high spike"].some((k) => clean(r.level).startsWith(k)))
    .map((r) => String(r.label || "").toLowerCase());
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
    return <div style={{ fontSize: 14, color: "#6B7280" }}>Not enough data to compute insights.</div>;
  }

  const summary = buildSummary(rows);

  return (
    <div>
      {summary && (
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10, fontStyle: "italic" }}>
          {summary}
        </div>
      )}
      {rows.map(({ label, accent, score, level, explanation }) => (
        <div key={label} style={{ padding: "6px 0", borderBottom: "1px solid var(--gb-color-border)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#D1D5DB" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{level}</span>
            <span style={{ fontSize: 12, color: "#6B7280" }}>({score}/10)</span>
          </div>
          {explanation && (
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              {"→"} {explanation}
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
          border: "1px solid var(--gb-color-border-strong)",
          background: "var(--gb-color-surface-strong)",
          color: "var(--gb-color-ink-soft)",
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
          ? "1px solid var(--gb-color-accent)"
          : available
          ? "1px solid var(--gb-color-border-strong)"
          : "1px solid var(--gb-color-border)",
        background: active ? "var(--gb-color-accent)" : "var(--gb-color-surface-strong)",
        color: active ? "#ffffff" : available ? "var(--gb-color-ink-soft)" : "var(--gb-color-ink-muted)",
      }}
    >
      {label}
    </button>
  );
}

function CompactScoreSummary({ presentation, breadScore }) {
  const indulgence = presentation?.indulgence || null;
  const indDrivers = Array.isArray(indulgence?.drivers) ? indulgence.drivers.slice(0, 3) : [];
  const breadDrivers = Array.isArray(breadScore?.drivers) ? breadScore.drivers.slice(0, 2) : [];
  const compactDrivers = indDrivers.length > 0 ? indDrivers : breadDrivers;
  if (!indulgence && !breadScore) return null;

  return (
    <div
      style={{
        marginTop: 10,
        padding: "12px 14px",
        borderRadius: 16,
        background: "linear-gradient(135deg, rgba(180,83,9,0.10), var(--gb-color-surface-strong))",
        border: "1px solid rgba(249,115,22,0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#FB923C" }}>
          {breadScore ? "Bread Score" : "Indulgence Score"}
        </div>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#FDBA74" }}>
          {breadScore ? `${breadScore.score}` : `${indulgence.score}`}
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 800, color: "#FDBA74" }}>
        {breadScore ? breadScore.band : (indulgence.level === "indulgent" ? "Very rich" : indulgence.level === "rich" ? "Rich" : indulgence.level === "moderate" ? "Moderate" : "Lighter")}
      </div>
      {compactDrivers.length ? (
        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {compactDrivers.map((driver) => (
            <span
              key={driver}
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#FDBA74",
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: 999,
                padding: "3px 8px",
              }}
            >
              {driver}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}


function nutritionChipHasValues(chip) {
  const r = (v) => (v != null && Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
  return (
    r(chip?.calories_kcal) !== null ||
    r(chip?.protein_g) !== null ||
    r(chip?.fat_g) !== null ||
    r(chip?.sodium_mg) !== null
  );
}

function insightsPanelHasRows(chips) {
  const nutChip = chips?.nutrition_chip || {};
  const backendScores = chips?.insights?.scores;
  const clientScores = computeInsights(nutChip);
  return INSIGHT_DEFS.some(({ backendKey, clientKey }) => {
    const bs = backendScores?.[backendKey];
    if (bs && bs.score !== null && Number.isFinite(bs.score)) return true;
    const cs = clientScores[clientKey];
    return cs !== null && cs !== undefined;
  });
}

/* ---- Detail panel content ---- */

function DetailPanel({ tab, row, similarState, onFindSimilar, onCompare, onLoadMoreSimilar, labels, intelligenceLoading = false }) {
  const chips = resolveChips(row);
  const nutChip = chips?.nutrition_chip || {};
  const indulgencePresentation = resolveIndulgencePresentation({ chips });

  const muted = { color: "#6B7280" };
  const wrap = {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid var(--gb-color-border)",
    fontSize: "14px",
    color: "var(--gb-color-ink-soft)",
    lineHeight: 1.5,
    maxWidth: 560,
  };

  if (tab === "nutrition") {
    if (intelligenceLoading) {
      return (
        <div style={wrap}>
          <span style={muted}>Loading nutrition...</span>
        </div>
      );
    }
    const hasNutritionValues = nutritionChipHasValues(nutChip);
    const hasInsightsValues = insightsPanelHasRows(chips);
    return (
      <div style={wrap}>
        {hasNutritionValues ? <NutritionPanel chip={nutChip} /> : null}
        {hasInsightsValues ? (
          <div
            style={
              hasNutritionValues
                ? { marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--gb-color-border)" }
                : undefined
            }
          >
            <InsightsPanel chips={chips} onFindSimilar={onFindSimilar} />
          </div>
        ) : null}
        {!hasNutritionValues && !hasInsightsValues ? (
          <div style={{ fontSize: 14, color: "#6B7280" }}>Nutrition info unavailable for this item yet.</div>
        ) : null}
      </div>
    );
  }

  if (tab === "similar") {
    if (similarState?.status === "loading") {
      return (
        <div style={wrap}>
          <span style={muted}>Loading similar items...</span>
        </div>
      );
    }

    if (similarState?.status === "failed") {
      return (
        <div style={wrap}>
          <span style={muted}>Could not load similar items. Try again.</span>
        </div>
      );
    }

    const groups = groupSimilarResultsByRestaurant(similarState?.items || []);
    const helperLabel = buildSimilarItemsLabel(similarState?.meta || null);
    const hasMoreSimilar = shouldShowSimilarMoreButton(similarState?.pagination);
    const loadingMoreSimilar = similarState?.status === "loading_more";
    return (
      <div style={wrap}>
        {helperLabel ? (
          <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 800, color: "#9CA3AF" }}>
            {helperLabel}
          </div>
        ) : null}
        {groups.length > 0 ? (
          <div style={{ display: "grid", gap: 14 }}>
            {groups.map(({ restaurant_id, restaurant_name, items: siItems }) => (
              <div key={restaurant_id || restaurant_name}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9CA3AF",
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
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto 4.25rem",
                          alignItems: "center",
                          columnGap: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#FFFFFF",
                            minWidth: 0,
                          }}
                        >
                          {siHref ? (
                            <Link
                              to={siHref}
                              style={{ color: "#FFFFFF", textDecoration: "none" }}
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
                            <div style={{ marginTop: 4, fontSize: "11.5px", color: "#FB923C", fontWeight: 800 }}>
                              Indulgent · {similarIndulgence.indulgence.score}
                            </div>
                          ) : null}
                        </div>
                        <div style={{ justifySelf: "end" }}>
                          {siId ? (
                            <button
                              type="button"
                              onClick={() => onCompare(si)}
                              style={{
                                background: "rgba(34,197,94,0.09)",
                                border: "1px solid rgba(34,197,94,0.2)",
                                borderRadius: 999,
                                padding: "4px 10px",
                                fontSize: 11,
                                fontWeight: 800,
                                color: "#22C55E",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Compare
                            </button>
                          ) : null}
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                            color: siPrice ? "#22C55E" : "transparent",
                            textAlign: "right",
                            justifySelf: "end",
                          }}
                          aria-hidden={!siPrice}
                        >
                          {siPrice || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {hasMoreSimilar ? (
              <button
                type="button"
                onClick={onLoadMoreSimilar}
                disabled={loadingMoreSimilar}
                style={{
                  marginTop: 4,
                  alignSelf: "flex-start",
                  background: "rgba(34,197,94,0.09)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#22C55E",
                  cursor: loadingMoreSimilar ? "wait" : "pointer",
                  opacity: loadingMoreSimilar ? 0.7 : 1,
                }}
              >
                {getSimilarMoreButtonLabel({ loadingMore: loadingMoreSimilar, pageSize: SIMILAR_PAGE_SIZE })}
              </button>
            ) : null}
          </div>
        ) : (
          <span style={muted}>{labels.noSimilar}</span>
        )}
      </div>
    );
  }

  return null;
}

/* ---- Key facts (price / distance / locale / cuisine / deal) ---- */

function buildKeyFactsLine({ row, restaurantSummary, matchContext, omitPrice = false }) {
  const parts = [];
  const price = fmtPrice(row);
  if (price && !omitPrice) parts.push(price);

  const distSource =
    restaurantSummary && typeof restaurantSummary === "object"
      ? { ...row, distance_miles: restaurantSummary.distance_miles ?? row.distance_miles }
      : row;
  const dist = getDistanceMilesLike(distSource);
  const showDist =
    matchContext?.coordinateSearchActive === true || matchContext?.wantsNearby === true;
  if (showDist && dist != null && dist <= 50) parts.push(`${dist.toFixed(1)} mi`);

  const city = getCityLike(row);
  const state = getStateLike(row);
  if (city || state) parts.push([city, state].filter(Boolean).join(", "));

  const cuisine =
    (restaurantSummary && getCuisineLike(restaurantSummary)) || getCuisineLike(row);
  if (cuisine) parts.push(cuisine);

  const catRaw = asStr(pick(row, ["category", "broad_category", "restaurant_category"], ""));
  if (catRaw) {
    const catPretty = toTitleCase(catRaw.replace(/[_-]+/g, " "));
    const cuLower = asStr(cuisine).toLowerCase();
    if (!cuLower || catPretty.toLowerCase() !== cuLower) parts.push(catPretty);
  }

  if (asBool(resolveItemFlag(row, "has_active_deal"))) parts.push("Deal");

  return parts.length ? parts.join(" · ") : "";
}

function NutritionPreviewStrip({ chips, active = false, onSelect }) {
  if (!Array.isArray(chips) || !chips.length) return null;
  return (
    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
      {chips.map((c) => {
        const label = typeof c === "string" ? c : c.label;
        const primary = typeof c === "object" && c.primary === true;
        const isSelected = active === true;
        const sharedStyle = {
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 999,
          padding: "4px 10px",
          lineHeight: 1.2,
          border: "1px solid",
          transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
        };
        const selectedStyle = {
          color: "#22C55E",
          background: primary ? "rgba(34,197,94,0.10)" : "rgba(34,197,94,0.08)",
          borderColor: primary ? "rgba(34,197,94,0.28)" : "rgba(34,197,94,0.22)",
          boxShadow: "none",
        };
        const idleStyle = {
          color: "#0B0F0C",
          background: "#FFFFFF",
          borderColor: "rgba(255,255,255,0.92)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        };

        if (onSelect) {
          return (
            <button
              key={label}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${label} nutrition details`}
              onClick={onSelect}
              style={{
                ...sharedStyle,
                ...(isSelected ? selectedStyle : idleStyle),
                cursor: "pointer",
                font: "inherit",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (isSelected) return;
                e.currentTarget.style.borderColor = "rgba(34,197,94,0.45)";
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(34,197,94,0.18)";
              }}
              onMouseLeave={(e) => {
                if (isSelected) return;
                e.currentTarget.style.borderColor = idleStyle.borderColor;
                e.currentTarget.style.boxShadow = idleStyle.boxShadow;
              }}
            >
              {label}
            </button>
          );
        }

        return (
          <span
            key={label}
            style={{
              ...sharedStyle,
              ...(isSelected ? selectedStyle : idleStyle),
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function buildRefinementMatchLabel(row, refinement) {
  if (!refinement) return null;
  const chips = resolveChips(row);
  const nutChip = chips?.nutrition_chip || {};

  if (refinement.type === "nutrition" && refinement.key.includes("protein")) {
    const protein = asNum(nutChip.protein_g);
    if (protein !== null) return `${Math.round(protein)}g protein`;
  }

  if (refinement.type === "commerce") {
    if (refinement.key === "nearby" || refinement.key === "farther_out") {
      const dist = getDistanceMilesLike(row);
      if (dist !== null && dist <= 50) return `${dist.toFixed(1)} mi`;
    }
    if (refinement.key.startsWith("under_") || /^\d+_plus$/.test(refinement.key)) {
      const price = fmtPrice(row);
      if (price) return price;
    }
  }

  return null;
}

/* ---- Single item row ---- */

function ItemRow({
  row,
  query,
  queryMeta,
  matchContext,
  labels,
  language,
  geo,
  similarRequest,
  restaurantSummary = null,
  venueRenderedAbove = false,
  activeRefinement = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openTab, setOpenTab] = useState(null);
  const [similarState, setSimilarState] = useState({
    status: "idle",
    items: [],
    meta: null,
    pagination: null,
  });
  const similarRequestRef = useRef(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [currentCompareCandidate, setCurrentCompareCandidate] = useState(null);
  const [intelligenceState, setIntelligenceState] = useState({
    status: "idle",
    data: null,
  });
  const intelligenceRequestRef = useRef(0);
  const [franchiseLocationState, setFranchiseLocationState] = useState({
    status: "idle",
    location: null,
  });
  const franchiseLocationRequestRef = useRef(0);

  const mid = getItemId(row);
  const franchiseLocationDeferred = isFranchiseLocationDeferred(row);

  const intelligenceCacheKey = useMemo(() => {
    if (!mid) return "";
    return `${mid}::${geo?.lat ?? ""}::${geo?.lng ?? ""}`;
  }, [mid, geo?.lat, geo?.lng]);

  const franchiseLocationCacheKey = useMemo(() => {
    if (!mid || !franchiseLocationDeferred) return "";
    return `${mid}::${geo?.lat ?? ""}::${geo?.lng ?? ""}`;
  }, [mid, franchiseLocationDeferred, geo?.lat, geo?.lng]);

  const intelligenceRow = useMemo(() => {
    const cached = intelligenceState.data || (intelligenceCacheKey && searchCardIntelligenceCache.get(intelligenceCacheKey));
    return cached ? mergeRowIntelligence(row, cached) : row;
  }, [row, intelligenceState.data, intelligenceCacheKey]);

  const displayRow = useMemo(() => {
    const loc = franchiseLocationState.status === "ready"
      ? franchiseLocationState.location
      : null;
    if (loc) return mergeFranchiseLocationIntoRow(intelligenceRow, loc);
    return intelligenceRow;
  }, [intelligenceRow, franchiseLocationState]);

  const franchiseLocationPending =
    franchiseLocationDeferred && franchiseLocationState.status !== "ready";

  const capabilities = resolveCapabilities(displayRow);
  const name = getItemName(displayRow, language);
  const chips = resolveChips(displayRow);
  const indulgencePresentation = resolveIndulgencePresentation({ chips });
  const breadScore = displayRow?.detail_system?.bread_score || displayRow?.chips?.bread_score || null;
  const hrefBase = mid ? getCanonicalMenuItemPath({
    restaurant: {
      slug: (restaurantSummary && restaurantSummary.slug) || getRestSlug(displayRow),
      id: (restaurantSummary && restaurantSummary.id) || getRestId(displayRow),
      city: getCityLike(displayRow),
      state: getStateLike(displayRow),
    },
    menuItem: { id: mid },
  }) : null;
  const href = hrefBase && geo?.lat != null && geo?.lng != null
    ? `${hrefBase}?lat=${geo.lat}&lng=${geo.lng}`
    : hrefBase;
  const dishShareData = mid ? buildDishShareData({
    restaurant: {
      id: getRestId(displayRow),
      slug: getRestSlug(displayRow),
      name: getRestName(displayRow, language),
      logoUrl: pick(displayRow, ["restaurant_logo_url", "logo_url"], displayRow?.restaurant?.logo_url || displayRow?.restaurant?.logoUrl || null),
    },
    menuItem: {
      id: mid,
      name,
      item_photo_url: pick(row, ["item_photo_url", "itemPhotoUrl", "photo_url", "image_url"], row?.item?.item_photo_url || row?.item?.photo_url || row?.item?.image_url || null),
      restaurant_logo_url: pick(row, ["restaurant_logo_url", "logo_url"], row?.restaurant?.logo_url || row?.restaurant?.logoUrl || null),
    },
  }) : null;
  const popular = getPopular(row);
  const isVegan = asBool(resolveItemFlag(row, "is_vegan"));
  const isGF = asBool(resolveItemFlag(row, "is_gluten_free"));
  const whyLabel = buildWhyMatchLabel(displayRow, queryMeta);
  const matchPreviewFallback = whyLabel ? null : buildMatchPreview(displayRow, queryMeta, matchContext);
  const matchLineText = whyLabel || (matchPreviewFallback && matchPreviewFallback.text) || "";
  const nutritionPreviewChips = buildNutritionPreviewChips(displayRow, queryMeta);
  const nutritionQueryActive = queryRequiresNutritionDisplay(queryMeta);
  const showNutritionPreview =
    nutritionPreviewChips.length > 0 &&
    ((nutritionQueryActive && rowHasNutritionMacros(displayRow)) ||
      openTab === "nutrition" ||
      intelligenceState.status === "ready");
  const pairingTeaser = formatPairingTeaser(displayRow);
  const refinementMatchLabel = buildRefinementMatchLabel(displayRow, activeRefinement);
  const priceLabel = fmtPrice(row);

  const factsLine = venueRenderedAbove
    ? ""
    : buildKeyFactsLine({ row: displayRow, restaurantSummary, matchContext, omitPrice: Boolean(priceLabel) });

  const restDisplayName =
    (restaurantSummary &&
      (getLocalizedField(restaurantSummary, "restaurant_name", language) ||
        getLocalizedField(restaurantSummary, "name", language) ||
        asStr(restaurantSummary.name || restaurantSummary.restaurant_name))) ||
    getRestName(displayRow, language);
  const restIdForLink = (restaurantSummary && restaurantSummary.id) || getRestId(displayRow);
  const restSlugForLink = (restaurantSummary && restaurantSummary.slug) || getRestSlug(displayRow);
  const restCityForLink = getCityLike(restaurantSummary || displayRow);
  const restStateForLink = getStateLike(restaurantSummary || displayRow);
  const restProfileTarget = restSlugForLink || restIdForLink;
  const restHref = restaurantPath({ slug: restSlugForLink, city: restCityForLink, state: restStateForLink }) ||
    (restProfileTarget ? "/restaurants/" + restProfileTarget : null);
  const contextSearch = location.search || "";
  const fullMenuHref = restIdForLink && mid
    ? appendMenuHighlightQuery(
        restaurantMenuPath({ slug: restSlugForLink, city: restCityForLink, state: restStateForLink, id: restIdForLink }) ||
          buildCanonicalMenuPath({ restaurantSlug: restSlugForLink, restaurantId: restIdForLink }),
        {
          menuItemId: mid,
          extraParams: highlightMenuLinkExtrasFromSearch(contextSearch),
        },
      )
    : null;

  const nutChip = chips?.nutrition_chip || {};

  const hasNut =
    capabilities.hasNutrition === true ||
    (intelligenceState.status === "ready" && (
      asStr(nutChip?.status).toLowerCase() === "available" ||
      asNum(nutChip.calories_kcal) !== null ||
      asNum(nutChip.protein_g) !== null ||
      asNum(nutChip.fat_g) !== null ||
      asNum(nutChip.sodium_mg) !== null ||
      asNum(nutChip.sugar_g) !== null ||
      (Array.isArray(nutChip.allergens) && nutChip.allergens.length > 0)
    ));

  const insightScores = computeInsights(nutChip);
  const hasIns =
    capabilities.hasInsights === true ||
    (intelligenceState.status === "ready" && (
      buildInsightCards(displayRow).length > 0 ||
      insightScores.proteinStrength !== null ||
      insightScores.glycemicImpact  !== null ||
      insightScores.sodiumRisk      !== null
    ));
  const hasNutritionOrInsights = hasNut || hasIns;
  const intelligenceLoading = intelligenceState.status === "loading";
  // Show Similar chip is always available; similar pool is fetched only when the user opens the tab.
  const showSimilarChip = isShowSimilarChipVisible(mid);
  const similarCacheKey = useMemo(() => {
    if (!mid) return "";
    return `${mid}::${similarRequest?.cacheKey || ""}`;
  }, [mid, similarRequest]);

  useEffect(() => {
    setOpenTab(null);
    setSimilarState({ status: "idle", items: [], meta: null, pagination: null });
    setIntelligenceState({ status: "idle", data: null });
  }, [mid]);

  useEffect(() => {
    if (!franchiseLocationCacheKey) {
      setFranchiseLocationState({ status: "idle", location: null });
      return;
    }
    const cached = searchCardFranchiseLocationCache.get(franchiseLocationCacheKey);
    if (cached) {
      setFranchiseLocationState({ status: "ready", location: cached.location ?? null });
      return;
    }
    setFranchiseLocationState({ status: "idle", location: null });
  }, [franchiseLocationCacheKey]);

  async function loadFranchiseLocationForRow() {
    if (!mid || !franchiseLocationDeferred || !franchiseLocationCacheKey) return;
    if (searchCardFranchiseLocationCache.has(franchiseLocationCacheKey)) {
      setFranchiseLocationState({
        status: "ready",
        location: searchCardFranchiseLocationCache.get(franchiseLocationCacheKey).location ?? null,
      });
      return;
    }

    const requestId = franchiseLocationRequestRef.current + 1;
    franchiseLocationRequestRef.current = requestId;
    setFranchiseLocationState({ status: "loading", location: null });

    try {
      const json = await fetchFranchiseLocation(mid, {
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        city: geo?.city ?? null,
        state: geo?.state ?? null,
      });
      if (franchiseLocationRequestRef.current !== requestId) return;
      const nextLocation = json?.location ?? null;
      searchCardFranchiseLocationCache.set(franchiseLocationCacheKey, { location: nextLocation });
      setFranchiseLocationState({ status: "ready", location: nextLocation });
    } catch {
      if (franchiseLocationRequestRef.current !== requestId) return;
      setFranchiseLocationState({ status: "failed", location: null });
    }
  }

  async function loadIntelligenceForRow() {
    if (!mid || !intelligenceCacheKey) return null;
    if (searchCardIntelligenceCache.has(intelligenceCacheKey)) {
      const cached = searchCardIntelligenceCache.get(intelligenceCacheKey);
      setIntelligenceState({ status: "ready", data: cached });
      return cached;
    }

    const requestId = intelligenceRequestRef.current + 1;
    intelligenceRequestRef.current = requestId;
    setIntelligenceState({ status: "loading", data: null });

    try {
      const data = await fetchMenuItemIntelligence(mid, {
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
      });
      if (intelligenceRequestRef.current !== requestId) return data;
      searchCardIntelligenceCache.set(intelligenceCacheKey, data);
      setIntelligenceState({ status: "ready", data });
      return data;
    } catch {
      if (intelligenceRequestRef.current !== requestId) return null;
      setIntelligenceState({ status: "failed", data: null });
      return null;
    }
  }

  async function loadSimilarForRow() {
    if (!mid || !similarCacheKey) return;
    const cached = getCachedSimilarState(similarCacheKey);
    if (cached) {
      setSimilarState(cached);
      return;
    }

    const requestId = similarRequestRef.current + 1;
    similarRequestRef.current = requestId;
    setSimilarState({ status: "loading", items: [], meta: null, pagination: null });

    try {
      const json = await fetchSimilarItems(mid, {
        lat: similarRequest?.lat ?? null,
        lng: similarRequest?.lng ?? null,
        city: similarRequest?.city ?? null,
        state: similarRequest?.state ?? null,
        filters: similarRequest?.filters || {},
        limit: SIMILAR_INITIAL_LIMIT,
        offset: 0,
      });
      if (similarRequestRef.current !== requestId) return;
      const nextState = buildSimilarStateFromResponse(json);
      cacheSimilarState(similarCacheKey, nextState);
      setSimilarState(nextState);
    } catch {
      if (similarRequestRef.current !== requestId) return;
      const nextState = { status: "failed", items: [], meta: null, pagination: null };
      setSimilarState(nextState);
    }
  }

  async function loadMoreSimilarForRow() {
    if (!mid || !similarCacheKey) return;
    if (similarState.status === "loading" || similarState.status === "loading_more") return;
    if (similarState.pagination?.has_more !== true) return;

    const requestId = similarRequestRef.current + 1;
    similarRequestRef.current = requestId;
    const existingItems = similarState.items || [];
    const nextOffset = existingItems.length;
    setSimilarState((prev) => ({ ...prev, status: "loading_more" }));

    try {
      const json = await fetchSimilarItems(mid, {
        lat: similarRequest?.lat ?? null,
        lng: similarRequest?.lng ?? null,
        city: similarRequest?.city ?? null,
        state: similarRequest?.state ?? null,
        filters: similarRequest?.filters || {},
        limit: SIMILAR_PAGE_SIZE,
        offset: nextOffset,
      });
      if (similarRequestRef.current !== requestId) return;
      const nextState = buildSimilarStateFromResponse(json, { appendItems: existingItems });
      cacheSimilarState(similarCacheKey, nextState);
      setSimilarState(nextState);
    } catch {
      if (similarRequestRef.current !== requestId) return;
      setSimilarState((prev) => ({ ...prev, status: "ready" }));
    }
  }

  function markCompareIneligible(entry) {
    setSimilarState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        getItemId(item) === getItemId(entry) ? { ...item, compare_eligible: false } : item
      ),
    }));
  }

  function handleCompare(similarEntry) {
    const candidateId = getNormalizedMenuItemId(similarEntry);
    if (!mid || !candidateId) return;
    setCurrentCompareCandidate(similarEntry);
    setCompareData(null);
    setCompareError(null);
    setCompareLoading(true);
    setCompareOpen(true);
    fetchCompareItems(mid, candidateId, geo?.lat ?? null, geo?.lng ?? null, {
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

  function toggle(tab) {
    setOpenTab((prev) => {
      const next = prev === tab ? null : tab;
      if (next === "similar") {
        trackMenuItemInteraction(mid, "open_similar_items");
        if (franchiseLocationPending) void loadFranchiseLocationForRow();
        void loadSimilarForRow();
      } else if (next === "nutrition") {
        trackMenuItemInteraction(mid, "open_nutrition");
        if (franchiseLocationPending) void loadFranchiseLocationForRow();
        void loadIntelligenceForRow();
      }
      return next;
    });
  }

  return (
    <div
      style={{
        paddingTop: 16,
        paddingBottom: 16,
        borderBottom: "1px solid var(--gb-color-border)",
      }}
    >
      {/* 1. Item name + price */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: "clamp(22px, 4.5vw, 26px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#FFFFFF",
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          {href ? (
            <Link
              to={href}
              style={{ color: "#FFFFFF", textDecoration: "none" }}
              onClick={() => trackMenuItemInteraction(mid, "click")}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#22C55E";
                e.currentTarget.style.textDecoration = "underline";
                e.currentTarget.style.textUnderlineOffset = "3px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {hl(name, query)}
            </Link>
          ) : (
            hl(name, query)
          )}
        </span>
        {priceLabel ? (
          <div
            style={{
              flexShrink: 0,
              fontSize: "clamp(16px, 3.5vw, 20px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#22C55E",
              lineHeight: 1,
              paddingTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {priceLabel}
          </div>
        ) : null}
      </div>

      {/* 2. Action icons — view menu, like, share */}
      {mid || dishShareData || fullMenuHref ? (
        <div style={{ marginTop: 12, marginBottom: 2 }}>
          <MenuItemDetailActionRail
            menuItemId={mid}
            itemName={name}
            shareData={dishShareData}
            shareAnalyticsContext={{
              restaurantId: restIdForLink,
              restaurantSlug: restSlugForLink || null,
              menuItemId: mid,
              menuItemName: name,
              pageType: "search_results",
              shareTarget: "dish",
            }}
            fullMenuHref={fullMenuHref}
            iconGap={SEARCH_ITEM_ACTION_GAP}
            shareStopPropagation
          />
        </div>
      ) : null}

      {/* 3. Restaurant name + facts + diet badges — one merged line */}
      {!venueRenderedAbove && (restDisplayName || factsLine || popular || isGF || isVegan) ? (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "4px 8px",
            fontSize: 13,
            fontWeight: 600,
            color: "#9CA3AF",
            lineHeight: 1.45,
          }}
        >
          {restDisplayName ? (
            franchiseLocationPending ? (
              <>
                <span style={{ fontWeight: 800 }}>{restDisplayName}</span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void loadFranchiseLocationForRow();
                  }}
                  disabled={franchiseLocationState.status === "loading"}
                  style={{
                    font: "inherit",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#22C55E",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: franchiseLocationState.status === "loading" ? "wait" : "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  {franchiseLocationState.status === "loading"
                    ? "Loading…"
                    : franchiseLocationState.status === "failed"
                    ? "Retry details"
                    : "Details"}
                </button>
              </>
            ) : restHref ? (
              <Link
                to={restHref}
                style={{ fontWeight: 800, color: "#9CA3AF", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#22C55E";
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9CA3AF";
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                {restDisplayName}
              </Link>
            ) : (
              <span style={{ fontWeight: 800 }}>{restDisplayName}</span>
            )
          ) : null}
          {!franchiseLocationPending && restDisplayName && factsLine ? <span aria-hidden="true">·</span> : null}
          {franchiseLocationPending ? null : factsLine ? <span style={{ overflowWrap: "anywhere" }}>{factsLine}</span> : null}
          {popular && <DietBadge label="★ Popular" tone="popular" />}
          {isGF && <DietBadge label="GF" tone="gf" />}
          {isVegan && <DietBadge label="🌿 Vegan" tone="vegan" />}
        </div>
      ) : null}

      {/* 4. Why it matched — active refinement takes priority over the generic match label */}
      {(refinementMatchLabel || matchLineText) ? (
        <div
          style={{
            marginTop: 8,
            fontSize: "13px",
            lineHeight: 1.5,
            fontWeight: 700,
            overflowWrap: "anywhere",
          }}
        >
          <span style={{ color: "#22C55E", fontWeight: 800 }}>{MATCH_LABEL} </span>
          <span style={{ color: refinementMatchLabel ? "#22C55E" : "#C0C8D5" }}>
            {refinementMatchLabel || matchLineText}
          </span>
        </div>
      ) : null}

      {/* 4. Nutrition preview chips — tap to open full nutrition panel */}
      {showNutritionPreview ? (
        <NutritionPreviewStrip
          chips={nutritionPreviewChips}
          active={openTab === "nutrition"}
          onSelect={() => toggle("nutrition")}
        />
      ) : null}

      {/* Pairings teaser */}
      {pairingTeaser ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: 650,
            color: "#6B7280",
            lineHeight: 1.4,
            fontStyle: "italic",
          }}
        >
          {pairingTeaser}
        </div>
      ) : null}

      {(indulgencePresentation || breadScore) ? (
        <CompactScoreSummary presentation={indulgencePresentation} breadScore={breadScore} />
      ) : null}



      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Chip
          label={labels.nutrition}
          active={openTab === "nutrition"}
          available={hasNutritionOrInsights}
          onClick={() => toggle("nutrition")}
        />
        {showSimilarChip ? (
          <Chip
            label={labels.showSimilar}
            active={openTab === "similar"}
            available={true}
            onClick={() => toggle("similar")}
          />
        ) : null}
      </div>

      {openTab === "nutrition" && (
        <DetailPanel
          tab="nutrition"
          row={displayRow}
          similarState={similarState}
          onFindSimilar={() => {}}
          onCompare={handleCompare}
          labels={labels}
          intelligenceLoading={intelligenceLoading}
        />
      )}

      {openTab === "similar" && (
        <DetailPanel
          tab={openTab}
          row={displayRow}
          similarState={similarState}
          onFindSimilar={() => toggle("similar")}
          onCompare={handleCompare}
          onLoadMoreSimilar={() => { void loadMoreSimilarForRow(); }}
          labels={labels}
        />
      )}

      {compareOpen && (
        <CompareItemsModal
          open={compareOpen}
          loading={compareLoading}
          error={compareError}
          comparison={compareData}
          onClose={() => setCompareOpen(false)}
          onSwap={(candidateItem) => {
            setCompareOpen(false);
            const candidateId = getNormalizedMenuItemId(candidateItem) || getNormalizedMenuItemId(currentCompareCandidate);
            if (candidateId) navigate(`/menu-items/${candidateId}?from=search`);
          }}
          onViewBase={() => {
            setCompareOpen(false);
            if (href) {
              const sep = href.includes("?") ? "&" : "?";
              navigate(`${href}${sep}from=search`);
            }
          }}
        />
      )}
    </div>
  );
}

/* ---- Small diet/status badge (non-interactive) ---- */

function DietBadge({ label, tone }) {
  const tones = {
    deal:    { background: "rgba(234,179,8,0.1)",   borderColor: "rgba(234,179,8,0.25)",   color: "#FCD34D" },
    vegan:   { background: "rgba(34,197,94,0.1)",   borderColor: "rgba(34,197,94,0.25)",   color: "#22C55E" },
    gf:      { background: "var(--gb-color-surface)", borderColor: "var(--gb-color-border-strong)", color: "var(--gb-color-ink-soft)" },
    popular: { background: "rgba(239,68,68,0.1)",   borderColor: "rgba(239,68,68,0.25)",   color: "#FCA5A5" },
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
        border: "1px solid " + (t.borderColor || "var(--gb-color-border)"),
        background: t.background || "var(--gb-color-surface-strong)",
        color: t.color || "var(--gb-color-ink-muted)",
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
  padding: "16px 18px",
  boxShadow: "var(--gb-shadow-card)",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const SEARCH_ITEM_ACTION_GAP = 12;

function RestaurantMeta({ cuisine, phone, distanceMiles, profileTier, locationCount }) {
  const pieces = [];
  if (cuisine) pieces.push(cuisine);
  if (distanceMiles !== null) pieces.push(`${distanceMiles.toFixed(1)} mi`);

  const tierLabel = profileTier === "pro" ? "Pro" : profileTier === "verified" ? "Verified" : "";
  const tierStyle =
    profileTier === "pro"
      ? { background: "var(--gb-color-surface)", border: "1px solid var(--gb-color-border-strong)", color: "var(--gb-color-ink-soft)" }
      : profileTier === "verified"
      ? { background: "rgba(45,106,79,0.1)", border: "1px solid rgba(45,106,79,0.25)", color: "var(--gb-color-accent)" }
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
            color: "#9CA3AF",
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
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#22C55E",
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
            background: "#1F2937",
            border: "1px solid #374151",
            color: "#9CA3AF",
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

export default function SearchResultCard({ restaurant, items, item, query, queryMeta, matchContext, geo, activeRefinement, resultView, hiddenMatchCount = 0 }) {
  const location = useLocation();
  const { language, t } = useLanguage();
  const contextSearch = location.search || "";
  const labels = {
    nutrition: t("common.nutrition", "Nutrition"),
    showSimilar: t("common.showSimilar", "Show Similar"),
    noSimilar: t("common.noSimilarNearby", SEARCH_CARD_NO_SIMILAR_TEXT),
    viewMenu: t("common.viewMenu"),
  };
  const grouped = Array.isArray(items) && items.length > 0;
  const similarRequest = useMemo(() => {
    const filters = buildSearchCardSimilarFilters(contextSearch);
    const routeParams = new URLSearchParams(contextSearch || "");
    const browseCity = filters.city || routeParams.get("city") || geo?.city || null;
    const browseState = filters.state || routeParams.get("state") || geo?.state || null;
    return {
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      city: browseCity,
      state: browseState,
      filters,
      cacheKey: JSON.stringify({
        query: query || "",
        search: contextSearch,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        city: browseCity,
        state: browseState,
        filters,
      }),
    };
  }, [contextSearch, geo?.lat, geo?.lng, geo?.city, geo?.state, query]);

  if (grouped) {
    const restId = asStr(restaurant?.restaurant_id || restaurant?.id);
    const restSlug = asStr(restaurant?.restaurant_slug || restaurant?.slug);
    const restName =
      getLocalizedField(restaurant, "restaurant_name", language) ||
      getLocalizedField(restaurant, "name", language) ||
      asStr(restaurant?.restaurant_name || restaurant?.name) ||
      getRestName(items[0], language);

    const restCity = asStr(restaurant?.city || restaurant?.restaurant_city);
    const restState = asStr(restaurant?.state || restaurant?.restaurant_state);

    const restaurantSummary = {
      id: restId,
      slug: restSlug,
      name: restName,
      restaurant_name: restName,
      cuisine: restaurant?.cuisine ?? null,
      restaurant_cuisine: restaurant?.cuisine ?? null,
      distance_miles: restaurant?.distance_miles ?? null,
    };

    const restProfileTarget = restSlug || restId;
    const restHrefHeader = restaurantPath({ slug: restSlug, city: restCity, state: restState }) ||
      (restProfileTarget ? "/restaurants/" + restProfileTarget : null);
    const venueFactsLine = buildKeyFactsLine({
      row: items[0],
      restaurantSummary,
      matchContext,
      omitPrice: true,
    });

    return (
      <article className="gb-card" style={cardStyle}>
        <div
          style={{
            paddingBottom: 12,
            marginBottom: 4,
            borderBottom: "1px solid #1F2937",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
          {restHrefHeader ? (
            <Link
              to={restHrefHeader}
              style={{
                fontSize: "var(--text-2, 14px)",
                fontWeight: 800,
                color: "#22C55E",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#16A34A";
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#22C55E";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {restName}
            </Link>
          ) : (
            <span style={{ fontSize: "var(--text-2, 14px)", fontWeight: 800, color: "#22C55E" }}>{restName}</span>
          )}
          {venueFactsLine ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#9CA3AF",
                lineHeight: 1.45,
                overflowWrap: "anywhere",
              }}
            >
              {venueFactsLine}
            </div>
          ) : null}
            </div>
            {restId ? (
              <FollowRestaurantButton
                restaurantId={restId}
                restaurantName={restName}
                source="search_results"
                dark
                size={28}
              />
            ) : null}
          </div>
          <SearchBillboardBanner
            billboard={restaurant?.raw?.primary_billboard}
            restaurantId={restId}
            restaurantName={restName}
          />
        </div>

        <div>
          {items.map((row) => {
            const mid = getItemId(row);
            const nm = getItemName(row, language);
            return (
              <ItemRow
                key={mid || nm}
                row={row}
                query={query}
                queryMeta={queryMeta}
                matchContext={matchContext}
                labels={labels}
                language={language}
                geo={geo}
                similarRequest={similarRequest}
                restaurantSummary={restaurantSummary}
                venueRenderedAbove
                activeRefinement={activeRefinement}
              />
            );
          })}
        </div>

        {hiddenMatchCount > 0 ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#9CA3AF",
            }}
          >
            +{hiddenMatchCount} more matching items
          </div>
        ) : null}
      </article>
    );
  }

  const isItemRow =
    resultView !== "restaurant" && Boolean(item?.menu_item_id || item?.menu_item_name);
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
  const restProfileTargetS = restSlugS || restIdS;
  const restHrefS = restaurantPath({ slug: restSlugS, city: cityS, state: stateS }) ||
    (restProfileTargetS ? "/restaurants/" + restProfileTargetS : null);
  const menuHrefS = restIdS
    ? (restaurantMenuPath({ slug: restSlugS, city: cityS, state: stateS, id: restIdS }) || buildCanonicalMenuPath({ restaurantSlug: restSlugS, restaurantId: restIdS })) + contextSearch
    : null;

  if (isItemRow) {
    return (
      <article className="gb-card" style={cardStyle}>
        <ItemRow
          row={item}
          query={query}
          queryMeta={queryMeta}
          matchContext={matchContext}
          labels={labels}
          language={language}
          geo={geo}
          similarRequest={similarRequest}
          restaurantSummary={null}
          activeRefinement={activeRefinement}
        />
      </article>
    );
  }

  const cityStateLine = [cityS, stateS ? (postalS ? `${stateS} ${postalS}` : stateS) : postalS]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = buildGoogleMapsUrl(item);
  const addressDisplay = [addressLine1S, cityStateLine].filter(Boolean).join(", ");
  const isRestaurantBrowse = resultView === "restaurant";

  return (
    <article className="gb-card" style={cardStyle}>
      {/* Restaurant name + like */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.01em", color: "#22C55E", minWidth: 0, flex: 1 }}>
        {restHrefS ? (
          <Link
            to={restHrefS}
            style={{ color: "#22C55E", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#16A34A"; e.currentTarget.style.textUnderlineOffset = "3px"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#22C55E"; }}
          >
            {hl(restNameS, query)}
          </Link>
        ) : (
          hl(restNameS, query)
        )}
        </div>
        {restIdS ? (
          <FollowRestaurantButton
            restaurantId={restIdS}
            restaurantName={restNameS}
            source="search_results"
            dark
            size={32}
          />
        ) : null}
      </div>

      {!isRestaurantBrowse && cuisineS && (
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>
          {cuisineS}
        </div>
      )}

      {addressDisplay && (
        mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${restNameS || "restaurant"} in Google Maps`}
            title="Open in Google Maps"
            style={{
              display: isRestaurantBrowse ? "inline-flex" : "block",
              alignItems: isRestaurantBrowse ? "flex-start" : undefined,
              gap: isRestaurantBrowse ? 5 : undefined,
              marginTop: 6,
              fontSize: 14,
              fontWeight: 500,
              color: "#9CA3AF",
              lineHeight: 1.5,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#22C55E";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9CA3AF";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {isRestaurantBrowse && (
              <span style={{ flexShrink: 0, fontSize: 13, lineHeight: 1.5 }} aria-hidden="true">
                📍
              </span>
            )}
            <span style={isRestaurantBrowse ? { display: "flex", flexDirection: "column", gap: 1 } : undefined}>
              {addressLine1S && <div>{addressLine1S}</div>}
              {cityStateLine && <div>{cityStateLine}</div>}
            </span>
          </a>
        ) : (
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 500, color: "#9CA3AF", lineHeight: 1.5 }}>
            {addressLine1S && <div>{addressLine1S}</div>}
            {cityStateLine && <div>{cityStateLine}</div>}
          </div>
        )
      )}

      {distanceMilesS !== null && (
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 500, color: "#9CA3AF" }}>
          {distanceMilesS.toFixed(1)} mi
          {isRestaurantBrowse && matchContext?.coordinateSearchActive
            ? " from your location"
            : " away"}
        </div>
      )}

      {phoneS && (
        <div style={{ marginTop: 4 }}>
          <a
            href={`tel:${phoneS.replace(/[^\d+]/g, "")}`}
            style={{ fontSize: 14, fontWeight: 600, color: "#E5E7EB", textDecoration: "none" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#22C55E";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#E5E7EB";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {phoneS}
          </a>
        </div>
      )}

      <SearchBillboardBanner
        billboard={item?.primary_billboard}
        restaurantId={restIdS}
        restaurantName={restNameS}
      />

      {!isRestaurantBrowse && menuHrefS && (
        <div style={{ marginTop: 12 }}>
          <Link
            to={menuHrefS}
            style={{ fontSize: 15, fontWeight: 800, color: "#22C55E", textDecoration: "none" }}
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
