/**
 * Time-aware meal chip for home "I have an idea" row.
 * Uses browser local time (market timezone can be layered later via location).
 */
const MEAL_WINDOWS = [
  { start: 5, end: 10, id: "breakfast", icon: "🍳", label: "Breakfast", query: "breakfast" },
  { start: 11, end: 11, id: "brunch", icon: "🥞", label: "Brunch", query: "brunch" },
  { start: 12, end: 16, id: "lunch", icon: "🥪", label: "Lunch", query: "lunch" },
  { start: 17, end: 21, id: "dinner", icon: "🍽️", label: "Dinner", query: "dinner" },
  { start: 22, end: 4, id: "late-night", icon: "🌙", label: "Late Night", query: "late night food" },
];

export function getTimeAwareMealChip(date = new Date()) {
  const hour = date.getHours();
  for (const window of MEAL_WINDOWS) {
    if (window.start <= window.end) {
      if (hour >= window.start && hour <= window.end) return { ...window };
    } else if (hour >= window.start || hour <= window.end) {
      return { ...window };
    }
  }
  return { ...MEAL_WINDOWS[0] };
}
