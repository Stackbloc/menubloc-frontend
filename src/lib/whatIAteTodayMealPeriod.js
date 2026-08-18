/** Meal slots for the What I Ate Today food diary — not Waiter, not nutrition. */

export const WHAT_I_ATE_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "brunch", label: "Brunch" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
];

const ORDER = WHAT_I_ATE_MEAL_PERIODS.map((p) => p.id);

export function normalizeWhatIAteMealPeriod(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  return ORDER.includes(key) ? key : null;
}

export function mealPeriodLabel(id) {
  return WHAT_I_ATE_MEAL_PERIODS.find((p) => p.id === id)?.label || "Other";
}

export function compareMealPeriod(a, b) {
  const ai = ORDER.indexOf(a);
  const bi = ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return 0;
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

/** Local device hour → default meal slot when posting. */
export function defaultWhatIAteMealPeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 17) return "brunch";
  if (hour >= 17 && hour < 22) return "dinner";
  return "late_night";
}

export function groupEntriesByMealPeriod(entries) {
  const buckets = Object.fromEntries(ORDER.map((id) => [id, []]));
  const other = [];
  for (const entry of entries || []) {
    const slot = normalizeWhatIAteMealPeriod(entry?.meal_period);
    if (slot) buckets[slot].push(entry);
    else other.push(entry);
  }
  return { buckets, other };
}

/** Latest diary row for a meal chip, or null when that slot is empty. */
export function pickEntryForMeal(entries, mealPeriod) {
  const slot = normalizeWhatIAteMealPeriod(mealPeriod);
  if (!slot) return null;
  const matches = (entries || []).filter(
    (entry) => normalizeWhatIAteMealPeriod(entry?.meal_period) === slot
  );
  return matches.length ? matches[matches.length - 1] : null;
}
