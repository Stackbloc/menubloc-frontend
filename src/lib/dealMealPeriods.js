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

export function dealHasMedia(deal) {
  return Boolean(
    String(deal?.video_url || "").trim() ||
      String(deal?.photo_url || "").trim() ||
      String(deal?.audio_url || "").trim()
  );
}
