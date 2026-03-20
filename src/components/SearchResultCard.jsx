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
 *   - Footer CTA: "View Menu" → /public/restaurants/:id/menu
 *
 *   2026-03-10 update:
 *   - Public restaurant profile links now prefer /restaurants/:slugOrId
 *   - Menu links remain /public/restaurants/:id/menu
 *
 *   2026-03-14 update:
 *   - Nutrition chip expanded to use NutritionCard component.
 *   - hasNut check includes allergen presence so chip lights up
 *     when allergens are inferred even without calorie data.
 * ============================================================
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import InsightCardDeck, { buildInsightCards } from "./InsightCardDeck.jsx";
import {
  toNum,
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
function getRestName(row) {
  return asStr(pick(row, ["restaurant_name", "restaurantName", "name", "title"], "Restaurant"));
}
function getItemName(row) {
  return asStr(pick(row, ["menu_item_name", "menuItemName", "item_name", "dish", "name"], "Menu item"));
}

function getRestaurantProfileTarget(x) {
  const slug = asStr(pick(x, ["restaurant_slug", "restaurantSlug", "slug"]));
  if (slug) return slug;
  return asStr(pick(x, ["restaurant_id", "restaurantId", "id"]));
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
  const cal   = r(chip?.calories_kcal);
  const pro   = r(chip?.protein_g);
  const carbs = r(chip?.carbs_g);
  const fiber = r(chip?.fiber_g);
  const sug   = r(chip?.sugar_g);
  const fat   = r(chip?.fat_g);
  const sod   = r(chip?.sodium_mg);

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
      {fiber !== null && <BarRow label="Fiber"    pct={(fiber / 28)   * 100} valueLabel={`${fiber}g`}  qualLabel={getQualitativeLabel("fiber", fiber)}  color="#6b7280" indent />}
      {sug   !== null && <BarRow label="Sugar"    pct={(sug   / 50)   * 100} valueLabel={`${sug}g`}    qualLabel={getQualitativeLabel("sugar", sug)}    color="#8b5cf6" indent />}
      {fat   !== null && <BarRow label="Fat"      pct={(fat   / 65)   * 100} valueLabel={`${fat}g`}    qualLabel={getQualitativeLabel("fat", fat)}      color="#b87a00" />}
      {sod   !== null && <BarRow label="Sodium"   pct={(sod   / 2300) * 100} valueLabel={`${sod}mg`}   qualLabel={getQualitativeLabel("sodium", sod)}   color="#c0392b" />}

      {chip?.allergen_alert && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#b36000", fontWeight: 600 }}>
          ⚠ {chip.allergen_alert}
        </div>
      )}
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
  { backendKey: "protein_strength", clientKey: "proteinStrength", label: "High Protein",       accent: "#1a9a4a", positive: true  },
  { backendKey: "protein_quality",  clientKey: null,               label: "Protein Quality",    accent: "#1d6fc2", positive: true  },
  { backendKey: "glycemic_impact",  clientKey: "glycemicImpact",  label: "Blood Sugar Impact",  accent: "#c0392b", positive: false },
  { backendKey: "sodium_risk",      clientKey: "sodiumRisk",       label: "Sodium Load",         accent: "#e07b39", positive: false },
  { backendKey: "lasting_energy",   clientKey: "lastingEnergy",    label: "Lasting Energy",      accent: "#3b82f6", positive: true  },
];

function positiveLevel(s) {
  if (s >= 8) return "Excellent";
  if (s >= 6) return "Good";
  if (s >= 4) return "Moderate";
  return "Low";
}
function cautionLevel(s) {
  if (s >= 8) return "Very High";
  if (s >= 6) return "High";
  if (s >= 4) return "Moderate";
  return "Low";
}

function InsightsPanel({ chips, onFindSimilar }) {
  const nutChip      = chips?.nutrition_chip || {};
  const backendScores = chips?.insights?.scores;
  const clientScores  = computeInsights(nutChip);

  const rows = INSIGHT_DEFS.map(({ backendKey, clientKey, label, accent, positive }) => {
    // Prefer backend score (includes prep-aware explanation)
    const bs = backendScores?.[backendKey];
    if (bs && bs.score !== null && Number.isFinite(bs.score)) {
      return { label, accent, score: bs.score, level: bs.level, explanation: bs.explanation || null };
    }
    // Client fallback — no explanation available
    const cs = clientScores[clientKey];
    if (cs === null || cs === undefined) return null;
    const level = positive ? positiveLevel(cs) : cautionLevel(cs);
    return { label, accent, score: Math.round(cs), level, explanation: null };
  }).filter(Boolean);

  if (!rows.length) {
    return <div style={{ fontSize: 14, color: "#9ca3af" }}>Not enough data to compute insights.</div>;
  }

  return (
    <div>
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

/* ---- Detail panel content ---- */

function DetailPanel({ tab, row, similarItems, onFindSimilar }) {
  const chips = resolveChips(row);
  const nutChip = chips?.nutrition_chip || {};

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
          <span style={muted}>No similar items found nearby.</span>
        )}
      </div>
    );
  }

  return null;
}

/* ---- Single item row ---- */

function ItemRow({ row, query, similarItems }) {
  const [openTab, setOpenTab] = useState(null);

  const mid = getItemId(row);
  const name = getItemName(row);
  const href = mid ? "/menu-items/" + mid : null;
  const price = fmtPrice(row);
  const popular = getPopular(row);
  const hasDeal = asBool(resolveItemFlag(row, "has_active_deal"));
  const isVegan = asBool(resolveItemFlag(row, "is_vegan"));
  const isGF = asBool(resolveItemFlag(row, "is_gluten_free"));

  const chips = resolveChips(row);
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

      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Chip
          label="Nutrition"
          active={openTab === "nutrition"}
          available={hasNut}
          onClick={() => toggle("nutrition")}
        />
        {hasIns && (
          <Chip
            label="Insights"
            active={openTab === "insights"}
            available={true}
            onClick={() => toggle("insights")}
          />
        )}
        {hasSimilar && (
          <Chip
            label="Show Similar"
            active={openTab === "similar"}
            available={true}
            onClick={() => toggle("similar")}
          />
        )}
      </div>

      {openTab && <DetailPanel tab={openTab} row={row} similarItems={similarItems} onFindSimilar={() => toggle("similar")} />}
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
  border: "1px solid rgba(18,34,28,0.08)",
  borderRadius: 24,
  background: "#fff",
  padding: "12px 14px",
  boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

function RestaurantMeta({ cuisine, phone, distanceMiles, profileTier }) {
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

export default function SearchResultCard({ restaurant, items, item, query, crossRestaurantItems }) {
  const grouped = Array.isArray(items) && items.length > 0;

  if (grouped) {
    const restId = asStr(restaurant?.restaurant_id || restaurant?.id);
    const restSlug = asStr(restaurant?.restaurant_slug || restaurant?.slug);
    const restName =
      asStr(restaurant?.restaurant_name || restaurant?.name) || getRestName(items[0]);
    const cuisine = getCuisineLike(restaurant) || getCuisineLike(items[0]);
    const phone = getPhoneLike(restaurant) || getPhoneLike(items[0]);
    const distanceMiles = getDistanceMilesLike(restaurant) ?? getDistanceMilesLike(items[0]);
    const profileTier = getProfileTierLike(restaurant) || getProfileTierLike(items[0]);

    const restProfileTarget = restSlug || restId;
    const restHref = restProfileTarget ? "/restaurants/" + restProfileTarget : null;
    const menuHref = restId ? "/public/restaurants/" + restId + "/menu" : null;

    const similarItems = Array.isArray(crossRestaurantItems)
      ? crossRestaurantItems.filter((x) => asStr(x.restaurant_id) !== restId)
      : [];

    return (
      <article style={cardStyle}>
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
        />

        <div>
          {items.map((row) => {
            const mid = getItemId(row);
            const nm = getItemName(row);
            return <ItemRow key={mid || nm} row={row} query={query} similarItems={similarItems} />;
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
              View Menu →
            </Link>
          </div>
        )}
      </article>
    );
  }

  const isItemRow = Boolean(item?.menu_item_id || item?.menu_item_name);
  const restIdS = getRestId(item);
  const restSlugS = getRestSlug(item);
  const restNameS = getRestName(item);
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
  const menuHrefS = restIdS ? "/public/restaurants/" + restIdS + "/menu" : null;
  const similarItemsS = Array.isArray(crossRestaurantItems)
    ? crossRestaurantItems.filter((x) => asStr(x.restaurant_id) !== restIdS)
    : [];

  if (isItemRow) {
    return (
      <article style={cardStyle}>
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
        <ItemRow row={item} query={query} similarItems={similarItemsS} />
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
              View Menu →
            </Link>
          </div>
        )}
      </article>
    );
  }

  const cityStateLine = [cityS, stateS ? (postalS ? `${stateS} ${postalS}` : stateS) : postalS]
    .filter(Boolean)
    .join(", ");
  const addressLine = [addressLine1S, cityStateLine].filter(Boolean).join(", ");
  const detailPieces = [
    distanceMilesS !== null ? `${distanceMilesS.toFixed(1)} mi away` : null,
    phoneS || null,
  ].filter(Boolean);

  return (
    <article style={cardStyle}>
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
            View Menu →
          </Link>
        </div>
      )}
    </article>
  );
}
