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

/* ---- MetricGrid (used in colors/menu mode) ---- */

function MetricGrid({ rows, colors }) {
  const clean = rows.filter(Boolean);
  if (!clean.length) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
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

/* ---- Row layout (used in list/search mode) ---- */

function NutritionRow({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "2px 0",
        fontSize: "var(--text-2, 14px)",
        color: "var(--ink, #0f1720)",
        lineHeight: 1.5,
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{value}</span>
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
            <MetricGrid rows={metricRows} colors={C} />
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

  return (
    <div>
      {hasValues ? (
        <>
          {cal !== null && (
            <>
              <NutritionRow label="Calories" value={String(Math.round(cal))} />
              {(calPctW !== null || calPctM !== null) && (
                <div style={subStyle}>
                  {calPctW !== null ? `${Math.round(calPctW)}% Daily (W)` : ""}
                  {calPctW !== null && calPctM !== null ? " · " : ""}
                  {calPctM !== null ? `${Math.round(calPctM)}% (M)` : ""}
                </div>
              )}
            </>
          )}
          {pro !== null && (
            <NutritionRow
              label="Protein"
              value={`${Math.round(pro)}g${proPct !== null ? ` (${Math.round(proPct)}%)` : ""}`}
            />
          )}
          {carbs !== null && <NutritionRow label="Carbs"  value={`${Math.round(carbs)}g`} />}
          {fib   !== null && <NutritionRow label="Fiber"  value={`${Math.round(fib)}g`}   />}
          {sug   !== null && <NutritionRow label="Sugar"  value={`${Math.round(sug)}g`}   />}
          {fat   !== null && <NutritionRow label="Fat"    value={`${Math.round(fat)}g`}   />}
          {sod   !== null && <NutritionRow label="Sodium" value={`${Math.round(sod)}mg`}  />}
          {satiety !== null && (
            <NutritionRow
              label="Satiety"
              value={`${satiety}/10${satietyLabel ? ` · ${satietyLabel}` : ""}`}
            />
          )}
          {glycemic !== null && (
            <NutritionRow
              label="Glycemic"
              value={`${glycemic}/10${glycemicLabel ? ` · ${glycemicLabel}` : ""}`}
            />
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
