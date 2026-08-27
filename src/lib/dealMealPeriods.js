/**
 * Deal meal periods for Feed Deals Live — not Waiter.
 * Aligns with eating clock via whatIAteTodayMealPeriod defaults.
 */

import { defaultWhatIAteMealPeriod } from "./whatIAteTodayMealPeriod.js";

export const DEAL_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
];

const ORDER = DEAL_MEAL_PERIODS.map((p) => p.id);

export function normalizeDealMealPeriod(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  if (ORDER.includes(key)) return key;
  if (key === "brunch" || key === "snack") return "lunch";
  if (key === "dessert") return "dinner";
  return null;
}

/** Map device clock → deal meal chip default. */
export function defaultDealMealPeriod(date = new Date()) {
  const eating = defaultWhatIAteMealPeriod(date);
  return normalizeDealMealPeriod(eating) || "lunch";
}

export function dealMealPeriodLabel(id) {
  return DEAL_MEAL_PERIODS.find((p) => p.id === id)?.label || String(id || "");
}

/** Unique valid ids in canonical order; empty input → []. */
export function normalizeDealMealPeriodList(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const id = normalizeDealMealPeriod(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return ORDER.filter((id) => seen.has(id));
}

/** Human labels for overlay / list; empty selection on deal = all-day. */
export function formatDealMealPeriodLabels(mealPeriods) {
  const ids = normalizeDealMealPeriodList(mealPeriods);
  if (!ids.length) return ["All day"];
  return ids.map(dealMealPeriodLabel);
}

export function dealMealPeriodSummary(mealPeriods) {
  return formatDealMealPeriodLabels(mealPeriods).join(" · ");
}

/** Feed swipe headline when operator enables meal-time caption, e.g. "Lunch Deal". */
export function formatMealTimeDealCaption(mealPeriods) {
  const ids = normalizeDealMealPeriodList(mealPeriods);
  if (!ids.length) return null;
  const labels = ids.map(dealMealPeriodLabel);
  if (labels.length === 1) return `${labels[0]} Deal`;
  if (labels.length === 2) return `${labels[0]} & ${labels[1]} Deal`;
  const last = labels[labels.length - 1];
  const rest = labels.slice(0, -1);
  return `${rest.join(", ")} & ${last} Deal`;
}

export function dealHasMedia(deal) {
  return Boolean(
    String(deal?.video_url || "").trim() ||
      String(deal?.photo_url || "").trim() ||
      String(deal?.audio_url || "").trim()
  );
}
