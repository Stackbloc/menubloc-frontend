/** Meal slots for What I'm Eating / What I Ate Today — not Waiter, not nutrition. */

/** User-facing meal periods (unified meal recording — includes snack/other). */
export const WHAT_I_ATE_MEAL_PERIODS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "brunch", label: "Brunch" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late Night" },
  { id: "snack", label: "Snack" },
  { id: "other", label: "Other" },
];

/** Old diary values → canonical ids. */
const LEGACY_ALIASES = {
  dessert: "other",
};

const ORDER = WHAT_I_ATE_MEAL_PERIODS.map((p) => p.id);

/**
 * Local hour when an empty meal row becomes available on today's board.
 * Aligns with defaultWhatIAteMealPeriod windows.
 */
export const WHAT_I_ATE_MEAL_PERIOD_START_HOUR = {
  breakfast: 5,
  brunch: 10,
  lunch: 11,
  dinner: 17,
  late_night: 22,
  snack: 15,
  other: 12,
};

export function normalizeWhatIAteMealPeriod(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  if (ORDER.includes(key)) return key;
  return LEGACY_ALIASES[key] || null;
}

export function mealPeriodLabel(id) {
  const canonical = normalizeWhatIAteMealPeriod(id) || id;
  return WHAT_I_ATE_MEAL_PERIODS.find((p) => p.id === canonical)?.label || "Meal";
}

export function compareMealPeriod(a, b) {
  const ai = ORDER.indexOf(normalizeWhatIAteMealPeriod(a) || a);
  const bi = ORDER.indexOf(normalizeWhatIAteMealPeriod(b) || b);
  if (ai === -1 && bi === -1) return 0;
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

/** Local device hour → default meal slot when posting. */
export function defaultWhatIAteMealPeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 17) return "lunch";
  if (hour >= 17 && hour < 22) return "dinner";
  return "late_night";
}

/**
 * Which meal rows to show on the day board.
 * Presentation-only: only periods that already have entries (no empty camera slots).
 * empty days show copy, not camera slots — at the section level.
 */
export function visibleWhatIAteMealPeriods({
  filledPeriodIds = [],
} = {}) {
  const filled = new Set(
    (filledPeriodIds || []).map(normalizeWhatIAteMealPeriod).filter(Boolean)
  );
  return WHAT_I_ATE_MEAL_PERIODS.filter((p) => filled.has(p.id));
}

export function groupEntriesByMealPeriod(entries) {
  const buckets = Object.fromEntries(ORDER.map((id) => [id, []]));
  const unclassified = [];
  for (const entry of entries || []) {
    const slot = normalizeWhatIAteMealPeriod(entry?.meal_period);
    if (slot) buckets[slot].push(entry);
    else unclassified.push(entry);
  }
  return { buckets, other: unclassified };
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
