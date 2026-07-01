/**
 * Time-aware meal chip for home "I have an idea" row.
 * Mirrors backend homeContextIntent windows (temporary patch).
 */
import { getZonedParts } from "./timeZoneUtils.js";

const CHIP_BY_CONTEXT = {
  breakfast: { id: "breakfast", mealPeriod: "breakfast", icon: "🍳", label: "Breakfast", query: "breakfast" },
  brunch: { id: "brunch", mealPeriod: "brunch", icon: "🥞", label: "Brunch", query: "brunch" },
  lunch: { id: "lunch", mealPeriod: "lunch", icon: "🥪", label: "Lunch", query: "lunch" },
  afternoon_snack: { id: "afternoon-snack", mealPeriod: "afternoon_snack", icon: "☕", label: "Snacks", query: "snack" },
  dinner: { id: "dinner", mealPeriod: "dinner", icon: "🍽️", label: "Dinner", query: "dinner" },
  late_night: { id: "late-night", mealPeriod: "late_night", icon: "🌙", label: "Late Night", query: "late night" },
};

function resolveHomeContextIntent(date = new Date(), timezone) {
  const { totalMinutes, isWeekend } = getZonedParts(date, timezone);

  if (totalMinutes >= 21 * 60 || totalMinutes < 5 * 60) return "late_night";
  if (totalMinutes >= 17 * 60 && totalMinutes < 21 * 60) return "dinner";
  if (totalMinutes >= 14 * 60 && totalMinutes < 17 * 60) return "afternoon_snack";
  if (isWeekend && totalMinutes >= 10 * 60 && totalMinutes < 14 * 60) return "brunch";
  if (!isWeekend && totalMinutes >= 10 * 60 + 30 && totalMinutes < 14 * 60) return "lunch";
  if (isWeekend && totalMinutes >= 5 * 60 && totalMinutes < 10 * 60) return "breakfast";
  if (!isWeekend && totalMinutes >= 5 * 60 && totalMinutes < 10 * 60 + 30) return "breakfast";
  return "late_night";
}

export function getTimeAwareMealChip(date = new Date(), timezone) {
  const context = resolveHomeContextIntent(date, timezone);
  return { ...(CHIP_BY_CONTEXT[context] || CHIP_BY_CONTEXT.lunch) };
}
