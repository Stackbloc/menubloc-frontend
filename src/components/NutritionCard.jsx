/**
 * ============================================================
 * File: NutritionCard.jsx
 * Path: menubloc-frontend/src/components/NutritionCard.jsx
 * Date: 2026-03-14
 * Purpose:
 *   Reusable nutrition card (values + disclosure).
 *   Used by SearchResultCard (search results) and
 *   MenuItemInsightsPanel (menu view / item detail page).
 *
 *   Props:
 *     chip    — the nutrition_chip object from chips.nutrition_chip
 *               May be null/undefined; component handles gracefully.
 *     colors  — optional color scheme object (dark/menu style).
 *               When omitted, falls back to CSS variables (light/search style).
 *
 *   Rendering:
 *     With colors   → full bordered card with "NUTRITION" section title,
 *                     MetricGrid tiles, disclosure.
 *     Without colors → bare inline list (fits inside SearchResultCard's
 *                     DetailPanel which provides the border-top wrap).
 *
 *   Content order (both modes):
 *     1. Calories (+ daily value %)
 *     2. Protein / Fat
 *     3. Sodium / Sugar
 *     4. Disclosure / source line
 *
 *   Fallback states:
 *     - No nutrition values → "Nutrition info unavailable for this item yet."
 *
 *   No fake data. No placeholders. All values come from chip prop.
 * ============================================================
 */

import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

/* ---- Helpers ---- */

function asN(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ---- CSS variable color scheme (search results / light mode) ---- */

const CSS_COLORS = {
  text:    "var(--ink, #0f1720)",
  subtext: "var(--muted, #5b6675)",
  muted2:  "var(--muted-2, #93a0b2)",
  border:  "var(--border, #e4e9f0)",
  panel2:  "var(--surface-1, #f4f7fb)",
  chipBg:  "var(--surface-2, #f8fafc)",
};

/* ---- Oval metric pills (menu, search, detail) ---- */

function nutritionPillStyle(colors, light = false) {
  if (light) {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 26,
      padding: "0 10px",
      borderRadius: 999,
      border: "1px solid var(--border, #e4e9f0)",
      background: "var(--surface-2, #f8fafc)",
      fontSize: 12,
      lineHeight: 1.2,
      color: "var(--ink, #0f1720)",
      whiteSpace: "nowrap",
    };
  }
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 26,
    padding: "0 10px",
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: colors.chipBg,
    fontSize: 12,
    lineHeight: 1.2,
    color: colors.text,
    whiteSpace: "nowrap",
  };
}

function NutritionMetricPill({ label, value, colors, light = false, subtextStyle }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <span style={nutritionPillStyle(colors, light)}>
      <span style={{ fontWeight: 500, color: light ? "var(--muted, #5b6675)" : (subtextStyle || colors.subtext) }}>
        {label}
      </span>
      <span style={{ fontWeight: 800 }}>{value}</span>
    </span>
  );
}

function MetricPillGrid({ rows, colors, light = false }) {
  const clean = rows.filter(Boolean);
  if (!clean.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {clean.map((row) => (
        <NutritionMetricPill
          key={row.label}
          label={row.label}
          value={row.value}
          colors={colors}
          light={light}
        />
      ))}
    </div>
  );
}

/* ---- Main export ---- */

export default function NutritionCard({ chip, colors }) {
  const { t } = useLanguage();
  const C = colors || CSS_COLORS;
  const hasColors = Boolean(colors);

  // Extract nutrition values
  const cal    = asN(chip?.calories_kcal);
  const pro    = asN(chip?.protein_g);
  const carbs  = asN(chip?.carbs_g);
  const fib    = asN(chip?.fiber_g);
  const fat    = asN(chip?.fat_g);
  const sod    = asN(chip?.sodium_mg);
  const sug    = asN(chip?.sugar_g);
  const calPctW = asN(chip?.calories_pct_women);
  const calPctM = asN(chip?.calories_pct_men);
  const proPct  = asN(chip?.protein_pct_daily);
  const satiety = asN(chip?.satiety_score);
  const satietyLabel = chip?.satiety_label || null;
  const glycemic = asN(chip?.glycemic_score);
  const glycemicLabel = chip?.glycemic_label || null;

  // Extract disclosure (allergen_alert no longer surfaced as a card banner)
  const disclosure    = String(chip?.disclosure || "").trim();

  const hasValues    = cal !== null || pro !== null || carbs !== null || fib !== null || fat !== null || sod !== null || sug !== null;

  /* ------------------------------------------------------------------ */
  /* Mode A: full card with colors prop (menu view / item detail)        */
  /* ------------------------------------------------------------------ */
  if (hasColors) {
    const metricRows = [
      cal  !== null ? { label: "Calories", value: String(Math.round(cal)) }              : null,
      pro  !== null ? { label: "Protein",  value: `${Math.round(pro)}g` }                : null,
      carbs !== null ? { label: "Carbs",   value: `${Math.round(carbs)}g` }             : null,
      fib  !== null ? { label: "Fiber",    value: `${Math.round(fib)}g` }               : null,
      sug  !== null ? { label: "Sugar",    value: `${Math.round(sug)}g` }               : null,
      fat  !== null ? { label: "Fat",      value: `${Math.round(fat)}g` }               : null,
      sod  !== null ? { label: "Sodium",   value: `${Math.round(sod)}mg` }              : null,
      satiety  !== null ? { label: "Satiety",  value: `${satiety}/10${satietyLabel ? ` · ${satietyLabel}` : ""}` }  : null,
      glycemic !== null ? { label: "Glycemic", value: `${glycemic}/10${glycemicLabel ? ` · ${glycemicLabel}` : ""}` } : null,
    ].filter(Boolean);

    return (
      <div
        style={{
          background: C.panel2,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "10px 12px",
        }}
      >
        {/* Section title */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: C.subtext,
            marginBottom: 10,
          }}
        >
          Nutrition
        </div>

        {hasValues ? (
          <>
            <MetricPillGrid rows={metricRows} colors={C} />
            {(calPctW !== null || calPctM !== null) && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11.5,
                  color: C.subtext,
                  lineHeight: 1.5,
                }}
              >
                {calPctW !== null
                  ? `Approx. ${Math.round(calPctW)}% of a 2,000 cal diet. `
                  : ""}
                {calPctM !== null
                  ? `Approx. ${Math.round(calPctM)}% of a 2,500 cal diet.`
                  : ""}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: C.subtext, lineHeight: 1.5 }}>
            Nutrition info unavailable for this item yet.
          </div>
        )}

        {disclosure && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: C.subtext,
              lineHeight: 1.45,
              fontStyle: "italic",
            }}
          >
            {disclosure}
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Mode B: bare list layout (search results / no colors)              */
  /* ------------------------------------------------------------------ */
  const muted = { color: "var(--muted-2, #93a0b2)" };
  const subStyle = {
    fontSize: "var(--text-1, 12px)",
    color: "var(--muted-2, #93a0b2)",
    marginBottom: 4,
  };

  const listRows = [
    cal !== null ? { label: "Calories", value: String(Math.round(cal)) } : null,
    pro !== null ? { label: "Protein", value: `${Math.round(pro)}g${proPct !== null ? ` (${Math.round(proPct)}%)` : ""}` } : null,
    carbs !== null ? { label: "Carbs", value: `${Math.round(carbs)}g` } : null,
    fib !== null ? { label: "Fiber", value: `${Math.round(fib)}g` } : null,
    sug !== null ? { label: "Sugar", value: `${Math.round(sug)}g` } : null,
    fat !== null ? { label: "Fat", value: `${Math.round(fat)}g` } : null,
    sod !== null ? { label: "Sodium", value: `${Math.round(sod)}mg` } : null,
    satiety !== null ? { label: "Satiety", value: `${satiety}/10${satietyLabel ? ` · ${satietyLabel}` : ""}` } : null,
    glycemic !== null ? { label: "Glycemic", value: `${glycemic}/10${glycemicLabel ? ` · ${glycemicLabel}` : ""}` } : null,
  ].filter(Boolean);

  return (
    <div>
      {hasValues ? (
        <>
          <MetricPillGrid rows={listRows} colors={C} light={true} />
          {(calPctW !== null || calPctM !== null) && (
            <div style={{ ...subStyle, marginTop: 8 }}>
              {calPctW !== null ? `${Math.round(calPctW)}% Daily (W)` : ""}
              {calPctW !== null && calPctM !== null ? " · " : ""}
              {calPctM !== null ? `${Math.round(calPctM)}% (M)` : ""}
            </div>
          )}
        </>
      ) : (
        <span style={muted}>
          Nutrition info unavailable for this item yet.
        </span>
      )}

      {disclosure && (
        <div
          style={{
            marginTop: hasValues ? 8 : 4,
            fontSize: "var(--text-1, 12px)",
            color: "var(--muted-2, #93a0b2)",
            lineHeight: 1.45,
            fontStyle: "italic",
          }}
        >
          {disclosure}
        </div>
      )}
    </div>
  );
}
