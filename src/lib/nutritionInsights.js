/**
 * ============================================================
 * File: nutritionInsights.js
 * Path: menubloc-frontend/src/lib/nutritionInsights.js
 * Date: 2026-03-18
 * Purpose:
 *   Rule-based nutrition insight helpers for the search results card.
 *   No external dependencies. No AI.
 *
 *   Exports:
 *     toNum(v)                          → number | null
 *     getQualitativeLabel(metric, v)    → "Low" / "Moderate" / "High" / etc.
 *     getNutritionSummary(chip)         → one-line summary sentence | null
 *     computeInsights(chip)             → { proteinStrength, glycemicImpact,
 *                                          sodiumRisk, lastingEnergy } (0–10)
 * ============================================================
 */

export function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function cap(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Qualitative labels ────────────────────────────────────────────────────────

export function getQualitativeLabel(metric, value) {
  const v = toNum(value);
  if (v === null) return null;

  switch (metric) {
    case "calories":
      if (v >= 700) return "Heavy";
      if (v >= 400) return "Moderate";
      return "Light";
    case "protein":
      if (v >= 30) return "High";
      if (v >= 15) return "Moderate";
      return "Low";
    case "carbs":
      if (v >= 60) return "High";
      if (v >= 30) return "Moderate";
      return "Low";
    case "fat":
      if (v >= 30) return "High";
      if (v >= 15) return "Moderate";
      return "Low";
    case "sodium":
      if (v >= 900) return "High";
      if (v >= 500) return "Moderate";
      return "Low";
    case "sugar":
      if (v >= 20) return "High";
      if (v >= 10) return "Moderate";
      return "Low";
    case "fiber":
      if (v >= 8) return "High";
      if (v >= 3) return "Moderate";
      return "Low";
    default:
      return null;
  }
}

// ── Summary sentence ──────────────────────────────────────────────────────────

export function getNutritionSummary(chip) {
  const pro   = toNum(chip?.protein_g);
  const carbs = toNum(chip?.carbs_g);
  const fat   = toNum(chip?.fat_g);
  const sod   = toNum(chip?.sodium_mg);
  const cal   = toNum(chip?.calories_kcal);
  const sug   = toNum(chip?.sugar_g);
  const fiber = toNum(chip?.fiber_g);

  const main  = [];
  const notes = [];

  // Protein character
  if (pro !== null) {
    if (pro >= 30) main.push("high protein");
    else if (pro >= 15) main.push("moderate protein");
    else main.push("low protein");
  }

  // Energy character
  if (carbs !== null) {
    if (carbs >= 60 && sug !== null && sug >= 20) {
      main.push("quick energy");
    } else if (carbs >= 60) {
      main.push("high carb");
    } else if (fiber !== null && fiber >= 5) {
      main.push("steady energy");
    }
  } else if (cal !== null && fat !== null && cal >= 650 && fat >= 25) {
    main.push("indulgent");
  }

  // Sodium note
  if (sod !== null) {
    if (sod >= 1000) notes.push("high sodium");
    else if (sod >= 600) notes.push("moderate sodium");
    else if (sod > 0 && sod < 300) notes.push("low sodium");
  }

  const mainStr = main.slice(0, 2).join(", ");
  const noteStr = notes.join(", ");

  if (!mainStr && !noteStr) return null;
  if (mainStr && noteStr) return `${cap(mainStr)} — ${noteStr}`;
  if (mainStr) return cap(mainStr);
  return cap(noteStr);
}

// ── Insight scores (0–10) ─────────────────────────────────────────────────────

export function computeInsights(chip) {
  const pro   = toNum(chip?.protein_g);
  const carbs = toNum(chip?.carbs_g);
  const fat   = toNum(chip?.fat_g);
  const fiber = toNum(chip?.fiber_g);
  const sod   = toNum(chip?.sodium_mg);
  const sug   = toNum(chip?.sugar_g);

  // Protein Strength (0–10, higher = better)
  let proteinStrength = null;
  if (pro !== null) {
    if (pro >= 30) proteinStrength = clamp(8 + (pro - 30) / 15, 1, 10);
    else if (pro >= 15) proteinStrength = clamp(5 + (pro - 15) / 5, 1, 10);
    else proteinStrength = clamp(pro / 4, 1, 10);
  }

  // Glycemic Impact (0–10, higher = worse)
  let glycemicImpact = null;
  if (carbs !== null) {
    const net = fiber !== null ? Math.max(0, carbs - fiber * 0.5) : carbs;
    let g = (net / 60) * 8;
    if (sug !== null) g += (sug / 40) * 2;
    glycemicImpact = clamp(g, 1, 10);
  } else if (sug !== null) {
    glycemicImpact = clamp((sug / 30) * 7, 1, 10);
  }

  // Sodium Risk (0–10, higher = worse)
  let sodiumRisk = null;
  if (sod !== null) {
    if (sod >= 900) sodiumRisk = clamp(8 + (sod - 900) / 550, 1, 10);
    else if (sod >= 500) sodiumRisk = clamp(5 + (sod - 500) / 133, 1, 10);
    else sodiumRisk = clamp((sod / 500) * 4, 1, 10);
  }

  // Lasting Energy (0–10, higher = better)
  let lastingEnergy = null;
  if (pro !== null || fat !== null || fiber !== null || sug !== null) {
    let e = 5;
    if (pro   !== null) e += Math.min(3,   pro   / 10);
    if (fat   !== null) e += Math.min(1.5, fat   / 20);
    if (fiber !== null) e += Math.min(1.5, fiber / 3);
    if (sug   !== null) e -= Math.min(3,   sug   / 10);
    lastingEnergy = clamp(e, 1, 10);
  }

  return { proteinStrength, glycemicImpact, sodiumRisk, lastingEnergy };
}
