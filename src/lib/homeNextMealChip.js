/**
 * Time-aware meal chip for home "I have an idea" row.
 * Uses browser local time (market timezone can be layered later via location).
 */
const MEAL_WINDOWS = [
  { start: 5, end: 10, id: "breakfast", icon: "🍳", label: "Breakfast", query: "breakfast" },
  { start: 10, end: 12, id: "brunch", icon: "🥞", label: "Brunch", query: "brunch" },
  { start: 12, end: 17, id: "lunch", icon: "🥪", label: "Lunch", query: "lunch" },
  { start: 17, end: 22, id: "dinner", icon: "🍽️", label: "Dinner", query: "dinner" },
  { start: 22, end: 4, id: "late-night", icon: "🌙", label: "Late Night", query: "late night food" },
];

function hourInWindow(hour, start, end) {
  if (start <= end) return hour >= start && hour <= end;
  return hour >= start || hour <= end;
}

export function getTimeAwareMealChip(date = new Date()) {
  const hour = date.getHours();
  for (const window of MEAL_WINDOWS) {
    if (hourInWindow(hour, window.start, window.end)) {
      return { ...window };
    }
  }
  return { ...MEAL_WINDOWS[0] };
}
