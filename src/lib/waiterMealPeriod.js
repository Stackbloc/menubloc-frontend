import { getZonedParts } from "./timeZoneUtils.js";

/** Waiter meal chips — breakfast, lunch, dinner, late night only (no brunch). */
export const WAITER_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
];

const WAITER_MEAL_PERIOD_FALLBACKS = {
  breakfast: {
    title: "Looking for breakfast?",
    paragraphs: [
      "Waiter looks for morning-friendly menu items in the real menu data currently available in your market.",
      "You can also search Menuply for breakfast favorites while local coverage continues to grow.",
    ],
  },
  lunch: {
    title: "Looking for lunch?",
    paragraphs: ["Waiter looks for lunch-friendly menu items in the real menu data currently available in your market."],
  },
  dinner: {
    title: "Looking for dinner?",
    paragraphs: ["Waiter looks for dinner-friendly menu items in the real menu data currently available in your market."],
  },
  late_night: {
    title: "Looking for a late-night bite?",
    paragraphs: ["Waiter looks for late-night-friendly menu items in the real menu data currently available in your market."],
  },
};

/** Old URL/query values → canonical Waiter period. */
const LEGACY_ALIASES = {
  brunch: "lunch",
};

export function getMealPeriodFallback(mealPeriod) {
  const key = normalizeMealPeriodId(mealPeriod) || "lunch";
  return WAITER_MEAL_PERIOD_FALLBACKS[key] || WAITER_MEAL_PERIOD_FALLBACKS.lunch;
}

/** Map URL/chip ids to a valid Waiter meal period, or null. */
export function normalizeMealPeriodId(value) {
  const key = String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");
  if (WAITER_MEAL_PERIODS.some((period) => period.id === key)) return key;
  return LEGACY_ALIASES[key] || null;
}

/**
 * `timezone` should be the IANA zone of the market being viewed (e.g. the
 * restaurant's own local time), not the viewer's device timezone — a user
 * checking a Dothan, AL restaurant from a Pacific-time device must still see
 * Dothan's actual local meal period. Falls back to the device's own detected
 * timezone when no market timezone is available.
 */
export function getDefaultMealPeriod(date = new Date(), timezone) {
  const { hour } = getZonedParts(date, timezone);
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 17) return "lunch";
  if (hour >= 17 && hour < 22) return "dinner";
  return "late_night";
}

export function getWaiterGreeting(date = new Date(), timezone) {
  const { hour } = getZonedParts(date, timezone);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
